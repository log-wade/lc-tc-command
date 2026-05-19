import { PageHeader } from "@/components/ui/page-header";
import { Mail } from "lucide-react";

const TEMPLATES = [
  { id: "tpl-1", name: "Listing intro / What to Expect", when: "Within 24 hrs of intake", category: "Listing" },
  { id: "tpl-3", name: "We Are Live", when: "After go-live approval", category: "Listing" },
  { id: "tpl-4", name: "Weekly Tuesday listing update", when: "Every Tuesday by 3 PM CT", category: "Listing" },
  { id: "tpl-5", name: "LA recap (Monday)", when: "Monday by 5 PM CT", category: "Internal" },
  { id: "tpl-6", name: "Congrats & What to Expect", when: "Within 48 hrs of execution", category: "Transaction" },
  { id: "tpl-7", name: "Title + lender intro", when: "Within 48 hrs of execution", category: "Transaction" },
  { id: "tpl-8", name: "Weekly Tuesday transaction update", when: "Every Tuesday by 3 PM CT", category: "Transaction" },
  { id: "tpl-9", name: "Closing confirmation", when: "When title confirms", category: "Transaction" },
  { id: "tpl-10", name: "Post-closing + review", when: "Within 24 hrs of funding", category: "Transaction" },
];

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Communications"
        title="Email templates"
        description="Broker-approved library. Every send is logged; anything off-template needs your review first."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <article
            key={t.id}
            className="rounded-2xl border border-border bg-surface-card p-5 shadow-sm transition hover:border-accent/30 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-[11px] text-accent">{t.id}</p>
                <h3 className="font-display mt-0.5 font-semibold text-ink">{t.name}</h3>
                <p className="mt-2 text-xs text-ink-muted">{t.when}</p>
                <span className="mt-2 inline-block rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                  {t.category}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
