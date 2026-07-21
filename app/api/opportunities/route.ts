import { NextResponse } from "next/server";
import {
  generateOpportunities,
  getDeepSeekModel,
  isDeepSeekConfigured,
} from "@/lib/opportunities";
import { OPPORTUNITIES_ROUTE_TIMEOUT_MS } from "@/lib/opportunities/config";
import { logOpportunityTiming } from "@/lib/opportunities/dev-timing";
import { collectEvents } from "@/lib/rss";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

class OpportunitiesRouteTimeoutError extends Error {
  constructor() {
    super("Opportunity generation exceeded the route deadline.");
    this.name = "OpportunitiesRouteTimeoutError";
  }
}

function emptyProcessing() {
  return {
    rssEventCount: 0,
    candidateCount: 0,
    analyzedCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    failedCount: 0,
  };
}

async function withRouteDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new OpportunitiesRouteTimeoutError());
    }, OPPORTUNITIES_ROUTE_TIMEOUT_MS);

    operation(controller.signal).then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export async function GET() {
  const requestStartedAt = performance.now();
  logOpportunityTiming("route:start", requestStartedAt);

  if (!isDeepSeekConfigured()) {
    return NextResponse.json(
      {
        count: 0,
        opportunities: [],
        processing: emptyProcessing(),
        model: getDeepSeekModel(),
        error: "DEEPSEEK_API_KEY is not configured on the server.",
        generatedAt: new Date().toISOString(),
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const result = await withRouteDeadline(async (signal) => {
      const rssStartedAt = performance.now();
      const rss = await collectEvents(undefined, undefined, signal);
      logOpportunityTiming("rss-collection:complete", rssStartedAt, {
        events: rss.events.length,
        failedSources: rss.sources.filter((source) => source.status === "error").length,
      });

      const generationStartedAt = performance.now();
      const generated = await generateOpportunities(rss.events, { signal });
      logOpportunityTiming("generation:complete", generationStartedAt, {
        candidates: generated.candidateCount,
        accepted: generated.acceptedCount,
        rejected: generated.rejectedCount,
        failed: generated.failedCount,
      });

      return { rss, generated };
    });

    const { rss, generated } = result;
    const allCandidatesFailed = generated.candidateCount > 0
      && generated.failedCount === generated.candidateCount;
    const status = allCandidatesFailed ? 502 : 200;

    logOpportunityTiming("response:construct", requestStartedAt, {
      status,
      opportunities: generated.opportunities.length,
    });

    return NextResponse.json(
      {
        count: generated.opportunities.length,
        opportunities: generated.opportunities,
        processing: {
          rssEventCount: rss.events.length,
          candidateCount: generated.candidateCount,
          analyzedCount: generated.analyzedCount,
          acceptedCount: generated.acceptedCount,
          rejectedCount: generated.rejectedCount,
          failedCount: generated.failedCount,
          prefilteredCount: generated.prefilteredCount,
        },
        model: getDeepSeekModel(),
        ...(allCandidatesFailed ? { error: "All DeepSeek analysis requests failed." } : {}),
        ...(generated.failures.length ? { failures: generated.failures } : {}),
        generatedAt: new Date().toISOString(),
      },
      { status, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    const timedOut = error instanceof OpportunitiesRouteTimeoutError;
    const status = timedOut ? 504 : 500;
    logOpportunityTiming("response:error", requestStartedAt, { status, timedOut });
    console.error(
      "[opportunities] route failed:",
      timedOut ? error.message : "Unexpected opportunity pipeline error.",
    );

    return NextResponse.json(
      {
        count: 0,
        opportunities: [],
        processing: emptyProcessing(),
        model: getDeepSeekModel(),
        error: timedOut
          ? "Opportunity generation timed out."
          : "Opportunity generation failed.",
        generatedAt: new Date().toISOString(),
      },
      { status, headers: NO_STORE_HEADERS },
    );
  }
}
