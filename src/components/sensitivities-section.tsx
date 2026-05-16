import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function SensitivitiesSection({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="h-full">
      <div className="section-label mb-3 flex items-center gap-2">
        <AlertTriangle
          className="size-3.5"
          style={{ color: "var(--sensitivity)" }}
        />
        <span style={{ color: "var(--sensitivity)" }}>
          Staff Notes · Do Not Mention
        </span>
      </div>
      <Card
        className="p-5 gap-3 border-l-2 h-[calc(100%-1.75rem)]"
        style={{
          background:
            "color-mix(in oklch, var(--sensitivity) 6%, var(--card))",
          borderLeftColor: "var(--sensitivity)",
        }}
      >
        <ul className="flex flex-col gap-2.5 text-[0.875rem] leading-snug text-[var(--text-primary)]">
          {items.map((i, idx) => (
            <li key={idx} className="flex gap-2">
              <span
                className="mt-1.5 size-1 rounded-full shrink-0"
                style={{ background: "var(--sensitivity)" }}
              />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
