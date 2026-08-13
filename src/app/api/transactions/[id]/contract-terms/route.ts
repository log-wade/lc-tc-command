import { NextResponse } from "next/server";
import { updateTransactionContractTerms } from "@/lib/data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  try {
    const result = await updateTransactionContractTerms(id, body);
    if (!result) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save contract terms";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
