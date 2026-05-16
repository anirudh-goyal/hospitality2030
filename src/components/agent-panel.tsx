"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentToolRow } from "./agent-tool-row";

export function AgentPanel({
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
    if (!replaying) setVisibleCount(Math.min(8, events.length));
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
    }, 150);
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
    ? events.slice(0, replaying ? visibleCount : Math.min(8, total))
    : [];

  return (
    <aside className="w-72 py-6 shrink-0">
      <style>{`
        @keyframes pulse-dot { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
        @keyframes blink { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
      `}</style>

      <div className="section-label mb-3 flex items-center gap-2">
        Intelligence Pipeline
        <span
          aria-label="status"
          className="inline-block size-2 rounded-full"
          style={{
            background: "var(--accent)",
            animation: "pulse-dot 2s ease-in-out infinite",
          }}
        />
      </div>

      <Card className="px-4 py-3.5 mb-4 gap-2">
        <div
          className="font-display"
          style={{ fontSize: "1rem", fontWeight: 500 }}
        >
          Pre-Arrival Research Agent
        </div>
        <div className="font-mono text-xs text-[var(--text-tertiary)]">
          Ran 18 hours ago - {total} events
        </div>
        <div>
          <Badge
            variant="outline"
            className="font-mono text-[0.625rem] text-[var(--accent)] border-[var(--border)]"
          >
            Complete
          </Badge>
        </div>
      </Card>

      <ScrollArea className="h-[280px] mb-4 pr-2">
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

      <Button
        onClick={replaying ? () => setPaused((p) => !p) : startReplay}
        disabled={!events || events.length === 0}
        variant="outline"
        className="w-full font-mono text-[0.8125rem] bg-transparent border-[var(--border)] text-[var(--accent)] hover:bg-[var(--elevated)] hover:text-[var(--accent)]"
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
    </aside>
  );
}
