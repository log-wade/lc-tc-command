import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(n?: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  });
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    intake: "bg-amber-100 text-amber-900",
    active: "bg-emerald-100 text-emerald-900",
    pending: "bg-blue-100 text-blue-900",
    sold: "bg-slate-100 text-slate-700",
    closed: "bg-slate-100 text-slate-700",
    coming_soon: "bg-violet-100 text-violet-900",
    submitted: "bg-sky-100 text-sky-900",
    approved: "bg-emerald-100 text-emerald-900",
    kick_back: "bg-red-100 text-red-900",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}
