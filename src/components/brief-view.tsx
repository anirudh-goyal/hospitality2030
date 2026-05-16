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
import {
  filterKeyFactsForRole,
  filterTextsForRole,
  gestureVisibleToRole,
} from "@/lib/role-filter";

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
  const visibleSensitivities = filterTextsForRole(
    brief?.sensitivities ?? [],
    role
  );
  const visibleKeyFacts = filterKeyFactsForRole(brief?.keyFacts ?? [], role);
  const showGesture = !!brief && gestureVisibleToRole(role);

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

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        className="flex-1 min-h-0 flex flex-col"
      >
        <div className="px-6 pt-5 pb-3 border-b border-[var(--border)]">
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
        </div>

        <TabsContent
          value="brief"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-5"
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                {showGesture ? (
                  <GestureSection
                    guestId={guest._id}
                    guestName={`${guest.firstName} ${guest.lastName}`}
                  />
                ) : (
                  <RoleEmptyState role={role} />
                )}
              </div>
              <div className="col-span-1">
                {visibleSensitivities.length ? (
                  <SensitivitiesSection items={visibleSensitivities} />
                ) : (
                  <NoSensitivities />
                )}
              </div>
            </div>

            <PipelineStrip
              briefId={brief?._id}
              onOpenActivity={() => setTab("activity")}
            />

            {visibleKeyFacts.length ? (
              <KeyFactsSection facts={visibleKeyFacts} />
            ) : (
              <NoHighlights />
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="evidence"
          className="flex-1 min-h-0 overflow-hidden px-6 py-5"
        >
          <div className="grid grid-cols-2 gap-6 h-full min-h-0">
            <div className="flex flex-col min-h-0">
              <div className="section-label mb-3">External Signals</div>
              <div
                className="flex-1 min-h-0 overflow-y-auto pr-1"
                style={{ scrollbarGutter: "stable" }}
              >
                <ExternalSignalsSection signals={visibleSignals} headless />
              </div>
            </div>
            <div className="flex flex-col min-h-0">
              <div className="section-label mb-3">Observations</div>
              <div
                className="flex-1 min-h-0 overflow-y-auto pr-1"
                style={{ scrollbarGutter: "stable" }}
              >
                <ObservationsFeed guestId={guest._id} role={role} headless />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="activity"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-5"
          style={{ scrollbarGutter: "stable" }}
        >
          <AgentTimeline briefId={brief?._id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RoleEmptyState({ role }: { role: Role }) {
  const labels: Record<Role, string> = {
    front_desk: "",
    concierge: "",
    restaurant: "Restaurant team focuses on dining notes; gestures are owned by Concierge.",
    spa: "Spa focuses on wellness and sensitivities; gestures are owned by Concierge.",
    housekeeping:
      "Housekeeping focuses on room and service notes; gestures are owned by Concierge.",
  };
  return (
    <div className="h-full rounded-xl border border-dashed border-[var(--border)] p-8 flex items-center justify-center text-center">
      <p className="text-[0.875rem] text-[var(--text-tertiary)] max-w-[28rem]">
        {labels[role]}
      </p>
    </div>
  );
}

function NoSensitivities() {
  return (
    <div className="h-full rounded-xl border border-dashed border-[var(--border)] p-6 flex items-center justify-center text-center">
      <p className="text-[0.8125rem] text-[var(--text-tertiary)]">
        No staff notes apply to this role.
      </p>
    </div>
  );
}

function NoHighlights() {
  return (
    <section>
      <div className="section-label mb-3">Highlights</div>
      <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
        <p className="text-[0.875rem] text-[var(--text-tertiary)]">
          No highlights visible for this role.
        </p>
      </div>
    </section>
  );
}
