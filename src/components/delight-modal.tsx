"use client";

import type { Id } from "../../convex/_generated/dataModel";

type Gesture = {
  title: string;
  rationale: string;
  estCostHkd: number;
  availability: string;
  status: string;
};

export function DelightModal(_props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  guestName: string;
  briefId: Id<"briefs">;
  gestures: Gesture[];
  generatedAtIso: string;
}) {
  return null;
}
