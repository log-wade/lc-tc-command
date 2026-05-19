import { NextResponse } from "next/server";
import { resolveReview } from "@/lib/data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  await resolveReview(id, body.approved === true, body.notes);
  return NextResponse.json({ success: true });
}
