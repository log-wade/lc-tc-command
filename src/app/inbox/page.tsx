import { InboxTriageForm } from "@/components/inbox/triage-form";

export default function InboxPage() {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Layer 6 — AI Agent
        </p>
        <h1 className="font-serif text-2xl font-bold">Inbox Triage</h1>
        <p className="text-sm text-stone-600">
          Classify inbound email P0–P3. Wire-change signals auto-escalate to Tier 4.
        </p>
      </header>
      <InboxTriageForm />
    </div>
  );
}
