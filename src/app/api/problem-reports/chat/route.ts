import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { analyzeProblem } from "@/lib/problem-reports/analyst";
import {
  createProblemReport,
  getProblemReport,
  transitionProblemReport,
} from "@/lib/problem-reports/repository";
import type {
  ProblemReport,
  ProblemReportMessage,
  ProblemReportStatus,
} from "@/lib/problem-reports/types";
import { getSessionProfile } from "@/lib/supabase/server-auth";

const requestSchema = z.object({
  reportId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(10_000),
  pageUrl: z.string().trim().min(1).max(2_048),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const lockedStatuses: ProblemReportStatus[] = [
  "analyzing",
  "approved",
  "implementing",
  "pr_open",
  "merged",
  "deployed",
];

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let claimedReport: ProblemReport | null = null;
  try {
    const body = requestSchema.parse(await request.json());
    let report = body.reportId
      ? await getProblemReport(body.reportId, profile.organizationId)
      : null;

    if (body.reportId && !report) {
      return NextResponse.json({ error: "Problem report not found." }, { status: 404 });
    }
    if (!report) {
      report = await createProblemReport({
        profile,
        pageUrl: body.pageUrl,
        metadata: body.metadata,
      });
    }
    if (lockedStatuses.includes(report.status)) {
      return NextResponse.json(
        { error: "This problem report is already being processed." },
        { status: 409 }
      );
    }

    const userMessage: ProblemReportMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: body.message,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...report.messages, userMessage];
    claimedReport = await transitionProblemReport(
      report.id,
      profile.organizationId,
      { status: report.status, planVersion: report.planVersion },
      {
        status: "analyzing",
        plan: null,
        cursorAgentId: null,
        cursorRunId: null,
        prUrl: null,
        approvedAt: null,
        approvedBy: null,
        nextRetryAt: null,
        error: null,
      }
    );
    if (!claimedReport) {
      return NextResponse.json(
        { error: "The report changed while your message was being submitted. Please try again." },
        { status: 409 }
      );
    }

    const analysis = await analyzeProblem({
      messages: nextMessages,
      pageUrl: report.pageUrl,
    });
    const assistantMessage: ProblemReportMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: analysis.reply,
      createdAt: new Date().toISOString(),
    };
    const nextPlanVersion = analysis.plan ? report.planVersion + 1 : report.planVersion;
    const updatedReport = await transitionProblemReport(
      report.id,
      profile.organizationId,
      { status: "analyzing", planVersion: report.planVersion },
      {
        status: analysis.plan ? "plan_ready" : "open",
        messages: [...nextMessages, assistantMessage],
        plan: analysis.plan,
        planVersion: nextPlanVersion,
        error: null,
      }
    );
    if (!updatedReport) {
      return NextResponse.json(
        { error: "The report changed before the analysis could be saved. Please try again." },
        { status: 409 }
      );
    }

    try {
      await logAudit({
        actor_type: "ai_agent",
        actor_id: profile.id,
        action_type: analysis.plan ? "problem_report_plan_created" : "problem_report_analyzed",
        inputs: {
          report_id: report.id,
          page_url: report.pageUrl,
          message_count: nextMessages.length,
        },
        outputs: {
          plan_ready: Boolean(analysis.plan),
          risk_level: analysis.plan?.riskLevel,
          plan_version: nextPlanVersion,
        },
        outcome: "success",
      });
    } catch {
      // Audit failure must not discard a completed analysis.
    }

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    if (claimedReport) {
      try {
        await transitionProblemReport(
          claimedReport.id,
          profile.organizationId,
          { status: "analyzing", planVersion: claimedReport.planVersion },
          {
            status: "open",
            error: error instanceof Error ? error.message : "Problem analysis failed.",
          }
        );
      } catch {
        // Preserve the original analysis error.
      }
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "The report message is invalid." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Problem analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
