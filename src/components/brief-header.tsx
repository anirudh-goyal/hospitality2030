import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "./countdown-timer";
import { RoleSwitcher, type Role } from "./role-switcher";

type Guest = {
  firstName: string;
  lastName: string;
  photoUrl: string;
  loyaltyTier: string;
  totalStays?: number;
  nextArrival?: {
    suite: string;
    flightCode: string;
    flightStatus: string;
    carEtaIso: string;
    checkinIso: string;
    checkoutIso: string;
    property: string;
  };
};

function ordinal(n: number): string {
  if (n === 1) return "First visit";
  if (n === 2) return "2nd visit";
  if (n === 3) return "3rd visit";
  return `${n}th visit`;
}

export function BriefHeader({
  guest,
  role,
  onRoleChange,
}: {
  guest: Guest;
  role: Role;
  onRoleChange: (r: Role) => void;
}) {
  const a = guest.nextArrival;
  return (
    <header className="flex items-center gap-5 px-6 py-5 border-b border-[var(--border)] bg-[var(--card)]">
      <Avatar className="size-14 shrink-0 [&_img]:grayscale">
        <AvatarImage src={guest.photoUrl} alt="" />
        <AvatarFallback className="font-display text-lg bg-[var(--surface)]">
          {guest.firstName[0]}
          {guest.lastName[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="font-display leading-none"
            style={{ fontSize: "2rem", fontWeight: 500 }}
          >
            {guest.firstName} {guest.lastName}
          </h1>
          <Badge
            variant="outline"
            className="font-mono text-[0.6875rem] border-[var(--accent)] text-[var(--accent)] rounded-full"
          >
            {guest.loyaltyTier}
          </Badge>
          {guest.totalStays ? (
            <span className="text-[0.8125rem] text-[var(--text-secondary)]">
              {ordinal(guest.totalStays)}
            </span>
          ) : null}
        </div>
        {a ? (
          <div className="font-mono text-[0.8125rem] text-[var(--text-secondary)] mt-1.5 flex items-center gap-3 flex-wrap">
            <span>Suite {a.suite}</span>
            <span className="text-[var(--text-tertiary)]">·</span>
            <span>{a.property}</span>
            <span className="text-[var(--text-tertiary)]">·</span>
            <span>
              {a.flightCode} {a.flightStatus}
            </span>
            <span className="text-[var(--text-tertiary)]">·</span>
            <span>
              Car ETA{" "}
              {new Date(a.carEtaIso).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {a ? <CountdownTimer targetIso={a.carEtaIso} /> : null}
        <RoleSwitcher role={role} onChange={onRoleChange} />
      </div>
    </header>
  );
}
