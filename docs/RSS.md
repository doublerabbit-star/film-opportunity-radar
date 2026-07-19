# MVP RSS Ingestion

> Status: Implemented  
> Last verified: 2026-07-19

## Scope

The RSS collector fetches verified publication feeds, parses RSS or Atom, normalizes entries into the shared `FilmEvent` contract, deduplicates them, and exposes a temporary read-only endpoint.

It does not filter editorial relevance, enrich TMDb metadata, generate Opportunities, call Gemini, persist data, or schedule collection.

## Verified Sources

| Key | Publication | Feed URL | Verification |
| --- | --- | --- | --- |
| `deadline` | Deadline | `https://deadline.com/feed/` | HTTP 200, RSS 2.0 |
| `variety` | Variety | `https://variety.com/feed/` | HTTP 200, RSS 2.0 |
| `hollywood-reporter` | The Hollywood Reporter | `https://www.hollywoodreporter.com/feed/` | HTTP 200, RSS 2.0 |
| `indiewire` | IndieWire | `https://www.indiewire.com/feed/` | HTTP 200, RSS 2.0 |

No candidate source was omitted at the verification date. Feed availability remains controlled by each publisher and can change independently of this project.

The registry is maintained in `lib/rss/sources.ts`. The endpoint never accepts caller-provided feed URLs.

## FilmEvent Normalization

| `FilmEvent` field | Feed input |
| --- | --- |
| `id` | SHA-256-derived deterministic ID; see below |
| `title` | Cleaned item or entry title |
| `description` | Longest available cleaned description, summary, or content excerpt, limited to 1,000 characters |
| `source` | Configured publication display name |
| `sourceUrl` | Canonical item link; a URL-form item GUID or Atom ID is the fallback |
| `publishedAt` | Item publication date, then item updated date, serialized as ISO 8601 |

Markup, scripts, styles, comments, unsafe tags, repeated whitespace, and common HTML entities are removed from text. The shared contract has no separate `summary`, `content`, `author`, or `categories` fields, so those fields are not added. The richest available excerpt is stored only as `description`.

An item is skipped if it has no usable title, canonical article URL, or valid publication/updated date. The collector does not fabricate required values or use the collection time as an article timestamp.

## URL and ID Rules

Article URLs are trimmed and parsed with the platform URL API. Fragments, `utm_*`, and a small allowlist of common click-tracking parameters are removed. Remaining query parameters are preserved and sorted because they may identify distinct articles.

Event identity uses the following order:

1. Canonical article URL.
2. Feed item GUID or Atom ID.
3. Configured source name, normalized title, and ISO publication timestamp.

The selected identity is SHA-256 hashed and represented as `evt_` plus the first 24 hexadecimal characters. Runtime normalization requires `sourceUrl`; therefore a non-URL GUID cannot rescue an item that has no attributable article URL.

## Deduplication and Sorting

Events are deduplicated across all feeds in two passes:

1. Exact canonical `sourceUrl`.
2. Configured source, normalized title, and UTC publication date.

When duplicate records differ, the record with the longer cleaned description is retained. Results are sorted by `publishedAt` descending after deduplication.

## Failure Handling

- Each feed has an independent 8-second request timeout.
- Redirects are followed and responses are not cached.
- Empty, non-successful, or responses larger than 5 MB fail only that source.
- Fetch and parse failures are logged server-side with the source key.
- API clients receive a sanitized source-level error without XML, stack traces, or internal diagnostics.
- Other verified feeds still return normally when one source fails.

## Temporary API

`GET /api/rss`

The route runs server-side, uses only the internal source registry, and returns:

```json
{
  "count": 0,
  "events": [],
  "sources": [],
  "generatedAt": "2026-07-19T00:00:00.000Z"
}
```

The endpoint uses `Cache-Control: no-store` and is intended for development verification only.

## Known Limitations

- These are broad publication feeds and can contain television, awards, labor, or media-business stories. Relevance filtering belongs to the later Rule Engine task.
- Feed entries usually contain excerpts rather than full article text.
- The current `FilmEvent` contract intentionally cannot preserve author, categories, or separate full content.
- There is no persistence or cross-request history, so deduplication applies only within one collection request.
