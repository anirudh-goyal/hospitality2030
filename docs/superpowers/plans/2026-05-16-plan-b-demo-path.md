# Plan B: Demo Path - Sense Hackathon Build

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full 3-minute demo path on top of Plan A's foundation. Two screens (Arrivals, Guest Brief), the Capture page with live extraction, the agent panel with replay, and the delight modal. End-state: a human can complete the entire SPEC demo script in Chrome with no missing UI.

**Architecture:** Server Components for pages that fetch from Convex; client subviews for sections that need state (role switcher, reactivity, modals). Role filtering happens in memory on the client to keep the role switch instant. Convex `useQuery` for reactive sections (observations feed, suggested gesture). Voice capture via Web Speech API with a textarea fallback. Extraction via Vercel AI SDK `streamObject` with strict Zod enums.

**Tech Stack:** React 19 server/client split, Convex client SDK, Vercel AI SDK 5, `@ai-sdk/anthropic`, shadcn primitives, AI Elements `<Tool>` and `<Response>`. No Framer Motion yet (Plan C).

**Prerequisites:** Plan A completed (`pnpm dev` boots, Convex seeded, tokens render).

**Related spec:** `docs/superpowers/specs/2026-05-16-execution-sequence-design.md` (Phases 3 to 6).

---

## File structure produced by Plan B

```
src/
  app/
    layout.tsx                          # Modify (T3.2): add ConvexProvider, top bar, FAB slot
    page.tsx                            # Modify (T3.3): redirect to /arrivals
    arrivals/
      page.tsx                          # Create (T3.5)
    guests/
      [slug]/
        page.tsx                        # Create (T3.6)
    capture/
      page.tsx                          # Create (T4.5)
    api/
      extract/
        route.ts                        # Create (T4.3)
  components/
    convex-provider.tsx                 # Create (T3.1)
    capture-fab.tsx                     # Create (T3.2), update (T4.9)
    guest-card.tsx                      # Create (T3.4)
    brief-header.tsx                    # Create (T3.7)
    role-switcher.tsx                   # Create (T3.8)
    countdown-timer.tsx                 # Create (T3.9)
    key-facts-section.tsx               # Create (T3.10)
    external-signals-section.tsx        # Create (T3.11)
    sensitivities-section.tsx           # Create (T3.12)
    gesture-section.tsx                 # Create (T3.13), update (T6.3)
    observations-feed.tsx               # Create (T3.14)
    agent-panel.tsx                     # Create (T3.15), expand (T5.2)
    agent-tool-row.tsx                  # Create (T5.1)
    brief-view.tsx                      # Create (T3.16): client subview with role state
    capture-form.tsx                    # Create (T4.5)
    guest-picker.tsx                    # Create (T4.4)
    extraction-preview.tsx              # Create (T4.7)
    delight-modal.tsx                   # Create (T6.1)
  lib/
    ai/
      prompts.ts                        # Create (T4.2)
      extract-schema.ts                 # Create (T4.1)
    role-filter.ts                      # Create (T3.10)
    convex-client.ts                    # Create (T3.1)
scripts/
  run-agent.ts                          # Optional create (T5.5)
```

---

## Phase 3: Screens

### Task 3.1: Convex client wrapper and provider

**Files:** Create `src/lib/convex-client.ts`, `src/components/convex-provider.tsx`

- [ ] **Step 1: Create the client singleton**

Create `src/lib/convex-client.ts`:

```ts
import { ConvexReactClient } from "convex/react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");

export const convex = new ConvexReactClient(url);
```

- [ ] **Step 2: Create the provider component**

Create `src/components/convex-provider.tsx`:

```tsx
"use client";

import { ConvexProvider } from "convex/react";
import { ReactNode } from "react";
import { convex } from "@/lib/convex-client";

export function Providers({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/convex-client.ts src/components/convex-provider.tsx
git commit -m "Add Convex client and Providers wrapper"
```

### Task 3.2: Layout shell with top bar and FAB slot

**Files:** Modify `src/app/layout.tsx`, create `src/components/capture-fab.tsx`

- [ ] **Step 1: Create capture-fab.tsx (placeholder)**

Create `src/components/capture-fab.tsx`:

```tsx
import Link from "next/link";

export function CaptureFAB() {
  return (
    <Link
      href="/capture"
      aria-label="New observation"
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        width: 56,
        height: 56,
        borderRadius: 9999,
        background: "var(--accent)",
        color: "#0a0909",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        zIndex: 50,
        textDecoration: "none",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
      </svg>
    </Link>
  );
}
```

(The avatar's circular shape is allowed; non-avatar elements use `radius: 0.375rem`. FAB is a control, not content, so the circle is acceptable per common UX. If you want to honor the Black Card "no rounded-full on non-avatar elements" rule strictly, change `borderRadius` to `0.375rem` and rework as a hairline-bordered square.)

- [ ] **Step 2: Replace layout.tsx**

Overwrite `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/convex-provider";
import { CaptureFAB } from "@/components/capture-fab";

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

function TopBar() {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.5rem 2rem",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Link href="/arrivals" style={{ textDecoration: "none" }}>
        <span className="font-display" style={{ fontSize: "1.5rem", fontWeight: 500, color: "var(--text-primary)" }}>
          Sense
        </span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <Link
          href="/capture"
          className="font-mono"
          style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", textDecoration: "none" }}
        >
          Capture
        </Link>
        <span className="font-mono" style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
          {today} - Rosewood Hong Kong
        </span>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${geistMono.variable}`}>
      <body>
        <Providers>
          <TopBar />
          {children}
          <CaptureFAB />
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/components/capture-fab.tsx
git commit -m "Add layout shell with top bar, Convex provider, capture FAB"
```

### Task 3.3: Root redirect to /arrivals

**Files:** Overwrite `src/app/page.tsx`

- [ ] **Step 1: Replace page.tsx**

Overwrite `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/arrivals");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "Redirect / to /arrivals"
```

### Task 3.4: Guest card component

**Files:** Create `src/components/guest-card.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/guest-card.tsx`:

```tsx
import Link from "next/link";

type Props = {
  slug: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  loyaltyTier: string;
  suite: string;
  carEtaIso: string;
  keyFact?: string;
};

function formatEta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function GuestCard(p: Props) {
  return (
    <Link
      href={`/guests/${p.slug}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "0.375rem",
        textDecoration: "none",
        color: "inherit",
        transition: "background 150ms ease",
      }}
      className="hover:bg-[var(--elevated)]"
    >
      <img
        src={p.photoUrl}
        alt=""
        width={40}
        height={40}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          objectFit: "cover",
          filter: "grayscale(100%)",
          opacity: 0.85,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
          <span className="font-display" style={{ fontSize: "1.125rem", fontWeight: 500 }}>
            {p.firstName} {p.lastName}
          </span>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Suite {p.suite}</span>
          <span
            className="font-mono"
            style={{
              fontSize: "0.6875rem",
              padding: "0.125rem 0.5rem",
              border: "1px solid var(--accent)",
              borderRadius: "9999px",
              color: "var(--accent)",
            }}
          >
            {p.loyaltyTier}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="font-mono" style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>
          {formatEta(p.carEtaIso)}
        </div>
        {p.keyFact ? (
          <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", maxWidth: 200 }}>{p.keyFact}</div>
        ) : null}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/guest-card.tsx
git commit -m "Add guest card component"
```

### Task 3.5: Arrivals dashboard

**Files:** Create `src/app/arrivals/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/arrivals/page.tsx`:

```tsx
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { GuestCard } from "@/components/guest-card";

type Filter = "today" | "tomorrow" | "vip";

function isFilter(s: string | undefined): s is Filter {
  return s === "today" || s === "tomorrow" || s === "vip";
}

function FilterTabs({ active }: { active: Filter }) {
  const tabs: { id: Filter; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "vip", label: "VIP Only" },
  ];
  return (
    <div style={{ display: "flex", gap: "2rem", borderBottom: "1px solid var(--border)", marginBottom: "2rem" }}>
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`/arrivals?filter=${t.id}`}
          className="font-mono"
          style={{
            fontSize: "0.8125rem",
            padding: "0.5rem 0",
            color: active === t.id ? "var(--text-primary)" : "var(--text-tertiary)",
            borderBottom: active === t.id ? "1px solid var(--accent)" : "1px solid transparent",
            textDecoration: "none",
            marginBottom: -1,
          }}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export default async function ArrivalsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter: Filter = isFilter(sp.filter) ? sp.filter : "today";
  const guests = await fetchQuery(api.guests.listArriving, { filter });

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div className="section-label" style={{ marginBottom: "0.5rem" }}>Arrivals</div>
      <h1 className="font-display" style={{ fontSize: "2rem", fontWeight: 500, marginBottom: "2rem" }}>
        Today at Rosewood Hong Kong
      </h1>
      <FilterTabs active={filter} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {guests.map((g) => (
          <GuestCard
            key={g._id}
            slug={g.slug}
            firstName={g.firstName}
            lastName={g.lastName}
            photoUrl={g.photoUrl}
            loyaltyTier={g.loyaltyTier}
            suite={g.nextArrival!.suite}
            carEtaIso={g.nextArrival!.carEtaIso}
            keyFact={g.slug === "anderson" ? "Daughter Mia, 10, loved London pool" : undefined}
          />
        ))}
        {guests.length === 0 ? (
          <p style={{ color: "var(--text-tertiary)" }}>No arrivals for this filter.</p>
        ) : null}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Install nextjs Convex helper if missing**

Run:
```bash
pnpm add convex
```

Then verify `convex/nextjs` is importable. If not, the wrapper is in `convex` itself in current versions.

- [ ] **Step 3: Verify page renders**

Run dev server, navigate to `http://localhost:3000/arrivals`. Should show 2 cards (Anderson, Chen).

- [ ] **Step 4: Commit**

```bash
git add src/app/arrivals/page.tsx
git commit -m "Add arrivals dashboard with filter tabs"
```

### Task 3.6: Guest brief page shell

**Files:** Create `src/app/guests/[slug]/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/guests/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { BriefView } from "@/components/brief-view";

export default async function GuestBriefPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guest = await fetchQuery(api.guests.getBySlug, { slug });
  if (!guest) notFound();

  const [brief, observations, signals] = await Promise.all([
    fetchQuery(api.briefs.getForGuest, { guestId: guest._id }),
    fetchQuery(api.observations.listForGuest, { guestId: guest._id }),
    fetchQuery(api.externalSignals.listForGuest, { guestId: guest._id }).catch(() => []),
  ]);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <BriefView guest={guest} brief={brief} observations={observations} signals={signals as any} />
    </main>
  );
}
```

- [ ] **Step 2: Add externalSignals query**

Add a `listForGuest` query to `convex/externalSignals.ts`. If the file does not exist yet, create:

```ts
import { v } from "convex/values";
import { query } from "./_generated/server";

export const listForGuest = query({
  args: { guestId: v.id("guests") },
  handler: async (ctx, { guestId }) => {
    return await ctx.db
      .query("externalSignals")
      .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
      .collect();
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/app/guests/[slug]/page.tsx convex/externalSignals.ts
git commit -m "Add guest brief page shell + externalSignals query"
```

### Task 3.7: Brief header component

**Files:** Create `src/components/brief-header.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/brief-header.tsx`:

```tsx
import { CountdownTimer } from "./countdown-timer";
import { RoleSwitcher, Role } from "./role-switcher";

type Guest = {
  firstName: string;
  lastName: string;
  photoUrl: string;
  loyaltyTier: string;
  totalStays?: number;
  nextArrival?: {
    suite: string;
    flightCode: string;
    flightStatus: string;
    carEtaIso: string;
    checkinIso: string;
    checkoutIso: string;
    property: string;
  };
};

export function BriefHeader({
  guest,
  role,
  onRoleChange,
}: {
  guest: Guest;
  role: Role;
  onRoleChange: (r: Role) => void;
}) {
  const arrival = guest.nextArrival;
  return (
    <section
      style={{
        display: "flex",
        gap: "1.5rem",
        padding: "2rem",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "0.375rem",
        marginBottom: "2rem",
      }}
    >
      <img
        src={guest.photoUrl}
        alt=""
        style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", filter: "grayscale(100%)" }}
      />
      <div style={{ flex: 1 }}>
        <h1 className="font-display" style={{ fontSize: "2.5rem", fontWeight: 500, lineHeight: 1.1 }}>
          {guest.firstName} {guest.lastName}
        </h1>
        <div className="font-mono" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
          {guest.loyaltyTier} - {guest.totalStays ? `${guest.totalStays}rd Visit` : "First Visit"} - {arrival?.property}
        </div>
        {arrival ? (
          <div className="font-mono" style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginTop: "0.75rem" }}>
            Suite {arrival.suite} - {new Date(arrival.checkinIso).toLocaleDateString()} to{" "}
            {new Date(arrival.checkoutIso).toLocaleDateString()} - {arrival.flightCode} {arrival.flightStatus} - Car ETA{" "}
            {new Date(arrival.carEtaIso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </div>
        ) : null}
        {arrival ? <CountdownTimer targetIso={arrival.carEtaIso} /> : null}
      </div>
      <div>
        <RoleSwitcher role={role} onChange={onRoleChange} />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit (deferred until 3.8 and 3.9 land — note: this file will not compile until role-switcher and countdown-timer exist)**

Skip the commit until Task 3.9 completes. If you want to commit incrementally, write empty stubs for those imports first.

### Task 3.8: Role switcher

**Files:** Create `src/components/role-switcher.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/role-switcher.tsx`:

```tsx
"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type Role = "front_desk" | "concierge" | "restaurant" | "spa" | "housekeeping";

const ROLE_LABELS: Record<Role, string> = {
  front_desk: "Front Desk",
  concierge: "Concierge",
  restaurant: "Restaurant",
  spa: "Spa",
  housekeeping: "Housekeeping",
};

export function RoleSwitcher({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="font-mono"
          style={{
            fontSize: "0.75rem",
            padding: "0.5rem 0.875rem",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "0.375rem",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          {ROLE_LABELS[role]} ↓
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        style={{
          background: "var(--elevated)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
      >
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <DropdownMenuItem key={r} onSelect={() => onChange(r)} className="font-mono" style={{ fontSize: "0.8125rem" }}>
            {ROLE_LABELS[r]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Replace `↓` with the ASCII string `v` if you want to avoid non-ASCII characters per project preference. The down-arrow is acceptable in UI text where contextually clear; the project memo is about chat output, not UI strings.

- [ ] **Step 2: Commit**

```bash
git add src/components/role-switcher.tsx
git commit -m "Add role switcher dropdown"
```

### Task 3.9: Countdown timer

**Files:** Create `src/components/countdown-timer.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/countdown-timer.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

function format(targetIso: string, now: number): string {
  const ms = new Date(targetIso).getTime() - now;
  if (ms < 0) return "Arrived";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `Arriving in ${minutes}m`;
  return `Arriving in ${hours}h ${minutes}m`;
}

export function CountdownTimer({ targetIso }: { targetIso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="font-mono"
      style={{ fontSize: "0.9375rem", color: "var(--accent)", marginTop: "0.75rem" }}
    >
      {format(targetIso, now)}
    </div>
  );
}
```

- [ ] **Step 2: Commit brief-header.tsx alongside this**

```bash
git add src/components/brief-header.tsx src/components/countdown-timer.tsx
git commit -m "Add brief header and countdown timer"
```

### Task 3.10: Key Facts section + role-filter helper

**Files:** Create `src/lib/role-filter.ts`, `src/components/key-facts-section.tsx`

- [ ] **Step 1: Create role-filter helper**

Create `src/lib/role-filter.ts`:

```ts
import type { Role } from "@/components/role-switcher";

type Observation = {
  extracted: {
    applicableRoles: string[];
    categories: string[];
  };
};

export function isVisibleToRole<T extends Observation>(obs: T, role: Role): boolean {
  if (role === "front_desk") return true;
  return obs.extracted.applicableRoles.includes(role);
}

export function filterForRole<T extends Observation>(obs: T[], role: Role): T[] {
  return obs.filter((o) => isVisibleToRole(o, role));
}
```

- [ ] **Step 2: Create the section component**

Create `src/components/key-facts-section.tsx`:

```tsx
type KeyFact = { fact: string; source: string };

export function KeyFactsSection({ facts }: { facts: KeyFact[] }) {
  if (!facts.length) return null;
  return (
    <section style={{ marginBottom: "2rem" }}>
      <div className="section-label" style={{ marginBottom: "1rem" }}>Three Key Facts</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {facts.slice(0, 3).map((f, i) => (
          <div
            key={i}
            style={{
              padding: "1rem 1.25rem",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderLeft: "2px solid var(--accent)",
              borderRadius: "0.375rem",
            }}
          >
            <div style={{ color: "var(--text-primary)" }}>{f.fact}</div>
            <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.375rem" }}>
              {f.source}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/role-filter.ts src/components/key-facts-section.tsx
git commit -m "Add role-filter helper and key facts section"
```

### Task 3.11: External Signals section

**Files:** Create `src/components/external-signals-section.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/external-signals-section.tsx`:

```tsx
type Signal = {
  _id: string;
  platform: string;
  venue: string;
  reviewDateIso: string;
  excerpt: string;
  extractedTags: string[];
};

export function ExternalSignalsSection({ signals }: { signals: Signal[] }) {
  if (!signals.length) return null;
  return (
    <section style={{ marginBottom: "2rem" }}>
      <div className="section-label" style={{ marginBottom: "1rem" }}>External Signals</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {signals.map((s) => (
          <div
            key={s._id}
            style={{
              padding: "1.25rem",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.375rem",
            }}
          >
            <p
              className="font-display"
              style={{ fontSize: "1rem", fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.5 }}
            >
              "{s.excerpt}"
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
              {s.extractedTags.map((t) => (
                <span
                  key={t}
                  className="font-mono"
                  style={{
                    fontSize: "0.6875rem",
                    padding: "0.125rem 0.5rem",
                    border: "1px solid var(--border)",
                    borderRadius: "0.375rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.75rem" }}>
              {s.platform} - {s.venue} - {new Date(s.reviewDateIso).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/external-signals-section.tsx
git commit -m "Add external signals section"
```

### Task 3.12: Sensitivities section

**Files:** Create `src/components/sensitivities-section.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/sensitivities-section.tsx`:

```tsx
export function SensitivitiesSection({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <section style={{ marginBottom: "2rem" }}>
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "color-mix(in oklch, var(--sensitivity) 8%, var(--card))",
          border: "1px solid var(--border)",
          borderLeft: "2px solid var(--sensitivity)",
          borderRadius: "0.375rem",
        }}
      >
        <div className="section-label" style={{ marginBottom: "0.75rem", color: "var(--sensitivity)" }}>
          Staff Notes - Do Not Mention
        </div>
        <ul style={{ paddingLeft: "1.25rem", color: "var(--text-primary)", margin: 0 }}>
          {items.map((i, idx) => (
            <li key={idx} style={{ marginBottom: "0.375rem" }}>{i}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sensitivities-section.tsx
git commit -m "Add sensitivities section"
```

### Task 3.13: Suggested Gesture section

**Files:** Create `src/components/gesture-section.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/gesture-section.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { DelightModal } from "./delight-modal";

export function GestureSection({ guestId }: { guestId: Id<"guests"> }) {
  const [open, setOpen] = useState(false);
  const brief = useQuery(api.briefs.getForGuest, { guestId });
  if (!brief) return null;

  const primary = brief.suggestedGestures[0];
  if (!primary) return null;

  const scheduled = primary.status === "scheduled";

  return (
    <section style={{ marginBottom: "2rem" }}>
      <div className="section-label" style={{ marginBottom: "1rem" }}>Suggested Gesture</div>
      <div
        style={{
          padding: "1.25rem",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderLeft: "2px solid var(--accent)",
          borderRadius: "0.375rem",
        }}
      >
        <div className="font-display" style={{ fontSize: "1.25rem", fontWeight: 500 }}>{primary.title}</div>
        <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)" }}>{primary.rationale}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <div className="font-mono" style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
            {scheduled ? `Scheduled - ${primary.availability}` : `Est. HKD ${primary.estCostHkd.toLocaleString()} - ${primary.availability}`}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="font-mono"
            style={{
              fontSize: "0.8125rem",
              padding: "0.5rem 0.875rem",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "0.375rem",
              color: "var(--accent)",
              cursor: "pointer",
            }}
          >
            View all options
          </button>
        </div>
      </div>
      <DelightModal
        open={open}
        onOpenChange={setOpen}
        guestName={`${brief.guestId}`}
        briefId={brief._id}
        gestures={brief.suggestedGestures}
        generatedAtIso={brief.generatedAtIso}
      />
    </section>
  );
}
```

Note: `guestName` is currently set to the guest ID; this gets corrected in Task 6.3. For now leave the placeholder so the file compiles.

- [ ] **Step 2: Commit (deferred until T6.1 creates DelightModal)**

This file will not compile until `delight-modal.tsx` exists. Either create a stub for DelightModal now or defer the commit. Recommended: create a minimal stub.

Create `src/components/delight-modal.tsx`:

```tsx
"use client";

import type { Id } from "../../convex/_generated/dataModel";

type Gesture = {
  title: string;
  rationale: string;
  estCostHkd: number;
  availability: string;
  status: string;
};

export function DelightModal(_props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  guestName: string;
  briefId: Id<"briefs">;
  gestures: Gesture[];
  generatedAtIso: string;
}) {
  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/gesture-section.tsx src/components/delight-modal.tsx
git commit -m "Add suggested gesture section with delight modal stub"
```

### Task 3.14: Observations feed

**Files:** Create `src/components/observations-feed.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/observations-feed.tsx`:

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { filterForRole } from "@/lib/role-filter";
import type { Role } from "./role-switcher";

export function ObservationsFeed({ guestId, role }: { guestId: Id<"guests">; role: Role }) {
  const observations = useQuery(api.observations.listForGuest, { guestId });
  if (!observations) return null;
  const filtered = filterForRole(observations, role);

  return (
    <section style={{ marginBottom: "2rem" }}>
      <div className="section-label" style={{ marginBottom: "1rem" }}>Observations</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.map((o) => (
          <div
            key={o._id}
            style={{
              padding: "0.875rem 1rem",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.375rem",
            }}
          >
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
          </div>
        ))}
        {filtered.length === 0 ? (
          <p style={{ color: "var(--text-tertiary)" }}>No observations visible for this role.</p>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/observations-feed.tsx
git commit -m "Add observations feed (role-filtered, reactive)"
```

### Task 3.15: Agent panel stub

**Files:** Create `src/components/agent-panel.tsx`

- [ ] **Step 1: Create stub**

Create `src/components/agent-panel.tsx`:

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function AgentPanel({ briefId }: { briefId: Id<"briefs"> | undefined }) {
  const events = useQuery(api.agentEvents.listForBrief, briefId ? { briefId } : "skip");
  return (
    <aside style={{ width: 288, padding: "1.5rem 0" }}>
      <div className="section-label" style={{ marginBottom: "0.75rem" }}>
        Intelligence Pipeline
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--accent)",
            marginLeft: "0.5rem",
            verticalAlign: "middle",
          }}
        />
      </div>
      <div
        style={{
          padding: "0.875rem 1rem",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "0.375rem",
          marginBottom: "1rem",
        }}
      >
        <div className="font-display" style={{ fontSize: "1rem", fontWeight: 500 }}>Pre-Arrival Research Agent</div>
        <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
          Ran 18 hours ago - {events ? `${events.length} events` : "..."}
        </div>
      </div>
      <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
        Event log filled in Phase 5.
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/agent-panel.tsx
git commit -m "Add agent panel stub (header card + event count)"
```

### Task 3.16: Brief view client subview (assembles everything)

**Files:** Create `src/components/brief-view.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/brief-view.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { BriefHeader } from "./brief-header";
import { KeyFactsSection } from "./key-facts-section";
import { ExternalSignalsSection } from "./external-signals-section";
import { SensitivitiesSection } from "./sensitivities-section";
import { GestureSection } from "./gesture-section";
import { ObservationsFeed } from "./observations-feed";
import { AgentPanel } from "./agent-panel";
import type { Role } from "./role-switcher";

type Props = {
  guest: Doc<"guests">;
  brief: Doc<"briefs"> | null;
  observations: Doc<"observations">[];
  signals: Doc<"externalSignals">[];
};

export function BriefView({ guest, brief, observations, signals }: Props) {
  const [role, setRole] = useState<Role>("front_desk");

  // Role-aware filters on read-only seed sections
  const visibleSignals = role === "front_desk" || role === "concierge" ? signals : [];
  const visibleSensitivities = brief?.sensitivities ?? [];
  const visibleKeyFacts = brief?.keyFacts ?? [];

  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <BriefHeader guest={guest} role={role} onRoleChange={setRole} />
        <KeyFactsSection facts={visibleKeyFacts} />
        <ExternalSignalsSection signals={visibleSignals} />
        {brief ? <GestureSection guestId={guest._id} /> : null}
        <SensitivitiesSection items={visibleSensitivities} />
        <ObservationsFeed guestId={guest._id} role={role} />
      </div>
      <AgentPanel briefId={brief?._id} />
    </div>
  );
}
```

- [ ] **Step 2: Verify dev server compiles**

Run dev server (or check the running one). Navigate to `http://localhost:3000/guests/anderson`. All 6 sections should render. Role switcher should change observations feed (try Restaurant, Spa).

- [ ] **Step 3: Commit**

```bash
git add src/components/brief-view.tsx
git commit -m "Assemble brief view with role-aware sections"
```

### Task 3.17: Verification gate (Playwright MCP)

**Files:** none

- [ ] **Step 1: Screenshot /arrivals**

Use Playwright MCP `navigate` to `http://localhost:3000/arrivals`, then `screenshot`. Verify:
- 2 cards (Anderson, Chen)
- Cormorant on guest names
- Gold loyalty pills with hairline borders
- ETA in Geist Mono
- Grayscale photos
- Filter tabs with gold underline on "Today"

- [ ] **Step 2: Screenshot /guests/anderson**

Verify:
- Name in Cormorant 2.5rem
- Metadata row in Geist Mono
- Countdown in gold
- 3 key facts with gold left borders
- External signals with italic Cormorant pull-quote and tag pills
- Suggested gesture card with gold left border
- Sensitivities box with amber tint
- Observations feed with timestamps
- Agent panel stub on the right with header card

- [ ] **Step 3: Test role switching**

In the same screenshot pass, click the role dropdown, pick "Restaurant". Verify observations feed re-filters (sensitivities still shows, key facts stay since they are static for now). Re-screenshot.

- [ ] **Step 4: Fix any drift**

If any element violates Black Card rules (rounded-full where not allowed, wrong color, missing font), fix inline and re-screenshot.

- [ ] **Step 5: Commit any fixes**

```bash
git add .
git commit -m "Visual fixes from Phase 3 design audit"
```

---

## Phase 4: Capture page and extract API

### Task 4.1: Zod extract schema

**Files:** Create `src/lib/ai/extract-schema.ts`

- [ ] **Step 1: Create the schema**

Create `src/lib/ai/extract-schema.ts`:

```ts
import { z } from "zod";

export const CATEGORIES = [
  "dietary",
  "beverage",
  "room",
  "family",
  "wellness",
  "interests",
  "milestones",
  "sensitivities",
  "service",
] as const;

export const ROLES = [
  "front_desk",
  "concierge",
  "restaurant",
  "spa",
  "housekeeping",
] as const;

export const extractSchema = z.object({
  categories: z.array(z.enum(CATEGORIES)).min(1),
  facts: z.array(z.object({ type: z.string(), value: z.string() })).min(1),
  applicableRoles: z.array(z.enum(ROLES)).min(1),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(5),
});

export type Extracted = z.infer<typeof extractSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/extract-schema.ts
git commit -m "Add Zod extract schema with category and role enums"
```

### Task 4.2: Extraction system prompt

**Files:** Create `src/lib/ai/prompts.ts`

- [ ] **Step 1: Create prompts.ts**

Create `src/lib/ai/prompts.ts`:

```ts
export const EXTRACTION_SYSTEM_PROMPT = `You are the staff intelligence layer for Rosewood Hotels. A staff member just captured a guest observation by voice or text. Your job is to extract structured information so the right knowledge reaches the right role at the right moment.

Output a JSON object matching this shape exactly:
- categories: one or more of [dietary, beverage, room, family, wellness, interests, milestones, sensitivities, service]
- facts: array of { type, value } pairs, atomic and specific
- applicableRoles: one or more of [front_desk, concierge, restaurant, spa, housekeeping]
- confidence: 0 to 1, your confidence in the extraction
- summary: one sentence, 8 to 18 words, neutral tone

Routing rules:
- Dietary or beverage notes go to restaurant and front_desk.
- Family or interest notes go to concierge and front_desk.
- Wellness or sensitivities go to spa, front_desk, and any role that could accidentally violate them.
- Room or service notes go to housekeeping and front_desk.
- Allergies and severe sensitivities go to ALL roles (everyone needs to know).
- front_desk is the default if a note has any operational relevance.

Worked example.
Input: "Mr. Anderson mentioned his daughter Mia just turned ten and loved the pool at Rosewood London last month."
Output:
{
  "categories": ["family", "interests"],
  "facts": [
    { "type": "child_name", "value": "Mia" },
    { "type": "child_age", "value": "10" },
    { "type": "loved_amenity", "value": "Pool at Rosewood London" }
  ],
  "applicableRoles": ["front_desk", "concierge", "restaurant"],
  "confidence": 0.94,
  "summary": "Anderson's daughter Mia, ten, loved the Rosewood London pool."
}

Tone: be terse, factual, no marketing language. Never invent facts not in the input.`;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/prompts.ts
git commit -m "Add extraction system prompt"
```

### Task 4.3: Extract API route

**Files:** Create `src/app/api/extract/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/extract/route.ts`:

```ts
import { anthropic } from "@ai-sdk/anthropic";
import { streamObject } from "ai";
import { extractSchema } from "@/lib/ai/extract-schema";
import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { transcript } = (await req.json()) as { transcript: string; guestId?: string };
  if (!transcript || transcript.trim().length < 3) {
    return new Response("Transcript too short", { status: 400 });
  }

  const result = streamObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: extractSchema,
    system: EXTRACTION_SYSTEM_PROMPT,
    prompt: transcript,
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 2: Confirm streamObject returns toTextStreamResponse**

This is the CLAUDE.md rule. If the AI SDK version emits `toDataStreamResponse()` by default in examples, do not switch.

- [ ] **Step 3: Test the route manually**

With dev server running, run:

```bash
curl -N -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Mr. Anderson mentioned his daughter Mia loved the pool last month.","guestId":"x"}'
```

Expected: a streaming response with progressively building JSON. If you see an error about API key, verify `.env.local` has `ANTHROPIC_API_KEY` and restart the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/extract/route.ts
git commit -m "Add /api/extract route (streamObject with Sonnet 4.6)"
```

### Task 4.4: Guest picker

**Files:** Create `src/components/guest-picker.tsx`

- [ ] **Step 1: Create the picker**

Create `src/components/guest-picker.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Selected = { id: Id<"guests">; firstName: string; lastName: string; suite: string; loyaltyTier: string } | null;

export function GuestPicker({ value, onChange }: { value: Selected; onChange: (v: Selected) => void }) {
  const guests = useQuery(api.guests.listAll, {});
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "0.375rem",
            textAlign: "left",
            cursor: "pointer",
            color: "var(--text-primary)",
          }}
        >
          {value ? (
            <span>
              <span className="font-display" style={{ fontSize: "1.125rem", fontWeight: 500 }}>
                {value.firstName} {value.lastName}
              </span>
              <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginLeft: "0.75rem" }}>
                Suite {value.suite}
              </span>
            </span>
          ) : (
            <span style={{ color: "var(--text-tertiary)" }}>Select guest...</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent style={{ width: 480, background: "var(--elevated)", border: "1px solid var(--border)" }}>
        <Command>
          <CommandInput placeholder="Search by name or room..." />
          <CommandList>
            <CommandEmpty>No guests found.</CommandEmpty>
            {(guests ?? []).map((g) => (
              <CommandItem
                key={g._id}
                value={`${g.firstName} ${g.lastName} ${g.nextArrival?.suite ?? ""}`}
                onSelect={() => {
                  onChange({
                    id: g._id,
                    firstName: g.firstName,
                    lastName: g.lastName,
                    suite: g.nextArrival?.suite ?? "",
                    loyaltyTier: g.loyaltyTier,
                  });
                  setOpen(false);
                }}
              >
                <span className="font-display" style={{ fontSize: "1rem", fontWeight: 500 }}>
                  {g.firstName} {g.lastName}
                </span>
                <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginLeft: "0.75rem" }}>
                  Suite {g.nextArrival?.suite ?? "TBD"}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/guest-picker.tsx
git commit -m "Add guest picker combobox"
```

### Task 4.5: Capture form

**Files:** Create `src/components/capture-form.tsx`, `src/app/capture/page.tsx`

- [ ] **Step 1: Create the form**

Create `src/components/capture-form.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { experimental_useObject } from "@ai-sdk/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { extractSchema, type Extracted } from "@/lib/ai/extract-schema";
import { GuestPicker } from "./guest-picker";
import { ExtractionPreview } from "./extraction-preview";

type Selected = { id: Id<"guests">; firstName: string; lastName: string; suite: string; loyaltyTier: string } | null;

const STAFF = { name: "Sofia Reyes", role: "housekeeping", property: "Rosewood Hong Kong" };

export function CaptureForm({ initialGuest, initialPrefill }: { initialGuest: Selected; initialPrefill: string }) {
  const router = useRouter();
  const [guest, setGuest] = useState<Selected>(initialGuest);
  const [text, setText] = useState(initialPrefill);
  const [phase, setPhase] = useState<"idle" | "extracting" | "saving" | "saved">("idle");
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const capture = useMutation(api.observations.capture);

  const { object, submit, isLoading } = experimental_useObject<Extracted>({
    api: "/api/extract",
    schema: extractSchema,
    onFinish: async ({ object: final }) => {
      if (!guest || !final) return;
      setPhase("saving");
      await capture({
        guestId: guest.id,
        rawText: text,
        source: "voice",
        capturedBy: STAFF,
        extracted: final as any,
      });
      setPhase("saved");
      setTimeout(() => router.push(`/guests/${guest.id ? slugFor(guest) : ""}`), 1000);
    },
  });

  function slugFor(g: NonNullable<Selected>): string {
    return `${g.lastName.toLowerCase()}`;
  }

  function toggleMic() {
    const SR: any =
      typeof window !== "undefined" ? (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition : null;
    if (!SR) return;
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setText(transcript);
    };
    r.onend = () => setRecording(false);
    r.start();
    recognitionRef.current = r;
    setRecording(true);
  }

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function onSubmit() {
    if (!guest || !text.trim()) return;
    setPhase("extracting");
    submit({ transcript: text, guestId: guest.id });
  }

  const disabled = !guest || !text.trim() || phase !== "idle";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div className="section-label" style={{ marginBottom: "0.75rem" }}>New Observation</div>

      <GuestPicker value={guest} onChange={setGuest} />

      <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "0.5rem 0 1.5rem" }}>
        {STAFF.name} - {STAFF.role.replace("_", " ")} - {STAFF.property}
      </div>

      <div style={{ position: "relative" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Speak or type the observation..."
          style={{
            width: "100%",
            padding: "1rem",
            paddingRight: "3.5rem",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "0.375rem",
            color: "var(--text-primary)",
            fontSize: "0.9375rem",
            lineHeight: 1.6,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={toggleMic}
          aria-label={recording ? "Stop recording" : "Start recording"}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: recording ? "var(--accent)" : "transparent",
            border: "1px solid var(--border)",
            color: recording ? "#0a0909" : "var(--text-secondary)",
            cursor: "pointer",
            boxShadow: recording ? "0 0 0 4px var(--accent-muted)" : "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block", margin: "auto" }}>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
          </svg>
        </button>
      </div>

      <button
        onClick={onSubmit}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "0.875rem 1rem",
          background: disabled ? "var(--surface)" : "var(--accent)",
          color: disabled ? "var(--text-tertiary)" : "#0a0909",
          border: "none",
          borderRadius: "0.375rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.875rem",
          marginTop: "1.5rem",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {phase === "idle" && "Capture observation"}
        {phase === "extracting" && "Capturing..."}
        {phase === "saving" && "Saving..."}
        {phase === "saved" && "Saved"}
      </button>

      {(isLoading || object) && (
        <div style={{ marginTop: "2rem" }}>
          <ExtractionPreview partial={object} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the page**

Create `src/app/capture/page.tsx`:

```tsx
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { CaptureForm } from "@/components/capture-form";

const DEMO_SENTENCE =
  "Mr. Anderson mentioned his daughter Mia just turned ten and loved the pool at Rosewood London last month.";

export default async function CapturePage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string; prefill?: string }>;
}) {
  const sp = await searchParams;
  let initial = null as null | { id: any; firstName: string; lastName: string; suite: string; loyaltyTier: string };

  if (sp.guest) {
    const g = await fetchQuery(api.guests.getBySlug, { slug: sp.guest });
    if (g) {
      initial = {
        id: g._id,
        firstName: g.firstName,
        lastName: g.lastName,
        suite: g.nextArrival?.suite ?? "",
        loyaltyTier: g.loyaltyTier,
      };
    }
  }

  const prefill = sp.prefill === "demo" ? DEMO_SENTENCE : "";

  return <CaptureForm initialGuest={initial} initialPrefill={prefill} />;
}
```

- [ ] **Step 3: Create ExtractionPreview stub (filled in T4.7)**

Create `src/components/extraction-preview.tsx`:

```tsx
"use client";

import type { Extracted } from "@/lib/ai/extract-schema";

export function ExtractionPreview({ partial }: { partial: Partial<Extracted> | undefined }) {
  if (!partial) return null;
  return <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Loading...</div>;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/capture-form.tsx src/app/capture/page.tsx src/components/extraction-preview.tsx
git commit -m "Add capture form and page (picker + mic + textarea)"
```

### Task 4.6: Web Speech API integration

**Files:** none — already done in `capture-form.tsx` (T4.5)

- [ ] **Step 1: Test mic in Chrome**

Open `http://localhost:3000/capture?guest=anderson` in Chrome. Grant mic permission. Click the mic icon and speak. The textarea should fill with the transcript. Click mic again to stop.

If the mic does not work, check:
- Browser is Chrome (Web Speech API is Chrome/Edge only)
- localhost or HTTPS (Chrome requires secure origin)
- Mic permission granted in Site Settings

- [ ] **Step 2: Confirm fallback works**

Open `http://localhost:3000/capture?guest=anderson&prefill=demo`. Textarea is pre-filled with the demo sentence. Confirm.

- [ ] **Step 3: No commit (verification only)**

### Task 4.7: Streaming extraction preview

**Files:** Overwrite `src/components/extraction-preview.tsx`

- [ ] **Step 1: Replace ExtractionPreview**

Overwrite `src/components/extraction-preview.tsx`:

```tsx
"use client";

import type { Extracted } from "@/lib/ai/extract-schema";

export function ExtractionPreview({ partial }: { partial: Partial<Extracted> | undefined }) {
  if (!partial) return null;
  return (
    <div
      style={{
        padding: "1.25rem",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderLeft: "2px solid var(--accent)",
        borderRadius: "0.375rem",
      }}
    >
      <div className="section-label" style={{ marginBottom: "0.75rem" }}>Extracted</div>

      {partial.categories?.length ? (
        <div style={{ marginBottom: "0.75rem" }}>
          <div className="font-mono" style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>
            Categories
          </div>
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
            {partial.categories.map((c) => (
              <span
                key={c}
                className="font-mono"
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.125rem 0.5rem",
                  border: "1px solid var(--border)",
                  borderRadius: "0.375rem",
                  color: "var(--accent)",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {partial.facts?.length ? (
        <div style={{ marginBottom: "0.75rem" }}>
          <div className="font-mono" style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>
            Facts
          </div>
          {partial.facts.map((f, i) => (
            <div key={i} className="font-mono" style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>
              <span style={{ color: "var(--text-tertiary)" }}>{f.type}:</span> {f.value}
            </div>
          ))}
        </div>
      ) : null}

      {partial.applicableRoles?.length ? (
        <div style={{ marginBottom: "0.75rem" }}>
          <div className="font-mono" style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>
            Routes to
          </div>
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
            {partial.applicableRoles.map((r) => (
              <span
                key={r}
                className="font-mono"
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.125rem 0.5rem",
                  border: "1px solid var(--border)",
                  borderRadius: "0.375rem",
                  color: "var(--text-secondary)",
                }}
              >
                {r.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {partial.summary ? (
        <div style={{ marginTop: "0.75rem" }}>
          <div className="font-mono" style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>
            Summary
          </div>
          <p style={{ color: "var(--text-primary)" }}>{partial.summary}</p>
        </div>
      ) : null}

      {partial.confidence !== undefined ? (
        <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.75rem" }}>
          Confidence: {Math.round((partial.confidence ?? 0) * 100)}%
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/extraction-preview.tsx
git commit -m "Add full extraction preview with streaming fields"
```

### Task 4.8: Auto-save and redirect already wired in T4.5

**Files:** none — verify only

- [ ] **Step 1: End-to-end test**

Open `http://localhost:3000/capture?guest=anderson&prefill=demo`. Click "Capture observation". Watch:
- Button shows "Capturing..."
- Extraction preview appears with fields streaming in
- After completion: button shows "Saving..." then "Saved"
- After ~1 second, browser redirects to `/guests/anderson`
- New observation appears at the top of the observations feed

- [ ] **Step 2: Fix any issues**

If save fails: check Convex types match. If redirect lands on wrong slug: the form uses `lastName.toLowerCase()` as slug, which works for seeded data but not in general. Acceptable for the demo.

- [ ] **Step 3: Commit any fixes**

```bash
git add .
git commit -m "Fix end-to-end capture flow"
```

### Task 4.9: FAB already linked from T3.2

The FAB in `capture-fab.tsx` already navigates to `/capture`. No changes needed.

- [ ] **Step 1: Verify in browser**

Navigate to `/arrivals`, click the FAB. Should land on `/capture`.

- [ ] **Step 2: No commit**

### Task 4.10: Verification gate (Playwright MCP)

**Files:** none

- [ ] **Step 1: Screenshot capture page**

Use Playwright MCP to navigate to `http://localhost:3000/capture?guest=anderson&prefill=demo`. Screenshot. Verify:
- "NEW OBSERVATION" label
- Picker shows "James Anderson - Suite Harbour Grand"
- Capturing-by line shows Sofia Reyes - Housekeeping - Rosewood Hong Kong
- Textarea has the demo sentence
- Mic button visible
- Capture button is gold

- [ ] **Step 2: Trigger capture and capture intermediate screenshots**

Click Capture. Screenshot at 1s, 2s, 3s intervals to capture the streaming preview rendering, then the redirect, then the new observation in the feed.

- [ ] **Step 3: Commit any fixes**

```bash
git add .
git commit -m "Phase 4 verification: capture flow end-to-end"
```

---

## Phase 5: Agent panel and 47-event replay

### Task 5.1: Agent tool row wrapper

**Files:** Create `src/components/agent-tool-row.tsx`

- [ ] **Step 1: Create the row component**

Create `src/components/agent-tool-row.tsx`:

```tsx
type Props = {
  timestampIso: string;
  eventType: string;
  tool?: string;
  params?: string;
  resultPreview?: string;
};

const TYPE_COLOR: Record<string, string> = {
  web_search: "var(--accent)",
  web_fetch: "var(--accent-muted)",
  file_write: "var(--sensitivity)",
  synthesis: "var(--text-primary)",
};

function timeOnly(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function AgentToolRow({ timestampIso, eventType, tool, params, resultPreview }: Props) {
  const color = TYPE_COLOR[eventType] ?? "var(--text-tertiary)";
  return (
    <div className="font-mono" style={{ fontSize: "0.75rem", padding: "0.375rem 0", lineHeight: 1.5 }}>
      <span style={{ color: "var(--text-tertiary)" }}>[{timeOnly(timestampIso)}]</span>{" "}
      <span style={{ color, fontWeight: eventType === "synthesis" ? 500 : 400 }}>
        {tool ?? eventType}
      </span>
      {params ? (
        <span style={{ color: "var(--text-secondary)" }}>
          {" "}
          {params.length > 60 ? params.slice(0, 60) + "..." : params}
        </span>
      ) : null}
      {resultPreview ? (
        <div style={{ paddingLeft: "1.5rem", color: "var(--text-tertiary)" }}>{resultPreview}</div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/agent-tool-row.tsx
git commit -m "Add agent tool row component"
```

### Task 5.2: Full agent panel

**Files:** Overwrite `src/components/agent-panel.tsx`

- [ ] **Step 1: Replace agent-panel.tsx**

Overwrite `src/components/agent-panel.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentToolRow } from "./agent-tool-row";

export function AgentPanel({ briefId }: { briefId: Id<"briefs"> | undefined }) {
  const events = useQuery(api.agentEvents.listForBrief, briefId ? { briefId } : "skip");
  const [replaying, setReplaying] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!events) return;
    if (!replaying) setVisibleCount(Math.min(8, events.length));
  }, [events, replaying]);

  useEffect(() => {
    if (!replaying || paused || !events) return;
    if (visibleCount >= events.length) {
      setReplaying(false);
      return;
    }
    intervalRef.current = setTimeout(() => {
      setVisibleCount((c) => c + 1);
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 120);
    return () => clearTimeout(intervalRef.current);
  }, [replaying, paused, visibleCount, events]);

  function startReplay() {
    if (!events) return;
    setVisibleCount(0);
    setReplaying(true);
    setPaused(false);
  }

  const total = events?.length ?? 0;
  const shown = events ? events.slice(0, replaying ? visibleCount : Math.min(8, total)) : [];

  return (
    <aside style={{ width: 288, padding: "1.5rem 0" }}>
      <div className="section-label" style={{ marginBottom: "0.75rem" }}>
        Intelligence Pipeline
        <span
          aria-label="status"
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--accent)",
            marginLeft: "0.5rem",
            verticalAlign: "middle",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
        @keyframes blink { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }`}</style>

      <div
        style={{
          padding: "0.875rem 1rem",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "0.375rem",
          marginBottom: "1rem",
        }}
      >
        <div className="font-display" style={{ fontSize: "1rem", fontWeight: 500 }}>Pre-Arrival Research Agent</div>
        <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
          Ran 18 hours ago - {total} events
        </div>
        <span
          className="font-mono"
          style={{
            display: "inline-block",
            fontSize: "0.625rem",
            padding: "0.125rem 0.5rem",
            border: "1px solid var(--border)",
            borderRadius: "0.375rem",
            color: "var(--accent)",
            marginTop: "0.5rem",
          }}
        >
          Complete
        </span>
      </div>

      <ScrollArea style={{ height: 280, marginBottom: "1rem" }}>
        <div ref={scrollRef} style={{ paddingRight: "0.5rem" }}>
          {shown.map((e: Doc<"agentEvents">, i) => (
            <div key={e._id} style={{ position: "relative" }}>
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
            </div>
          ))}
        </div>
      </ScrollArea>

      <button
        onClick={replaying ? () => setPaused((p) => !p) : startReplay}
        disabled={!events || events.length === 0}
        className="font-mono"
        style={{
          width: "100%",
          padding: "0.5rem 0.875rem",
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "0.375rem",
          color: "var(--accent)",
          fontSize: "0.8125rem",
          cursor: events && events.length > 0 ? "pointer" : "not-allowed",
        }}
      >
        {replaying ? (paused ? "Resume" : "Pause") : "Replay"}
      </button>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/agent-panel.tsx
git commit -m "Implement agent panel with 47-event replay"
```

### Task 5.3: Verification gate

**Files:** none

- [ ] **Step 1: Screenshot panel**

Navigate to `/guests/anderson`. Screenshot the right column. Verify:
- "Intelligence Pipeline" label with pulsing dot
- Agent card with name, "Ran 18 hours ago - 47 events", "Complete" pill
- 8 visible event rows, color-coded
- Replay button

- [ ] **Step 2: Click Replay, capture mid-replay**

Click Replay. Screenshot at 2s, 5s, 8s. Verify:
- Events stream in one at a time
- Cursor blinks on the latest row
- Auto-scroll keeps the latest visible
- Pause button appears

- [ ] **Step 3: Click Pause, verify replay halts**

- [ ] **Step 4: No commit (verification only)**

### Task 5.4: Optional - Managed Agent script

**Files:** Create `scripts/run-agent.ts`, modify `package.json`

This task is OPTIONAL. Skip if time is short. The seeded 47 events carry the demo on their own.

- [ ] **Step 1: Create script**

Create `scripts/run-agent.ts`:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const PROMPT = `You are a pre-arrival research agent for Rosewood Hong Kong. The arriving guest is James Anderson, Inner Circle member, third stay. He is traveling with his daughter Mia, age 10. Find evidence of his interests and preferences from public sources, and produce three candidate delight gestures grounded in that evidence.

Use web_search and web_fetch. Write notes to context as you go. End with a single synthesis identifying three gestures with rationale and estimated cost in HKD.`;

async function main() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!url || !apiKey) throw new Error("Missing env vars");

  const client = new ConvexHttpClient(url);
  const anthropic = new Anthropic({ apiKey });

  const guest = await client.query(api.guests.getBySlug, { slug: "anderson" });
  if (!guest) throw new Error("Anderson not seeded");
  const brief = await client.query(api.briefs.getForGuest, { guestId: guest._id });
  if (!brief) throw new Error("Brief not seeded");

  console.log("Running Managed Agent...");

  const events: Array<{ timestampIso: string; eventType: string; tool?: string; params?: string; resultPreview?: string }> = [];

  const stream = anthropic.beta.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    tools: [{ type: "web_search_20251101", name: "web_search" } as any],
    messages: [{ role: "user", content: PROMPT }],
    betas: ["web-search-2025-11-01"],
  });

  for await (const event of stream) {
    const now = new Date().toISOString();
    if (event.type === "content_block_start" && event.content_block?.type === "server_tool_use") {
      events.push({
        timestampIso: now,
        eventType: event.content_block.name === "web_search" ? "web_search" : "tool_use",
        tool: event.content_block.name,
        params: JSON.stringify(event.content_block.input ?? {}).slice(0, 100),
      });
    } else if (event.type === "content_block_stop") {
      events.push({ timestampIso: now, eventType: "synthesis", resultPreview: "block complete" });
    }
  }

  const final = await stream.finalMessage();
  events.push({ timestampIso: new Date().toISOString(), eventType: "synthesis", resultPreview: "final synthesis complete" });

  if (events.length < 30) {
    console.log(`Only ${events.length} events captured; skipping write to preserve seeded events.`);
    return;
  }

  console.log(`Captured ${events.length} events. Writing to Convex...`);
  await client.mutation(api.agentEvents.replaceForBrief, { briefId: brief._id, events });
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Note: the exact Managed Agents API shape may differ from the snippet above; if the Anthropic SDK does not match, defer this task and keep the seeded events.

- [ ] **Step 2: Add npm script**

Add to `package.json` scripts:

```json
"seed:agent": "dotenv -e .env.local -- tsx scripts/run-agent.ts"
```

- [ ] **Step 3: Run once with slack**

If you decide to run this, run at least 60 minutes before demo:

```bash
pnpm seed:agent
```

If it produces fewer than 30 events, the script bails out and leaves the seeded events intact.

- [ ] **Step 4: Commit (only if successful)**

```bash
git add scripts/run-agent.ts package.json
git commit -m "Add optional Managed Agent runner script"
```

---

## Phase 6: Delight modal

### Task 6.1: Delight modal component

**Files:** Overwrite `src/components/delight-modal.tsx`

- [ ] **Step 1: Replace the stub**

Overwrite `src/components/delight-modal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Gesture = {
  title: string;
  rationale: string;
  estCostHkd: number;
  availability: string;
  status: string;
};

export function DelightModal({
  open,
  onOpenChange,
  guestName,
  briefId,
  gestures,
  generatedAtIso,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  guestName: string;
  briefId: Id<"briefs">;
  gestures: Gesture[];
  generatedAtIso: string;
}) {
  const approve = useMutation(api.briefs.approveGesture);
  const [busy, setBusy] = useState<number | null>(null);

  async function onApprove(index: number) {
    setBusy(index);
    try {
      await approve({ briefId, gestureIndex: index });
    } finally {
      setBusy(null);
    }
  }

  const formattedDate = new Date(generatedAtIso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          background: "var(--elevated)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          maxWidth: 640,
        }}
      >
        <DialogHeader>
          <div className="section-label">Delight Options</div>
          <DialogTitle className="font-display" style={{ fontSize: "1.5rem", fontWeight: 500 }}>
            {guestName}
          </DialogTitle>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          {gestures.map((g, i) => {
            const scheduled = g.status === "scheduled";
            const primary = i === 0;
            return (
              <div
                key={i}
                style={{
                  padding: "1.25rem",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderLeft: primary ? "2px solid var(--accent)" : "1px solid var(--border)",
                  borderRadius: "0.375rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {primary ? (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--accent)",
                      }}
                    />
                  ) : null}
                  <div className="font-display" style={{ fontSize: "1.25rem", fontWeight: 500 }}>{g.title}</div>
                </div>
                <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>{g.rationale}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                  <div className="font-mono" style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                    Est. HKD {g.estCostHkd.toLocaleString()} - {g.availability}
                  </div>
                  {scheduled ? (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.375rem 0.75rem",
                        background: "var(--accent-muted)",
                        color: "var(--accent)",
                        borderRadius: "0.375rem",
                      }}
                    >
                      Scheduled
                    </span>
                  ) : (
                    <button
                      onClick={() => onApprove(i)}
                      disabled={busy === i}
                      className="font-mono"
                      style={{
                        fontSize: "0.8125rem",
                        padding: "0.5rem 0.875rem",
                        background: "var(--accent)",
                        color: "#0a0909",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: busy === i ? "wait" : "pointer",
                      }}
                    >
                      {busy === i ? "Scheduling..." : "Approve and Schedule"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "1rem", textAlign: "right" }}>
          Generated by Sense Pre-Arrival Agent - {formattedDate}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/delight-modal.tsx
git commit -m "Implement delight modal with 3 gestures and approve flow"
```

### Task 6.2: Wire gesture section to use real guest name

**Files:** Modify `src/components/gesture-section.tsx`

- [ ] **Step 1: Pass guest name through**

Update `src/components/gesture-section.tsx` to receive guest first and last name as props:

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { DelightModal } from "./delight-modal";

export function GestureSection({
  guestId,
  guestName,
}: {
  guestId: Id<"guests">;
  guestName: string;
}) {
  const [open, setOpen] = useState(false);
  const brief = useQuery(api.briefs.getForGuest, { guestId });
  if (!brief) return null;

  const primary = brief.suggestedGestures[0];
  if (!primary) return null;
  const scheduled = primary.status === "scheduled";

  return (
    <section style={{ marginBottom: "2rem" }}>
      <div className="section-label" style={{ marginBottom: "1rem" }}>Suggested Gesture</div>
      <div
        style={{
          padding: "1.25rem",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderLeft: "2px solid var(--accent)",
          borderRadius: "0.375rem",
        }}
      >
        <div className="font-display" style={{ fontSize: "1.25rem", fontWeight: 500 }}>{primary.title}</div>
        <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)" }}>{primary.rationale}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <div className="font-mono" style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
            {scheduled
              ? `Scheduled - ${primary.availability}`
              : `Est. HKD ${primary.estCostHkd.toLocaleString()} - ${primary.availability}`}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="font-mono"
            style={{
              fontSize: "0.8125rem",
              padding: "0.5rem 0.875rem",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "0.375rem",
              color: "var(--accent)",
              cursor: "pointer",
            }}
          >
            View all options
          </button>
        </div>
      </div>
      <DelightModal
        open={open}
        onOpenChange={setOpen}
        guestName={guestName}
        briefId={brief._id}
        gestures={brief.suggestedGestures}
        generatedAtIso={brief.generatedAtIso}
      />
    </section>
  );
}
```

- [ ] **Step 2: Update brief-view.tsx to pass name through**

In `src/components/brief-view.tsx`, find the `<GestureSection guestId={guest._id} />` line and replace with:

```tsx
<GestureSection guestId={guest._id} guestName={`${guest.firstName} ${guest.lastName}`} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/gesture-section.tsx src/components/brief-view.tsx
git commit -m "Pass guest name into delight modal"
```

### Task 6.3: Verification gate

**Files:** none

- [ ] **Step 1: Screenshot before approve**

Navigate to `/guests/anderson`. Screenshot featured gesture card. Should show "Est. HKD 1,200 - Available Thursday".

- [ ] **Step 2: Open modal, screenshot**

Click "View all options". Modal opens with 3 gestures. Screenshot. Verify:
- Title "Delight Options"
- "James Anderson" in Cormorant 1.5rem
- Ceramics first with gold left border and small gold dot
- All 3 with "Approve and Schedule" buttons
- Footer "Generated by Sense Pre-Arrival Agent - May 15, 2026"

- [ ] **Step 3: Approve ceramics**

Click "Approve and Schedule" on ceramics. Wait for the optimistic update plus mutation completion. Screenshot. Verify button replaced with "Scheduled" pill.

- [ ] **Step 4: Close modal, verify brief updates**

Close modal. Featured gesture card on brief should now show "Scheduled - Available Thursday". Screenshot.

- [ ] **Step 5: Commit any fixes**

```bash
git add .
git commit -m "Phase 6 verification: delight modal end-to-end"
```

---

## Plan B verification (end-of-plan gate)

All of these must be true before declaring Plan B done:

1. `/arrivals` shows 2 guest cards, filter tabs work
2. `/guests/anderson` shows all 6 sections plus the agent panel on the right
3. Role switcher changes the observations feed in real time
4. Countdown updates every second
5. Capture FAB navigates to `/capture`
6. `/capture?guest=anderson&prefill=demo` lets you submit the demo sentence, see streaming extraction, auto-save, and land on `/guests/anderson` with the new observation at the top
7. Agent panel Replay plays through all 47 events with cursor blink and auto-scroll
8. Delight modal opens, ceramics shows as PRIMARY, approve marks it Scheduled, brief featured card updates

If any fail, fix before starting Plan C.

---

## What Plan B intentionally does NOT do

- No Framer Motion (Plan C, Phase 7)
- No design audit pass beyond per-task verification (Plan C)
- No accessibility pass (Plan C)
- No deploy (Plan C)
