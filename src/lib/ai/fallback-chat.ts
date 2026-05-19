import { executeAgentTool } from "./tools";
import { runWorkflow } from "./workflows";
import type { ChatMessage } from "./orchestrator";

function lastUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content.toLowerCase();
  }
  return "";
}

function formatWorkflow(result: Awaited<ReturnType<typeof runWorkflow>>): string {
  const actions =
    result.recommended_actions.length > 0
      ? result.recommended_actions.map((a) => `• ${a}`).join("\n")
      : "• No urgent actions flagged.";
  return `${result.summary}\n\nRecommended next steps:\n${actions}`;
}

export async function runFallbackChat(messages: ChatMessage[]): Promise<string> {
  const q = lastUserMessage(messages);

  if (q.includes("morning") || q.includes("briefing")) {
    return formatWorkflow(await runWorkflow("morning_briefing"));
  }
  if (q.includes("tuesday") || q.includes("weekly update")) {
    return formatWorkflow(await runWorkflow("tuesday_prep"));
  }
  if (q.includes("intake") || q.includes("new listing") || q.includes("new contract")) {
    return formatWorkflow(await runWorkflow("intake_triage"));
  }
  if (q.includes("template")) {
    const list = (await executeAgentTool("list_email_templates", {})) as Array<{
      id: string;
      name: string;
    }>;
    return `Broker-approved templates (${list.length}):\n${list.map((t) => `• ${t.id} — ${t.name}`).join("\n")}`;
  }
  if (q.includes("review") || q.includes("queue") || q.includes("approve")) {
    const data = (await executeAgentTool("list_pending_reviews", { limit: 10 })) as {
      reviews: Array<{ priority?: string; title?: string }>;
      count: number;
    };
    if (data.count === 0) return "Review queue is clear — nothing waiting for approval.";
    return `Review queue (${data.count} pending):\n${data.reviews.map((r) => `• [${r.priority ?? "P2"}] ${r.title}`).join("\n")}`;
  }
  if (q.includes("overdue")) {
    const data = (await executeAgentTool("list_upcoming_deadlines", {
      limit: 10,
      overdue_only: true,
    })) as { deadlines: Array<{ label: string; address: string; due_at: string }> };
    if (data.deadlines.length === 0) return "No overdue deadlines — you're caught up on dates.";
    return `Overdue deadlines:\n${data.deadlines.map((d) => `• ${d.label} — ${d.address} (due ${new Date(d.due_at).toLocaleDateString()})`).join("\n")}`;
  }
  if (q.includes("deadline") || q.includes("due")) {
    const data = (await executeAgentTool("list_upcoming_deadlines", { limit: 8 })) as {
      deadlines: Array<{ label: string; address: string; overdue: boolean }>;
    };
    return `Upcoming deadlines:\n${data.deadlines.map((d) => `• ${d.overdue ? "OVERDUE — " : ""}${d.label} — ${d.address}`).join("\n")}`;
  }
  if (q.includes("listing") || q.includes("transaction") || q.includes("file") || q.includes("active")) {
    const data = (await executeAgentTool("list_active_files", { limit: 10 })) as {
      listings: Array<{ address: string; status: string }>;
      transactions: Array<{ address: string; status: string }>;
    };
    const lines = [
      ...data.listings.map((l) => `• Listing: ${l.address} (${l.status})`),
      ...data.transactions.map((t) => `• Transaction: ${t.address} (${t.status})`),
    ];
    return lines.length ? `Active files:\n${lines.join("\n")}` : "No active files in the system.";
  }
  if (q.includes("dashboard") || q.includes("today") || q.includes("summary")) {
    const stats = (await executeAgentTool("get_dashboard_summary", {})) as {
      summary: string;
      overdueDeadlines: number;
      dueToday: number;
      pendingReviews: number;
    };
    return stats.summary;
  }

  const stats = (await executeAgentTool("get_dashboard_summary", {})) as { summary: string };
  return `${stats.summary}\n\nTry asking about: overdue deadlines, review queue, active files, email templates, or say "run morning briefing".`;
}
