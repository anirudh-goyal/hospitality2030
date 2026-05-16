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
          className="text-[0.8125rem] font-medium h-auto py-1.5 px-3 bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--elevated)] hover:text-[var(--text-primary)]"
        >
          <span className="text-[0.6875rem] text-[var(--text-tertiary)] mr-1.5">
            Role
          </span>
          {ROLE_LABELS[role]}
          <ChevronDown className="ml-1 size-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[var(--elevated)] border-[var(--border)] min-w-[180px]"
      >
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <DropdownMenuItem
            key={r}
            onSelect={() => onChange(r)}
            className="text-[0.8125rem] cursor-pointer focus:bg-[var(--surface)] focus:text-[var(--text-primary)]"
          >
            {ROLE_LABELS[r]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ROLE_LABELS };
