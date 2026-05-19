"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";

const BARE_ROUTES = ["/login"];

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (BARE_ROUTES.some((r) => pathname.startsWith(r))) {
    return <>{children}</>;
  }
  return <AppShell>{children}</AppShell>;
}
