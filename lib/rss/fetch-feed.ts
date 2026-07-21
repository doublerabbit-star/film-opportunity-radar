import type { RssSource } from "./sources.ts";
import { logSanitizedNetworkError } from "../sanitized-network-error.ts";

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_FEED_SIZE_BYTES = 5_000_000;

export class FeedFetchError extends Error {
  readonly publicMessage: string;

  constructor(message: string, publicMessage: string, options: { cause?: unknown } = {}) {
    super(message, options);
    this.name = "FeedFetchError";
    this.publicMessage = publicMessage;
  }
}

export async function fetchFeedXml(source: RssSource, parentSignal?: AbortSignal): Promise<string> {
  let response: Response;
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = parentSignal
    ? AbortSignal.any([timeoutSignal, parentSignal])
    : timeoutSignal;

  try {
    response = await fetch(source.feedUrl, {
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
        "User-Agent": "FilmOpportunityRadar/0.1 (+RSS collector)",
      },
      cache: "no-store",
      redirect: "follow",
      signal,
    });
  } catch (error) {
    logSanitizedNetworkError("rss", new URL(source.feedUrl).hostname, error);
    const timedOut = error instanceof Error && (
      error.name === "TimeoutError" || error.name === "AbortError"
    );

    throw new FeedFetchError(
      `${source.name} feed request ${timedOut ? "timed out" : "failed"}.`,
      timedOut ? "Feed request timed out." : "Unable to reach feed.",
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new FeedFetchError(
      `${source.name} returned HTTP ${response.status}.`,
      `Feed returned HTTP ${response.status}.`,
    );
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_FEED_SIZE_BYTES) {
    throw new FeedFetchError(
      `${source.name} feed exceeded the size limit.`,
      "Feed response was too large.",
    );
  }

  const xml = await response.text();

  if (!xml.trim()) {
    throw new FeedFetchError(
      `${source.name} returned an empty feed.`,
      "Feed response was empty.",
    );
  }

  if (Buffer.byteLength(xml, "utf8") > MAX_FEED_SIZE_BYTES) {
    throw new FeedFetchError(
      `${source.name} feed exceeded the size limit.`,
      "Feed response was too large.",
    );
  }

  return xml;
}
