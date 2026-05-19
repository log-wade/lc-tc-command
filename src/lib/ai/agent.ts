import Anthropic from "@anthropic-ai/sdk";
import { fillTemplate, SIGNATURE_BLOCK } from "../templates/signature";

const SYSTEM_PROMPT = `You are the AI specialist for a Texas residential real estate Listing & Transaction Coordination system operating under Keller Williams Realty Austin Northwest. You operate under the supervision of licensed Texas Salesperson Carly Bryant (TREC #723235-SA) and a sponsoring broker.

You handle: inbox triage (P0-P3), response drafting from approved templates, summarization, and compliance pre-flight.

You NEVER: send messages, change MLS/status, sign documents, draft contract language, give legal/tax/financial advice, or speculate on price/loan approval.

Tone: warm, plain, Texas-professional. Short sentences. Lead with the ask. No corporate filler ("circle back", "per my last email").

Always cite file_id and template_id when relevant.`;

export interface EmailClassification {
  priority: "P0" | "P1" | "P2" | "P3";
  suggested_action: string;
  suggested_template?: string;
  file_id_hint?: string;
  wire_fraud_signal: boolean;
}

export async function classifyInboundEmail(payload: {
  from: string;
  subject: string;
  body: string;
}): Promise<EmailClassification> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const wireKeywords = /wire|routing|account number|changed instructions|updated wiring/i;
  const wireSignal =
    wireKeywords.test(payload.subject) || wireKeywords.test(payload.body);

  if (wireSignal) {
    return {
      priority: "P0",
      suggested_action: "WIRE FRAUD PROTOCOL: Do not action. Call title closer on file using verified number. Loop broker immediately.",
      wire_fraud_signal: true,
    };
  }

  if (!apiKey) {
    const deadlineKeywords = /option|deadline|closing disclosure|CD|earnest|title commitment/i;
    const isP1 =
      deadlineKeywords.test(payload.subject) || deadlineKeywords.test(payload.body);
    return {
      priority: isP1 ? "P1" : "P2",
      suggested_action: isP1
        ? "Review within 1 hour — deadline-touching"
        : "Queue draft response for licensee review",
      wire_fraud_signal: false,
    };
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Classify this inbound email. Return JSON only: {"priority":"P0|P1|P2|P3","suggested_action":"...","suggested_template":"tpl-N or null","wire_fraud_signal":boolean}

From: ${payload.from}
Subject: ${payload.subject}
Body: ${payload.body.slice(0, 2000)}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";
  try {
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    return {
      priority: parsed.priority ?? "P2",
      suggested_action: parsed.suggested_action ?? "Review and respond",
      suggested_template: parsed.suggested_template,
      file_id_hint: parsed.file_id_hint,
      wire_fraud_signal: Boolean(parsed.wire_fraud_signal),
    };
  } catch {
    return {
      priority: "P2",
      suggested_action: "AI parse failed — manual triage required",
      wire_fraud_signal: false,
    };
  }
}

export async function draftClientResponse(params: {
  templateBody: string;
  context: Record<string, string>;
}): Promise<string> {
  const filled = fillTemplate(params.templateBody, params.context);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return filled;

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Polish this draft for send (do not change facts or add legal advice). Keep Carly's voice. Template-filled draft:\n\n${filled}`,
      },
    ],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : filled;
}

export async function summarizeFeedback(feedbackItems: string[]): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY || feedbackItems.length === 0) {
    return feedbackItems.map((f, i) => `  • Theme ${i + 1}: ${f.slice(0, 120)}`).join("\n");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Summarize these showing feedback transcripts into 3-5 bullet themes for a weekly seller update. Plain language, no speculation:\n\n${feedbackItems.join("\n---\n")}`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export { SIGNATURE_BLOCK };
