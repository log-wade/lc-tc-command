import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/supabase/server";
import { integrationStatus } from "@/lib/integrations/registry";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: isDatabaseConfigured() ? "configured" : "memory_demo",
    auth: process.env.AUTH_DISABLED === "true" ? "disabled" : "enabled",
    integrations: integrationStatus(),
  });
}
