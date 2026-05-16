"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { experimental_useObject } from "@ai-sdk/react";
import { Mic, Square } from "lucide-react";
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
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

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

  function toggleMic() {
    type SRConstructor = new () => SpeechRecognitionLike;
    const SR: SRConstructor | undefined =
      typeof window !== "undefined"
        ? ((window as unknown as Record<string, unknown>)
            .webkitSpeechRecognition as SRConstructor) ??
          ((window as unknown as Record<string, unknown>)
            .SpeechRecognition as SRConstructor)
        : undefined;
    if (!SR) return;
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++)
        transcript += event.results[i][0].transcript;
      setText(transcript);
    };
    r.onend = () => setRecording(false);
    r.start();
    recognitionRef.current = r;
    setRecording(true);
  }

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function onSubmit() {
    if (!guest || !text.trim()) return;
    setPhase("extracting");
    submit({ transcript: text, guestId: guest.id });
  }

  const disabled = !guest || !text.trim() || phase !== "idle";

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
          placeholder="Speak or type the observation..."
          className="pr-14 bg-[var(--card)] border-[var(--border)] text-[var(--text-primary)] text-[0.9375rem] leading-relaxed resize-y"
        />
        <button
          type="button"
          onClick={toggleMic}
          aria-label={recording ? "Stop recording" : "Start recording"}
          className="absolute top-3 right-3 size-9 rounded-full flex items-center justify-center border border-[var(--border)] cursor-pointer transition-all"
          style={{
            background: recording ? "var(--accent)" : "transparent",
            color: recording ? "#0a0909" : "var(--text-secondary)",
            boxShadow: recording ? "0 0 0 4px var(--accent-muted)" : "none",
          }}
        >
          {recording ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
        </button>
      </div>

      <Button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full mt-6 font-mono text-sm h-auto py-3.5 rounded-md"
        style={{
          background: disabled ? "var(--surface)" : "var(--accent)",
          color: disabled ? "var(--text-tertiary)" : "#0a0909",
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

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: {
    results: { [k: number]: { [k: number]: { transcript: string } } } & {
      length: number;
    };
  }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};
