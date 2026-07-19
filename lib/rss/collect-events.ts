import type { FilmEvent } from "../../types/index";
import { deduplicateEvents } from "./deduplicate-events.ts";
import { FeedFetchError, fetchFeedXml } from "./fetch-feed.ts";
import { normalizeFeedItem } from "./normalize-event.ts";
import { FeedParseError, parseFeedXml } from "./parse-feed.ts";
import { RSS_SOURCES, type RssSource } from "./sources.ts";

export type RssSourceStatus = {
  key: string;
  name: string;
  status: "success" | "error";
  count: number;
  error: string | null;
};

export type CollectEventsResult = {
  events: FilmEvent[];
  sources: RssSourceStatus[];
};

export type FeedFetcher = (source: RssSource) => Promise<string>;

function clientSafeError(error: unknown): string {
  if (error instanceof FeedFetchError || error instanceof FeedParseError) {
    return error.publicMessage;
  }

  return "Unexpected feed processing error.";
}

export async function collectEvents(
  sources: readonly RssSource[] = RSS_SOURCES,
  fetcher: FeedFetcher = fetchFeedXml,
): Promise<CollectEventsResult> {
  const enabledSources = sources.filter((source) => source.enabled);

  const results = await Promise.all(enabledSources.map(async (source) => {
    try {
      const xml = await fetcher(source);
      const feed = parseFeedXml(xml);
      const events = feed.items
        .map((item) => normalizeFeedItem(source, item))
        .filter((event): event is FilmEvent => event !== null);

      return {
        events,
        status: {
          key: source.key,
          name: source.name,
          status: "success" as const,
          count: events.length,
          error: null,
        },
      };
    } catch (error) {
      console.error(`[rss] ${source.key}:`, error instanceof Error ? error.message : error);

      return {
        events: [] as FilmEvent[],
        status: {
          key: source.key,
          name: source.name,
          status: "error" as const,
          count: 0,
          error: clientSafeError(error),
        },
      };
    }
  }));

  const events = deduplicateEvents(results.flatMap((result) => result.events))
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));

  return {
    events,
    sources: results.map((result) => result.status),
  };
}
