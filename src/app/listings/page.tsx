import Link from "next/link";
import { getListings } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, statusColor } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const listings = await getListings();

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Listings</h1>
          <p className="text-sm text-stone-600">{listings.length} files</p>
        </div>
        <Link
          href="/intake/listing"
          className="rounded-lg bg-[#1a2332] px-4 py-2 text-sm font-medium text-white"
        >
          New Listing Intake
        </Link>
      </header>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">County</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-t border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-3">
                  <Link href={`/listings/${l.id}`} className="font-medium text-amber-800 hover:underline">
                    {l.property_address}
                  </Link>
                </td>
                <td className="px-4 py-3 text-stone-600">{l.county ?? "—"}</td>
                <td className="px-4 py-3">{formatCurrency(l.list_price)}</td>
                <td className="px-4 py-3">
                  <Badge className={statusColor(l.status)}>{l.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={statusColor(l.compliance_status ?? "pending")}>
                    {l.compliance_status ?? "pending"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
