"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  FileText,
  Inbox,
  ClipboardCheck,
  Shield,
  Plus,
  Menu,
  X,
  Mail,
  ChevronRight,
  Bot,
  BarChart3,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/brand-mark";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { TourRestartButton } from "@/components/onboarding/tour-restart-button";

const workNav = [
  { href: "/assistant", label: "Assistant", icon: Bot, desc: "AI chat & voice", tourId: "nav-assistant" },
  { href: "/", label: "Today", icon: LayoutDashboard, desc: "Your command center", tourId: "nav-today" },
  { href: "/reviews", label: "Review queue", icon: ClipboardCheck, desc: "Approve before send", tourId: "nav-review" },
  { href: "/inbox", label: "Inbox triage", icon: Inbox, desc: "Classify incoming mail", tourId: "nav-inbox" },
];

const filesNav = [
  { href: "/listings", label: "Listings", icon: Home, tourId: "nav-listings" },
  { href: "/transactions", label: "Transactions", icon: FileText, tourId: "nav-transactions" },
];

const systemNav = [
  { href: "/broker", label: "Broker dashboard", icon: BarChart3 },
  { href: "/templates", label: "Email templates", icon: Mail },
  { href: "/audit", label: "Audit log", icon: Shield },
];

function SignOutButton() {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  return (
    <button
      type="button"
      onClick={signOut}
      className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-ink-muted transition hover:bg-white/70 hover:text-ink"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </button>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  desc,
  active,
  onClick,
  tourId,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc?: string;
  active: boolean;
  onClick?: () => void;
  tourId?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      data-tour={tourId}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
        active
          ? "bg-white text-ink shadow-sm ring-1 ring-sidebar-border"
          : "text-ink-muted hover:bg-white/60 hover:text-ink"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-brand-coral/15 text-brand-coral"
            : "bg-white/50 text-ink-muted group-hover:bg-white group-hover:text-brand-hero"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        {desc && (
          <span className="mt-0.5 block truncate text-[11px] text-ink-muted/80 group-hover:text-ink-muted">
            {desc}
          </span>
        )}
      </span>
      {active && <ChevronRight className="h-4 w-4 shrink-0 text-brand-coral" />}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-sidebar-border px-4 py-5">
        <BrandMark />
        <p className="mt-3 text-[11px] leading-snug text-ink-muted">
          Keller Williams Austin Northwest
        </p>
      </div>

      <div className="space-y-6 p-3">
        <div data-tour="start-here">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-brand-teal">
            Start here
          </p>
          <div className="grid gap-2">
            <Link
              href="/intake/listing"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-xl bg-brand-coral px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#e04f50]"
            >
              <Plus className="h-4 w-4" />
              New listing intake
            </Link>
            <Link
              href="/intake/transaction"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-xl border border-sidebar-border bg-white px-3 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:border-brand-hero/40 hover:text-brand-hero"
            >
              <Plus className="h-4 w-4" />
              New contract intake
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
            Your day
          </p>
          <nav className="space-y-0.5">
            {workNav.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                onClick={onNavigate}
              />
            ))}
          </nav>
        </div>

        <div data-tour="nav-files">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
            Active files
          </p>
          <nav className="space-y-0.5">
            {filesNav.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                onClick={onNavigate}
              />
            ))}
          </nav>
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
            System
          </p>
          <nav className="space-y-0.5">
            {systemNav.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                onClick={onNavigate}
              />
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-auto border-t border-sidebar-border p-4">
        <p className="text-sm font-medium text-ink">Carly Bryant</p>
        <p className="text-xs text-ink-muted">Listing & Transaction Coordinator</p>
        <p className="mt-1 text-[11px] text-ink-muted/80">TREC #723235-SA</p>
        <TourRestartButton />
        <SignOutButton />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener("tour-open-sidebar", open);
    return () => window.removeEventListener("tour-open-sidebar", open);
  }, []);

  return (
    <OnboardingProvider>
    <div className="flex min-h-screen">
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-brand-text/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-end p-2">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-ink-muted hover:bg-white/70 hover:text-ink"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/80 bg-surface-card/90 px-4 backdrop-blur-md lg:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-ink-muted hover:bg-brand-bg lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3" data-tour="header-actions">
            <Button href="/intake/listing" variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Plus className="h-4 w-4" />
              Listing
            </Button>
            <Button href="/intake/transaction" size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New contract</span>
              <span className="sm:hidden">Contract</span>
            </Button>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
    </OnboardingProvider>
  );
}
