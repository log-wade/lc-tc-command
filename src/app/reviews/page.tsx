import { getReviewQueue } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ReviewActions } from "@/components/reviews/review-actions";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getReviewQueue();

  return (
    <div className="p-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Layer 7 — Human-in-Loop
        </p>
        <h1 className="font-serif text-2xl font-bold">Review Queue</h1>
        <p className="text-sm text-stone-600">
          All AI drafts and ministerial sends requiring licensee approval before transmission.
        </p>
      </header>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-stone-500">
              Queue is clear — nothing pending review.
            </CardContent>
          </Card>
        ) : (
          reviews.map((r: Record<string, unknown>) => (
            <Card key={String(r.id)}>
              <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      r.priority === "P0"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {String(r.priority ?? "P2")}
                  </Badge>
                  <span className="text-xs uppercase text-stone-500">
                    {String(r.item_type ?? "communication")}
                  </span>
                </div>
                <ReviewActions reviewId={String(r.id)} />
              </CardHeader>
              <CardContent>
                <h3 className="font-medium">{String(r.title)}</h3>
                {r.file_id != null && (
                  <p className="mt-1 text-xs text-stone-500">
                    {String(r.file_type)}/{String(r.file_id)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
