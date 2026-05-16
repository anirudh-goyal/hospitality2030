import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

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
    visibleCategories: ["dietary", "beverage", "service"],
  },
  { role: "spa", visibleCategories: ["wellness", "sensitivities"] },
  { role: "housekeeping", visibleCategories: ["room", "service"] },
];

// Check-in stamps. ISO strings without "Z" so JS Date parses them as local
// time and the UI's toLocaleTimeString renders the literal hour.
function dateOffsetLocal(daysAhead: number): string {
  const d = new Date(Date.now() + daysAhead * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const ARRIVAL_PLAN = {
  anderson: { daysAhead: 0, checkin: "T21:30:00", carEta: "T21:25:00" },
  chen: { daysAhead: 0, checkin: "T22:15:00", carEta: "T22:10:00" },
  webb: { daysAhead: 1, checkin: "T15:30:00", carEta: "T15:25:00" },
} as const;

function buildArrival(slug: keyof typeof ARRIVAL_PLAN) {
  const plan = ARRIVAL_PLAN[slug];
  const arrivalDate = dateOffsetLocal(plan.daysAhead);
  const baseByGuest = {
    anderson: {
      property: "Rosewood Hong Kong",
      flightCode: "CX 839",
      flightStatus: "On Time",
      suite: "Harbour Grand",
      checkoutDate: new Date(Date.now() + 4 * 86_400_000),
    },
    chen: {
      property: "Rosewood Hong Kong",
      flightCode: "BA 31",
      flightStatus: "On Time",
      suite: "Superior Suite",
      checkoutDate: new Date(Date.now() + 2 * 86_400_000),
    },
    webb: {
      property: "Rosewood Hong Kong",
      flightCode: "QF 117",
      flightStatus: "On Time",
      suite: "Premium Suite",
      checkoutDate: new Date(Date.now() + 3 * 86_400_000),
    },
  };
  const b = baseByGuest[slug];
  const checkoutLocal = `${b.checkoutDate.getFullYear()}-${String(b.checkoutDate.getMonth() + 1).padStart(2, "0")}-${String(b.checkoutDate.getDate()).padStart(2, "0")}`;
  return {
    property: b.property,
    checkinIso: `${arrivalDate}${plan.checkin}`,
    checkoutIso: `${checkoutLocal}T11:00:00`,
    flightCode: b.flightCode,
    flightStatus: b.flightStatus,
    carEtaIso: `${arrivalDate}${plan.carEta}`,
    suite: b.suite,
  };
}

type ObservationSeed = {
  rawText: string;
  source: string;
  capturedBy: { name: string; role: string; property: string };
  capturedAtIso: string;
  extracted: {
    categories: string[];
    facts: { type: string; value: string }[];
    applicableRoles: string[];
    confidence: number;
    summary: string;
  };
};

const ANDERSON_OBSERVATIONS: ObservationSeed[] = [
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
      applicableRoles: ["front_desk", "concierge"],
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
    rawText: "Severe shellfish allergy. Do not mention by name at dining.",
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

const CHEN_OBSERVATIONS: ObservationSeed[] = [
  {
    rawText: "Vegan, prefers natural wines.",
    source: "manual",
    capturedBy: {
      name: "GM",
      role: "front_desk",
      property: "Rosewood Hong Kong",
    },
    capturedAtIso: "2026-05-01T12:00:00Z",
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
  },
  {
    rawText:
      "Sarah keynotes FinTech Asia tomorrow morning at 9 - asked twice about a quiet workspace.",
    source: "voice",
    capturedBy: {
      name: "Hugo P.",
      role: "concierge",
      property: "Rosewood Hong Kong",
    },
    capturedAtIso: "2026-05-10T14:30:00Z",
    extracted: {
      categories: ["milestones", "service"],
      facts: [
        { type: "speaking_engagement", value: "FinTech Asia keynote, 9am" },
        { type: "request", value: "Quiet workspace before 8am" },
      ],
      applicableRoles: ["front_desk", "concierge"],
      confidence: 0.93,
      summary: "Keynoting FinTech Asia tomorrow; needs early quiet workspace.",
    },
  },
  {
    rawText:
      "Recovering from rotator cuff surgery, four weeks out. No deep tissue, no pressure on left shoulder.",
    source: "manual",
    capturedBy: {
      name: "Dr. M.",
      role: "spa",
      property: "Rosewood Hong Kong",
    },
    capturedAtIso: "2026-05-08T11:00:00Z",
    extracted: {
      categories: ["wellness", "sensitivities"],
      facts: [
        { type: "injury", value: "Rotator cuff, left shoulder, 4 wks post-op" },
        { type: "spa_constraint", value: "No deep tissue, no left-shoulder pressure" },
      ],
      applicableRoles: ["front_desk", "spa"],
      confidence: 0.99,
      summary: "Post-op shoulder; no deep tissue on the left side.",
    },
  },
  {
    rawText:
      "Sarah asked for a north-facing room - sensitive to morning light. Wants a printed itinerary at turndown.",
    source: "voice",
    capturedBy: {
      name: "Anna K.",
      role: "housekeeping",
      property: "Rosewood Hong Kong",
    },
    capturedAtIso: "2026-05-12T09:00:00Z",
    extracted: {
      categories: ["room", "service"],
      facts: [
        { type: "room_preference", value: "North-facing, light-sensitive" },
        { type: "turndown", value: "Printed itinerary in room" },
      ],
      applicableRoles: ["front_desk", "housekeeping"],
      confidence: 0.92,
      summary: "North-facing room; printed itinerary at turndown.",
    },
  },
];

const WEBB_OBSERVATIONS: ObservationSeed[] = [
  {
    rawText:
      "Marcus and Elena are celebrating their tenth wedding anniversary on this trip - first time at Rosewood.",
    source: "voice",
    capturedBy: {
      name: "Hugo P.",
      role: "concierge",
      property: "Rosewood Hong Kong",
    },
    capturedAtIso: "2026-05-09T16:45:00Z",
    extracted: {
      categories: ["milestones", "family"],
      facts: [
        { type: "milestone", value: "10th wedding anniversary" },
        { type: "spouse_name", value: "Elena" },
        { type: "first_visit", value: "Rosewood Hong Kong" },
      ],
      applicableRoles: ["front_desk", "concierge"],
      confidence: 0.96,
      summary: "10th anniversary trip with Elena; first Rosewood stay.",
    },
  },
  {
    rawText:
      "Elena is allergic to tree nuts - especially almonds. They asked about omakase recommendations.",
    source: "manual",
    capturedBy: {
      name: "Daniel R.",
      role: "restaurant",
      property: "Rosewood Hong Kong",
    },
    capturedAtIso: "2026-05-11T19:20:00Z",
    extracted: {
      categories: ["dietary", "sensitivities"],
      facts: [
        { type: "allergy", value: "Tree nuts (Elena), severe - almonds" },
        { type: "dining_interest", value: "Omakase" },
      ],
      applicableRoles: [
        "front_desk",
        "restaurant",
        "concierge",
        "spa",
        "housekeeping",
      ],
      confidence: 0.99,
      summary: "Elena: severe tree-nut allergy. Couple asked about omakase.",
    },
  },
  {
    rawText:
      "Big jazz fans - Marcus mentioned wanting to find a live set at a small venue while in town.",
    source: "voice",
    capturedBy: {
      name: "Hugo P.",
      role: "concierge",
      property: "Rosewood Hong Kong",
    },
    capturedAtIso: "2026-05-12T10:10:00Z",
    extracted: {
      categories: ["interests"],
      facts: [
        { type: "music", value: "Jazz, live, intimate venues" },
      ],
      applicableRoles: ["front_desk", "concierge"],
      confidence: 0.9,
      summary: "Couple wants a live jazz set in a small HK venue.",
    },
  },
  {
    rawText:
      "Requested a high-floor harbour view and a midnight check-in setup - flight lands late.",
    source: "manual",
    capturedBy: {
      name: "Sofia R.",
      role: "front_desk",
      property: "Rosewood Hong Kong",
    },
    capturedAtIso: "2026-05-13T08:00:00Z",
    extracted: {
      categories: ["room", "service"],
      facts: [
        { type: "room_preference", value: "High floor, harbour view" },
        { type: "arrival", value: "Late-night arrival, pre-set room" },
      ],
      applicableRoles: ["front_desk", "housekeeping"],
      confidence: 0.95,
      summary: "High floor, harbour view; pre-set room for late arrival.",
    },
  },
];

type ExternalSignalSeed = {
  platform: string;
  venue: string;
  reviewDateIso: string;
  rating: number;
  excerpt: string;
  extractedTags: string[];
};

const ANDERSON_SIGNALS: ExternalSignalSeed[] = [
  {
    platform: "TripAdvisor",
    venue: "Singita Pamushana Lodge, Zimbabwe",
    reviewDateIso: "2024-10-12",
    rating: 5,
    excerpt:
      "The mezcal selection at the bar was extraordinary. The pottery studio visit organized for our daughter was the highlight of the trip.",
    extractedTags: ["mezcal", "pottery", "family", "daughter"],
  },
  {
    platform: "Pottery Review",
    venue: "Touching Stone Gallery, Kyoto",
    reviewDateIso: "2024-06-04",
    rating: 5,
    excerpt:
      "James commissioned a tea bowl on the spot. He has a real eye for wood-fired work.",
    extractedTags: ["ceramics", "collector", "commission"],
  },
];

const CHEN_SIGNALS: ExternalSignalSeed[] = [
  {
    platform: "LinkedIn",
    venue: "FinTech Asia 2026 - speaker profile",
    reviewDateIso: "2026-04-30",
    rating: 5,
    excerpt:
      "Keynote: 'Programmable Money and the Next Decade of Asian Capital'. Bio notes Sarah is a plant-based athlete and amateur ceramicist.",
    extractedTags: ["fintech", "keynote", "vegan", "ceramics"],
  },
  {
    platform: "The Infatuation",
    venue: "Plantasia, Singapore",
    reviewDateIso: "2025-08-21",
    rating: 5,
    excerpt:
      "Sarah's review: 'The natural-wine pairing with the tasting menu was the best plant-based dinner I have had in Asia.'",
    extractedTags: ["vegan", "natural wine", "fine dining"],
  },
];

const WEBB_SIGNALS: ExternalSignalSeed[] = [
  {
    platform: "Instagram",
    venue: "Smalls Jazz Club, New York",
    reviewDateIso: "2025-12-02",
    rating: 5,
    excerpt:
      "Marcus tagged: 'Ten years in and Elena still picks the best jazz rooms. Smalls never misses.'",
    extractedTags: ["jazz", "anniversary", "couple"],
  },
  {
    platform: "OpenTable",
    venue: "Sushi Saito, Hong Kong",
    reviewDateIso: "2025-11-18",
    rating: 5,
    excerpt:
      "Asked for tree-nut-free courses for Elena. The chef adapted three courses without compromise. Perfect omakase.",
    extractedTags: ["omakase", "tree-nut allergy", "elena"],
  },
];

type GestureSeed = {
  title: string;
  rationale: string;
  estCostHkd: number;
  availability: string;
  status: string;
};

type BriefSeed = {
  agentRunMinutes: number;
  summary: string;
  keyFacts: { fact: string; source: string }[];
  externalSignalsSummary: string;
  suggestedGestures: GestureSeed[];
  sensitivities: string[];
};

const ANDERSON_BRIEF: BriefSeed = {
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
};

const CHEN_BRIEF: BriefSeed = {
  agentRunMinutes: 31,
  summary:
    "Chen returns for her second Rosewood stay ahead of a FinTech Asia keynote. Vegan with natural-wine preference; rotator-cuff recovery on the left side; needs an early quiet workspace.",
  keyFacts: [
    {
      fact: "Keynotes FinTech Asia tomorrow 9am; requested an early quiet workspace.",
      source: "Hugo P., Rosewood Hong Kong - May 10",
    },
    {
      fact: "Vegan, prefers natural wines.",
      source: "GM, Rosewood Hong Kong - May 1",
    },
    {
      fact: "Rotator-cuff surgery 4 weeks ago - no deep tissue, no left-shoulder pressure.",
      source: "Dr. M., Spa - May 8",
    },
  ],
  externalSignalsSummary:
    "LinkedIn confirms keynote and a plant-based, ceramicist self-description. Infatuation review praises a vegan tasting menu with natural-wine pairing in Singapore.",
  suggestedGestures: [
    {
      title: "Pre-Keynote Quiet Hour",
      rationale:
        "Concierge note flags an early quiet workspace before her 9am keynote. Reserve the Library at 6:30am with the espresso bar opened early and a printed run-of-show on the desk.",
      estCostHkd: 0,
      availability: "Available Tomorrow",
      status: "draft",
    },
    {
      title: "Natural-Wine Vegan Tasting",
      rationale:
        "Infatuation review names natural-wine pairing as her favorite plant-based dinner in Asia. Chef-led 5-course vegan tasting in the private dining room, paired with three natural wines from our cellar.",
      estCostHkd: 1850,
      availability: "Available Tonight",
      status: "draft",
    },
    {
      title: "Studio Hour at Yi Pottery",
      rationale:
        "LinkedIn bio names her as an amateur ceramicist. A 90-minute private throwing session at Yi Pottery in Sheung Wan, with car transfer between her keynote and the evening reception.",
      estCostHkd: 1450,
      availability: "Available Day 2",
      status: "draft",
    },
  ],
  sensitivities: [
    "Strict vegan - confirm every plate, including amenities and turndown",
    "Rotator-cuff post-op (left) - no deep tissue, no left-shoulder pressure",
    "Light-sensitive - north-facing room, blackout drawn at turndown",
  ],
};

const WEBB_BRIEF: BriefSeed = {
  agentRunMinutes: 28,
  summary:
    "First-time Rosewood guests on a tenth-anniversary trip. Tree-nut allergy (Elena) is the hard constraint. Jazz fans, omakase fans, late-night arrival.",
  keyFacts: [
    {
      fact: "10th anniversary trip with Elena; first Rosewood stay.",
      source: "Hugo P., Rosewood Hong Kong - May 9",
    },
    {
      fact: "Elena has a severe tree-nut allergy (especially almonds).",
      source: "Daniel R., Restaurant - May 11",
    },
    {
      fact: "Late-night arrival; wants room pre-set, high floor, harbour view.",
      source: "Sofia R., Front Desk - May 13",
    },
  ],
  externalSignalsSummary:
    "Instagram tags from Smalls Jazz Club confirm the live-jazz interest. OpenTable review from Sushi Saito shows the omakase + tree-nut-free pattern.",
  suggestedGestures: [
    {
      title: "Anniversary Turndown",
      rationale:
        "Confirmed tenth anniversary and first Rosewood stay. Tree-nut-free petits fours, a handwritten note from the GM, and a single white rose on Elena's pillow.",
      estCostHkd: 320,
      availability: "Available Tonight",
      status: "draft",
    },
    {
      title: "Private Omakase, Tree-Nut-Free",
      rationale:
        "OpenTable review at Sushi Saito praises a chef-adapted nut-free omakase. Reserve our Asaya counter for a chef's 12-course, allergy-cleared, with a sake pairing.",
      estCostHkd: 4800,
      availability: "Available Day 2",
      status: "draft",
    },
    {
      title: "Late-Set Jazz at Peel Fresco",
      rationale:
        "Marcus tagged Smalls in NY and asked about a small HK venue. Hold a corner table at Peel Fresco for the 10:30pm set and arrange car back to the suite.",
      estCostHkd: 600,
      availability: "Available Tomorrow",
      status: "draft",
    },
  ],
  sensitivities: [
    "Elena: severe tree-nut allergy - clear every plate and amenity",
    "Late-night arrival - keep front-desk handoff under 90 seconds",
    "First-time guests - over-explain Rosewood touches, do not assume familiarity",
  ],
};

const CHEN_PROFILE = {
  firstStayDate: "2025-02-18",
  totalStays: 1,
  lifetimeSpendUsd: 18_400,
  advisor: {
    agency: "Quintessentially Travel",
    name: "Priya Shah",
    note: "Vegan, business travel, early-rise preference",
  },
};

const WEBB_PROFILE = {
  firstStayDate: "2026-05-17",
  totalStays: 0,
  lifetimeSpendUsd: 0,
  advisor: {
    agency: "Virtuoso - Departure Lounge",
    name: "Ben Ortega",
    note: "Anniversary trip, allergy file on Elena, jazz fans",
  },
};

function buildAgentEvents(briefId: Id<"briefs">, base: number) {
  // Returns the 47-event sequence for any guest's brief.
  const eventsRaw: Array<[number, string, string?, string?, string?]> = [
    [0, "web_search", "web_search", "guest profile review", "3 results"],
    [12_000, "web_search", "web_search", "loyalty + recent stays", "1 result"],
    [22_000, "web_fetch", "web_fetch", "internal://crm/profile", "profile loaded"],
    [38_000, "synthesis", undefined, undefined, "Profile baseline complete"],
    [44_000, "web_search", "web_search", "public reviews and mentions", "2 results"],
    [55_000, "web_fetch", "web_fetch", "https://review-platform/excerpt", "review loaded"],
    [71_000, "synthesis", undefined, undefined, "Public signal confirms primary interest"],
    [82_000, "file_write", "write_to_context", "guest-interests.md", "wrote 312 bytes"],
    [98_000, "web_search", "web_search", "schedule overlap with stay window", "2 results"],
    [108_000, "web_search", "web_search", "advisor preferences on file", "1 result"],
    [121_000, "web_fetch", "web_fetch", "internal://crm/advisor", "advisor note"],
    [137_000, "synthesis", undefined, undefined, "Advisor note logged"],
    [149_000, "web_search", "web_search", "candidate experiences in HK", "5 results"],
    [161_000, "web_fetch", "web_fetch", "https://partner-venue/availability", "slots open"],
    [174_000, "web_search", "web_search", "internal bar/kitchen inventory", "1 result"],
    [186_000, "web_fetch", "web_fetch", "internal://fnb/inventory", "items in stock"],
    [198_000, "synthesis", undefined, undefined, "Three candidate gestures emerging"],
    [212_000, "file_write", "write_to_context", "gesture-options.md", "wrote 1.1KB"],
    [228_000, "web_search", "web_search", "allergy and sensitivity flags", "1 result"],
    [240_000, "web_fetch", "web_fetch", "internal://crm/allergy-flags", "flag confirmed"],
    [253_000, "synthesis", undefined, undefined, "Sensitivity logged for kitchen handoff"],
    [266_000, "web_search", "web_search", "venue availability for stay window", "2 slots"],
    [278_000, "web_fetch", "web_fetch", "https://partner-venue/book?slot=hold", "slot held 24h"],
    [292_000, "synthesis", undefined, undefined, "Gesture 1: slot held"],
    [305_000, "web_search", "web_search", "in-house program eligibility", "1 result"],
    [318_000, "web_fetch", "web_fetch", "https://rosewoodhk.internal/program", "slot available"],
    [331_000, "synthesis", undefined, undefined, "Gesture 2: in-house slot bookable"],
    [343_000, "web_search", "web_search", "amenity inventory check", "in stock"],
    [354_000, "file_write", "write_to_context", "gesture-2-plan.md", "wrote 740 bytes"],
    [369_000, "web_search", "web_search", "specialty pairing template", "menu draft"],
    [381_000, "web_fetch", "web_fetch", "internal://fnb/pairing-template", "template loaded"],
    [394_000, "synthesis", undefined, undefined, "Gesture 3: pairing template adapted"],
    [407_000, "web_search", "web_search", "travel companions in reservation", "1 result"],
    [418_000, "web_fetch", "web_fetch", "internal://crm/reservation", "party details"],
    [430_000, "synthesis", undefined, undefined, "Companion noted, sensitivity captured"],
    [442_000, "web_search", "web_search", "recovery and wellness notes", "1 result"],
    [453_000, "web_fetch", "web_fetch", "internal://crm/health-notes", "notes loaded"],
    [466_000, "synthesis", undefined, undefined, "Spa: constraints documented"],
    [478_000, "file_write", "write_to_context", "sensitivities.md", "wrote 480 bytes"],
    [493_000, "web_search", "web_search", "last-stay observations corroboration", "1 result"],
    [504_000, "web_fetch", "web_fetch", "internal://property/notes", "prior note"],
    [517_000, "synthesis", undefined, undefined, "Prior-property note corroborates"],
    [529_000, "web_search", "web_search", "advisor contact and preference", "1 result"],
    [540_000, "web_fetch", "web_fetch", "internal://crm/advisors", "advisor record"],
    [552_000, "synthesis", undefined, undefined, "Advisor preference logged"],
    [565_000, "file_write", "write_to_context", "final-brief.md", "wrote 2.3KB"],
    [580_000, "synthesis", undefined, undefined, "Brief assembled. Three candidate gestures identified."],
  ];
  return eventsRaw.map(([offsetMs, eventType, tool, params, resultPreview]) => ({
    briefId,
    timestampIso: new Date(base + offsetMs).toISOString(),
    eventType,
    tool,
    params,
    resultPreview,
  }));
}

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
      nextArrival: buildArrival("anderson"),
    });

    const chenId = await ctx.db.insert("guests", {
      slug: "chen",
      firstName: "Sarah",
      lastName: "Chen",
      photoUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=240&h=240&fit=crop",
      loyaltyTier: "Rosewood Enthusiast",
      ...CHEN_PROFILE,
      nextArrival: buildArrival("chen"),
    });

    const webbId = await ctx.db.insert("guests", {
      slug: "webb",
      firstName: "Marcus",
      lastName: "Webb",
      photoUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=240&fit=crop",
      loyaltyTier: "Guest",
      ...WEBB_PROFILE,
      nextArrival: buildArrival("webb"),
    });

    for (const o of ANDERSON_OBSERVATIONS) {
      await ctx.db.insert("observations", { guestId: andersonId, ...o });
    }
    for (const o of CHEN_OBSERVATIONS) {
      await ctx.db.insert("observations", { guestId: chenId, ...o });
    }
    for (const o of WEBB_OBSERVATIONS) {
      await ctx.db.insert("observations", { guestId: webbId, ...o });
    }

    for (const s of ANDERSON_SIGNALS) {
      await ctx.db.insert("externalSignals", { guestId: andersonId, ...s });
    }
    for (const s of CHEN_SIGNALS) {
      await ctx.db.insert("externalSignals", { guestId: chenId, ...s });
    }
    for (const s of WEBB_SIGNALS) {
      await ctx.db.insert("externalSignals", { guestId: webbId, ...s });
    }

    const andersonBriefId = await ctx.db.insert("briefs", {
      guestId: andersonId,
      generatedAtIso: new Date(Date.now() - 18 * 3600_000).toISOString(),
      ...ANDERSON_BRIEF,
    });
    const chenBriefId = await ctx.db.insert("briefs", {
      guestId: chenId,
      generatedAtIso: new Date(Date.now() - 12 * 3600_000).toISOString(),
      ...CHEN_BRIEF,
    });
    const webbBriefId = await ctx.db.insert("briefs", {
      guestId: webbId,
      generatedAtIso: new Date(Date.now() - 9 * 3600_000).toISOString(),
      ...WEBB_BRIEF,
    });

    for (const rp of ROLE_PERMISSIONS) {
      await ctx.db.insert("rolePermissions", rp);
    }

    return { andersonId, chenId, webbId, andersonBriefId, chenBriefId, webbBriefId };
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
    const eventsRaw: Array<[number, string, string?, string?, string?]> = [
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

/**
 * Idempotent enrichment for the live demo DB.
 *
 * - Shifts all check-in / car-ETA timestamps to after 9:15pm tonight (local time).
 * - Strips "restaurant" from the Mia/pool observation so role filtering is strict.
 * - Backfills Chen and Webb with advisor, lifetime spend, observations,
 *   external signals, and a James-level brief + agent-event trail.
 *
 * Safe to run multiple times: each insert checks for an existing match first.
 */
export const enrichGuestSeed = mutation({
  args: {},
  handler: async (ctx) => {
    const guests = await ctx.db.query("guests").collect();
    const bySlug = Object.fromEntries(guests.map((g) => [g.slug, g]));

    const anderson = bySlug["anderson"];
    const chen = bySlug["chen"];
    const webb = bySlug["webb"];

    if (anderson) {
      await ctx.db.patch(anderson._id, {
        nextArrival: { ...anderson.nextArrival!, ...buildArrival("anderson") },
      });
    }
    if (chen) {
      await ctx.db.patch(chen._id, {
        ...CHEN_PROFILE,
        nextArrival: { ...chen.nextArrival!, ...buildArrival("chen") },
      });
    }
    if (webb) {
      await ctx.db.patch(webb._id, {
        ...WEBB_PROFILE,
        nextArrival: { ...webb.nextArrival!, ...buildArrival("webb") },
      });
    }

    // Tighten the Mia / pool observation: remove "restaurant" from applicable roles.
    if (anderson) {
      const obs = await ctx.db
        .query("observations")
        .withIndex("by_guestId", (q) => q.eq("guestId", anderson._id))
        .collect();
      for (const o of obs) {
        if (
          o.rawText.includes("daughter Mia") &&
          o.extracted.applicableRoles.includes("restaurant")
        ) {
          await ctx.db.patch(o._id, {
            extracted: {
              ...o.extracted,
              applicableRoles: o.extracted.applicableRoles.filter(
                (r) => r !== "restaurant"
              ),
            },
          });
        }
      }
    }

    async function ensureObservations(
      guestId: Id<"guests">,
      seeds: ObservationSeed[]
    ) {
      const existing = await ctx.db
        .query("observations")
        .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
        .collect();
      const seen = new Set(existing.map((o) => o.rawText));
      for (const s of seeds) {
        if (!seen.has(s.rawText)) {
          await ctx.db.insert("observations", { guestId, ...s });
        }
      }
    }

    async function ensureSignals(
      guestId: Id<"guests">,
      seeds: ExternalSignalSeed[]
    ) {
      const existing = await ctx.db
        .query("externalSignals")
        .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
        .collect();
      const seen = new Set(existing.map((s) => `${s.platform}|${s.venue}`));
      for (const s of seeds) {
        if (!seen.has(`${s.platform}|${s.venue}`)) {
          await ctx.db.insert("externalSignals", { guestId, ...s });
        }
      }
    }

    async function ensureBrief(
      guestId: Id<"guests">,
      seed: BriefSeed,
      hoursAgo: number
    ) {
      const existing = await ctx.db
        .query("briefs")
        .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
        .collect();
      if (existing.length > 0) return existing[0]._id;
      const briefId = await ctx.db.insert("briefs", {
        guestId,
        generatedAtIso: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
        ...seed,
      });
      const base = Date.now() - hoursAgo * 3600_000;
      for (const e of buildAgentEvents(briefId, base)) {
        await ctx.db.insert("agentEvents", e);
      }
      return briefId;
    }

    if (chen) {
      await ensureObservations(chen._id, CHEN_OBSERVATIONS);
      await ensureSignals(chen._id, CHEN_SIGNALS);
      await ensureBrief(chen._id, CHEN_BRIEF, 12);
    }
    if (webb) {
      await ensureObservations(webb._id, WEBB_OBSERVATIONS);
      await ensureSignals(webb._id, WEBB_SIGNALS);
      await ensureBrief(webb._id, WEBB_BRIEF, 9);
    }

    // Re-seat role permissions so restaurant no longer subscribes to "family".
    const perms = await ctx.db.query("rolePermissions").collect();
    for (const p of perms) await ctx.db.delete(p._id);
    for (const rp of ROLE_PERMISSIONS) {
      await ctx.db.insert("rolePermissions", rp);
    }

    return {
      anderson: anderson?._id,
      chen: chen?._id,
      webb: webb?._id,
    };
  },
});
