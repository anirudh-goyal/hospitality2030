"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Sparkles } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <Card className="h-[calc(100%-1.75rem)] gap-4 bg-gradient-to-t from-[var(--accent)]/[0.06] to-[var(--card)] shadow-xs">
        <CardHeader>
          <CardDescription className="font-mono text-[0.75rem] uppercase tracking-wider text-[var(--text-tertiary)]">
            Pre-arrival recommendation
          </CardDescription>
          <CardTitle className="text-[1.5rem] font-medium leading-tight text-[var(--text-primary)]">
            {primary.title}
          </CardTitle>
          <CardAction>
            {scheduled ? (
              <Badge
                className="font-mono text-[0.6875rem]"
                style={{
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                }}
              >
                Scheduled
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="font-mono text-[0.6875rem] text-[var(--accent)] border-[var(--accent)]/40"
              >
                {scheduled
                  ? primary.availability
                  : `HKD ${primary.estCostHkd.toLocaleString()}`}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
            {primary.rationale}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-3 rounded-b-xl border-t border-[var(--border)] bg-transparent">
          <span className="font-mono text-[0.8125rem] text-[var(--text-tertiary)]">
            {primary.availability}
          </span>
          <div className="flex items-center gap-2">
            {!scheduled ? (
              <Button
                size="sm"
                onClick={() => setOpen(true)}
                className="font-medium text-[0.8125rem] h-auto py-2 px-3.5 border-0"
                style={{ background: "var(--accent)", color: "#0a0909" }}
              >
                Approve and schedule
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="font-medium text-[0.8125rem] h-auto py-2 px-3.5 bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--elevated)] hover:text-[var(--text-primary)]"
            >
              View options
            </Button>
          </div>
        </CardFooter>
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
