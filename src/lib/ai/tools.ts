import { classifyInboundEmail } from "./agent";
import { getTemplateById, EMAIL_TEMPLATES } from "../templates/catalog";
import {
  getDashboardStats,
  getListings,
  getTransactions,
  getDeadlines,
  getReviewQueue,
} from "../data";
import type { WorkflowId } from "./workflows";
import { enforcePolicy } from "./policy";
import { logAgentAudit } from "./agent-audit";

export type AgentToolName =
  | "get_dashboard_summary"
  | "list_active_files"
  | "list_upcoming_deadlines"
  | "list_pending_reviews"
  | "get_email_template"
  | "list_email_templates"
  | "classify_inbound_email"
  | "run_workflow";

export const AGENT_TOOL_NAMES: AgentToolName[] = [
  "get_dashboard_summary",
  "list_active_files",
  "list_upcoming_deadlines",
  "list_pending_reviews",
  "get_email_template",
  "list_email_templates",
  "classify_inbound_email",
  "run_workflow",
];

export type ToolArguments = {
  get_dashboard_summary: Record<string, never>;
  list_active_files: { limit?: number };
  list_upcoming_deadlines: { limit?: number; overdue_only?: boolean };
  list_pending_reviews: { limit?: number };
  get_email_template: { template_id: string };
  list_email_templates: Record<string, never>;
  classify_inbound_email: { from: string; subject: string; body: string };
  run_workflow: { workflow_id: WorkflowId };
};

export async function executeAgentTool(
  name: AgentToolName,
  args: Record<string, unknown>
): Promise<unknown> {
  const policy = enforcePolicy({ action: `tool:${name}`, toolName: name });
  if (!policy.allowed) {
    await logAgentAudit({
      channel: "tool",
      actionType: name,
      toolName: name,
      policyResult: "blocked",
      inputs: args,
      outputs: { error: policy.reason },
    });
    return { error: policy.reason };
  }

  switch (name) {
    case "get_dashboard_summary": {
      const stats = await getDashboardStats();
      return {
        ...stats,
        summary: `${stats.overdueDeadlines} overdue deadlines, ${stats.dueToday} due today, ${stats.pendingReviews} items in review queue, ${stats.activeListings} active listings, ${stats.activeTransactions} active transactions.`,
      };
    }
    case "list_active_files": {
      const limit = Number(args.limit ?? 10);
      const [listings, transactions] = await Promise.all([getListings(), getTransactions()]);
      return {
        listings: listings
          .filter((l) =>
            ["active", "coming_soon", "active_option", "active_contingent", "intake", "pending"].includes(
              l.status
            )
          )
          .slice(0, limit)
          .map((l) => ({
            id: l.id,
            type: "listing",
            address: l.property_address,
            status: l.status,
            href: `/listings/${l.id}`,
          })),
        transactions: transactions
          .filter((t) => ["active", "pending", "intake"].includes(t.status))
          .slice(0, limit)
          .map((t) => ({
            id: t.id,
            type: "transaction",
            address: t.property_address,
            status: t.status,
            closing_date: t.closing_date,
            href: `/transactions/${t.id}`,
          })),
      };
    }
    case "list_upcoming_deadlines": {
      const limit = Number(args.limit ?? 10);
      const overdueOnly = Boolean(args.overdue_only);
      const now = new Date();
      const [deadlines, listings, transactions] = await Promise.all([
        getDeadlines(),
        getListings(),
        getTransactions(),
      ]);
      const rows = deadlines
        .filter((d: { status: string }) => d.status === "pending")
        .map((d: { id: string; label: string; due_at: string; file_type: string; file_id: string }) => {
          const due = new Date(d.due_at);
          const overdue = due < now;
          const file =
            d.file_type === "listing"
              ? listings.find((l) => l.id === d.file_id)
              : transactions.find((t) => t.id === d.file_id);
          return {
            id: d.id,
            label: d.label,
            due_at: d.due_at,
            overdue,
            address: file?.property_address ?? "Unknown",
            file_type: d.file_type,
            file_id: d.file_id,
          };
        })
        .filter((d) => !overdueOnly || d.overdue)
        .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
        .slice(0, limit);
      return { deadlines: rows, count: rows.length };
    }
    case "list_pending_reviews": {
      const limit = Number(args.limit ?? 10);
      const reviews = await getReviewQueue();
      return {
        reviews: reviews.slice(0, limit).map((r: Record<string, unknown>) => ({
          id: r.id,
          title: r.title,
          priority: r.priority,
          file_type: r.file_type,
          file_id: r.file_id,
          item_type: r.item_type,
        })),
        count: reviews.length,
      };
    }
    case "get_email_template": {
      const templateId = String(args.template_id ?? "");
      const template = getTemplateById(templateId);
      if (!template) {
        return { error: `Template ${templateId} not found` };
      }
      return template;
    }
    case "list_email_templates": {
      return EMAIL_TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        when: t.when,
        category: t.category,
      }));
    }
    case "classify_inbound_email": {
      return classifyInboundEmail({
        from: String(args.from ?? ""),
        subject: String(args.subject ?? ""),
        body: String(args.body ?? ""),
      });
    }
    case "run_workflow": {
      const workflowId = String(args.workflow_id ?? "") as WorkflowId;
      const { runWorkflow } = await import("./workflows");
      return runWorkflow(workflowId);
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

const TOOL_DESCRIPTIONS: Record<AgentToolName, string> = {
  get_dashboard_summary: "Get Today dashboard stats: overdue deadlines, due today, pending reviews, active files.",
  list_active_files: "List active listings and transactions with addresses and status.",
  list_upcoming_deadlines: "List pending deadlines sorted by due date. Set overdue_only=true for overdue only.",
  list_pending_reviews: "List items waiting for human approval before send or action.",
  get_email_template: "Get full email template by id (e.g. tpl-1) including subject and body.",
  list_email_templates: "List all broker-approved email templates.",
  classify_inbound_email: "Classify inbound email priority P0-P3 and detect wire fraud signals.",
  run_workflow:
    "Run an autonomous coordination workflow: morning_briefing, tuesday_prep, or intake_triage.",
};

const TOOL_SCHEMAS: Record<AgentToolName, { type: "object"; properties: Record<string, unknown>; required?: string[] }> = {
  get_dashboard_summary: { type: "object", properties: {} },
  list_active_files: {
    type: "object",
    properties: { limit: { type: "number", description: "Max items per type (default 10)" } },
  },
  list_upcoming_deadlines: {
    type: "object",
    properties: {
      limit: { type: "number" },
      overdue_only: { type: "boolean" },
    },
  },
  list_pending_reviews: {
    type: "object",
    properties: { limit: { type: "number" } },
  },
  get_email_template: {
    type: "object",
    properties: { template_id: { type: "string", description: "Template id e.g. tpl-1" } },
    required: ["template_id"],
  },
  list_email_templates: { type: "object", properties: {} },
  classify_inbound_email: {
    type: "object",
    properties: {
      from: { type: "string" },
      subject: { type: "string" },
      body: { type: "string" },
    },
    required: ["from", "subject", "body"],
  },
  run_workflow: {
    type: "object",
    properties: {
      workflow_id: {
        type: "string",
        enum: ["morning_briefing", "tuesday_prep", "intake_triage"],
      },
    },
    required: ["workflow_id"],
  },
};

/** Anthropic tool definitions for chat orchestrator */
export const ANTHROPIC_TOOL_DEFINITIONS = AGENT_TOOL_NAMES.map((name) => ({
  name,
  description: TOOL_DESCRIPTIONS[name],
  input_schema: TOOL_SCHEMAS[name],
}));
