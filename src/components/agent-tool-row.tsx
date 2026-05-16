import { FileText, Globe, Search, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  timestampIso: string;
  eventType: string;
  tool?: string;
  params?: string;
  resultPreview?: string;
  showCursor?: boolean;
};

const TYPE_META: Record<
  string,
  { color: string; icon: LucideIcon; label: string }
> = {
  web_search: { color: "var(--accent)", icon: Search, label: "search" },
  web_fetch: { color: "var(--accent-muted)", icon: Globe, label: "fetch" },
  file_write: {
    color: "var(--sensitivity)",
    icon: FileText,
    label: "write",
  },
  synthesis: {
    color: "var(--text-primary)",
    icon: Sparkles,
    label: "synthesize",
  },
};

function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function AgentToolRow({
  timestampIso,
  eventType,
  tool,
  params,
  resultPreview,
  showCursor,
}: Props) {
  const meta = TYPE_META[eventType] ?? {
    color: "var(--text-tertiary)",
    icon: Sparkles,
    label: eventType,
  };
  const Icon = meta.icon;
  return (
    <div className="font-mono text-[0.75rem] py-1.5 leading-relaxed">
      <div className="flex items-baseline gap-2">
        <span className="text-[var(--text-tertiary)] shrink-0">
          [{timeOnly(timestampIso)}]
        </span>
        <Icon className="size-3 shrink-0" style={{ color: meta.color }} />
        <span
          style={{
            color: meta.color,
            fontWeight: eventType === "synthesis" ? 500 : 400,
          }}
        >
          {tool ?? meta.label}
        </span>
        {params ? (
          <span className="text-[var(--text-secondary)] truncate">
            {params.length > 50 ? params.slice(0, 50) + "..." : params}
          </span>
        ) : null}
        {showCursor ? (
          <span
            className="text-[var(--accent)]"
            style={{ animation: "blink 1s steps(1) infinite" }}
          >
            |
          </span>
        ) : null}
      </div>
      {resultPreview ? (
        <div className="pl-7 text-[var(--text-tertiary)] truncate">
          {resultPreview}
        </div>
      ) : null}
    </div>
  );
}
