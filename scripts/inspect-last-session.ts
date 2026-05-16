import Anthropic from "@anthropic-ai/sdk";

async function main() {
  const client = new Anthropic();
  const sessions = await client.beta.sessions.list({
    agent_id: process.env.ANTHROPIC_AGENT_ID!,
    order: "desc",
  });

  const latest = sessions.data[0];
  if (!latest) {
    console.log("No sessions found for agent.");
    return;
  }

  const full = await client.beta.sessions.retrieve(latest.id);
  console.log(`Session ${latest.id}`);
  console.log(`  status: ${full.status}`);
  console.log(`  created: ${full.created_at}`);
  console.log(`  resources:`);
  for (const r of full.resources ?? []) {
    console.log(`    - ${JSON.stringify(r)}`);
  }
  console.log("");
  console.log("Events:");

  for await (const event of client.beta.sessions.events.list(latest.id)) {
    const e = event as Record<string, unknown>;
    const type = e.type as string;
    const detail =
      type === "agent.tool_use" || type === "agent.custom_tool_use"
        ? ` name=${e.name as string} input=${JSON.stringify(e.input).slice(0, 200)}`
        : type === "agent.tool_result" || type === "agent.custom_tool_result"
        ? ` content=${JSON.stringify((e.content as unknown[]) ?? []).slice(0, 200)}`
        : type === "agent.message"
        ? ` content=${JSON.stringify(e.content).slice(0, 200)}`
        : type === "session.status_idle"
        ? ` stop_reason=${(e.stop_reason as { type: string }).type}`
        : "";
    console.log(`  ${type}${detail}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
