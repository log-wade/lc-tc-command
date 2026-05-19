import Link from "next/link";
import { AlertTriangle, Clock, Calendar } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export function DeadlineRow({
  label,
  dueAt,
  fileHref,
  fileLabel,
  overdue,
  dueToday,
}: {
  label: string;
  dueAt: string;
  fileHref?: string;
  fileLabel?: string;
  overdue?: boolean;
  dueToday?: boolean;
}) {
  const Icon = overdue ? AlertTriangle : dueToday ? Clock : Calendar;
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        overdue
          ? "border-urgent/40 bg-urgent-soft"
          : dueToday
            ? "border-warning/40 bg-warning-soft"
            : "border-border bg-surface-card"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          overdue ? "bg-urgent/10 text-urgent" : dueToday ? "bg-amber-100 text-warning" : "bg-stone-100 text-ink-muted"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        {fileLabel && <p className="truncate text-xs text-ink-muted">{fileLabel}</p>}
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-medium tabular-nums", overdue && "text-urgent")}>
          {formatDate(dueAt)}
        </p>
        {overdue && <p className="text-[11px] font-medium text-urgent">Overdue</p>}
        {dueToday && !overdue && <p className="text-[11px] font-medium text-warning">Due today</p>}
      </div>
    </div>
  );

  if (fileHref) {
    return (
      <Link href={fileHref} className="block transition hover:opacity-90">
        {content}
      </Link>
    );
  }
  return content;
}
