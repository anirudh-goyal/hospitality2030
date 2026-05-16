import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type KeyFact = { fact: string; source: string };

export function KeyFactsSection({ facts }: { facts: KeyFact[] }) {
  if (!facts.length) return null;
  return (
    <section>
      <div className="section-label mb-3">Three Key Facts</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-[var(--accent)]/[0.04] *:data-[slot=card]:to-[var(--card)] *:data-[slot=card]:shadow-xs">
        {facts.slice(0, 3).map((f, i) => (
          <Card key={i} className="gap-3">
            <CardHeader className="gap-2">
              <CardDescription className="text-[var(--text-tertiary)] font-mono uppercase tracking-wider text-[0.6875rem]">
                {`Fact 0${i + 1}`}
              </CardDescription>
              <CardTitle className="text-[1rem] font-medium leading-snug text-[var(--text-primary)]">
                {f.fact}
              </CardTitle>
            </CardHeader>
            <CardFooter className="rounded-b-xl border-t border-[var(--border)] bg-transparent">
              <div className="font-mono text-[0.75rem] text-[var(--text-tertiary)]">
                {f.source}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
