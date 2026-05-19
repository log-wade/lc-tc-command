import Link from "next/link";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getDashboardStats,
  getListings,
  getTransactions,
  getDeadlines,
  getReviewQueue,
} from "@/lib/data";
import { formatCurrency, formatDate, statusColor } from "@/lib/utils";
import { isDatabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, listings, transactions, deadlines, reviews] = await Promise.all([
    getDashboardStats(),
    getListings(),
    getTransactions(),
    getDeadlines(),
    getReviewQueue(),
  ]);

  const upcomingDeadlines = deadlines
    .filter((d: { status: string }) => d.status === "pending")
    .sort(
      (a: { due_at: string }, b: { due_at: string }) =>
        new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    )
    .slice(0, 6);

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Command Center
        </p>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Good morning, Carly
        </h1>
        <p className="mt-1 text-stone-600">
          {stats.activeListings} listings · {stats.activeTransactions} transactions ·{" "}
          {stats.pendingReviews} awaiting review
        </p>
        {!isDatabaseConfigured() && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Demo mode — connect Supabase env vars for persistent storage.
          </p>
        )}
      </header>

      <StatsGrid stats={stats} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold">Active Listings</h2>
            <Link href="/listings" className="text-xs text-amber-700 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            {listings.slice(0, 5).map((l) => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="flex items-center justify-between border-t border-stone-100 px-5 py-3 hover:bg-stone-50"
              >
                <div>
                  <p className="font-medium text-stone-900">{l.property_address}</p>
                  <p className="text-xs text-stone-500">
                    {formatCurrency(l.list_price)} · {l.county ?? "—"}
                  </p>
                </div>
                <Badge className={statusColor(l.status)}>{l.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold">Active Transactions</h2>
            <Link href="/transactions" className="text-xs text-amber-700 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            {transactions.slice(0, 5).map((t) => (
              <Link
                key={t.id}
                href={`/transactions/${t.id}`}
                className="flex items-center justify-between border-t border-stone-100 px-5 py-3 hover:bg-stone-50"
              >
                <div>
                  <p className="font-medium text-stone-900">{t.property_address}</p>
                  <p className="text-xs text-stone-500">
                    Close {formatDate(t.closing_date)} · {t.side}
                  </p>
                </div>
                <Badge className={statusColor(t.status)}>{t.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Upcoming Deadlines</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-stone-500">No pending deadlines.</p>
            ) : (
              upcomingDeadlines.map((d: { id: string; label: string; due_at: string; file_type: string }) => (
                <div
                  key={d.id}
                  className="flex justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm"
                >
                  <span>{d.label}</span>
                  <span className="text-stone-500">{formatDate(d.due_at)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold">Review Queue</h2>
            <Link href="/reviews" className="text-xs text-amber-700 hover:underline">
              Open queue
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {reviews.length === 0 ? (
              <p className="text-sm text-stone-500">Queue is clear.</p>
            ) : (
              reviews.slice(0, 5).map((r: { id: string; title?: string; priority?: string }) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-stone-100 px-3 py-2 text-sm"
                >
                  <Badge
                    className={
                      r.priority === "P0"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {r.priority ?? "P2"}
                  </Badge>
                  <span className="truncate">{r.title}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
