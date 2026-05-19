import { ListingWizard } from "@/components/intake/listing-wizard";
import { PageHeader } from "@/components/ui/page-header";

export default function ListingIntakePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="New file"
        title="Listing intake"
        description="Four quick steps. Required fields are marked. Nothing emails the seller until you approve it in the review queue."
      />
      <ListingWizard />
    </div>
  );
}
