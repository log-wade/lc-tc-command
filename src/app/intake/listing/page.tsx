import { ListingIntakeForm } from "@/components/intake/listing-form";

export default function ListingIntakePage() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Layer 1 — Intake
        </p>
        <h1 className="font-serif text-2xl font-bold">New Listing Questionnaire</h1>
        <p className="mt-1 text-sm text-stone-600">
          Required fields gate submission. Intro email queued for review within 24 business hours.
        </p>
      </header>
      <ListingIntakeForm />
    </div>
  );
}
