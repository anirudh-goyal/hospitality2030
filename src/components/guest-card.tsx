import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Props = {
  slug: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  loyaltyTier: string;
  suite: string;
  carEtaIso: string;
  keyFact?: string;
};

function formatEta(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`;
}

export function GuestCard(p: Props) {
  return (
    <Link href={`/guests/${p.slug}`} className="block group">
      <Card className="flex flex-row items-center gap-4 p-4 transition-colors group-hover:bg-[var(--elevated)]">
        <Avatar className="size-10 [&_img]:grayscale [&_img]:opacity-85">
          <AvatarImage src={p.photoUrl} alt="" />
          <AvatarFallback className="font-mono text-xs">
            {initials(p.firstName, p.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              className="font-display"
              style={{ fontSize: "1.125rem", fontWeight: 500 }}
            >
              {p.firstName} {p.lastName}
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              Suite {p.suite}
            </span>
            <Badge
              variant="outline"
              className="font-mono border-[var(--accent)] text-[var(--accent)] rounded-full"
            >
              {p.loyaltyTier}
            </Badge>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-[0.8125rem] text-[var(--text-primary)]">
            {formatEta(p.carEtaIso)}
          </div>
          {p.keyFact ? (
            <div className="text-xs text-[var(--text-tertiary)] max-w-[200px]">
              {p.keyFact}
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
