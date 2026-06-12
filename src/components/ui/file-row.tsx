import Link from "next/link";
import { ChevronRight, Home, FileText } from "lucide-react";
import { Badge } from "./badge";
import { cn, formatCurrency, formatDate, statusColor } from "@/lib/utils";

export function FileRow({
  href,
  type,
  address,
  meta,
  status,
  urgent,
}: {
  href: string;
  type: "listing" | "transaction";
  address: string;
  meta: string;
  status: string;
  urgent?: boolean;
}) {
  const Icon = type === "listing" ? Home : FileText;
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-xl border border-border bg-surface-card px-4 py-3.5 transition-all hover:border-brand-hero/40 hover:shadow-[var(--shadow-card)]",
        urgent && "border-urgent/30 bg-urgent-soft/30"
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          type === "listing" ? "bg-info-soft text-brand-teal" : "bg-brand-hero/15 text-brand-hero"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink group-hover:text-brand-hero">{address}</p>
        <p className="mt-0.5 truncate text-sm text-ink-muted">{meta}</p>
      </div>
      <Badge className={cn("shrink-0 capitalize", statusColor(status))}>{status.replace(/_/g, " ")}</Badge>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted/50 transition group-hover:text-brand-coral" />
    </Link>
  );
}

export function formatListingMeta(price?: number | null, county?: string | null) {
  const parts = [formatCurrency(price), county].filter((p) => p && p !== "—");
  return parts.join(" · ") || "No details yet";
}

export function formatTransactionMeta(closing?: string | null, side?: string) {
  const parts = [
    closing ? `Close ${formatDate(closing)}` : null,
    side ? `${side} side` : null,
  ].filter(Boolean);
  return parts.join(" · ") || "Dates pending";
}
