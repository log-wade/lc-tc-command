import { NextResponse } from "next/server";
import { getProblemReport } from "@/lib/problem-reports/repository";
import { reconcileProblemReport } from "@/lib/problem-reports/reconcile";
import { getSessionProfile } from "@/lib/supabase/server-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const existing = await getProblemReport(id, profile.organizationId);
    if (!existing) {
      return NextResponse.json({ error: "Problem report not found." }, { status: 404 });
    }
    const report = await reconcileProblemReport(existing);
    return NextResponse.json(
      { report },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not refresh implementation status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
