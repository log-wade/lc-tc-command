import { NextResponse } from "next/server";
import { createListingIntake } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.property_address) {
      return NextResponse.json({ error: "property_address is required" }, { status: 400 });
    }
    const listing = await createListingIntake(body);
    return NextResponse.json({ success: true, listing });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Intake failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
