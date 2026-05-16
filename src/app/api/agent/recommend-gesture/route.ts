import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import Anthropic from "@anthropic-ai/sdk";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import {
  buildGuestContext,
  handleWriteToolUse,
} from "@/lib/agent-tools";

export const runtime = "nodejs";
export const maxDuration = 150;

const HARD_DEADLINE_MS = 120_000;

type RouteBody = { observationId: string; guestId: string };

function buildKickoff(args: {
  guest: Doc<"guests">;
  observations: Doc<"observations">[];
  signals: Doc<"externalSignals">[];
  brief: Doc<"briefs">;
  newObservationId: string;
}): string {
  return `A new observation was just captured for this guest. Follow your workflow: decide which channel(s) apply (submit_gesture, add_highlight, add_staff_note), then call the appropriate tool(s). Most observations produce exactly one record. If the observation is purely trivial, end your turn without calling any tool.

${buildGuestContext({
  guest: args.guest,
  observations: args.observations,
  signals: args.signals,
  brief: args.brief,
  newObservationId: args.newObservationId,
})}

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
        const result = await handleWriteToolUse({
          anthropic,
          convex,
          sessionId: session.id,
          briefId,
          event: event as {
            id: string;
            name: string;
            input: Record<string, unknown>;
          },
        });
        if (result.ok) submitted = true;
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
