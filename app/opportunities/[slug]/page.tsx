import { LiveOpportunityDetail } from "@/components/live-opportunity-detail";
import { OpportunityDetail } from "@/components/opportunity-detail";
import { getOpportunity, mockOpportunities } from "@/lib/mock-opportunities";

export function generateStaticParams() {
  return mockOpportunities.map((item) => ({ slug: item.id }));
}

export default async function OpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const opportunity = getOpportunity(slug);
  return opportunity
    ? <OpportunityDetail opportunity={opportunity} />
    : <LiveOpportunityDetail id={slug} />;
}
