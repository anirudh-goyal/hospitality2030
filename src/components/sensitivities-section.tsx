import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SensitivitiesSection({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="mb-8">
      <Alert
        className="border-[var(--border)] border-l-2 border-l-[var(--sensitivity)] gap-2"
        style={{
          background: "color-mix(in oklch, var(--sensitivity) 8%, var(--card))",
        }}
      >
        <AlertTriangle
          className="size-4"
          style={{ color: "var(--sensitivity)" }}
        />
        <AlertTitle
          className="section-label"
          style={{ color: "var(--sensitivity)" }}
        >
          Staff Notes - Do Not Mention
        </AlertTitle>
        <AlertDescription className="text-[var(--text-primary)]">
          <ul className="list-disc pl-5 space-y-1.5 mt-1">
            {items.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    </section>
  );
}
