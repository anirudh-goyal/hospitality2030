"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
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
    <section className="mb-8">
      <div className="section-label mb-4">Suggested Gesture</div>
      <Card className="p-5 border-l-2 border-l-[var(--accent)] gap-3">
        <div
          className="font-display"
          style={{ fontSize: "1.25rem", fontWeight: 500 }}
        >
          {primary.title}
        </div>
        <p className="text-[var(--text-secondary)]">{primary.rationale}</p>
        <div className="flex justify-between items-center mt-1">
          <div className="font-mono text-[0.8125rem] text-[var(--text-tertiary)]">
            {scheduled
              ? `Scheduled - ${primary.availability}`
              : `Est. HKD ${primary.estCostHkd.toLocaleString()} - ${primary.availability}`}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="font-mono text-[0.8125rem] bg-transparent border-[var(--border)] text-[var(--accent)] hover:bg-[var(--elevated)] hover:text-[var(--accent)]"
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
