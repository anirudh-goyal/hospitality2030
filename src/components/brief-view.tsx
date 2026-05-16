"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Doc } from "../../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BriefHeader } from "./brief-header";
import { KeyFactsSection } from "./key-facts-section";
import { ExternalSignalsSection } from "./external-signals-section";
import { SensitivitiesSection } from "./sensitivities-section";
import { GestureSection } from "./gesture-section";
import { ObservationsFeed } from "./observations-feed";
import { PipelineStrip, AgentTimeline } from "./agent-panel";
import type { Role } from "./role-switcher";

type Props = {
  guest: Doc<"guests">;
  brief: Doc<"briefs"> | null;
  observations: Doc<"observations">[];
  signals: Doc<"externalSignals">[];
};

type Tab = "brief" | "evidence" | "activity";

export function BriefView({ guest, brief, signals }: Props) {
  const [role, setRole] = useState<Role>("front_desk");
  const [tab, setTab] = useState<Tab>("brief");

  const visibleSignals =
    role === "front_desk" || role === "concierge" ? signals : [];
  const visibleSensitivities = brief?.sensitivities ?? [];
  const visibleKeyFacts = brief?.keyFacts ?? [];

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-screen">
      {/* breadcrumb strip */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-[0.8125rem]">
          <Link
            href="/arrivals"
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Arrivals
          </Link>
          <ChevronRight className="size-3.5 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-secondary)]">
            {guest.firstName} {guest.lastName}
          </span>
        </div>
        <div className="font-mono text-[0.75rem] text-[var(--text-tertiary)]">
          {today} · Rosewood Hong Kong
        </div>
      </div>

      <BriefHeader guest={guest} role={role} onRoleChange={setRole} />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        className="flex-1 min-h-0 flex flex-col"
      >
        <TabsList className="bg-transparent border-b border-[var(--border)] rounded-none w-full justify-start gap-6 px-6 h-auto py-0">
          {[
            { id: "brief", label: "Brief" },
            { id: "evidence", label: "Evidence" },
            { id: "activity", label: "Activity" },
          ].map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="text-[0.875rem] font-medium rounded-none bg-transparent border-0 border-b-2 border-transparent data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[var(--text-tertiary)] px-0 py-3 -mb-px"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent
          value="brief"
          className="flex-1 min-h-0 overflow-auto px-6 py-5"
        >
          <div className="flex flex-col gap-4">
            <KeyFactsSection facts={visibleKeyFacts} />

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                {brief ? (
                  <GestureSection
                    guestId={guest._id}
                    guestName={`${guest.firstName} ${guest.lastName}`}
                  />
                ) : null}
              </div>
              <div className="col-span-1">
                <SensitivitiesSection items={visibleSensitivities} />
              </div>
            </div>

            <PipelineStrip
              briefId={brief?._id}
              onOpenActivity={() => setTab("activity")}
            />
          </div>
        </TabsContent>

        <TabsContent
          value="evidence"
          className="flex-1 min-h-0 overflow-auto px-6 py-5"
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <ExternalSignalsSection signals={visibleSignals} />
            </div>
            <div>
              <ObservationsFeed guestId={guest._id} role={role} />
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="activity"
          className="flex-1 min-h-0 overflow-auto px-6 py-5"
        >
          <AgentTimeline briefId={brief?._id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
