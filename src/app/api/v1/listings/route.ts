import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-keys";
import { getListings } from "@/lib/data";

export async function GET(request: Request) {
  const key = request.headers.get("x-api-key");
  if (!key) {
    return NextResponse.json({ error: "Missing x-api-key" }, { status: 401 });
  }

  const auth = await validateApiKey(key);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }
  if (!auth.scopes.includes("read") && !auth.scopes.includes("listings:read")) {
    return NextResponse.json({ error: "Insufficient scope" }, { status: 403 });
  }

  const listings = await getListings();
  const scoped = listings.filter(
    (l) => !(l as { organization_id?: string }).organization_id || (l as { organization_id?: string }).organization_id === auth.organizationId
  );

  return NextResponse.json({ data: scoped, organizationId: auth.organizationId });
}
