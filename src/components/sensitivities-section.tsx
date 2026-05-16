import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export function SensitivitiesSection({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="h-full">
      <div className="section-label mb-3 flex items-center gap-2">
        <AlertTriangle
          className="size-3.5"
          style={{ color: "var(--sensitivity)" }}
        />
        <span style={{ color: "var(--sensitivity)" }}>Staff Notes</span>
      </div>
      <Card
        className="h-[calc(100%-1.75rem)] gap-3 shadow-xs"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklch, var(--sensitivity) 8%, transparent), var(--card))",
          borderColor: "color-mix(in oklch, var(--sensitivity) 25%, var(--border))",
        }}
      >
        <CardHeader>
          <CardDescription
            className="font-mono text-[0.75rem] uppercase tracking-wider"
            style={{ color: "var(--sensitivity)" }}
          >
            Do not mention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2.5 text-[0.875rem] leading-snug text-[var(--text-primary)]">
            {items.map((i, idx) => (
              <li key={idx} className="flex gap-2.5">
                <span
                  className="mt-1.5 size-1 rounded-full shrink-0"
                  style={{ background: "var(--sensitivity)" }}
                />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
