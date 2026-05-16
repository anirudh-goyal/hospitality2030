import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_SUGGESTED_GESTURES = 3;
const MAX_KEY_FACTS = 5;
const MAX_SENSITIVITIES = 5;

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

export const setGestureLoading = mutation({
  args: {
    briefId: v.id("briefs"),
    loading: v.boolean(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { briefId, loading, status }) => {
    const brief = await ctx.db.get(briefId);
    if (!brief) throw new Error("Brief not found");
    await ctx.db.patch(briefId, {
      gestureLoading: loading,
      gestureLoadingStatus: loading ? (status ?? "starting") : undefined,
    });
  },
});

export const appendSuggestedGesture = mutation({
  args: {
    briefId: v.id("briefs"),
    gesture: v.object({
      title: v.string(),
      rationale: v.string(),
      estCostHkd: v.number(),
      availability: v.string(),
    }),
  },
  handler: async (ctx, { briefId, gesture }) => {
    const brief = await ctx.db.get(briefId);
    if (!brief) throw new Error("Brief not found");
    const next = [
      { ...gesture, status: "suggested" },
      ...brief.suggestedGestures,
    ].slice(0, MAX_SUGGESTED_GESTURES);
    await ctx.db.patch(briefId, { suggestedGestures: next });
  },
});

export const appendHighlight = mutation({
  args: {
    briefId: v.id("briefs"),
    highlight: v.object({
      fact: v.string(),
      source: v.string(),
    }),
  },
  handler: async (ctx, { briefId, highlight }) => {
    const brief = await ctx.db.get(briefId);
    if (!brief) throw new Error("Brief not found");
    const next = [highlight, ...brief.keyFacts].slice(0, MAX_KEY_FACTS);
    await ctx.db.patch(briefId, { keyFacts: next });
  },
});

export const appendStaffNote = mutation({
  args: {
    briefId: v.id("briefs"),
    text: v.string(),
  },
  handler: async (ctx, { briefId, text }) => {
    const brief = await ctx.db.get(briefId);
    if (!brief) throw new Error("Brief not found");
    const next = [text, ...brief.sensitivities].slice(0, MAX_SENSITIVITIES);
    await ctx.db.patch(briefId, { sensitivities: next });
  },
});
