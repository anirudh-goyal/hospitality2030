"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { filterForRole } from "@/lib/role-filter";
import type { Role } from "./role-switcher";

export function ObservationsFeed({
  guestId,
  role,
}: {
  guestId: Id<"guests">;
  role: Role;
}) {
  const observations = useQuery(api.observations.listForGuest, { guestId });
  if (!observations) return null;
  const filtered = filterForRole(observations, role);

  return (
    <section className="mb-8">
      <div className="section-label mb-4">Observations</div>
      <div className="flex flex-col gap-2">
        {filtered.map((o) => (
          <Card key={o._id} className="px-4 py-3.5 gap-1.5">
            <div className="flex gap-3 items-baseline flex-wrap">
              <span className="font-mono text-xs text-[var(--text-tertiary)]">
                {new Date(o.capturedAtIso).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {o.capturedBy.name} - {o.capturedBy.role}
              </span>
              {o.extracted.categories.map((c) => (
                <Badge
                  key={c}
                  variant="outline"
                  className="font-mono text-[0.625rem] py-0 px-1.5 h-auto text-[var(--text-tertiary)] border-[var(--border)]"
                >
                  {c}
                </Badge>
              ))}
            </div>
            <p className="text-[var(--text-primary)]">{o.rawText}</p>
          </Card>
        ))}
        {filtered.length === 0 ? (
          <p className="text-[var(--text-tertiary)]">
            No observations visible for this role.
          </p>
        ) : null}
      </div>
    </section>
  );
}
