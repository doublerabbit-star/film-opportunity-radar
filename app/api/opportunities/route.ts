import { NextResponse } from "next/server";
import {
  generateOpportunities,
  getGeminiModel,
  isGeminiConfigured,
} from "@/lib/opportunities";
import { collectEvents } from "@/lib/rss";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      {
        count: 0,
        opportunities: [],
        processing: {
          rssEventCount: 0,
          candidateCount: 0,
          analyzedCount: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          failedCount: 0,
        },
        model: getGeminiModel(),
        error: "GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not configured on the server.",
        generatedAt: new Date().toISOString(),
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const rss = await collectEvents();
  const generated = await generateOpportunities(rss.events);

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
      model: getGeminiModel(),
      ...(generated.failures.length ? { failures: generated.failures } : {}),
      generatedAt: new Date().toISOString(),
    },
    { headers: NO_STORE_HEADERS },
  );
}
