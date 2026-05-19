/**
 * Provisions ElevenLabs ConvAI agent with webhook tools for LC/TC Command.
 * Usage: ELEVENLABS_API_KEY=... AGENT_WEBHOOK_SECRET=... node scripts/setup-elevenlabs-agent.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const apiKey = process.env.ELEVENLABS_API_KEY;
const baseUrl =
  process.env.AGENT_WEBHOOK_BASE_URL ?? "https://lc-tc-platform.vercel.app";
const webhookSecret =
  process.env.AGENT_WEBHOOK_SECRET ?? randomBytes(24).toString("hex");

if (!apiKey) {
  console.error("Set ELEVENLABS_API_KEY");
  process.exit(1);
}

const prompt = readFileSync(
  join(ROOT, "elevenlabs/lc-tc-system-prompt.txt"),
  "utf8"
);

const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

function str(description) {
  return { type: "string", description };
}

function webhookTool(name, description, properties = {}, required = []) {
  return {
    type: "webhook",
    name,
    description,
    response_timeout_secs: 30,
    api_schema: {
      url: `${baseUrl}/api/agent/tools/${name}`,
      method: "POST",
      request_headers: {
        "x-agent-secret": webhookSecret,
        "Content-Type": "application/json",
      },
      request_body_schema: {
        type: "object",
        properties,
        required,
      },
    },
  };
}

const tools = [
  webhookTool(
    "get_dashboard_summary",
    "Get Today dashboard stats: overdue, due today, pending reviews, active files."
  ),
  webhookTool(
    "list_active_files",
    "List active listings and transactions.",
    { limit: str("Max items per type") }
  ),
  webhookTool(
    "list_upcoming_deadlines",
    "List pending deadlines.",
    {
      limit: str("Max items"),
      overdue_only: { type: "boolean", description: "Only overdue" },
    }
  ),
  webhookTool(
    "list_pending_reviews",
    "Items waiting for human approval.",
    { limit: str("Max items") }
  ),
  webhookTool(
    "get_email_template",
    "Get template by id e.g. tpl-1",
    { template_id: str("Template id") },
    ["template_id"]
  ),
  webhookTool("list_email_templates", "List all broker-approved email templates."),
  webhookTool(
    "classify_inbound_email",
    "Classify email P0-P3 and wire fraud.",
    {
      from: str("Sender"),
      subject: str("Subject"),
      body: str("Body"),
    },
    ["from", "subject", "body"]
  ),
  webhookTool(
    "run_workflow",
    "Run morning_briefing, tuesday_prep, or intake_triage workflow.",
    { workflow_id: str("Workflow id") },
    ["workflow_id"]
  ),
];

const body = {
  name: process.env.ELEVENLABS_AGENT_NAME ?? "LC/TC Command Assistant",
  conversation_config: {
    tts: { voice_id: voiceId, model_id: "eleven_flash_v2" },
    agent: {
      language: "en",
      first_message:
        process.env.ELEVENLABS_FIRST_MESSAGE ??
        "Hi Carly — I'm your coordination assistant. I can check your queue, deadlines, or run a morning briefing. What do you need?",
      prompt: {
        prompt,
        llm: process.env.ELEVENLABS_LLM ?? "gemini-2.5-flash",
        tools,
      },
    },
  },
};

const res = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
  method: "POST",
  headers: {
    "xi-api-key": apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const text = await res.text();
if (!res.ok) {
  console.error("Create agent failed:", res.status, text);
  process.exit(1);
}

const data = JSON.parse(text);
const agentId = data.agent_id;

console.log("Agent created:", agentId);
console.log("\nAdd to Vercel production:");
console.log("ELEVENLABS_API_KEY=<your-key>");
console.log("NEXT_PUBLIC_ELEVENLABS_AGENT_ID=" + agentId);
console.log("AGENT_WEBHOOK_SECRET=" + webhookSecret);
console.log("AGENT_WEBHOOK_BASE_URL=" + baseUrl);
