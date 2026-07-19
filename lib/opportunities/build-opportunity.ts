import type { FilmEvent, Opportunity } from "../../types/index";
import type { AcceptedGeminiAnalysis } from "./analysis-schema.ts";
import { calculateOpportunityScore, deriveSignal } from "./score-opportunity.ts";

const FALLBACK_IMAGE = "/images/lead-cinema.png";
const FALLBACK_IMAGE_ALT = "A woman in a red coat outside a weathered cinema";

function deriveCategory(event: FilmEvent): string {
  const text = `${event.title} ${event.description ?? ""}`;
  if (/\b(box office|theatrical|cinema|exhibitor|imax)\b/i.test(text)) return "Exhibition";
  if (/\b(streaming|netflix|hulu|prime video|subscription)\b/i.test(text)) return "Streaming economics";
  if (/\b(effect|animation|cinematograph|production|screenplay|craft)\b/i.test(text)) return "Craft & production";
  if (/\b(sequel|remake|reboot|nostalgia|horror|audience)\b/i.test(text)) return "Cultural anxiety";
  return "Industry shift";
}

function deriveOpportunityWindow(score: number): string {
  if (score >= 8.5) return "24-hour window";
  if (score >= 7) return "3-day window";
  return "7-day window";
}

function opportunityId(eventId: string): string {
  return eventId.startsWith("evt_")
    ? `opp_${eventId.slice(4)}`
    : `opp_${eventId}`;
}

export function buildOpportunity(
  event: FilmEvent,
  analysis: AcceptedGeminiAnalysis,
  now = new Date(),
): Opportunity {
  const score = calculateOpportunityScore(event, analysis.editorialWeight, now);

  return {
    id: opportunityId(event.id),
    eventId: event.id,
    category: deriveCategory(event),
    title: analysis.title,
    shortTitle: analysis.shortTitle,
    description: analysis.description,
    editorialWeight: analysis.editorialWeight,
    score,
    signal: deriveSignal(score),
    image: FALLBACK_IMAGE,
    imageAlt: FALLBACK_IMAGE_ALT,
    source: event.source,
    sourceUrl: event.sourceUrl,
    publishedAt: event.publishedAt,
    trend: "Not available",
    volume: "Not available",
    opportunityWindow: deriveOpportunityWindow(score),
    whyItMatters: analysis.whyItMatters,
    contentAngles: analysis.contentAngles,
    titleIdeas: analysis.titleIdeas,
  };
}
