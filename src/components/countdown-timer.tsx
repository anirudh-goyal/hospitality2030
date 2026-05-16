"use client";

import { useEffect, useState } from "react";

function format(targetIso: string, now: number): string {
  const ms = new Date(targetIso).getTime() - now;
  if (ms < 0) return "Arrived";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `Arriving in ${minutes}m`;
  return `Arriving in ${hours}h ${minutes}m`;
}

export function CountdownTimer({ targetIso }: { targetIso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="font-mono text-[0.9375rem] text-[var(--accent)] mt-3">
      {format(targetIso, now)}
    </div>
  );
}
