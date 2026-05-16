"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";

export function AgentPanel({
  briefId,
}: {
  briefId: Id<"briefs"> | undefined;
}) {
  const events = useQuery(
    api.agentEvents.listForBrief,
    briefId ? { briefId } : "skip"
  );
  return (
    <aside className="w-72 py-6 shrink-0">
      <div className="section-label mb-3 flex items-center gap-2">
        Intelligence Pipeline
        <span
          className="inline-block size-2 rounded-full"
          style={{ background: "var(--accent)" }}
        />
      </div>
      <Card className="px-4 py-3.5 mb-4 gap-1">
        <div
          className="font-display"
          style={{ fontSize: "1rem", fontWeight: 500 }}
        >
          Pre-Arrival Research Agent
        </div>
        <div className="font-mono text-xs text-[var(--text-tertiary)]">
          Ran 18 hours ago - {events ? `${events.length} events` : "..."}
        </div>
      </Card>
      <div className="font-mono text-xs text-[var(--text-tertiary)]">
        Event log filled in Phase 5.
      </div>
    </aside>
  );
}
