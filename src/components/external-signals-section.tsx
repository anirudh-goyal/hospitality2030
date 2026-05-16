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

export function ExternalSignalsSection({ signals }: { signals: Signal[] }) {
  if (!signals.length) return null;
  return (
    <section className="mb-8">
      <div className="section-label mb-4">External Signals</div>
      <div className="flex flex-col gap-4">
        {signals.map((s) => (
          <Card key={s._id} className="p-5 gap-3">
            <p
              className="font-display italic text-[var(--text-primary)] leading-relaxed"
              style={{ fontSize: "1rem" }}
            >
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
            <div className="font-mono text-xs text-[var(--text-tertiary)]">
              {s.platform} - {s.venue} -{" "}
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
