import { NextResponse } from "next/server";
import { createTransactionIntake } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.property_address || !body.effective_date || !body.closing_date) {
      return NextResponse.json(
        { error: "property_address, effective_date, and closing_date are required" },
        { status: 400 }
      );
    }
    const transaction = await createTransactionIntake(body);
    return NextResponse.json({ success: true, transaction });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Intake failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
