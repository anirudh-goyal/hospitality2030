"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Role =
  | "front_desk"
  | "concierge"
  | "restaurant"
  | "spa"
  | "housekeeping";

const ROLE_LABELS: Record<Role, string> = {
  front_desk: "Front Desk",
  concierge: "Concierge",
  restaurant: "Restaurant",
  spa: "Spa",
  housekeeping: "Housekeeping",
};

export function RoleSwitcher({
  role,
  onChange,
}: {
  role: Role;
  onChange: (r: Role) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="font-mono text-xs h-auto py-2 px-3.5 bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--elevated)] hover:text-[var(--text-primary)]"
        >
          {ROLE_LABELS[role]}
          <ChevronDown className="ml-1 size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[var(--elevated)] border-[var(--border)]"
      >
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <DropdownMenuItem
            key={r}
            onSelect={() => onChange(r)}
            className="font-mono text-[0.8125rem] cursor-pointer focus:bg-[var(--surface)] focus:text-[var(--text-primary)]"
          >
            {ROLE_LABELS[r]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ROLE_LABELS };
