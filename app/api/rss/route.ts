import { NextResponse } from "next/server";
import { collectEvents } from "@/lib/rss";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const result = await collectEvents();

  return NextResponse.json(
    {
      count: result.events.length,
      events: result.events,
      sources: result.sources,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
