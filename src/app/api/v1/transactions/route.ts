import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-keys";
import { getTransactions } from "@/lib/data";

export async function GET(request: Request) {
  const key = request.headers.get("x-api-key");
  if (!key) {
    return NextResponse.json({ error: "Missing x-api-key" }, { status: 401 });
  }

  const auth = await validateApiKey(key);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }
  if (!auth.scopes.includes("read") && !auth.scopes.includes("transactions:read")) {
    return NextResponse.json({ error: "Insufficient scope" }, { status: 403 });
  }

  const transactions = await getTransactions();
  const scoped = transactions.filter(
    (t) =>
      !(t as { organization_id?: string }).organization_id ||
      (t as { organization_id?: string }).organization_id === auth.organizationId
  );

  return NextResponse.json({ data: scoped, organizationId: auth.organizationId });
}
