import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

export const runtime = "nodejs";
export const maxDuration = 150;

const HARD_DEADLINE_MS = 120_000;

const gestureSchema = z.object({
  title: z.string().min(1).max(120),
  rationale: z.string().min(1).max(400),
  estCostHkd: z.number().min(0),
  availability: z.enum([
    "confirmed_in_directory",
    "novel_idea",
    "requires_approval",
  ]),
});

const highlightSchema = z.object({
  fact: z.string().min(1).max(140),
  source: z.string().min(1).max(80),
});

const staffNoteSchema = z.object({
  text: z.string().min(1).max(140),
});

type RouteBody = { observationId: string; guestId: string };

function buildKickoff(args: {
  guest: Doc<"guests">;
  observations: Doc<"observations">[];
  signals: Doc<"externalSignals">[];
  brief: Doc<"briefs">;
  newObservationId: string;
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

  const observationsBlock = observations
    .map((o) => {
      const flag = o._id === newObservationId ? " [NEW — just captured]" : "";
      return [
        `- capturedAt: ${o.capturedAtIso}${flag}`,
        `  by: ${o.capturedBy.name} (${o.capturedBy.role})`,
        `  raw: ${JSON.stringify(o.rawText)}`,
        `  summary: ${o.extracted.summary}`,
        `  categories: [${o.extracted.categories.join(", ")}]`,
        `  facts: ${JSON.stringify(o.extracted.facts)}`,
      ].join("\n");
    })
    .join("\n");

  const signalsBlock = signals.length
    ? signals
        .map(
          (s) =>
            `- ${s.platform} / ${s.venue} (${s.reviewDateIso}, ${s.rating}/5): ${JSON.stringify(s.excerpt)}`
        )
        .join("\n")
    : "(none)";

  const sensitivitiesBlock = brief.sensitivities.length
    ? brief.sensitivities.map((s) => `- ${s}`).join("\n")
    : "(none)";

  const existingGesturesBlock = brief.suggestedGestures.length
    ? brief.suggestedGestures
        .map(
          (g) =>
            `- ${g.title} (HKD ${g.estCostHkd}, ${g.availability}, status=${g.status})\n  ${g.rationale}`
        )
        .join("\n")
    : "(none yet)";

  const existingHighlightsBlock = brief.keyFacts.length
    ? brief.keyFacts.map((k) => `- ${k.fact} (source: ${k.source})`).join("\n")
    : "(none yet)";

  return `A new observation was just captured for this guest. Follow your workflow: decide which channel(s) apply (submit_gesture, add_highlight, add_staff_note), then call the appropriate tool(s). Most observations produce exactly one record. If the observation is purely trivial, end your turn without calling any tool.

=== GUEST ===
${guestBlock}

=== OBSERVATIONS (newest first) ===
${observationsBlock}

=== EXTERNAL SIGNALS ===
${signalsBlock}

=== EXISTING STAFF NOTES / SENSITIVITIES (do not repeat) ===
${sensitivitiesBlock}

=== EXISTING HIGHLIGHTS / KEY FACTS (do not repeat) ===
${existingHighlightsBlock}

=== EXISTING SUGGESTED GESTURES (do not repeat) ===
${existingGesturesBlock}

Do not write a chat reply.`;
}

function statusLabel(event: { type: string; name?: string }): string {
  switch (event.type) {
    case "session.status_running":
      return "thinking";
    case "agent.thinking":
      return "reasoning";
    case "agent.tool_use":
      return event.name ? `tool: ${event.name}` : "tool";
    case "agent.custom_tool_use":
      if (event.name === "submit_gesture") return "writing gesture";
      if (event.name === "add_highlight") return "writing highlight";
      if (event.name === "add_staff_note") return "writing staff note";
      return `custom: ${event.name ?? ""}`;
    case "agent.message":
      return "drafting";
    case "session.status_idle":
      return "idle";
    default:
      return event.type;
  }
}

export async function POST(req: Request) {
  let body: RouteBody;
  try {
    body = (await req.json()) as RouteBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!body?.observationId || !body?.guestId) {
    return NextResponse.json(
      { error: "observationId and guestId required" },
      { status: 400 }
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const agentId = process.env.ANTHROPIC_AGENT_ID;
  const envId = process.env.ANTHROPIC_ENV_ID;
  const fileId = process.env.ANTHROPIC_EXPERIENCES_FILE_ID;
  if (!convexUrl || !apiKey || !agentId || !envId || !fileId) {
    console.error("[recommend-gesture] missing env config", {
      hasConvex: !!convexUrl,
      hasApi: !!apiKey,
      hasAgent: !!agentId,
      hasEnv: !!envId,
      hasFile: !!fileId,
    });
    return NextResponse.json({ error: "agent not configured" }, { status: 500 });
  }

  const convex = new ConvexHttpClient(convexUrl);
  const guestId = body.guestId as Id<"guests">;

  const brief = await convex.query(api.briefs.getForGuest, { guestId });
  if (!brief) {
    return NextResponse.json({ error: "no brief for guest" }, { status: 404 });
  }
  const briefId = brief._id;

  await convex.mutation(api.briefs.setGestureLoading, {
    briefId,
    loading: true,
    status: "starting",
  });

  const anthropic = new Anthropic({ apiKey });
  const startedAt = performance.now();
  const remaining = () => HARD_DEADLINE_MS - (performance.now() - startedAt);

  const updateStatus = async (status: string) => {
    try {
      await convex.mutation(api.briefs.setGestureLoading, {
        briefId,
        loading: true,
        status,
      });
    } catch (err) {
      console.error("[recommend-gesture] status update failed", err);
    }
  };

  try {
    const [guestDoc, observations, signals] = await Promise.all([
      loadGuestById(convex, guestId),
      convex.query(api.observations.listForGuest, { guestId }),
      convex.query(api.externalSignals.listForGuest, { guestId }),
    ]);
    if (!guestDoc) {
      throw new Error("guest not found");
    }

    const kickoff = buildKickoff({
      guest: guestDoc,
      observations,
      signals,
      brief,
      newObservationId: body.observationId,
    });

    await updateStatus("creating session");

    const session = await anthropic.beta.sessions.create({
      agent: agentId,
      environment_id: envId,
      title: `Gesture for ${guestDoc.firstName} ${guestDoc.lastName}`,
      resources: [
        {
          type: "file",
          file_id: fileId,
          mount_path: "/workspace/experiences/rosewood-hong-kong.md",
        },
      ],
    });

    await updateStatus("connecting");

    const stream = await anthropic.beta.sessions.events.stream(session.id);

    anthropic.beta.sessions.events
      .send(session.id, {
        events: [
          {
            type: "user.message",
            content: [{ type: "text", text: kickoff }],
          },
        ],
      })
      .catch((err) => {
        console.error("[recommend-gesture] initial send failed", err);
      });

    let submitted = false;

    for await (const event of stream) {
      if (remaining() <= 0) {
        console.warn("[recommend-gesture] hard deadline reached, breaking");
        break;
      }

      const label = statusLabel(
        event as { type: string; name?: string }
      );
      void updateStatus(label);

      if (event.type === "agent.custom_tool_use") {
        const handled = await handleCustomToolUse({
          anthropic,
          convex,
          sessionId: session.id,
          briefId,
          event,
        });
        if (handled) submitted = true;
        continue;
      }

      if (event.type === "session.status_terminated") break;
      if (event.type === "session.status_idle") {
        const reason = event.stop_reason?.type;
        if (reason !== "requires_action") break;
      }
    }

    return NextResponse.json({ ok: true, submitted });
  } catch (err) {
    console.error("[recommend-gesture] error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  } finally {
    try {
      await convex.mutation(api.briefs.setGestureLoading, {
        briefId,
        loading: false,
      });
    } catch (err) {
      console.error("[recommend-gesture] cleanup failed", err);
    }
  }
}

async function loadGuestById(
  convex: ConvexHttpClient,
  guestId: Id<"guests">
): Promise<Doc<"guests"> | null> {
  const all = await convex.query(api.guests.listAll, {});
  return all.find((g) => g._id === guestId) ?? null;
}

type CustomToolUseEvent = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

async function handleCustomToolUse(args: {
  anthropic: Anthropic;
  convex: ConvexHttpClient;
  sessionId: string;
  briefId: Id<"briefs">;
  event: CustomToolUseEvent;
}): Promise<boolean> {
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
      console.error(
        "[recommend-gesture] submit_gesture validation failed",
        parsed.error.flatten()
      );
      await reply(
        `Validation failed: ${JSON.stringify(
          parsed.error.flatten().fieldErrors
        )}. Resubmit with valid input.`,
        true
      );
      return false;
    }
    await convex.mutation(api.briefs.appendSuggestedGesture, {
      briefId,
      gesture: parsed.data,
    });
    await reply("ok");
    return true;
  }

  if (event.name === "add_highlight") {
    const parsed = highlightSchema.safeParse(event.input);
    if (!parsed.success) {
      console.error(
        "[recommend-gesture] add_highlight validation failed",
        parsed.error.flatten()
      );
      await reply(
        `Validation failed: ${JSON.stringify(
          parsed.error.flatten().fieldErrors
        )}. Resubmit with valid input.`,
        true
      );
      return false;
    }
    await convex.mutation(api.briefs.appendHighlight, {
      briefId,
      highlight: parsed.data,
    });
    await reply("ok");
    return true;
  }

  if (event.name === "add_staff_note") {
    const parsed = staffNoteSchema.safeParse(event.input);
    if (!parsed.success) {
      console.error(
        "[recommend-gesture] add_staff_note validation failed",
        parsed.error.flatten()
      );
      await reply(
        `Validation failed: ${JSON.stringify(
          parsed.error.flatten().fieldErrors
        )}. Resubmit with valid input.`,
        true
      );
      return false;
    }
    await convex.mutation(api.briefs.appendStaffNote, {
      briefId,
      text: parsed.data.text,
    });
    await reply("ok");
    return true;
  }

  await reply(
    `Unknown tool ${event.name}. Choose submit_gesture, add_highlight, or add_staff_note.`,
    true
  );
  return false;
}
