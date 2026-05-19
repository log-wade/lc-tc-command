import { InboxTriageForm } from "@/components/inbox/triage-form";
import { PageHeader } from "@/components/ui/page-header";

export default function InboxPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="AI assistant"
        title="Inbox triage"
        description="Paste an email to classify priority (P0–P3). Wire-change language auto-escalates — never action from email alone."
      />
      <InboxTriageForm />
    </div>
  );
}
