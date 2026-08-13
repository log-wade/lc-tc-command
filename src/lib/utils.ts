import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { centralInstant, isCalendarDate } from "./deadlines/calendar";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(n?: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatDate(d?: string | null): string {
  if (!d) return "—";
  // "YYYY-MM-DD" contract dates are calendar days, not instants — anchor them at
  // midday so rendering in Central never rolls them back to the previous day.
  const value = isCalendarDate(d) ? centralInstant(d.trim(), 12) : new Date(d);
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  });
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    intake: "bg-brand-peach/25 text-ink",
    active: "bg-info-soft text-brand-teal",
    pending: "bg-brand-hero/15 text-brand-hero",
    sold: "bg-brand-bg text-ink-muted",
    closed: "bg-brand-bg text-ink-muted",
    coming_soon: "bg-brand-pink/25 text-ink",
    submitted: "bg-brand-hero/15 text-brand-hero",
    approved: "bg-success-soft text-success",
    kick_back: "bg-red-100 text-red-900",
  };
  return map[status] ?? "bg-brand-bg text-ink-muted";
}
