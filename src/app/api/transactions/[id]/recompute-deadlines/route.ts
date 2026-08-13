import { NextResponse } from "next/server";
import { recomputeTransactionDeadlines } from "@/lib/data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await recomputeTransactionDeadlines(id);
    if (!result) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to recompute deadlines";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
