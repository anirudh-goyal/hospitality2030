"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Sparkles } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DelightModal } from "./delight-modal";

export function GestureSection({
  guestId,
  guestName,
}: {
  guestId: Id<"guests">;
  guestName: string;
}) {
  const [open, setOpen] = useState(false);
  const brief = useQuery(api.briefs.getForGuest, { guestId });
  if (!brief) return null;

  const primary = brief.suggestedGestures[0];
  if (!primary) return null;

  const scheduled = primary.status === "scheduled";

  return (
    <section className="h-full">
      <div className="section-label mb-3 flex items-center gap-2">
        <Sparkles className="size-3.5 text-[var(--accent)]" />
        Suggested Gesture
      </div>
      <Card className="p-6 border-l-2 border-l-[var(--accent)] gap-4 h-[calc(100%-1.75rem)]">
        <div className="flex items-start justify-between gap-3">
          <h2
            className="text-[1.5rem] font-medium leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {primary.title}
          </h2>
          {scheduled ? (
            <Badge
              className="font-mono text-[0.6875rem] shrink-0"
              style={{
                background: "var(--accent-muted)",
                color: "var(--accent)",
              }}
            >
              Scheduled
            </Badge>
          ) : null}
        </div>

        <div className="font-mono text-[0.8125rem] text-[var(--text-secondary)]">
          {scheduled
            ? primary.availability
            : `HKD ${primary.estCostHkd.toLocaleString()} · ${primary.availability}`}
        </div>

        <p className="text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
          {primary.rationale}
        </p>

        <div className="flex items-center gap-3 mt-auto pt-2">
          {!scheduled ? (
            <Button
              size="sm"
              onClick={() => setOpen(true)}
              className="font-medium text-[0.8125rem] h-auto py-2.5 px-4 border-0"
              style={{ background: "var(--accent)", color: "#0a0909" }}
            >
              Approve and schedule
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="font-medium text-[0.8125rem] h-auto py-2.5 px-4 bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--elevated)] hover:text-[var(--text-primary)]"
          >
            View all options
          </Button>
        </div>
      </Card>
      <DelightModal
        open={open}
        onOpenChange={setOpen}
        guestName={guestName}
        briefId={brief._id}
        gestures={brief.suggestedGestures}
        generatedAtIso={brief.generatedAtIso}
      />
    </section>
  );
}
