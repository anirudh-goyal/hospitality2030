import { anthropic } from "@ai-sdk/anthropic";
import { streamObject } from "ai";
import { extractSchema } from "@/lib/ai/extract-schema";
import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { transcript } = (await req.json()) as {
    transcript: string;
    guestId?: string;
  };
  if (!transcript || transcript.trim().length < 3) {
    return new Response("Transcript too short", { status: 400 });
  }

  const result = streamObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: extractSchema,
    system: EXTRACTION_SYSTEM_PROMPT,
    prompt: transcript,
  });

  return result.toTextStreamResponse();
}
