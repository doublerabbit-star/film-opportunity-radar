import type { FilmEvent, Opportunity } from "../../types/index";
import { GeminiOutputError, type GeminiAnalysis } from "./analysis-schema.ts";
import { buildOpportunity } from "./build-opportunity.ts";
import { GeminiRequestError, analyzeEventWithGemini } from "./gemini.ts";
import { selectCandidateEvents } from "./prefilter-events.ts";

export type EventAnalyzer = (event: FilmEvent) => Promise<GeminiAnalysis>;

export type OpportunityFailure = {
  eventId: string;
  error: string;
};

export type OpportunityGenerationResult = {
  opportunities: Opportunity[];
  candidateCount: number;
  analyzedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  failedCount: number;
  prefilteredCount: number;
  failures: OpportunityFailure[];
};

function clientSafeFailure(error: unknown): string {
  if (error instanceof GeminiRequestError || error instanceof GeminiOutputError) {
    return error.publicMessage;
  }
  return "Event analysis failed.";
}

export async function generateOpportunities(
  events: readonly FilmEvent[],
  options: { analyzer?: EventAnalyzer; now?: Date; limit?: number } = {},
): Promise<OpportunityGenerationResult> {
  const analyzer = options.analyzer ?? analyzeEventWithGemini;
  const now = options.now ?? new Date();
  const prefilter = selectCandidateEvents(events, { now, limit: options.limit });

  const results = await Promise.all(prefilter.candidates.map(async (event) => {
    try {
      const analysis = await analyzer(event);
      return analysis.isOpportunity
        ? { status: "accepted" as const, opportunity: buildOpportunity(event, analysis, now) }
        : { status: "rejected" as const };
    } catch (error) {
      console.error(`[gemini] ${event.id}:`, error instanceof Error ? error.message : error);
      return {
        status: "failed" as const,
        failure: { eventId: event.id, error: clientSafeFailure(error) },
      };
    }
  }));

  const opportunities = results
    .filter((result): result is Extract<typeof result, { status: "accepted" }> => result.status === "accepted")
    .map((result) => result.opportunity)
    .sort((left, right) => right.score - left.score);
  const rejectedCount = results.filter((result) => result.status === "rejected").length;
  const failures = results
    .filter((result): result is Extract<typeof result, { status: "failed" }> => result.status === "failed")
    .map((result) => result.failure);

  return {
    opportunities,
    candidateCount: prefilter.candidates.length,
    analyzedCount: results.length,
    acceptedCount: opportunities.length,
    rejectedCount,
    failedCount: failures.length,
    prefilteredCount: prefilter.rejected.length,
    failures,
  };
}
