"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Mic } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV = [
  { href: "/arrivals", label: "Arrivals", icon: LayoutGrid },
  { href: "/capture", label: "Capture", icon: Mic },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-[var(--border)] bg-[var(--bg)] flex flex-col">
      <div className="px-6 py-6">
        <Link
          href="/arrivals"
          className="font-display block text-[var(--text-primary)]"
          style={{ fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.02em" }}
        >
          Sense
        </Link>
      </div>

      <div className="px-3">
        <div className="section-label px-3 mb-2">Navigate</div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
                style={{
                  background: active ? "var(--elevated)" : "transparent",
                  color: active
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                }}
              >
                {active ? (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r"
                    style={{ background: "var(--accent)" }}
                  />
                ) : null}
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1" />

      <div className="px-3 pb-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-[var(--card)] border border-[var(--border)]">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-medium bg-[var(--surface)] text-[var(--text-primary)]">
              SR
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">
              Sofia Reyes
            </div>
            <div className="text-[0.6875rem] text-[var(--text-tertiary)] truncate">
              Housekeeping · Rosewood HK
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
