import Link from "next/link";
import { AlertTriangle, ClipboardCheck, CalendarClock, Sparkles } from "lucide-react";
import type { DashboardStats } from "@/lib/types";
import { Button } from "@/components/ui/button";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function TodayHero({ stats }: { stats: DashboardStats }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dayName = dayNames[now.getDay()];
  const isTuesday = now.getDay() === 2;

  const needsAttention =
    stats.overdueDeadlines + stats.pendingReviews + stats.dueToday;

  return (
    <section className="animate-fade-up overflow-hidden rounded-2xl bg-linear-to-br from-brand-hero to-brand-teal text-white shadow-[var(--shadow-pop)]">
      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-coral/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-pink/25 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-white/85">
              <Sparkles className="h-4 w-4 text-brand-yellow" />
              {dayName} · {now.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold uppercase sm:text-4xl">
              {greeting}, Carly
            </h1>
            <p className="mt-2 max-w-lg text-base text-white/90">
              {needsAttention === 0
                ? "You're caught up. Use the quick actions below when a new file comes in."
                : `${needsAttention} item${needsAttention === 1 ? "" : "s"} need your attention today.`}
            </p>
            {isTuesday && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1.5 text-sm text-white">
                <CalendarClock className="h-4 w-4" />
                Tuesday updates due by 3:00 PM CT
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/intake/listing" size="lg" className="bg-white text-brand-hero hover:bg-brand-bg">
              New listing
            </Button>
            <Button
              href="/intake/transaction"
              size="lg"
              variant="secondary"
              className="border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/20 hover:text-white"
            >
              New contract
            </Button>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
          <StatPill
            icon={AlertTriangle}
            label="Overdue"
            value={stats.overdueDeadlines}
            href="/"
            urgent={stats.overdueDeadlines > 0}
          />
          <StatPill
            icon={CalendarClock}
            label="Due today"
            value={stats.dueToday}
            href="/"
            warn={stats.dueToday > 0}
          />
          <StatPill
            icon={ClipboardCheck}
            label="Awaiting review"
            value={stats.pendingReviews}
            href="/reviews"
          />
        </div>
      </div>
    </section>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  href,
  urgent,
  warn,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  href: string;
  urgent?: boolean;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 transition hover:bg-white/15 ${
        urgent
          ? "bg-urgent/25 ring-urgent/40"
          : warn
            ? "bg-brand-peach/25 ring-brand-peach/40"
            : "bg-white/10 ring-white/20"
      }`}
    >
      <Icon className={`h-5 w-5 ${urgent ? "text-red-100" : "text-brand-yellow"}`} />
      <div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-white/75">{label}</p>
      </div>
    </Link>
  );
}
