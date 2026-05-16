import { Card } from "@/components/ui/card";

type KeyFact = { fact: string; source: string };

export function KeyFactsSection({ facts }: { facts: KeyFact[] }) {
  if (!facts.length) return null;
  return (
    <section>
      <div className="section-label mb-3">Three Key Facts</div>
      <div className="grid grid-cols-3 gap-4">
        {facts.slice(0, 3).map((f, i) => (
          <Card
            key={i}
            className="px-5 py-4 border-l-2 border-l-[var(--accent)] gap-3 h-full"
          >
            <p className="text-[0.9375rem] leading-snug text-[var(--text-primary)]">
              {f.fact}
            </p>
            <div className="font-mono text-[0.75rem] text-[var(--text-tertiary)] mt-auto">
              {f.source}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
