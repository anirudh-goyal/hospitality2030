# Concierge Chat Agent — Design

**Date:** 2026-05-16
**Status:** Approved, ready for implementation planning
**Owner:** Anirudh

## Purpose

Add a second Managed Agent ("Concierge") to Sense, surfaced as a fourth tab next to Brief / Evidence / Activity on the guest brief page. Staff use it to ask free-form questions about the guest's history and current stay, and to get recommendations. The agent has the same write tools as the existing Observation Agent (`submit_gesture`, `add_highlight`, `add_staff_note`) but is gated by an in-chat confirmation before it ever writes to the brief.

The chat is built on Vercel AI Elements (`Conversation`, `Message`, `ChainOfThought`, `Response`, `PromptInput`, `Suggestion`) and is ephemeral per page load with a "New chat" reset button.

## Architecture overview

A second Anthropic Managed Agent, fully separate from the existing Observation Agent, pinned to its own `ANTHROPIC_CHAT_AGENT_ID` in `.env.local`. Same tool list, same experiences markdown, same environment — different system prompt and different agent_id.

Each user message kicks off a fresh single-shot agent session. There is no persistent server-side conversation state. The full chat transcript and the guest context block are re-sent as the kickoff message every turn. Chat state lives entirely in the client. "New chat" is `setMessages([])`.

### New files

- `scripts/setup-chat-agent.ts` — mirror of `setup-agent.ts`, reuses experiences markdown + environment if their IDs are already in `.env.local`.
- `src/app/api/agent/chat/route.ts` — streaming endpoint that runs the chat agent and emits a JSONL event stream.
- `src/components/chat-tab.tsx` — the chat UI built from AI Elements primitives.
- `src/lib/agent-tools.ts` — shared tool input schemas, zod validators, and the `buildGuestContext()` helper extracted from `recommend-gesture/route.ts`.

### Modified files

- `src/components/brief-view.tsx` — add the fourth tab and route its content to `<ChatTab />`.
- `scripts/setup-agent.ts` — refactored to import shared schemas from `src/lib/agent-tools.ts` (no behavior change).
- `src/app/api/agent/recommend-gesture/route.ts` — refactored to import the shared `buildGuestContext()` and validators (no behavior change).
- `package.json` — add `setup-chat-agent` script.

No Convex schema changes. Existing mutations (`briefs.appendGesture`, `briefs.appendKeyFact`, `briefs.appendSensitivity`) are reused for the write tools.

## Setup script & system prompt

`pnpm setup-chat-agent` runs `scripts/setup-chat-agent.ts`. It:

1. Reuses `ANTHROPIC_EXPERIENCES_FILE_ID` and `ANTHROPIC_ENV_ID` from `.env.local` if present. Otherwise uploads the markdown and creates the environment exactly as `setup-agent.ts` does.
2. Creates or updates a Managed Agent named `"Sense Concierge Agent"`, model `claude-sonnet-4-6`, with the system prompt below.
3. Tool list: `agent_toolset_20260401` with `read`, `web_search`, `web_fetch` enabled; plus the three custom write tools (`submit_gesture`, `add_highlight`, `add_staff_note`) using the shared schemas in `src/lib/agent-tools.ts`.
4. Persists `ANTHROPIC_CHAT_AGENT_ID` to `.env.local`.

### System prompt (long-form will live in `setup-chat-agent.ts`)

Key bullets:

- **Persona.** You are the on-call intelligence assistant for hotel staff at Rosewood Hong Kong. The person typing is a staff member (front desk, concierge, F&B, spa, or housekeeping) asking about a specific guest whose full context is in the kickoff message. Reply like a colleague: short, specific, no marketing adjectives, no "I'd be happy to" filler.
- **Grounding rule.** Every answer must be grounded in the guest's actual observations, signals, sensitivities, highlights, and existing suggested gestures. If the data does not support the answer, say so plainly. Do not invent preferences.
- **Research before recommending.** If the staff member asks for a recommendation, idea, or "what should we do" question, first read the experiences directory at `/mnt/session/uploads/workspace/experiences/rosewood-hong-kong.md`, then optionally run one or two web searches for context (weather, events). For pure history questions ("when did they last stay?", "what allergies do we know about?") skip research.
- **Confirmation gate on writes — strict.** You have three write tools: `submit_gesture`, `add_highlight`, `add_staff_note`. Never call them without explicit user approval. When you want to write, draft the exact record in the chat as a proposal, for example:

  > "I'd like to add this to the brief's Highlights: 'Drinks Casa Dragones Joven, neat, after dinner.' (source: Restaurant, Rosewood London - Apr 22). Want me to add it?"

  Then wait. Only call the tool on the next turn if the user explicitly approves. If they say no or modify, revise and re-ask. One proposal per turn.
- **Shared writing constraints.** Word caps, anonymization (role + property, never staff names), spend authority (USD 200 / guest / day approximately HKD 1,560), and the `requires_approval` rule for write tools are identical to the Observation Agent's. Reuse the same paragraphs.

## API route & streaming protocol

`POST /api/agent/chat`

### Request body

```ts
{
  guestId: Id<"guests">,
  messages: Array<{ role: "user" | "assistant", content: string }>
}
```

### Behavior

1. Fetch `guest`, `brief`, `observations`, `signals` from Convex.
2. Build the kickoff string using the shared `buildGuestContext()`, then append the conversation transcript:

   ```
   === GUEST CONTEXT ===
   <guest block, observations, signals, sensitivities, highlights, existing gestures>

   === CONVERSATION SO FAR ===
   STAFF: <user msg 1>
   ASSISTANT: <assistant msg 1>
   ...
   STAFF: <latest user msg>

   Reply to the latest STAFF message following all rules in your system prompt.
   ```

3. Create a Managed Agent session with `ANTHROPIC_CHAT_AGENT_ID` and send the kickoff as a single user message.
4. Stream the session's events to the client as newline-delimited JSON (one event per line).
5. Hard deadline 120 seconds, same as `recommend-gesture`.

### Event protocol

```ts
type ChatEvent =
  | { type: "step_start"; id: string; kind: "thinking" | "read" | "web_search" | "web_fetch"; label: string }
  | { type: "step_end"; id: string }
  | { type: "message_delta"; text: string }
  | { type: "tool_call"; id: string; name: "submit_gesture" | "add_highlight" | "add_staff_note"; input: unknown; result: "ok" | "rejected"; resultMessage?: string }
  | { type: "done" }
  | { type: "error"; message: string }
```

### Managed-agent event mapping

| Managed-agent event             | Emitted ChatEvent                                                                |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `agent.thinking`                | `step_start { kind: "thinking", label: "Thinking" }`                             |
| `agent.tool_use` name=`read`    | `step_start { kind: "read", label: "Reading experiences directory" }`            |
| `agent.tool_use` name=`web_search` | `step_start { kind: "web_search", label: "Searching: <query>" }` (query from `event.input`) |
| `agent.tool_use` name=`web_fetch`  | `step_start { kind: "web_fetch", label: "Fetching: <url>" }`                  |
| Matching `agent.tool_result`    | `step_end { id }`                                                                |
| `agent.message` chunk           | `message_delta { text }`                                                         |
| `agent.custom_tool_use` (write) | Validate input with shared zod, run the Convex mutation, emit `tool_call { result: "ok" }`. On validation failure emit `tool_call { result: "rejected", resultMessage }` and return the validator error to the agent. |
| `session.status_idle`           | `done`                                                                           |

If the agent calls a write tool without prior in-chat approval we still execute it. The system prompt is the enforcement layer; the route trusts it.

## Chat tab UI

A new fourth tab `"Chat"` is added to the `<TabsList>` in `src/components/brief-view.tsx`. Its content is `<ChatTab guest brief observations signals />`, a single client component that fills the tab area.

### Layout

- **Header row** (sticky, bottom border).
  - Left: Cormorant text `"Concierge"` plus a mono `"· beta"` tag.
  - Right: "New chat" button (ghost variant, lucide `RotateCcw`). Clicking resets `messages` to `[]` and aborts any in-flight stream.
- **Conversation area** (flex-1, scrollable). Uses AI Elements `<Conversation>` + `<ConversationContent>` for auto-scroll.
  - **Empty state** (no messages yet): centered Cormorant prompt `"Ask anything about {guest.firstName}."` with four `<Suggestion>` chips below:
    - "What do they usually drink?"
    - "Any allergies I should know?"
    - "Suggest a welcome gesture under HKD 1,000"
    - "What did their advisor flag last time?"

    Clicking a chip pre-fills the input and submits.
  - **Each turn** renders as `<Message from="user|assistant">`.
  - **Assistant message in progress**: render `<ChainOfThought>` open above the message, populated live from `step_start` / `step_end` events. Each step uses a kind-specific lucide icon (`Brain` for thinking, `FileText` for read, `Globe` for web_search, `Link` for web_fetch) and label. Active step shows a shimmer; ended steps render as completed.
  - **Assistant message complete**: the moment the first `message_delta` arrives, the CoT collapses into a small pill `"Researched · {n} steps"`. Clicking the pill re-expands it. The reply renders below the pill using AI Elements `<Response>` for markdown.
  - **Write tool that fired**: a small inline card below the message — gold left border (2px), mono label like `add_highlight`, the input rendered as a quoted preview, and a tiny mono tag `Saved to brief`. (If the system prompt is working, the user already approved this in the prior turn.)
- **Input row** (sticky bottom, top border): `<PromptInput>`, submit on Enter, Shift+Enter for newline. Submit button uses lucide `ArrowUp`. Disabled while a stream is in flight.

### Component state

```ts
type Step = { id: string; kind: "thinking" | "read" | "web_search" | "web_fetch"; label: string; status: "active" | "done" };
type ToolCall = { id: string; name: string; input: unknown; resultMessage?: string };
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: Step[];
  toolCalls?: ToolCall[];
};

const [messages, setMessages] = useState<ChatMessage[]>([]);
const [streaming, setStreaming] = useState(false);
const abortRef = useRef<AbortController | null>(null);
```

### Streaming logic

- On submit: append the user message; append an empty placeholder assistant message; open a `fetch` to `/api/agent/chat` with `AbortController`; set `streaming = true`.
- Read the response body line by line. Parse each line as a `ChatEvent` and mutate the placeholder:
  - `step_start` → push to `steps`.
  - `step_end` → mark matching step `done`.
  - `message_delta` → append `text` to `content`.
  - `tool_call` → push to `toolCalls`.
  - `done` → `streaming = false`.
  - `error` → `streaming = false`, show inline error card with a Retry button that re-sends the last user message.

## Edge cases

- **No brief yet for guest.** Context block notes `(no brief generated yet)`. Agent answers from observations + signals only.
- **No observations.** Same — section is noted as empty. Agent says so honestly if asked about history.
- **Agent calls write tool without prior approval.** Mutation still runs. Tool-call card renders inline. Tightening happens in the system prompt, not in the route.
- **Stream disconnects mid-flight.** Placeholder assistant message keeps whatever content arrived; `streaming` flips to false. Error card with Retry appears.
- **Hard deadline (120s).** Route emits `error`. UI shows the error card.
- **Empty / whitespace-only input.** Submit disabled.
- **New chat mid-stream.** Abort the fetch via `AbortController`, clear messages.

## Testing approach

Manual smoke via Playwright MCP after both `pnpm dev` and `pnpm dlx convex dev` are running:

1. `pnpm setup-chat-agent` succeeds and writes `ANTHROPIC_CHAT_AGENT_ID` to `.env.local`.
2. Navigate to `/guests/anderson`. Click the Chat tab. Empty state with suggestion chips renders. Cormorant on guest first name, mono on metadata.
3. Click a suggestion. Chain-of-thought streams steps. Reply appears. CoT collapses to "Researched · N steps" pill. Clicking re-expands.
4. Ask "Add a highlight that she likes mezcal". Agent proposes in chat with the exact record. Reply "yes". Tool fires, brief updates (verify Highlights row in Brief tab), inline tool-call card appears under the message with gold left border.
5. Click "New chat" mid-reply. Stream aborts. Messages clear.
6. Screenshot each state. Verify alignment with the Black Card language (`var(--bg)`, `var(--card)`, gold `var(--accent)` on tool-call card border only).

No unit tests. Hackathon scope, demo-driven.

## Out of scope

- Persistent multi-session chat history (per-guest chat log table).
- Per-staff-member identity / attribution on chat turns.
- Voice input for chat (mic button).
- Multi-guest chat or chats not tied to a specific guest.
- Real-time multi-user collaboration on a single chat thread.
- Auto-running the chat agent on observation capture (that is the Observation Agent's job).
