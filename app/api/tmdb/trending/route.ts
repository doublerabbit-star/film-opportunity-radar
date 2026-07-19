import { NextResponse } from "next/server";
import { getTrendingMovies, TMDbError } from "@/lib/tmdb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const movies = await getTrendingMovies();
    return NextResponse.json(movies);
  } catch (error) {
    if (error instanceof TMDbError) {
      const status = error.httpStatus && error.httpStatus >= 400
        ? error.httpStatus
        : 500;

      return NextResponse.json(
        {
          error: "TMDb request failed.",
          message: error.message,
          tmdbStatusCode: error.tmdbStatusCode,
        },
        { status },
      );
    }

    console.error("Unexpected TMDb integration error:", error);

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
