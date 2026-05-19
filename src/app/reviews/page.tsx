import { getReviewQueue } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { ReviewActions } from "@/components/reviews/review-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getReviewQueue();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Human-in-loop"
        title="Review queue"
        description="Approve or reject before anything sends. AI drafts and system emails land here first."
      />

      {reviews.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Queue is clear"
          description="When you submit an intake or the system drafts a Tuesday update, it will show up here for your approval."
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r: Record<string, unknown>) => (
            <li
              key={String(r.id)}
              className="rounded-2xl border border-border bg-surface-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${
                      r.priority === "P0"
                        ? "bg-urgent-soft text-urgent"
                        : "bg-warning-soft text-warning"
                    }`}
                  >
                    {String(r.priority ?? "P2")}
                  </span>
                  <h3 className="mt-2 font-medium text-ink">{String(r.title)}</h3>
                  {r.file_id != null && (
                    <p className="mt-1 text-xs text-ink-muted">
                      {String(r.file_type)}/{String(r.file_id)}
                    </p>
                  )}
                </div>
                <ReviewActions reviewId={String(r.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
