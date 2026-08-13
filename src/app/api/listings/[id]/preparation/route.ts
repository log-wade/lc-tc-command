import { NextResponse } from "next/server";
import { updateListingPreparation } from "@/lib/data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const listing = await updateListingPreparation(id, await request.json());
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return NextResponse.json({ listing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save listing preparation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
