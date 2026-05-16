import { v } from "convex/values";
import { mutation } from "./_generated/server";

/** One-off cleanup: drop the "sold his company" observation/highlight/latest gesture
 *  from Anderson's record so the demo can re-capture it live. */
export const stripAndersonCelebration = mutation({
  args: {},
  handler: async (ctx) => {
    const anderson = await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", "anderson"))
      .unique();
    if (!anderson) throw new Error("Anderson not found");

    const obs = await ctx.db
      .query("observations")
      .withIndex("by_guestId", (q) => q.eq("guestId", anderson._id))
      .collect();
    const removedObs: string[] = [];
    for (const o of obs) {
      if (/sold his (new )?company/i.test(o.rawText)) {
        await ctx.db.delete(o._id);
        removedObs.push(o._id);
      }
    }

    const brief = await ctx.db
      .query("briefs")
      .withIndex("by_guestId", (q) => q.eq("guestId", anderson._id))
      .unique();
    if (!brief) return { removedObs, briefPatched: false };

    const keyFacts = brief.keyFacts.filter(
      (kf) => !/sold his company/i.test(kf.fact)
    );
    const suggestedGestures = brief.suggestedGestures.slice(1);

    await ctx.db.patch(brief._id, { keyFacts, suggestedGestures });

    return {
      removedObs,
      removedHighlights: brief.keyFacts.length - keyFacts.length,
      droppedGestureTitle: brief.suggestedGestures[0]?.title,
    };
  },
});
