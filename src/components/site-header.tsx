import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export type Crumb = { label: string; href?: string };

export function SiteHeader({
  crumbs,
  right,
}: {
  crumbs: Crumb[];
  right?: ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <SidebarTrigger className="-ml-1 text-[var(--text-secondary)]" />
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4 bg-[var(--border)]"
        />
        <nav className="flex items-center gap-1.5 text-[0.875rem] min-w-0">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span key={i} className="flex items-center gap-1.5 min-w-0">
                {i > 0 ? (
                  <ChevronRight className="size-3.5 text-[var(--text-tertiary)] shrink-0" />
                ) : null}
                {c.href && !last ? (
                  <Link
                    href={c.href}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors truncate"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span
                    className={
                      last
                        ? "text-[var(--text-primary)] font-medium truncate"
                        : "text-[var(--text-tertiary)] truncate"
                    }
                  >
                    {c.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">{right}</div>
      </div>
    </header>
  );
}
