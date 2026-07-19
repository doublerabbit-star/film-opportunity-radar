import { HomePage } from "@/components/home-page";
import type { HomeMovieEnrichment } from "@/components/home-page";
import { mockOpportunities } from "@/lib/mock-opportunities";
import { getMovieDetails, searchMovie } from "@/lib/tmdb";
import type { TMDbMovieDetails, TMDbMovieSummary } from "@/lib/tmdb";
import type { Opportunity } from "@/types";

export const dynamic = "force-dynamic";

type TMDbMovieMetadata = Pick<
  TMDbMovieDetails | TMDbMovieSummary,
  "overview" | "poster_path" | "release_date" | "title"
>;

function toHomeMovieEnrichment(movie: TMDbMovieMetadata): HomeMovieEnrichment {
  return {
    title: movie.title,
    posterUrl: movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : null,
    releaseDate: movie.release_date,
    overview: movie.overview,
  };
}

async function resolveRelatedMovie(
  opportunity: Opportunity,
): Promise<HomeMovieEnrichment | null> {
  if (opportunity.tmdbMovieId) {
    try {
      const movie = await getMovieDetails(opportunity.tmdbMovieId);
      return toHomeMovieEnrichment(movie);
    } catch {
      // Fall through to the explicit title only when the stable ID fails.
    }
  }

  if (opportunity.tmdbTitle) {
    try {
      const response = await searchMovie(opportunity.tmdbTitle);
      return toHomeMovieEnrichment(response.results[0]);
    } catch {
      return null;
    }
  }

  return null;
}

async function getHomeMovieEnrichment(): Promise<Record<string, HomeMovieEnrichment>> {
  if (!process.env.TMDB_BEARER_TOKEN) return {};

  const associatedOpportunities = mockOpportunities.filter(
    (opportunity) => opportunity.tmdbMovieId || opportunity.tmdbTitle,
  );

  const entries = await Promise.all(
    associatedOpportunities.map(async (opportunity) => {
      const movie = await resolveRelatedMovie(opportunity);
      return movie ? ([opportunity.id, movie] as const) : null;
    }),
  );

  return Object.fromEntries(
    entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null),
  );
}

export default async function Home() {
  const tmdbMovies = await getHomeMovieEnrichment();
  return <HomePage tmdbMovies={tmdbMovies} />;
}
