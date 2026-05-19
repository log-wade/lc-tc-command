import Link from "next/link";
import { getListings } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { FileRow, formatListingMeta } from "@/components/ui/file-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Home, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const listings = await getListings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Active files"
        title="Listings"
        description={`${listings.length} listing${listings.length === 1 ? "" : "s"} in the system.`}
      >
        <Button href="/intake/listing">
          <Plus className="h-4 w-4" />
          New listing
        </Button>
      </PageHeader>

      {listings.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No listings yet"
          description="When an agent sends the listing questionnaire, start here. You'll have an intro email ready for review within minutes."
          actionLabel="Start listing intake"
          actionHref="/intake/listing"
        />
      ) : (
        <div className="space-y-2">
          {listings.map((l) => (
            <FileRow
              key={l.id}
              href={`/listings/${l.id}`}
              type="listing"
              address={l.property_address}
              meta={formatListingMeta(l.list_price, l.county)}
              status={l.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
