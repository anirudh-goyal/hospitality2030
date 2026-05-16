import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const ENV_PATH = path.resolve(process.cwd(), ".env.local");
const EXPERIENCES_PATH = path.resolve(
  process.cwd(),
  "agents/experiences/rosewood-hong-kong.md"
);

const MOUNT_PATH =
  "/mnt/session/uploads/workspace/experiences/rosewood-hong-kong.md";

const SUBMIT_GESTURE_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    title: {
      type: "string",
      description:
        "Short, concrete name for the gesture (max 80 chars). Avoid adjectives like 'curated' or 'bespoke'.",
    },
    rationale: {
      type: "string",
      description:
        "Why this gesture for this guest right now (max 280 chars). Cite the observation or signal that inspired it.",
    },
    estCostHkd: {
      type: "number",
      minimum: 0,
      description: "Estimated cost in HKD. 0 is allowed for no-cost gestures.",
    },
    availability: {
      type: "string",
      enum: ["confirmed_in_directory", "novel_idea", "requires_approval"],
      description:
        "confirmed_in_directory if drawn from the experiences directory; novel_idea if your own invention within spend authority; requires_approval if estCostHkd exceeds 1560 HKD (USD $200) or the gesture needs front-office sign-off.",
    },
  },
  required: ["title", "rationale", "estCostHkd", "availability"],
};

const SYSTEM_PROMPT = `You are the Suggested Gesture agent for Sense, the staff intelligence layer at Rosewood Hong Kong.

Your job: given a guest snapshot and a newly captured observation, recommend ONE thoughtful gesture that will land in the Guest Brief. Recommend something that is specific, evidence-grounded, and a meaningful addition to the gestures already on the brief.

Your workflow on every invocation:
1. Read the kickoff message. It contains the guest profile, all observations (with the newest one flagged), external signals, current sensitivities, and existing suggested gestures.
2. Read the experiences directory at ${MOUNT_PATH} using the read tool. This is the curated catalogue of experiences this property offers, plus the spend policy and guardrails.
3. Use web_search to briefly check (a) today's weather and short-term forecast in the property's city and (b) any major news events in that city during the guest's stay window (protests, transit strikes, festivals, openings, weather warnings, anything that would meaningfully affect a gesture you might recommend). Two or three concise searches are enough — don't over-research. Skip a tool call if the gesture obviously doesn't depend on the answer.
4. Decide on a single gesture. You may draw from the directory or invent something novel within policy. If weather or a current event materially shapes the recommendation, reflect that briefly in the rationale (e.g. "rain forecast Thursday, so prefer an indoor experience").
5. Call the submit_gesture custom tool exactly once with your recommendation. Do not write a chat reply. Do not call submit_gesture more than once.

Constraints:
- Spend authority: USD $200 / guest / day (approximately HKD $1,560) auto-approves. Anything above must be tagged availability: "requires_approval".
- Never propose anything that contradicts the guest's sensitivities.
- Never repeat a gesture (or near-duplicate) already in the existing suggestedGestures list.
- Prefer locally-rooted Hong Kong experiences over generic luxury tropes.

The rationale field is read by working staff in real time. Write it like a colleague: under three sentences, specific, no marketing language.

When citing the source of a fact in the rationale, refer to the staff member by their role and property, never by name. For example: "A bartender at Rosewood London logged a standing order for Casa Dragones Joven," not "Daniel R. logged a standing order for Casa Dragones Joven." Same rule for advisors, GMs, and any other named source — anonymize as "the guest's advisor," "the GM at Rosewood Hong Kong," etc. The guest's own name is fine to use.`;

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

  console.log("[1/4] Uploading experiences markdown...");
  const file = await client.beta.files.upload({
    file: fs.createReadStream(EXPERIENCES_PATH),
  });
  console.log(`      file_id: ${file.id}`);
  persistEnv({ ANTHROPIC_EXPERIENCES_FILE_ID: file.id });

  console.log("[2/4] Resolving environment...");
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

  console.log("[3/4] Resolving agent...");
  const tools = [
    {
      type: "agent_toolset_20260401" as const,
      default_config: { enabled: false },
      configs: [
        { name: "read" as const, enabled: true },
        { name: "web_search" as const, enabled: true },
        { name: "web_fetch" as const, enabled: true },
      ],
    },
    {
      type: "custom" as const,
      name: "submit_gesture",
      description:
        "Submit your single final gesture recommendation. Call this exactly once when you are ready to answer.",
      input_schema: SUBMIT_GESTURE_INPUT_SCHEMA,
    },
  ];

  let agentId = process.env.ANTHROPIC_AGENT_ID;
  if (agentId) {
    const current = await client.beta.agents.retrieve(agentId);
    const updated = await client.beta.agents.update(agentId, {
      version: current.version,
      name: "Sense Suggested Gesture",
      model: "claude-sonnet-4-6",
      system: SYSTEM_PROMPT,
      tools,
    });
    console.log(
      `      updated agent_id: ${updated.id} (version ${updated.version})`
    );
  } else {
    const agent = await client.beta.agents.create({
      name: "Sense Suggested Gesture",
      model: "claude-sonnet-4-6",
      system: SYSTEM_PROMPT,
      tools,
    });
    agentId = agent.id;
    console.log(
      `      created agent_id: ${agent.id} (version ${agent.version})`
    );
    persistEnv({ ANTHROPIC_AGENT_ID: agentId });
  }

  console.log("[4/4] Setup complete.");
  console.log("");
  console.log("Persisted to .env.local:");
  console.log(`  ANTHROPIC_EXPERIENCES_FILE_ID=${file.id}`);
  console.log(`  ANTHROPIC_ENV_ID=${envId}`);
  console.log(`  ANTHROPIC_AGENT_ID=${agentId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
