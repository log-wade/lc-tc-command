import { NextResponse } from "next/server";
import { listActiveProblemReports } from "@/lib/problem-reports/repository";
import { reconcileProblemReport } from "@/lib/problem-reports/reconcile";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reports = await listActiveProblemReports();
    const results = await Promise.allSettled(reports.map(reconcileProblemReport));
    const failed = results.filter((result) => result.status === "rejected").length;
    return NextResponse.json({
      ok: failed === 0,
      checked: reports.length,
      failed,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not reconcile problem reports.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
