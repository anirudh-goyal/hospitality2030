import { v } from "convex/values";
import { query } from "./_generated/server";

export const listForGuest = query({
  args: { guestId: v.id("guests") },
  handler: async (ctx, { guestId }) => {
    return await ctx.db
      .query("externalSignals")
      .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
      .collect();
  },
});
