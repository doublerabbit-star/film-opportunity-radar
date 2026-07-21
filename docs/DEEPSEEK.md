# MVP DeepSeek Opportunity Analysis

> Status: Active
> Last Updated: 2026-07

## Scope

The temporary pipeline collects normalized RSS events through the shared collector, applies deterministic eligibility rules, asks DeepSeek for editorial analysis, validates the structured result, and constructs shared `Opportunity` records.

It does not persist results, enrich TMDb metadata, schedule work, or replace the mock opportunities used by the UI.

## Configuration

Set one server-side key:

```text
DEEPSEEK_API_KEY=
```

`DEEPSEEK_MODEL` can optionally override the model. Keys must never use a `NEXT_PUBLIC_` prefix.

The default model is `deepseek-v4-flash`. Calls use the official OpenAI-compatible `POST https://api.deepseek.com/chat/completions` endpoint with Bearer authentication, a 20-second timeout, JSON Output, non-thinking mode, and no automatic retries.

## Preserved Pipeline Behavior

The existing prompt, deterministic pre-filter, Zod validation, opportunity construction, scoring formula, signal thresholds, source attribution, and failure isolation are unchanged.

Candidates are newest-first and limited to five per API request. DeepSeek is not used for filtering. It may reject an event; for accepted events it generates only:

- `title`
- `shortTitle`
- `description`
- `editorialWeight`
- `whyItMatters`
- `contentAngles`
- `titleIdeas`

DeepSeek does not generate category, score, signal, ranking, source attribution, display metrics, media, timing windows, or identifiers. Application code remains responsible for all deterministic fields.

## Temporary API

`GET /api/opportunities`

The route calls `collectEvents()` directly and never makes an HTTP request to `/api/rss`. It returns opportunities plus RSS, pre-filter, accepted, rejected, and failed counts. Per-event failures contain only the event ID and a sanitized message.

If `DEEPSEEK_API_KEY` is not configured, the endpoint returns HTTP 503 without collecting RSS or calling DeepSeek. Responses use `Cache-Control: no-store`.

## Current Limitations

- Results exist only for the current request and are not persisted.
- Calls are capped but run concurrently, so a request can make up to five DeepSeek calls.
- There is no retry loop, TMDb context, cross-request deduplication, or UI integration.
- The retained Gemini transport is inactive and is not imported by the runtime pipeline.
