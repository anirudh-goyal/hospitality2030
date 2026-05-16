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
