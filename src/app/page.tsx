import Link from "next/link";
import { TodayHero } from "@/components/dashboard/today-hero";
import { PageHeader } from "@/components/ui/page-header";
import { FileRow, formatListingMeta, formatTransactionMeta } from "@/components/ui/file-row";
import { DeadlineRow } from "@/components/ui/deadline-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  getDashboardStats,
  getListings,
  getTransactions,
  getDeadlines,
  getReviewQueue,
} from "@/lib/data";
import { Home, FileText, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, listings, transactions, deadlines, reviews] = await Promise.all([
    getDashboardStats(),
    getListings(),
    getTransactions(),
    getDeadlines(),
    getReviewQueue(),
  ]);

  const now = new Date();
  const todayStr = now.toDateString();

  const pendingDeadlines = deadlines
    .filter((d: { status: string }) => d.status === "pending")
    .map((d: { id: string; label: string; due_at: string; file_type: string; file_id: string }) => {
      const due = new Date(d.due_at);
      const overdue = due < now;
      const dueToday = due.toDateString() === todayStr && !overdue;
      const file =
        d.file_type === "listing"
          ? listings.find((l) => l.id === d.file_id)
          : transactions.find((t) => t.id === d.file_id);
      const address = file?.property_address ?? "Unknown file";
      const href =
        d.file_type === "listing"
          ? `/listings/${d.file_id}`
          : `/transactions/${d.file_id}`;
      return { ...d, overdue, dueToday, address, href };
    })
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    })
    .slice(0, 5);

  const activeListings = listings.filter((l) =>
    ["active", "coming_soon", "active_option", "active_contingent", "intake"].includes(l.status)
  );
  const activeTxns = transactions.filter((t) =>
    ["active", "pending", "intake"].includes(t.status)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <TodayHero stats={stats} />

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <section className="animate-fade-up stagger-1 lg:col-span-3" data-tour="needs-attention">
          <PageHeader
            title="Needs attention"
            description="Deadlines and reviews that should move before end of day."
          />
          <div className="space-y-2">
            {reviews.slice(0, 3).map((r: { id: string; title?: string; priority?: string }) => (
              <Link
                key={r.id}
                href="/reviews"
                className="flex items-center gap-3 rounded-xl border border-amber-200/60 bg-warning-soft px-4 py-3 transition hover:shadow-sm"
              >
                <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-xs font-bold text-amber-900">
                  {r.priority ?? "P2"}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-ink">
                  {r.title}
                </span>
                <ArrowRight className="h-4 w-4 text-amber-700" />
              </Link>
            ))}
            {pendingDeadlines.map((d) => (
              <DeadlineRow
                key={d.id}
                label={d.label}
                dueAt={d.due_at}
                fileHref={d.href}
                fileLabel={d.address}
                overdue={d.overdue}
                dueToday={d.dueToday}
              />
            ))}
            {reviews.length === 0 && pendingDeadlines.length === 0 && (
              <EmptyState
                icon={Home}
                title="All clear for now"
                description="No overdue deadlines or pending reviews. Check back after intake or when emails arrive."
              />
            )}
          </div>
        </section>

        <section className="animate-fade-up stagger-2 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Active files</h2>
            <span className="text-sm text-ink-muted">
              {activeListings.length + activeTxns.length} open
            </span>
          </div>
          <div className="space-y-2">
            {activeListings.slice(0, 3).map((l) => (
              <FileRow
                key={l.id}
                href={`/listings/${l.id}`}
                type="listing"
                address={l.property_address}
                meta={formatListingMeta(l.list_price, l.county)}
                status={l.status}
              />
            ))}
            {activeTxns.slice(0, 3).map((t) => (
              <FileRow
                key={t.id}
                href={`/transactions/${t.id}`}
                type="transaction"
                address={t.property_address}
                meta={formatTransactionMeta(t.closing_date, t.side)}
                status={t.status}
              />
            ))}
            {activeListings.length === 0 && activeTxns.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-ink-muted">
                No active files yet. Start with a listing or contract intake.
              </p>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button href="/listings" variant="secondary" size="sm" className="w-full flex-1">
              All listings
            </Button>
            <Button href="/transactions" variant="secondary" size="sm" className="w-full flex-1">
              All transactions
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
