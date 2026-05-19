import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing, getDeadlines } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency, formatDate, statusColor } from "@/lib/utils";
import { GoLiveButton } from "@/components/listings/go-live-button";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const deadlines = await getDeadlines("listing", id);

  return (
    <div className="p-8">
      <Link href="/listings" className="text-sm text-amber-700 hover:underline">
        ← Listings
      </Link>
      <header className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">{listing.property_address}</h1>
          <p className="text-stone-600">
            {listing.city}, {listing.state} {listing.zip} · {listing.county} County
          </p>
          <div className="mt-2 flex gap-2">
            <Badge className={statusColor(listing.status)}>{listing.status}</Badge>
            <Badge className={statusColor(listing.compliance_status ?? "pending")}>
              MC: {listing.compliance_status ?? "pending"}
            </Badge>
          </div>
        </div>
        {!listing.go_live_approved && listing.status === "intake" && (
          <GoLiveButton listingId={listing.id} />
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold">Listing Details</h2>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <Detail label="List Price" value={formatCurrency(listing.list_price)} />
            <Detail label="Target List" value={formatDate(listing.target_list_date)} />
            <Detail label="Actual List" value={formatDate(listing.actual_list_date)} />
            <Detail label="MLS #" value={listing.mls_number ?? "—"} />
            <Detail label="Go-Live Approved" value={listing.go_live_approved ? "Yes" : "Pending agent approval"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Deadlines</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {deadlines.length === 0 ? (
              <p className="text-stone-500">No deadlines pinned.</p>
            ) : (
              deadlines.map((d: { id: string; label: string; due_at: string; status: string }) => (
                <div key={d.id} className="flex justify-between rounded bg-stone-50 px-2 py-1.5">
                  <span>{d.label}</span>
                  <span className="text-stone-500">{formatDate(d.due_at)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
