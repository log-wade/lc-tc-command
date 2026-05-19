import Link from "next/link";
import { getTransactions } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { formatDate, statusColor } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-stone-600">{transactions.length} files</p>
        </div>
        <Link
          href="/intake/transaction"
          className="rounded-lg bg-[#1a2332] px-4 py-2 text-sm font-medium text-white"
        >
          New Contract Intake
        </Link>
      </header>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Side</th>
              <th className="px-4 py-3">Effective</th>
              <th className="px-4 py-3">Closing</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/transactions/${t.id}`}
                    className="font-medium text-amber-800 hover:underline"
                  >
                    {t.property_address}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize">{t.side}</td>
                <td className="px-4 py-3">{formatDate(t.effective_date)}</td>
                <td className="px-4 py-3">{formatDate(t.closing_date)}</td>
                <td className="px-4 py-3">
                  <Badge className={statusColor(t.status)}>{t.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
