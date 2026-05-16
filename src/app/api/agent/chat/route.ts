import { ConvexHttpClient } from "convex/browser";
import Anthropic from "@anthropic-ai/sdk";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import {
  buildGuestContext,
  handleWriteToolUse,
  type CustomToolUseEvent,
} from "@/lib/agent-tools";

export const runtime = "nodejs";
export const maxDuration = 150;

const HARD_DEADLINE_MS = 120_000;

type ChatTurn = { role: "user" | "assistant"; content: string };
type RouteBody = { guestId: string; messages: ChatTurn[] };

export type ChatEvent =
  | {
      type: "step_start";
      id: string;
      kind: "thinking" | "read" | "web_search" | "web_fetch";
      label: string;
    }
  | { type: "step_end"; id: string }
  | { type: "message_delta"; text: string }
  | {
      type: "tool_call";
      id: string;
      name: "submit_gesture" | "add_highlight" | "add_staff_note";
      input: unknown;
      result: "ok" | "rejected";
      resultMessage?: string;
    }
  | { type: "done" }
  | { type: "error"; message: string };

function buildKickoff(args: {
  guest: Doc<"guests">;
  observations: Doc<"observations">[];
  signals: Doc<"externalSignals">[];
  brief: Doc<"briefs"> | null;
  messages: ChatTurn[];
}): string {
  const context = buildGuestContext({
    guest: args.guest,
    observations: args.observations,
    signals: args.signals,
    brief: args.brief,
  });

  const transcript = args.messages
    .map((m) => `${m.role === "user" ? "STAFF" : "ASSISTANT"}: ${m.content}`)
    .join("\n\n");

  return `${context}

=== CONVERSATION SO FAR ===
${transcript}

Reply to the latest STAFF message following all rules in your system prompt. Remember the confirmation gate: never call submit_gesture, add_highlight, or add_staff_note without explicit user approval in chat — propose first, wait, only call the tool after the user says yes.`;
}

function describeToolUse(event: {
  name?: string;
  input?: Record<string, unknown>;
}): {
  kind: "read" | "web_search" | "web_fetch" | null;
  label: string;
} {
  if (event.name === "read") {
    return { kind: "read", label: "Reading experiences directory" };
  }
  if (event.name === "web_search") {
    const query =
      typeof event.input?.query === "string"
        ? event.input.query
        : "the web";
    return { kind: "web_search", label: `Searching: ${query}` };
  }
  if (event.name === "web_fetch") {
    const url =
      typeof event.input?.url === "string" ? event.input.url : "a page";
    return { kind: "web_fetch", label: `Fetching: ${url}` };
  }
  return { kind: null, label: "" };
}

export async function POST(req: Request) {
  let body: RouteBody;
  try {
    body = (await req.json()) as RouteBody;
  } catch {
    return new Response(JSON.stringify({ error: "invalid body" }), {
      status: 400,
    });
  }
  if (
    !body?.guestId ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0
  ) {
    return new Response(
      JSON.stringify({ error: "guestId and messages required" }),
      { status: 400 }
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const agentId = process.env.ANTHROPIC_CHAT_AGENT_ID;
  const envId = process.env.ANTHROPIC_ENV_ID;
  const fileId = process.env.ANTHROPIC_EXPERIENCES_FILE_ID;

  if (!convexUrl || !apiKey || !agentId || !envId || !fileId) {
    console.error("[chat] missing env config", {
      hasConvex: !!convexUrl,
      hasApi: !!apiKey,
      hasChatAgent: !!agentId,
      hasEnv: !!envId,
      hasFile: !!fileId,
    });
    return new Response(
      JSON.stringify({
        error:
          "chat agent not configured (run `pnpm setup-chat-agent`)",
      }),
      { status: 500 }
    );
  }

  const convex = new ConvexHttpClient(convexUrl);
  const guestId = body.guestId as Id<"guests">;

  const [guestDoc, brief, observations, signals] = await Promise.all([
    loadGuestById(convex, guestId),
    convex.query(api.briefs.getForGuest, { guestId }),
    convex.query(api.observations.listForGuest, { guestId }),
    convex.query(api.externalSignals.listForGuest, { guestId }),
  ]);

  if (!guestDoc) {
    return new Response(JSON.stringify({ error: "guest not found" }), {
      status: 404,
    });
  }

  const kickoff = buildKickoff({
    guest: guestDoc,
    observations,
    signals,
    brief,
    messages: body.messages,
  });

  const anthropic = new Anthropic({ apiKey });
  const encoder = new TextEncoder();
  const startedAt = performance.now();
  const remaining = () => HARD_DEADLINE_MS - (performance.now() - startedAt);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      try {
        const session = await anthropic.beta.sessions.create({
          agent: agentId,
          environment_id: envId,
          title: `Concierge chat — ${guestDoc.firstName} ${guestDoc.lastName}`,
          resources: [
            {
              type: "file",
              file_id: fileId,
              mount_path: "/workspace/experiences/rosewood-hong-kong.md",
            },
          ],
        });

        const eventStream = await anthropic.beta.sessions.events.stream(
          session.id
        );

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
            console.error("[chat] initial send failed", err);
          });

        const openSteps = new Map<string, string>(); // tool_use_id -> step id

        for await (const event of eventStream) {
          if (closed) break;
          if (remaining() <= 0) {
            send({ type: "error", message: "Timed out" });
            break;
          }

          const typedEvent = event as unknown as {
            type: string;
            id?: string;
            name?: string;
            input?: Record<string, unknown>;
            content?: Array<{ type: string; text?: string }>;
            stop_reason?: { type?: string };
          };

          if (typedEvent.type === "agent.thinking") {
            const stepId = `thinking-${typedEvent.id ?? Date.now()}`;
            send({
              type: "step_start",
              id: stepId,
              kind: "thinking",
              label: "Thinking",
            });
            // No matching end event for thinking; end immediately so it shows as completed.
            send({ type: "step_end", id: stepId });
            continue;
          }

          if (typedEvent.type === "agent.tool_use" && typedEvent.id) {
            const { kind, label } = describeToolUse(typedEvent);
            if (kind) {
              const stepId = typedEvent.id;
              openSteps.set(typedEvent.id, stepId);
              send({ type: "step_start", id: stepId, kind, label });
            }
            continue;
          }

          if (typedEvent.type === "agent.tool_result" && typedEvent.id) {
            const stepId = openSteps.get(typedEvent.id);
            if (stepId) {
              send({ type: "step_end", id: stepId });
              openSteps.delete(typedEvent.id);
            }
            continue;
          }

          if (typedEvent.type === "agent.message") {
            const text = (typedEvent.content ?? [])
              .map((c) => (c.type === "text" ? c.text ?? "" : ""))
              .join("");
            if (text) {
              send({ type: "message_delta", text });
            }
            continue;
          }

          if (typedEvent.type === "agent.custom_tool_use" && typedEvent.id && typedEvent.name) {
            // Close any still-open research steps to keep the UI tidy.
            for (const [, stepId] of openSteps) {
              send({ type: "step_end", id: stepId });
            }
            openSteps.clear();

            const toolEvent: CustomToolUseEvent = {
              id: typedEvent.id,
              name: typedEvent.name,
              input: typedEvent.input ?? {},
            };

            const briefForWrite = await convex.query(
              api.briefs.getForGuest,
              { guestId }
            );
            if (!briefForWrite) {
              send({
                type: "tool_call",
                id: toolEvent.id,
                name: toolEvent.name as
                  | "submit_gesture"
                  | "add_highlight"
                  | "add_staff_note",
                input: toolEvent.input,
                result: "rejected",
                resultMessage: "No brief exists for this guest yet.",
              });
              continue;
            }

            const result = await handleWriteToolUse({
              anthropic,
              convex,
              sessionId: session.id,
              briefId: briefForWrite._id,
              event: toolEvent,
            });

            send({
              type: "tool_call",
              id: toolEvent.id,
              name: toolEvent.name as
                | "submit_gesture"
                | "add_highlight"
                | "add_staff_note",
              input: toolEvent.input,
              result: result.ok ? "ok" : "rejected",
              resultMessage: result.ok ? undefined : result.message,
            });
            continue;
          }

          if (typedEvent.type === "session.status_terminated") break;
          if (typedEvent.type === "session.status_idle") {
            const reason = typedEvent.stop_reason?.type;
            if (reason !== "requires_action") break;
          }
        }

        send({ type: "done" });
      } catch (err) {
        console.error("[chat] stream error", err);
        const message =
          err instanceof Error ? err.message : "Unexpected agent error";
        try {
          send({ type: "error", message });
        } catch {
          /* controller might be closed */
        }
      } finally {
        close();
      }
    },
    cancel() {
      // Client aborted; session stream is GC'd by the SDK.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function loadGuestById(
  convex: ConvexHttpClient,
  guestId: Id<"guests">
): Promise<Doc<"guests"> | null> {
  const all = await convex.query(api.guests.listAll, {});
  return all.find((g) => g._id === guestId) ?? null;
}
