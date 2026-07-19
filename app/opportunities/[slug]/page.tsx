import { notFound } from "next/navigation";
import { OpportunityDetail } from "@/components/opportunity-detail";
import { getOpportunity, mockOpportunities } from "@/lib/mock-opportunities";

export function generateStaticParams() {
  return mockOpportunities.map((item) => ({ slug: item.id }));
}

export default async function OpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const opportunity = getOpportunity(slug);
  if (!opportunity) notFound();
  return <OpportunityDetail opportunity={opportunity} />;
}
