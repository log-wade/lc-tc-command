import { createServiceClient } from "../supabase/server";
import { sendEmail } from "../email/resend";
import { DEFAULT_ORG_ID } from "../supabase/server-auth";

const SLA_HOURS = Number(process.env.REVIEW_SLA_HOURS ?? 24);

export async function applyReviewSlaDeadlines(): Promise<number> {
  const supabase = createServiceClient();
  if (!supabase) return 0;

  const dueBy = new Date(Date.now() + SLA_HOURS * 60 * 60 * 1000).toISOString();
  const { data: pending } = await supabase
    .from("review_queue")
    .select("id")
    .eq("status", "pending")
    .is("due_by", null);

  if (!pending?.length) return 0;

  await supabase
    .from("review_queue")
    .update({ due_by: dueBy })
    .in(
      "id",
      pending.map((r) => r.id)
    );

  return pending.length;
}

export async function escalateOverdueReviews(): Promise<number> {
  const supabase = createServiceClient();
  if (!supabase) return 0;

  const now = new Date().toISOString();
  const { data: overdue } = await supabase
    .from("review_queue")
    .select("id, title, organization_id")
    .eq("status", "pending")
    .lt("due_by", now)
    .is("escalated_at", null);

  if (!overdue?.length) return 0;

  const alertTo = process.env.ALERT_EMAIL;
  if (alertTo) {
    await sendEmail({
      to: [alertTo],
      subject: `[LC/TC] ${overdue.length} review item(s) past SLA`,
      body: overdue.map((r) => `- ${r.title} (${r.id})`).join("\n"),
    });
  }

  await supabase
    .from("review_queue")
    .update({ escalated_at: now })
    .in(
      "id",
      overdue.map((r) => r.id)
    );

  for (const item of overdue) {
    await supabase.from("escalations").insert({
      organization_id: item.organization_id ?? DEFAULT_ORG_ID,
      file_type: "review",
      file_id: item.id,
      tier: 2,
      reason: "review_sla_breach",
      status: "open",
    });
  }

  return overdue.length;
}
