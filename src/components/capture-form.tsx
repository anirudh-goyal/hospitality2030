"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { experimental_useObject } from "@ai-sdk/react";
import { Loader2, Mic, Square } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractSchema, type Extracted } from "@/lib/ai/extract-schema";
import { GuestPicker, type SelectedGuest } from "./guest-picker";
import { ExtractionPreview } from "./extraction-preview";

const STAFF = {
  name: "Sofia Reyes",
  role: "housekeeping",
  property: "Rosewood Hong Kong",
};

type Phase = "idle" | "extracting" | "saving" | "saved";
type MicState = "idle" | "recording" | "transcribing";

export function CaptureForm({
  initialGuest,
  initialPrefill,
}: {
  initialGuest: SelectedGuest;
  initialPrefill: string;
}) {
  const router = useRouter();
  const [guest, setGuest] = useState<SelectedGuest>(initialGuest);
  const [text, setText] = useState(initialPrefill);
  const [phase, setPhase] = useState<Phase>("idle");
  const [mic, setMic] = useState<MicState>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const capture = useMutation(api.observations.capture);

  const { object, submit, isLoading } = experimental_useObject<Extracted>({
    api: "/api/extract",
    schema: extractSchema,
    onFinish: async ({ object: final }) => {
      if (!guest || !final) return;
      setPhase("saving");
      await capture({
        guestId: guest.id,
        rawText: text,
        source: "voice",
        capturedBy: STAFF,
        extracted: final,
      });
      setPhase("saved");
      setTimeout(() => router.push(`/guests/${guest.slug}`), 1200);
    },
  });

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function transcribe(blob: Blob) {
    setMic("transcribing");
    const form = new FormData();
    form.set("file", blob, "observation.webm");
    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Transcribe failed (${res.status})`);
      const { text: transcript } = (await res.json()) as { text: string };
      setText((prev) => (prev ? `${prev.trim()} ${transcript}`.trim() : transcript));
    } catch (err) {
      console.error("Transcription error:", err);
    } finally {
      setMic("idle");
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType });
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stopStream();
        if (blob.size > 0) await transcribe(blob);
        else setMic("idle");
      };
      rec.start();
      recorderRef.current = rec;
      setMic("recording");
    } catch (err) {
      console.error("Mic permission error:", err);
      setMic("idle");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  function toggleMic() {
    if (mic === "recording") stopRecording();
    else if (mic === "idle") startRecording();
  }

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      stopStream();
    };
  }, []);

  function onSubmit() {
    if (!guest || !text.trim()) return;
    setPhase("extracting");
    submit({ transcript: text, guestId: guest.id });
  }

  const submitDisabled =
    !guest || !text.trim() || phase !== "idle" || mic !== "idle";
  const micDisabled = mic === "transcribing" || phase !== "idle";

  return (
    <div className="max-w-[560px] mx-auto px-6 py-12">
      <div className="section-label mb-3">New Observation</div>

      <GuestPicker value={guest} onChange={setGuest} />

      <div className="font-mono text-xs text-[var(--text-tertiary)] mt-2 mb-6">
        {STAFF.name} - {STAFF.role.replace("_", " ")} - {STAFF.property}
      </div>

      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={
            mic === "recording"
              ? "Listening..."
              : mic === "transcribing"
                ? "Transcribing with ElevenLabs Scribe..."
                : "Speak or type the observation..."
          }
          className="pr-14 bg-[var(--card)] border-[var(--border)] text-[var(--text-primary)] text-[0.9375rem] leading-relaxed resize-y"
          disabled={mic !== "idle"}
        />
        <button
          type="button"
          onClick={toggleMic}
          disabled={micDisabled}
          aria-label={
            mic === "recording"
              ? "Stop recording"
              : mic === "transcribing"
                ? "Transcribing"
                : "Start recording"
          }
          className="absolute top-3 right-3 size-9 rounded-full flex items-center justify-center border border-[var(--border)] cursor-pointer transition-all disabled:cursor-wait"
          style={{
            background: mic === "recording" ? "var(--accent)" : "transparent",
            color: mic === "recording" ? "#0a0909" : "var(--text-secondary)",
            boxShadow:
              mic === "recording" ? "0 0 0 4px var(--accent-muted)" : "none",
          }}
        >
          {mic === "recording" ? (
            <Square className="size-3.5" />
          ) : mic === "transcribing" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Mic className="size-3.5" />
          )}
        </button>
      </div>

      {mic !== "idle" ? (
        <div className="font-mono text-xs text-[var(--text-tertiary)] mt-2">
          {mic === "recording" ? "Recording..." : "Transcribing..."}
        </div>
      ) : null}

      <Button
        onClick={onSubmit}
        disabled={submitDisabled}
        className="w-full mt-6 font-mono text-sm h-auto py-3.5 rounded-md"
        style={{
          background: submitDisabled ? "var(--surface)" : "var(--accent)",
          color: submitDisabled ? "var(--text-tertiary)" : "#0a0909",
        }}
      >
        {phase === "idle" && "Capture observation"}
        {phase === "extracting" && "Capturing..."}
        {phase === "saving" && "Saving..."}
        {phase === "saved" && "Saved"}
      </Button>

      {(isLoading || object) && (
        <div className="mt-8">
          <ExtractionPreview partial={object} />
        </div>
      )}
    </div>
  );
}
