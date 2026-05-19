import { NextResponse } from "next/server";
import { runAgentChat, type ChatMessage } from "@/lib/ai/orchestrator";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const body = await request.json();
  const messages = (body.messages ?? []) as ChatMessage[];

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const { reply, toolCalls } = await runAgentChat(messages);

  await logAudit({
    actor_type: "ai_agent",
    action_type: "assistant_chat",
    inputs: { message_count: messages.length },
    outputs: { tool_calls: toolCalls.length },
    outcome: "success",
  });

  return NextResponse.json({ reply, toolCalls });
}
