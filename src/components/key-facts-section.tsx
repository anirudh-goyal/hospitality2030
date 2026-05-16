import { Card } from "@/components/ui/card";

type KeyFact = { fact: string; source: string };

export function KeyFactsSection({ facts }: { facts: KeyFact[] }) {
  if (!facts.length) return null;
  return (
    <section className="mb-8">
      <div className="section-label mb-4">Three Key Facts</div>
      <div className="flex flex-col gap-3">
        {facts.slice(0, 3).map((f, i) => (
          <Card
            key={i}
            className="px-5 py-4 border-l-2 border-l-[var(--accent)] gap-1.5"
          >
            <div className="text-[var(--text-primary)]">{f.fact}</div>
            <div className="font-mono text-xs text-[var(--text-tertiary)]">
              {f.source}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
