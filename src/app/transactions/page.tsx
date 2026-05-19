import Link from "next/link";
import { getTransactions } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { FileRow, formatTransactionMeta } from "@/components/ui/file-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Active files"
        title="Transactions"
        description={`${transactions.length} contract${transactions.length === 1 ? "" : "s"} in the system.`}
      >
        <Link href="/intake/transaction">
          <Button>
            <Plus className="h-4 w-4" />
            New contract
          </Button>
        </Link>
      </PageHeader>

      {transactions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No transactions yet"
          description="After contract execution, enter dates here once. Every option-period, financing, and closing deadline gets pinned automatically."
          actionLabel="Start contract intake"
          actionHref="/intake/transaction"
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <FileRow
              key={t.id}
              href={`/transactions/${t.id}`}
              type="transaction"
              address={t.property_address}
              meta={formatTransactionMeta(t.closing_date, t.side)}
              status={t.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
