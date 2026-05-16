# PRD: Sense — Staff Intelligence Layer for Ultra-Luxury Hospitality

## TL;DR

**Sense** is the staff brain behind ultra-luxury service. It captures observations from any staff member in five seconds via voice, structures them with AI, and routes the right knowledge to the right person at the right moment — so guests experience a property that "just knew." The guest never interacts with AI; the staff become magicians. Built for the Rosewood Hotels hackathon, May 2026.

**Stack.** Next.js 14 (App Router), Tailwind + shadcn/ui, **Convex** (real-time database + serverless functions), Anthropic Messages API (Sonnet 4.6), Claude Managed Agents (beta, async research), Web Speech API (browser-native voice).

**Why Convex over Supabase for this build.** Three of our killer demo moments depend on real-time reactivity: a voice capture in Modal A must instantly appear in the profile view, the role switcher must reflect new observations without a refresh, and the Active Agents panel must stream events live. Convex makes this free; Supabase makes you write subscription handlers. The 30 minutes saved compounds.

---

## Themes Addressed

Sense intentionally builds against **both** Theme 1 and Theme 2, because they are the same problem at two timestamps.

**Theme 1 — Hyper-Personalized Arrival Orchestration.** The pre-arrival brief, generated asynchronously by a Claude Managed Agent that researches the guest's public reviews, identifies time-sensitive local events matching their interests, and drafts ranked gesture suggestions. The brief lands in the front-desk view 24 hours before arrival.

**Theme 2 — The Invisible Concierge.** The voice-capture loop. Any staff member observing a guest preference speaks it into the app; AI structures it, routes it to the right roles, and surfaces it the next time that role interacts with the guest. The guest never asks twice. The intelligence is ambient, the surfacing is silent.

**We are not addressing Theme 3** (post-stay continuity), and we say so on stage — it lets us go deeper on the two we picked.

The pitch beat that unifies them: *"Arrival orchestration and the invisible concierge are the same intelligence problem at different timestamps. We built one brain that powers both."*

---

## Problem

Three operational facts, all sourced in the brief I prepared earlier:

1. Ultra-luxury hospitality runs on institutional memory. That memory lives in human heads. With 30% annual staff turnover, **60 person-years of guest knowledge walk out the door every three years** at a typical 200-staff property.
2. The "trace file" — the free-text preference note inside the PMS — is the industry's standard solution and is widely acknowledged as broken. Data captured by housekeeping rarely reaches F&B; data captured at Rosewood London does not propagate to Rosewood Hong Kong. Per Hospitality Net analysis (Tina Markowitz, 2025), a 300-room hotel wastes ~180 staff hours/month on manual handoffs.
3. Every existing solution targets the *output* layer (chatbots, AI concierges). Nobody fixes the *input* layer. If the data isn't captured, no downstream AI matters.

Mandarin Oriental's April 2025 platform launch is the only ultra-luxury group that has even attempted this internally. We are building it as a category platform.

---

## Users (Staff Personas)

Five staff roles, each with a tailored view of the same data:

| Role | Sees | Capture frequency |
|---|---|---|
| **Front desk / Guest relations** | Full brief on arriving guests; all categories | Low (formal updates) |
| **Concierge** | Interests, experiences, milestones, family, sensitivities | Medium (request logs) |
| **Restaurant manager / Sommelier** | Dietary, wine, beverage, table preferences, F&B history | Medium (post-meal) |
| **Spa director / Therapist** | Wellness, physical preferences, spa history | Low (post-treatment) |
| **Housekeeping** | Room, climate, scent, amenity, linen preferences | **High** (every turn-down) |

Housekeeping is the highest-volume capture source and the most underused observer in the industry. The mobile-first voice capture is built for them first.

---

## Solution: Three Features, One Loop

**Capture → Surface → Delight.** Each feature is the input to the next.

### Feature 1 — Capture (the input layer)
A floating "Capture observation" button on every screen. Tap → Web Speech API records → AI extracts structured fields (category, facts, applicable roles, confidence) → writes to Convex `observations` table. Real-time. Available to every staff member. **This is the single most original thing we are building, and it is the live wow moment in the demo.**

### Feature 2 — Surface (the brief, role-aware)
The Guest Brief page reads from Convex and renders the unified profile. A role dropdown filters which categories are visible — same brain, five lenses. The "Active Agents" sidebar shows the Managed Agent that built the brief, with its event stream visible if anyone wants to inspect it. **The role switcher is the visual unlock that separates us from a CRM.**

### Feature 3 — Delight (the proactive layer)
A "Generate delight options" button surfaces three specific, ranked gestures matched to the guest's profile and the destination's calendar, each with rationale and cost. The GM picks one. This directly answers the GM's morning speech.

---

## Screens & Components

Two screens, three modal/panel components. Everything else is scope creep.

### Screen 1 — Arrivals Dashboard (`/arrivals`)
The landing screen. A vertical list of today's and tomorrow's incoming guests as cards. Each card: photo, name, suite, ETA, loyalty badge, single-line "key fact" pulled from the brief. Top-of-page filter: today / tomorrow / VIP only. The whole point of this screen is to land judges into the product fast — they should be able to read the entire screen in 15 seconds.

### Screen 2 — Guest Brief (`/guests/[id]`)
The masterpiece. Editorial layout. Sections:
- **Header**: photo, name, loyalty status badge, stay metadata (property, dates, suite, flight status, car ETA), arriving-in countdown
- **Three Key Facts**: surfaced from observations, each with a source pointer ("Marie L., Rosewood London housekeeper, April 22")
- **External Signals**: TripAdvisor / Google review pulls with extracted preference tags
- **Suggested Gesture**: the highest-ranked delight option with rationale
- **Sensitivities**: things staff should not mention or do (allergies, divorce, deceased relatives, prior complaints)
- **Sidebar — Active Agents**: live event stream from the Managed Agent that built this brief

Role switcher in the page header. Switching roles reorganizes the visible sections instantly via Convex reactive queries.

### Component A — Capture Modal (floating, available everywhere)
Triggered by a floating action button. Modal opens, mic activates, transcript appears live, "Extract" button → AI extraction → JSON appears → animation lands the new observation into the active guest's profile. ~5 seconds end-to-end on a good API call.

### Component B — Delight Generator Modal (from Guest Brief)
Three pre-computed gesture cards (in seed data, presented as agent-generated). Each: title, rationale, est. cost, availability badge, "Approve & schedule" button. Approving moves the gesture to the guest's profile as "scheduled."

### Component C — Active Agents Panel (Guest Brief sidebar)
Lists the Managed Agents that ran for this guest, with the latest run's event log replayable. Each event row: timestamp, tool used (web_search, web_fetch, file_write), parameters, result preview. The replay uses a typing cursor effect on a 4x timescale to fit demo timing.

**That is the entire surface area.** No login, no settings, no admin, no analytics, no notifications screen. Single property hardcoded (Rosewood Hong Kong). Single user implied (the staff member running the demo).

---

## Data Model (Convex Schema)

Six tables. Convex schema-as-code, lives in `convex/schema.ts`.

```typescript
guests: {
  firstName, lastName, photoUrl,
  loyaltyTier, firstStayDate, totalStays, lifetimeSpendUsd,
  advisor: { agency, name, note }?,
  nextArrival: { property, checkinIso, checkoutIso, flightCode,
                 flightStatus, carEtaIso, suite }?
}

observations: {
  guestId, rawText, capturedAtIso, source,
  capturedBy: { name, role, property },
  extracted: {
    categories: string[],
    facts: { type, value }[],
    applicableRoles: string[],
    confidence: number
  }
} indexed by guestId

externalSignals: {
  guestId, platform, venue, reviewDateIso,
  rating, excerpt, extractedTags: string[]
} indexed by guestId

briefs: {
  guestId, generatedAtIso, agentRunMinutes,
  summary, keyFacts: { fact, source }[],
  externalSignalsSummary,
  suggestedGestures: { title, rationale, estCostUsd, status }[],
  sensitivities: string[]
} indexed by guestId

agentEvents: {
  briefId, timestampIso, eventType,
  tool?, params?, resultPreview?
} indexed by briefId

rolePermissions: {
  role, visibleCategories: string[]
}
```

Three Convex functions:

- `mutations.captureObservation(guestId, rawText, capturedBy)` — calls Anthropic API for extraction, inserts to `observations`. Returns the new observation. Triggers reactive query updates in any open guest view.
- `queries.getGuestBrief(guestId, viewerRole)` — joins guest + observations + externalSignals + brief, filters observations by viewerRole's permissions, returns a single composed object. The role switcher just calls this with a different role.
- `queries.streamAgentEvents(briefId)` — returns agent events ordered by timestamp. Convex reactivity means new events appear in the UI as written.

---

## AI Implementation — Five Specific, Impactful Uses

This is the section judges will scrutinize. Be precise about what AI does and where.

**1. Live observation extraction (Anthropic Messages API, Sonnet 4.6).** The voice transcript is sent to Claude with a structured-output prompt that returns categories, typed facts, applicable roles, and a confidence score. Sub-3-second round trip. **Live in demo.** This is the input-layer fix.

**2. Pre-Arrival Research Agent (Claude Managed Agents).** A long-running agent defined once, triggered when a booking is confirmed. Tools: web search, web fetch, file operations. System prompt instructs it to find the guest's public reviews, identify time-sensitive events in the destination, and synthesize into a structured brief. Runs autonomously for 30–90 minutes per guest. **Pre-run for Anderson; event log replayed live.** This is the Theme 1 anchor.

**3. Delight Discovery Agent (Claude Managed Agents).** A second agent that runs daily for VIP arrivals. Cross-references guest profile against destination calendar, partner availability (mocked), and brand Placemaker roster. Outputs three ranked gestures with rationale. **Pre-run; results presented in Delight Modal.**

**4. Role-aware routing (Anthropic Messages API, part of extraction).** The same call that extracts facts also decides which staff roles should see the observation. The decision is stored on the observation (`applicableRoles`) and drives the role switcher. **Live during voice capture demo.**

**5. Brief-tone draft (Anthropic Messages API, stretch goal — Hour 5 if time).** A "Draft GM welcome note" button on the Guest Brief that produces a one-paragraph handwritten-style note in the GM's voice, referencing one observation. Human-edited before sending. **Pre-baked example in demo if not built.**

Every one of these uses AI for **synthesis, routing, or research** — never for direct guest-facing interaction. This is the brand-aligned use of AI that the GM's speech endorsed.

---

## Demo Script (3 minutes, rehearsed)

**0:00–0:25 — The problem.**
*"Ultra-luxury hospitality runs on institutional memory. That memory walks out the door when staff turn over. Every brand has a CRM. None of them solve the input problem — what staff observe rarely gets captured, almost never propagates. Today we're showing the input fix."*

**0:25–1:05 — Capture demo (LIVE).**
Open arrivals dashboard. Click into Anderson. Click the floating capture button. Say into mic: *"Mr. Anderson mentioned his daughter Mia just turned ten and loved the pool in London last month."* Hit extract. JSON appears, fields populated. Watch it land into Anderson's profile under "Recent observations." *"Five seconds. Anyone on staff can do this. The bartender, the housekeeper, the doorman. The data layer is no longer broken."*

**1:05–1:50 — Surface + role switch (LIVE).**
Show Anderson's brief in front-desk view. Walk through Key Facts (sourced), External Signals (TripAdvisor — Singita), Suggested Gesture (ceramics kit, rationale, cost). Click the role dropdown → Restaurant Manager. The page reorganizes to show only F&B data — Singita bartender preference rises, gluten-free wife appears, suite-level breakfast routine. *"Same brain. Different lens. AI routes the right knowledge to the right person."*

**1:50–2:30 — Delight + Managed Agent reveal.**
Open the "Active Agents" sidebar. The event stream is visible — `web_search("James Anderson TripAdvisor reviews")` → `web_fetch(...)` → `file_write("brief.json")`. *"This brief wasn't written by anyone on staff. It was written by a Claude Managed Agent that started 18 hours ago. It read every public review Mr. Anderson has written. It found three time-sensitive things in Hong Kong this week. It drafted gestures, with rationale."* Click Generate Delight Options. Three cards. Pick one — the ceramics-themed surprise — *"approved, scheduled, the concierge sees it now."*

**2:30–3:00 — Close.**
*"Mr. Anderson will walk into the property in 90 minutes. The front desk will recognize him by sight. The brief is ready. The gesture is scheduled. His daughter's name is known. His mezcal preference is known. He will not encounter AI at any moment. The staff will look like magicians. That is the Rosewood standard, augmented. We built one brain that solves arrival orchestration and the invisible concierge at the same time — because they are the same problem. Thank you."*

---

## Out of Scope (Explicit Cuts)

| Cut | Why |
|---|---|
| Guest-facing app/chat | Violates brand thesis; matches what every other team will build |
| Post-stay engine | Theme 3, not addressing |
| Real face recognition | Legally fraught, 8+ hours to build |
| Real flight API integration | Mock status text suffices |
| Real concierge calling/SMS automation | Separate workflow, breaks cohesion |
| Authentication & multi-user | Single demo user |
| Multi-property selection | Hardcode Rosewood Hong Kong + reference London in seed |
| Mobile app native build | Web app is enough; voice capture works in mobile Safari/Chrome |
| Analytics dashboards | Zero stage time available |
| Settings, admin, onboarding | Skip entirely |

---

## Judging Criteria Map

### Live Demo (45% Round 1 / equal Round 2)

**What earns the points here, ranked by leverage:**
1. **Voice capture working live with structured JSON in under 3 seconds.** The single biggest moment. Rehearse the sentence.
2. **Role switcher animation.** Smooth, framer-motion choreography. Make it feel intentional, not gimmicky.
3. **Active Agents event stream.** Sells the asynchronous AI in 10 seconds. Use a cursor effect.
4. **No crashes, no lag.** Test the demo path three times on the demo machine. Have a backup local-only mode that doesn't depend on Convex cloud (in case wifi flakes).

### Creativity & Originality (35% Round 1 / equal Round 2)

**Five pitch beats that win this:**
1. *Staff-facing, not guest-facing* — countertrend, matches GM speech.
2. *Fixing the input layer, not the output* — every other team will build chatbots.
3. *Role-aware lenses on the same brain* — visual differentiator, novel UI pattern.
4. *Claude Managed Agents running asynchronously behind the curtain* — cutting-edge infrastructure used for the right reason.
5. *External signal extraction across TripAdvisor / Google / Reddit* — no one else will do this.

Hit all five explicitly in the 3 minutes.

### Impact Potential (20% Round 1 / equal Round 2)

**Three claims to use in Q&A:**
1. Solves the institutional-memory-loss problem at every ultra-luxury brand. 60 person-years of knowledge preserved per property per three-year cycle.
2. Mandarin Oriental built a version internally and announced it April 2025. Sense is the category platform — any brand deploys, no internal build required.
3. Extends naturally to cross-property memory and to the post-stay engine (which we deprioritized but which slots into this data model with zero schema changes).

---

## Build Timeline (4–5 hours, AI-assisted)

| Hour | Output |
|---|---|
| **0:00–0:45** | Convex project + schema deployed; Next.js app scaffolded with shadcn/ui; seed data for Anderson + 2 thin guests written |
| **0:45–1:30** | Arrivals Dashboard screen built; Guest Brief layout shell built (no role switcher yet) |
| **1:30–2:15** | Voice Capture modal + extraction Convex function (Anthropic API) — **fully working** |
| **2:15–3:00** | Role switcher logic + filtering query + framer-motion transitions; Active Agents sidebar with replayable event stream |
| **3:00–3:45** | Set up Managed Agent, run for Anderson, cache event log; Delight Generator modal with seeded options |
| **3:45–4:30** | Visual polish — typography, spacing, the editorial look; loading states; error handling on voice API |
| **4:30–5:00** | Rehearse demo 3x; record a screen-capture backup; verify on demo laptop in demo browser |

Hour 0 is the riskiest because Convex deployment for the first time can hit a snag. If you're not already familiar, watch the 4-minute Convex Quickstart video before you start the clock.

---

## One last thing

Before you write the first line of code, write the seed data for Anderson. Three observations, two external signals, one full brief, one agent event log, one full set of three delight gestures. Make it feel like a real person. Mia, the pottery comment, the mezcal review, the gluten-free wife, the suite preference, the third visit. Everything in the product is downstream of how convincing that one record is on stage. Spend 45 minutes on the seed file. It's the highest-leverage hour of the build.

Now go.