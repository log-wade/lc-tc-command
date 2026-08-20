import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { ProblemReportMessage, ProblemReportPlan } from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

const analysisSchema = z.object({
  resultType: z.enum(["question", "plan"]),
  reply: z.string().min(1),
  plan: z
    .object({
      title: z.string().min(1),
      summary: z.string().min(1),
      steps: z.array(z.string().min(1)).min(1).max(8),
      filesLikely: z.array(z.string().min(1)).max(12),
      riskLevel: z.enum(["low", "medium", "high"]),
      riskNotes: z.string(),
      implementationPrompt: z.string().min(1),
    })
    .nullable(),
});

const ANALYSIS_TOOL = {
  name: "return_problem_analysis",
  description:
    "Return either one focused follow-up question or a complete, approval-ready fix plan.",
  input_schema: {
    type: "object" as const,
    properties: {
      resultType: { type: "string", enum: ["question", "plan"] },
      reply: { type: "string" },
      plan: {
        anyOf: [
          { type: "null" },
          {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              steps: {
                type: "array",
                items: { type: "string" },
                minItems: 1,
                maxItems: 8,
              },
              filesLikely: {
                type: "array",
                items: { type: "string" },
                maxItems: 12,
              },
              riskLevel: { type: "string", enum: ["low", "medium", "high"] },
              riskNotes: { type: "string" },
              implementationPrompt: { type: "string" },
            },
            required: [
              "title",
              "summary",
              "steps",
              "filesLikely",
              "riskLevel",
              "riskNotes",
              "implementationPrompt",
            ],
            additionalProperties: false,
          },
        ],
      },
    },
    required: ["resultType", "reply", "plan"],
    additionalProperties: false,
  },
};

const PROBLEM_ANALYST_SYSTEM_PROMPT = `You are the incident analyst for the Do Kind LC/TC Command web application.

Your job is to understand a bug, error, or usability issue and interact with the authenticated owner until you can propose a concrete fix plan. You are planning changes to the repository https://github.com/log-wade/lc-tc-command, a Next.js 16 / React 19 / TypeScript application deployed on Vercel with Supabase.

Rules:
- If essential reproduction details are missing, ask exactly one focused question and return resultType "question" with plan null.
- If there is enough information, return resultType "plan" and an approval-ready plan.
- Be honest: this is an analysis based on the report, not a claim that you inspected runtime logs or source code.
- Keep the user-facing reply concise and explain the likely cause, fix, and risk.
- filesLikely may name likely paths or areas, but do not invent exact files when the report does not support them.
- implementationPrompt must tell a coding agent to inspect the repository, reproduce or verify the issue, implement the smallest safe fix, preserve unrelated work, run targeted tests plus lint/type/build checks as appropriate, and open a PR.
- Mark changes to authentication, authorization, secrets, environment variables, database migrations, deletion, billing, or production infrastructure as high risk and say why.
- Never include secret values, credentials, or instructions to weaken authentication.
- Never execute or claim to execute a change. Implementation requires a separate explicit approval.`;

export async function analyzeProblem(input: {
  messages: ProblemReportMessage[];
  pageUrl: string;
}): Promise<{ reply: string; plan: ProblemReportPlan | null }> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Problem analysis is not configured.");
  }

  const client = new Anthropic({ apiKey });
  const conversation = input.messages
    .filter((message) => message.role !== "system")
    .map((message, index) => {
      const routeContext =
        index === 0 && message.role === "user"
          ? `Reported route (untrusted context only): ${JSON.stringify(input.pageUrl)}\n\n`
          : "";
      return {
        role: message.role === "user" ? ("user" as const) : ("assistant" as const),
        content: `${routeContext}${message.content}`,
      };
    });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
    max_tokens: 2500,
    system: PROBLEM_ANALYST_SYSTEM_PROMPT,
    messages: conversation,
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: "tool", name: ANALYSIS_TOOL.name },
  });
  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("The problem analyst did not return a structured response.");
  }

  const result = analysisSchema.parse(toolUse.input);
  if (result.resultType === "plan" && !result.plan) {
    throw new Error("The problem analyst returned an incomplete fix plan.");
  }
  if (result.resultType === "question" && result.plan) {
    throw new Error("The problem analyst returned an invalid follow-up response.");
  }

  return {
    reply: result.reply,
    plan: result.plan,
  };
}
