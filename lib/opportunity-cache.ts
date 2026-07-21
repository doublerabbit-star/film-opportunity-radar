import type { Opportunity } from "@/types";

const CACHE_KEY = "film-opportunity-radar-live-opportunities";

export function isOpportunityRecord(value: unknown): value is Opportunity {
  if (!value || typeof value !== "object") return false;
  const opportunity = value as Partial<Opportunity>;
  const stringFields: Array<keyof Opportunity> = [
    "id", "eventId", "category", "title", "shortTitle", "description",
    "image", "imageAlt", "source", "sourceUrl", "publishedAt", "trend",
    "volume", "opportunityWindow", "whyItMatters",
  ];
  return stringFields.every((field) => typeof opportunity[field] === "string")
    && typeof opportunity.score === "number"
    && Number.isFinite(opportunity.score)
    && ["high", "medium", "low"].includes(opportunity.editorialWeight || "")
    && ["Peak", "Rising", "Emerging"].includes(opportunity.signal || "")
    && Array.isArray(opportunity.contentAngles)
    && opportunity.contentAngles.every((angle) => typeof angle === "string")
    && Array.isArray(opportunity.titleIdeas)
    && opportunity.titleIdeas.every((title) => typeof title === "string");
}

export function readCachedOpportunities(): Opportunity[] {
  if (typeof window === "undefined") return [];

  try {
    const cached = window.sessionStorage.getItem(CACHE_KEY);
    if (!cached) return [];
    const parsed: unknown = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed.filter(isOpportunityRecord) : [];
  } catch {
    return [];
  }
}

export function cacheOpportunities(opportunities: Opportunity[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(opportunities));
  } catch {
    // Storage can be unavailable; the live page should still render normally.
  }
}
