# Execution Sequence Design - Sense Hackathon Build

**Date:** 2026-05-16 (demo day)
**Scope:** End-to-end build sequence for the Sense staff intelligence layer, optimized for a sequential single-Claude-session execution model and the 3-minute live demo defined in SPEC.md.
**Related documents:** SPEC.md (product spec), CLAUDE.md (project rules), ai_hackathon_playbook.md (high-leverage tooling reference), DECISIONS.md (architectural decisions).

---

## Context and constraints

- **Execution model:** sequential, single Claude session at a time. No parallel worktrees, no Conductor.
- **Demo target:** 3-minute live demo today on localhost in Chrome.
- **Judging weight:** Live Demo 45 percent, Creativity 35 percent, Impact 20 percent. Implication: demo reliability beats feature completeness.
- **Design language:** "The Black Card" (warm-black background, champagne gold accent, Cormorant Garamond on guest names, Geist Mono on data). Defined in SPEC.md and CLAUDE.md, enforced through this build.
- **Hard CLAUDE.md rules:** pnpm only, no auth, server components by default, `streamObject` routes return `toTextStreamResponse`, no commits of `.env*`, no spinners (use `<Skeleton>`), Framer Motion only for the 3 defined moments.

## Sequencing approach

Three approaches were considered:

1. **Outside-in (demo-path-first):** scaffold then schema then visible screens then capture flow then agent replay then polish. Always have a runnable, screenshot-able demo. Cuts the last phase first under time pressure, never the visible phase.
2. **Inside-out (data-first):** schema then queries then mutations then routes then components then screens last. Clean separation, but hours pass with nothing visible. Bad for hackathon course-correction.
3. **Spike-then-fill:** dumbest possible end-to-end in 20 minutes, then replace each layer. Fastest path to runnable, but rewrite phase is brittle and the Black Card design language gets shortchanged.

**Selected: Approach 1 (outside-in).** The SPEC's pre-seeded data model (Anderson's brief and 47 agent events computed offline) is literally optimized for this approach. The Playwright-MCP screenshot loop from the hackathon playbook only pays off when visible screens exist early.

---

## Phase 0 - Front-loaded high-leverage setup

Irreversible one-time investments. Each unlocks compounding speed across every later phase.

### 0.1 MCP servers

- **Playwright MCP** (`claude mcp add playwright npx @playwright/mcp`) - closes the visual feedback loop. Non-negotiable.
- **shadcn MCP** - install shadcn components directly via tool calls.
- **Convex MCP** - Claude introspects deployed schema directly. Saves repeated paste of schema.ts into prompts.

### 0.2 Secrets and accounts (human-only gates)

- `ANTHROPIC_API_KEY` in `.env.local`
- `pnpm dlx convex dev` once to log in and provision a deployment (writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`)
- Optional: Vercel login for the safety-net deploy

### 0.3 Claude Code config

- `frontend-design` plugin loaded (already in this session)
- `superpowers` plugin loaded (already in this session)
- CLAUDE.md tight (already in place)

### 0.4 Skip list

- Magic UI, Aceternity - clash with the monochrome Black Card design language

### 0.5 Vercel AI Elements

- Install selective primitives only: `pnpm dlx ai-elements@latest add tool reasoning response source`
- Used in Phase 4 (`<Response>` for streaming extraction summary) and Phase 5 (`<Tool>` for agent event rows)
- Audit default styling after install; override to match Black Card tokens

---

## Phase 1 - Scaffold and foundation

### 1.1 Scaffold

- `pnpm create next-app@latest sense --typescript --tailwind --app --src-dir --import-alias "@/*"`
- pnpm only (CLAUDE.md rule)
- Verify TypeScript strict, App Router

### 1.2 Dependencies

```
pnpm add convex ai @ai-sdk/anthropic @anthropic-ai/sdk framer-motion zod
pnpm add -D @types/web-speech-api
```

### 1.3 shadcn and AI Elements

- `pnpm dlx shadcn@latest init` - New York style, Neutral base, CSS variables yes
- Bulk add primitives to avoid drift later:
  ```
  pnpm dlx shadcn@latest add button card dialog dropdown-menu tabs badge skeleton scroll-area sonner avatar input command
  ```
- AI Elements: `pnpm dlx ai-elements@latest add tool reasoning response source`
- After init, replace shadcn default tokens in `globals.css` with the Black Card palette

### 1.4 Fonts

```ts
// src/app/layout.tsx
import { Cormorant_Garamond, Geist_Mono } from 'next/font/google'
const cormorant = Cormorant_Garamond({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-cormorant' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
```

Apply both `variable` classes to `<html>`. Tokens reference `var(--font-cormorant)` and `var(--font-geist-mono)`.

### 1.5 Tokens in globals.css

- All Black Card tokens per SPEC (warm-black bg, champagne accent, hairline border)
- Tailwind v4 `@theme` block exposes tokens to utility classes
- No `tailwind.config.js`

### 1.6 Convex bootstrap

- `pnpm dlx convex dev` runs interactively (human gate at 0.2)
- Leave process running for the rest of the session

### 1.7 Verification gate (Playwright MCP)

- `pnpm dev`, navigate to `localhost:3000`
- Screenshot: warm-black background renders, Cormorant Garamond loads, no console errors

### Risks

- Tailwind v4 plus shadcn New York base may emit conflicting CSS variables. Override shadcn defaults explicitly in `globals.css`.
- AI Elements may pull additional shadcn primitives unannounced. Watch the install log.

---

## Phase 2 - Convex schema, functions, seed

### 2.1 Schema

Copy `convex/schema.ts` from SPEC as-is. Tables: `guests`, `observations`, `externalSignals`, `briefs`, `agentEvents`, `rolePermissions`.

### 2.2 Queries

- `getGuestBySlug(slug)`
- `getGuestBrief(guestId, viewerRole)`
- `listArrivingGuests(filter)` - filter in `"today" | "tomorrow" | "vip"`
- `listGuests()` - returns all guests, used by the capture page picker (small addition to SPEC)
- `getAgentEvents(briefId)`

### 2.3 Mutations

- `captureObservation(guestId, rawText, capturedBy, extracted)`
- `approveGesture(briefId, gestureIndex)`
- `seedAgentData(briefId, events)` - wipe-and-replace pattern, used both by Phase 2 seed and Phase 5.5 real agent run

### 2.4 Role-filter contract

- Filter rule: an observation is visible to a role iff `observation.extracted.applicableRoles.includes(viewerRole)`
- `front_desk` is a special case: sees everything regardless
- `rolePermissions` table is informational only, not the runtime filter
- Every seeded observation has an explicit `applicableRoles` array

### 2.5 Seed script (`scripts/seed.ts`)

| Entity | Count | Notes |
|---|---|---|
| guests | 3 | Anderson (Inner Circle, today), Chen (Enthusiast, today), Webb (new, tomorrow) |
| observations | 4 to 6 | Anderson-heavy: ceramics interest, daughter Mia, mezcal pref, dietary sensitivity |
| externalSignals | 2 | Singita Pamushana TripAdvisor + Pottery Review pull-quote |
| briefs | 1 | Anderson with 3 gestures (ceramics PRIMARY, pool morning, mezcal tasting) |
| agentEvents | 47 | Anderson's brief, see 2.6 |
| rolePermissions | 5 | One row per role |

Seed runs idempotently (wipe-and-reseed).

### 2.6 The 47 fake agent events

Distribution:
- About 15 `web_search` events (TripAdvisor, Singita, Pottery Review, Mia's age, Hong Kong ceramics shops)
- About 18 `web_fetch` events
- About 10 `synthesis` events (intermediate reasoning in the agent's voice)
- About 3 `file_write` events (agent took its own notes)
- 1 final synthesis: "Brief assembled. Three candidate gestures identified."

Timestamps span 18 hours ago, clustered with realistic gaps.

### 2.7 Verification gate

- `pnpm dlx convex run guests:listArrivingGuests '{"filter":"today"}'` returns Anderson + Chen
- `pnpm dlx convex run agentEvents:getAgentEvents '{"briefId":"..."}'` returns 47 events in order
- Convex dashboard shows expected row counts

### Risks

- Synthetic-feeling events undermine the demo's most cinematic moment. Invest in event copy.
- `seedAgentData` must wipe-and-replace cleanly so the Phase 5.5 real run can overwrite without orphans.

---

## Phase 3 - Arrivals and Guest Brief screens

### 3.1 Layout shell (`src/app/layout.tsx`)

- Loads Cormorant Garamond and Geist Mono via `next/font/google` (Phase 1)
- ConvexProvider wraps children (set up `src/lib/convex.ts` with `ConvexReactClient`)
- Renders a single global `CaptureFAB` bottom-right that links to `/capture` (no modal logic - just navigation)
- Top bar: "Sense" wordmark in Cormorant (left), date plus "Rosewood Hong Kong" in Geist Mono muted (right). Plus a small "Capture" link.

### 3.2 Arrivals dashboard (`/arrivals`, `/` redirects to it)

- Server component fetches `listArrivingGuests("today")`
- Filter tabs (shadcn Tabs) - gold underline on active. URL search param `?filter=today` drives state.
- Guest card list, max-width 720px, centered
- Card anatomy per SPEC: 40px circular grayscale photo, name in Cormorant 1.125rem, suite in muted body, loyalty pill (gold border, Geist Mono), ETA plus key fact on the right
- Click navigates to `/guests/[slug]`

### 3.3 Guest brief (`/guests/[slug]`)

- Server component fetches `getGuestBrief(guestId, viewerRole)` with `viewerRole` defaulting to `front_desk`
- The full brief (all observations) is fetched once. A client subview filters by role in memory, keeping the role switcher animation smooth.
- Two-column desktop layout (`flex-row gap-8`). Left column: 6 sections. Right column: agent panel (stub in Phase 3, filled in Phase 5).
- Sections:
  1. Header (photo, name in Cormorant 2.5rem, loyalty badge, metadata row, countdown, role switcher dropdown)
  2. Three Key Facts (2px gold left border on each, source line in Geist Mono)
  3. External Signals (TripAdvisor pull-quote in italic Cormorant, tag pills)
  4. Suggested Gesture (featured card from `brief.suggestedGestures[0]`, "View all options" link triggers Phase 6 modal). Client component for reactivity.
  5. Sensitivities (amber left border, subtle amber tint, "STAFF NOTES - DO NOT MENTION" label)
  6. Observations Feed (timeline of role-filtered observations). Client component using `useQuery` for reactive updates from Phase 4 captures.

### 3.4 Role switcher (`src/components/role-switcher.tsx`, client)

- shadcn DropdownMenu with the 5 roles
- Owns the visible role state for the brief
- On change: client-side re-filter, triggers Phase 7 cross-fade animation
- Default: `front_desk`

### 3.5 Countdown timer (`src/components/countdown-timer.tsx`, client)

- Reads `guest.nextArrival.carEtaIso`
- `setInterval(1000)` recomputes "Arriving in Xh Ym"
- Geist Mono, gold, useEffect cleanup

### 3.6 Photos

- Stable Unsplash IDs in seed
- `filter: grayscale(100%)` plus 10 percent opacity overlay

### 3.7 Verification gate (Playwright MCP)

- Screenshot `/arrivals` - 3 cards, hairline borders, Cormorant on names, gold pill borders, grayscale photos
- Screenshot `/guests/anderson` - all 6 sections render, gold left borders on key facts, amber sensitivities box, countdown live

### Risks

- Tailwind v4 token plumbing for gold left border may need inline `style={{borderLeft: '2px solid var(--accent)'}}` rather than fighting utility generation.
- Server-vs-client boundary on the brief page: the page is a Server Component fetching data; subviews that need reactivity or state are client components. Mis-drawing this causes hydration errors.

---

## Phase 4 - Capture page and extract API

### 4.1 Entry point

- Global FAB in the layout shell links to `/capture` (no modal)
- Top bar also has a "Capture" link

### 4.2 Capture page (`src/app/capture/page.tsx`)

One screen, vertically centered, max-width 560px. Layout top to bottom:

1. Section label "NEW OBSERVATION" in muted small caps
2. Guest picker (shadcn Combobox or Command): searchable, each row shows name in Cormorant plus room number in Geist Mono muted plus loyalty tier pill. Defaults to URL search param `?guest=anderson` if present.
3. Capturing-by line: muted Geist Mono with hardcoded staff persona `Sofia Reyes - Housekeeping - Rosewood Hong Kong`
4. Input area: large textarea (4 to 6 rows), warm-black bg, hairline border, mic button inset top-right
5. Submit button: full-width, gold, "Capture observation"

### 4.3 Voice and text input

- Click mic: Web Speech API streams transcription into the textarea live
- Click again to stop, or auto-stop on 2 seconds of silence
- Mic visual states: idle, recording (pulsing gold ring), unsupported (hidden, textarea only fallback)
- Fallback sentence pre-populates textarea on `?prefill=demo` URL param: "Mr. Anderson mentioned his daughter Mia just turned ten and loved the pool at Rosewood London last month."

### 4.4 Submit flow

- Click "Capture observation"
- Button changes to "Capturing..." with muted pulsing dot
- POST to `/api/extract` with `{ transcript, guestId }`
- Structured preview card fades in below input section by section as the stream arrives (categories, facts, applicable roles, confidence, summary streamed via AI Elements `<Response>`)
- On stream complete: auto-save via `captureObservation`, gold check pulses
- 1 second pause, then auto-redirect to `/guests/[slug]`
- New observation lands in the feed with Phase 7 motion

### 4.5 Extract API (`src/app/api/extract/route.ts`)

- `streamObject` from `ai`, model `anthropic('claude-sonnet-4-6')`
- Returns `result.toTextStreamResponse()` (CLAUDE.md rule)
- Zod schema in `src/lib/ai/extract-schema.ts`:
  ```ts
  z.object({
    categories: z.array(z.enum([
      'dietary','beverage','room','family','wellness',
      'interests','milestones','sensitivities','service'
    ])),
    facts: z.array(z.object({ type: z.string(), value: z.string() })),
    applicableRoles: z.array(z.enum([
      'front_desk','concierge','restaurant','spa','housekeeping'
    ])),
    confidence: z.number().min(0).max(1),
    summary: z.string()
  })
  ```
- System prompt in `src/lib/ai/prompts.ts` as `EXTRACTION_SYSTEM_PROMPT`. Frames Claude as Rosewood staff intelligence layer with explicit role-routing logic and a worked example.

### 4.6 Verification gate (Playwright MCP)

- Navigate to `/capture?guest=anderson&prefill=demo`
- Screenshot picker, textarea
- Click Capture, screenshot streaming extraction preview
- Confirm auto-save and redirect to `/guests/anderson` with new observation at top of feed
- End-to-end under 3 seconds

### Risks

- Web Speech API requires Chrome plus localhost or HTTPS and pre-granted mic permission
- Anthropic rate limits during demo - pre-warm with a dummy call 30 seconds before going on stage
- `experimental_useObject` API may shift between AI SDK minor versions - pin exactly
- Zod strict enums fail mid-stream if model invents a category - system prompt enumerates allowed values

---

## Phase 5 - Agent panel and 47-event replay

### 5.1 Panel layout (`src/components/agent-panel.tsx`, client)

Right sidebar on `/guests/[slug]`, width 288px.

Top section:
- Section label "INTELLIGENCE PIPELINE"
- Pulsing dot (CSS, gold when complete, amber when running)
- Agent card: "Pre-Arrival Research Agent" in Cormorant 1rem, metadata in Geist Mono muted ("Ran 18 hours ago - 47 events"), "Complete" status pill

Middle:
- Event log preview: last 8 events. AI Elements `<Tool>` primitive (wrapped in `AgentToolRow` for Black Card overrides) for `web_search`, `web_fetch`, `file_write`. Plain text row for `synthesis`.
- shadcn `<ScrollArea>` wraps the list
- Color coding: web_search muted gold, web_fetch accent-muted, file_write amber, synthesis warm white emphasis

Bottom:
- Replay button: hairline border, gold text

### 5.2 Data source

- `useQuery(api.agentEvents.getAgentEvents, { briefId })` reactive
- 47 events pre-seeded from Phase 2 with timestamps spanning 18 hours
- Real agent run (5.5) writes to the same table; panel updates without code changes

### 5.3 Replay animation

- 47 events render sequentially at 120ms intervals
- Each row: opacity 0 to 1, no slide (per SPEC)
- Most recent row gets blinking cursor (CSS keyframes)
- Auto-scroll keeps latest in view
- Pause replaces Replay button during the animation
- Final synthesis row stays highlighted after replay ends

### 5.4 AI Elements `<Tool>` audit

- Wrap in `AgentToolRow` to override:
  - Background `var(--card)`
  - Border `var(--border)` hairline
  - Mono font `var(--font-geist-mono)`
  - Remove any default emoji icons

### 5.5 Optional: Managed Agent script (`scripts/run-agent.ts`)

"Should-ship" not "must-ship". Worth one attempt before demo.

- Uses `@anthropic-ai/sdk` Managed Agents API directly (never mix with `ai` package)
- Tools: `web_search`, `web_fetch`, `write_to_context`
- Prompt frames Claude as luxury hospitality pre-arrival research agent for Anderson
- On completion: format trace into `agentEvents` shape, call `seedAgentData(briefId, events)`
- Run via `pnpm run seed:agent` once before demo, never from UI (CLAUDE.md rule)
- If fewer than 30 events or partial failure, do not commit; keep the seeded 47

### 5.6 Verification gate (Playwright MCP)

- Navigate to `/guests/anderson`
- Screenshot panel with 8 visible events, color-coded, hairline borders
- Click Replay, capture screenshots at 5s and 10s intervals
- Confirm cursor blink, auto-scroll, Pause works mid-replay
- If 5.5 ran, screenshot real events

### Risks

- Replay length: 47 times 120ms equals 5.6 seconds. Cap seed at 50, or speed to 100ms if it grows.
- AI Elements `<Tool>` may not expose enough style hooks. Fallback: plain `<div>` row (~30 lines), drop the primitive.
- Managed Agents rate limits - schedule with 60+ minutes of slack
- `seedAgentData` must `deleteMany then insertMany` atomically

---

## Phase 6 - Delight modal

### 6.1 Trigger

- "View all options" link on the brief's Suggested Gesture card
- Opens via shadcn `<Dialog>` controlled by client state in `<GestureSection>`

### 6.2 Modal layout (`src/components/delight-modal.tsx`, client)

Header:
- Title "Delight Options" in section label small caps
- Guest name in Cormorant 1.5rem
- Hairline border below

Body: 3 gesture cards from `brief.suggestedGestures`:
- Title in Cormorant 1.25rem
- Rationale body in muted, 2 to 3 lines
- Cost in Geist Mono ("Est. HKD 1,200")
- Availability badge (hairline pill)
- PRIMARY indicator on first gesture: small gold dot before title, 2px gold left border on card
- "Approve and Schedule" button (gold, Geist Mono). Disabled when scheduled, replaced with muted "Scheduled" pill.

Footer:
- "Generated by Sense Pre-Arrival Agent" muted Geist Mono
- Date from `brief.generatedAtIso`, formatted via `Intl.DateTimeFormat`

### 6.3 Approve flow

- Click "Approve and Schedule"
- Optimistic: button locks immediately, "Scheduling..." text
- Mutation `approveGesture(briefId, gestureIndex)` flips status to `"scheduled"`
- Button replaced with "Scheduled" pill, brief gold pulse around card (CSS, not Framer Motion)
- Convex reactivity updates featured gesture on the brief page underneath

### 6.4 Brief gesture section needs reactivity

- The featured Suggested Gesture card on `/guests/[slug]` must be a client component reading via `useQuery`, not server-fetched
- After approve, featured card swaps to scheduled state - this is what the judges see in the demo

### 6.5 Verification gate (Playwright MCP)

- Screenshot featured card before approve
- Open modal, screenshot all 3 gestures
- Approve ceramics, screenshot scheduled state in modal
- Close modal, screenshot brief - featured card shows scheduled

### Risks

- Modal animation jitter on low-spec hardware - shadcn Dialog uses Radix (no Framer Motion on the modal itself), low risk
- Date hardcoding - read from `brief.generatedAtIso` and format with `Intl.DateTimeFormat`

---

## Phase 7 - Motion polish and design audit

Framer Motion only for the 3 defined moments. All other animations are CSS-only.

### 7.1 Role switcher cross-fade plus 8px slide

- `<AnimatePresence mode="wait">` on filtered sections
- Exit: opacity 1 to 0, translateY 0 to -8px, 180ms ease-out
- Enter: opacity 0 to 1, translateY 8px to 0, 220ms ease-out
- Stagger child cards by 30ms
- Variants in `src/lib/motion.ts`

### 7.2 Observation landing

- New observation enters translateY(8px), opacity 0 to 1, 280ms ease-out
- Gold pulse on left border via box-shadow `-2px 0 8px var(--accent-muted)`, fades in 0ms then out 600ms
- Triggered by `<AnimatePresence>` plus `key={observation._id}`

### 7.3 Agent event replay cursor

- Cursor blink: CSS keyframes (ambient, not one-shot)
- Per-event fade-in: Framer Motion, 80ms per row, no slide

### 7.4 Design language audit

Playwright MCP screenshots all screens at 1440x900 and 375x667. Verify against Black Card rules:
- Backgrounds: `var(--bg)`, `var(--card)`, `var(--elevated)`
- Borders only `var(--border)` hairline
- No rounded-full on non-avatars
- No emoji
- Gold accent only on prescribed elements
- All guest photos grayscale

### 7.5 Accessibility pass

- Tab order: capture link, picker, textarea, mic, submit
- Focus rings visible against warm-black (`outline: 2px solid var(--accent)`)
- ARIA from shadcn primitives; audit custom components
- Aim: "demo does not visibly break for a keyboard user"

### Risks

- Framer Motion bundle plus stutter on low-spec hardware - fallback to pure CSS transitions if needed

---

## Phase 8 - Rehearsal

### 8.1 Full demo path in Chrome

1. Load `/arrivals`, screenshot
2. Click Anderson card, brief loads, screenshot all sections
3. Click capture FAB, navigate to `/capture?guest=anderson`
4. Type or speak the demo sentence
5. Submit, observe extraction streaming, auto-save, auto-redirect
6. Observation lands in feed with Phase 7 motion
7. Switch role to Restaurant, confirm sections re-filter with cross-fade
8. Click Replay on agent panel
9. Click "View all options" on suggested gesture, modal opens
10. Approve ceramics, modal updates, brief featured card updates
11. End-to-end under 3 minutes

### 8.2 Optional Vercel deploy as safety net

- `git push` to a Vercel-connected repo
- Set ANTHROPIC_API_KEY, CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL in Vercel env
- Primary demo on localhost; fall back to Vercel only if localhost breaks

### 8.3 Pre-flight checklist

- Chrome default, mic permission pre-granted for localhost
- `ANTHROPIC_API_KEY` live in `.env.local`, verified with a dry call 30 minutes before demo
- `pnpm dlx convex dev` running
- `pnpm dev` running on port 3000
- `/arrivals` open in one tab, `/guests/anderson` in another, `/capture?guest=anderson&prefill=demo` in a third as backup
- Browser zoom at 100 percent, dev tools closed, notifications off
- Screen recording running as last-resort fallback

### Risks

- Pre-flight is the single highest-leverage 10 minutes of the day. Run it twice.

---

## File ownership and seams

| File or directory | Phase that creates it |
|---|---|
| `src/app/layout.tsx` | Phase 1 (initial), Phase 3 (top bar + FAB), Phase 7 (motion variants imported) |
| `src/app/globals.css` | Phase 1 (tokens + fonts) |
| `convex/schema.ts` and `convex/*.ts` | Phase 2 |
| `scripts/seed.ts` | Phase 2 |
| `scripts/run-agent.ts` | Phase 5.5 |
| `src/app/arrivals/page.tsx` | Phase 3 |
| `src/app/guests/[slug]/page.tsx` | Phase 3 |
| `src/app/capture/page.tsx` | Phase 4 |
| `src/app/api/extract/route.ts` | Phase 4 |
| `src/components/guest-card.tsx` | Phase 3 |
| `src/components/guest-brief.tsx` | Phase 3 |
| `src/components/role-switcher.tsx` | Phase 3 (structure), Phase 7 (motion) |
| `src/components/countdown-timer.tsx` | Phase 3 |
| `src/components/capture-fab.tsx` | Phase 3 (placeholder) Phase 4 (linkified) |
| `src/components/agent-panel.tsx` | Phase 5 |
| `src/components/delight-modal.tsx` | Phase 6 |
| `src/lib/convex.ts` | Phase 3 |
| `src/lib/ai/prompts.ts` | Phase 4 |
| `src/lib/ai/extract-schema.ts` | Phase 4 |
| `src/lib/motion.ts` | Phase 7 |

## Deviations from SPEC

1. **Capture is a dedicated page (`/capture`), not a modal.** SPEC describes a modal triggered by a FAB on all screens. Replaced with a single global FAB that navigates to `/capture`. Cleaner staff workflow framing, no per-page guest-context wiring. Documented in DECISIONS.md.
2. **`listGuests()` query added to Convex** to power the capture page picker. Small addition, not in SPEC.

## Out of scope

Per SPEC: authentication, post-stay engine, native mobile, real flight API, analytics, settings, real face recognition, multi-property selection.

## Demo script alignment

The phase sequence supports the SPEC's 3-minute demo script verbatim:
- 0:00 to 0:25 - `/arrivals` exists by end of Phase 3
- 0:25 to 1:05 - capture flow exists by end of Phase 4
- 1:05 to 1:50 - role switcher exists by end of Phase 3 (animation in Phase 7)
- 1:50 to 2:30 - agent panel and replay exist by end of Phase 5; delight modal by end of Phase 6
- 2:30 to 3:00 - countdown and approve state exist by end of Phase 6

## Approval

- Design approved by user 2026-05-16
- Spec self-review completed 2026-05-16
- Next step: invoke `superpowers:writing-plans` to produce the implementation plan
