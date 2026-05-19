import Anthropic from "@anthropic-ai/sdk";
import { COORDINATOR_SYSTEM_PROMPT } from "./system-prompt";
import { runFallbackChat } from "./fallback-chat";
import {
  ANTHROPIC_TOOL_DEFINITIONS,
  executeAgentTool,
  type AgentToolName,
} from "./tools";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

/** Anthropic requires the first message to be from the user. */
function normalizeForAnthropic(messages: ChatMessage[]): Anthropic.MessageParam[] {
  const trimmed = messages.filter((m) => m.content.trim());
  let start = 0;
  while (start < trimmed.length && trimmed[start].role === "assistant") {
    start++;
  }
  const slice = trimmed.slice(start);
  if (slice.length === 0) {
    return [{ role: "user", content: "Hello" }];
  }
  return slice.map((m) => ({ role: m.role, content: m.content }));
}

export async function runAgentChat(
  messages: ChatMessage[],
  options?: { maxToolRounds?: number }
): Promise<{ reply: string; toolCalls: Array<{ name: string; result: unknown }> }> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const toolCalls: Array<{ name: string; result: unknown }> = [];

  if (!apiKey) {
    return {
      reply: await runFallbackChat(messages),
      toolCalls,
    };
  }

  const client = new Anthropic({ apiKey });
  const maxRounds = options?.maxToolRounds ?? 6;
  const anthropicMessages = normalizeForAnthropic(messages);
  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;

  try {
    let rounds = 0;
    while (rounds < maxRounds) {
      rounds++;
      const response = await client.messages.create({
        model,
        max_tokens: 2048,
        system: COORDINATOR_SYSTEM_PROMPT,
        tools: ANTHROPIC_TOOL_DEFINITIONS,
        messages: anthropicMessages,
      });

      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      const textBlocks = response.content.filter((b) => b.type === "text");

      if (toolUseBlocks.length === 0) {
        const text = textBlocks.map((b) => (b.type === "text" ? b.text : "")).join("\n");
        return { reply: text || "Done.", toolCalls };
      }

      anthropicMessages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        if (block.type !== "tool_use") continue;
        const name = block.name as AgentToolName;
        const result = await executeAgentTool(name, (block.input as Record<string, unknown>) ?? {});
        toolCalls.push({ name, result });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      anthropicMessages.push({ role: "user", content: toolResults });
    }

    return {
      reply: "I ran several lookups — ask me to summarize a specific area (deadlines, reviews, or files).",
      toolCalls,
    };
  } catch {
    return {
      reply: await runFallbackChat(messages),
      toolCalls,
    };
  }
}
