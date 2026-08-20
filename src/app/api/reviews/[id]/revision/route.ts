import { NextResponse } from "next/server";
import { saveReviewRevision } from "@/lib/data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const updated = await saveReviewRevision(id, {
      subject: typeof body.subject === "string" ? body.subject : undefined,
      body: typeof body.body === "string" ? body.body : undefined,
    });
    return NextResponse.json({ success: true, review: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
