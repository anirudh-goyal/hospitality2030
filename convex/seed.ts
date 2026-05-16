import { v } from "convex/values";
import { mutation } from "./_generated/server";

const ROLE_PERMISSIONS = [
  {
    role: "front_desk",
    visibleCategories: [
      "dietary",
      "beverage",
      "room",
      "family",
      "wellness",
      "interests",
      "milestones",
      "sensitivities",
      "service",
    ],
  },
  {
    role: "concierge",
    visibleCategories: [
      "interests",
      "milestones",
      "family",
      "sensitivities",
      "service",
    ],
  },
  {
    role: "restaurant",
    visibleCategories: ["dietary", "beverage", "family", "service"],
  },
  { role: "spa", visibleCategories: ["wellness", "sensitivities"] },
  { role: "housekeeping", visibleCategories: ["room", "service"] },
];

export const runBaseSeed = mutation({
  args: {},
  handler: async (ctx) => {
    for (const table of [
      "guests",
      "observations",
      "externalSignals",
      "briefs",
      "agentEvents",
      "rolePermissions",
    ] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const r of rows) await ctx.db.delete(r._id);
    }

    const andersonId = await ctx.db.insert("guests", {
      slug: "anderson",
      firstName: "James",
      lastName: "Anderson",
      photoUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=240&fit=crop",
      loyaltyTier: "Inner Circle",
      firstStayDate: "2022-09-14",
      totalStays: 3,
      lifetimeSpendUsd: 84_500,
      advisor: {
        agency: "Brownell Travel",
        name: "Marie Lacoste",
        note: "Prefers high-floor, quiet",
      },
      nextArrival: {
        property: "Rosewood Hong Kong",
        checkinIso:
          new Date().toISOString().slice(0, 10) + "T14:30:00Z",
        checkoutIso:
          new Date(Date.now() + 4 * 86_400_000)
            .toISOString()
            .slice(0, 10) + "T11:00:00Z",
        flightCode: "CX 839",
        flightStatus: "On Time",
        carEtaIso: new Date(Date.now() + 90 * 60_000).toISOString(),
        suite: "Harbour Grand",
      },
    });

    const chenId = await ctx.db.insert("guests", {
      slug: "chen",
      firstName: "Sarah",
      lastName: "Chen",
      photoUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=240&h=240&fit=crop",
      loyaltyTier: "Rosewood Enthusiast",
      totalStays: 1,
      nextArrival: {
        property: "Rosewood Hong Kong",
        checkinIso:
          new Date().toISOString().slice(0, 10) + "T16:00:00Z",
        checkoutIso:
          new Date(Date.now() + 2 * 86_400_000)
            .toISOString()
            .slice(0, 10) + "T11:00:00Z",
        flightCode: "BA 31",
        flightStatus: "On Time",
        carEtaIso: new Date(Date.now() + 4 * 3600_000).toISOString(),
        suite: "Superior Suite",
      },
    });

    await ctx.db.insert("guests", {
      slug: "webb",
      firstName: "Marcus",
      lastName: "Webb",
      photoUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=240&fit=crop",
      loyaltyTier: "Guest",
      totalStays: 0,
      nextArrival: {
        property: "Rosewood Hong Kong",
        checkinIso:
          new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) +
          "T15:00:00Z",
        checkoutIso:
          new Date(Date.now() + 3 * 86_400_000)
            .toISOString()
            .slice(0, 10) + "T11:00:00Z",
        flightCode: "QF 117",
        flightStatus: "On Time",
        carEtaIso: new Date(Date.now() + 26 * 3600_000).toISOString(),
        suite: "Premium Suite",
      },
    });

    const observations = [
      {
        rawText:
          "Mr. Anderson mentioned his daughter Mia just turned ten and loved the pool at Rosewood London last month.",
        source: "voice",
        capturedBy: {
          name: "Marie L.",
          role: "concierge",
          property: "Rosewood London",
        },
        capturedAtIso: "2026-04-22T10:14:00Z",
        extracted: {
          categories: ["family", "interests"],
          facts: [
            { type: "child_name", value: "Mia" },
            { type: "child_age", value: "10" },
            { type: "loved_amenity", value: "Pool at Rosewood London" },
          ],
          applicableRoles: ["front_desk", "concierge", "restaurant"],
          confidence: 0.94,
          summary: "Anderson's daughter Mia, ten, loved the Rosewood London pool.",
        },
      },
      {
        rawText: "Anderson always orders Casa Dragones Joven, neat.",
        source: "voice",
        capturedBy: {
          name: "Daniel R.",
          role: "restaurant",
          property: "Rosewood London",
        },
        capturedAtIso: "2026-04-22T20:42:00Z",
        extracted: {
          categories: ["beverage"],
          facts: [
            { type: "preferred_spirit", value: "Casa Dragones Joven, neat" },
          ],
          applicableRoles: ["front_desk", "restaurant", "concierge"],
          confidence: 0.97,
          summary: "Mezcal preference: Casa Dragones Joven, neat.",
        },
      },
      {
        rawText:
          "Severe shellfish allergy. Do not mention by name at dining.",
        source: "manual",
        capturedBy: {
          name: "GM",
          role: "front_desk",
          property: "Rosewood Hong Kong",
        },
        capturedAtIso: "2026-04-15T09:00:00Z",
        extracted: {
          categories: ["sensitivities", "dietary"],
          facts: [{ type: "allergy", value: "shellfish (severe)" }],
          applicableRoles: [
            "front_desk",
            "restaurant",
            "concierge",
            "spa",
            "housekeeping",
          ],
          confidence: 1.0,
          summary: "Severe shellfish allergy - do not mention by name.",
        },
      },
      {
        rawText: "Asked about ceramics studios in Hong Kong during last stay.",
        source: "voice",
        capturedBy: {
          name: "Hugo P.",
          role: "concierge",
          property: "Rosewood Hong Kong",
        },
        capturedAtIso: "2025-11-08T15:21:00Z",
        extracted: {
          categories: ["interests"],
          facts: [{ type: "interest", value: "Ceramics, hands-on studios" }],
          applicableRoles: ["front_desk", "concierge"],
          confidence: 0.9,
          summary: "Interested in ceramics studios.",
        },
      },
    ];

    for (const o of observations) {
      await ctx.db.insert("observations", { guestId: andersonId, ...o });
    }

    await ctx.db.insert("observations", {
      guestId: chenId,
      rawText: "Vegan, prefers natural wines.",
      source: "manual",
      capturedAtIso: "2026-05-01T12:00:00Z",
      capturedBy: {
        name: "GM",
        role: "front_desk",
        property: "Rosewood Hong Kong",
      },
      extracted: {
        categories: ["dietary", "beverage"],
        facts: [
          { type: "diet", value: "vegan" },
          { type: "wine", value: "natural wines" },
        ],
        applicableRoles: ["front_desk", "restaurant"],
        confidence: 0.98,
        summary: "Vegan with a natural-wine preference.",
      },
    });

    await ctx.db.insert("externalSignals", {
      guestId: andersonId,
      platform: "TripAdvisor",
      venue: "Singita Pamushana Lodge, Zimbabwe",
      reviewDateIso: "2024-10-12",
      rating: 5,
      excerpt:
        "The mezcal selection at the bar was extraordinary. The pottery studio visit organized for our daughter was the highlight of the trip.",
      extractedTags: ["mezcal", "pottery", "family", "daughter"],
    });

    await ctx.db.insert("externalSignals", {
      guestId: andersonId,
      platform: "Pottery Review",
      venue: "Touching Stone Gallery, Kyoto",
      reviewDateIso: "2024-06-04",
      rating: 5,
      excerpt:
        "James commissioned a tea bowl on the spot. He has a real eye for wood-fired work.",
      extractedTags: ["ceramics", "collector", "commission"],
    });

    const briefId = await ctx.db.insert("briefs", {
      guestId: andersonId,
      generatedAtIso: new Date(Date.now() - 18 * 3600_000).toISOString(),
      agentRunMinutes: 42,
      summary:
        "Anderson arrives Inner Circle, third Rosewood stay, traveling with daughter Mia (10). Verified ceramics collector and mezcal enthusiast. Severe shellfish allergy.",
      keyFacts: [
        {
          fact: "Daughter Mia (10) loved the Rosewood London pool last month.",
          source: "Marie L., Rosewood London - Apr 22",
        },
        {
          fact: "Drinks Casa Dragones Joven, neat.",
          source: "Daniel R., Rosewood London - Apr 22",
        },
        {
          fact: "Severe shellfish allergy - do not mention by name.",
          source: "GM, Rosewood Hong Kong - Apr 15",
        },
      ],
      externalSignalsSummary:
        "TripAdvisor (Singita) and Pottery Review (Kyoto) confirm interests in ceramics and mezcal.",
      suggestedGestures: [
        {
          title: "The Ceramics Experience",
          rationale:
            "Pottery Review names James a ceramics collector. Touching Stone Gallery partnership lets us arrange a private wood-fired studio visit Thursday afternoon, between his confirmed meetings.",
          estCostHkd: 1200,
          availability: "Available Thursday",
          status: "draft",
        },
        {
          title: "Pool Morning Package for Mia",
          rationale:
            "Daughter Mia (10) loved the pool at Rosewood London per Marie L. Pre-arrange a sunrise pool slot with the kids' program, breakfast for two poolside, and a stuffed Rosewood koala in the room.",
          estCostHkd: 650,
          availability: "Available Today",
          status: "draft",
        },
        {
          title: "Mezcal Tasting Journey",
          rationale:
            "Bar manager at Singita Pamushana noted Anderson's mezcal expertise. Curate a 4-pour flight including a Casa Dragones reserve our HK bar holds back. Pair with a chocolate course (no shellfish proximity).",
          estCostHkd: 980,
          availability: "Check Availability",
          status: "draft",
        },
      ],
      sensitivities: [
        "Severe shellfish allergy - do not mention by name at dining",
        "Spouse not traveling - do not reference her",
        "Recovering from minor knee surgery - no spa pressure on right knee",
      ],
    });

    for (const rp of ROLE_PERMISSIONS) {
      await ctx.db.insert("rolePermissions", rp);
    }

    return { andersonId, briefId };
  },
});

export const seedAgentEvents = mutation({
  args: { briefId: v.id("briefs") },
  handler: async (ctx, { briefId }) => {
    const existing = await ctx.db
      .query("agentEvents")
      .withIndex("by_briefId", (q) => q.eq("briefId", briefId))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);

    const base = Date.now() - 18 * 3600_000;
    const eventsRaw: Array<
      [number, string, string?, string?, string?]
    > = [
      [0, "web_search", "web_search", "James Anderson Rosewood Inner Circle review", "3 results"],
      [12_000, "web_search", "web_search", "James Anderson TripAdvisor Singita", "1 result, 5 stars"],
      [22_000, "web_fetch", "web_fetch", "https://tripadvisor.com/Review-Singita-Pamushana", "review text 4.8KB"],
      [38_000, "synthesis", undefined, undefined, "Mezcal interest confirmed, pottery interest noted"],
      [44_000, "web_search", "web_search", "Anderson ceramics collector commission", "2 results"],
      [55_000, "web_fetch", "web_fetch", "https://potteryreview.com/touching-stone-anderson", "article 6.1KB"],
      [71_000, "synthesis", undefined, undefined, "Pottery Review names Anderson as wood-fired collector"],
      [82_000, "file_write", "write_to_context", "anderson-interests.md", "wrote 312 bytes"],
      [98_000, "web_search", "web_search", "Mia Anderson daughter age 10", "0 results"],
      [108_000, "web_search", "web_search", "James Anderson family Instagram", "3 results"],
      [121_000, "web_fetch", "web_fetch", "https://instagram.com/jamesanderson_hk/p/abc", "post: birthday at pool"],
      [137_000, "synthesis", undefined, undefined, "Mia's tenth birthday April 14, pool feature in post"],
      [149_000, "web_search", "web_search", "Hong Kong ceramics studio Thursday afternoon", "5 results"],
      [161_000, "web_fetch", "web_fetch", "https://touchingstone.hk/visit", "private studio bookings page"],
      [174_000, "web_search", "web_search", "Rosewood Hong Kong mezcal Casa Dragones reserve", "1 result"],
      [186_000, "web_fetch", "web_fetch", "internal://bar-inventory/mezcal", "Casa Dragones Joven reserve in stock"],
      [198_000, "synthesis", undefined, undefined, "Three candidate gestures emerging: ceramics studio, pool morning, mezcal flight"],
      [212_000, "file_write", "write_to_context", "anderson-gesture-options.md", "wrote 1.1KB"],
      [228_000, "web_search", "web_search", "Anderson shellfish allergy noted", "0 results"],
      [240_000, "web_fetch", "web_fetch", "internal://crm/allergy-flags/anderson", "severe shellfish allergy"],
      [253_000, "synthesis", undefined, undefined, "Allergy confirmed in CRM, must annotate mezcal pairing"],
      [266_000, "web_search", "web_search", "Touching Stone availability Thursday May 14 16:00", "2 slots"],
      [278_000, "web_fetch", "web_fetch", "https://touchingstone.hk/book?slot=thu1600", "slot held 24h"],
      [292_000, "synthesis", undefined, undefined, "Ceramics studio: Thursday 16:00 slot held"],
      [305_000, "web_search", "web_search", "Rosewood HK pool morning program kids 10", "1 result"],
      [318_000, "web_fetch", "web_fetch", "https://rosewoodhk.internal/pool-kids", "sunrise slot 06:30 available"],
      [331_000, "synthesis", undefined, undefined, "Pool morning: sunrise slot bookable for tomorrow"],
      [343_000, "web_search", "web_search", "Rosewood koala plush in-room amenity stock", "in stock x12"],
      [354_000, "file_write", "write_to_context", "mia-gesture-plan.md", "wrote 740 bytes"],
      [369_000, "web_search", "web_search", "Casa Dragones reserve mezcal flight 4-pour", "menu draft"],
      [381_000, "web_fetch", "web_fetch", "internal://fnb/mezcal-flight-template", "template loaded"],
      [394_000, "synthesis", undefined, undefined, "Mezcal flight: 4-pour, chocolate course no shellfish proximity"],
      [407_000, "web_search", "web_search", "Anderson spouse traveling May", "0 results"],
      [418_000, "web_fetch", "web_fetch", "internal://crm/anderson/reservation", "guest count 2, James and Mia"],
      [430_000, "synthesis", undefined, undefined, "Spouse not traveling, sensitivity noted"],
      [442_000, "web_search", "web_search", "Anderson minor knee surgery recovery", "1 result"],
      [453_000, "web_fetch", "web_fetch", "internal://crm/anderson/health-notes", "right knee surgery 6 weeks ago"],
      [466_000, "synthesis", undefined, undefined, "Spa: no pressure on right knee, document in sensitivities"],
      [478_000, "file_write", "write_to_context", "anderson-sensitivities.md", "wrote 480 bytes"],
      [493_000, "web_search", "web_search", "Rosewood London pool Mia April 2026 confirm", "1 result"],
      [504_000, "web_fetch", "web_fetch", "internal://rosewood-london/notes/anderson-april", "Marie's note on Mia"],
      [517_000, "synthesis", undefined, undefined, "Marie L. note corroborates pool delight"],
      [529_000, "web_search", "web_search", "advisor Marie Lacoste Brownell Travel contact", "1 result"],
      [540_000, "web_fetch", "web_fetch", "internal://crm/advisors/lacoste", "advisor record"],
      [552_000, "synthesis", undefined, undefined, "Advisor preference: high-floor, quiet"],
      [565_000, "file_write", "write_to_context", "anderson-final-brief.md", "wrote 2.3KB"],
      [580_000, "synthesis", undefined, undefined, "Brief assembled. Three candidate gestures identified."],
    ];

    const events = eventsRaw.map(
      ([offsetMs, eventType, tool, params, resultPreview]) => ({
        timestampIso: new Date(base + offsetMs).toISOString(),
        eventType,
        tool,
        params,
        resultPreview,
      })
    );

    for (const e of events) {
      await ctx.db.insert("agentEvents", { briefId, ...e });
    }

    return events.length;
  },
});
