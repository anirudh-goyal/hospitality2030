"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { ChevronsUpDown } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type SelectedGuest = {
  id: Id<"guests">;
  slug: string;
  firstName: string;
  lastName: string;
  suite: string;
  loyaltyTier: string;
} | null;

export function GuestPicker({
  value,
  onChange,
}: {
  value: SelectedGuest;
  onChange: (v: SelectedGuest) => void;
}) {
  const guests = useQuery(api.guests.listAll, {});
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between text-left p-4 bg-[var(--card)] border border-[var(--border)] rounded-md text-[var(--text-primary)] cursor-pointer hover:bg-[var(--elevated)] transition-colors"
        >
          {value ? (
            <span className="flex items-baseline gap-3 flex-wrap">
              <span
                className="text-[1rem] font-medium text-[var(--text-primary)]"
              >
                {value.firstName} {value.lastName}
              </span>
              <span className="font-mono text-xs text-[var(--text-tertiary)]">
                Suite {value.suite}
              </span>
            </span>
          ) : (
            <span className="text-[var(--text-tertiary)]">
              Select guest...
            </span>
          )}
          <ChevronsUpDown className="size-4 text-[var(--text-tertiary)] shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[480px] p-0 bg-[var(--elevated)] border-[var(--border)]"
      >
        <Command className="bg-transparent">
          <CommandInput placeholder="Search by name or room..." />
          <CommandList>
            <CommandEmpty>No guests found.</CommandEmpty>
            {(guests ?? []).map((g) => (
              <CommandItem
                key={g._id}
                value={`${g.firstName} ${g.lastName} ${g.nextArrival?.suite ?? ""}`}
                onSelect={() => {
                  onChange({
                    id: g._id,
                    slug: g.slug,
                    firstName: g.firstName,
                    lastName: g.lastName,
                    suite: g.nextArrival?.suite ?? "",
                    loyaltyTier: g.loyaltyTier,
                  });
                  setOpen(false);
                }}
                className="aria-selected:bg-[var(--surface)] aria-selected:text-[var(--text-primary)] cursor-pointer"
              >
                <span className="text-[0.9375rem] font-medium text-[var(--text-primary)]">
                  {g.firstName} {g.lastName}
                </span>
                <span className="font-mono text-xs text-[var(--text-tertiary)] ml-3">
                  Suite {g.nextArrival?.suite ?? "TBD"}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
