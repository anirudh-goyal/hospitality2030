import { Card } from "@/components/ui/card";

type KeyFact = { fact: string; source: string };

export function KeyFactsSection({ facts }: { facts: KeyFact[] }) {
  if (!facts.length) return null;
  return (
    <section>
      <div className="section-label mb-3">Highlights</div>
      <Card className="p-0 gap-0 overflow-hidden">
        {facts.slice(0, 3).map((f, i) => (
          <div
            key={i}
            className={
              "flex items-baseline gap-5 px-5 py-4" +
              (i > 0 ? " border-t border-[var(--border)]" : "")
            }
          >
            <span className="font-mono text-[0.6875rem] text-[var(--text-tertiary)] w-6 shrink-0 tabular-nums">
              0{i + 1}
            </span>
            <p className="flex-1 text-[0.9375rem] leading-snug text-[var(--text-primary)]">
              {f.fact}
            </p>
            <span className="font-mono text-[0.75rem] text-[var(--text-tertiary)] shrink-0">
              {f.source}
            </span>
          </div>
        ))}
      </Card>
    </section>
  );
}
