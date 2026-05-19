import Link from "next/link";
import { notFound } from "next/navigation";
import { getTransaction, getDeadlines } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency, formatDate, statusColor } from "@/lib/utils";
import { formatDeadlineCt } from "@/lib/deadlines/engine";

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
  const sorted = [...deadlines].sort(
    (a: { due_at: string }, b: { due_at: string }) =>
      new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
  );

  return (
    <div className="p-8">
      <Link href="/transactions" className="text-sm text-amber-700 hover:underline">
        ← Transactions
      </Link>
      <header className="mt-4 mb-6">
        <h1 className="font-serif text-2xl font-bold">{transaction.property_address}</h1>
        <p className="text-stone-600 capitalize">{transaction.side} side</p>
        <div className="mt-2 flex gap-2">
          <Badge className={statusColor(transaction.status)}>{transaction.status}</Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="font-semibold">Contract Terms</h2>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Effective" value={formatDate(transaction.effective_date)} />
            <Row label="Closing" value={formatDate(transaction.closing_date)} />
            <Row label="Option Days" value={String(transaction.option_days ?? "—")} />
            <Row label="Option Fee" value={formatCurrency(transaction.option_fee_amount)} />
            <Row label="Earnest Money" value={formatCurrency(transaction.earnest_money_amount)} />
            <Row label="Financing Days" value={String(transaction.financing_days ?? "—")} />
            <Row label="Title File #" value={transaction.title_file_number ?? "—"} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold">Deadline Engine (pinned at intake)</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sorted.map((d: { id: string; label: string; due_at: string; status: string }) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2 text-sm"
                >
                  <span>{d.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-500">
                      {formatDeadlineCt(new Date(d.due_at))}
                    </span>
                    <Badge className={statusColor(d.status)}>{d.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
