import { createHash, randomBytes } from "crypto";
import { createServiceClient } from "../supabase/server";
import { DEFAULT_ORG_ID } from "../supabase/server-auth";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): string {
  return `lctc_${randomBytes(24).toString("hex")}`;
}

export async function validateApiKey(
  key: string
): Promise<{ organizationId: string; scopes: string[] } | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const keyHash = hashApiKey(key);
  const { data } = await supabase
    .from("api_keys")
    .select("organization_id, scopes, revoked_at")
    .eq("key_hash", keyHash)
    .single();

  if (!data || data.revoked_at) return null;

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", keyHash);

  return {
    organizationId: data.organization_id ?? DEFAULT_ORG_ID,
    scopes: data.scopes ?? ["read"],
  };
}
