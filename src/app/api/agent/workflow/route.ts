import { NextResponse } from "next/server";
import { runWorkflow, type WorkflowId } from "@/lib/ai/workflows";

const VALID: WorkflowId[] = ["morning_briefing", "tuesday_prep", "intake_triage"];

export async function POST(request: Request) {
  const body = await request.json();
  const workflowId = body.workflow_id as WorkflowId;

  if (!VALID.includes(workflowId)) {
    return NextResponse.json(
      { error: `workflow_id must be one of: ${VALID.join(", ")}` },
      { status: 400 }
    );
  }

  const result = await runWorkflow(workflowId);
  return NextResponse.json(result);
}
