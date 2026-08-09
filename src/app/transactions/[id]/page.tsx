import Link from "next/link";
import { notFound } from "next/navigation";
import { getTransaction, getDeadlines } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { DeadlineRow } from "@/components/ui/deadline-row";
import { ClosingPrepForm } from "@/components/transactions/closing-prep-form";
import { WeeklyNotesForm } from "@/components/transactions/weekly-notes-form";
import { formatCurrency, formatDate, statusColor } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transaction = await getTransaction(id);
  if (!transaction) notFound();

  const deadlines = await getDeadlines("transaction", id);
  const now = new Date();
  const sorted = [...deadlines].sort(
    (a: { due_at: string }, b: { due_at: string }) =>
      new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/transactions"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand-coral"
      >
        <ArrowLeft className="h-4 w-4" />
        All transactions
      </Link>

      <PageHeader
        title={transaction.property_address}
        description={`${transaction.side} side · Close ${formatDate(transaction.closing_date)}`}
      >
        <Badge className={statusColor(transaction.status)}>
          {transaction.status}
        </Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Contract terms</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Effective" value={formatDate(transaction.effective_date)} />
            <Row label="Closing" value={formatDate(transaction.closing_date)} />
            <Row label="Option days" value={String(transaction.option_days ?? "—")} />
            <Row label="Option fee" value={formatCurrency(transaction.option_fee_amount)} />
            <Row label="Earnest money" value={formatCurrency(transaction.earnest_money_amount)} />
            <Row label="Financing days" value={String(transaction.financing_days ?? "—")} />
            <Row label="Title file #" value={transaction.title_file_number ?? "—"} />
          </dl>
        </section>

        <section className="lg:col-span-3">
          <h2 className="font-display mb-1 text-lg font-semibold">Deadline timeline</h2>
          <p className="mb-4 text-sm text-ink-muted">
            Pinned from effective date at intake. Updates only when an executed amendment changes
            dates.
          </p>
          <div className="space-y-2">
            {sorted.map((d: { id: string; label: string; due_at: string; status: string }) => {
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
            })}
          </div>
        </section>
      </div>

      <div className="mt-6 space-y-6">
        <WeeklyNotesForm
          transactionId={transaction.id}
          initial={{
            status_summary:
              typeof transaction.metadata?.status_summary === "string"
                ? transaction.metadata.status_summary
                : undefined,
            action_needed:
              typeof transaction.metadata?.action_needed === "string"
                ? transaction.metadata.action_needed
                : undefined,
          }}
        />
        <ClosingPrepForm
          transactionId={transaction.id}
          initial={{
            closing_day: metaString(transaction.metadata?.closing_day),
            closing_time: metaString(transaction.metadata?.closing_time),
            signing_method: metaString(transaction.metadata?.signing_method),
            utilities_reminder: metaString(transaction.metadata?.utilities_reminder),
            final_walkthrough: metaString(transaction.metadata?.final_walkthrough),
            keys_and_access: metaString(transaction.metadata?.keys_and_access),
            closer_name: metaString(transaction.metadata?.closer_name),
            closer_phone: metaString(transaction.metadata?.closer_phone),
            title_company: metaString(transaction.metadata?.title_company),
          }}
        />
      </div>
    </div>
  );
}

function metaString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
