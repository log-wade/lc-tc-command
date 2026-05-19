import { logAudit } from "../audit";
import { executeAgentTool } from "./tools";

export type WorkflowId = "morning_briefing" | "tuesday_prep" | "intake_triage";

export type WorkflowResult = {
  workflow_id: WorkflowId;
  completed_at: string;
  steps: Array<{ step: string; status: "ok" | "skipped"; output?: unknown }>;
  summary: string;
  recommended_actions: string[];
};

export async function runWorkflow(workflowId: WorkflowId): Promise<WorkflowResult> {
  const completed_at = new Date().toISOString();
  const steps: WorkflowResult["steps"] = [];
  const recommended_actions: string[] = [];

  switch (workflowId) {
    case "morning_briefing": {
      const stats = await executeAgentTool("get_dashboard_summary", {});
      steps.push({ step: "dashboard", status: "ok", output: stats });

      const deadlines = await executeAgentTool("list_upcoming_deadlines", {
        limit: 8,
        overdue_only: true,
      });
      steps.push({ step: "overdue_deadlines", status: "ok", output: deadlines });

      const dueSoon = await executeAgentTool("list_upcoming_deadlines", { limit: 5 });
      steps.push({ step: "upcoming_deadlines", status: "ok", output: dueSoon });

      const reviews = await executeAgentTool("list_pending_reviews", { limit: 8 });
      steps.push({ step: "review_queue", status: "ok", output: reviews });

      const s = stats as { overdueDeadlines?: number; dueToday?: number; pendingReviews?: number };
      if ((s.overdueDeadlines ?? 0) > 0) {
        recommended_actions.push("Clear overdue deadlines first — open Today → Needs attention.");
      }
      if ((s.dueToday ?? 0) > 0) {
        recommended_actions.push(`Review ${s.dueToday} deadline(s) due today.`);
      }
      if ((s.pendingReviews ?? 0) > 0) {
        recommended_actions.push(`Approve or reject ${s.pendingReviews} item(s) in the review queue.`);
      }
      if (recommended_actions.length === 0) {
        recommended_actions.push("Queue is clear — good time for proactive client updates or intake.");
      }

      await logAudit({
        actor_type: "ai_agent",
        action_type: "workflow_morning_briefing",
        outputs: { steps: steps.length },
        outcome: "success",
      });

      return {
        workflow_id: workflowId,
        completed_at,
        steps,
        recommended_actions,
        summary: `Morning briefing: ${s.overdueDeadlines ?? 0} overdue, ${s.dueToday ?? 0} due today, ${s.pendingReviews ?? 0} pending reviews.`,
      };
    }

    case "tuesday_prep": {
      const stats = await executeAgentTool("get_dashboard_summary", {});
      steps.push({ step: "dashboard", status: "ok", output: stats });

      const files = await executeAgentTool("list_active_files", { limit: 20 });
      steps.push({ step: "active_files", status: "ok", output: files });

      const templates = await executeAgentTool("list_email_templates", {});
      const tuesdayTemplates = (templates as Array<{ id: string; name: string }>).filter((t) =>
        t.id.includes("tpl-4") || t.id.includes("tpl-8")
      );
      steps.push({ step: "tuesday_templates", status: "ok", output: tuesdayTemplates });

      recommended_actions.push(
        "Draft weekly Tuesday updates (tpl-4 listings, tpl-8 transactions) for each active file."
      );
      recommended_actions.push("Send all client updates by 3 PM CT — queue each in review before send.");
      recommended_actions.push("For listings: prepare LA recap (tpl-5) for agents by Monday 5 PM if not done.");

      await logAudit({
        actor_type: "ai_agent",
        action_type: "workflow_tuesday_prep",
        outcome: "success",
      });

      return {
        workflow_id: workflowId,
        completed_at,
        steps,
        recommended_actions,
        summary: "Tuesday prep: identify active files needing weekly client updates by 3 PM CT.",
      };
    }

    case "intake_triage": {
      const files = await executeAgentTool("list_active_files", { limit: 5 });
      steps.push({ step: "recent_files", status: "ok", output: files });

      recommended_actions.push("New listing intake → Template 1 intro within 24 hours (review queue).");
      recommended_actions.push("New contract intake → Template 6 + 7 within 48 hours (review queue).");
      recommended_actions.push("Confirm deadlines were computed on transaction intake.");

      await logAudit({
        actor_type: "ai_agent",
        action_type: "workflow_intake_triage",
        outcome: "success",
      });

      return {
        workflow_id: workflowId,
        completed_at,
        steps,
        recommended_actions,
        summary: "Intake triage: verify intro emails and third-party intros are queued for review.",
      };
    }

    default:
      return {
        workflow_id: workflowId,
        completed_at,
        steps,
        recommended_actions: [],
        summary: `Unknown workflow: ${workflowId}`,
      };
  }
}
