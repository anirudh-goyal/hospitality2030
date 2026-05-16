import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { CaptureForm } from "@/components/capture-form";
import type { SelectedGuest } from "@/components/guest-picker";
import { SiteHeader } from "@/components/site-header";

const DEMO_SENTENCE =
  "Mr. Anderson mentioned his daughter Mia just turned ten and loved the pool at Rosewood London last month.";

export default async function CapturePage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string; prefill?: string }>;
}) {
  const sp = await searchParams;
  let initial: SelectedGuest = null;

  if (sp.guest) {
    const g = await fetchQuery(api.guests.getBySlug, { slug: sp.guest });
    if (g) {
      initial = {
        id: g._id,
        slug: g.slug,
        firstName: g.firstName,
        lastName: g.lastName,
        suite: g.nextArrival?.suite ?? "",
        loyaltyTier: g.loyaltyTier,
      };
    }
  }

  const prefill = sp.prefill === "demo" ? DEMO_SENTENCE : "";
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-screen">
      <SiteHeader
        crumbs={[{ label: "Capture" }]}
        right={
          <span className="font-mono text-[0.75rem] text-[var(--text-tertiary)]">
            {today} · Rosewood Hong Kong
          </span>
        }
      />
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarGutter: "stable" }}
      >
        <CaptureForm initialGuest={initial} initialPrefill={prefill} />
      </div>
    </div>
  );
}
