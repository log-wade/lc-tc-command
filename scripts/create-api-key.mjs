#!/usr/bin/env node
import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

const name = process.argv[2] ?? "Default API key";
const ORG_ID = "a0000000-0000-4000-8000-000000000001";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const rawKey = `lctc_${randomBytes(24).toString("hex")}`;
const keyHash = createHash("sha256").update(rawKey).digest("hex");

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const { error } = await supabase.from("api_keys").insert({
  organization_id: ORG_ID,
  name,
  key_hash: keyHash,
  scopes: ["read", "listings:read", "transactions:read"],
});

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log("API key (store securely, shown once):", rawKey);
