import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const extractedShape = v.object({
  categories: v.array(v.string()),
  facts: v.array(v.object({ type: v.string(), value: v.string() })),
  applicableRoles: v.array(v.string()),
  confidence: v.number(),
  summary: v.string(),
});

const capturedByShape = v.object({
  name: v.string(),
  role: v.string(),
  property: v.string(),
});

export const listForGuest = query({
  args: { guestId: v.id("guests") },
  handler: async (ctx, { guestId }) => {
    const rows = await ctx.db
      .query("observations")
      .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
      .collect();
    return rows.sort((a, b) => b.capturedAtIso.localeCompare(a.capturedAtIso));
  },
});

export const capture = mutation({
  args: {
    guestId: v.id("guests"),
    rawText: v.string(),
    source: v.string(),
    capturedBy: capturedByShape,
    extracted: extractedShape,
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("observations", {
      ...args,
      capturedAtIso: new Date().toISOString(),
    });
    return id;
  },
});
