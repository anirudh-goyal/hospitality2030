# Plan A: Foundation - Sense Hackathon Build

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up MCP tooling, scaffold a Next.js 15 app with the Black Card design system, deploy the Convex schema, and seed all demo data (3 guests, observations, brief, external signals, 47 agent events). Outcome: `pnpm dev` boots, tokens render correctly on a probe page, `pnpm dlx convex run` returns the seeded data.

**Architecture:** Next.js 15 App Router + Tailwind v4 (CSS variables, no `tailwind.config.js`) + shadcn/ui (New York, Neutral) + Vercel AI Elements + Convex for data. All Black Card tokens defined as CSS vars in `globals.css`. Cormorant Garamond and Geist Mono loaded via `next/font/google`. Convex schema deployed via interactive `pnpm dlx convex dev`. Seed data populated by a Convex mutation invoked from a Node script.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Tailwind v4, shadcn/ui v4, Vercel AI Elements, Convex, pnpm. No testing framework (CLAUDE.md rule); verification is via Playwright MCP screenshots and `pnpm dlx convex run` introspection.

**Related spec:** `docs/superpowers/specs/2026-05-16-execution-sequence-design.md` (Phases 0 to 2).

---

## Working directory

All commands run from `/Users/anirudhgoyal/hospitality2030`. The Next.js app scaffolds into the existing repo root (the existing `.md` files coexist with the new `package.json`, `src/`, etc.).

## File structure produced by Plan A

```
hospitality2030/
  package.json                          # Phase 1
  pnpm-lock.yaml                        # Phase 1
  tsconfig.json                         # Phase 1
  next.config.ts                        # Phase 1
  postcss.config.mjs                    # Phase 1
  components.json                       # Phase 1 (shadcn)
  .env.local                            # Phase 0 (human gate) + 1 (convex appends)
  .env.example                          # Phase 1
  .gitignore                            # Phase 1 (verify .env* listed)
  convex/
    schema.ts                           # Task 2.1
    guests.ts                           # Task 2.2
    observations.ts                     # Task 2.3
    briefs.ts                           # Task 2.4
    agentEvents.ts                      # Task 2.5
    rolePermissions.ts                  # Task 2.6
    seed.ts                             # Tasks 2.6 + 2.7
    _generated/                         # auto by convex dev
  scripts/
    seed.ts                             # Task 2.8
  src/
    app/
      layout.tsx                        # Task 1.6 (fonts)
      page.tsx                          # Task 1.9 (tokens probe)
      globals.css                       # Task 1.7 (Black Card tokens)
    components/
      ui/                               # shadcn primitives via CLI
    lib/
      utils.ts                          # shadcn default cn helper
```

---

## Phase 0: Front-loaded setup

### Task 0.1: Install MCP servers

**Files:** none (modifies user-scoped Claude Code config)

- [ ] **Step 1: Install Playwright MCP**

Run:
```bash
claude mcp add playwright npx @playwright/mcp
```
Expected: confirmation that the server was added. Verify with `claude mcp list`.

- [ ] **Step 2: Install shadcn MCP**

Run:
```bash
claude mcp add shadcn npx @shadcn-ui/mcp
```
Expected: server added. If the package name has shifted, use the install command from `https://ui.shadcn.com/docs/mcp`.

- [ ] **Step 3: Install Convex MCP**

Run:
```bash
claude mcp add convex npx convex-mcp-server
```
Expected: server added. If the package name has shifted, use the install command from `https://docs.convex.dev/ai/mcp`.

- [ ] **Step 4: Restart Claude Code session**

Tell the user: "MCPs are installed. Please restart Claude Code so the new MCP servers load. After restart, confirm by running `/mcp` or asking me to list available MCP tools."

This is a session-boundary task. No commit.

### Task 0.2: Provision secrets and accounts

**Files:** `.env.local`, `.env.example`

- [ ] **Step 1: Create `.env.example`**

Create `/Users/anirudhgoyal/hospitality2030/.env.example`:

```
ANTHROPIC_API_KEY=
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
```

- [ ] **Step 2: Verify `.gitignore` covers env files**

Open `/Users/anirudhgoyal/hospitality2030/.gitignore` (created by create-next-app in Task 1.1 if it does not exist yet) and confirm it includes:

```
.env*
!.env.example
```

If `.gitignore` does not exist yet, defer this check to Task 1.1's verification step.

- [ ] **Step 3: Acquire Anthropic API key**

Tell the user: "Provide an `ANTHROPIC_API_KEY` from `https://console.anthropic.com/`. I will write it to `.env.local`."

When the user supplies the key, run (substituting `<KEY>`):

```bash
printf "ANTHROPIC_API_KEY=%s\n" "<KEY>" >> /Users/anirudhgoyal/hospitality2030/.env.local
```

- [ ] **Step 4: Defer Convex login to Task 1.8**

`CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` get written by `pnpm dlx convex dev` in Task 1.8. No work here.

- [ ] **Step 5: No commit**

`.env.local` must not be committed. Move on.

---

## Phase 1: Scaffold

### Task 1.1: Scaffold Next.js app into current directory

**Files:** creates `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `src/app/{layout,page}.tsx`, `src/app/globals.css`, `.gitignore`, `eslint.config.mjs`, `public/*`

- [ ] **Step 1: Verify cwd is repo root**

Run:
```bash
pwd
```
Expected: `/Users/anirudhgoyal/hospitality2030`

- [ ] **Step 2: Scaffold**

Run:
```bash
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm
```

When prompted about scaffolding into a non-empty directory: confirm yes. Existing `.md` files are preserved.

Expected output: Next.js app created. `package.json` exists with Next 15, React 19, TypeScript, Tailwind v4.

- [ ] **Step 3: Verify TypeScript strict mode**

Open `tsconfig.json` and confirm `"strict": true`. If not present, set it.

- [ ] **Step 4: Verify `.gitignore` covers env files**

Confirm `.gitignore` contains a line matching `.env*` (or `.env.local`). If only `.env.local` is listed, append:

```
.env*
!.env.example
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "Scaffold Next.js 15 app with TypeScript + Tailwind v4"
```

### Task 1.2: Install additional runtime dependencies

**Files:** `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install runtime deps**

Run:
```bash
pnpm add convex ai @ai-sdk/anthropic @anthropic-ai/sdk @ai-sdk/react framer-motion zod
```

- [ ] **Step 2: Verify versions**

Open `package.json` and confirm presence of: `convex`, `ai`, `@ai-sdk/anthropic`, `@anthropic-ai/sdk`, `@ai-sdk/react`, `framer-motion`, `zod`.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "Add Convex, AI SDK, Framer Motion, Zod"
```

### Task 1.3: Initialize shadcn/ui

**Files:** `components.json`, `src/lib/utils.ts`, may touch `src/app/globals.css`

- [ ] **Step 1: Init shadcn**

Run:
```bash
pnpm dlx shadcn@latest init
```

When prompted:
- Style: **New York**
- Base color: **Neutral**
- CSS variables: **Yes**

Accept other defaults.

- [ ] **Step 2: Verify components.json**

`components.json` should exist in the repo root with `"style": "new-york"` and `"baseColor": "neutral"`.

- [ ] **Step 3: Verify `src/lib/utils.ts` exists**

It should export the `cn` helper.

- [ ] **Step 4: Commit**

```bash
git add components.json src/lib/utils.ts src/app/globals.css
git commit -m "Initialize shadcn/ui (New York, Neutral)"
```

### Task 1.4: Bulk-add shadcn primitives

**Files:** creates `src/components/ui/*` for each component

- [ ] **Step 1: Add primitives**

Run:
```bash
pnpm dlx shadcn@latest add button card dialog dropdown-menu tabs badge skeleton scroll-area sonner avatar input command popover
```

Each component lands in `src/components/ui/`. Watch for any prompts about overwriting; accept the defaults.

- [ ] **Step 2: Verify**

List:
```bash
ls src/components/ui/
```
Expected entries include: `button.tsx`, `card.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `tabs.tsx`, `badge.tsx`, `skeleton.tsx`, `scroll-area.tsx`, `sonner.tsx`, `avatar.tsx`, `input.tsx`, `command.tsx`, `popover.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui package.json pnpm-lock.yaml
git commit -m "Add shadcn primitives (button, card, dialog, etc.)"
```

### Task 1.5: Add Vercel AI Elements primitives

**Files:** creates AI Elements components under `src/components/ui/` (or wherever the CLI places them)

- [ ] **Step 1: Add elements**

Run:
```bash
pnpm dlx ai-elements@latest add tool reasoning response source
```

Accept defaults.

- [ ] **Step 2: Verify**

Run:
```bash
ls src/components/ui/ | grep -iE "tool|reasoning|response|source"
```
Expected: at least 4 matches. If AI Elements places them in a different directory, locate them with `grep -r "ai-elements" src/components/`.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "Add Vercel AI Elements (tool, reasoning, response, source)"
```

### Task 1.6: Configure fonts in layout.tsx

**Files:** Modify `src/app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx content**

Overwrite `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-cormorant",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Sense",
  description: "Staff intelligence layer for Rosewood Hotels",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "Load Cormorant Garamond and Geist Mono via next/font"
```

### Task 1.7: Replace globals.css with Black Card tokens

**Files:** Overwrite `src/app/globals.css`

- [ ] **Step 1: Overwrite globals.css**

Overwrite `src/app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --bg: #0a0909;
  --card: #141210;
  --elevated: #1e1c18;
  --surface: #252219;
  --accent: oklch(0.72 0.08 55);
  --accent-muted: oklch(0.72 0.08 55 / 0.15);
  --border: rgba(255, 240, 200, 0.07);
  --text-primary: #f5f0e8;
  --text-secondary: rgba(245, 240, 232, 0.55);
  --text-tertiary: rgba(245, 240, 232, 0.30);
  --sensitivity: oklch(0.65 0.12 45);
  --radius: 0.375rem;
}

@theme inline {
  --color-background: var(--bg);
  --color-foreground: var(--text-primary);
  --color-card: var(--card);
  --color-elevated: var(--elevated);
  --color-surface: var(--surface);
  --color-accent: var(--accent);
  --color-accent-muted: var(--accent-muted);
  --color-border: var(--border);
  --color-muted: var(--text-secondary);
  --color-muted-foreground: var(--text-tertiary);
  --color-sensitivity: var(--sensitivity);
  --font-sans: system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-display: var(--font-cormorant);
  --font-mono: var(--font-geist-mono);
  --radius-sm: 0.375rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.375rem;
}

html, body {
  background: var(--bg);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.6;
}

* {
  border-color: var(--border);
}

.font-display {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}

.font-mono {
  font-family: var(--font-mono);
}

.section-label {
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
```

This block replaces any shadcn-generated tokens. If shadcn wrote its own `:root` block, this overwrite supersedes it.

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "Apply Black Card design tokens to globals.css"
```

### Task 1.8: Bootstrap Convex deployment

**Files:** appends to `.env.local`, creates `convex/_generated/`

- [ ] **Step 1: Start Convex dev**

Run in a long-running background process (the dev server must keep running for the rest of Plan A and beyond):

```bash
pnpm dlx convex dev
```

When prompted, log in via the browser link. Pick "new project" if no project is associated. Convex writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.

If running in a non-interactive environment, ask the user to run this command manually and confirm `.env.local` contains both variables.

- [ ] **Step 2: Verify env vars**

Run:
```bash
grep -E "CONVEX_DEPLOYMENT|NEXT_PUBLIC_CONVEX_URL" .env.local
```
Expected: both variables present.

- [ ] **Step 3: Commit `.gitignore` if Convex modified it**

If Convex wrote `convex/_generated` to `.gitignore`, leave it. Stage any harmless changes:

```bash
git status
git add .gitignore 2>/dev/null || true
git commit -m "Convex dev deployment provisioned" --allow-empty
```

(Empty commit acceptable to mark the milestone if nothing else changed.)

### Task 1.9: Verification gate (tokens probe page)

**Files:** Overwrite `src/app/page.tsx`

- [ ] **Step 1: Write tokens probe page**

Overwrite `src/app/page.tsx` with:

```tsx
export default function ProbePage() {
  return (
    <main style={{ minHeight: "100vh", padding: "4rem 2rem" }}>
      <h1 className="font-display" style={{ fontSize: "2.5rem", fontWeight: 500 }}>
        James Anderson
      </h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
        Tokens probe. Background warm-black. Display font Cormorant.
      </p>
      <p className="font-mono" style={{ color: "var(--text-tertiary)", marginTop: "1rem", fontSize: "0.8125rem" }}>
        CX 839 - On Time - Car ETA 2:15 PM
      </p>
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderLeft: "2px solid var(--accent)",
          borderRadius: "0.375rem",
          maxWidth: 480,
        }}
      >
        <p>Card surface, hairline border, gold left accent.</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run dev server**

Run (background):
```bash
pnpm dev
```
Wait for "Local: http://localhost:3000".

- [ ] **Step 3: Screenshot via Playwright MCP**

Use the Playwright MCP `navigate` and screenshot tools to capture `http://localhost:3000`. Verify visually:
- Background is warm-black (`#0a0909`)
- "James Anderson" renders in Cormorant Garamond
- Mono text renders in Geist Mono
- Card has hairline border and 2px gold left border
- No console errors

If anything fails, fix `globals.css` or `layout.tsx` before proceeding.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "Add tokens probe page; verify Black Card renders"
```

---

## Phase 2: Convex backend

### Task 2.1: Define Convex schema

**Files:** Create `convex/schema.ts`

- [ ] **Step 1: Create schema.ts**

Create `convex/schema.ts`:

```ts
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
    advisor: v.optional(
      v.object({
        agency: v.string(),
        name: v.string(),
        note: v.string(),
      })
    ),
    nextArrival: v.optional(
      v.object({
        property: v.string(),
        checkinIso: v.string(),
        checkoutIso: v.string(),
        flightCode: v.string(),
        flightStatus: v.string(),
        carEtaIso: v.string(),
        suite: v.string(),
      })
    ),
  }).index("by_slug", ["slug"]),

  observations: defineTable({
    guestId: v.id("guests"),
    rawText: v.string(),
    capturedAtIso: v.string(),
    source: v.string(),
    capturedBy: v.object({
      name: v.string(),
      role: v.string(),
      property: v.string(),
    }),
    extracted: v.object({
      categories: v.array(v.string()),
      facts: v.array(v.object({ type: v.string(), value: v.string() })),
      applicableRoles: v.array(v.string()),
      confidence: v.number(),
      summary: v.string(),
    }),
  }).index("by_guestId", ["guestId"]),

  externalSignals: defineTable({
    guestId: v.id("guests"),
    platform: v.string(),
    venue: v.string(),
    reviewDateIso: v.string(),
    rating: v.number(),
    excerpt: v.string(),
    extractedTags: v.array(v.string()),
  }).index("by_guestId", ["guestId"]),

  briefs: defineTable({
    guestId: v.id("guests"),
    generatedAtIso: v.string(),
    agentRunMinutes: v.number(),
    summary: v.string(),
    keyFacts: v.array(v.object({ fact: v.string(), source: v.string() })),
    externalSignalsSummary: v.string(),
    suggestedGestures: v.array(
      v.object({
        title: v.string(),
        rationale: v.string(),
        estCostHkd: v.number(),
        availability: v.string(),
        status: v.string(),
      })
    ),
    sensitivities: v.array(v.string()),
  }).index("by_guestId", ["guestId"]),

  agentEvents: defineTable({
    briefId: v.id("briefs"),
    timestampIso: v.string(),
    eventType: v.string(),
    tool: v.optional(v.string()),
    params: v.optional(v.string()),
    resultPreview: v.optional(v.string()),
  }).index("by_briefId", ["briefId"]),

  rolePermissions: defineTable({
    role: v.string(),
    visibleCategories: v.array(v.string()),
  }),
});
```

- [ ] **Step 2: Verify schema deploys**

`pnpm dlx convex dev` (running in background from Task 1.8) should push the schema automatically. Watch its terminal for "schema pushed" or equivalent. If errors, fix them.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "Define Convex schema (6 tables, indexes)"
```

### Task 2.2: Guests queries

**Files:** Create `convex/guests.ts`

- [ ] **Step 1: Create guests.ts**

Create `convex/guests.ts`:

```ts
import { v } from "convex/values";
import { query } from "./_generated/server";

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("guests").collect();
  },
});

export const listArriving = query({
  args: { filter: v.union(v.literal("today"), v.literal("tomorrow"), v.literal("vip")) },
  handler: async (ctx, { filter }) => {
    const all = await ctx.db.query("guests").collect();
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

    const withArrival = all.filter((g) => g.nextArrival);

    let filtered;
    if (filter === "today") {
      filtered = withArrival.filter((g) => g.nextArrival!.checkinIso.startsWith(today));
    } else if (filter === "tomorrow") {
      filtered = withArrival.filter((g) => g.nextArrival!.checkinIso.startsWith(tomorrow));
    } else {
      filtered = withArrival.filter((g) => g.loyaltyTier === "Inner Circle");
    }

    return filtered.sort((a, b) =>
      a.nextArrival!.carEtaIso.localeCompare(b.nextArrival!.carEtaIso)
    );
  },
});
```

- [ ] **Step 2: Confirm Convex pushes the file**

Watch `convex dev` terminal for success.

- [ ] **Step 3: Commit**

```bash
git add convex/guests.ts
git commit -m "Add guests queries (getBySlug, listAll, listArriving)"
```

### Task 2.3: Observations functions

**Files:** Create `convex/observations.ts`

- [ ] **Step 1: Create observations.ts**

Create `convex/observations.ts`:

```ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const extractedShape = v.object({
  categories: v.array(v.string()),
  facts: v.array(v.object({ type: v.string(), value: v.string() })),
  applicableRoles: v.array(v.string()),
  confidence: v.number(),
  summary: v.string(),
});

const capturedByShape = v.object({
  name: v.string(),
  role: v.string(),
  property: v.string(),
});

export const listForGuest = query({
  args: { guestId: v.id("guests") },
  handler: async (ctx, { guestId }) => {
    const rows = await ctx.db
      .query("observations")
      .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
      .collect();
    return rows.sort((a, b) => b.capturedAtIso.localeCompare(a.capturedAtIso));
  },
});

export const capture = mutation({
  args: {
    guestId: v.id("guests"),
    rawText: v.string(),
    source: v.string(),
    capturedBy: capturedByShape,
    extracted: extractedShape,
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("observations", {
      ...args,
      capturedAtIso: new Date().toISOString(),
    });
    return id;
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add convex/observations.ts
git commit -m "Add observations functions (listForGuest, capture)"
```

### Task 2.4: Briefs functions

**Files:** Create `convex/briefs.ts`

- [ ] **Step 1: Create briefs.ts**

Create `convex/briefs.ts`:

```ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getForGuest = query({
  args: { guestId: v.id("guests") },
  handler: async (ctx, { guestId }) => {
    return await ctx.db
      .query("briefs")
      .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
      .unique();
  },
});

export const approveGesture = mutation({
  args: { briefId: v.id("briefs"), gestureIndex: v.number() },
  handler: async (ctx, { briefId, gestureIndex }) => {
    const brief = await ctx.db.get(briefId);
    if (!brief) throw new Error("Brief not found");
    const gestures = brief.suggestedGestures.map((g, i) =>
      i === gestureIndex ? { ...g, status: "scheduled" } : g
    );
    await ctx.db.patch(briefId, { suggestedGestures: gestures });
    return await ctx.db.get(briefId);
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add convex/briefs.ts
git commit -m "Add briefs functions (getForGuest, approveGesture)"
```

### Task 2.5: Agent events functions

**Files:** Create `convex/agentEvents.ts`

- [ ] **Step 1: Create agentEvents.ts**

Create `convex/agentEvents.ts`:

```ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listForBrief = query({
  args: { briefId: v.id("briefs") },
  handler: async (ctx, { briefId }) => {
    const rows = await ctx.db
      .query("agentEvents")
      .withIndex("by_briefId", (q) => q.eq("briefId", briefId))
      .collect();
    return rows.sort((a, b) => a.timestampIso.localeCompare(b.timestampIso));
  },
});

export const replaceForBrief = mutation({
  args: {
    briefId: v.id("briefs"),
    events: v.array(
      v.object({
        timestampIso: v.string(),
        eventType: v.string(),
        tool: v.optional(v.string()),
        params: v.optional(v.string()),
        resultPreview: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { briefId, events }) => {
    const existing = await ctx.db
      .query("agentEvents")
      .withIndex("by_briefId", (q) => q.eq("briefId", briefId))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);
    for (const e of events) await ctx.db.insert("agentEvents", { briefId, ...e });
    return events.length;
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add convex/agentEvents.ts
git commit -m "Add agent events functions (listForBrief, replaceForBrief)"
```

### Task 2.6: Base seed mutation (guests, observations, brief, signals, rolePermissions)

**Files:** Create `convex/seed.ts`

- [ ] **Step 1: Create seed.ts with base seed**

Create `convex/seed.ts`:

```ts
import { mutation } from "./_generated/server";

const ROLE_PERMISSIONS = [
  { role: "front_desk", visibleCategories: ["dietary", "beverage", "room", "family", "wellness", "interests", "milestones", "sensitivities", "service"] },
  { role: "concierge", visibleCategories: ["interests", "milestones", "family", "sensitivities", "service"] },
  { role: "restaurant", visibleCategories: ["dietary", "beverage", "family", "service"] },
  { role: "spa", visibleCategories: ["wellness", "sensitivities"] },
  { role: "housekeeping", visibleCategories: ["room", "service"] },
];

export const runBaseSeed = mutation({
  args: {},
  handler: async (ctx) => {
    for (const table of ["guests", "observations", "externalSignals", "briefs", "agentEvents", "rolePermissions"] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const r of rows) await ctx.db.delete(r._id);
    }

    const andersonId = await ctx.db.insert("guests", {
      slug: "anderson",
      firstName: "James",
      lastName: "Anderson",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=240&fit=crop",
      loyaltyTier: "Inner Circle",
      firstStayDate: "2022-09-14",
      totalStays: 3,
      lifetimeSpendUsd: 84_500,
      advisor: { agency: "Brownell Travel", name: "Marie Lacoste", note: "Prefers high-floor, quiet" },
      nextArrival: {
        property: "Rosewood Hong Kong",
        checkinIso: new Date().toISOString().slice(0, 10) + "T14:30:00Z",
        checkoutIso: new Date(Date.now() + 4 * 86_400_000).toISOString().slice(0, 10) + "T11:00:00Z",
        flightCode: "CX 839",
        flightStatus: "On Time",
        carEtaIso: new Date(Date.now() + 90 * 60_000).toISOString(),
        suite: "Harbour Grand",
      },
    });

    const chenId = await ctx.db.insert("guests", {
      slug: "chen",
      firstName: "Sarah",
      lastName: "Chen",
      photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=240&h=240&fit=crop",
      loyaltyTier: "Rosewood Enthusiast",
      totalStays: 1,
      nextArrival: {
        property: "Rosewood Hong Kong",
        checkinIso: new Date().toISOString().slice(0, 10) + "T16:00:00Z",
        checkoutIso: new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10) + "T11:00:00Z",
        flightCode: "BA 31",
        flightStatus: "On Time",
        carEtaIso: new Date(Date.now() + 4 * 3600_000).toISOString(),
        suite: "Superior Suite",
      },
    });

    await ctx.db.insert("guests", {
      slug: "webb",
      firstName: "Marcus",
      lastName: "Webb",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=240&fit=crop",
      loyaltyTier: "Guest",
      totalStays: 0,
      nextArrival: {
        property: "Rosewood Hong Kong",
        checkinIso: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) + "T15:00:00Z",
        checkoutIso: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10) + "T11:00:00Z",
        flightCode: "QF 117",
        flightStatus: "On Time",
        carEtaIso: new Date(Date.now() + 26 * 3600_000).toISOString(),
        suite: "Premium Suite",
      },
    });

    const observations = [
      {
        rawText: "Mr. Anderson mentioned his daughter Mia just turned ten and loved the pool at Rosewood London last month.",
        source: "voice",
        capturedBy: { name: "Marie L.", role: "concierge", property: "Rosewood London" },
        capturedAtIso: "2026-04-22T10:14:00Z",
        extracted: {
          categories: ["family", "interests"],
          facts: [
            { type: "child_name", value: "Mia" },
            { type: "child_age", value: "10" },
            { type: "loved_amenity", value: "Pool at Rosewood London" },
          ],
          applicableRoles: ["front_desk", "concierge", "restaurant"],
          confidence: 0.94,
          summary: "Anderson's daughter Mia, ten, loved the Rosewood London pool.",
        },
      },
      {
        rawText: "Anderson always orders Casa Dragones Joven, neat.",
        source: "voice",
        capturedBy: { name: "Daniel R.", role: "restaurant", property: "Rosewood London" },
        capturedAtIso: "2026-04-22T20:42:00Z",
        extracted: {
          categories: ["beverage"],
          facts: [{ type: "preferred_spirit", value: "Casa Dragones Joven, neat" }],
          applicableRoles: ["front_desk", "restaurant", "concierge"],
          confidence: 0.97,
          summary: "Mezcal preference: Casa Dragones Joven, neat.",
        },
      },
      {
        rawText: "Severe shellfish allergy. Do not mention by name at dining.",
        source: "manual",
        capturedBy: { name: "GM", role: "front_desk", property: "Rosewood Hong Kong" },
        capturedAtIso: "2026-04-15T09:00:00Z",
        extracted: {
          categories: ["sensitivities", "dietary"],
          facts: [{ type: "allergy", value: "shellfish (severe)" }],
          applicableRoles: ["front_desk", "restaurant", "concierge", "spa", "housekeeping"],
          confidence: 1.0,
          summary: "Severe shellfish allergy - do not mention by name.",
        },
      },
      {
        rawText: "Asked about ceramics studios in Hong Kong during last stay.",
        source: "voice",
        capturedBy: { name: "Hugo P.", role: "concierge", property: "Rosewood Hong Kong" },
        capturedAtIso: "2025-11-08T15:21:00Z",
        extracted: {
          categories: ["interests"],
          facts: [{ type: "interest", value: "Ceramics, hands-on studios" }],
          applicableRoles: ["front_desk", "concierge"],
          confidence: 0.9,
          summary: "Interested in ceramics studios.",
        },
      },
    ];

    for (const o of observations) {
      await ctx.db.insert("observations", { guestId: andersonId, ...o });
    }

    await ctx.db.insert("observations", {
      guestId: chenId,
      rawText: "Vegan, prefers natural wines.",
      source: "manual",
      capturedAtIso: "2026-05-01T12:00:00Z",
      capturedBy: { name: "GM", role: "front_desk", property: "Rosewood Hong Kong" },
      extracted: {
        categories: ["dietary", "beverage"],
        facts: [{ type: "diet", value: "vegan" }, { type: "wine", value: "natural wines" }],
        applicableRoles: ["front_desk", "restaurant"],
        confidence: 0.98,
        summary: "Vegan with a natural-wine preference.",
      },
    });

    await ctx.db.insert("externalSignals", {
      guestId: andersonId,
      platform: "TripAdvisor",
      venue: "Singita Pamushana Lodge, Zimbabwe",
      reviewDateIso: "2024-10-12",
      rating: 5,
      excerpt: "The mezcal selection at the bar was extraordinary. The pottery studio visit organized for our daughter was the highlight of the trip.",
      extractedTags: ["mezcal", "pottery", "family", "daughter"],
    });

    await ctx.db.insert("externalSignals", {
      guestId: andersonId,
      platform: "Pottery Review",
      venue: "Touching Stone Gallery, Kyoto",
      reviewDateIso: "2024-06-04",
      rating: 5,
      excerpt: "James commissioned a tea bowl on the spot. He has a real eye for wood-fired work.",
      extractedTags: ["ceramics", "collector", "commission"],
    });

    const briefId = await ctx.db.insert("briefs", {
      guestId: andersonId,
      generatedAtIso: new Date(Date.now() - 18 * 3600_000).toISOString(),
      agentRunMinutes: 42,
      summary: "Anderson arrives Inner Circle, third Rosewood stay, traveling with daughter Mia (10). Verified ceramics collector and mezcal enthusiast. Severe shellfish allergy.",
      keyFacts: [
        { fact: "Daughter Mia (10) loved the Rosewood London pool last month.", source: "Marie L., Rosewood London - Apr 22" },
        { fact: "Drinks Casa Dragones Joven, neat.", source: "Daniel R., Rosewood London - Apr 22" },
        { fact: "Severe shellfish allergy - do not mention by name.", source: "GM, Rosewood Hong Kong - Apr 15" },
      ],
      externalSignalsSummary: "TripAdvisor (Singita) and Pottery Review (Kyoto) confirm interests in ceramics and mezcal.",
      suggestedGestures: [
        {
          title: "The Ceramics Experience",
          rationale: "Pottery Review names James a ceramics collector. Touching Stone Gallery partnership lets us arrange a private wood-fired studio visit Thursday afternoon, between his confirmed meetings.",
          estCostHkd: 1200,
          availability: "Available Thursday",
          status: "draft",
        },
        {
          title: "Pool Morning Package for Mia",
          rationale: "Daughter Mia (10) loved the pool at Rosewood London per Marie L. Pre-arrange a sunrise pool slot with the kids' program, breakfast for two poolside, and a stuffed Rosewood koala in the room.",
          estCostHkd: 650,
          availability: "Available Today",
          status: "draft",
        },
        {
          title: "Mezcal Tasting Journey",
          rationale: "Bar manager at Singita Pamushana noted Anderson's mezcal expertise. Curate a 4-pour flight including a Casa Dragones reserve our HK bar holds back. Pair with a chocolate course (no shellfish proximity).",
          estCostHkd: 980,
          availability: "Check Availability",
          status: "draft",
        },
      ],
      sensitivities: [
        "Severe shellfish allergy - do not mention by name at dining",
        "Spouse not traveling - do not reference her",
        "Recovering from minor knee surgery - no spa pressure on right knee",
      ],
    });

    for (const rp of ROLE_PERMISSIONS) {
      await ctx.db.insert("rolePermissions", rp);
    }

    return { andersonId, briefId };
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add convex/seed.ts
git commit -m "Add base seed mutation (guests, observations, brief, signals, roles)"
```

### Task 2.7: Agent events seed mutation (47 events)

**Files:** Append to `convex/seed.ts`

- [ ] **Step 1: Append agent events seed**

Append to `convex/seed.ts` (after the existing `runBaseSeed` export):

```ts
import { v } from "convex/values";

export const seedAgentEvents = mutation({
  args: { briefId: v.id("briefs") },
  handler: async (ctx, { briefId }) => {
    const existing = await ctx.db
      .query("agentEvents")
      .withIndex("by_briefId", (q) => q.eq("briefId", briefId))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);

    const base = Date.now() - 18 * 3600_000;
    const eventsRaw: Array<[number, string, string?, string?, string?]> = [
      [0, "web_search", "web_search", "James Anderson Rosewood Inner Circle review", "3 results"],
      [12_000, "web_search", "web_search", "James Anderson TripAdvisor Singita", "1 result, 5 stars"],
      [22_000, "web_fetch", "web_fetch", "https://tripadvisor.com/Review-Singita-Pamushana", "review text 4.8KB"],
      [38_000, "synthesis", undefined, undefined, "Mezcal interest confirmed, pottery interest noted"],
      [44_000, "web_search", "web_search", "Anderson ceramics collector commission", "2 results"],
      [55_000, "web_fetch", "web_fetch", "https://potteryreview.com/touching-stone-anderson", "article 6.1KB"],
      [71_000, "synthesis", undefined, undefined, "Pottery Review names Anderson as wood-fired collector"],
      [82_000, "file_write", "write_to_context", "anderson-interests.md", "wrote 312 bytes"],
      [98_000, "web_search", "web_search", "Mia Anderson daughter age 10", "0 results"],
      [108_000, "web_search", "web_search", "James Anderson family Instagram", "3 results"],
      [121_000, "web_fetch", "web_fetch", "https://instagram.com/jamesanderson_hk/p/abc", "post: birthday at pool"],
      [137_000, "synthesis", undefined, undefined, "Mia's tenth birthday April 14, pool feature in post"],
      [149_000, "web_search", "web_search", "Hong Kong ceramics studio Thursday afternoon", "5 results"],
      [161_000, "web_fetch", "web_fetch", "https://touchingstone.hk/visit", "private studio bookings page"],
      [174_000, "web_search", "web_search", "Rosewood Hong Kong mezcal Casa Dragones reserve", "1 result"],
      [186_000, "web_fetch", "web_fetch", "internal://bar-inventory/mezcal", "Casa Dragones Joven reserve in stock"],
      [198_000, "synthesis", undefined, undefined, "Three candidate gestures emerging: ceramics studio, pool morning, mezcal flight"],
      [212_000, "file_write", "write_to_context", "anderson-gesture-options.md", "wrote 1.1KB"],
      [228_000, "web_search", "web_search", "Anderson shellfish allergy noted", "0 results"],
      [240_000, "web_fetch", "web_fetch", "internal://crm/allergy-flags/anderson", "severe shellfish allergy"],
      [253_000, "synthesis", undefined, undefined, "Allergy confirmed in CRM, must annotate mezcal pairing"],
      [266_000, "web_search", "web_search", "Touching Stone availability Thursday May 14 16:00", "2 slots"],
      [278_000, "web_fetch", "web_fetch", "https://touchingstone.hk/book?slot=thu1600", "slot held 24h"],
      [292_000, "synthesis", undefined, undefined, "Ceramics studio: Thursday 16:00 slot held"],
      [305_000, "web_search", "web_search", "Rosewood HK pool morning program kids 10", "1 result"],
      [318_000, "web_fetch", "web_fetch", "https://rosewoodhk.internal/pool-kids", "sunrise slot 06:30 available"],
      [331_000, "synthesis", undefined, undefined, "Pool morning: sunrise slot bookable for tomorrow"],
      [343_000, "web_search", "web_search", "Rosewood koala plush in-room amenity stock", "in stock x12"],
      [354_000, "file_write", "write_to_context", "mia-gesture-plan.md", "wrote 740 bytes"],
      [369_000, "web_search", "web_search", "Casa Dragones reserve mezcal flight 4-pour", "menu draft"],
      [381_000, "web_fetch", "web_fetch", "internal://fnb/mezcal-flight-template", "template loaded"],
      [394_000, "synthesis", undefined, undefined, "Mezcal flight: 4-pour, chocolate course no shellfish proximity"],
      [407_000, "web_search", "web_search", "Anderson spouse traveling May", "0 results"],
      [418_000, "web_fetch", "web_fetch", "internal://crm/anderson/reservation", "guest count 2, James and Mia"],
      [430_000, "synthesis", undefined, undefined, "Spouse not traveling, sensitivity noted"],
      [442_000, "web_search", "web_search", "Anderson minor knee surgery recovery", "1 result"],
      [453_000, "web_fetch", "web_fetch", "internal://crm/anderson/health-notes", "right knee surgery 6 weeks ago"],
      [466_000, "synthesis", undefined, undefined, "Spa: no pressure on right knee, document in sensitivities"],
      [478_000, "file_write", "write_to_context", "anderson-sensitivities.md", "wrote 480 bytes"],
      [493_000, "web_search", "web_search", "Rosewood London pool Mia April 2026 confirm", "1 result"],
      [504_000, "web_fetch", "web_fetch", "internal://rosewood-london/notes/anderson-april", "Marie's note on Mia"],
      [517_000, "synthesis", undefined, undefined, "Marie L. note corroborates pool delight"],
      [529_000, "web_search", "web_search", "advisor Marie Lacoste Brownell Travel contact", "1 result"],
      [540_000, "web_fetch", "web_fetch", "internal://crm/advisors/lacoste", "advisor record"],
      [552_000, "synthesis", undefined, undefined, "Advisor preference: high-floor, quiet"],
      [565_000, "file_write", "write_to_context", "anderson-final-brief.md", "wrote 2.3KB"],
      [580_000, "synthesis", undefined, undefined, "Brief assembled. Three candidate gestures identified."],
    ];

    const events = eventsRaw.map(([offsetMs, eventType, tool, params, resultPreview]) => ({
      timestampIso: new Date(base + offsetMs).toISOString(),
      eventType,
      tool,
      params,
      resultPreview,
    }));

    for (const e of events) {
      await ctx.db.insert("agentEvents", { briefId, ...e });
    }

    return events.length;
  },
});
```

The `import { v } from "convex/values";` line should be at the top of the file with the other imports. If it is already present from Task 2.6, do not duplicate.

- [ ] **Step 2: Verify file count of events**

The `eventsRaw` array should have exactly 47 entries. Count by scrolling, or run after deployment.

- [ ] **Step 3: Commit**

```bash
git add convex/seed.ts
git commit -m "Add 47 agent events seed mutation"
```

### Task 2.8: Seed runner script

**Files:** Create `scripts/seed.ts`, modify `package.json`

- [ ] **Step 1: Create scripts/seed.ts**

Create `scripts/seed.ts`:

```ts
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

async function main() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL missing from env");

  const client = new ConvexHttpClient(url);

  console.log("Running base seed...");
  const { andersonId, briefId } = await client.mutation(api.seed.runBaseSeed, {});
  console.log(`  Anderson: ${andersonId}`);
  console.log(`  Brief:    ${briefId}`);

  console.log("Seeding 47 agent events...");
  const count = await client.mutation(api.seed.seedAgentEvents, { briefId });
  console.log(`  Inserted ${count} events`);

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add tsx and dotenv-cli dev deps**

Run:
```bash
pnpm add -D tsx dotenv-cli
```

- [ ] **Step 3: Add seed script to package.json**

Open `package.json`, in the `"scripts"` section add:

```json
"seed": "dotenv -e .env.local -- tsx scripts/seed.ts"
```

(Keep the surrounding scripts intact.)

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts package.json pnpm-lock.yaml
git commit -m "Add seed runner script (pnpm seed)"
```

### Task 2.9: Run seed and verify

**Files:** none (data only)

- [ ] **Step 1: Run seed**

Confirm `pnpm dlx convex dev` is still running and the latest functions are pushed. Then run:

```bash
pnpm seed
```

Expected output:
```
Running base seed...
  Anderson: <id>
  Brief:    <id>
Seeding 47 agent events...
  Inserted 47 events
Seed complete.
```

- [ ] **Step 2: Verify via convex run**

Run:
```bash
pnpm dlx convex run guests:listArriving '{"filter":"today"}'
```
Expected: a JSON array with two entries (Anderson and Chen), Anderson first by carEtaIso.

Run:
```bash
pnpm dlx convex run guests:getBySlug '{"slug":"anderson"}'
```
Expected: Anderson's full guest record.

- [ ] **Step 3: Verify 47 events present**

Get the briefId first:
```bash
pnpm dlx convex run briefs:getForGuest '{"guestId":"<anderson-id-from-step-1>"}'
```
Then:
```bash
pnpm dlx convex run agentEvents:listForBrief '{"briefId":"<brief-id>"}'
```
Expected: an array with 47 entries, ordered by timestamp ascending.

- [ ] **Step 4: No commit (data is in Convex, not git)**

Plan A complete. Move on to Plan B.

---

## Plan A verification (end-of-plan gate)

Before declaring Plan A done, all of these must be true:

1. `pnpm dev` boots without errors
2. `http://localhost:3000` renders the tokens probe page with warm-black background, Cormorant Garamond display, hairline borders, and a gold left-accent card
3. `pnpm dlx convex dev` is running and has pushed all functions
4. `pnpm seed` completes with "47 events inserted"
5. `pnpm dlx convex run guests:listArriving '{"filter":"today"}'` returns Anderson and Chen
6. `pnpm dlx convex run agentEvents:listForBrief '{"briefId":"..."}'` returns 47 events

If any fail, fix before starting Plan B.

---

## What Plan A intentionally does NOT do

- No `/arrivals`, `/guests/[slug]`, or `/capture` pages (those are Plan B)
- No extract API route (Plan B)
- No capture FAB beyond the placeholder slot (Plan B)
- No motion (Plan C)
- No real Managed Agent run (Plan B Task 5.5, optional)
- No deploy (Plan C)
