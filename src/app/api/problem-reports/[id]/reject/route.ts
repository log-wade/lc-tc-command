import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import {
  getProblemReport,
  transitionProblemReport,
} from "@/lib/problem-reports/repository";
import type { ProblemReportMessage } from "@/lib/problem-reports/types";
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
    if (existing.status !== "plan_ready") {
      return NextResponse.json(
        { error: "Only a pending fix plan can be rejected." },
        { status: 409 }
      );
    }

    const rejectionMessage: ProblemReportMessage = {
      id: crypto.randomUUID(),
      role: "system",
      content: "The proposed fix was rejected. Add another message if you want a revised plan.",
      createdAt: new Date().toISOString(),
    };
    const report = await transitionProblemReport(
      id,
      profile.organizationId,
      { status: "plan_ready", planVersion: body.planVersion },
      {
        status: "rejected",
        plan: null,
        error: null,
        messages: [...existing.messages, rejectionMessage],
      }
    );
    if (!report) {
      return NextResponse.json(
        { error: "The fix plan changed before it could be rejected. Refresh and try again." },
        { status: 409 }
      );
    }
    try {
      await logAudit({
        actor_type: "human",
        actor_id: profile.id,
        action_type: "problem_report_fix_rejected",
        inputs: { report_id: id },
        outcome: "success",
      });
    } catch {
      // Rejection is already persisted.
    }

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "A valid plan version is required." }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Could not reject the problem report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
