import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { CountdownTimer } from "./countdown-timer";
import { RoleSwitcher, Role } from "./role-switcher";

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
  if (n === 1) return "First Visit";
  if (n === 2) return "2nd Visit";
  if (n === 3) return "3rd Visit";
  return `${n}th Visit`;
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
    <Card className="flex flex-row gap-6 p-8 mb-8">
      <Avatar className="size-20 [&_img]:grayscale">
        <AvatarImage src={guest.photoUrl} alt="" />
        <AvatarFallback className="font-display text-xl">
          {guest.firstName[0]}
          {guest.lastName[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h1
          className="font-display"
          style={{ fontSize: "2.5rem", fontWeight: 500, lineHeight: 1.1 }}
        >
          {guest.firstName} {guest.lastName}
        </h1>
        <div className="font-mono text-[0.8125rem] text-[var(--text-secondary)] mt-2">
          {guest.loyaltyTier} -{" "}
          {guest.totalStays ? ordinal(guest.totalStays) : "First Visit"} -{" "}
          {a?.property}
        </div>
        {a ? (
          <div className="font-mono text-[0.8125rem] text-[var(--text-tertiary)] mt-3">
            Suite {a.suite} -{" "}
            {new Date(a.checkinIso).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            to{" "}
            {new Date(a.checkoutIso).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            - {a.flightCode} {a.flightStatus} - Car ETA{" "}
            {new Date(a.carEtaIso).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        ) : null}
        {a ? <CountdownTimer targetIso={a.carEtaIso} /> : null}
      </div>

      <div>
        <RoleSwitcher role={role} onChange={onRoleChange} />
      </div>
    </Card>
  );
}
