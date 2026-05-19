import { NextResponse } from "next/server";
import { getDeadlines } from "@/lib/data";
import { getReminderWindows } from "@/lib/deadlines/engine";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/resend";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deadlines = await getDeadlines();
  const now = new Date();
  const reminders: string[] = [];

  for (const d of deadlines) {
    if (d.status !== "pending") continue;
    const due = new Date(d.due_at);
    const windows = getReminderWindows(due, now);

    if (windows.t0 || windows.t4h || windows.t1d) {
      reminders.push(`${d.label} — ${d.file_type}/${d.file_id} due ${due.toISOString()}`);
    }
  }

  if (reminders.length > 0 && process.env.ALERT_EMAIL) {
    await sendEmail({
      to: [process.env.ALERT_EMAIL],
      subject: `LC/TC Deadline Alert — ${reminders.length} item(s)`,
      body: `Deadline reminders:\n\n${reminders.join("\n")}\n\n— Automated LC/TC System`,
    });
  }

  await logAudit({
    actor_type: "system",
    action_type: "cron_deadline_check",
    outputs: { checked: deadlines.length, reminders: reminders.length },
    outcome: "success",
  });

  return NextResponse.json({ checked: deadlines.length, reminders_sent: reminders.length });
}
