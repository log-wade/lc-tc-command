import type { Deadline } from "../types";

export type TransactionStage =
  | "option"
  | "financing"
  | "title"
  | "clear_to_close"
  | "closed";

const STAGE_ORDER: TransactionStage[] = [
  "option",
  "financing",
  "title",
  "clear_to_close",
  "closed",
];

const STAGE_LABELS: Record<TransactionStage, string> = {
  option: "Option",
  financing: "Financing",
  title: "Title",
  clear_to_close: "Clear to Close",
  closed: "Closed",
};

function isMet(deadlines: Deadline[], type: string): boolean {
  const d = deadlines.find((x) => x.deadline_type === type);
  return d?.status === "met" || d?.status === "waived";
}

export function resolveTransactionStage(deadlines: Deadline[]): TransactionStage {
  if (isMet(deadlines, "closing")) return "closed";

  const optionDone = isMet(deadlines, "option_period_end");
  const financingDone = isMet(deadlines, "buyer_approval");
  const titleDone = isMet(deadlines, "title_commitment");
  const cdDone = isMet(deadlines, "cd_issue");

  if (optionDone && financingDone && titleDone && cdDone) return "clear_to_close";
  if (optionDone && financingDone) return "title";
  if (optionDone) return "financing";
  return "option";
}

export function renderTransactionProgress(deadlines: Deadline[]): string {
  const stage = resolveTransactionStage(deadlines);
  const idx = STAGE_ORDER.indexOf(stage);
  const filled = Math.round(((idx + 1) / STAGE_ORDER.length) * 10);
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);
  const labels = STAGE_ORDER.map((s) => STAGE_LABELS[s]).join(" → ");
  const marker = " ".repeat(Math.max(0, idx * 12)) + "^^^^ You are here";

  return `Progress: ${bar}  ${labels}\n${marker}`;
}

export function suggestStatusSummary(deadlines: Deadline[]): string {
  const stage = resolveTransactionStage(deadlines);
  const pending = deadlines
    .filter((d) => d.status === "pending")
    .slice(0, 2)
    .map((d) => d.label);

  switch (stage) {
    case "option":
      return pending.length
        ? `In option period — next up: ${pending.join("; ")}`
        : "In option period — tracking option fee, earnest money, and inspections.";
    case "financing":
      return pending.length
        ? `Past option — financing in progress: ${pending.join("; ")}`
        : "Past option — buyer financing approval in progress.";
    case "title":
      return pending.length
        ? `Title & underwriting underway: ${pending.join("; ")}`
        : "Title commitment and underwriting in progress.";
    case "clear_to_close":
      return "Clear to close — final walkthrough and closing details being coordinated.";
    case "closed":
      return "Closed and funded — congratulations!";
    default: {
      const _exhaustive: never = stage;
      return _exhaustive;
    }
  }
}

export function summarizeMilestones(deadlines: Deadline[]): {
  completed: string;
  inProgress: string;
  actionNeeded: string;
} {
  const completed = deadlines
    .filter((d) => d.status === "met" || d.status === "waived")
    .map((d) => `• ${d.label}`)
    .join("\n");

  const pending = deadlines.filter((d) => d.status === "pending");
  const now = Date.now();
  const overdue = pending.filter((d) => new Date(d.due_at).getTime() < now);
  const upcoming = pending.filter((d) => new Date(d.due_at).getTime() >= now);

  return {
    completed: completed || "• (none yet)",
    inProgress: upcoming.map((d) => `• ${d.label}`).join("\n") || "• (none)",
    actionNeeded:
      overdue.map((d) => `• ${d.label} (past due)`).join("\n") || "• None right now",
  };
}
