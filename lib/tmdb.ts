import "server-only";

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_LANGUAGE = "en-US";
const REQUEST_TIMEOUT_MS = 5_000;

export interface TMDbMovieSummary {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface TMDbGenre {
  id: number;
  name: string;
}

export interface TMDbProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TMDbProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TMDbSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TMDbMovieDetails
  extends Omit<TMDbMovieSummary, "genre_ids"> {
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  budget: number;
  genres: TMDbGenre[];
  homepage: string;
  imdb_id: string | null;
  origin_country: string[];
  production_companies: TMDbProductionCompany[];
  production_countries: TMDbProductionCountry[];
  revenue: number;
  runtime: number | null;
  spoken_languages: TMDbSpokenLanguage[];
  status: string;
  tagline: string;
}

export interface TMDbPage<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDbUpcomingMoviesResponse
  extends TMDbPage<TMDbMovieSummary> {
  dates: {
    maximum: string;
    minimum: string;
  };
}

function requireResults<T>(results: TMDbPage<T>, context: string): TMDbPage<T> {
  if (results.results.length === 0) {
    throw new TMDbError(`TMDb returned no movies for ${context}.`);
  }

  return results;
}

interface TMDbErrorResponse {
  status_code?: number;
  status_message?: string;
  success?: boolean;
}

export class TMDbError extends Error {
  readonly httpStatus: number | null;
  readonly tmdbStatusCode: number | null;

  constructor(
    message: string,
    options: { httpStatus?: number; tmdbStatusCode?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "TMDbError";
    this.httpStatus = options.httpStatus ?? null;
    this.tmdbStatusCode = options.tmdbStatusCode ?? null;
  }
}

function getBearerToken(): string {
  const token = process.env.TMDB_BEARER_TOKEN?.trim();

  if (!token) {
    throw new TMDbError(
      "TMDB_BEARER_TOKEN is not configured on the server.",
    );
  }

  return token;
}

async function tmdbFetch<T>(
  path: string,
  searchParams: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const url = new URL(`${TMDB_API_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${getBearerToken()}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof TMDbError) throw error;

    throw new TMDbError("Unable to reach the TMDb API.", { cause: error });
  }

  if (!response.ok) {
    let body: TMDbErrorResponse | null = null;

    try {
      body = (await response.json()) as TMDbErrorResponse;
    } catch {
      // TMDb can occasionally return a non-JSON proxy error.
    }

    throw new TMDbError(
      body?.status_message || `TMDb request failed with HTTP ${response.status}.`,
      {
        httpStatus: response.status,
        tmdbStatusCode: body?.status_code,
      },
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new TMDbError("TMDb returned an invalid JSON response.", {
      httpStatus: response.status,
      cause: error,
    });
  }
}

export async function searchMovie(
  query: string,
): Promise<TMDbPage<TMDbMovieSummary>> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    throw new TMDbError("A non-empty movie search query is required.");
  }

  const results = await tmdbFetch<TMDbPage<TMDbMovieSummary>>("/search/movie", {
    query: normalizedQuery,
    include_adult: false,
    language: DEFAULT_LANGUAGE,
    page: 1,
  });

  return requireResults(results, `the search query "${normalizedQuery}"`);
}

export async function getMovieDetails(id: number): Promise<TMDbMovieDetails> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new TMDbError("A positive integer TMDb movie ID is required.");
  }

  return tmdbFetch<TMDbMovieDetails>(`/movie/${id}`, {
    language: DEFAULT_LANGUAGE,
  });
}

export async function getTrendingMovies(): Promise<
  TMDbPage<TMDbMovieSummary>
> {
  const results = await tmdbFetch<TMDbPage<TMDbMovieSummary>>("/trending/movie/day", {
    language: DEFAULT_LANGUAGE,
  });

  return requireResults(results, "today's trending movies");
}

export async function getUpcomingMovies(): Promise<TMDbUpcomingMoviesResponse> {
  const results = await tmdbFetch<TMDbUpcomingMoviesResponse>("/movie/upcoming", {
    language: DEFAULT_LANGUAGE,
    page: 1,
  });

  requireResults(results, "upcoming movies");
  return results;
}
