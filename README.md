# Sense

Staff-facing AI intelligence platform for Rosewood Hotels. See `SPEC.md` for the full specification and `CLAUDE.md` for project conventions.

## Running locally

Sense needs two processes running side by side: the Next.js dev server and the Convex dev server. Convex must be running for any data to load - the app will appear empty without it.

Open two terminals at the repo root:

```bash
# Terminal 1 - Next.js
pnpm dev

# Terminal 2 - Convex
pnpm dlx convex dev
```

Then open http://localhost:3000 in Chrome (the Web Speech API used for voice capture only works in Chrome/Edge on localhost or HTTPS).

### First-time setup

```bash
pnpm install
pnpm dlx convex dev   # creates the Convex deployment, then leave running
pnpm seed             # seeds guests, observations, agent events
pnpm setup-agent      # one-time: creates the Managed Agent + environment, uploads the experiences file
```

`pnpm seed` and `pnpm setup-agent` both read from `.env.local`. `ANTHROPIC_API_KEY` must be set before running `setup-agent`; it persists `ANTHROPIC_AGENT_ID`, `ANTHROPIC_ENV_ID`, and `ANTHROPIC_EXPERIENCES_FILE_ID` back to `.env.local`. Re-run `setup-agent` after editing `agents/experiences/rosewood-hong-kong.md` or the system prompt to push the change as a new agent version.

### Stack

Next.js 15 (App Router) - React 19 - TypeScript - Tailwind v4 - shadcn/ui - Convex - Vercel AI SDK 5 - Anthropic SDK - Framer Motion. Package manager is **pnpm only**.
