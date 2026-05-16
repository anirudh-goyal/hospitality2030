import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

async function main() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL missing from env");

  const client = new ConvexHttpClient(url);

  console.log("Running base seed...");
  const { andersonId, briefId } = await client.mutation(
    api.seed.runBaseSeed,
    {}
  );
  console.log(`  Anderson: ${andersonId}`);
  console.log(`  Brief:    ${briefId}`);

  console.log("Seeding 47 agent events...");
  const count = await client.mutation(api.seed.seedAgentEvents, { briefId });
  console.log(`  Inserted ${count} events`);

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
