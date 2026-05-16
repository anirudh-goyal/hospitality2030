# Plan C: Polish - Sense Hackathon Build

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the three defined Framer Motion moments, run a design language audit against the Black Card rules, do a minimal accessibility pass, rehearse the full demo, and (optionally) deploy to Vercel as a safety net.

**Architecture:** Framer Motion variants defined in `src/lib/motion.ts` and consumed by the three components that need them (role switcher area, observations feed, agent panel). All other animation stays CSS-only. Design audit is screenshot-driven with Playwright MCP.

**Tech Stack:** Framer Motion, Playwright MCP, optional Vercel.

**Prerequisites:** Plan A and Plan B completed. The full demo path runs in Chrome with no missing UI.

**Related spec:** `docs/superpowers/specs/2026-05-16-execution-sequence-design.md` (Phases 7 to 8).

---

## File structure produced by Plan C

```
src/
  lib/
    motion.ts                           # Create (T7.1)
  components/
    brief-view.tsx                      # Modify (T7.2): wrap section list in AnimatePresence
    observations-feed.tsx               # Modify (T7.3): per-row Framer Motion entry
    agent-panel.tsx                     # Modify (T7.4): per-event Framer Motion fade-in
```

No new files outside `src/lib/motion.ts`. All other changes are edits.

---

## Phase 7: Motion polish and design audit

### Task 7.1: Motion variants

**Files:** Create `src/lib/motion.ts`

- [ ] **Step 1: Create the variants file**

Create `src/lib/motion.ts`:

```ts
import type { Variants, Transition } from "framer-motion";

const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: easeOut } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: easeOut } },
};

export const observationVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: easeOut },
  },
};

export const agentRowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.08, ease: "linear" } },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/motion.ts
git commit -m "Add Framer Motion variants for the 3 motion moments"
```

### Task 7.2: Role switcher cross-fade

**Files:** Modify `src/components/brief-view.tsx`

- [ ] **Step 1: Wrap sections in AnimatePresence**

Edit `src/components/brief-view.tsx`. Replace the inner JSX so the section stack is keyed by `role` and wrapped in `AnimatePresence`:

```tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { BriefHeader } from "./brief-header";
import { KeyFactsSection } from "./key-facts-section";
import { ExternalSignalsSection } from "./external-signals-section";
import { SensitivitiesSection } from "./sensitivities-section";
import { GestureSection } from "./gesture-section";
import { ObservationsFeed } from "./observations-feed";
import { AgentPanel } from "./agent-panel";
import type { Role } from "./role-switcher";
import { sectionVariants } from "@/lib/motion";

type Props = {
  guest: Doc<"guests">;
  brief: Doc<"briefs"> | null;
  observations: Doc<"observations">[];
  signals: Doc<"externalSignals">[];
};

export function BriefView({ guest, brief, observations: _o, signals }: Props) {
  const [role, setRole] = useState<Role>("front_desk");

  const visibleSignals = role === "front_desk" || role === "concierge" ? signals : [];
  const visibleSensitivities = brief?.sensitivities ?? [];
  const visibleKeyFacts = brief?.keyFacts ?? [];

  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <BriefHeader guest={guest} role={role} onRoleChange={setRole} />
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <KeyFactsSection facts={visibleKeyFacts} />
            <ExternalSignalsSection signals={visibleSignals} />
            {brief ? <GestureSection guestId={guest._id} guestName={`${guest.firstName} ${guest.lastName}`} /> : null}
            <SensitivitiesSection items={visibleSensitivities} />
            <ObservationsFeed guestId={guest._id} role={role} />
          </motion.div>
        </AnimatePresence>
      </div>
      <AgentPanel briefId={brief?._id} />
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/guests/anderson`. Toggle role. Sections should fade and slide on every change.

- [ ] **Step 3: Commit**

```bash
git add src/components/brief-view.tsx
git commit -m "Add role switcher cross-fade animation"
```

### Task 7.3: Observation landing motion

**Files:** Modify `src/components/observations-feed.tsx`

- [ ] **Step 1: Wrap rows in AnimatePresence**

Edit `src/components/observations-feed.tsx`. Replace the body:

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { filterForRole } from "@/lib/role-filter";
import type { Role } from "./role-switcher";
import { observationVariants } from "@/lib/motion";

export function ObservationsFeed({ guestId, role }: { guestId: Id<"guests">; role: Role }) {
  const observations = useQuery(api.observations.listForGuest, { guestId });
  if (!observations) return null;
  const filtered = filterForRole(observations, role);

  return (
    <section style={{ marginBottom: "2rem" }}>
      <div className="section-label" style={{ marginBottom: "1rem" }}>Observations</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <AnimatePresence initial={false}>
          {filtered.map((o) => (
            <motion.div
              key={o._id}
              variants={observationVariants}
              initial="hidden"
              animate="visible"
              style={{
                padding: "0.875rem 1rem",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.375rem",
                boxShadow: "0 0 0 0 var(--accent-muted)",
              }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PulseOnMount />
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline" }}>
                <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                  {new Date(o.capturedAtIso).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {o.capturedBy.name} - {o.capturedBy.role}
                </span>
                {o.extracted.categories.map((c) => (
                  <span
                    key={c}
                    className="font-mono"
                    style={{
                      fontSize: "0.625rem",
                      padding: "0.0625rem 0.375rem",
                      border: "1px solid var(--border)",
                      borderRadius: "0.375rem",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
              <p style={{ marginTop: "0.375rem", color: "var(--text-primary)" }}>{o.rawText}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 ? (
          <p style={{ color: "var(--text-tertiary)" }}>No observations visible for this role.</p>
        ) : null}
      </div>
    </section>
  );
}

function PulseOnMount() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: "-2px 0 8px var(--accent-muted)",
        pointerEvents: "none",
        borderRadius: "0.375rem",
      }}
    />
  );
}
```

The duplicated `animate` prop on the outer `motion.div` should be removed. Cleaned version, replace inline:

```tsx
<motion.div
  key={o._id}
  variants={observationVariants}
  initial="hidden"
  animate="visible"
  style={{
    position: "relative",
    padding: "0.875rem 1rem",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "0.375rem",
  }}
>
```

Replace the prior `<motion.div>` opener with this cleaned version. The wrapping `style` needs `position: "relative"` so the `PulseOnMount` absolute child positions correctly.

- [ ] **Step 2: Verify in browser**

Capture a new observation (use `/capture?guest=anderson&prefill=demo`). The new row should slide in from below and pulse gold briefly.

- [ ] **Step 3: Commit**

```bash
git add src/components/observations-feed.tsx
git commit -m "Add observation landing animation with gold pulse"
```

### Task 7.4: Agent event row fade-in during replay

**Files:** Modify `src/components/agent-panel.tsx`

- [ ] **Step 1: Wrap event rows in motion.div**

Edit `src/components/agent-panel.tsx`. Replace the `shown.map(...)` body to wrap each in motion.div:

```tsx
import { motion } from "framer-motion";
import { agentRowVariants } from "@/lib/motion";
```

Add those imports at the top of the file.

Then replace:

```tsx
{shown.map((e: Doc<"agentEvents">, i) => (
  <div key={e._id} style={{ position: "relative" }}>
    <AgentToolRow ... />
    {replaying && i === shown.length - 1 ? <span>...</span> : null}
  </div>
))}
```

With:

```tsx
{shown.map((e: Doc<"agentEvents">, i) => (
  <motion.div
    key={e._id}
    variants={agentRowVariants}
    initial={replaying ? "hidden" : "visible"}
    animate="visible"
    style={{ position: "relative" }}
  >
    <AgentToolRow
      timestampIso={e.timestampIso}
      eventType={e.eventType}
      tool={e.tool}
      params={e.params}
      resultPreview={e.resultPreview}
    />
    {replaying && i === shown.length - 1 ? (
      <span
        className="font-mono"
        style={{
          color: "var(--accent)",
          marginLeft: 4,
          animation: "blink 1s steps(1) infinite",
        }}
      >
        |
      </span>
    ) : null}
  </motion.div>
))}
```

- [ ] **Step 2: Verify in browser**

Click Replay. Each row should fade in (opacity 0 to 1, no slide) at 120ms intervals.

- [ ] **Step 3: Commit**

```bash
git add src/components/agent-panel.tsx
git commit -m "Add Framer Motion fade-in to agent event rows during replay"
```

### Task 7.5: Design language audit

**Files:** none (potentially small fixes across components)

- [ ] **Step 1: Screenshot every screen at 1440x900**

Use Playwright MCP `resize_window` to set 1440x900 (if MCP supports it), then `navigate` and `screenshot` each:
- `/arrivals` (filter: today)
- `/arrivals?filter=tomorrow`
- `/arrivals?filter=vip`
- `/guests/anderson` (all 5 roles, switch and screenshot each)
- `/capture` (empty state)
- `/capture?guest=anderson&prefill=demo` (filled state)

- [ ] **Step 2: Verify Black Card rules against each screenshot**

Checklist per screen:
- Background `var(--bg)` (warm-black `#0a0909`)
- Cards `var(--card)`, elevated `var(--elevated)`
- Borders only `var(--border)` hairline (no solid white/gray borders)
- No `rounded-full` on non-avatar elements (FAB is an exception, documented)
- No emojis anywhere
- Gold accent only on: loyalty pills, key-fact left borders, active tab underline, FAB bg, countdown text, replay cursor, approve button, gesture PRIMARY indicator
- All guest photos grayscale

- [ ] **Step 3: Fix any drift inline**

Common issues to fix:
- A card that picked up a default shadcn background instead of `var(--card)`
- An icon that smuggled in an emoji
- A rounded-2xl on something that should be 0.375rem
- shadcn DropdownMenu defaulting to a light/popover color instead of `--elevated`

For each fix, edit the relevant component and re-screenshot.

- [ ] **Step 4: Screenshot at 375x667 (mobile width sanity)**

Spot-check that screens do not break catastrophically at narrow widths. The desktop demo runs at 1440 plus, but a screenshot pass at mobile width catches accidental fixed-width assumptions. No requirement to be fully responsive.

- [ ] **Step 5: Commit fixes**

```bash
git add .
git commit -m "Design audit fixes: tokens, borders, accent usage"
```

### Task 7.6: Accessibility pass

**Files:** none (small inline fixes)

- [ ] **Step 1: Keyboard tab order**

Open `/capture?guest=anderson` in Chrome. Press Tab repeatedly. Verify order:
1. "Sense" wordmark link
2. "Capture" link in top bar
3. Guest picker button
4. Textarea
5. Mic button
6. Capture button
7. FAB

If any element is skipped or order is wrong, fix `tabIndex` on the offending element.

- [ ] **Step 2: Focus rings against warm-black**

Add to `src/app/globals.css` near the bottom:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 0.375rem;
}
```

This makes focus rings visible on the warm-black background.

- [ ] **Step 3: aria-labels on icon-only buttons**

Audit components for icon-only buttons without `aria-label`:
- `CaptureFAB` has `aria-label="New observation"` already
- Mic button in `capture-form.tsx` has `aria-label={recording ? "Stop recording" : "Start recording"}` already
- Role switcher trigger should have a label; add `aria-label="Switch role"` to the trigger button if not already

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/components/role-switcher.tsx
git commit -m "Accessibility: focus rings + aria-labels"
```

---

## Phase 8: Rehearsal

### Task 8.1: Full demo dry run

**Files:** none

- [ ] **Step 1: Restart the dev server clean**

Stop the running `pnpm dev`. Run:

```bash
pnpm dev
```

Wait for "Ready - started server on http://localhost:3000".

- [ ] **Step 2: Run the demo path top to bottom in Chrome**

1. Open `http://localhost:3000` in Chrome - redirects to `/arrivals`
2. Verify 2 cards (Anderson, Chen) on Today
3. Click Anderson card - lands on `/guests/anderson`, all 6 sections render
4. Verify countdown ticks
5. Click capture FAB - lands on `/capture`
6. Pick Anderson from the picker (or use the URL prefill)
7. Speak (or paste) the demo sentence
8. Click Capture - watch streaming extraction
9. After auto-save and redirect, verify new observation at top of feed with motion
10. Switch role to Restaurant - sections cross-fade
11. Switch back to Front Desk
12. Click Replay on agent panel - 47 events stream with cursor
13. Click Pause mid-replay, then Resume
14. Click "View all options" on suggested gesture
15. Click "Approve and Schedule" on Ceramics Experience
16. Close modal - featured gesture card shows Scheduled

- [ ] **Step 3: Time the run**

Stopwatch. Target: under 3 minutes for the talking-head version (with narration). Adjust pace.

- [ ] **Step 4: Identify any cracks**

If anything stutters, breaks, or feels off:
- Browser console errors: fix immediately
- Slow API calls: pre-warm or swap to Haiku
- Stutter in animation: drop the offending Framer Motion to CSS only

- [ ] **Step 5: Commit any fixes**

```bash
git add .
git commit -m "Demo rehearsal fixes"
```

### Task 8.2: Pre-flight checklist

**Files:** none

- [ ] **Step 1: Verify Chrome configuration**

- Chrome is the default browser on the demo laptop
- Visit `http://localhost:3000/capture`. Click mic. Approve mic permission for `localhost`. Re-visit and confirm mic works without prompting.
- Browser zoom: 100% (Cmd+0)
- Dev tools: closed (Cmd+Opt+I to toggle if open)
- Notifications: do-not-disturb on macOS

- [ ] **Step 2: Verify environment**

- `.env.local` has `ANTHROPIC_API_KEY`, `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`
- `pnpm dlx convex dev` running in one terminal
- `pnpm dev` running in another terminal on port 3000

- [ ] **Step 3: Pre-warm the extract API**

30 minutes before the demo, run:

```bash
curl -s -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"transcript":"warm up","guestId":"x"}' > /dev/null
```

This caches the model context window on Anthropic's side and reduces first-call latency.

- [ ] **Step 4: Pre-open browser tabs**

Open three Chrome tabs in this order:
1. `http://localhost:3000/arrivals`
2. `http://localhost:3000/guests/anderson`
3. `http://localhost:3000/capture?guest=anderson&prefill=demo`

The demo starts on tab 1.

- [ ] **Step 5: Screen-record a fallback take**

Use macOS Screen Recording (Cmd+Shift+5) to record a clean run of the demo. If anything fails live, you can play the recording. Save to `~/Desktop/sense-demo-fallback.mov`.

- [ ] **Step 6: No commit**

### Task 8.3: Optional Vercel deploy

**Files:** none

This is a safety net. Skip if time is tight.

- [ ] **Step 1: Push to a Vercel-connected repo**

```bash
git push origin main
```

If the repo is not connected to Vercel yet, run `pnpm dlx vercel link` and follow prompts.

- [ ] **Step 2: Set env vars in Vercel dashboard**

In `vercel.com/<account>/<project>/settings/environment-variables`, add:

- `ANTHROPIC_API_KEY` (same as `.env.local`)
- `CONVEX_DEPLOYMENT` (same as `.env.local`)
- `NEXT_PUBLIC_CONVEX_URL` (same as `.env.local`)

Apply to Production, Preview, and Development.

- [ ] **Step 3: Trigger redeploy**

In Vercel dashboard, click "Redeploy" on the latest deployment.

- [ ] **Step 4: Test on Vercel URL**

Walk through the demo path on the Vercel preview URL. Confirm:
- Convex calls work
- Extract API works
- Mic works (Vercel serves HTTPS, so Web Speech is permitted)

If any of these fail on Vercel, leave it. The demo is on localhost. Vercel is only the fallback.

- [ ] **Step 5: Bookmark the Vercel URL on the demo laptop**

- [ ] **Step 6: No commit**

---

## Plan C verification (end-of-plan gate)

All of these must be true before declaring the build complete:

1. Role switcher animates with cross-fade and slide when role changes
2. New observation row enters with motion plus a gold pulse on the left border
3. Agent event rows fade in one at a time during replay
4. Every screen passes the Black Card rule audit
5. Keyboard tab order is clean and focus rings are visible
6. Full demo path completes in Chrome in under 3 minutes
7. (Optional) Vercel deploy works as a fallback

If any of these fail, fix before the demo.

---

## What Plan C intentionally does NOT do

- No additional Framer Motion beyond the 3 defined moments
- No full WCAG accessibility - aim is "demo does not break for a keyboard user"
- No mobile-responsive design beyond a basic sanity check
- No automated tests (CLAUDE.md rule: no testing except manual demo path)
