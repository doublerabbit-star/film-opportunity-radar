import { parseFeed } from "@rowanmanning/feed-parser";

export type ParsedFeed = ReturnType<typeof parseFeed>;
export type ParsedFeedItem = ParsedFeed["items"][number];

export class FeedParseError extends Error {
  readonly publicMessage = "Feed could not be parsed.";

  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message, options);
    this.name = "FeedParseError";
  }
}

export function parseFeedXml(xml: string): ParsedFeed {
  try {
    return parseFeed(xml);
  } catch (error) {
    throw new FeedParseError("RSS or Atom parsing failed.", { cause: error });
  }
}
