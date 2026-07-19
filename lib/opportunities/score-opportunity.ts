import type { FilmEvent, Opportunity } from "../../types/index";

const SOURCE_POINTS: Record<string, number> = {
  Deadline: 1,
  Variety: 1,
  "The Hollywood Reporter": 1,
  IndieWire: 0.8,
};

const TIMELY_TOPIC = /\b(trailer|casting|cast|release date|box office|festival|award|acquisition|distribution|director|filmmaker|sequel|remake|production|theatrical)\b/i;

function recencyPoints(event: FilmEvent, now: Date): number {
  const ageHours = Math.max(0, (now.getTime() - Date.parse(event.publishedAt)) / 3_600_000);
  if (ageHours <= 6) return 2;
  if (ageHours <= 24) return 1.5;
  if (ageHours <= 48) return 1;
  if (ageHours <= 72) return 0.5;
  return 0;
}

const EDITORIAL_WEIGHT_POINTS: Record<Opportunity["editorialWeight"], number> = {
  high: 1,
  medium: 0.5,
  low: 0,
};

export function calculateOpportunityScore(
  event: FilmEvent,
  editorialWeight: Opportunity["editorialWeight"],
  now = new Date(),
): number {
  const sourcePoints = SOURCE_POINTS[event.source] ?? 0.5;
  const topicPoints = TIMELY_TOPIC.test(event.title) ? 1 : 0;
  const descriptionPoints = (event.description?.length ?? 0) >= 120 ? 0.5 : 0;
  const contentPoints = (event.content?.length ?? 0) >= 400 ? 0.5 : 0;

  const rawScore = 4
    + recencyPoints(event, now)
    + sourcePoints
    + topicPoints
    + descriptionPoints
    + contentPoints
    + EDITORIAL_WEIGHT_POINTS[editorialWeight];

  return Math.min(10, Math.max(0, Math.round(rawScore * 10) / 10));
}

export function deriveSignal(score: number): Opportunity["signal"] {
  if (score >= 8.5) return "Peak";
  if (score >= 7) return "Rising";
  return "Emerging";
}
