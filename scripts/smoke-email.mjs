import { Resend } from "resend";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !(m[1] in process.env)) {
    process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Do Kind <onboarding@resend.dev>";
const to = process.argv[2] ?? process.env.ALERT_EMAIL;

if (!apiKey) {
  console.error("RESEND_API_KEY not set");
  process.exit(1);
}
if (!to) {
  console.error("Usage: node scripts/smoke-email.mjs <recipient@example.com>");
  process.exit(1);
}

const resend = new Resend(apiKey);
const { data, error } = await resend.emails.send({
  from,
  to: [to],
  subject: "LC/TC send smoke test",
  text: `Live send test from ${from} at ${new Date().toISOString()}`,
});

console.log(JSON.stringify({ from, to, data, error }, null, 2));
process.exit(error ? 2 : 0);
