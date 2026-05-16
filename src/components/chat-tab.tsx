"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import {
  BrainIcon,
  FileTextIcon,
  GlobeIcon,
  LinkIcon,
  RotateCcwIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import type { Doc } from "../../convex/_generated/dataModel";
import type { ChatEvent } from "@/app/api/agent/chat/route";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { InputGroupAddon } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";

type Step = {
  id: string;
  kind: "thinking" | "read" | "web_search" | "web_fetch";
  label: string;
  status: "active" | "done";
};

type ToolCall = {
  id: string;
  name: "submit_gesture" | "add_highlight" | "add_staff_note";
  input: Record<string, unknown>;
  result: "ok" | "rejected";
  resultMessage?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps: Step[];
  toolCalls: ToolCall[];
  error?: string;
};

type Props = {
  guest: Doc<"guests">;
};

const STEP_ICONS: Record<Step["kind"], typeof BrainIcon> = {
  thinking: BrainIcon,
  read: FileTextIcon,
  web_search: GlobeIcon,
  web_fetch: LinkIcon,
};

const TOOL_LABELS: Record<ToolCall["name"], string> = {
  submit_gesture: "submit_gesture",
  add_highlight: "add_highlight",
  add_staff_note: "add_staff_note",
};

const TOOL_HUMAN_LABELS: Record<ToolCall["name"], string> = {
  submit_gesture: "Added gesture to brief",
  add_highlight: "Added highlight to brief",
  add_staff_note: "Added staff note to brief",
};

export function ChatTab({ guest }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const suggestionList = useMemo(
    () => [
      `What do we know about ${guest.firstName}'s drink preferences?`,
      "Any allergies or sensitivities I should know about?",
      `Suggest a welcome gesture for ${guest.firstName} under HKD 1,000`,
      "What did their advisor flag last time?",
    ],
    [guest.firstName]
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: "user",
        content: trimmed,
        steps: [],
        toolCalls: [],
      };
      const placeholderId = nanoid();
      const placeholder: ChatMessage = {
        id: placeholderId,
        role: "assistant",
        content: "",
        steps: [],
        toolCalls: [],
      };

      const nextHistory = [...messages, userMessage];
      setMessages([...nextHistory, placeholder]);
      setStreaming(true);

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestId: guest._id,
            messages: nextHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => "");
          throw new Error(detail || `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let event: ChatEvent;
            try {
              event = JSON.parse(line) as ChatEvent;
            } catch {
              continue;
            }
            applyEvent(placeholderId, event, setMessages);
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId ? { ...m, error: message } : m
          )
        );
      } finally {
        if (abortRef.current === controller) {
          setStreaming(false);
          abortRef.current = null;
        }
      }
    },
    [guest._id, messages, streaming]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setMessages([]);
  }, []);

  const retry = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => {
      // Drop the failed assistant placeholder so retry produces a fresh one.
      const lastUserIdx = prev.findIndex((m) => m.id === lastUser.id);
      return prev.slice(0, lastUserIdx + 1);
    });
    // setState above is async; defer send to next tick.
    setTimeout(() => {
      send(lastUser.content);
    }, 0);
  }, [messages, send]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)]">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[1.125rem] tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)", fontWeight: 500 }}
          >
            Concierge
          </span>
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            · beta
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={!hasMessages && !streaming}
          className="text-[0.8125rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5"
        >
          <RotateCcwIcon className="size-3.5" />
          New chat
        </Button>
      </div>

      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="max-w-3xl mx-auto w-full px-6 py-6 gap-6">
          {!hasMessages ? (
            <EmptyState
              firstName={guest.firstName}
              suggestions={suggestionList}
              onPick={send}
            />
          ) : (
            messages.map((msg) => (
              <ChatTurn
                key={msg.id}
                message={msg}
                streaming={streaming}
                onRetry={retry}
              />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="px-6 pt-2 pb-5">
        <div className="max-w-3xl mx-auto">
          <PromptInput
            onSubmit={async (msg) => {
              await send(msg.text ?? "");
            }}
            className="[&_div[data-slot=input-group]]:rounded-2xl [&_div[data-slot=input-group]]:bg-[var(--elevated)] [&_div[data-slot=input-group]]:border-[var(--border)] [&_div[data-slot=input-group]]:shadow-[0_8px_24px_rgba(0,0,0,0.25)] [&_div[data-slot=input-group]]:px-1 [&_div[data-slot=input-group]]:py-1"
          >
            <PromptInputTextarea
              name="message"
              placeholder={`Ask anything about ${guest.firstName}...`}
              disabled={streaming}
              className="min-h-[3.5rem] px-3 py-2.5 text-[0.9375rem] leading-relaxed"
            />
            <InputGroupAddon align="block-end" className="justify-end px-2 pb-2">
              <PromptInputSubmit
                status={streaming ? "streaming" : undefined}
                onStop={() => abortRef.current?.abort()}
                className="rounded-full size-9"
              />
            </InputGroupAddon>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}

function applyEvent(
  placeholderId: string,
  event: ChatEvent,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) {
  setMessages((prev) =>
    prev.map((m) => {
      if (m.id !== placeholderId) return m;
      switch (event.type) {
        case "step_start":
          return {
            ...m,
            steps: [
              ...m.steps,
              {
                id: event.id,
                kind: event.kind,
                label: event.label,
                status: "active",
              },
            ],
          };
        case "step_end":
          return {
            ...m,
            steps: m.steps.map((s) =>
              s.id === event.id ? { ...s, status: "done" } : s
            ),
          };
        case "message_delta":
          return { ...m, content: m.content + event.text };
        case "tool_call":
          return {
            ...m,
            toolCalls: [
              ...m.toolCalls,
              {
                id: event.id,
                name: event.name,
                input: (event.input as Record<string, unknown>) ?? {},
                result: event.result,
                resultMessage: event.resultMessage,
              },
            ],
          };
        case "error":
          return { ...m, error: event.message };
        case "done":
        default:
          return m;
      }
    })
  );
}

function EmptyState({
  firstName,
  suggestions,
  onPick,
}: {
  firstName: string;
  suggestions: string[];
  onPick: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-12">
      <p
        className="text-[1.75rem] tracking-tight text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-cormorant)", fontWeight: 500 }}
      >
        Ask anything about {firstName}.
      </p>
      <p className="text-[0.875rem] text-[var(--text-tertiary)] max-w-[28rem]">
        Pull history, sensitivities, or recent observations. Propose gestures,
        highlights, or staff notes — nothing writes to the brief until you say
        yes.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-[36rem]">
        {suggestions.map((s) => (
          <Suggestion
            key={s}
            suggestion={s}
            onClick={onPick}
            className="text-[0.8125rem] border-[var(--border)] bg-[var(--card)] hover:bg-[var(--elevated)] text-[var(--text-secondary)] rounded-full"
          />
        ))}
      </div>
    </div>
  );
}

function ChatTurn({
  message,
  streaming,
  onRetry,
}: {
  message: ChatMessage;
  streaming: boolean;
  onRetry: () => void;
}) {
  if (message.role === "user") {
    return (
      <Message from="user">
        <MessageContent>
          <p className="text-[0.9375rem] leading-relaxed">{message.content}</p>
        </MessageContent>
      </Message>
    );
  }

  const hasSteps = message.steps.length > 0;
  const isLastStreaming =
    streaming && message.content === "" && !message.error;
  const replyStarted = message.content.length > 0;

  return (
    <Message from="assistant">
      <MessageContent>
        {hasSteps && (
          <ChainOfThought
            defaultOpen={!replyStarted}
            open={replyStarted ? undefined : true}
          >
            <ChainOfThoughtHeader>
              {replyStarted
                ? `Researched · ${message.steps.length} step${message.steps.length === 1 ? "" : "s"}`
                : isLastStreaming
                  ? "Researching..."
                  : `Researched · ${message.steps.length} step${message.steps.length === 1 ? "" : "s"}`}
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {message.steps.map((step) => {
                const Icon = STEP_ICONS[step.kind];
                return (
                  <ChainOfThoughtStep
                    key={step.id}
                    icon={Icon}
                    label={step.label}
                    status={step.status === "active" ? "active" : "complete"}
                  />
                );
              })}
            </ChainOfThoughtContent>
          </ChainOfThought>
        )}

        {isLastStreaming && !hasSteps && (
          <p className="text-[0.8125rem] text-[var(--text-tertiary)] italic">
            Thinking...
          </p>
        )}

        {replyStarted && (
          <MessageResponse className="text-[0.9375rem] leading-relaxed">
            {message.content}
          </MessageResponse>
        )}

        {message.toolCalls.map((call) => (
          <ToolCallCard key={call.id} call={call} />
        ))}

        {message.error && (
          <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[0.8125rem] text-[var(--text-secondary)] flex items-center justify-between gap-3">
            <span className="text-red-400/80">{message.error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7 px-2 text-[0.75rem]"
            >
              Retry
            </Button>
          </div>
        )}
      </MessageContent>
    </Message>
  );
}

function ToolCallCard({ call }: { call: ToolCall }) {
  const preview = JSON.stringify(call.input, null, 2);
  const failed = call.result === "rejected";

  return (
    <div
      className="rounded-md bg-[var(--card)] border border-[var(--border)] px-3 py-2.5 text-[0.8125rem] flex flex-col gap-1.5"
      style={{ borderLeftWidth: 2, borderLeftColor: "var(--accent)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.75rem] text-[var(--text-secondary)]">
          {TOOL_LABELS[call.name]}
        </span>
        <span
          className={`flex items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em] ${failed ? "text-red-400/80" : "text-[var(--accent)]"}`}
        >
          {failed ? (
            <>
              <XIcon className="size-3" /> rejected
            </>
          ) : (
            <>
              <CheckIcon className="size-3" /> {TOOL_HUMAN_LABELS[call.name]}
            </>
          )}
        </span>
      </div>
      <pre className="font-mono text-[0.75rem] text-[var(--text-tertiary)] whitespace-pre-wrap break-words leading-relaxed">
        {preview}
      </pre>
      {failed && call.resultMessage && (
        <p className="text-[0.75rem] text-red-400/80">{call.resultMessage}</p>
      )}
    </div>
  );
}
