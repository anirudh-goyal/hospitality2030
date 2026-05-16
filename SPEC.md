# SPEC.md — Sense: Staff Intelligence Layer for Ultra-Luxury Hospitality

## Product Summary

**Sense** is the staff brain behind ultra-luxury service at Rosewood Hotels. It captures guest observations from any staff member in five seconds via voice, structures them with AI, and routes the right knowledge to the right person at the right moment — so guests experience a property that "just knew." The guest never interacts with AI; the staff become magicians.

**Hackathon themes addressed:** Theme 1 (Hyper-Personalized Arrival Orchestration) + Theme 2 (The Invisible Concierge). Unified pitch: *"Arrival orchestration and the invisible concierge are the same intelligence problem at different timestamps. We built one brain that powers both."*

**Demo date:** May 16, 2026 — Rosewood Hotels AI Hackathon, judging today.

---

## Design Language — "The Black Card"

**Concept:** A private members' club interface. The aesthetic that a Rosewood black key card would have if it became software — restrained, warm, authoritative. Not SaaS. Not hotel-website-ornate. Editorial luxury.

**Visual references:** Wallpaper* magazine digital edition, Harrods black card portal, Aman guest services app concept.

**Tone:** Quiet authority. Warm but precise. Never friendly-AI, never ornate.

### Color tokens (CSS vars in `globals.css`)

```css
--bg:            #0a0909;
--card:          #141210;
--elevated:      #1e1c18;
--surface:       #252219;
--accent:        oklch(0.72 0.08 55);        /* champagne gold */
--accent-muted:  oklch(0.72 0.08 55 / 0.15);
--border:        rgba(255, 240, 200, 0.07);  /* warm hairline */
--text-primary:  #f5f0e8;                    /* warm white */
--text-secondary:rgba(245, 240, 232, 0.55);
--text-tertiary: rgba(245, 240, 232, 0.30);
--sensitivity:   oklch(0.65 0.12 45);        /* amber-warm alert */
```

### Typography

- **Display** (guest names, key headings): `Cormorant Garamond`, weight 500, `font-size: 2rem`, `letter-spacing: -0.02em`. Loaded from Google Fonts. This is the single most distinctive design choice — use it on guest names only.
- **Section label**: system-ui, `0.6875rem`, uppercase, `letter-spacing: 0.1em`, `var(--text-tertiary)` color
- **Body**: system-ui, `0.9375rem`, `line-height: 1.6`, `var(--text-secondary)`
- **Data/mono** (agent events, timestamps, fact sources, ETA): `Geist Mono`, `0.8125rem`

### Hard constraints

- Dark mode ONLY (never light, no `@media (prefers-color-scheme: light)` override)
- No emojis anywhere in the UI
- No rainbow gradients, no purple, no blue-teal
- `border-radius: 0.375rem` (6px) — never rounder
- Borders: `var(--border)` only — warm-tinted hairline
- Key Facts left border: `2px solid var(--accent)` — gold, not a full box border
- Framer Motion ONLY for the 3 defined animation moments (see below)

### The 3 motion moments (only these, nothing else)

1. **Role switcher:** Content sections cross-fade + 8px vertical slide when role changes
2. **Observation landing:** New observation card enters from `translateY(8px)` with a brief gold pulse on its left border (`box-shadow: -2px 0 8px var(--accent-muted)`)
3. **Agent event replay:** Lines appear one-by-one with cursor blink (monospace, no slide — just opacity 0→1 with cursor)

---

## Tech Stack (do not deviate)

- **Framework:** Next.js 15, App Router, TypeScript strict mode
- **Styling:** Tailwind v4 (CSS vars in `globals.css`, no `tailwind.config.js`)
- **Components:** shadcn/ui v4 (`pnpm dlx shadcn@latest add ...`), New York style, Neutral base
- **Animations:** Framer Motion — only the 3 defined moments above
- **Database:** Convex (cloud, zero migrations, real-time reactive queries)
- **AI streaming:** Vercel AI SDK 5 (`ai`, `@ai-sdk/anthropic`) — extraction endpoint only
- **AI agents:** `@anthropic-ai/sdk` directly — Managed Agents seed script only
- **Package manager:** pnpm
- **Deploy:** Vercel (`git push` → live)
- **Auth:** None. Single demo user. No Clerk. No sessions.
- **No testing** (except manual demo path)

---

## User Stories

| Role | Story |
|---|---|
| Housekeeping staff | I notice a guest preference during turndown. I tap the floating button, speak one sentence. The AI structures it and routes it to the right people. Done in 5 seconds. |
| Front desk | I open the arrivals dashboard the morning of check-in. I see every guest arriving today with their key facts, suite, and a prepared gesture. I'm ready. |
| Restaurant manager | I open the Guest Brief and switch to my role. I see dietary preferences, wine history, F&B notes — nothing irrelevant to my job. |
| GM | I open Anderson's brief before he arrives. There's a suggested delight gesture with rationale and cost. I tap "Approve." The concierge sees it immediately. |
| Concierge | I open the brief and see what the Managed Agent found: his TripAdvisor reviews, a local event he'd love, pre-built gesture options. I didn't research any of this. |

---

## Screens & Components

### Screen 1 — Arrivals Dashboard (`/arrivals`)

Landing screen. URL: `/arrivals`. Default redirect from `/`.

**Layout:**
- Full-width dark page (`var(--bg)`)
- Top bar: "Sense" wordmark in Cormorant Garamond (left), current date + "Rosewood Hong Kong" in Geist Mono muted (right)
- Filter bar: "Today" | "Tomorrow" | "VIP Only" tab switcher — gold underline on active
- Guest card list: vertical, max-width `720px`, centered

**Guest card anatomy:**
- Left: 40px circular photo (grayscale + 10% opacity overlay so it reads as charcoal)
- Center: `[Full Name]` in Cormorant (1.125rem, 500) · `Suite [X]` (muted) · loyalty badge (small pill: gold border, Geist Mono text)
- Right: ETA in Geist Mono + key fact in one line (muted)
- Card: `var(--card)` bg, `var(--border)` border, `hover:bg-[var(--elevated)]` transition (150ms)
- Card click → `/guests/[slug]`

**Seed guests (3 total):**
1. **James Anderson** — today, Suite Harbour Grand, Inner Circle (the demo guest)
2. **Sarah Chen** — today, Superior Suite, Rosewood Enthusiast
3. **Marcus Webb** — tomorrow, Premium Suite, new guest

### Screen 2 — Guest Brief (`/guests/[slug]`)

`/guests/anderson` is the demo route. Dynamic `[slug]` route, Anderson pre-seeded.

**Page layout:** Two-column on desktop (`flex-row gap-8`). Left: main content (`flex-1`). Right: sidebar (`w-72`).

**Left column — sections:**

1. **Header** (always visible, all roles)
   - 80px circular photo (grayscale)
   - `James Anderson` — Cormorant Garamond, 2.5rem, weight 500
   - Loyalty badge: "Inner Circle · 3rd Visit · Rosewood Hong Kong" — Geist Mono, muted
   - Metadata row (small, muted): Suite · dates · `CX 839 — On Time` · `Car ETA: 2:15 PM` (all Geist Mono)
   - Arriving-in countdown: `"Arriving in 1h 23m"` — gold color, Geist Mono, live `setInterval`
   - Role switcher dropdown: top-right of header card. Options: Front Desk / Concierge / Restaurant / Spa / Housekeeping

2. **Three Key Facts** (filtered by role)
   - 3 observation cards: left border `2px solid var(--accent)`, `var(--card)` bg
   - Fact statement in body text + source line in Geist Mono muted: `"Marie L., Rosewood London · Apr 22"`
   - No colored backgrounds — gold left border is the only accent

3. **External Signals** (Front Desk, Concierge)
   - Pull-quote: TripAdvisor excerpt in italic Cormorant (1rem) + extracted preference tags as small pills
   - Source line: `"Singita Pamushana Lodge, Zimbabwe — Oct 2024"` in Geist Mono

4. **Suggested Gesture** (Front Desk, Concierge)
   - Featured gesture card: title in Cormorant, rationale body, `Est. HKD 850`, availability badge
   - "View all options →" → opens Delight Generator modal

5. **Sensitivities** (all roles, always visible)
   - Small bordered box, `var(--sensitivity)` left border (2px), very subtle warm amber bg tint
   - Bulleted list in body text
   - Label: "STAFF NOTES — DO NOT MENTION" in section-label style

6. **Observations Feed** (all roles, filtered)
   - Timeline list: timestamp in Geist Mono + role source + raw text preview + category badge

**Right sidebar — Active Agents panel:**
- Header: `"Intelligence Pipeline"` in section-label style + pulsing dot (gold = complete, amber = running)
- Anderson's agent card: "Pre-Arrival Research Agent" · "Ran 18 hours ago · 47 events" · Complete
- Expandable event log: last 8 events in Geist Mono, `0.75rem`
- Replay button: `"▶ Replay"` — triggers cursor-animation replay of full 47-event log
- Each event row: `[timestamp] [tool] [params]` — muted by default, highlighted on type:
  - `web_search`: gold tint
  - `web_fetch`: accent-muted tint
  - `file_write`: sensitivity color (amber) tint
  - `synthesis`: white text (emphasis)

### Component A — Capture Modal

Triggered by: floating action button (bottom-right, all screens). Round, `var(--accent)` bg, mic icon.

**Modal flow:**
1. Open: pulsing ring animation (CSS, gold), "Listening..." in Cormorant italic
2. Web Speech API streams transcript in real time
3. "Extract with AI" button appears after 1+ seconds of transcript
4. Click extract → `POST /api/extract` → streams structured JSON
5. JSON fields appear with animation: `category`, `facts[]`, `applicableRoles[]`, `confidence`
6. "Save observation" → calls `mutations.captureObservation` → appears in feed instantly
7. Modal closes with gold checkmark animation

**Fallback:** Textarea pre-populated with: *"Mr. Anderson mentioned his daughter Mia just turned ten and loved the pool at Rosewood London last month."*

**Extraction API route:** `POST /api/extract`
- Input: `{ transcript: string, guestId: string }`
- Uses: `streamObject` from Vercel AI SDK, `anthropic('claude-sonnet-4-6')`
- Output schema (Zod):
```typescript
z.object({
  categories: z.array(z.string()),
  facts: z.array(z.object({ type: z.string(), value: z.string() })),
  applicableRoles: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  summary: z.string()
})
```
- System prompt: `src/lib/ai/prompts.ts` → `EXTRACTION_SYSTEM_PROMPT`
- `applicableRoles` must be a subset of: `["front_desk", "concierge", "restaurant", "spa", "housekeeping"]`
- Categories: dietary, beverage, room, family, wellness, interests, milestones, sensitivities, service

### Component B — Delight Generator Modal

Triggered from: "View all options →" on Suggested Gesture card.

**Header:** "Delight Options — James Anderson" in Cormorant

**3 gesture cards (from Convex seed):**
1. **The Ceramics Experience** — rationale mentioning Pottery Review, HKD 1,200, "Available Thursday" — PRIMARY
2. **Pool Morning Package for Mia** — daughter rationale, HKD 650, "Available Today"
3. **Mezcal Tasting Journey** — Singita bar note, HKD 980, "Check Availability"

Each card: Cormorant title, body rationale, Geist Mono cost, availability badge, "Approve & Schedule" button. Approve → `mutations.approveGesture` → brief updates in real time.

Footer: `"Generated by Sense Pre-Arrival Agent · May 15, 2026"` — Geist Mono, muted

### Component C — Active Agents Panel (sidebar, described in Screen 2)

Replay behavior:
- 47-event log in Convex `agentEvents` table
- Events rendered one-by-one at 120ms intervals
- Each line: opacity 0→1 + cursor blink (Geist Mono)
- Key events color-highlighted (see Screen 2 above)
- Auto-scrolls; "Pause" button appears during replay

---

## Data Model (Convex Schema — `convex/schema.ts`)

```typescript
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
    advisor: v.optional(v.object({
      agency: v.string(),
      name: v.string(),
      note: v.string()
    })),
    nextArrival: v.optional(v.object({
      property: v.string(),
      checkinIso: v.string(),
      checkoutIso: v.string(),
      flightCode: v.string(),
      flightStatus: v.string(),
      carEtaIso: v.string(),
      suite: v.string()
    }))
  }).index("by_slug", ["slug"]),

  observations: defineTable({
    guestId: v.id("guests"),
    rawText: v.string(),
    capturedAtIso: v.string(),
    source: v.string(),
    capturedBy: v.object({
      name: v.string(),
      role: v.string(),
      property: v.string()
    }),
    extracted: v.object({
      categories: v.array(v.string()),
      facts: v.array(v.object({ type: v.string(), value: v.string() })),
      applicableRoles: v.array(v.string()),
      confidence: v.number(),
      summary: v.string()
    })
  }).index("by_guestId", ["guestId"]),

  externalSignals: defineTable({
    guestId: v.id("guests"),
    platform: v.string(),
    venue: v.string(),
    reviewDateIso: v.string(),
    rating: v.number(),
    excerpt: v.string(),
    extractedTags: v.array(v.string())
  }).index("by_guestId", ["guestId"]),

  briefs: defineTable({
    guestId: v.id("guests"),
    generatedAtIso: v.string(),
    agentRunMinutes: v.number(),
    summary: v.string(),
    keyFacts: v.array(v.object({ fact: v.string(), source: v.string() })),
    externalSignalsSummary: v.string(),
    suggestedGestures: v.array(v.object({
      title: v.string(),
      rationale: v.string(),
      estCostHkd: v.number(),
      availability: v.string(),
      status: v.string()
    })),
    sensitivities: v.array(v.string())
  }).index("by_guestId", ["guestId"]),

  agentEvents: defineTable({
    briefId: v.id("briefs"),
    timestampIso: v.string(),
    eventType: v.string(),
    tool: v.optional(v.string()),
    params: v.optional(v.string()),
    resultPreview: v.optional(v.string())
  }).index("by_briefId", ["briefId"]),

  rolePermissions: defineTable({
    role: v.string(),
    visibleCategories: v.array(v.string())
  })
});
```

---

## Convex Functions

### Mutations

**`captureObservation(guestId, rawText, capturedBy, extracted)`**
- Inserts to `observations` with pre-extracted data
- Returns new `_id`

**`approveGesture(briefId, gestureIndex)`**
- Sets `suggestedGestures[gestureIndex].status` to `"scheduled"`
- Returns updated brief

### Queries

**`getGuestBySlug(slug)`** — returns guest record

**`getGuestBrief(guestId, viewerRole)`** — joins guest + filtered observations + externalSignals + brief

**`listArrivingGuests(filter)`** — filter: "today" | "tomorrow" | "vip", sorted by `carEtaIso`

**`getAgentEvents(briefId)`** — all events ordered by `timestampIso`, reactive

---

## AI / Agent Design

### 1. Voice Extraction (live in demo)

- Route: `POST /api/extract`
- SDK: `streamObject` from Vercel AI SDK, `anthropic('claude-sonnet-4-6')`
- Client: `experimental_useObject` hook streams fields into modal as they arrive
- Must be <3s. Use `claude-haiku-4-5` only if latency is a problem.
- Returns `result.toTextStreamResponse()` (not `toDataStreamResponse()`)

### 2. Pre-Arrival Research Agent (Managed Agents, pre-run)

- Script: `scripts/run-agent.ts` → `pnpm run seed:agent`
- SDK: `@anthropic-ai/sdk` Managed Agents API directly
- Tools: `web_search`, `web_fetch`, `write_to_context`
- On completion: formats event log into `agentEvents` shape, writes to Convex via `mutations.seedAgentData`
- Run ONCE before demo. Never triggered from the UI.

### 3. Role-Aware Routing

- `applicableRoles` on each observation → Convex query filters by role
- `rolePermissions` table maps:
  - `front_desk`: all categories
  - `concierge`: interests, experiences, milestones, family, sensitivities
  - `restaurant`: dietary, beverage, family, service
  - `spa`: wellness, physical, sensitivities
  - `housekeeping`: room, climate, amenity, scent

### 4. Delight Discovery (seed data, pre-computed)

- Three gestures in `briefs.suggestedGestures` — NOT a live call during demo
- "Approve" → `mutations.approveGesture` → live Convex update

---

## File & Folder Structure

```
src/
  app/
    page.tsx                    # redirect to /arrivals
    arrivals/
      page.tsx
    guests/
      [slug]/
        page.tsx
    api/
      extract/
        route.ts                # POST — streamObject via AI SDK
  components/
    ui/                         # shadcn primitives
    capture-modal.tsx
    delight-modal.tsx
    agent-panel.tsx
    guest-card.tsx
    guest-brief.tsx
    role-switcher.tsx
    countdown-timer.tsx
  lib/
    ai/
      prompts.ts
      extract-schema.ts
    convex.ts
  convex/
    schema.ts
    guests.ts
    observations.ts
    briefs.ts
    agentEvents.ts
    rolePermissions.ts
  scripts/
    seed.ts
    run-agent.ts
```

---

## Parallel Session Breakdown

**Session 1 (main):** Scaffold → Convex schema → seed data → Arrivals → Guest Brief (all sections, role switcher) → Countdown

**Session 2 (features worktree):** Capture Modal + Web Speech API → `/api/extract` → `captureObservation` mutation → Agent panel with replay → Delight modal → `approveGesture`

**Session 3 (design worktree):** Playwright screenshots → Cormorant Garamond loaded + applied → color token audit → Framer Motion: role switcher + observation landing + event replay → accessibility pass

---

## Prioritized Task List

### Must-ship (core demo path)

- `[ ]` Scaffold: `create-next-app`, `shadcn init`, `pnpm add convex ai @ai-sdk/anthropic @anthropic-ai/sdk framer-motion zod`
- `[ ]` Add Cormorant Garamond to `layout.tsx` via Google Fonts (`next/font/google`)
- `[ ]` Set all CSS tokens in `globals.css` (color vars + font vars)
- `[ ]` Convex schema deployed (`npx convex dev`)
- `[ ]` Seed script: Anderson profile + 3 observations + 1 brief + 3 gestures + external signals + 47 agent events
- `[ ]` Arrivals Dashboard — 3 cards, filter tabs, click → guest brief
- `[ ]` Guest Brief — all sections render from Convex seed
- `[ ]` Role switcher — dropdown changes visible sections + Framer Motion cross-fade
- `[ ]` Capture Modal — mic → transcript → extract button
- `[ ]` `POST /api/extract` — `streamObject`, Zod schema, `claude-sonnet-4-6`
- `[ ]` Capture saves to Convex, Observations feed updates in real time
- `[ ]` Agent replay — 47-event log, 120ms interval, cursor animation

### Should-ship (wow moments)

- `[ ]` Delight Generator modal — 3 gestures, Approve → brief updates
- `[ ]` Arriving-in countdown (live `setInterval`)
- `[ ]` Sensitivities box (amber left border, always visible)
- `[ ]` Run Managed Agent, write real event log to Convex

### Nice-to-have

- `[ ]` Flight status display
- `[ ]` Observation confidence visualization
- `[ ]` "Draft GM welcome note" button

---

## Demo Script (3 minutes)

**0:00–0:25:** Open `/arrivals`. *"Luxury hospitality runs on institutional memory. That memory walks out the door. Every brand has a CRM. None of them fix the input problem."*

**0:25–1:05:** Click Anderson → Brief loads. Tap capture. Speak: *"Mr. Anderson mentioned his daughter Mia just turned ten and loved the pool at Rosewood London last month."* Hit Extract. JSON structures live. Save. Observation lands. *"Five seconds. Any staff member. Input problem fixed."*

**1:05–1:50:** Show Key Facts. Role dropdown → Restaurant Manager. Sections reorganize. *"Same brain. Different lens. The right knowledge to the right person."*

**1:50–2:30:** Click Active Agents → Replay. `web_search("James Anderson TripAdvisor")` ... `web_fetch(...)` ... `synthesis`. *"This brief was built by a Claude Managed Agent 18 hours ago."* Open Delight modal. Approve ceramics gesture.

**2:30–3:00:** *"He arrives in 90 minutes. The gesture is scheduled. His daughter's name is known. He will encounter zero AI. The staff look like magicians. One brain. Two themes. The same problem at different timestamps."*

---

## Out of Scope

Authentication, post-stay engine, native mobile, real flight API, analytics, settings, real face recognition, multi-property selection.
