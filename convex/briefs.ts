import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getForGuest = query({
  args: { guestId: v.id("guests") },
  handler: async (ctx, { guestId }) => {
    return await ctx.db
      .query("briefs")
      .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
      .unique();
  },
});

export const approveGesture = mutation({
  args: { briefId: v.id("briefs"), gestureIndex: v.number() },
  handler: async (ctx, { briefId, gestureIndex }) => {
    const brief = await ctx.db.get(briefId);
    if (!brief) throw new Error("Brief not found");
    const gestures = brief.suggestedGestures.map((g, i) =>
      i === gestureIndex ? { ...g, status: "scheduled" } : g
    );
    await ctx.db.patch(briefId, { suggestedGestures: gestures });
    return await ctx.db.get(briefId);
  },
});
