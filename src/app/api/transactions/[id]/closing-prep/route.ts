import { NextResponse } from "next/server";
import { updateTransactionClosingPrep } from "@/lib/data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  try {
    const transaction = await updateTransactionClosingPrep(id, body);
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    return NextResponse.json({ transaction });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
