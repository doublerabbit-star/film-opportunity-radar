import { HomePage } from "@/components/home-page";
import type { HomeMovieEnrichment } from "@/components/home-page";
import { searchMovie } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

const HOME_MOVIE_QUERIES: Record<string, string> = {
  "sequel-anxiety": "Mission: Impossible - The Final Reckoning",
  "quiet-film-paradox": "The Quiet Girl",
  "practical-effects-renaissance": "Oppenheimer",
  "female-debut-directors": "Past Lives",
};

async function getHomeMovieEnrichment(): Promise<Record<string, HomeMovieEnrichment>> {
  if (!process.env.TMDB_BEARER_TOKEN) return {};

  const entries = await Promise.all(
    Object.entries(HOME_MOVIE_QUERIES).map(async ([opportunityId, query]) => {
      try {
        const response = await searchMovie(query);
        const movie = response.results[0];

        return [
          opportunityId,
          {
            title: movie.title,
            posterUrl: movie.poster_path
              ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
              : null,
            releaseDate: movie.release_date,
            overview: movie.overview,
          } satisfies HomeMovieEnrichment,
        ] as const;
      } catch {
        return null;
      }
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
