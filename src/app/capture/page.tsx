import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { CaptureForm } from "@/components/capture-form";
import type { SelectedGuest } from "@/components/guest-picker";

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

  return <CaptureForm initialGuest={initial} initialPrefill={prefill} />;
}
