import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  guests: defineTable({
    slug: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    photoUrl: v.string(),
    loyaltyTier: v.string(),
    firstStayDate: v.optional(v.string()),
    totalStays: v.optional(v.number()),
    lifetimeSpendUsd: v.optional(v.number()),
    advisor: v.optional(
      v.object({
        agency: v.string(),
        name: v.string(),
        note: v.string(),
      })
    ),
    nextArrival: v.optional(
      v.object({
        property: v.string(),
        checkinIso: v.string(),
        checkoutIso: v.string(),
        flightCode: v.string(),
        flightStatus: v.string(),
        carEtaIso: v.string(),
        suite: v.string(),
      })
    ),
  }).index("by_slug", ["slug"]),

  observations: defineTable({
    guestId: v.id("guests"),
    rawText: v.string(),
    capturedAtIso: v.string(),
    source: v.string(),
    capturedBy: v.object({
      name: v.string(),
      role: v.string(),
      property: v.string(),
    }),
    extracted: v.object({
      categories: v.array(v.string()),
      facts: v.array(v.object({ type: v.string(), value: v.string() })),
      applicableRoles: v.array(v.string()),
      confidence: v.number(),
      summary: v.string(),
    }),
  }).index("by_guestId", ["guestId"]),

  externalSignals: defineTable({
    guestId: v.id("guests"),
    platform: v.string(),
    venue: v.string(),
    reviewDateIso: v.string(),
    rating: v.number(),
    excerpt: v.string(),
    extractedTags: v.array(v.string()),
  }).index("by_guestId", ["guestId"]),

  briefs: defineTable({
    guestId: v.id("guests"),
    generatedAtIso: v.string(),
    agentRunMinutes: v.number(),
    summary: v.string(),
    keyFacts: v.array(v.object({ fact: v.string(), source: v.string() })),
    externalSignalsSummary: v.string(),
    suggestedGestures: v.array(
      v.object({
        title: v.string(),
        rationale: v.string(),
        estCostHkd: v.number(),
        availability: v.string(),
        status: v.string(),
      })
    ),
    sensitivities: v.array(v.string()),
    gestureLoading: v.optional(v.boolean()),
    gestureLoadingStatus: v.optional(v.string()),
  }).index("by_guestId", ["guestId"]),

  agentEvents: defineTable({
    briefId: v.id("briefs"),
    timestampIso: v.string(),
    eventType: v.string(),
    tool: v.optional(v.string()),
    params: v.optional(v.string()),
    resultPreview: v.optional(v.string()),
  }).index("by_briefId", ["briefId"]),

  rolePermissions: defineTable({
    role: v.string(),
    visibleCategories: v.array(v.string()),
  }),
});
