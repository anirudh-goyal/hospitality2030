export const runtime = "nodejs";

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ELEVENLABS_API_KEY is not set" },
      { status: 500 }
    );
  }

  const incoming = await req.formData();
  const file = incoming.get("file");
  if (!(file instanceof Blob)) {
    return Response.json({ error: "file field missing" }, { status: 400 });
  }

  const outgoing = new FormData();
  outgoing.set("file", file, "audio.webm");
  outgoing.set("model_id", "scribe_v1");
  outgoing.set("language_code", "eng");
  outgoing.set("tag_audio_events", "false");
  outgoing.set("diarize", "false");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: outgoing,
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json(
      { error: "ElevenLabs error", status: res.status, detail },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { text?: string };
  return Response.json({ text: data.text ?? "" });
}
