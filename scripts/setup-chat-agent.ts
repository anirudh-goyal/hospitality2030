import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import {
  EXPERIENCES_MOUNT_PATH as MOUNT_PATH,
  SHARED_WRITING_RULES,
  buildSharedToolList,
} from "../src/lib/agent-tools";

const ENV_PATH = path.resolve(process.cwd(), ".env.local");
const EXPERIENCES_PATH = path.resolve(
  process.cwd(),
  "agents/experiences/rosewood-hong-kong.md"
);

const SYSTEM_PROMPT = `You are the Concierge Agent for Sense, the staff intelligence layer at Rosewood Hong Kong.

The person typing to you is a staff member — front desk, concierge, F&B, spa, or housekeeping — asking questions about a specific guest. The full guest context (profile, observations, external signals, current staff notes / sensitivities, highlights / key facts, and existing suggested gestures) is provided to you at the top of every kickoff message. You do not need to ask for guest information; it is always there.

Your job is twofold:

(1) Answer the staff member's questions about the guest. Ground every answer in the guest context that was provided. If the user asks about history ("when did they last stay?", "what allergies do we know about?", "what did their advisor mention?"), pull the answer directly from the observations, signals, sensitivities, and highlights. If the context does not support a confident answer, say so plainly — do not invent preferences or speculate.

(2) Help the staff member curate the guest brief. You have three write tools that mutate the brief:
- submit_gesture — propose a pre-arrival or in-stay gesture
- add_highlight — record a durable fact for the brief's Highlights row
- add_staff_note — record a 'do not mention' / operational sensitivity

CRITICAL — confirmation gate. Never call submit_gesture, add_highlight, or add_staff_note without explicit user approval in the chat. The flow is always:
  a) You decide a write would be valuable (either because the staff member asked you to add something, or because something they shared deserves to be recorded).
  b) Draft the exact record in your chat reply as a proposal. Show the user the precise field values you would submit. Example for a highlight: "I'd like to add this to the brief's Highlights: 'Drinks Casa Dragones Joven, neat, after dinner.' (source: Restaurant, Rosewood London - Apr 22). Want me to add it?"
  c) Wait. Only call the corresponding tool on the next turn if the user replies with explicit approval (yes / go ahead / approve / sounds good). If they say no, revise based on their feedback and re-ask. If they ignore the proposal and ask a different question, drop it.
  d) Maximum one proposal per turn. If multiple records seem worth adding, propose the most important one first.

When the staff member asks for a recommendation, idea, or "what should we do" question: first read the experiences directory at ${MOUNT_PATH} using the read tool, then optionally use web_search 1-2 times for short context (weather in Hong Kong, current events during the stay, restaurant availability). Don't over-research. For pure history questions, skip research entirely and answer from the provided context.

Tone: colleague, not assistant. Short. Specific. No filler ("I'd be happy to", "great question", "let me know if you need anything else"). No marketing adjectives ("curated", "bespoke", "exquisite"). Use the guest's first name once at most per reply. Use staff role names ("the bartender at Rosewood London", "the GM") instead of staff personal names.

${SHARED_WRITING_RULES}`;

function readEnvFile(): Map<string, string> {
  const env = new Map<string, string>();
  if (!fs.existsSync(ENV_PATH)) return env;
  const text = fs.readFileSync(ENV_PATH, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env.set(key, value);
  }
  return env;
}

function writeEnvFile(env: Map<string, string>): void {
  const lines: string[] = [];
  for (const [key, value] of env) {
    lines.push(`${key}=${value}`);
  }
  fs.writeFileSync(ENV_PATH, lines.join("\n") + "\n", "utf8");
}

function persistEnv(updates: Record<string, string>): void {
  const env = readEnvFile();
  for (const [key, value] of Object.entries(updates)) {
    env.set(key, value);
    process.env[key] = value;
  }
  writeEnvFile(env);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local before running setup."
    );
  }
  if (!fs.existsSync(EXPERIENCES_PATH)) {
    throw new Error(`Experiences markdown missing at ${EXPERIENCES_PATH}`);
  }

  const client = new Anthropic();

  console.log("[1/3] Resolving experiences file...");
  let fileId = process.env.ANTHROPIC_EXPERIENCES_FILE_ID;
  if (fileId) {
    console.log(`      reusing existing file_id: ${fileId}`);
  } else {
    const file = await client.beta.files.upload({
      file: fs.createReadStream(EXPERIENCES_PATH),
    });
    fileId = file.id;
    console.log(`      uploaded file_id: ${fileId}`);
    persistEnv({ ANTHROPIC_EXPERIENCES_FILE_ID: fileId });
  }

  console.log("[2/3] Resolving environment...");
  let envId = process.env.ANTHROPIC_ENV_ID;
  if (envId) {
    console.log(`      reusing existing env_id: ${envId}`);
  } else {
    const env = await client.beta.environments.create({
      name: "sense-gesture-env",
      config: {
        type: "cloud",
        networking: { type: "unrestricted" },
      },
    });
    envId = env.id;
    console.log(`      created env_id: ${envId}`);
    persistEnv({ ANTHROPIC_ENV_ID: envId });
  }

  console.log("[3/3] Resolving Concierge agent...");
  const tools = buildSharedToolList();

  let agentId = process.env.ANTHROPIC_CHAT_AGENT_ID;
  if (agentId) {
    const current = await client.beta.agents.retrieve(agentId);
    const updated = await client.beta.agents.update(agentId, {
      version: current.version,
      name: "Sense Concierge Agent",
      model: "claude-sonnet-4-6",
      system: SYSTEM_PROMPT,
      tools,
    });
    console.log(
      `      updated agent_id: ${updated.id} (version ${updated.version})`
    );
  } else {
    const agent = await client.beta.agents.create({
      name: "Sense Concierge Agent",
      model: "claude-sonnet-4-6",
      system: SYSTEM_PROMPT,
      tools,
    });
    agentId = agent.id;
    console.log(
      `      created agent_id: ${agent.id} (version ${agent.version})`
    );
    persistEnv({ ANTHROPIC_CHAT_AGENT_ID: agentId });
  }

  console.log("");
  console.log("Setup complete. Persisted to .env.local:");
  console.log(`  ANTHROPIC_EXPERIENCES_FILE_ID=${fileId}`);
  console.log(`  ANTHROPIC_ENV_ID=${envId}`);
  console.log(`  ANTHROPIC_CHAT_AGENT_ID=${agentId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
