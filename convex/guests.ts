import { v } from "convex/values";
import { query } from "./_generated/server";

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("guests").collect();
  },
});

export const listArriving = query({
  args: {
    filter: v.union(
      v.literal("today"),
      v.literal("tomorrow"),
      v.literal("vip")
    ),
  },
  handler: async (ctx, { filter }) => {
    const all = await ctx.db.query("guests").collect();
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86_400_000)
      .toISOString()
      .slice(0, 10);

    const withArrival = all.filter((g) => g.nextArrival);

    let filtered;
    if (filter === "today") {
      filtered = withArrival.filter((g) =>
        g.nextArrival!.checkinIso.startsWith(today)
      );
    } else if (filter === "tomorrow") {
      filtered = withArrival.filter((g) =>
        g.nextArrival!.checkinIso.startsWith(tomorrow)
      );
    } else {
      filtered = withArrival.filter((g) => g.loyaltyTier === "Inner Circle");
    }

    return filtered.sort((a, b) =>
      a.nextArrival!.carEtaIso.localeCompare(b.nextArrival!.carEtaIso)
    );
  },
});
