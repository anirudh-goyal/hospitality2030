import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

async function main() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL missing");
  const convex = new ConvexHttpClient(url);

  const anderson = await convex.query(api.guests.getBySlug, {
    slug: "anderson",
  });
  if (!anderson) throw new Error("Anderson not found. Run pnpm seed first.");

  const observations = await convex.query(api.observations.listForGuest, {
    guestId: anderson._id,
  });
  if (observations.length === 0) {
    throw new Error(
      "No observations for Anderson. Capture one in the UI or seed first."
    );
  }
  const newest = observations[0];

  console.log(`Triggering recommend-gesture for ${anderson.firstName}`);
  console.log(`  observationId: ${newest._id}`);
  console.log(`  guestId: ${anderson._id}`);
  console.log("");

  const startedAt = Date.now();
  const res = await fetch(
    "http://localhost:3000/api/agent/recommend-gesture",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        observationId: newest._id,
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
  console.log(
    `  gestureLoading: ${brief?.gestureLoading} (status: ${brief?.gestureLoadingStatus ?? "-"})`
  );
  console.log(`  suggestedGestures (${brief?.suggestedGestures.length ?? 0}):`);
  for (const g of brief?.suggestedGestures ?? []) {
    console.log(
      `    - ${g.title} | HKD ${g.estCostHkd} | ${g.availability} | ${g.status}`
    );
    console.log(`      ${g.rationale}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
