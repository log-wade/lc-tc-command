import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing, getDeadlines } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { DeadlineRow } from "@/components/ui/deadline-row";
import { GoLiveButton } from "@/components/listings/go-live-button";
import { formatCurrency, formatDate, statusColor } from "@/lib/utils";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

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
  const now = new Date();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/listings"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        All listings
      </Link>

      <PageHeader title={listing.property_address} description={[listing.city, listing.state, listing.zip].filter(Boolean).join(", ")}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusColor(listing.status)}>{listing.status.replace(/_/g, " ")}</Badge>
          {!listing.go_live_approved && listing.status === "intake" && (
            <GoLiveButton listingId={listing.id} />
          )}
          {listing.go_live_approved && (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Go-live approved
            </span>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Listing details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <DetailRow label="List price" value={formatCurrency(listing.list_price)} />
            <DetailRow label="Target list" value={formatDate(listing.target_list_date)} />
            <DetailRow label="Went live" value={formatDate(listing.actual_list_date)} />
            <DetailRow label="MLS #" value={listing.mls_number ?? "Not assigned"} />
            <DetailRow label="MC compliance" value={listing.compliance_status ?? "pending"} />
          </dl>
        </section>

        <section>
          <h2 className="font-display mb-3 text-lg font-semibold">Deadlines</h2>
          <div className="space-y-2">
            {deadlines.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-ink-muted">
                No deadlines pinned yet.
              </p>
            ) : (
              deadlines.map((d: { id: string; label: string; due_at: string; status: string }) => {
                const due = new Date(d.due_at);
                return (
                  <DeadlineRow
                    key={d.id}
                    label={d.label}
                    dueAt={d.due_at}
                    overdue={d.status === "pending" && due < now}
                    dueToday={
                      d.status === "pending" &&
                      due.toDateString() === now.toDateString() &&
                      due >= now
                    }
                  />
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-stone-100 pb-2 last:border-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium capitalize text-ink">{value}</dd>
    </div>
  );
}
