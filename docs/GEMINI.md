# Archived Gemini Opportunity Analysis

> Status: Inactive provider reference
> Last Updated: 2026-07

The Gemini implementation remains in the repository for reference, but the runtime pipeline now uses DeepSeek. See `docs/DEEPSEEK.md` for active configuration and behavior.

## Scope

The temporary pipeline collects normalized RSS events through the shared collector, applies deterministic eligibility rules, asks Gemini for editorial analysis, validates the structured result, and constructs shared `Opportunity` records.

It does not persist results, enrich TMDb metadata, schedule work, or replace the mock opportunities used by the UI.

## Configuration

Set one server-side key:

```text
GEMINI_API_KEY=
```

`GOOGLE_GENERATIVE_AI_API_KEY` is accepted as a fallback. `GEMINI_MODEL` can optionally override the model. Keys must never use a `NEXT_PUBLIC_` prefix.

The default model is `gemini-3.5-flash`. Calls use the official `generateContent` REST endpoint, a 20-second timeout, JSON-schema response formatting, and no automatic retries. See the [Gemini API reference](https://ai.google.dev/api/generate-content).

## Pre-filter

The pre-filter is deterministic and runs before paid calls. It rejects:

- blank titles;
- missing or invalid HTTP(S) source URLs;
- invalid publication timestamps;
- events older than 72 hours;
- television-only stories with no film context;
- clearly unrelated music, podcast, game, Broadway, or stage-musical stories with no film context;
- events with less than 120 characters of combined description and content;
- repeated canonical URLs or normalized titles within the request.

Candidates are newest-first and limited to five per API request. Gemini is not used for filtering.

## Prompt Ownership

`lib/opportunities/prompt.ts` owns the prompt. Gemini receives the event title, source, source URL, publication timestamp, description, and at most 5,000 characters of content.

Gemini may reject an event. For accepted events it generates only:

- `title`
- `shortTitle`
- `description`
- `editorialWeight`
- `whyItMatters`
- `contentAngles`
- `titleIdeas`

Gemini does not generate category, score, signal, ranking, source attribution, display metrics, media, timing windows, or identifiers. Zod validates accepted and rejected responses, rejects unknown fields, enforces the editorial-weight enum, and requires two to four angles and title ideas.

## Deterministic Opportunity Fields

Application code supplies:

- `id`: `opp_` plus the stable `FilmEvent` identifier body;
- `eventId`: the source event ID;
- `category`: keyword-based editorial department;
- `score`: deterministic formula below;
- `signal`: score threshold below;
- `image` and `imageAlt`: existing local editorial fallback;
- `source`, `sourceUrl`, and `publishedAt`: copied from `FilmEvent`;
- `trend` and `volume`: `Not available` until signal data exists;
- `opportunityWindow`: 24 hours for Peak, 3 days for Rising, and 7 days for Emerging.

TMDb IDs and titles are omitted because this pipeline does not perform metadata enrichment.

## Score

The score is clamped to `0.0` through `10.0` and rounded to one decimal:

```text
4.0 base
+ recency: 2.0 (<=6h), 1.5 (<=24h), 1.0 (<=48h), 0.5 (<=72h)
+ source: 1.0 (Deadline, Variety, THR), 0.8 (IndieWire), 0.5 (other)
+ timely title keyword: 1.0
+ description completeness >=120 characters: 0.5
+ content completeness >=400 characters: 0.5
+ editorialWeight: 1.0 high, 0.5 medium, 0.0 low
```

Signal thresholds:

- `Peak`: score >= 8.5
- `Rising`: score >= 7.0 and < 8.5
- `Emerging`: score < 7.0

Gemini supplies only the qualitative `editorialWeight`; application code applies its fixed numeric contribution and determines the final score and signal.

## Temporary API

`GET /api/opportunities`

The route calls `collectEvents()` directly and never makes an HTTP request to `/api/rss`. It returns opportunities plus RSS, pre-filter, accepted, rejected, and failed counts. Per-event failures contain only the event ID and a sanitized message.

If no key is configured, the endpoint returns HTTP 503 without collecting RSS or calling Gemini. Responses use `Cache-Control: no-store`.

## Current Limitations

- Results exist only for the current request and are not persisted.
- Calls are capped but run concurrently, so a request can make up to five Gemini calls.
- There is no retry loop, TMDb context, cross-request deduplication, or UI integration.
- Fallback image and unavailable trend/volume values are temporary consequences of the current shared `Opportunity` contract.
