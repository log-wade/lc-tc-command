import { NextResponse } from "next/server";
import { approveGoLive } from "@/lib/data";
import { getSessionProfile, resolveAgentId } from "@/lib/supabase/server-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const profile = await getSessionProfile();
  const agentId = resolveAgentId(
    (body.agent_id as string | undefined) ?? profile?.agentId ?? undefined
  );

  try {
    const result = await approveGoLive(id, agentId);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Go-live approval failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
