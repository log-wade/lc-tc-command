import { createServiceClient, isDatabaseConfigured } from "./supabase/server";
import { memoryStore } from "./store/memory-store";

export interface AuditEntry {
  actor_type: "system" | "human" | "ai_agent";
  actor_id?: string;
  file_type?: string;
  file_id?: string;
  action_type: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  references?: Record<string, unknown>;
  outcome?: "success" | "failure" | "escalated" | "pending";
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  if (isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      await supabase.from("audit_logs").insert(entry);
      return;
    }
  }
  memoryStore.logAudit(entry as unknown as Record<string, unknown>);
}
