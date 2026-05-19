#!/usr/bin/env node
/**
 * Create an admin user + profile for LC/TC Command.
 * Usage: node scripts/seed-admin-user.mjs email@example.com 'YourPassword'
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
const password = process.argv[3];
const ORG_ID = "a0000000-0000-4000-8000-000000000001";

if (!email || !password) {
  console.error("Usage: node scripts/seed-admin-user.mjs <email> <password>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: userData, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createError) {
  console.error("Auth user:", createError.message);
  process.exit(1);
}

const userId = userData.user.id;
const { error: profileError } = await supabase.from("profiles").upsert({
  id: userId,
  organization_id: ORG_ID,
  email,
  full_name: "Platform Admin",
  role: "admin",
});

if (profileError) {
  console.error("Profile:", profileError.message);
  process.exit(1);
}

console.log("Admin user ready:", email, "id:", userId);
