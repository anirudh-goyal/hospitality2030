import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { BriefView } from "@/components/brief-view";

export default async function GuestBriefPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guest = await fetchQuery(api.guests.getBySlug, { slug });
  if (!guest) notFound();

  const [brief, observations, signals] = await Promise.all([
    fetchQuery(api.briefs.getForGuest, { guestId: guest._id }),
    fetchQuery(api.observations.listForGuest, { guestId: guest._id }),
    fetchQuery(api.externalSignals.listForGuest, { guestId: guest._id }).catch(
      () => []
    ),
  ]);

  return (
    <BriefView
      guest={guest}
      brief={brief}
      observations={observations}
      signals={signals}
    />
  );
}
