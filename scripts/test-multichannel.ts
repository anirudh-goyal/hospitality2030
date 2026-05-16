import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

async function main() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL missing");
  const convex = new ConvexHttpClient(url);

  const anderson = await convex.query(api.guests.getBySlug, {
    slug: "anderson",
  });
  if (!anderson) throw new Error("Anderson not found");

  // Capture a fresh multi-channel observation: a milestone (gesture-worthy)
  // PLUS a new preference (highlight-worthy) PLUS a sensitivity (staff-note-worthy).
  const rawText =
    "Tonight is James's 50th birthday and he confided he's nervous about a new diabetes diagnosis. Wants to keep both quiet but enjoy himself - prefers sparkling water with lime, no sugary cocktails.";

  const observationId = await convex.mutation(api.observations.capture, {
    guestId: anderson._id,
    rawText,
    source: "manual",
    capturedBy: {
      name: "Sofia Reyes",
      role: "front_desk",
      property: "Rosewood Hong Kong",
    },
    extracted: {
      categories: ["milestones", "sensitivities", "beverage"],
      facts: [
        { type: "birthday", value: "50th tonight" },
        { type: "health", value: "recent diabetes diagnosis (private)" },
        {
          type: "beverage_preference",
          value: "sparkling water with lime; avoid sugary cocktails",
        },
      ],
      applicableRoles: ["front_desk", "restaurant", "concierge"],
      confidence: 0.95,
      summary:
        "50th birthday tonight; private diabetes diagnosis; wants low-sugar drinks.",
    },
  });

  console.log(`Captured fresh observation: ${observationId}`);
  console.log(`Triggering agent...`);
  console.log("");

  const startedAt = Date.now();
  const res = await fetch(
    "http://localhost:3000/api/agent/recommend-gesture",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        observationId,
        guestId: anderson._id,
      }),
    }
  );
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  const body = await res.text();
  console.log(`HTTP ${res.status} in ${elapsed}s`);
  console.log(body);

  const brief = await convex.query(api.briefs.getForGuest, {
    guestId: anderson._id,
  });
  console.log("");
  console.log("Brief state after run:");
  console.log(`  Highlights (${brief?.keyFacts.length ?? 0}):`);
  for (const k of brief?.keyFacts ?? []) {
    console.log(`    - ${k.fact}   [${k.source}]`);
  }
  console.log("");
  console.log(`  Staff Notes (${brief?.sensitivities.length ?? 0}):`);
  for (const s of brief?.sensitivities ?? []) {
    console.log(`    - ${s}`);
  }
  console.log("");
  console.log(
    `  Suggested Gestures (${brief?.suggestedGestures.length ?? 0}):`
  );
  for (const g of brief?.suggestedGestures ?? []) {
    console.log(
      `    - ${g.title} | HKD ${g.estCostHkd} | ${g.availability}`
    );
    console.log(`      ${g.rationale}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
