import type { FilmEvent } from "../../types/index";
import { normalizeTitle } from "./normalize-event.ts";

function fallbackKey(event: FilmEvent): string {
  return [event.source, normalizeTitle(event.title), event.publishedAt.slice(0, 10)]
    .join("|")
    .toLocaleLowerCase("en-US");
}

function selectRicherEvent(left: FilmEvent, right: FilmEvent): FilmEvent {
  return (right.description?.length ?? 0) > (left.description?.length ?? 0)
    ? right
    : left;
}

export function deduplicateEvents(events: readonly FilmEvent[]): FilmEvent[] {
  const byUrl = new Map<string, FilmEvent>();

  for (const event of events) {
    const existing = byUrl.get(event.sourceUrl);
    byUrl.set(event.sourceUrl, existing ? selectRicherEvent(existing, event) : event);
  }

  const byFallback = new Map<string, FilmEvent>();

  for (const event of byUrl.values()) {
    const key = fallbackKey(event);
    const existing = byFallback.get(key);
    byFallback.set(key, existing ? selectRicherEvent(existing, event) : event);
  }

  return [...byFallback.values()];
}
