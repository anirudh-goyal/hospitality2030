import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import type { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export const EXPERIENCES_MOUNT_PATH =
  "/mnt/session/uploads/workspace/experiences/rosewood-hong-kong.md";

// JSON Schemas passed to the Anthropic Agents API (custom tool input_schema).
export const SUBMIT_GESTURE_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    title: {
      type: "string",
      description:
        "Short, concrete name for the gesture (max 80 chars). Avoid adjectives like 'curated' or 'bespoke'.",
    },
    rationale: {
      type: "string",
      description:
        "Why this gesture for this guest right now (max 280 chars). Cite the observation or signal that inspired it.",
    },
    estCostHkd: {
      type: "number",
      minimum: 0,
      description: "Estimated cost in HKD. 0 is allowed for no-cost gestures.",
    },
    availability: {
      type: "string",
      enum: ["confirmed_in_directory", "novel_idea", "requires_approval"],
      description:
        "confirmed_in_directory if drawn from the experiences directory; novel_idea if your own invention within spend authority; requires_approval if estCostHkd exceeds 1560 HKD (USD $200) or the gesture needs front-office sign-off.",
    },
  },
  required: ["title", "rationale", "estCostHkd", "availability"],
};

export const ADD_HIGHLIGHT_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    fact: {
      type: "string",
      description:
        "One concrete fact about the guest worth surfacing in the brief, written as a single short sentence. Strict: 6 to 15 words. Renders on a single line in the brief's Highlights row, so brevity matters. Example: 'Drinks Casa Dragones Joven, neat, after dinner.'",
    },
    source: {
      type: "string",
      description:
        "Where the fact came from, mono-tagged and right-aligned in the row. Strict: 3 to 10 words. Use role + property + month/day; never staff names. Example: 'Restaurant, Rosewood London - Apr 22'.",
    },
  },
  required: ["fact", "source"],
};

export const ADD_STAFF_NOTE_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    text: {
      type: "string",
      description:
        "A single 'do not mention' or operational sensitivity for the brief's Staff Notes block. Strict: 6 to 15 words. Renders as a short bullet — keep it scannable. Examples: 'Severe shellfish allergy - do not mention by name at dining.' or 'Spouse not traveling - do not reference her.'",
    },
  },
  required: ["text"],
};

export const gestureSchema = z.object({
  title: z.string().min(1).max(120),
  rationale: z.string().min(1).max(400),
  estCostHkd: z.number().min(0),
  availability: z.enum([
    "confirmed_in_directory",
    "novel_idea",
    "requires_approval",
  ]),
});

export const highlightSchema = z.object({
  fact: z.string().min(1).max(140),
  source: z.string().min(1).max(80),
});

export const staffNoteSchema = z.object({
  text: z.string().min(1).max(140),
});

export const SHARED_WRITING_RULES = `Tool-specific constraints:

submit_gesture:
- Spend authority: USD $200 / guest / day (approximately HKD $1,560) auto-approves. Anything above must be tagged availability: "requires_approval".
- Never propose anything that contradicts the guest's sensitivities (staff notes).
- Never repeat a gesture (or near-duplicate) already in the existing suggestedGestures list.
- Prefer locally-rooted Hong Kong experiences over generic luxury tropes.

add_highlight:
- fact: 6 to 15 words. One concrete sentence. Renders on a single brief row, so brevity matters. Example: "Drinks Casa Dragones Joven, neat, after dinner."
- source: 3 to 10 words. Role + property + month/day; never staff names. Example: "Restaurant, Rosewood London - Apr 22".
- Don't add a highlight that duplicates an existing keyFact.

add_staff_note:
- text: 6 to 15 words. Renders as a bullet under "Do not mention". Be operational, not narrative. Example: "Severe shellfish allergy - do not mention by name at dining."
- Don't add a note that duplicates an existing sensitivity.

Shared writing rules:
- The rationale/fact/text fields are read by working staff in real time. Write like a colleague: specific, no marketing language, no adjectives like "curated" or "bespoke".
- When citing the source of a fact, refer to the staff member by their role and property, never by name. For example: "a bartender at Rosewood London logged a standing order for Casa Dragones Joven," not "Daniel R. logged a standing order for Casa Dragones Joven." Same rule for advisors, GMs, and any other named source — anonymize as "the guest's advisor," "the GM at Rosewood Hong Kong," etc. The guest's own name is fine to use.`;

export type CustomTools = readonly [
  {
    type: "agent_toolset_20260401";
    default_config: { enabled: false };
    configs: Array<{
      name: "read" | "web_search" | "web_fetch";
      enabled: true;
    }>;
  },
  {
    type: "custom";
    name: "submit_gesture";
    description: string;
    input_schema: typeof SUBMIT_GESTURE_INPUT_SCHEMA;
  },
  {
    type: "custom";
    name: "add_highlight";
    description: string;
    input_schema: typeof ADD_HIGHLIGHT_INPUT_SCHEMA;
  },
  {
    type: "custom";
    name: "add_staff_note";
    description: string;
    input_schema: typeof ADD_STAFF_NOTE_INPUT_SCHEMA;
  },
];

export function buildSharedToolList() {
  return [
    {
      type: "agent_toolset_20260401" as const,
      default_config: { enabled: false },
      configs: [
        { name: "read" as const, enabled: true },
        { name: "web_search" as const, enabled: true },
        { name: "web_fetch" as const, enabled: true },
      ],
    },
    {
      type: "custom" as const,
      name: "submit_gesture",
      description:
        "Add a new pre-arrival or in-stay gesture to the brief's Suggested Gestures block. Use for actionable property-side ideas the team could execute. Call once per gesture; usually at most one per invocation.",
      input_schema: SUBMIT_GESTURE_INPUT_SCHEMA,
    },
    {
      type: "custom" as const,
      name: "add_highlight",
      description:
        "Add a single short fact to the brief's Highlights block (a.k.a. keyFacts). Use for durable guest preferences, habits, family details, milestones, or interests staff should remember. Renders as a one-line row with a mono source tag on the right. Strict word caps: fact 6-15 words, source 3-10 words.",
      input_schema: ADD_HIGHLIGHT_INPUT_SCHEMA,
    },
    {
      type: "custom" as const,
      name: "add_staff_note",
      description:
        "Add a single 'do not mention' or operational sensitivity to the brief's Staff Notes block (a.k.a. sensitivities). Use for allergies, relationship/health details, strong dislikes — things the team must handle with care. Renders as a short bullet. Strict word cap: 6-15 words.",
      input_schema: ADD_STAFF_NOTE_INPUT_SCHEMA,
    },
  ];
}

export function buildGuestContext(args: {
  guest: Doc<"guests">;
  observations: Doc<"observations">[];
  signals: Doc<"externalSignals">[];
  brief: Doc<"briefs"> | null;
  newObservationId?: string;
}): string {
  const { guest, observations, signals, brief, newObservationId } = args;

  const guestBlock = JSON.stringify(
    {
      name: `${guest.firstName} ${guest.lastName}`,
      loyaltyTier: guest.loyaltyTier,
      firstStayDate: guest.firstStayDate,
      totalStays: guest.totalStays,
      lifetimeSpendUsd: guest.lifetimeSpendUsd,
      advisor: guest.advisor,
      nextArrival: guest.nextArrival,
    },
    null,
    2
  );

  const observationsBlock = observations.length
    ? observations
        .map((o) => {
          const flag =
            newObservationId && o._id === newObservationId
              ? " [NEW — just captured]"
              : "";
          return [
            `- capturedAt: ${o.capturedAtIso}${flag}`,
            `  by: ${o.capturedBy.name} (${o.capturedBy.role})`,
            `  raw: ${JSON.stringify(o.rawText)}`,
            `  summary: ${o.extracted.summary}`,
            `  categories: [${o.extracted.categories.join(", ")}]`,
            `  facts: ${JSON.stringify(o.extracted.facts)}`,
          ].join("\n");
        })
        .join("\n")
    : "(no observations yet)";

  const signalsBlock = signals.length
    ? signals
        .map(
          (s) =>
            `- ${s.platform} / ${s.venue} (${s.reviewDateIso}, ${s.rating}/5): ${JSON.stringify(s.excerpt)}`
        )
        .join("\n")
    : "(none)";

  const sensitivitiesBlock = brief?.sensitivities.length
    ? brief.sensitivities.map((s) => `- ${s}`).join("\n")
    : "(none)";

  const existingGesturesBlock = brief?.suggestedGestures.length
    ? brief.suggestedGestures
        .map(
          (g) =>
            `- ${g.title} (HKD ${g.estCostHkd}, ${g.availability}, status=${g.status})\n  ${g.rationale}`
        )
        .join("\n")
    : "(none yet)";

  const existingHighlightsBlock = brief?.keyFacts.length
    ? brief.keyFacts.map((k) => `- ${k.fact} (source: ${k.source})`).join("\n")
    : "(none yet)";

  const briefStatus = brief
    ? ""
    : "\n(NOTE: no brief generated yet for this guest)\n";

  return `=== GUEST ===
${guestBlock}
${briefStatus}
=== OBSERVATIONS (newest first) ===
${observationsBlock}

=== EXTERNAL SIGNALS ===
${signalsBlock}

=== EXISTING STAFF NOTES / SENSITIVITIES (do not repeat) ===
${sensitivitiesBlock}

=== EXISTING HIGHLIGHTS / KEY FACTS (do not repeat) ===
${existingHighlightsBlock}

=== EXISTING SUGGESTED GESTURES (do not repeat) ===
${existingGesturesBlock}`;
}

export type CustomToolUseEvent = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type ToolHandlerResult =
  | { ok: true; tool: "submit_gesture"; data: z.infer<typeof gestureSchema> }
  | { ok: true; tool: "add_highlight"; data: z.infer<typeof highlightSchema> }
  | { ok: true; tool: "add_staff_note"; data: z.infer<typeof staffNoteSchema> }
  | { ok: false; tool: string; message: string };

/**
 * Validate a write-tool call, execute the matching Convex mutation, and reply
 * to the agent session with a tool result. Returns a typed result the caller
 * can use to emit UI events.
 */
export async function handleWriteToolUse(args: {
  anthropic: Anthropic;
  convex: ConvexHttpClient;
  sessionId: string;
  briefId: Id<"briefs">;
  event: CustomToolUseEvent;
}): Promise<ToolHandlerResult> {
  const { anthropic, convex, sessionId, briefId, event } = args;

  const reply = (text: string, isError = false) =>
    anthropic.beta.sessions.events.send(sessionId, {
      events: [
        {
          type: "user.custom_tool_result",
          custom_tool_use_id: event.id,
          content: [{ type: "text", text }],
          is_error: isError,
        },
      ],
    });

  if (event.name === "submit_gesture") {
    const parsed = gestureSchema.safeParse(event.input);
    if (!parsed.success) {
      const message = `Validation failed: ${JSON.stringify(
        parsed.error.flatten().fieldErrors
      )}. Resubmit with valid input.`;
      await reply(message, true);
      return { ok: false, tool: "submit_gesture", message };
    }
    await convex.mutation(api.briefs.appendSuggestedGesture, {
      briefId,
      gesture: parsed.data,
    });
    await reply("ok");
    return { ok: true, tool: "submit_gesture", data: parsed.data };
  }

  if (event.name === "add_highlight") {
    const parsed = highlightSchema.safeParse(event.input);
    if (!parsed.success) {
      const message = `Validation failed: ${JSON.stringify(
        parsed.error.flatten().fieldErrors
      )}. Resubmit with valid input.`;
      await reply(message, true);
      return { ok: false, tool: "add_highlight", message };
    }
    await convex.mutation(api.briefs.appendHighlight, {
      briefId,
      highlight: parsed.data,
    });
    await reply("ok");
    return { ok: true, tool: "add_highlight", data: parsed.data };
  }

  if (event.name === "add_staff_note") {
    const parsed = staffNoteSchema.safeParse(event.input);
    if (!parsed.success) {
      const message = `Validation failed: ${JSON.stringify(
        parsed.error.flatten().fieldErrors
      )}. Resubmit with valid input.`;
      await reply(message, true);
      return { ok: false, tool: "add_staff_note", message };
    }
    await convex.mutation(api.briefs.appendStaffNote, {
      briefId,
      text: parsed.data.text,
    });
    await reply("ok");
    return { ok: true, tool: "add_staff_note", data: parsed.data };
  }

  const message = `Unknown tool ${event.name}. Choose submit_gesture, add_highlight, or add_staff_note.`;
  await reply(message, true);
  return { ok: false, tool: event.name, message };
}
