"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Extracted } from "@/lib/ai/extract-schema";

export function ExtractionPreview({
  partial,
}: {
  partial: Partial<Extracted> | undefined;
}) {
  if (!partial) return null;
  return (
    <Card className="p-5 gap-3 border-l-2 border-l-[var(--accent)]">
      <div className="section-label">Extracted</div>

      {partial.categories?.length ? (
        <div>
          <div className="font-mono text-[0.625rem] text-[var(--text-tertiary)] mb-1">
            Categories
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {partial.categories.map((c) => (
              <Badge
                key={c}
                variant="outline"
                className="font-mono text-[0.6875rem] text-[var(--accent)] border-[var(--border)]"
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {partial.facts?.length ? (
        <div>
          <div className="font-mono text-[0.625rem] text-[var(--text-tertiary)] mb-1">
            Facts
          </div>
          <div className="flex flex-col gap-0.5">
            {partial.facts.map((f, i) => (
              <div
                key={i}
                className="font-mono text-[0.8125rem] text-[var(--text-primary)]"
              >
                <span className="text-[var(--text-tertiary)]">
                  {f?.type ?? ""}:
                </span>{" "}
                {f?.value ?? ""}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {partial.applicableRoles?.length ? (
        <div>
          <div className="font-mono text-[0.625rem] text-[var(--text-tertiary)] mb-1">
            Routes to
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {partial.applicableRoles.map((r) => (
              <Badge
                key={r}
                variant="outline"
                className="font-mono text-[0.6875rem] text-[var(--text-secondary)] border-[var(--border)]"
              >
                {r.replace("_", " ")}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {partial.summary ? (
        <div>
          <div className="font-mono text-[0.625rem] text-[var(--text-tertiary)] mb-1">
            Summary
          </div>
          <p className="text-[var(--text-primary)]">{partial.summary}</p>
        </div>
      ) : null}

      {partial.confidence !== undefined ? (
        <div className="font-mono text-xs text-[var(--text-tertiary)]">
          Confidence: {Math.round((partial.confidence ?? 0) * 100)}%
        </div>
      ) : null}
    </Card>
  );
}
