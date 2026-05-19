import { PageHeader } from "@/components/ui/page-header";
import { AssistantShell } from "@/components/assistant/assistant-shell";

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="AI coordination"
        title="Assistant"
        description="Chat or speak with your LC/TC agent. It can check deadlines, review queue, templates, classify email, and run autonomous workflows — nothing sends without your approval."
      />
      <AssistantShell />
    </div>
  );
}
