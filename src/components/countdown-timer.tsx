"use client";

import { useEffect, useState } from "react";

function format(targetIso: string, now: number): string {
  const ms = new Date(targetIso).getTime() - now;
  if (ms < 0) return "Arrived";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function CountdownTimer({ targetIso }: { targetIso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--accent)]/40 bg-[var(--accent-muted)]">
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ background: "var(--accent)" }}
      />
      <span className="font-mono text-[0.8125rem] font-medium text-[var(--accent)]">
        Arriving in {format(targetIso, now)}
      </span>
    </div>
  );
}
