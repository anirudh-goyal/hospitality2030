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
