import { Card, CardContent, CardHeader } from "@/components/ui/card";

const TEMPLATES = [
  { id: "tpl-1", name: "Listing Intro / What to Expect", category: "listing" },
  { id: "tpl-3", name: "We Are Live", category: "listing" },
  { id: "tpl-4", name: "Weekly Tuesday Listing Update", category: "listing" },
  { id: "tpl-5", name: "LA Recap (Monday)", category: "internal" },
  { id: "tpl-6", name: "Congrats & What to Expect", category: "transaction" },
  { id: "tpl-7", name: "Title + Lender Intro", category: "transaction" },
  { id: "tpl-8", name: "Weekly Tuesday Transaction Update", category: "transaction" },
  { id: "tpl-9", name: "Closing Appointment Confirmation", category: "transaction" },
  { id: "tpl-10", name: "Post-Closing Congrats + Review", category: "transaction" },
];

export default function TemplatesPage() {
  return (
    <div className="p-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Layer 4 — Communications
        </p>
        <h1 className="font-serif text-2xl font-bold">Template Library</h1>
        <p className="text-sm text-stone-600">
          Broker-approved templates (Appendix B). All sends logged; novel outputs require review.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <span className="font-mono text-xs text-amber-700">{t.id}</span>
              <h3 className="font-medium">{t.name}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-xs capitalize text-stone-500">{t.category}</p>
              <p className="mt-2 text-xs text-stone-400">Requires licensee review before send</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
