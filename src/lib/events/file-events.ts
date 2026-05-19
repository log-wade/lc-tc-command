import { createServiceClient } from "../supabase/server";
import { DEFAULT_ORG_ID } from "../supabase/server-auth";

export type FileEventInput = {
  organizationId?: string;
  fileType: "listing" | "transaction";
  fileId: string;
  eventType: string;
  actorType: "system" | "human" | "ai_agent" | "integration";
  actorId?: string;
  payload?: Record<string, unknown>;
};

export async function recordFileEvent(input: FileEventInput): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await supabase.from("file_events").insert({
    organization_id: input.organizationId ?? DEFAULT_ORG_ID,
    file_type: input.fileType,
    file_id: input.fileId,
    event_type: input.eventType,
    actor_type: input.actorType,
    actor_id: input.actorId ?? null,
    payload: input.payload ?? {},
  });
}
