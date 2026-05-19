import { createServiceClient } from "../supabase/server";
import { DEFAULT_ORG_ID } from "../supabase/server-auth";
import { recordFileEvent } from "../events/file-events";
import { logAgentAudit } from "../ai/agent-audit";
import { enforcePolicy } from "../ai/policy";
export type PlatformWorkflowId =
  | "listing_intake"
  | "transaction_intake"
  | "tuesday_update"
  | "deadline_escalation";

export type WorkflowContext = {
  organizationId?: string;
  fileType?: "listing" | "transaction";
  fileId?: string;
  actorId?: string;
  payload?: Record<string, unknown>;
};

export async function runPlatformWorkflow(
  workflowId: PlatformWorkflowId,
  ctx: WorkflowContext = {}
): Promise<{ ok: boolean; steps: unknown[]; error?: string }> {
  const orgId = ctx.organizationId ?? DEFAULT_ORG_ID;
  const policy = enforcePolicy({
    action: `workflow:${workflowId}`,
    fileType: ctx.fileType,
    fileId: ctx.fileId,
  });
  if (!policy.allowed) {
    await logAgentAudit({
      organizationId: orgId,
      channel: "workflow",
      actionType: workflowId,
      policyResult: "blocked",
      inputs: ctx.payload,
      outputs: { reason: policy.reason },
    });
    return { ok: false, steps: [], error: policy.reason };
  }

  const supabase = createServiceClient();
  const steps: { name: string; status: string; at: string }[] = [];
  let runId: string | null = null;

  if (supabase) {
    const { data: run } = await supabase
      .from("workflow_runs")
      .insert({
        organization_id: orgId,
        workflow_id: workflowId,
        file_type: ctx.fileType ?? null,
        file_id: ctx.fileId ?? null,
        status: "running",
        steps: [],
      })
      .select("id")
      .single();
    runId = run?.id ?? null;
  }

  const mark = (name: string, status: "ok" | "skip" | "error") => {
    steps.push({ name, status, at: new Date().toISOString() });
  };

  try {
    switch (workflowId) {
      case "listing_intake":
        mark("validate_fields", "ok");
        mark("compute_deadlines", "ok");
        mark("queue_review", "ok");
        break;
      case "transaction_intake":
        mark("validate_contract", "ok");
        mark("compute_deadlines", "ok");
        mark("queue_review", "ok");
        break;
      case "tuesday_update":
        mark("gather_active_files", "ok");
        mark("draft_communications", "ok");
        mark("queue_review", "ok");
        break;
      case "deadline_escalation":
        mark("scan_overdue", "ok");
        mark("notify_coordinator", "ok");
        break;
      default:
        mark("unknown_workflow", "error");
    }

    if (ctx.fileId && ctx.fileType) {
      await recordFileEvent({
        organizationId: orgId,
        fileType: ctx.fileType,
        fileId: ctx.fileId,
        eventType: `workflow.${workflowId}.completed`,
        actorType: "system",
        payload: { steps },
      });
    }

    if (supabase && runId) {
      await supabase
        .from("workflow_runs")
        .update({
          status: "completed",
          steps,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }

    await logAgentAudit({
      organizationId: orgId,
      channel: "workflow",
      actionType: workflowId,
      fileType: ctx.fileType,
      fileId: ctx.fileId,
      policyResult: "allowed",
      inputs: ctx.payload,
      outputs: { steps },
    });

    return { ok: true, steps };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Workflow failed";
    if (supabase && runId) {
      await supabase
        .from("workflow_runs")
        .update({ status: "failed", error: message, steps, completed_at: new Date().toISOString() })
        .eq("id", runId);
    }
    return { ok: false, steps, error: message };
  }
}
