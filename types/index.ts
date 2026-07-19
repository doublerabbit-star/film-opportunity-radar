export type FilmEvent = {
  id: string;
  title: string;
  source: string;
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
  score: number;
  angles: string[];
  titleIdeas: string[];
};