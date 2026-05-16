# Progress

<!-- append completed tasks here: [date time] task description -->
[2026-05-16 13:04] Task 0.1: Installed Playwright, shadcn, convex MCP servers (corrected package names for shadcn and convex)
[2026-05-16 13:07] Task 0.2: Created .env.example, .env.local (Anthropic key deferred until Plan B)
[2026-05-16 13:10] Task 1.1: Scaffolded Next 16 app (create-next-app installs Next 16 now, not Next 15 as plan stated)
[2026-05-16 13:11] Task 1.2: Installed runtime deps (convex, ai, @ai-sdk/anthropic, @anthropic-ai/sdk, @ai-sdk/react, framer-motion, zod)
[2026-05-16 13:11] Task 1.3: Initialized shadcn/ui (Radix base, Neutral, CSS vars). Note: new shadcn replaced "new-york" style with "radix-nova"
[2026-05-16 13:12] Task 1.4: Added shadcn primitives (button, card, dialog, dropdown-menu, tabs, badge, skeleton, scroll-area, sonner, avatar, input, command, popover + auto-added textarea, input-group)
[2026-05-16 13:12] Task 1.5: Added Vercel AI Elements (full set via `ai-elements list` — registry no longer exposes "response" or "source" by name; got "message", "sources", etc.)
[2026-05-16 13:13] Task 1.6: Configured fonts (Cormorant Garamond + Geist Mono via next/font)
[2026-05-16 13:13] Task 1.7: Applied Black Card design tokens to globals.css (extended with shadcn-aliased tokens so primitives still render)
[2026-05-16 13:13] Task 1.8: Bootstrapped Convex (anonymous local deployment auto-provisioned, no browser login required)
[2026-05-16 13:15] Task 1.9: Verified tokens probe page via Playwright MCP — warm-black bg, Cormorant heading, mono flight info, gold-left card, 0 console errors
[2026-05-16 13:16] Task 2.1: Defined Convex schema (6 tables, indexes pushed)
[2026-05-16 13:17] Tasks 2.2-2.5: Added guests, observations, briefs, agentEvents functions
[2026-05-16 13:18] Tasks 2.6-2.7: Added seed mutations (base + 47 agent events)
[2026-05-16 13:18] Task 2.8: Added scripts/seed.ts and `pnpm seed` script
[2026-05-16 13:20] Task 2.9: Ran seed - inserted Anderson/Chen/Webb, brief, 47 events. Verified via convex run.

Plan A complete. All verification gates pass:
- pnpm dev boots on localhost:3000
- Tokens probe renders correctly
- Convex local deployment running with schema + functions pushed
- pnpm seed completes with 47 events inserted
- guests:listArriving returns Anderson + Chen sorted by carEtaIso
- agentEvents:listForBrief returns 47 events

[2026-05-16 16:25] Plan B Phase 3: ConvexProvider + layout shell + FAB + root redirect + guest card + arrivals + brief shell + role switcher + countdown + 6 sections + agent panel stub + brief-view assembly. Used shadcn primitives throughout (Card, Avatar, Badge, Tabs, Alert, DropdownMenu) plus lucide icons.
[2026-05-16 16:30] Plan B Phase 4: extract schema (Zod enums), system prompt, /api/extract (streamObject + Sonnet 4.6), guest picker (shadcn Command + Popover), capture form (Textarea + Web Speech), extraction preview (Badge + Card). End-to-end tested: capture → live extract → save → redirect.
[2026-05-16 16:33] Plan B Phase 5: agent tool row with type-coded icons (Search/Globe/FileText/Sparkles) + 47-event replay panel with Pause/Resume, blinking cursor, auto-scroll, pulsing status dot.
[2026-05-16 16:35] Plan B Phase 6: delight modal (Dialog + Card + Badge) with 3 gestures + approve flow. Approving updates Convex, brief featured card switches to "Scheduled".

Plan B complete. All verification gates pass:
- /arrivals: 2 cards, filter tabs, Cormorant on names, gold tier pills, mono ETAs
- /guests/anderson: 6 sections + agent panel sidebar, 0 console errors
- Role switcher dropdown changes observations feed
- Countdown timer ticks every second
- Capture FAB navigates to /capture
- /capture?guest=anderson&prefill=demo: live AI extract via Sonnet 4.6, auto-save, redirect to brief
- Agent panel Replay streams 47 events with cursor + auto-scroll
- Delight modal: 3 gestures, ceramics primary (gold border), Approve & Schedule → "Scheduled" pill

[2026-05-16 16:40] ElevenLabs Scribe replaces Web Speech API. Added /api/transcribe (server-side proxy with xi-api-key header). Capture form uses MediaRecorder, sends webm blob, populates textarea with transcript. Cross-browser (Chrome/Safari/Firefox) instead of Chrome-only.
[2026-05-16 16:45] Capture page no longer redirects after save. "Capture another" resets text + keeps guest; "View brief" link if user wants to navigate.
[2026-05-16 17:00] Redesign v1 (rolled back). Black Card sidebar + 3-up KPI tiles for key facts. User feedback: serif everywhere reads wedding-invitation, key facts shouldn't be KPI tiles.
[2026-05-16 17:20] Redesign v2: adopted shadcn dashboard-01 patterns. Installed shadcn Sidebar primitive (SidebarProvider/SidebarInset/SidebarTrigger), built AppSidebar with NavUser footer, SiteHeader component with breadcrumb + sidebar trigger. Refactored Card sections to use CardHeader/CardDescription/CardTitle/CardAction/CardFooter composition. Added gradient cards (`bg-gradient-to-t from-accent/[0.06] to-card`). Kept Cormorant only on Sense logo, guest hero name, page H1s, delight modal title.
[2026-05-16 17:35] Redesign v3 iteration: removed inset bg, added vertical gap between sidebar items, moved RoleSwitcher to top nav, restyled tabs as pill-style segmented control on own bar, reordered Brief tab (Gesture+Notes top, Pipeline middle, Highlights bottom). Renamed "Three Key Facts" to "Highlights" with single-card numbered dispatch list (no boxes).
[2026-05-16 17:50] QA fixes:
  - Root scroll bug: extra <main class="py-8"> wrapper in guests/[slug]/page.tsx was adding 64px on top of inner h-screen, causing 60px page-level overflow. Wrapper removed.
  - Width shift bug: Restaurant/Spa/Housekeeping had no content for gesture pane, column collapsed and shifted layout. Fixed with same-height RoleEmptyState placeholder.
  - Role filtering: Brief tab content (Highlights, Sensitivities, Gesture) now filters by role via rolesForText() heuristic in role-filter.ts. Front Desk sees all; Spa sees allergy+knee; Restaurant sees drinks+allergy.
  - Duplicate Tabs roots consolidated.
  - Arrivals H1 dynamic per filter.
  - Capture page got SiteHeader.
[2026-05-16 17:55] Evidence scroll fix: each column (Signals, Observations) is its own scroll context with flex-1 min-h-0 + overflow-y-auto. Added always-visible thin scrollbar styling in globals.css (10px champagne-tinted track) so macOS overlay-scrollbar invisibility doesn't hide the affordance.

[2026-05-16 22:30] Suggested Gesture Managed Agent (Sonnet 4.6) built and verified end-to-end.
  - `agents/experiences/rosewood-hong-kong.md`: 9-section curated directory (Asaya, dining, neighbourhood, Placemakers, $200/day policy).
  - `scripts/setup-agent.ts`: idempotent setup. Uploads markdown via Files API, creates/updates environment + agent, persists IDs to `.env.local`. Run with `pnpm setup-agent`. Re-runs bump the agent version and update the system prompt in place.
  - `src/app/api/agent/recommend-gesture/route.ts`: pre-fetches guest + observations + signals + brief from Convex, creates a session with the file mounted, streams events, validates `submit_gesture` input via Zod, calls `appendSuggestedGesture` (cap 3). Hard 120s deadline. Silent on failure.
  - Convex schema: added `gestureLoading` + `gestureLoadingStatus` to `briefs`. New mutations: `setGestureLoading`, `appendSuggestedGesture`.
  - UI: capture form fires-and-forgets to the route after capture mutation resolves; `gesture-section.tsx` keeps the current primary visible and shows a pulsing accent pill ("agent · {status}") next to the section label while a generation is in flight. The new gesture lands at slot [0] automatically via Convex subscription.
  - Tools enabled on the agent: `read` (for the directory), `web_search` + `web_fetch` (for weather and city news), and the `submit_gesture` custom tool (the answer channel). System prompt anonymizes staff names ("a bartender at Rosewood London" not "Daniel R.").
  - Verified: ~40-60s end-to-end, agent reads the file and cites it, web tools surface weather context ("light rain May 17-19, flag the indoor backup"), append + cap-to-3 working.
  - Diagnostics: `scripts/verify-gesture-agent.ts` (hits the route against the seeded Anderson observation), `scripts/inspect-last-session.ts` (dumps event log from the most recent session).
