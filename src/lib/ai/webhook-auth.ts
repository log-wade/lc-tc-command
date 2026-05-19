export function verifyAgentWebhook(request: Request): boolean {
  const secret = process.env.AGENT_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("x-agent-secret");
  return header === secret;
}
