import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
      <Card className="flex flex-row items-center gap-4 p-4 transition-colors group-hover:bg-[var(--elevated)] group-hover:border-[var(--accent)]/30">
        <Avatar className="size-11 [&_img]:grayscale">
          <AvatarImage src={p.photoUrl} alt="" />
          <AvatarFallback className="text-[0.8125rem] font-medium bg-[var(--surface)]">
            {initials(p.firstName, p.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[1rem] font-medium text-[var(--text-primary)]">
              {p.firstName} {p.lastName}
            </span>
            <Badge
              variant="outline"
              className="font-mono text-[0.6875rem] border-[var(--accent)] text-[var(--accent)] rounded-full"
            >
              {p.loyaltyTier}
            </Badge>
            <span className="text-[0.8125rem] text-[var(--text-secondary)]">
              Suite {p.suite}
            </span>
          </div>
          {p.keyFact ? (
            <div className="text-[0.8125rem] text-[var(--text-tertiary)] mt-1">
              {p.keyFact}
            </div>
          ) : null}
        </div>

        <div className="text-right shrink-0 flex items-center gap-3">
          <div>
            <div className="font-mono text-[0.875rem] text-[var(--text-primary)] font-medium">
              {formatEta(p.carEtaIso)}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-tertiary)]">
              car ETA
            </div>
          </div>
          <ArrowRight className="size-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors" />
        </div>
      </Card>
    </Link>
  );
}
