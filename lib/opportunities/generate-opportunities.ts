import type { FilmEvent, Opportunity } from "../../types/index";
import { AnalysisOutputError, type Analysis } from "./analysis-schema.ts";
import { buildOpportunity } from "./build-opportunity.ts";
import { DeepSeekRequestError, analyzeEventWithDeepSeek } from "./deepseek.ts";
import { logOpportunityTiming } from "./dev-timing.ts";
import { selectCandidateEvents } from "./prefilter-events.ts";

export type EventAnalyzer = (event: FilmEvent, signal?: AbortSignal) => Promise<Analysis>;

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
  if (error instanceof DeepSeekRequestError || error instanceof AnalysisOutputError) {
    return error.publicMessage;
  }
  return "Event analysis failed.";
}

export async function generateOpportunities(
  events: readonly FilmEvent[],
  options: { analyzer?: EventAnalyzer; now?: Date; limit?: number; signal?: AbortSignal } = {},
): Promise<OpportunityGenerationResult> {
  const analyzer: EventAnalyzer = options.analyzer
    ?? ((event, signal) => analyzeEventWithDeepSeek(event, fetch, signal));
  const now = options.now ?? new Date();
  const prefilterStartedAt = performance.now();
  const prefilter = selectCandidateEvents(events, { now, limit: options.limit });
  logOpportunityTiming("candidate-filter:complete", prefilterStartedAt, {
    input: events.length,
    candidates: prefilter.candidates.length,
    rejected: prefilter.rejected.length,
  });

  const results = await Promise.all(prefilter.candidates.map(async (event) => {
    try {
      const analysis = await analyzer(event, options.signal);
      return analysis.isOpportunity
        ? { status: "accepted" as const, opportunity: buildOpportunity(event, analysis, now) }
        : { status: "rejected" as const };
    } catch (error) {
      console.error(`[deepseek] ${event.id}:`, error instanceof Error ? error.message : error);
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
