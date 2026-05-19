import { TransactionIntakeForm } from "@/components/intake/transaction-form";

export default function TransactionIntakePage() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Layer 1 — Intake
        </p>
        <h1 className="font-serif text-2xl font-bold">New Contract Questionnaire</h1>
        <p className="mt-1 text-sm text-stone-600">
          Deadline engine computes all Texas residential milestones from effective date on submit.
        </p>
      </header>
      <TransactionIntakeForm />
    </div>
  );
}
