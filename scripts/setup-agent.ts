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

const ADD_HIGHLIGHT_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    fact: {
      type: "string",
      description:
        "One concrete fact about the guest worth surfacing in the brief, written as a single short sentence. Strict: 6 to 15 words. Renders on a single line in the brief's Highlights row, so brevity matters. Example: 'Drinks Casa Dragones Joven, neat, after dinner.'",
    },
    source: {
      type: "string",
      description:
        "Where the fact came from, mono-tagged and right-aligned in the row. Strict: 3 to 10 words. Use role + property + month/day; never staff names. Example: 'Restaurant, Rosewood London - Apr 22'.",
    },
  },
  required: ["fact", "source"],
};

const ADD_STAFF_NOTE_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    text: {
      type: "string",
      description:
        "A single 'do not mention' or operational sensitivity for the brief's Staff Notes block. Strict: 6 to 15 words. Renders as a short bullet — keep it scannable. Examples: 'Severe shellfish allergy - do not mention by name at dining.' or 'Spouse not traveling - do not reference her.'",
    },
  },
  required: ["text"],
};

const SYSTEM_PROMPT = `You are the Observation Agent for Sense, the staff intelligence layer at Rosewood Hong Kong.

Your job: given a guest snapshot and a newly captured observation, decide which part(s) of the Guest Brief should be updated, and write the update(s). You have three output channels:

(A) submit_gesture — propose a new pre-arrival or in-stay gesture for the guest. Use when the observation suggests a thoughtful, actionable thing the property could do for them (an experience, an amenity, a coordinated moment).

(B) add_highlight — record a durable fact about the guest. Use when the observation reveals a preference, habit, family detail, milestone, or interest that staff should remember on future stays. Highlights are short single-line facts with a source tag.

(C) add_staff_note — record a 'do not mention' or operational sensitivity. Use when the observation involves an allergy, a relationship/health detail to handle with care, a strong dislike, or anything where doing the wrong thing would hurt more than doing nothing.

Most observations map to exactly one channel. Occasionally one observation produces two records (e.g. a peanut allergy → a staff note AND a highlight about dietary preference). Rarely all three. Call the appropriate tool(s); if the observation is purely trivial and produces no useful brief update, end your turn without calling any tool.

Your workflow on every invocation:
1. Read the kickoff message. It contains the guest profile, all observations (with the newest one flagged), external signals, current sensitivities (= staff notes), highlights (= keyFacts), and existing suggested gestures.
2. Decide which channels apply.
3. If (A) submit_gesture applies: read the experiences directory at ${MOUNT_PATH} using the read tool, then optionally use web_search to briefly check today's weather in the property's city and any major news events during the guest's stay window. Two or three concise searches are enough — don't over-research. Skip web tools if the gesture obviously doesn't depend on the answer. If only (B) or (C) apply, you can skip the directory read and web search entirely.
4. Call the appropriate tool(s). One call per record. Do not write a chat reply.

Tool-specific constraints:

submit_gesture:
- Spend authority: USD $200 / guest / day (approximately HKD $1,560) auto-approves. Anything above must be tagged availability: "requires_approval".
- Never propose anything that contradicts the guest's sensitivities (staff notes).
- Never repeat a gesture (or near-duplicate) already in the existing suggestedGestures list.
- Prefer locally-rooted Hong Kong experiences over generic luxury tropes.

add_highlight:
- fact: 6 to 15 words. One concrete sentence. Renders on a single brief row, so brevity matters. Example: "Drinks Casa Dragones Joven, neat, after dinner."
- source: 3 to 10 words. Role + property + month/day; never staff names. Example: "Restaurant, Rosewood London - Apr 22".
- Don't add a highlight that duplicates an existing keyFact.

add_staff_note:
- text: 6 to 15 words. Renders as a bullet under "Do not mention". Be operational, not narrative. Example: "Severe shellfish allergy - do not mention by name at dining."
- Don't add a note that duplicates an existing sensitivity.

Shared writing rules:
- The rationale/fact/text fields are read by working staff in real time. Write like a colleague: specific, no marketing language, no adjectives like "curated" or "bespoke".
- When citing the source of a fact, refer to the staff member by their role and property, never by name. For example: "a bartender at Rosewood London logged a standing order for Casa Dragones Joven," not "Daniel R. logged a standing order for Casa Dragones Joven." Same rule for advisors, GMs, and any other named source — anonymize as "the guest's advisor," "the GM at Rosewood Hong Kong," etc. The guest's own name is fine to use.`;

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
        "Add a new pre-arrival or in-stay gesture to the brief's Suggested Gestures block. Use for actionable property-side ideas the team could execute. Call once per gesture; usually at most one per invocation.",
      input_schema: SUBMIT_GESTURE_INPUT_SCHEMA,
    },
    {
      type: "custom" as const,
      name: "add_highlight",
      description:
        "Add a single short fact to the brief's Highlights block (a.k.a. keyFacts). Use for durable guest preferences, habits, family details, milestones, or interests staff should remember. Renders as a one-line row with a mono source tag on the right. Strict word caps: fact 6-15 words, source 3-10 words.",
      input_schema: ADD_HIGHLIGHT_INPUT_SCHEMA,
    },
    {
      type: "custom" as const,
      name: "add_staff_note",
      description:
        "Add a single 'do not mention' or operational sensitivity to the brief's Staff Notes block (a.k.a. sensitivities). Use for allergies, relationship/health details, strong dislikes — things the team must handle with care. Renders as a short bullet. Strict word cap: 6-15 words.",
      input_schema: ADD_STAFF_NOTE_INPUT_SCHEMA,
    },
  ];

  let agentId = process.env.ANTHROPIC_AGENT_ID;
  if (agentId) {
    const current = await client.beta.agents.retrieve(agentId);
    const updated = await client.beta.agents.update(agentId, {
      version: current.version,
      name: "Sense Observation Agent",
      model: "claude-sonnet-4-6",
      system: SYSTEM_PROMPT,
      tools,
    });
    console.log(
      `      updated agent_id: ${updated.id} (version ${updated.version})`
    );
  } else {
    const agent = await client.beta.agents.create({
      name: "Sense Observation Agent",
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
