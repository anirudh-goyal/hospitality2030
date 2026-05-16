"use client";

import { useState } from "react";
import type { Doc } from "../../convex/_generated/dataModel";
import { SiteHeader } from "./site-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BriefHeader } from "./brief-header";
import { KeyFactsSection } from "./key-facts-section";
import { ExternalSignalsSection } from "./external-signals-section";
import { SensitivitiesSection } from "./sensitivities-section";
import { GestureSection } from "./gesture-section";
import { ObservationsFeed } from "./observations-feed";
import { PipelineStrip, AgentTimeline } from "./agent-panel";
import { RoleSwitcher, type Role } from "./role-switcher";

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
      <SiteHeader
        crumbs={[
          { label: "Arrivals", href: "/arrivals" },
          { label: `${guest.firstName} ${guest.lastName}` },
        ]}
        right={
          <>
            <RoleSwitcher role={role} onChange={setRole} />
            <span className="font-mono text-[0.75rem] text-[var(--text-tertiary)] hidden lg:inline">
              {today} · Rosewood Hong Kong
            </span>
          </>
        }
      />

      <BriefHeader guest={guest} />

      <div className="px-6 pt-5 pb-3 border-b border-[var(--border)]">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
        >
          <TabsList className="bg-[var(--surface)] p-1 h-auto rounded-md gap-1">
            {[
              { id: "brief", label: "Brief" },
              { id: "evidence", label: "Evidence" },
              { id: "activity", label: "Activity" },
            ].map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="text-[0.8125rem] font-medium rounded-sm px-4 py-1.5 bg-transparent border-0 data-[state=active]:bg-[var(--card)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm text-[var(--text-tertiary)] cursor-pointer transition-all"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        className="flex-1 min-h-0 flex flex-col"
      >
        <TabsContent
          value="brief"
          className="flex-1 min-h-0 overflow-auto px-6 py-5"
        >
          <div className="flex flex-col gap-5">
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

            <KeyFactsSection facts={visibleKeyFacts} />
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
