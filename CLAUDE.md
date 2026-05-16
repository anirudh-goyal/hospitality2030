# Project: Sense — Staff Intelligence Layer

## What this is

Sense is a staff-facing AI intelligence platform for Rosewood Hotels. Staff capture guest observations via voice; AI structures and routes them. The Guest Brief aggregates observations, external signals, and agent-generated delight suggestions into a role-aware view. The guest never interacts with AI. Read SPEC.md for the full specification.

**Demo date:** May 16, 2026. Every decision must optimize for a 3-minute live demo.

## Hackathon context — read this before making any product decision

Full brief: `@hackathon_information.md`

**Problem statements addressed:**
- **Theme 1 — Hyper-Personalized Arrival Orchestration:** the Arrivals Dashboard + Guest Brief + Managed Agent pre-arrival research
- **Theme 2 — The Invisible Concierge:** the observation capture layer + role-aware routing + Delight Generator

**Unified pitch:** Arrival orchestration and the invisible concierge are the same intelligence problem at different timestamps. One brain powers both.

**Judging weights (Round 1):**
- Live Demo: **45%** — the demo path must work flawlessly. If something is fragile, cut it.
- Creativity & Originality: **35%** — the Cormorant Garamond aesthetic, the Managed Agent event replay, the role-switching brief are the differentiators. Protect these.
- Impact Potential: 20%

**Implication for every build decision:** Demo reliability > feature completeness. A polished 8-feature demo beats a broken 12-feature demo. When time is short, finish and stabilize what exists before adding new features.

## Stack — do not deviate

- Next.js 15, App Router, React 19, TypeScript strict mode
- Tailwind v4 — tokens are CSS variables in `globals.css`. No `tailwind.config.js`.
- shadcn/ui v4 — `pnpm dlx shadcn@latest add <component>`. New York style, Neutral base.
- Framer Motion — ONLY for the 3 defined animation moments (role switcher, observation landing, agent replay)
- Convex — real-time database. `pnpm dlx convex dev` must be running. Schema in `convex/schema.ts`.
- Vercel AI SDK 5 (`ai`, `@ai-sdk/anthropic`) — extraction endpoint only
- Anthropic SDK (`@anthropic-ai/sdk`) — Managed Agents seed script only
- Package manager: pnpm — never npm, never yarn

## Design language — "The Black Card"

The single most important visual choice: **Cormorant Garamond on guest names**. It transforms the product from SaaS into a luxury instrument.

### Fonts

Load in `layout.tsx` via `next/font/google`:
```ts
import { Cormorant_Garamond, Geist_Mono } from 'next/font/google'
const cormorant = Cormorant_Garamond({ weight: ['400', '500'], subsets: ['latin'] })
const geistMono = Geist_Mono({ subsets: ['latin'] })
```

- **Display** (guest names, modal headings): `font-family: var(--font-cormorant)`, `font-size: 2rem–2.5rem`, `font-weight: 500`, `letter-spacing: -0.02em`
- **Section labels**: system-ui, `0.6875rem`, uppercase, `letter-spacing: 0.1em`, `var(--text-tertiary)`
- **Body**: system-ui, `0.9375rem`, `line-height: 1.6`
- **Data/mono** (timestamps, ETAs, agent events, sources): `font-family: var(--font-geist-mono)`, `0.8125rem`

### Color tokens in `globals.css`

```css
:root {
  --bg:             #0a0909;
  --card:           #141210;
  --elevated:       #1e1c18;
  --surface:        #252219;
  --accent:         oklch(0.72 0.08 55);
  --accent-muted:   oklch(0.72 0.08 55 / 0.15);
  --border:         rgba(255, 240, 200, 0.07);
  --text-primary:   #f5f0e8;
  --text-secondary: rgba(245, 240, 232, 0.55);
  --text-tertiary:  rgba(245, 240, 232, 0.30);
  --sensitivity:    oklch(0.65 0.12 45);
}
```

### Enforced rules

- Background always `var(--bg)`. Cards `var(--card)`. Modals/elevated `var(--elevated)`.
- Accent `var(--accent)` used for: loyalty badge borders, Key Facts left border (2px), active tab underline, floating button bg, countdown text, replay cursor.
- No other color family. No teal. No blue. No purple.
- Borders always `var(--border)`. No solid white/gray borders.
- `border-radius: 0.375rem` (6px) max. Never `rounded-full` on non-avatar elements.
- No emojis.
- Photos: grayscale filter (`filter: grayscale(100%)`) on all guest images.

When making visual changes: use the Playwright MCP to screenshot and verify the result matches this language. Iterate until it does.

## House rules

- NO authentication. NO Clerk. No login screen.
- Server Components by default. `"use client"` only when you need hooks or browser APIs.
- All system prompts live in `src/lib/ai/prompts.ts`.
- All Zod schemas for AI outputs live in `src/lib/ai/extract-schema.ts`.
- Convex functions in `convex/` — no direct DB calls in React components.
- Extraction route: `src/app/api/extract/route.ts`. No other AI routes without instruction.
- `streamObject` routes must return `result.toTextStreamResponse()`, not `toDataStreamResponse()`.
- No spinners. Use `<Skeleton>` for loading states.
- `useOptimistic` for Convex writes that must feel instant.
- Never wrap Convex mutations in `useEffect`.
- Never commit `.env*` files.

## Parallel session file ownership

- **Session 1:** `src/app/arrivals/`, `src/app/guests/`, `src/components/guest-card.tsx`, `src/components/guest-brief.tsx`, `src/components/role-switcher.tsx`, `src/components/countdown-timer.tsx`, `convex/`
- **Session 2:** `src/components/capture-modal.tsx`, `src/components/delight-modal.tsx`, `src/components/agent-panel.tsx`, `src/app/api/`, `scripts/`
- **Session 3:** `src/app/globals.css`, design tokens, Framer Motion additions
- Do NOT edit another session's files without explicit instruction.
- `src/lib/` is shared — coordinate before editing.

## Workflow

- Start every session by reading SPEC.md and any existing PROGRESS.md.
- Append every completed task to PROGRESS.md with a one-line note.
- Log non-obvious decisions in DECISIONS.md.
- Add a rule to this file any time you do something wrong that could happen again.

## Known constraints

- Convex requires `pnpm dlx convex dev` running. Schema must be deployed before mutations/queries work.
- Web Speech API only works in Chrome/Edge on HTTPS or localhost. Demo on localhost in Chrome.
- `scripts/run-agent.ts` runs ONCE before the demo. Never trigger from the UI.
- Managed Agents and AI SDK use different packages — never mix them in the same file.

## Mistakes to never repeat

<!-- append here as the build progresses -->
