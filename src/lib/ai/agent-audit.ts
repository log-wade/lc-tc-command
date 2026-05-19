import { createServiceClient } from "../supabase/server";
import { DEFAULT_ORG_ID } from "../supabase/server-auth";

export type AgentAuditInput = {
  organizationId?: string;
  channel: "chat" | "voice" | "tool" | "workflow";
  actionType: string;
  actorId?: string;
  fileType?: string;
  fileId?: string;
  toolName?: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  policyResult?: "allowed" | "blocked" | "warn";
};

export async function logAgentAudit(input: AgentAuditInput): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await supabase.from("agent_audit_logs").insert({
    organization_id: input.organizationId ?? DEFAULT_ORG_ID,
    channel: input.channel,
    action_type: input.actionType,
    actor_id: input.actorId ?? null,
    file_type: input.fileType ?? null,
    file_id: input.fileId ?? null,
    tool_name: input.toolName ?? null,
    inputs: input.inputs ?? {},
    outputs: input.outputs ?? {},
    policy_result: input.policyResult ?? "allowed",
  });
}
