import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listForBrief = query({
  args: { briefId: v.id("briefs") },
  handler: async (ctx, { briefId }) => {
    const rows = await ctx.db
      .query("agentEvents")
      .withIndex("by_briefId", (q) => q.eq("briefId", briefId))
      .collect();
    return rows.sort((a, b) => a.timestampIso.localeCompare(b.timestampIso));
  },
});

export const replaceForBrief = mutation({
  args: {
    briefId: v.id("briefs"),
    events: v.array(
      v.object({
        timestampIso: v.string(),
        eventType: v.string(),
        tool: v.optional(v.string()),
        params: v.optional(v.string()),
        resultPreview: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { briefId, events }) => {
    const existing = await ctx.db
      .query("agentEvents")
      .withIndex("by_briefId", (q) => q.eq("briefId", briefId))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);
    for (const e of events) await ctx.db.insert("agentEvents", { briefId, ...e });
    return events.length;
  },
});
