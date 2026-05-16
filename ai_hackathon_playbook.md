# The Solo AI Hackathon Playbook

**For:** an experienced software engineer with a 6–7 hour solo hackathon and Claude Code already on the laptop.
**Goal:** ship an AI-powered app that looks like a designer was in the room and feels like a product, not a demo.
**Date written:** May 2026. Half of what's here was conventional wisdom six months ago and half of it didn't exist six months ago. Trust the dates on the linked posts more than the names of the tools.
**Optimization targets:** speed of development, visual polish. Reliability and scale are not on the menu.

---

## TL;DR — what to do before you walk in

Pick one stack, one auth, one DB, one deploy target, and don't deviate. The fastest 2026 default for a stack-agnostic builder:

- **Frontend:** Next.js 15 App Router + Tailwind v4 + shadcn/ui (CLI v4, with the `registry:base` payload for one-shot design-system install).
- **AI plumbing:** Vercel AI SDK 5/6 (`useChat`, `streamText`, `stopWhen`) + Vercel **AI Elements** (the 20+ prebuilt shadcn-style chat/tool/reasoning primitives) + `@ai-sdk/anthropic` pointing at Claude Sonnet 4.6 for the main model and Haiku 4.5 for cheap tool steps.
- **Backend / DB:** Convex (zero migrations, TypeScript-native, real-time out of the box) — or Supabase if you absolutely need SQL.
- **Auth:** Clerk (`<SignIn />` drop-in, ~5–10 minutes end to end).
- **Deploy:** Vercel, `git push` → live URL.
- **Claude Code config:** install the official `frontend-design` plugin, the `obra/superpowers` plugin, and the Playwright MCP server. Add a tight `CLAUDE.md` and 3–5 `.claude/commands/` files.
- **Parallelism:** [Conductor.build](https://conductor.build) (free Mac app) so you can run 3–5 Claude sessions in git worktrees from a single window.
- **Polish layer:** shadcn blocks for structure, **Aceternity UI** or **Magic UI** for any landing/hero moment, Motion (formerly Framer Motion) for micro-interactions.

The single biggest behavioural change: **don't prompt Claude. Have Claude interview you.** Spend the first 30–45 minutes in `/plan` mode making Claude ask questions until you have a `SPEC.md` you both believe in. Then turn it loose for hours.

---

## 1. Stack selection and project scaffolding

The 2026 default for an AI app that needs to look polished is unambiguous: **Next.js 15 (App Router) + Tailwind v4 + shadcn/ui**. Every starter template and every "I shipped an AI app this weekend" post converges on this combination, because v0, AI Elements, Aceternity, Magic UI, and the Anthropic Frontend Design skill all assume it. Fighting that current costs you hours.

**Don't scaffold from `create-next-app` cold.** Pick one of these starters and let it do an hour of yak-shaving for you:

| Starter | Why it matters | Link |
|---|---|---|
| **Vercel AI Chatbot** | Reference implementation for streaming chat with AI SDK + shadcn. The fastest path to a "looks like ChatGPT" baseline. | [vercel/ai-chatbot](https://vercel.com/templates) |
| **Next Turbo Kit** | Built for AI-assisted dev: ships with 6 MCP servers, `llms.txt`, Cursor rules, Claude Code integration, 115+ shadcn components. | [nextturbokit.com](https://nextturbokit.com/) |
| **Next-Stage** | Specifically designed for agentic workflows — has `_llm-rules/`, `_llm-docs/`, `AGENTS.md`, `CLAUDE.md` directories pre-wired. | [DEV write-up](https://dev.to/tim_yone/next-stage-a-modern-nextjs-starter-template-for-ai-driven-development-238b) |
| **starter-nextjs-convex-ai** | Edge-first Next.js + Convex + Cloudflare, designed from the start for Claude Code. | [GitHub](https://github.com/appydave-templates/starter-nextjs-convex-ai) |

For pure speed-to-something-on-screen, there's a second tier of tools you should know exist but probably *won't* use as your hackathon primary: **v0**, **Lovable**, and **Bolt.new**. The honest read from people who ran the same project through all three in 2026 is:

- **Lovable** generates the cleanest UI and wires Supabase end-to-end. Best for the "screenshot-worthy first 70%".
- **Bolt.new v2** is the most batteries-included (databases, auth, hosting, Figma import) but the code can be heavier.
- **v0** is now a full-app generator and imports your GitHub repo with environment context. Best Git story of the three.

The winning workflow most practitioners describe in 2026 is hybrid: **scaffold an aspirational hero/landing/dashboard in v0 or Lovable, export the components, then drop them into a Claude Code-driven Next.js project for the real work** ([source](https://www.nxcode.io/resources/news/v0-vs-bolt-vs-lovable-ai-app-builder-comparison-2025), [source](https://muz.li/blog/the-complete-vibe-coding-guide-for-designers-2026/)). For a 6–7 hour solo run, I'd skip Lovable/Bolt as the primary canvas — you'll fight them at hour 4 — but spend 10 minutes in v0 generating one or two beautiful blocks (hero, settings page, empty state) before you start.

**One-command scaffold I'd actually run at hour 0:**

```bash
pnpm create next-app@latest --typescript --tailwind --app --src-dir --import-alias "@/*"
cd <app>
pnpm dlx shadcn@latest init                    # pick "New York" style, Neutral base color, CSS variables
pnpm dlx shadcn@latest add button card input dialog dropdown-menu sonner skeleton tooltip badge avatar
pnpm add ai @ai-sdk/anthropic @ai-sdk/react zod
pnpm dlx ai-elements@latest                    # all AI Elements components in one shot
```

The `registry:base` mechanism shipped in `shadcn/cli v4` (March 2026) lets a single registry entry install your global design tokens, fonts, and CSS variables in one command — useful if you've got a Tailark or custom registry ready to go ([changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)).

---

## 2. Working with Claude Code: planning, prompting, autonomous execution

This is the section that decides whether you ship.

### 2a. Interview first, spec second, code last

The single best 2026 workflow change: **stop prompting Claude — have Claude interview you.** This pattern, popularised by the "Interview Mode" community of posts (e.g. [velvetshark](https://velvetshark.com/stop-prompting-claude-code-let-it-interview-you), [developersdigest](https://www.developersdigest.tech/blog/claude-code-interview-mode), [Kondasamy](https://kondasamy.com/blog/2026/claude-code-interview-mode/)), uses the `AskUserQuestion` tool built into Claude Code to drill down into ambiguity *before* any code exists.

Open the session with literally this prompt (steal it):

> Before writing any code, interview me using the AskUserQuestion tool about the product I want to build. Ask about: the user, the core flow, the AI-powered moments, technical constraints, design feel (cite reference apps if it helps), edge cases I might not have considered, and the demo I want to give in 3 minutes. Skip obvious questions. Keep digging into the parts I'm hand-waving over. Continue until you genuinely understand what to build and how to demo it. Then write a complete spec to `SPEC.md` with: product summary, user stories, screen list with notes on each, data model, API surface, AI/agent design, design language, and a prioritized task list for execution. Do not write code yet.

This is the same shape as the now-famous `interview-me` skill ([GitHub](https://github.com/Sorbh/interview-me)) and is what Tariq Sheikh at Anthropic shared internally. Researchers note this catches **~60% of requirement gaps** users don't notice in their own prompts (mirroring the same finding from SuperPowers' "Clarify" phase, [source](https://www.mindstudio.ai/blog/what-is-superpowers-plugin-claude-code)).

**Concretely, budget 30–45 minutes for this.** You will be annoyed at how many questions it asks. That annoyance is the point.

### 2b. Plan mode is the second forcing function

After `SPEC.md` exists, switch to **Plan Mode** (`Shift+Tab` twice, or `/plan` since January 2026). Plan mode is tool-enforced read-only — Claude literally cannot edit until you accept the plan, so it produces better plans because it can't escape into action ([source](https://www.claudedirectory.org/blog/claude-code-plan-mode-guide), [source](https://www.getaiperks.com/en/ai/claude-code-plan-mode)).

This is exactly how Boris Cherny — the creator of Claude Code — actually uses it. His self-described "surprisingly vanilla" setup ([Boris on X](https://x.com/bcherny/status/2007179832300581177), [VentureBeat coverage](https://venturebeat.com/technology/the-creator-of-claude-code-just-revealed-his-workflow-and-developers-are)):

> "Most sessions start in Plan mode. If my goal is to write a Pull Request, I will use Plan mode, and go back and forth with Claude until I like its plan. From there, I switch into auto-accept edits mode and Claude can usually 1-shot it."

Iterate the plan with Claude two or three times before you accept. Once accepted, flip to `Shift+Tab` → auto-accept edits and let it run.

### 2c. `CLAUDE.md`: keep it small and angry

A `CLAUDE.md` checked into the repo root is read on every session start. The empirical advice in 2026 is **keep it under 200 lines** — Claude's own system prompt eats ~50 instructions, and frontier models start losing compliance after 150–200 instructions ([source](https://www.datacamp.com/tutorial/claude-code-best-practices), [source](https://heeki.medium.com/using-spec-driven-development-with-claude-code-4a1ebe5d9f29)).

What goes in: house rules ("never use `npm`; always use `pnpm`"), package versions ("Next 15, React 19, Tailwind v4 — do NOT downgrade"), invariants ("all server actions go in `src/app/actions/`"), and the one or two things you watch Claude get wrong in the first hour ("never wrap a server action in `useEffect`"). Boris's team adds to `CLAUDE.md` literally every time they see Claude do something wrong ([source](https://www.threads.com/@boris_cherny/post/DTBVlMIkpcm)).

What doesn't go in: a paragraph-long explanation of the product. That belongs in `SPEC.md` (where Claude reads it once at the start of a session, not on every turn).

### 2d. Slash commands for inner loops

If you find yourself typing the same prompt twice, make a slash command. Drop a markdown file in `.claude/commands/<name>.md` and Claude will treat it as `/name`. The five I'd pre-stage the night before:

- `/spec` — re-enter interview mode against the current `SPEC.md` to refine a section.
- `/ship-feature` — implement a numbered task from `SPEC.md`, write tests if reasonable, commit with a conventional message.
- `/polish` — invoke the Frontend Design skill, screenshot the current page with Playwright MCP, and propose visual improvements.
- `/seed-demo` — generate realistic seed data for the demo flow described in `SPEC.md`.
- `/diagnose` — read recent terminal output, find the error, propose the smallest fix.

Use `$ARGUMENTS` in any of them to accept parameters ([docs](https://code.claude.com/docs/en/best-practices)).

### 2e. Task budgets and extended thinking

For any task you want Claude to grind on autonomously, set a **task budget** ([Anthropic docs](https://platform.claude.com/docs/en/build-with-claude/task-budgets)) — Claude sees a running countdown of tokens and prioritizes / wraps up gracefully. For genuinely hard architectural choices, raise `MAX_THINKING_TOKENS` to 16000–32000 for that single call. The thinking tokens cost 5x input pricing on Opus 4.7 ($25/M), so don't leave it on globally — toggle it for the hard moments ([source](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/extended-thinking-tips)).

### 2f. How to course-correct without micromanaging

When Claude goes off-rails in the middle of an autonomous run, the worst thing you can do is iterate on the wrong path. Three responses, in order of preference:

1. **`ESC` and rewind** to the message where things diverged. Edit the prompt. Restart from there.
2. **Open a fresh session in the same worktree** and give it the current state plus a tight correction prompt. Old context is poison once it contains a wrong direction.
3. **Codify the lesson into `CLAUDE.md`** so the same mistake doesn't happen in worktree #2.

The pattern from the Anthropic "Built with Opus 4.6" hackathon winners ([Claude blog](https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon)): the people who won were domain experts who treated Claude as a junior staff engineer they were spec'ing for, not as a tool they were operating. Mike, the CrossBeam winner, said: *"I didn't write a single line of code."* He wrote specs and tests; Claude wrote code.

---

## 3. Embedding AI into the app

### 3a. The plumbing: AI SDK 5/6, not bare Anthropic SDK

For any web app, **use the Vercel AI SDK** (v5 shipped July 2025, v6 announced 2026) — not the bare `@anthropic-ai/sdk`. The AI SDK gives you:

- `streamText({ model, messages, tools, stopWhen })` on the server, with Server-Sent Events as the default transport.
- `useChat()` on the client with `addToolApprovalResponse`, `sendMessage`, transport-based state, and tool-call streaming ([reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)).
- `stopWhen` (e.g. `stepCountIs(5)`) and `prepareStep` for agent-loop control ([docs](https://ai-sdk.dev/docs/agents/loop-control)).
- `@ai-sdk/anthropic` provider for Claude with prompt caching, structured outputs, and tool support built in.

Minimum viable streaming chat endpoint:

```ts
// app/api/chat/route.ts
import { streamText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { tools } from '@/lib/ai/tools';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = await streamText({
    model: anthropic('claude-sonnet-4-6'),
    messages,
    tools,
    stopWhen: stepCountIs(8),
    system: 'You are <product name>. <One-paragraph persona>.',
  });
  return result.toDataStreamResponse();
}
```

### 3b. AI Elements: do not build chat UI from scratch

The single most underused 2026 release is **Vercel AI Elements** — 20+ prebuilt shadcn-styled components specifically for AI UIs ([changelog](https://vercel.com/changelog/introducing-ai-elements), [LogRocket walkthrough](https://blog.logrocket.com/vercel-ai-elements/), [docs](https://ai-sdk.dev/elements)). Install all of them with `pnpm dlx ai-elements@latest`, or one at a time with `pnpm dlx ai-elements@latest add conversation message response`. What you get:

- **Conversation / Message / Response / Actions / Sources** — the chat primitives, with streaming markdown and code-block rendering already correct.
- **Reasoning / Tool / Task / InlineCitation / Context** — the things that distinguish a polished AI UI from a chat-toy: streaming tool inputs, expandable reasoning, inline source pills.
- **CodeBlock / Artifact / WebPreview / Image** — for chat replies that include runnable code, images, or live web previews.
- **Canvas / Node / Edge** (React Flow primitives) — for workflow/agent visualization, if your AI feature is a flow.

This is the difference between three hours of fiddling with markdown renderers and three minutes of `import { Conversation, Message, Response } from '@/components/ai-elements'`.

### 3c. Tool-calling agent loop

For agent features (the AI does multi-step work on the user's behalf), the AI SDK pattern is:

```ts
const result = await streamText({
  model: anthropic('claude-sonnet-4-6'),
  messages,
  tools: {
    searchDocs: tool({
      description: 'Search the user-uploaded documents',
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => await search(query),
    }),
    createTask: tool({
      description: 'Create a task in the user\'s task list',
      inputSchema: z.object({ title: z.string(), due: z.string().optional() }),
      execute: async (input) => await db.tasks.create(input),
    }),
  },
  stopWhen: stepCountIs(6),
});
```

Two things make this feel native instead of bolted-on:

1. **Stream the tool inputs.** AI SDK 5+ streams tool call arguments as they're generated. Wire them to the AI Elements `<Tool>` component and the user sees "Searching for 'Q3 forecast'..." as it happens, not as a frozen "Tool: searchDocs" badge.
2. **Render tool *results* as components, not text.** This is "generative UI" — when `createTask` returns, render a `<TaskCard>` inline in the chat. Use the AI SDK UI generative-UI pattern ([docs](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces)) — map `toolName` → component.

### 3d. Document processing

If your hackathon idea is a document processor, the path of least resistance:

- **Upload**: Vercel Blob or UploadThing for the file.
- **Parse**: Anthropic's [Files API](https://docs.anthropic.com/) accepts PDFs natively; `pdf-parse` for plaintext extraction in Node.
- **Process**: stream a `streamObject` call with a Zod schema. The model fills it field-by-field as it reads.

Streaming structured output looks like magic in a demo because the user sees the form filling itself.

### 3e. CopilotKit vs assistant-ui vs roll-your-own

For a hackathon, **don't reach for a higher-level framework like CopilotKit unless your idea is fundamentally agentic in a way that needs LangGraph orchestration.** AI SDK + AI Elements covers 90% of "chatbot with tools" and "agent with a sidebar" patterns. The 2026 community read ([source](https://dev.to/alexander_lukashov/i-evaluated-every-ai-chat-ui-library-in-2026-heres-what-i-found-and-what-i-built-4p10)):

> "If you're on React, start with assistant-ui. If you need a heavier agent runtime, look at CopilotKit."

AI Elements is now the third option and the safest for a 6-hour build.

---

## 4. Design systems and visual polish

This is what separates the top three at any hackathon demo from everyone else. The 2026 stack is well-established.

### 4a. Install the Anthropic Frontend Design plugin. Then never think about it again.

The **official `frontend-design` Claude Code plugin** from Anthropic ([Claude plugin page](https://claude.com/plugins/frontend-design), [GitHub](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design)) has 300K+ installs as of late April 2026 ([source](https://thomas-wiegold.com/blog/claude-code-frontend-design-plugin/)). It activates automatically when you ask Claude to build a UI and *forces* Claude through a four-question framework — **purpose, tone, constraints, differentiation** — before any code gets written.

Without it, Claude defaults to safe, forgettable "AI-y" design. With it, you get aesthetic commitment: brutalist, editorial, retro-futuristic, organic, luxury, soft pastel, etc. The skill itself contains opinionated guidance about typography hierarchy, intentional spacing, and color palettes with actual contrast.

Install once at home the night before:

```bash
# in any Claude Code session
/plugin
# search "frontend-design" in the Discover tab, install
```

### 4b. Declare the design language at the *start* of `SPEC.md`

The single most effective single-prompt-line for hackathon polish is something like:

> Design language: cite Linear (typography hierarchy, restraint, subtle gradients), Vercel (monochromatic with single-accent, generous whitespace), and Raycast (density without clutter). Tone: editorial, technical, confident. Constraints: dark mode primary; no rainbow gradients; no emojis; OKLCH-based color palette; one display typeface (`Geist` or `Inter Display`) and one body face; 8px spacing scale; consistent 0.5rem radius. Differentiation: each AI moment should feel inevitable, not bolted on.

Drop this into the "Design Language" section of `SPEC.md` and reference it explicitly in `CLAUDE.md` ("All UI work must conform to the Design Language section of SPEC.md"). Claude will check against it on every component.

### 4c. shadcn/ui v4 + the registry ecosystem

The 2026 component ecosystem in concentric circles:

1. **shadcn/ui** (core, free, CLI v4 with Tailwind v4 + React 19) — buttons, inputs, dialogs, the boring stuff. Run `pnpm dlx shadcn@latest add <component>`.
2. **shadcn Blocks** (free, [link](https://ui.shadcn.com/blocks)) — login screens, dashboards, sidebars. Use these instead of building from primitives.
3. **AI Elements** (free) — the chat/agent layer, as above.
4. **Aceternity UI** ([ui.aceternity.com](https://ui.aceternity.com/)) — 200+ Framer Motion–based blocks: hero sections, bento grids, glowing/glare cards, magnetic buttons, particle backgrounds. Use one or two of these for the landing/demo wow moments.
5. **Magic UI** ([magicui.design](https://magicui.design/)) — 150+ animated micro-interactions, more restrained than Aceternity. Better for in-app moments (animated number counters, beam-on-hover, retro grids).
6. **Tailark** — bespoke marketing blocks with four cohesive themes (Quartz, Dusk, Mist, Veil). Reach for it if your demo includes a landing page so your hero doesn't look like every other shadcn SaaS.

The 2026 advice from people shipping AI apps at speed ([source](https://medium.com/@karthikmulugu/i-let-claude-design-my-entire-website-using-shadcn-magic-ui-and-playwright-mcp-heres-what-ad24860b705b)): **shadcn for the structure, Magic UI for the micro-polish, Aceternity for the one or two "look at this" moments.** Don't mix three animation libraries everywhere.

### 4d. Playwright MCP: Claude can see what it's building

Without the Playwright MCP server, Claude is blind to what its UI actually looks like. Install it:

```bash
claude mcp add playwright npx @playwright/mcp
```

Then add to `CLAUDE.md`:

> When making visual changes, use the Playwright MCP to screenshot the relevant page and verify the change matches the design language. Iterate until it does.

This single loop is what one widely-shared 2026 post titled *"I let Claude design my entire website using shadcn, Magic UI, and Playwright MCP"* ([Medium, May 2026](https://medium.com/@karthikmulugu/i-let-claude-design-my-entire-website-using-shadcn-magic-ui-and-playwright-mcp-heres-what-ad24860b705b)) credits as the unlock. It turns design from "vibes from text" into a closed-loop with visual ground truth ([Builder.io guide](https://www.builder.io/blog/playwright-mcp-server-claude-code), [Pasqualepillitteri](https://pasqualepillitteri.it/en/news/205/ai-blind-playwright-mcp-invisible-bugs)).

### 4e. Design tokens in Tailwind v4

Tailwind v4 ships every theme token as a CSS variable (`--color-primary`, `--radius`, `--color-border`) in `globals.css`. No more `tailwind.config.js`. shadcn registries can ship their own tokens, and `registry:base` in CLI v4 means *the entire design system arrives as one install* ([source](https://shadcnstudio.com/blog/shadcn-cli-v4-registry-base-and-registry-font)). If you have a personal token palette, package it as a tiny registry and prepend the install to your scaffold script.

---

## 5. Parallel execution and project structure

A 6-hour hackathon with sequential Claude sessions tops out at maybe 3 features. With parallelism, the same six hours fits 8–10 features. Three approaches, in order of how seriously to take them:

### 5a. Git worktrees + Conductor (recommended)

[**Conductor.build**](https://conductor.build) is a free Mac app that spins up a git worktree per Claude Code session in ~10 seconds, runs your setup script, auto-names the branch, and gives each session its own isolated checkout. The whole-team review of Conductor in 2026 ([George Taskos](https://georgetaskos.medium.com/scaling-the-loop-run-5-claude-code-sessions-in-parallel-with-conductor-build-539b52888a81)) is: it makes git worktrees human-friendly enough that you actually use them.

Boris Cherny himself runs **5 parallel Claude Code instances** in numbered terminal tabs plus 5–10 sessions on `claude.ai/code` ([source](https://www.threads.com/@boris_cherny/post/DTBVlMIkpcm)). For a hackathon, 3 is the sweet spot for one person: one "main" working through `SPEC.md`, one for design/polish in a separate worktree, one for the speculative "what if I added X" feature.

Conductor's `/resolve-merge-conflicts` slash command is the secret sauce — Claude reads the conflict markers and resolves them correctly most of the time, so merging parallel worktrees back together is a non-event ([source](https://georgetaskos.medium.com/scaling-the-loop-run-5-claude-code-sessions-in-parallel-with-conductor-build-539b52888a81)).

### 5b. Subagents / `Task` tool inside a single session

Within a single Claude Code session, the `Task` tool spawns subagents with their own context window. The pattern works best for **parallel exploration** (read these 10 files in parallel and summarize) and **parallel application of the same template** (add a CRUD route for each of these 6 models). It works less well for "actually build 3 features in parallel inside one session" — for that, use worktrees ([source](https://www.mindstudio.ai/blog/claude-code-agent-teams-parallel-shared-task-list), [source](https://www.aibuilderclub.com/blog/claude-code-sub-agents-guide)).

The 2026 official "Agent Teams" feature ([docs](https://code.claude.com/docs/en/agent-teams)) goes further — fully independent Claude Code instances that share a task list and coordinate without you routing messages. Worth knowing exists. Probably overkill for a solo 6-hour run.

### 5c. Project structure for parallel-friendliness

For your code to be parallel-friendly, your modules need to be parallel-friendly. The structure that holds up:

```
src/
  app/                  # Next.js routes
  components/           # Shared UI
    ui/                 # shadcn primitives
    ai-elements/        # Vercel AI Elements
  features/
    chat/               # All chat-feature files
    documents/          # Document processing
    dashboard/          # Etc.
  lib/
    ai/
      tools.ts          # Tool definitions for the AI agent
      prompts.ts        # System prompts
    db.ts
  app/api/chat/route.ts
```

The rule: **one feature per worktree, and features must not edit each other's directories**. Add it to `CLAUDE.md`:

> Each task in `SPEC.md` targets exactly one `features/<feature>/` directory plus its own route under `app/`. Do not edit other features' files. Shared utilities go to `lib/`. UI primitives go to `components/ui/`.

This is how you get clean merges from three Claudes editing in parallel.

### 5d. Shared context across sessions

Three patterns that prevent context drift:

- **`SPEC.md` is the source of truth.** Every session re-reads it at start.
- **A `PROGRESS.md` you append to.** Each completed task gets a one-line note. Other sessions read it before they start to avoid duplication.
- **A short `DECISIONS.md`.** When you make a non-obvious choice ("using Convex actions for the document parser, not API routes"), log it. This is the equivalent of an ADR for a single-day project.

---

## 6. Plugins, tools, and force multipliers

You've already used Superpowers — here's the rest of the high-impact 2026 set.

### Tier 1 — install before the hackathon

| Tool | Type | Why |
|---|---|---|
| **obra/superpowers** | Claude Code plugin | You already use it. 14 structured skills, enforces Clarify → Plan → Implement → Verify. 121K+ stars; 476K+ installs. [Plugin page](https://claude.com/plugins/superpowers) |
| **frontend-design** (Anthropic) | Plugin | The single biggest design-quality jump. 300K+ installs. [Plugin page](https://claude.com/plugins/frontend-design) |
| **Playwright MCP** | MCP server | Closes the visual feedback loop — Claude can screenshot and iterate. [Docs](https://playwright.dev/docs/getting-started-mcp) |
| **GitHub MCP** | MCP server | Turns Claude from a code generator into a participant in PRs/issues. Highest-impact MCP install for most devs ([source](https://nimbalyst.com/blog/best-claude-code-mcp-servers/)). |
| **shadcn MCP** | MCP server | Lets Claude install shadcn components, browse blocks, and read the registry without you copying commands. Pairs with Frontend Design. |
| **Conductor.build** | Mac app | Worktree manager for parallel sessions. Free. [conductor.build](https://conductor.build) |

### Tier 2 — install if relevant

| Tool | Why |
|---|---|
| **v0-mcp** | Generate a v0 UI from inside Claude Code via MCP. Useful for one-shot "give me a beautiful pricing page". [GitHub](https://github.com/hellolucky/v0-mcp) |
| **Brave Search MCP** | Lets Claude search the live web when it needs current docs or version-specific syntax. |
| **Supabase / Convex MCP** | Lets Claude introspect your DB schema directly. Saves you from pasting schemas into prompts. |
| **Vercel MCP** | Read deploy status, env vars, and logs from inside Claude. |

### Tier 3 — high-leverage skills (one-line installs)

Top-installed Claude Code skills as of 2026 ([source](https://www.openaitoolshub.org/en/blog/best-claude-code-skills-2026)):

- **`find-skills`** (Vercel Labs) — 418K installs. Recursive skill discovery.
- **`vercel-react-best-practices`** — 176K installs. Opinionated React patterns Claude actually follows.
- **`vercel-web-interface-guidelines`** — 22K stars, 133K weekly installs. The "ship-it" UI rules.
- **`code-reviewer`** (Agensi) — runs a four-angle parallel review (CLAUDE.md compliance, bugs, git history, security) before merge.
- **`humanize-writing`** — for any text the AI generates that ends up on screen. Removes the "robot voice."

Install pattern (one-liner from the [Agensi guide](https://www.agensi.io/learn/how-to-install-skills-claude-code)):

```bash
mkdir -p ~/.claude/skills && curl -sL https://www.agensi.io/api/install/<skill> | tar xz -C ~/.claude/skills/
```

### Bonus: slash-command-as-a-tool

The `/batch` command (shipped with several productivity plugins) decomposes a high-level change into 5–30 independent units, spins up isolated worktrees, executes in parallel, and creates PRs ([source](https://www.turbodocx.com/blog/best-claude-code-skills-plugins-mcp-servers)). For a hackathon, `/batch` against your `SPEC.md` task list at hour 1 can get you a half-built first draft of every screen in 20 minutes.

---

## 7. Deployment and demo polish

### 7a. Deploy: Vercel + `git push`. Stop overthinking.

For a Next.js app, **Vercel is the only sane choice for a 6-hour hackathon.** The flow:

1. `gh repo create --public --source=. --push`
2. Connect repo to Vercel (one click in the dashboard, or `vercel` CLI).
3. Every push to `main` is a production deploy; every other branch is a preview URL.

You're live in <5 minutes. Cloudflare Pages is faster at the edge and cheaper at scale, but you do not care about cheaper at scale today, and Cloudflare's setup will eat 20 minutes you don't have ([2026 comparison](https://clord.dev/blog/vercel-vs-cloudflare-pages-which-one-actually-ships/)).

Add this to `CLAUDE.md`:

> When environment variables need to change, prompt me to set them in Vercel — don't put secrets in `.env.production`. After every meaningful change, suggest `git push` and check the deploy URL.

### 7b. Demo polish: nine tricks to skip "the empty screen moment"

Hackathon demos die in two places: empty states and waiting states. The fix is preemptive.

1. **Seed realistic data with Faker.** Run a one-time seed script at the start of the demo that populates the user's account with 20–50 entities — realistic names, plausible timestamps spread over the last 14 days, varied statuses. Use [`@faker-js/faker`](https://www.testmuai.com/learning-hub/faker-js/), not `lorem ipsum`.
2. **Pre-warm the AI.** Cache one canned successful AI response server-side. If your demo opens with "summarize my Q3 docs", have a fixture that the cache hits on a known input.
3. **Start signed in.** Magic link or pre-authenticate the demo account on page load with a session cookie set via a special `?demo=true` route. Don't make the audience watch you click "Sign in with Google."
4. **Optimistic UI everywhere.** Use `useOptimistic` in React 19. The action returns instantly; the network catches up later. Critically reduces felt latency.
5. **Skeleton screens, not spinners.** shadcn has `<Skeleton>`. Every fetched section gets one. Spinners read as "broken"; skeletons read as "almost there."
6. **Streamed responses, even for short ones.** Use `streamText` even when you don't need to — the typing animation reads as faster, even when it's slower.
7. **One signature animation.** Pick one moment (the AI completing, a card flipping in, a glow on hover) and lean into it. Three signature animations is too many. None is too few.
8. **Sound effects, maybe.** A subtle bell on AI completion (think Linear's notification chime) makes the demo feel finished. Test it on the judges' projector before you commit.
9. **The "wow path."** Plan a *specific* 3-minute path through the app — what you click, what you type, what the AI returns. Practice it twice. Have a backup if the network drops (a Loom recording on your phone).

### 7c. The judge's brain

Hackathon judges in 2026 score on roughly: **functionality (does it work), interface (does it look good), AI leverage (was the AI use real), and presentation.** The first 30 seconds of your demo decides 60% of your score. Lead with the wow path; explain the architecture only if asked.

---

## 8. Time sinks: skip these

### 8a. Auth — Clerk wins for a hackathon

[Clerk](https://clerk.com) gives you a drop-in `<SignIn />` and `<UserButton />` that look like they shipped with a Series B product, plus Google/GitHub OAuth working in ~5 minutes. The 2026 community read ([source](https://stackwrite.com/compare/better-auth-vs-clerk/)) is unambiguous: **Clerk is the practical choice for a hackathon; Better Auth is the right choice for long-term ownership.** You're at a hackathon. Clerk.

Setup:

```bash
pnpm add @clerk/nextjs
# add CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to .env
# wrap layout in <ClerkProvider>, add middleware.ts
```

Five minutes. Done. The pre-built `<UserButton />` alone saves you an hour of avatar-menu CSS.

### 8b. Database — Convex unless you specifically need SQL

[Convex](https://convex.dev) is the 2026 winner for hackathons because there are no migrations to write, no schemas to design upfront (just TypeScript types), and real-time subscriptions are free with no extra wiring ([source](https://www.buildmvpfast.com/compare/supabase-vs-convex)). You write functions, you call them from React, they reactively re-render. For an AI app, the reactivity story is a cheat code — when the agent writes to the DB, the UI updates without you doing anything.

```bash
pnpm add convex
pnpm dlx convex dev          # interactive setup, ~60 seconds
```

If your idea is fundamentally relational (joins everywhere, complex reporting) or you want raw SQL, use Supabase. If your idea is read-heavy and globally distributed, Turso. But for the vast majority of "AI app with a chat / dashboard / list / detail" shape, Convex is the fastest.

### 8c. Env config

One `.env.local` file. One `.env.example` checked in. The variables you'll actually need:

```
ANTHROPIC_API_KEY=...
NEXT_PUBLIC_CONVEX_URL=...
CONVEX_DEPLOY_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
```

Add to `CLAUDE.md`:

> Never commit `.env*` files. Read `.env.example` if you need to know what's available. Prompt the user for any new secret instead of inventing a value.

### 8d. Other yak-shaving to delegate

- **Email**: Resend + their React Email components. 10 minutes to working transactional email. Probably skip entirely for a 6-hour build.
- **File upload**: UploadThing or Vercel Blob. Both are ~5 minutes.
- **Analytics**: PostHog free tier or skip. No one cares at a hackathon.
- **Error tracking**: Skip. If something crashes during the demo, you'll know.
- **Tests**: Write zero unit tests. Write *one* Playwright end-to-end test for the demo flow, and only if you have time at hour 5. That single test is your safety net.

---

## 9. Mobile: skip it

For a 6–7 hour solo hackathon, the answer is **don't build native mobile.** Build a responsive web app with strong mobile-first design, and call it a PWA if anyone asks.

The honest case for native (Expo) is when your idea genuinely requires a hardware capability — camera with real-time ML, push notifications you want users to actually receive, deep OS integration. None of these are usually true for an AI app demo. The 2026 community read ([source](https://www.appik-studio.ch/en/blog/pwa-vs-native-app-expo-best-choice/), [source](https://progressier.com/pwa-vs-native-app-comparison-table)) is the same: PWA is the smarter move for hackathons and MVPs; Expo becomes the right answer somewhere around week 2.

If you absolutely insist on something that *looks* native:

- **Tailwind responsive utilities** and `safe-area-inset-*` for notch handling.
- A custom 100vh fix (`100dvh` works in 2026 browsers) so the bottom nav doesn't get eaten by the address bar.
- A bottom tab bar with the four most important destinations. This single visual decision sells "mobile app."
- Skip `@vite-pwa` / next-pwa unless the demo specifically needs installability. The `manifest.json` and a 512px icon are 95% of "PWA."
- Show the demo on your phone. Even if it's a webview. Judges visually associate "shown on phone" with "mobile app."

If you have a strong React Native team background, **Expo** + **Expo Router** can match this productivity for native — but the polish layer (shadcn, Aceternity, AI Elements) is web-only, and you'll lose 90 minutes rebuilding it in NativeWind. Not worth it for one day.

---

## 10. Community wisdom: what people actually shipping say

I read the posts. Here's what they actually say, what's worth stealing, and what to ignore.

### The four ideas every single high-quality 2026 source agrees on

After reading through the practitioner literature, the same four ideas recur across people who don't know each other and aren't citing each other. That's the signal that they're real:

1. **Plan first, code later.** Whether it's called Plan Mode, interview mode, spec-driven dev, or the "attack document" — every author who ships consistently spends 15–60 minutes specifying before Claude touches code. The people who skip planning spend more time fixing mistakes than they saved.
2. **Give Claude a way to verify its work.** This is the single most cited force multiplier. Boris Cherny calls it "the most important thing." It's also why Playwright MCP keeps showing up — it closes the visual loop.
3. **Parallelize. Don't optimize.** Multiple simple Claude sessions beat one complex one. Boris runs 5–15 in parallel; Conductor users run 3–5. The ceiling on a sequential workflow is real, and you hit it fast.
4. **Tell Claude what to *think about*, not what to *produce*.** Principle-based prompts ("editorial magazine aesthetic, serif display, single earth-tone with a sharp accent") consistently beat pixel-level specs ("64px Inter Bold, #6366f1 gradient"). The latter uses up the model's tokens on the defaults it would have picked anyway and leaves no room for creative variance.

Below, the specific insights from each post worth carrying into the hackathon.

### Boris Cherny's actual setup — and the one tip that matters most

**Source:** [How the Creator of Claude Code Uses Claude Code (paddo.dev, Jan 5 2026)](https://paddo.dev/blog/how-boris-uses-claude-code/) summarising [Boris Cherny's X thread, Jan 3 2026](https://x.com/bcherny/status/2007179832300581177).

The setup itself: 5 Claude Code sessions running in numbered terminal tabs locally, 5–10 more on `claude.ai/code`, sometimes started from his phone in the morning. Model choice is unambiguous: **Opus with thinking for everything**, even though it's slower than Sonnet — because you steer it less and it almost always finishes faster end-to-end. No exotic config. No clever hacks.

The five patterns to steal directly:

- **Plan Mode for everything non-trivial.** Shift+Tab twice. Iterate with Claude until you like the plan. Then auto-accept and let it run. He calls a good plan "really important." paddo.dev frames this stronger: "[Plan Mode isn't training wheels — it's the measuring before you cut.](https://paddo.dev/blog/plan-mode-mandatory-auto-compact-yes)"
- **CLAUDE.md is team infrastructure, not a personal note file.** The Claude Code team checks one CLAUDE.md into the repo and the whole team contributes multiple times a week. The rule: "Anytime we see Claude do something incorrectly we add it to CLAUDE.md." For a solo hackathon this still applies — every wrong turn becomes a permanent rule.
- **PostToolUse hook for auto-formatting.** Boris's actual config — one hook running `bun run format || true` on every Write/Edit — eliminates the trickle of CI failures from minor format drift. Worth 30 seconds to add.
- **`/permissions` instead of `--dangerously-skip-permissions`.** Pre-allow the specific safe commands you actually use (`pnpm run build:*`, `pnpm run test:*`) in `.claude/settings.json` rather than disabling all permission prompts. Boris-team's settings are checked into git. The hackathon version: spend two minutes adding the commands you'll invoke 100 times before you start.
- **The one tip Boris explicitly calls the most important:** > *"Probably the most important thing to get great results out of Claude Code: give Claude a way to verify its work. If Claude has that feedback loop, it will 2-3x the quality of the final result."*

  Concretely that means: for a simple change, a bash command. For a feature, a test. For UI, a browser. This is the actual reason Playwright MCP is in every "I shipped this fast" post — it's the cheapest way to give Claude eyes on the page.

### The interview pattern, in detail

**Source:** [Stop prompting Claude Code — let it interview you (VelvetShark, Jan 2 2026)](https://velvetshark.com/stop-prompting-claude-code-let-it-interview-you), built on [Thariq (Anthropic) on X](https://x.com/trq212/status/2005315275026260309) — 1.3M views, 10K bookmarks in three days.

The empirical numbers from Radek Sienkiewicz's bookmark-manager experiment:

- **Starting spec:** one sentence ("Build a CLI tool to save and search bookmarks").
- **Number of questions Claude asked:** 32.
- **Resulting spec:** 157 lines covering tech stack, data model, commands, output format, storage, first-run behaviour, and **explicit non-goals**.
- **Time to answer the questions:** "a few minutes." Estimated time to write the same spec from scratch: "a couple of hours" — and he'd still have missed things.
- **Time from `Implement @SPEC.md` to working tool in a fresh session:** ~5 minutes. One shot.

His tactical findings: simple features get 20–30 questions; complex features 40–60. Always add **anti-goals** ("Don't add authentication. Don't over-engineer. I'm the only user.") to stop Claude from sprawling. Skip the whole pattern when requirements are obvious or the change is small — interview mode is overkill for a margin tweak.

The most useful artifact in the post is a ready-to-paste **`/interview` slash command** (full YAML frontmatter and prompt) that uses `model: opus`, `allowed-tools: AskUserQuestion, Read, Glob, Grep, Write, Edit`, takes the spec path as `$ARGUMENTS`, and overwrites the file with the finalized spec after asking you to confirm an outline. Drop it in `~/.claude/commands/interview.md` once and you have it across every project.

His personal verdict, after using it for weeks: "I've been using it on 90% of my tasks since first trying it."

### Karthik Mulugu's 47-minute repo-to-deploy walkthrough

**Source:** [I Let Claude Design My Entire Website Using shadcn, Magic UI, and Playwright MCP (Medium, May 8 2026)](https://medium.com/@karthikmulugu/i-let-claude-design-my-entire-website-using-shadcn-magic-ui-and-playwright-mcp-heres-what-ad24860b705b).

The most concretely replicable post I read. He walked through building a full SaaS landing page with the three-tool combo and timed himself. Key findings:

- **End-to-end time, empty repo → deployed Vercel preview: 47 minutes.** Lighthouse out of the box: 91 performance, 100 accessibility. The accessibility number comes free with shadcn primitives.
- **The setup itself is ~15 minutes.** `create-next-app` → shadcn init + a handful of components → `magicui-cli` init + animated-beam, bento-grid, number-ticker, shimmer-button → `npm install -g @playwright/mcp` → add MCP server config → start dev server.
- **He didn't write a spec.** One conversational prompt with aesthetic direction ("dark theme, hero with animated headline, bento grid, pricing with shadcn cards, shimmer CTA") plus the closing instruction: *"Once you build it, open the browser, navigate to localhost:3000, and tell me what's broken."* That last sentence is what triggers the verification loop.
- **What Claude did autonomously, without him asking:** wrote the components, opened a Playwright browser, navigated to localhost, took a screenshot, **noticed the mobile nav was overflowing the viewport**, fixed it, screenshotted again, confirmed. That self-correction is the value of Playwright MCP in one paragraph.
- **The component-library overlap warning is the practical bit.** shadcn and Magic UI have overlapping primitives (buttons, cards, animated elements). Pick a rule. His: *"shadcn for all structural/form components, Magic UI exclusively for animated display components."* This is the rule I'd codify in `CLAUDE.md` on day one.
- **Honest limitation:** Playwright MCP round-trips take a few seconds each. Worth it for full-page review; annoying for tweaking a margin. Toggle it consciously.
- **The prompting calibration:** *"Make a landing page"* gets you generic. *"Make a dark, minimal SaaS landing page for a developer tool that competes with Vercel"* gets you something with a point of view. The difference is the design hypothesis baked into the prompt.

Magic UI is worth specifically searching out: he relied heavily on `BentoGrid` (cards with staggered entrance + hover glow), `ShimmerButton`, and `TextAnimate` for the hero. These three primitives alone do a lot of the visual heavy lifting in a demo.

### Thomas Wiegold on the Frontend Design plugin — what it actually does

**Source:** [How to Use the Claude Code Frontend-Design Plugin to Stop Shipping AI Slop (April 27 2026)](https://thomas-wiegold.com/blog/claude-code-frontend-design-plugin/).

Several specifics worth knowing before you install:

- **The plugin is a 4.5 KB, ~50-line markdown file.** That's it. [SKILL.md in Anthropic's repo](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md). Portable to Cursor (`.cursor/rules/`), Codex (`AGENTS.md`), Copilot (`.github/copilot-instructions.md`), Google Antigravity (native).
- **Why AI design defaults to slop:** LLMs predict the highest-probability token. For frontend, that probability mass sits on the design conventions that dominated dev Twitter and Dribbble between 2020–2022 — Tailwind UI defaults, Linear's Magic Blue, the early Vercel aesthetic. Adam Wathan literally tweeted [an apology](https://x.com/adamwathan/status/1953510802159219096) for picking `bg-indigo-500` as the Tailwind UI default five years ago. One default × a million tutorials = the entire AI-generated internet's accent colour.
- **The plugin's specific forbidden list:** Inter, Roboto, Arial, system fonts, purple gradients on white backgrounds, predictable layouts, cookie-cutter components, and (notably) **Space Grotesk** — Claude's reflex "anti-Inter" choice. The plugin's authors caught Claude converging on Space Grotesk and explicitly wrote it into the forbidden list.
- **The four-question framework before code:** purpose, tone, constraints, differentiation. Tone is the high-leverage one — it's a forced choice from about a dozen extremes: *brutally minimal, maximalist chaos, retro-futuristic, organic, luxury, playful, editorial, brutalist, art deco, soft pastel, industrial.* Pick one. Execute it.
- **The five dimensions the plugin governs:** typography (distinctive display + refined body, never Inter/Roboto/Arial), color (CSS vars; dominant color with sharp accents, not timid distributed palettes), motion (one coordinated page-load reveal beats scattered micro-interactions), spatial composition (asymmetry, overlap, diagonal flow, grid-breaking), backgrounds (gradient meshes, noise textures, geometric patterns; *"refusing solid colour is half the battle"*).
- **The prompting principle that ties this all together:** tell Claude what to *think about*, not what to *produce*. Wiegold's worked example contrasts a bad prompt full of pixel specs ("1200px container, 80px padding, H1 64px Inter Bold, purple gradient #6366f1→#8b5cf6") against a good one ("editorial magazine, not SaaS. Pair a serif display like Fraunces with a clean geometric sans. Single warm earth tone with a sharp accent. One coordinated motion moment. Avoid: Inter, purple, generic gradients, three-card grids.") The second one produces wildly better output because it leaves room for choice.
- **The four highest-leverage tuning dimensions if the first pass isn't quite right**, in order of impact: typography (#1 by a mile), spacing extremes (3× heading-size jumps, 100→800 weight jumps not 400→600), one coordinated motion moment, backgrounds with depth.
- **Curated typography categories he recommends** (because Claude's default bag is bad): Editorial — Playfair Display, Crimson Pro, Fraunces. Startup — Clash Display, Satoshi, Cabinet Grotesk. Technical — IBM Plex. Distinctive — Bricolage Grotesque, Newsreader. Pick from a category, don't let Claude pick alone.
- **Iterate by naming convergence.** When Claude defaults back to its statistical mean, name it specifically: *"You used Space Grotesk again, pick a serif."* *"The hero is symmetrical — break the grid."* This is the design equivalent of the CLAUDE.md "lesson learned" pattern.

His final caveat is worth taking seriously even at a hackathon: the plugin gets you to a defensible 80% on tight timelines. The taste still has to come from you. The plugin just stops your taste from fighting the model's training data on every prompt.

### George Taskos on Conductor + the "attack document" — what makes parallelism actually work

**Source:** [Scaling the Loop: Run 5 Claude Code Sessions in Parallel with conductor.build (March 2026)](https://georgetaskos.medium.com/scaling-the-loop-run-5-claude-code-sessions-in-parallel-with-conductor-build-539b52888a81).

The key insight buried in this post: **the thing that makes parallel sessions actually work isn't Conductor itself — it's spec discipline.** *"Without the attack document, N parallel agents is chaos. With it, N parallel agents is just a faster queue."* The mathematics is the same as merge conflicts: if your `SPEC.md` defines explicit component boundaries (Feature A touches these files, Feature B touches those, no overlap), parallel workspaces don't conflict. If your spec is vague, "a vague spec in five parallel sessions is five times the mess."

Tactical Conductor details from the post:

- **Conductor runs on the Claude Code TypeScript SDK + Tauri.** Mac only at the moment; Windows on a waitlist at conductor.build.
- **The workspace lifecycle: ~10 seconds per workspace.** Click +, Conductor spins up a git worktree, runs your setup script, auto-names the branch (city names — Raleigh, Washington, Yokohama, "you'll appreciate this when you have six open at 2 a.m.").
- **The setup script is non-negotiable.** `.env` and `node_modules` aren't git-tracked, so each fresh worktree starts missing the stuff it needs to actually run. His default for a pnpm project: `cp ../.env .env && pnpm install`. For Next.js + Prisma: add `npx prisma generate && npx prisma db push --skip-generate`. If a workspace can't `pnpm dev` itself to a testable state, you'll skip testing and regret it during review.
- **`/resolve-merge-conflicts` is the secret sauce.** Claude is genuinely good at parsing conflict markers and reasoning about each branch's intent. The default command is editable in Settings → Slash Commands; he recommends a custom version that references your spec during conflict resolution.
- **When NOT to parallelize, by his rules:** tracks that depend on each other (run them sequentially); unfamiliar territory (you want to review each phase); features under ~20 minutes of work (workspace setup overhead beats the savings); specs that aren't solid.
- **When TO parallelize:** 3+ tracks with no shared code boundaries, each substantial (>2 hours of single-agent work), specs you trust enough to leave unsupervised.
- **One rule he repeats:** accept everything from a single session first, *then* split into parallel workspaces. Don't let parallel sessions each `/accept` independently — they'll create conflicting track states.

Charlie (Conductor's founder) quote that's worth pinning to your monitor: *"Treat Claude like a fellow human engineer — write messages the same way."* If you'd write *"here's the spec, implement phase 1 and stop for review"* to a junior engineer, write the same to Claude. And: *"No one should fully trust Claude 100%."*

### What the Anthropic hackathon winners actually did

**Source:** [Meet the winners of our Built with Opus 4.6 Claude Code hackathon (April 20 2026)](https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon).

The single most calibrating fact from this post: **four out of five winners were not professional developers.** A personal injury lawyer, a cardiologist, a roads-infrastructure specialist, and an electronic musician. They were domain experts who knew exactly what to build. They wrote specs and tests; Claude wrote code.

Specific workflows from the winners:

- **First place — Mike Brown / [CrossBeam](https://github.com/mikeOnBreeze/cc-crossbeam)** (California housing permit AI). His exact workflow: *"prompting Claude Code and then having Claude create the tests."* His exact words: *"It's crazy to me that I ended up winning this contest, and I didn't write a single line of code. I didn't even read a line of code."* The product is a sub-agent architecture — parallel agents parse blueprints and correction letters, build a spatial index, and assign targeted agents to each discrete correction. Twenty minutes from upload to action plan. **The hackathon lesson:** domain knowledge + Claude-writes-tests is a winning combination even with zero code review on your part.
- **Second place — Jon McBee / [Elisa](https://github.com/zoidbergclawd/elisa)** (visual block-based IDE for his 12-year-old daughter). **30 hours of work. 76 commits. 39,000+ lines of code. 1,500+ tests.** His quote: *"I know systems architecture. I know how to integrate hardware. I know how to define and test software. Claude Code helped me turn all that knowledge into a shippable product in only six days."* This is the volume math you should expect from a focused multi-day Claude Code run — and the implicit lesson is that tests carry the quality bar when you can't read every line.
- **Third place — Michał Nedoszytko / PostVisit.ai** (cardiology patient post-visit assistant). He built it on a hackathon road trip from Brussels to San Francisco. The lesson here is less about technique and more about pre-cooked vision: he'd been imagining this product for two years. The hackathon was an execution vehicle, not an ideation one.
- **"Keep Thinking" prize — Kyeyune Kazibwe / [TARA](https://github.com/Kye256/tara-transport-assessment)** (Uganda road infrastructure assessment from dashcam footage). Used Opus 4.6's **vision** to analyze every frame, identify surface conditions, segment by condition, and generate full economic appraisals (NPV, sensitivity analysis, equity score). *"This process used to take weeks. TARA does it in five hours."* The hackathon lesson: pick a domain where multimodal AI changes the cost structure dramatically.
- **Creative prize — Asep Bagja Priandana / [Conductr](https://github.com/nanassound/conductr)** — a browser-based MIDI instrument where Claude generates four backing tracks in real time. **Total code: ~4,800 lines** of JS + WebAssembly. C engine compiled to WASM for 15ms-per-note generation. The lesson: aggressive scope-cutting wins demos. One distinctive interaction beats five mediocre ones.

The follow-on hackathon ([Built with Opus 4.7](https://cerebralvalley.ai/e/built-with-4-7-hackathon)) was announced in the same post — 500 participants, $500 API credits each, $100K total prize pool. Worth knowing exists.

### AI Elements: what a real implementation looks like

**Source:** [How I built an AI productivity assistant with Vercel AI Elements (LogRocket, Nov 2025 / updated March 2026)](https://blog.logrocket.com/vercel-ai-elements/).

Emmanuel John's walk-through is the cleanest end-to-end example I've seen. The takeaway in one sentence: **what used to take a week of streaming-state-handling, accessibility, markdown-rendering, and reconnection-logic now takes about an hour.** Two specifics worth keeping in your back pocket:

- **The exact install sequence for a working chat:** `npx ai-elements@latest add conversation message prompt-input response actions reasoning`. Those six components are 90% of what a polished AI chat needs.
- **The `Reasoning` component is the underrated one.** It's a collapsible expandable that renders the model's thinking with a streaming spinner — for a hackathon demo, having a "show reasoning" toggle that pops open as the model thinks reads as *"this is a real product."* Wire it up by enabling `sendReasoning: true` on `result.toUIMessageStreamResponse()` server-side and the `<Reasoning>` element handles the rest.

### What didn't make the cut

A few sources I read but won't recommend because the substance was thinner than the search snippet suggested:

- **Most of the "10 Best Claude Code Plugins"-style listicles** are AI-written aggregations of plugin marketplace metadata. The TurboDocx and ClaudeFast lists are above-average; the rest are dressing for SEO.
- **Heeki Park's spec-driven dev post** is fine but covers the same ground as the VelvetShark post less concisely. Skip if time-constrained.
- **The "everything-claude-code" hackathon-winner repo (affaan-m)** is real and valuable, but it's an enormous skill-pack better suited to a long-running project than a 6-hour build. The relevant high-level idea — eval-driven development, where every spec ships with checkable acceptance criteria — is already absorbed into the playbook above. The full kit is at [github.com/affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) if you want to install it for a future project.

### The single highest-ROI thing to do tonight

If you only have 20 minutes before the hackathon, do this, in this order:

1. Install the `/interview` slash command from [VelvetShark](https://velvetshark.com/stop-prompting-claude-code-let-it-interview-you) (the YAML version, ~30 lines, drops in `~/.claude/commands/interview.md`).
2. Install the [Frontend Design plugin](https://claude.com/plugins/frontend-design) (`/plugin install frontend-design@anthropics/claude-code`).
3. Install the Playwright MCP (`claude mcp add playwright npx @playwright/mcp`).
4. Skim Boris's seven-section workflow ([paddo.dev summary](https://paddo.dev/blog/how-boris-uses-claude-code/) — ~5 minutes) and copy his PostToolUse formatting hook into your starter repo.
5. Bookmark Karthik's 47-minute walkthrough ([Medium post](https://medium.com/@karthikmulugu/i-let-claude-design-my-entire-website-using-shadcn-magic-ui-and-playwright-mcp-heres-what-ad24860b705b)) and follow the same flow at hour zero.

The full reading list, for anyone who wants the unsynthesized originals: [Boris on X](https://x.com/bcherny/status/2007179832300581177) · [paddo.dev summary](https://paddo.dev/blog/how-boris-uses-claude-code/) · [VelvetShark interview pattern](https://velvetshark.com/stop-prompting-claude-code-let-it-interview-you) · [Thariq's original tweet](https://x.com/trq212/status/2005315275026260309) · [Karthik shadcn+MagicUI+Playwright](https://medium.com/@karthikmulugu/i-let-claude-design-my-entire-website-using-shadcn-magic-ui-and-playwright-mcp-heres-what-ad24860b705b) · [Wiegold Frontend Design plugin](https://thomas-wiegold.com/blog/claude-code-frontend-design-plugin/) · [Taskos Conductor walkthrough](https://georgetaskos.medium.com/scaling-the-loop-run-5-claude-code-sessions-in-parallel-with-conductor-build-539b52888a81) · [Anthropic 4.6 hackathon winners](https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon) · [LogRocket AI Elements walkthrough](https://blog.logrocket.com/vercel-ai-elements/) · [Anthropic Frontend Design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md).

---

## Appendix A — The hour-by-hour plan

| Hour | What you're doing | Key artifacts produced |
|---|---|---|
| **0:00–0:15** | Open Claude Code in an empty repo. Tell it your one-paragraph idea. Tell it to interview you. | Half a `SPEC.md` |
| **0:15–0:45** | Answer Claude's questions. Push back when answers are wrong. End with: "Now write the complete `SPEC.md` to disk, including a numbered task list." | Complete `SPEC.md`, `CLAUDE.md` |
| **0:45–1:00** | Scaffold with `create-next-app`, install shadcn/ui v4, AI Elements, AI SDK, Clerk, Convex. Set env vars. First Vercel deploy from an empty page. Verify live URL. | Live skeleton at `<your-app>.vercel.app` |
| **1:00–1:30** | Plan-mode plan for the *core* AI feature (chat, agent, processor). Iterate the plan twice. Accept. Auto-accept edits. Walk away. | Working core feature on `feature/core` |
| **1:30–2:30** | Open second worktree in Conductor for the design pass: Frontend Design plugin + Playwright MCP screenshots + your design language. Third worktree starts the secondary feature. | Polished hero/landing, second feature in progress |
| **2:30–3:30** | Merge worktrees. Resolve any conflicts with `/resolve-merge-conflicts`. Test the demo flow end to end. Identify the *one* signature animation. | Merged main branch, deployed |
| **3:30–4:30** | Polish pass: seed data with Faker, optimistic updates, skeleton screens, the signature animation, demo-mode route that auto-signs you in. | Demo-grade app |
| **4:30–5:30** | Buffer / second feature / killer detail (sound effect, transition, easter egg). Practice the 3-minute demo path. Record a Loom backup. | Demo rehearsal video |
| **5:30–6:30** | Two more demo run-throughs. Fix anything that breaks. Don't add features. Take a real break for 10 minutes. | Calm engineer |

Rule: **at hour 5, stop adding features.** Polish from hour 5 onwards.

---

## Appendix B — A `CLAUDE.md` template to copy

```markdown
# Project: <product name>

## What this is
One-paragraph product summary. Read `SPEC.md` for everything else.

## Stack — do not deviate
- Next.js 15 App Router, React 19, TypeScript strict mode
- Tailwind v4 (no `tailwind.config.js`; tokens are CSS vars in `globals.css`)
- shadcn/ui v4 (CLI: `pnpm dlx shadcn@latest add ...`)
- AI Elements for chat/agent UI
- AI SDK 5+ for AI plumbing; `@ai-sdk/anthropic` provider; Claude Sonnet 4.6
- Convex for DB and server functions
- Clerk for auth
- Package manager: pnpm

## House rules
- Use Server Components by default; only mark `"use client"` when needed.
- All AI tool definitions live in `src/lib/ai/tools.ts`.
- All system prompts live in `src/lib/ai/prompts.ts`.
- Server actions go in `src/app/actions/`.
- Never wrap a server action in `useEffect`.
- Never commit `.env*` files.
- Prefer `useOptimistic` for any user-action followed by a network call.
- No spinners; use `<Skeleton>` from shadcn.

## Design language
Cite: Linear (restraint, typography hierarchy), Vercel (monochrome + single accent, generous whitespace), Raycast (density without clutter).
Tone: editorial, technical, confident, never twee.
Constraints: dark mode primary; one display face, one body face; 8px spacing scale; 0.5rem radius; no emojis; no rainbow gradients.
Differentiation: each AI moment should feel inevitable, not bolted on.

## How to use the design loop
When making visual changes, use the Playwright MCP to screenshot the page and verify against the design language. Iterate until it matches.

## Workflow
- Start every session by reading `SPEC.md` and `PROGRESS.md`.
- Append every completed task to `PROGRESS.md`.
- Log non-obvious decisions in `DECISIONS.md`.
- If you discover a bug pattern I should never see again, append a rule to this `CLAUDE.md`.

## Mistakes to never repeat
<empty at start; you will fill this in as you go>
```

---

## Final advice

The thing that separates the people who win these is not the tools. The tools are commodity now. It's the time they spend in the first 45 minutes specifying what they're building and to whom they're showing it. The Anthropic Opus 4.6 hackathon winners weren't senior engineers — they were domain experts who knew exactly what they wanted before they sat down ([source](https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon)). Mike, the CrossBeam winner, didn't write a line of code. He wrote a spec.

Plan for 45 minutes. Polish for 90. Build the rest of the time with three Claudes running in parallel and a screenshot loop closing the gap between your taste and what's on screen.

Good luck. Ship something embarrassingly good.
