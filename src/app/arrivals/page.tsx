import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { GuestCard } from "@/components/guest-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

type Filter = "today" | "tomorrow" | "vip";

function isFilter(s: string | undefined): s is Filter {
  return s === "today" || s === "tomorrow" || s === "vip";
}

const TABS: { id: Filter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "vip", label: "VIP Only" },
];

export default async function ArrivalsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter: Filter = isFilter(sp.filter) ? sp.filter : "today";
  const guests = await fetchQuery(api.guests.listArriving, { filter });

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="section-label mb-2">Arrivals</div>
      <h1
        className="font-display mb-8"
        style={{ fontSize: "2rem", fontWeight: 500 }}
      >
        Today at Rosewood Hong Kong
      </h1>

      <Tabs value={filter} className="mb-8">
        <TabsList className="bg-transparent border-b border-[var(--border)] rounded-none w-full justify-start gap-8 p-0 h-auto">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              asChild
              className="font-mono text-[0.8125rem] rounded-none bg-transparent border-0 border-b border-transparent data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[var(--text-tertiary)] px-0 pb-2 -mb-px"
            >
              <Link href={`/arrivals?filter=${t.id}`}>{t.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3">
        {guests.map((g) => (
          <GuestCard
            key={g._id}
            slug={g.slug}
            firstName={g.firstName}
            lastName={g.lastName}
            photoUrl={g.photoUrl}
            loyaltyTier={g.loyaltyTier}
            suite={g.nextArrival!.suite}
            carEtaIso={g.nextArrival!.carEtaIso}
            keyFact={
              g.slug === "anderson"
                ? "Daughter Mia, 10, loved London pool"
                : undefined
            }
          />
        ))}
        {guests.length === 0 ? (
          <p className="text-[var(--text-tertiary)]">
            No arrivals for this filter.
          </p>
        ) : null}
      </div>
    </main>
  );
}
