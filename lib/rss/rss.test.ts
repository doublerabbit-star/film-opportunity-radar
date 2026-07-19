import assert from "node:assert/strict";
import test from "node:test";
import { collectEvents } from "./collect-events.ts";
import { deduplicateEvents } from "./deduplicate-events.ts";
import {
  canonicalizeSourceUrl,
  generateEventId,
  normalizeFeedItem,
} from "./normalize-event.ts";
import { parseFeedXml } from "./parse-feed.ts";
import type { RssSource } from "./sources.ts";
import type { FilmEvent } from "../../types/index.ts";

const source: RssSource = {
  key: "example",
  name: "Example Film News",
  feedUrl: "https://example.com/feed.xml",
  enabled: true,
};

const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Example Film News</title>
    <link>https://example.com/</link>
    <description>Film news</description>
    <item>
      <title>A &amp; B Announce a New Film</title>
      <link>https://example.com/new-film/?utm_source=rss&amp;edition=west#comments</link>
      <guid>article-123</guid>
      <pubDate>Sun, 19 Jul 2026 08:30:00 GMT</pubDate>
      <description><![CDATA[<p>A short announcement.</p>]]></description>
      <content:encoded><![CDATA[<p>A longer announcement with <strong>production details</strong> for readers.</p>]]></content:encoded>
    </item>
  </channel>
</rss>`;

const atomXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example Film News</title>
  <link href="https://example.com/" />
  <updated>2026-07-19T09:00:00Z</updated>
  <id>https://example.com/</id>
  <entry>
    <title>Festival Selects Opening Night Film</title>
    <link href="https://example.com/festival-opening?gclid=tracking" />
    <id>tag:example.com,2026:festival-opening</id>
    <updated>2026-07-19T09:00:00Z</updated>
    <summary type="html">&lt;p&gt;The festival confirmed its opening selection.&lt;/p&gt;</summary>
  </entry>
</feed>`;

test("normalizes a representative RSS item", () => {
  const item = parseFeedXml(rssXml).items[0];
  const event = normalizeFeedItem(source, item);

  assert.ok(event);
  assert.equal(event.title, "A & B Announce a New Film");
  assert.equal(event.source, source.name);
  assert.equal(event.sourceUrl, "https://example.com/new-film/?edition=west");
  assert.equal(event.publishedAt, "2026-07-19T08:30:00.000Z");
  assert.equal(event.description, "A short announcement.");
  assert.equal(event.content, "A longer announcement with production details for readers.");
});

test("normalizes a representative Atom item", () => {
  const item = parseFeedXml(atomXml).items[0];
  const event = normalizeFeedItem(source, item);

  assert.ok(event);
  assert.equal(event.title, "Festival Selects Opening Night Film");
  assert.equal(event.sourceUrl, "https://example.com/festival-opening");
  assert.equal(event.publishedAt, "2026-07-19T09:00:00.000Z");
  assert.equal(event.description, "The festival confirmed its opening selection.");
  assert.equal(event.content, "The festival confirmed its opening selection.");
});

test("generates deterministic event IDs", () => {
  const input = {
    sourceUrl: "https://example.com/article",
    guid: "article-123",
    source: source.name,
    title: "Article",
    publishedAt: "2026-07-19T08:30:00.000Z",
  };

  assert.equal(generateEventId(input), generateEventId(input));
  assert.match(generateEventId(input), /^evt_[a-f0-9]{24}$/);
});

test("canonicalizes URLs without removing identifying parameters", () => {
  const canonical = canonicalizeSourceUrl(
    " https://EXAMPLE.com/article?utm_medium=email&id=42&fbclid=abc#section ",
  );

  assert.equal(canonical, "https://example.com/article?id=42");
});

test("deduplicates by canonical URL and preserves the richer event", () => {
  const base: FilmEvent = {
    id: "evt_short",
    title: "The Same Story",
    source: source.name,
    sourceUrl: "https://example.com/story",
    publishedAt: "2026-07-19T08:30:00.000Z",
    description: "Short.",
    content: "Short content.",
  };
  const richer: FilmEvent = {
    ...base,
    id: "evt_rich",
    description: "A longer and more useful description of the same story.",
    content: "A substantially richer body excerpt with more useful details about the same story.",
  };

  assert.deepEqual(deduplicateEvents([base, richer]), [richer]);
});

test("isolates a failed feed while preserving successful results", async () => {
  const sources: RssSource[] = [
    source,
    { key: "failed", name: "Failed Feed", feedUrl: "https://example.com/failed", enabled: true },
  ];

  const result = await collectEvents(sources, async (requestedSource) => {
    if (requestedSource.key === "failed") throw new Error("Private diagnostic detail");
    return rssXml;
  });

  assert.equal(result.events.length, 1);
  assert.deepEqual(result.sources.map((item) => item.status), ["success", "error"]);
  assert.equal(result.sources[1].error, "Unexpected feed processing error.");
});
