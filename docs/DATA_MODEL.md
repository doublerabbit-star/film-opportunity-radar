# MVP Data Model and Pipeline Contract

> Project: Film Opportunity Radar  
> Version: v0.1 (MVP)  
> Status: Implemented  
> Last Updated: 2026-07

## Purpose

This document defines the smallest shared contract needed to implement the RSS to Gemini pipeline without introducing a second Opportunity model.

The pipeline order and module responsibilities are already defined in `ARCHITECTURE.md`. Before this audit, the field-level handoffs were not defined.

## Current Implementation

`types/index.ts` contains the shared `FilmEvent`, `Movie`, and `Opportunity` types. `Opportunity` is the canonical contract used by the current pages.

`lib/mock-opportunities.ts` contains mock records typed as `Opportunity`. Home, Opportunity Detail, Watchlist, and TMDb enrichment all consume the shared type directly.

No parallel `MockOpportunity` or page-level Opportunity data model remains.

## Minimal MVP Contract

The shared types use the following MVP contract.

### FilmEvent

| Field | Type | Owner | Purpose |
| --- | --- | --- | --- |
| `id` | `string` | Parser | Stable event identifier derived from the RSS item GUID or link |
| `title` | `string` | Parser | Source event title |
| `description` | `string?` | Parser | Cleaned source summary |
| `source` | `string` | Collector | Human-readable publisher or feed name |
| `sourceUrl` | `string` | Collector | Original item URL for attribution |
| `publishedAt` | `string` | Parser | ISO 8601 publication timestamp |

The shared `FilmEvent` type contains all of these fields.

### Opportunity

| Field | Type | Owner | Purpose |
| --- | --- | --- | --- |
| `id` | `string` | Application | Stable opportunity identifier and route slug |
| `eventId` | `string` | Pipeline | Foreign key to the normalized event |
| `tmdbMovieId` | `number?` | Metadata Service | Stable TMDb association |
| `tmdbTitle` | `string?` | Metadata Service | Title-search fallback when the ID is unavailable |
| `category` | `string` | Opportunity Engine | Editorial department |
| `title` | `string` | AI Generator | Opportunity headline |
| `shortTitle` | `string` | AI Generator | Compact display headline |
| `description` | `string` | AI Generator | Short opportunity summary |
| `score` | `number` | Opportunity Engine | Numeric score used for ranking |
| `signal` | `"Peak" \| "Rising" \| "Emerging"` | Opportunity Engine | Score-derived status |
| `image` | `string` | Metadata Service | TMDb poster URL or local fallback |
| `imageAlt` | `string` | Metadata Service | Accessible image description |
| `source` | `string` | Event copy | Human-readable source name |
| `sourceUrl` | `string` | Event copy | Original source URL |
| `publishedAt` | `string` | Event copy | ISO 8601 source publication timestamp |
| `trend` | `string` | Opportunity Engine | Display-ready trend signal |
| `volume` | `string` | Opportunity Engine | Display-ready supporting volume |
| `opportunityWindow` | `string` | Opportunity Engine | Recommended publishing window |
| `whyItMatters` | `string` | AI Generator | Editorial rationale |
| `contentAngles` | `string[]` | AI Generator | Creator-ready discussion angles |
| `titleIdeas` | `string[]` | AI Generator | Suggested working headlines |

`id` remains the route slug. A separate persisted `slug` field is not required for the MVP.

## Completed Compatibility Migration

The previous mock fields were migrated as follows:

| Current `MockOpportunity` | Canonical `Opportunity` |
| --- | --- |
| `id` | `id` and route slug |
| `published` | `publishedAt` |
| `window` | `opportunityWindow` |
| `why` | `whyItMatters` |
| `angles` | `contentAngles` |
| `titles` | `titleIdeas` |
| string `score` | numeric `score` |

The legacy names are no longer present in runtime data. UI components format timestamps and numeric scores rather than storing formatted values in the record.

## Pipeline Ownership

```text
RSS Collector
  -> preserves source, sourceUrl, title, description, and publication time
Event Parser
  -> normalizes FilmEvent and creates its stable id
TMDb Metadata Service
  -> adds the explicit movie association and display image when available
Opportunity Engine
  -> determines category, score, signal, trend, volume, and opportunity window
Gemini AI Generator
  -> creates title, shortTitle, description, whyItMatters, contentAngles, and titleIdeas
Page / Persistence
  -> ranks by score, displays the result, and stores the event relationship
```

Gemini must not calculate the score, assign rank, or replace source attribution. Generated output must be validated before it is stored or rendered.

## Supabase Fit

The existing three-table plan remains sufficient:

- `events` stores `FilmEvent`, including the original source URL and publication time.
- `movies` stores reusable TMDb metadata.
- `opportunities` stores the event foreign key, score fields, and Gemini-generated analysis.

Arrays such as `contentAngles` and `titleIdeas` can use PostgreSQL `jsonb` for the MVP. Database-managed primary keys and timestamps do not need additional application-model fields yet.

## Deliberately Excluded

The MVP contract does not add workflow status, confidence scores, prompt versions, raw AI responses, embeddings, personalization data, or cloud Watchlist ownership. None is required for the current pipeline or product scope.
