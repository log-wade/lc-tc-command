import { NextResponse } from "next/server";
import { applyReviewSlaDeadlines, escalateOverdueReviews } from "@/lib/sla/review-sla";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applied = await applyReviewSlaDeadlines();
  const escalated = await escalateOverdueReviews();

  return NextResponse.json({ ok: true, applied, escalated });
}
