import { TransactionWizard } from "@/components/intake/transaction-wizard";
import { PageHeader } from "@/components/ui/page-header";

export default function TransactionIntakePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="New file"
        title="Contract intake"
        description="Enter the executed contract dates once — the system calculates every Texas deadline and queues your congrats email."
      />
      <TransactionWizard />
    </div>
  );
}
