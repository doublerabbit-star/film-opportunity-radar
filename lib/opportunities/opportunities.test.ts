import assert from "node:assert/strict";
import test from "node:test";
import type { FilmEvent } from "../../types/index.ts";
import {
  AnalysisOutputError,
  parseAnalysis,
  type Analysis,
} from "./analysis-schema.ts";
import { analyzeEventWithDeepSeek, buildDeepSeekRequestBody } from "./deepseek.ts";
import { generateOpportunities } from "./generate-opportunities.ts";
import { selectCandidateEvents } from "./prefilter-events.ts";
import { calculateOpportunityScore, deriveSignal } from "./score-opportunity.ts";

const NOW = new Date("2026-07-19T12:00:00.000Z");
const substantialText = "A detailed film-industry report with enough context for editorial analysis. ".repeat(8);

function filmEvent(overrides: Partial<FilmEvent> = {}): FilmEvent {
  return {
    id: "evt_primary",
    title: "Studio Releases First Trailer for New Film",
    source: "Variety",
    sourceUrl: "https://example.com/primary",
    publishedAt: "2026-07-19T09:00:00.000Z",
    description: substantialText.slice(0, 180),
    content: substantialText,
    ...overrides,
  };
}

const acceptedJson = JSON.stringify({
  isOpportunity: true,
  title: "The trailer strategy behind a new studio launch",
  shortTitle: "Trailer strategy",
  description: "A timely opening to examine how studios introduce an original film.",
  editorialWeight: "high",
  whyItMatters: "The first trailer establishes the public language around the release while audience expectations are still forming.",
  contentAngles: ["How the trailer frames the film", "What the launch reveals about studio positioning"],
  titleIdeas: ["How a Film Introduces Itself", "Inside the First-Trailer Strategy"],
});

test("pre-filter removes stale, television-only, short, and duplicate events", () => {
  const result = selectCandidateEvents([
    filmEvent(),
    filmEvent({ id: "evt_duplicate", sourceUrl: "https://example.com/duplicate" }),
    filmEvent({ id: "evt_stale", title: "An Older Film Report", sourceUrl: "https://example.com/stale", publishedAt: "2026-07-14T09:00:00.000Z" }),
    filmEvent({ id: "evt_tv", title: "Series Adds Showrunner for Season Two", sourceUrl: "https://example.com/tv", description: substantialText.replaceAll("film", "program"), content: substantialText.replaceAll("film", "program") }),
    filmEvent({ id: "evt_short", title: "Brief Casting Note", sourceUrl: "https://example.com/short", description: "Too short.", content: "Too short." }),
  ], { now: NOW });

  assert.equal(result.candidates.length, 1);
  assert.deepEqual(
    result.rejected.map((item) => item.reason),
    ["duplicate", "television-only", "insufficient-text", "stale"],
  );
});

test("calculates a deterministic score and clamps it to ten", () => {
  assert.equal(calculateOpportunityScore(filmEvent(), "high", NOW), 10);
  assert.equal(calculateOpportunityScore(filmEvent(), "high", NOW), 10);
});

test("derives signals from explicit thresholds", () => {
  assert.equal(deriveSignal(8.5), "Peak");
  assert.equal(deriveSignal(7), "Rising");
  assert.equal(deriveSignal(6.9), "Emerging");
});

test("validates an accepted analysis result", () => {
  const result = parseAnalysis(acceptedJson);
  assert.equal(result.isOpportunity, true);
  if (result.isOpportunity) assert.equal(result.editorialWeight, "high");
});

test("builds a DeepSeek JSON Output request", () => {
  const request = buildDeepSeekRequestBody(filmEvent());

  assert.equal(request.model, "deepseek-v4-flash");
  assert.deepEqual(request.response_format, { type: "json_object" });
  assert.deepEqual(request.thinking, { type: "disabled" });
  assert.equal(request.max_tokens, 1_500);
  assert.equal(request.stream, false);
  assert.equal(request.messages.length, 1);
  assert.match(request.messages[0].content, /return JSON/i);
});

test("validates a rejected analysis result", () => {
  assert.deepEqual(
    parseAnalysis(JSON.stringify({ isOpportunity: false, reason: "No meaningful creator angle." })),
    { isOpportunity: false, reason: "No meaningful creator angle." },
  );
});

test("rejects malformed or unexpected provider output", () => {
  assert.throws(() => parseAnalysis("not json"), AnalysisOutputError);
  assert.throws(
    () => parseAnalysis(JSON.stringify({ ...JSON.parse(acceptedJson), score: 9.9 })),
    AnalysisOutputError,
  );
});

test("calls DeepSeek with server-side Bearer authentication and parses JSON", async () => {
  const previousKey = process.env.DEEPSEEK_API_KEY;
  process.env.DEEPSEEK_API_KEY = "test-deepseek-key";

  try {
    const analysis = await analyzeEventWithDeepSeek(filmEvent(), async (input, init) => {
      assert.equal(input, "https://api.deepseek.com/chat/completions");
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-deepseek-key");
      return new Response(JSON.stringify({
        choices: [{
          finish_reason: "stop",
          message: { content: acceptedJson },
        }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    });

    assert.equal(analysis.isOpportunity, true);
  } finally {
    if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = previousKey;
  }
});

test("isolates rejected and failed analyses while constructing valid opportunities", async () => {
  const events = [
    filmEvent(),
    filmEvent({ id: "evt_rejected", title: "Film Festival Publishes Routine Timetable", sourceUrl: "https://example.com/rejected" }),
    filmEvent({ id: "evt_failed", title: "Director Announces Film Production", sourceUrl: "https://example.com/failed" }),
  ];
  const analyzer = async (event: FilmEvent): Promise<Analysis> => {
    if (event.id === "evt_rejected") return { isOpportunity: false, reason: "Routine notice." };
    if (event.id === "evt_failed") throw new AnalysisOutputError("Malformed result.");
    return parseAnalysis(acceptedJson);
  };

  const result = await generateOpportunities(events, { analyzer, now: NOW });

  assert.equal(result.acceptedCount, 1);
  assert.equal(result.rejectedCount, 1);
  assert.equal(result.failedCount, 1);
  assert.equal(result.opportunities[0].id, "opp_primary");
  assert.equal(result.opportunities[0].eventId, "evt_primary");
  assert.equal(result.opportunities[0].editorialWeight, "high");
  assert.equal(result.failures[0].error, "The analysis provider returned an invalid structured result.");
});
