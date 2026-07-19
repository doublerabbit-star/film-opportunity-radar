export type FilmEvent = {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  description?: string;
};

export type Movie = {
  id: string;
  title: string;
  posterUrl?: string;
  releaseDate?: string;
  genres: string[];
};

export type Opportunity = {
  id: string;
  eventId: string;
  tmdbMovieId?: number;
  tmdbTitle?: string;
  category: string;
  title: string;
  shortTitle: string;
  description: string;
  score: number;
  signal: "Peak" | "Rising" | "Emerging";
  image: string;
  imageAlt: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  trend: string;
  volume: string;
  opportunityWindow: string;
  whyItMatters: string;
  contentAngles: string[];
  titleIdeas: string[];
};
