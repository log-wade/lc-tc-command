import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import {
  approveProblemReport,
  getProblemReport,
} from "@/lib/problem-reports/repository";
import { reconcileProblemReport } from "@/lib/problem-reports/reconcile";
import { getSessionProfile } from "@/lib/supabase/server-auth";

const requestSchema = z.object({
  planVersion: z.number().int().positive(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = requestSchema.parse(await request.json());
    const existing = await getProblemReport(id, profile.organizationId);
    if (!existing) {
      return NextResponse.json({ error: "Problem report not found." }, { status: 404 });
    }
    if (["approved", "implementing", "pr_open", "merged", "deployed"].includes(existing.status)) {
      if (existing.planVersion !== body.planVersion) {
        return NextResponse.json(
          { error: "The approved fix is from a different plan version." },
          { status: 409 }
        );
      }
      return NextResponse.json({ report: await reconcileProblemReport(existing) });
    }
    if (existing.status !== "plan_ready" || !existing.plan) {
      return NextResponse.json(
        { error: "This problem report does not have a fix plan ready for approval." },
        { status: 409 }
      );
    }

    const approved = await approveProblemReport(
      id,
      profile.organizationId,
      profile.id,
      body.planVersion
    );
    if (!approved) {
      return NextResponse.json(
        { error: "The fix plan changed before it could be approved. Refresh and try again." },
        { status: 409 }
      );
    }

    try {
      await logAudit({
        actor_type: "human",
        actor_id: profile.id,
        action_type: "problem_report_fix_approved",
        inputs: {
          report_id: id,
          plan_title: approved.plan?.title,
          risk_level: approved.plan?.riskLevel,
          plan_version: approved.planVersion,
        },
        outcome: "pending",
      });
    } catch {
      // Audit failure must not interrupt an explicit approval.
    }

    const report = await reconcileProblemReport(approved);
    return NextResponse.json({ report }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "A valid plan version is required." }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Could not approve the problem report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
