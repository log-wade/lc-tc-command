import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "./server";

export async function createUserClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component — middleware refreshes session
        }
      },
    },
  });
}

export type SessionProfile = {
  id: string;
  email: string;
  organizationId: string;
  role: string;
  fullName: string | null;
  agentId: string | null;
};

export const DEFAULT_ORG_ID = "a0000000-0000-4000-8000-000000000001";

export async function getSessionProfile(): Promise<SessionProfile | null> {
  if (process.env.AUTH_DISABLED === "true") {
    return {
      id: "dev-user",
      email: "dev@lc-tc.local",
      organizationId: DEFAULT_ORG_ID,
      role: "admin",
      fullName: "Dev User",
      agentId: null,
    };
  }

  const supabase = await createUserClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role, full_name, agent_id, email")
    .eq("id", user.id)
    .single();

  if (profile) {
    return {
      id: user.id,
      email: profile.email ?? user.email ?? "",
      organizationId: profile.organization_id,
      role: profile.role,
      fullName: profile.full_name,
      agentId: profile.agent_id,
    };
  }

  return {
    id: user.id,
    email: user.email ?? "",
    organizationId: DEFAULT_ORG_ID,
    role: "coordinator",
    fullName: null,
    agentId: null,
  };
}

/** Service client for system jobs; user client when RLS needed */
export async function getDataClient() {
  const profile = await getSessionProfile();
  if (profile && process.env.AUTH_DISABLED !== "true") {
    const userClient = await createUserClient();
    if (userClient) return { client: userClient, profile };
  }
  return { client: createServiceClient(), profile };
}
