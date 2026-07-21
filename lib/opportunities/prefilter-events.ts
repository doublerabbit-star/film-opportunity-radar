import type { FilmEvent } from "../../types/index";
import { normalizeTitle } from "../rss/normalize-event.ts";
import {
  MAX_EVENT_AGE_HOURS,
  MAX_ANALYSIS_CANDIDATES,
  MIN_EVENT_TEXT_LENGTH,
} from "./config.ts";

export type PrefilterReason =
  | "missing-title"
  | "missing-source-url"
  | "invalid-date"
  | "stale"
  | "television-only"
  | "unrelated-entertainment"
  | "insufficient-text"
  | "duplicate";

export type PrefilterRejection = {
  eventId: string;
  reason: PrefilterReason;
};

export type PrefilterResult = {
  candidates: FilmEvent[];
  rejected: PrefilterRejection[];
};

const FILM_CONTEXT = /\b(film|movie|cinema|cinematic|box office|theatrical|director|filmmaker|festival|documentary|screenplay)\b/i;
const TELEVISION_ONLY = /\b(tv|television|series|season|episode|showrunner|sitcom|emmys?)\b/i;
const UNRELATED_ENTERTAINMENT = /\b(album|single|concert tour|podcast|video game|broadway|stage musical)\b/i;

function rejectionReason(event: FilmEvent, now: Date): PrefilterReason | null {
  if (!event.title.trim()) return "missing-title";

  try {
    const url = new URL(event.sourceUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "missing-source-url";
  } catch {
    return "missing-source-url";
  }

  const publishedAt = Date.parse(event.publishedAt);
  if (!Number.isFinite(publishedAt)) return "invalid-date";

  const ageHours = (now.getTime() - publishedAt) / 3_600_000;
  if (ageHours > MAX_EVENT_AGE_HOURS) return "stale";

  const text = `${event.title} ${event.description ?? ""} ${event.content ?? ""}`;
  if (TELEVISION_ONLY.test(text) && !FILM_CONTEXT.test(text)) return "television-only";
  if (UNRELATED_ENTERTAINMENT.test(text) && !FILM_CONTEXT.test(text)) return "unrelated-entertainment";

  const sourceText = `${event.description ?? ""} ${event.content ?? ""}`.trim();
  if (sourceText.length < MIN_EVENT_TEXT_LENGTH) return "insufficient-text";

  return null;
}

export function selectCandidateEvents(
  events: readonly FilmEvent[],
  options: { now?: Date; limit?: number } = {},
): PrefilterResult {
  const now = options.now ?? new Date();
  const limit = options.limit ?? MAX_ANALYSIS_CANDIDATES;
  const candidates: FilmEvent[] = [];
  const rejected: PrefilterRejection[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  const sortedEvents = [...events].sort(
    (left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt),
  );

  for (const event of sortedEvents) {
    const reason = rejectionReason(event, now);
    if (reason) {
      rejected.push({ eventId: event.id, reason });
      continue;
    }

    const titleKey = normalizeTitle(event.title);
    if (seenUrls.has(event.sourceUrl) || seenTitles.has(titleKey)) {
      rejected.push({ eventId: event.id, reason: "duplicate" });
      continue;
    }

    seenUrls.add(event.sourceUrl);
    seenTitles.add(titleKey);

    if (candidates.length < limit) candidates.push(event);
  }

  return { candidates, rejected };
}
