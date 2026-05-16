"use client";

import { useState } from "react";
import type { Doc } from "../../convex/_generated/dataModel";
import { BriefHeader } from "./brief-header";
import { KeyFactsSection } from "./key-facts-section";
import { ExternalSignalsSection } from "./external-signals-section";
import { SensitivitiesSection } from "./sensitivities-section";
import { GestureSection } from "./gesture-section";
import { ObservationsFeed } from "./observations-feed";
import { AgentPanel } from "./agent-panel";
import type { Role } from "./role-switcher";

type Props = {
  guest: Doc<"guests">;
  brief: Doc<"briefs"> | null;
  observations: Doc<"observations">[];
  signals: Doc<"externalSignals">[];
};

export function BriefView({ guest, brief, observations: _o, signals }: Props) {
  const [role, setRole] = useState<Role>("front_desk");

  const visibleSignals =
    role === "front_desk" || role === "concierge" ? signals : [];
  const visibleSensitivities = brief?.sensitivities ?? [];
  const visibleKeyFacts = brief?.keyFacts ?? [];

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0">
        <BriefHeader guest={guest} role={role} onRoleChange={setRole} />
        <KeyFactsSection facts={visibleKeyFacts} />
        <ExternalSignalsSection signals={visibleSignals} />
        {brief ? (
          <GestureSection
            guestId={guest._id}
            guestName={`${guest.firstName} ${guest.lastName}`}
          />
        ) : null}
        <SensitivitiesSection items={visibleSensitivities} />
        <ObservationsFeed guestId={guest._id} role={role} />
      </div>
      <AgentPanel briefId={brief?._id} />
    </div>
  );
}
