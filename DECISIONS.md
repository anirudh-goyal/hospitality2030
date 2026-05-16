# Decisions

<!-- log non-obvious architectural or design decisions here -->

## Design language: "The Black Card"
Chose warm-black (#0a0909) + champagne gold accent + Cormorant Garamond display type over cool-teal/Geist-only (original spec direction). Cormorant Garamond on guest names is the single visual move that separates this from generic SaaS and evokes Rosewood's physical brand.

## Managed Agent strategy: pre-run + replay
Anderson's agent ran before the demo (`pnpm run seed:agent`), event log stored in Convex. Demo replays cached events. More impressive (polished brief) and more reliable than live. The voice extraction IS the live AI moment.

## AI SDK split
`@ai-sdk/anthropic` + `streamObject` for `/api/extract` (streaming endpoint). `@anthropic-ai/sdk` directly for Managed Agents script. Never mixed in the same file.

## 2026-05-16 — MCP package names corrected
Plan A specified `npx @shadcn-ui/mcp` and `npx convex-mcp-server` which do not exist on npm. Used the official commands from the shadcn and Convex docs instead:
- shadcn: `npx shadcn@latest mcp`
- convex: `npx -y convex@latest mcp start`

Both connect successfully. Plan A wording should be updated to reflect this if the plan is re-run.

## 2026-05-16 — Next 16, not Next 15
`pnpm create next-app@latest` now installs Next 16.2.6, not Next 15 as Plan A states. The scaffold's own AGENTS.md note confirms breaking changes from training data. App router + RSC are unchanged. No action; just be aware of the version when looking up docs.

## 2026-05-16 — shadcn style preset changed
The current shadcn CLI replaced "New York" style with "radix-nova" preset (still Radix-based, still Neutral baseColor). Visual end-state is unchanged because globals.css is fully overwritten with Black Card tokens. components.json shows `"style": "radix-nova"`.

## 2026-05-16 — AI Elements registry drift
`response` and `source` (singular) are no longer in the AI Elements registry. `ai-elements list` adds the full set including `message`, `sources` (plural), `conversation`, `task`, `tool`, `reasoning`, `chain-of-thought`. Tree-shaking removes the unused ones. Plan B will use `tool`, `reasoning`, `task`, `chain-of-thought`, `sources` from this set.

## 2026-05-16 — Convex anonymous local deployment
Convex no longer requires browser login for dev. `pnpm dlx convex dev` provisioned an anonymous local deployment at `http://127.0.0.1:3210` and auto-wrote `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL` to `.env.local`. Dashboard at `http://127.0.0.1:6790/?d=anonymous-hospitality2030`. Trade-off: data lives only in this machine, not in the Convex cloud — fine for hackathon demo.

## 2026-05-16 — globals.css extended beyond plan
Plan A's globals.css only defines Black Card tokens, but shadcn primitives (Card, Button, Popover, etc.) need `--color-primary`, `--color-popover`, `--color-muted`, `--color-ring`, etc. Added these as aliases mapped onto Black Card values so primitives render correctly while staying within the palette.

## 2026-05-16 — Speech-to-text: ElevenLabs Scribe, not Web Speech API
Web Speech API works only in Chrome/Edge and quality varies. Replaced with ElevenLabs Scribe v1 via a server-side proxy route at `/api/transcribe`. Browser uses `MediaRecorder` to capture webm, posts to the route, the route forwards to `https://api.elevenlabs.io/v1/speech-to-text` with `xi-api-key` server-side. Trade-off: ~1-2s latency for batch transcription instead of streaming, but works in Safari/Firefox and is much more accurate. Streaming via WebSocket is possible but adds an ephemeral-token exchange we didn't need for the demo.

## 2026-05-16 — Capture flow stays on page (no redirect)
Originally the capture form auto-redirected to `/guests/[slug]` after a successful save. User wanted to inspect the structured extraction result (the live AI moment) on the same page, so the redirect was removed. The "Saved" state now shows a "Capture another" button (resets text + guest stays selected) and a "View [name]'s brief" link.

## 2026-05-16 — UI redesign: dashboard-01 patterns, sans-serif chrome
The original Black Card design used Cormorant Garamond throughout the UI. User pushback: serif everywhere reads as wedding-invitation; subtext too faint for projector; brief content scrolling; key facts shouldn't be KPI-style tiles. Pivoted to:
- shadcn dashboard-01 patterns: `<Sidebar>` primitive (collapsible with keyboard shortcut Cmd+B), `<SidebarInset>` shell, `<SiteHeader>` with `<SidebarTrigger>` + breadcrumb + role switcher in right slot. `<NavUser>`-style footer with avatar + dropdown.
- Cormorant Garamond reserved for: Sense logo, guest hero name, page-level H1s ("Today at Rosewood Hong Kong"), delight modal title. Everything else uses Geist Sans (loaded via next/font alongside Geist Mono and Cormorant).
- Subtext contrast bumped: `--text-secondary` 0.55 → 0.78; `--text-tertiary` 0.30 → 0.58. Section labels 11px/30% → 12px/60%.
- Brief tab is a single-screen command center (no scroll on 1440x900): Gesture (col-span-2) + Sensitivities (sidecar) → Intelligence Pipeline strip → Highlights. Evidence and Activity behind tabs.
- Key facts renamed "Highlights" and rendered as a single Card with numbered rows (01/02/03) separated by hairline borders. Not stat tiles, not three boxes.
- Card composition uses CardHeader/CardDescription/CardTitle/CardAction/CardFooter for polished structure (instead of hand-rolled divs).

## 2026-05-16 — Role filtering by text heuristics, not stored category
The brief's `keyFacts` and `sensitivities` are stored as plain `{fact, source}` and `string` without `applicableRoles`. To make the role switcher meaningfully filter Brief content (not just Observations), added `rolesForText()` in `src/lib/role-filter.ts` that infers roles from content keywords (allergy → all roles; pool/child → concierge; drinks/mezcal → restaurant; etc.). Pragmatic for demo; if scaled, the brief generator should write `applicableRoles` directly into each keyFact.

## 2026-05-16 — Always-visible thin scrollbar
macOS Chrome uses overlay scrollbars (hidden until hover). When Evidence column overflowed, user couldn't tell content was scrollable. Added explicit `::-webkit-scrollbar` styling globally (10px thin champagne-tinted track) so the scroll affordance is always visible. `scrollbar-width: thin` for Firefox.

## 2026-05-16 — Per-column scroll on Evidence
Single tab-level scroll caused observation content to push signal column down and scroll the whole tab as one unit. Switched to `grid grid-cols-2 gap-6 h-full min-h-0` with each column being its own `flex flex-col min-h-0` with the cards inside an `overflow-y-auto flex-1`. Signals stay put, Observations scrolls independently within its column.

## 2026-05-16 — Rollback tag
Pre-redesign rollback point: `pre-redesign` tag at commit `1851d48`. Use `git reset --hard pre-redesign` to revert all redesign work if needed.
