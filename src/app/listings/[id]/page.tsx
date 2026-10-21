import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing, getDeadlines } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { DeadlineRow } from "@/components/ui/deadline-row";
import { GoLiveButton } from "@/components/listings/go-live-button";
import { ListingPreparationForm } from "@/components/listings/listing-preparation-form";
import { WeeklyStatsForm } from "@/components/listings/weekly-stats-form";
import { formatCurrency, formatDate, statusColor } from "@/lib/utils";
import type {
  ListingCoordination,
  ListingSellerContact,
  ListingWeeklyStats,
} from "@/lib/types";
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
  const weekly = (listing.metadata?.weekly_stats ?? {}) as ListingWeeklyStats;
  const openHouse =
    listing.open_house_details ||
    (typeof listing.metadata?.open_house_details === "string"
      ? listing.metadata.open_house_details
      : undefined);
  const sellers = readSellers(listing.metadata);
  const coordination = listing.metadata?.coordination;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/listings"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand-coral"
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
            <DetailRow label="Year built" value={listing.year_built ? String(listing.year_built) : "—"} />
            <DetailRow
              label="ECAD"
              value={
                listing.metadata?.ecad_required
                  ? "Required — included in the documents-needed email"
                  : "Not required"
              }
            />
            <DetailRow
              label="Survey / T-47"
              value={
                listing.metadata?.survey_on_file
                  ? `Survey on file · T-47 ${String(listing.metadata.t47_status ?? "needed")}`
                  : "No current survey reported"
              }
            />
            <DetailRow
              label="Photoshoot"
              value={
                listing.metadata?.photo_date
                  ? listing.metadata.photo_time
                    ? `${String(listing.metadata.photo_date)} at ${String(listing.metadata.photo_time)}`
                    : `${String(listing.metadata.photo_date)} — start time needed`
                  : "Not scheduled"
              }
            />
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

      {(sellers.length > 0 || coordination) && (
        <section className="mt-6 rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Sellers & coordination</h2>
          {sellers.length > 0 && (
            <ul className="mt-4 space-y-3 text-sm">
              {sellers.map((seller) => (
                <li key={`${seller.email}-${seller.name}`} className="border-b border-border pb-3 last:border-0">
                  <p className="font-medium text-ink">{seller.name}</p>
                  <p className="text-ink-muted">
                    <a className="hover:text-brand-coral" href={`mailto:${seller.email}`}>
                      {seller.email}
                    </a>
                    {seller.phone ? ` · ${seller.phone}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {coordination && <CoordinationFacts coordination={coordination} />}
        </section>
      )}

      <div className="mt-6 space-y-6">
        <ListingPreparationForm
          listingId={listing.id}
          initial={{
            year_built: listing.year_built,
            in_austin_city_limits: listing.metadata?.in_austin_city_limits,
            austin_energy_service: listing.metadata?.austin_energy_service,
            survey_on_file: listing.metadata?.survey_on_file,
            t47_status: listing.metadata?.t47_status,
            staging_status: listing.metadata?.staging_status,
            disclosure_status: listing.metadata?.disclosure_status,
            spare_key_status: listing.metadata?.spare_key_status,
            photo_date: listing.metadata?.photo_date,
            photo_time: listing.metadata?.photo_time,
          }}
        />
        <WeeklyStatsForm
          listingId={listing.id}
          initial={{
            showings_week: weekly.showings_week != null ? String(weekly.showings_week) : undefined,
            showings_total:
              weekly.showings_total != null ? String(weekly.showings_total) : undefined,
            feedback_count:
              weekly.feedback_count != null ? String(weekly.feedback_count) : undefined,
            feedback_themes: weekly.feedback_themes,
            cancellations:
              weekly.cancellations != null ? String(weekly.cancellations) : undefined,
            no_shows: weekly.no_shows != null ? String(weekly.no_shows) : undefined,
            reverse_prospecting:
              weekly.reverse_prospecting != null
                ? String(weekly.reverse_prospecting)
                : undefined,
            online_views:
              weekly.online_views != null ? String(weekly.online_views) : undefined,
            online_saves:
              weekly.online_saves != null ? String(weekly.online_saves) : undefined,
            open_house_details: openHouse,
          }}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium capitalize text-ink">{value}</dd>
    </div>
  );
}

function readSellers(
  metadata: { sellers?: ListingSellerContact[]; seller_legal_name?: string; seller_email?: string; seller_phone?: string } | undefined
): ListingSellerContact[] {
  const listed = metadata?.sellers?.filter(
    (seller) => seller && typeof seller.name === "string" && typeof seller.email === "string"
  );
  if (listed && listed.length > 0) return listed;
  if (metadata?.seller_email && metadata.seller_legal_name) {
    return [
      {
        name: metadata.seller_legal_name,
        email: metadata.seller_email,
        phone: metadata.seller_phone,
      },
    ];
  }
  return [];
}

function CoordinationFacts({ coordination }: { coordination: ListingCoordination }) {
  const term =
    coordination.term_start || coordination.term_end
      ? `${formatDate(coordination.term_start)} – ${formatDate(coordination.term_end)}`
      : undefined;
  const facts: Array<{ label: string; value: string }> = [
    coordination.occupancy ? { label: "Occupancy", value: coordination.occupancy } : undefined,
    coordination.agreement_signed
      ? { label: "Agreement signed", value: formatDate(coordination.agreement_signed) }
      : undefined,
    term ? { label: "Listing term", value: term } : undefined,
    coordination.commission_percent
      ? { label: "Commission", value: `${coordination.commission_percent}%` }
      : undefined,
    coordination.mls_board ? { label: "MLS", value: coordination.mls_board } : undefined,
    coordination.property_type
      ? { label: "Property type", value: coordination.property_type }
      : undefined,
    coordination.mailing_address
      ? { label: "Mailing address", value: coordination.mailing_address }
      : undefined,
    coordination.concessions ? { label: "Concessions", value: coordination.concessions } : undefined,
    coordination.renovation_note
      ? { label: "Renovations", value: coordination.renovation_note }
      : undefined,
    coordination.photo_plan ? { label: "Photography", value: coordination.photo_plan } : undefined,
    coordination.photographer_note
      ? { label: "Photographer", value: coordination.photographer_note }
      : undefined,
    coordination.disclosure_note
      ? { label: "Disclosures", value: coordination.disclosure_note }
      : undefined,
    coordination.lead_based_paint
      ? { label: "Lead-based paint", value: coordination.lead_based_paint }
      : undefined,
    coordination.district_notice
      ? { label: "District notice", value: coordination.district_notice }
      : undefined,
    coordination.target_list_note
      ? { label: "Target list", value: coordination.target_list_note }
      : undefined,
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));
  const stillNeeded = coordination.still_needed?.filter(Boolean) ?? [];
  const openQuestions = coordination.open_questions?.filter(Boolean) ?? [];

  return (
    <div className="mt-4 space-y-4 text-sm">
      {facts.length > 0 && (
        <dl className="space-y-3">
          {facts.map((fact) => (
            <div key={fact.label} className="grid gap-1 border-b border-border pb-2 sm:grid-cols-[11rem_1fr]">
              <dt className="text-ink-muted">{fact.label}</dt>
              <dd className="text-ink">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {stillNeeded.length > 0 && (
        <div>
          <h3 className="font-medium text-ink">Still needed</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink">
            {stillNeeded.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {openQuestions.length > 0 && (
        <div>
          <h3 className="font-medium text-ink">Open MLS questions</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink">
            {openQuestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
