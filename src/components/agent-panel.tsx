"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { Activity, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentToolRow } from "./agent-tool-row";

const PULSE_KEYFRAMES = `
  @keyframes pulse-dot { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
  @keyframes blink { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
`;

export function PipelineStrip({
  briefId,
  onOpenActivity,
}: {
  briefId: Id<"briefs"> | undefined;
  onOpenActivity: () => void;
}) {
  const events = useQuery(
    api.agentEvents.listForBrief,
    briefId ? { briefId } : "skip"
  );
  const total = events?.length ?? 0;
  const recent = events?.slice(-4) ?? [];

  return (
    <section>
      <style>{PULSE_KEYFRAMES}</style>
      <Card className="px-5 py-4 gap-3 flex-row items-center">
        <div className="flex items-center gap-2 shrink-0">
          <Activity className="size-3.5 text-[var(--accent)]" />
          <span className="section-label text-[var(--text-secondary)]">
            Intelligence Pipeline
          </span>
          <span
            className="inline-block size-1.5 rounded-full"
            style={{
              background: "var(--accent)",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          />
        </div>
        <div className="text-[0.8125rem] text-[var(--text-secondary)] shrink-0">
          Pre-Arrival Agent · {total} events · 18h ago
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden">
          {recent.map((e) => (
            <Badge
              key={e._id}
              variant="outline"
              className="font-mono text-[0.6875rem] border-[var(--border)] text-[var(--text-tertiary)] shrink-0"
            >
              {e.tool ?? e.eventType}
            </Badge>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenActivity}
          className="font-medium text-[0.8125rem] h-auto py-1.5 px-3 bg-transparent border-[var(--border)] text-[var(--accent)] hover:bg-[var(--elevated)] hover:text-[var(--accent)] shrink-0"
        >
          View activity
          <ArrowRight className="size-3 ml-1" />
        </Button>
      </Card>
    </section>
  );
}

export function AgentTimeline({
  briefId,
}: {
  briefId: Id<"briefs"> | undefined;
}) {
  const events = useQuery(
    api.agentEvents.listForBrief,
    briefId ? { briefId } : "skip"
  );
  const [replaying, setReplaying] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!events) return;
    if (!replaying) setVisibleCount(events.length);
  }, [events, replaying]);

  useEffect(() => {
    if (!replaying || paused || !events) return;
    if (visibleCount >= events.length) {
      setReplaying(false);
      return;
    }
    const id = setTimeout(() => {
      setVisibleCount((c) => c + 1);
      requestAnimationFrame(() => {
        const el = scrollRef.current?.parentElement;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
    }, 140);
    return () => clearTimeout(id);
  }, [replaying, paused, visibleCount, events]);

  function startReplay() {
    if (!events) return;
    setVisibleCount(0);
    setReplaying(true);
    setPaused(false);
  }

  const total = events?.length ?? 0;
  const shown = events
    ? events.slice(0, replaying ? visibleCount : total)
    : [];

  return (
    <section className="flex flex-col gap-4">
      <style>{PULSE_KEYFRAMES}</style>
      <Card className="p-5 gap-2 flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-[var(--accent)]" />
            <h2
              className="text-[1.125rem] font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Pre-Arrival Research Agent
            </h2>
            <Badge
              variant="outline"
              className="font-mono text-[0.6875rem] text-[var(--accent)] border-[var(--accent)]"
            >
              Complete
            </Badge>
          </div>
          <div className="font-mono text-[0.8125rem] text-[var(--text-tertiary)] mt-1">
            Ran 18 hours ago · {total} events · 42 minutes total
          </div>
        </div>
        <Button
          onClick={replaying ? () => setPaused((p) => !p) : startReplay}
          disabled={!events || events.length === 0}
          variant="outline"
          className="font-medium text-[0.8125rem] bg-transparent border-[var(--border)] text-[var(--accent)] hover:bg-[var(--elevated)] hover:text-[var(--accent)]"
        >
          {replaying ? (
            paused ? (
              <>
                <Play className="size-3.5 mr-1.5" /> Resume
              </>
            ) : (
              <>
                <Pause className="size-3.5 mr-1.5" /> Pause
              </>
            )
          ) : (
            <>
              <RotateCcw className="size-3.5 mr-1.5" /> Replay
            </>
          )}
        </Button>
      </Card>

      <Card className="p-0 overflow-hidden">
        <ScrollArea className="h-[420px] px-5 py-3">
          <div ref={scrollRef}>
            {shown.map((e: Doc<"agentEvents">, i) => (
              <AgentToolRow
                key={e._id}
                timestampIso={e.timestampIso}
                eventType={e.eventType}
                tool={e.tool}
                params={e.params}
                resultPreview={e.resultPreview}
                showCursor={replaying && i === shown.length - 1}
              />
            ))}
          </div>
        </ScrollArea>
      </Card>
    </section>
  );
}
