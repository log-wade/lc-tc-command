import { NextResponse } from "next/server";
import { approveGoLive } from "@/lib/data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  await approveGoLive(id, body.agent_id ?? "agent-admin");
  return NextResponse.json({ success: true });
}
