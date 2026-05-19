import { NextResponse } from "next/server";
import { executeAgentTool, AGENT_TOOL_NAMES, type AgentToolName } from "@/lib/ai/tools";
import { verifyAgentWebhook } from "@/lib/ai/webhook-auth";
import { logAudit } from "@/lib/audit";

type RouteContext = { params: Promise<{ name: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!verifyAgentWebhook(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await context.params;
  if (!AGENT_TOOL_NAMES.includes(name as AgentToolName)) {
    return NextResponse.json({ error: `Unknown tool: ${name}` }, { status: 404 });
  }

  const args = await request.json().catch(() => ({}));

  try {
    const result = await executeAgentTool(name as AgentToolName, args as Record<string, unknown>);

    await logAudit({
      actor_type: "ai_agent",
      action_type: `tool_${name}`,
      inputs: args as Record<string, unknown>,
      outcome: "success",
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
