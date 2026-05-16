import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Signal = {
  _id: string;
  platform: string;
  venue: string;
  reviewDateIso: string;
  excerpt: string;
  extractedTags: string[];
};

export function ExternalSignalsSection({
  signals,
  headless = false,
}: {
  signals: Signal[];
  headless?: boolean;
}) {
  if (!signals.length) {
    return (
      <section>
        {headless ? null : <div className="section-label mb-3">External Signals</div>}
        <p className="text-[0.875rem] text-[var(--text-tertiary)]">
          Signals are visible to Front Desk and Concierge roles.
        </p>
      </section>
    );
  }
  return (
    <section>
      {headless ? null : <div className="section-label mb-3">External Signals</div>}
      <div className="flex flex-col gap-3">
        {signals.map((s) => (
          <Card key={s._id} className="p-5 gap-3">
            <p className="text-[0.9375rem] leading-relaxed text-[var(--text-primary)]">
              &ldquo;{s.excerpt}&rdquo;
            </p>
            <div className="flex flex-wrap gap-2">
              {s.extractedTags.map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="font-mono text-[0.6875rem] text-[var(--text-secondary)] border-[var(--border)]"
                >
                  {t}
                </Badge>
              ))}
            </div>
            <div className="font-mono text-[0.75rem] text-[var(--text-tertiary)]">
              {s.platform} · {s.venue} ·{" "}
              {new Date(s.reviewDateIso).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
