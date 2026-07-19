export type MockOpportunity = {
  id: string;
  category: string;
  title: string;
  shortTitle: string;
  description: string;
  score: string;
  signal: "Peak" | "Rising" | "Emerging";
  image: string;
  imageAlt: string;
  source: string;
  published: string;
  trend: string;
  volume: string;
  window: string;
  why: string;
  angles: string[];
  titles: string[];
};

export const mockOpportunities: MockOpportunity[] = [
  {
    id: "sequel-anxiety",
    category: "Cultural anxiety",
    title: "The 2000s sequel anxiety",
    shortTitle: "Sequel anxiety",
    description: "Studios are greenlighting 14 franchise continuations this quarter. Audiences are caught between nostalgia and exhaustion.",
    score: "9.2",
    signal: "Peak",
    image: "/images/lead-cinema.png",
    imageAlt: "A woman in a red coat outside a weathered cinema",
    source: "Industry press monitor",
    published: "Today, 04:12 GMT",
    trend: "+340%",
    volume: "2.4M searches / day",
    window: "3-day peak",
    why: "Audience discourse has shifted from anticipation to exhaustion in under 60 days. That creates a rare opening where critical analysis is dramatically outperforming hype coverage, especially when it connects sequel fatigue to the economics of original filmmaking.",
    angles: ["Why we keep getting nostalgia sequels completely wrong", "The ten properties that deserve a second chance", "How sequel saturation is quietly funding original filmmaking"],
    titles: ["Nostalgia Has a Sequel Problem", "The Franchise Hangover Is Here", "Why Hollywood Cannot Leave the 2000s Alone"],
  },
  {
    id: "quiet-film-paradox",
    category: "Streaming economics",
    title: "The quiet film paradox",
    shortTitle: "Quiet film paradox",
    description: "Minimalist films are outperforming tent-poles on per-screen average by four times.",
    score: "8.1",
    signal: "Rising",
    image: "/images/quiet-cinema.png",
    imageAlt: "A solitary audience member in an empty cinema",
    source: "Exhibition data brief",
    published: "Today, 05:44 GMT",
    trend: "+112%",
    volume: "680K searches / day",
    window: "7-day window",
    why: "A cluster of quiet, formally restrained films is holding screens longer than expected. The useful story is not that audiences have rejected spectacle, but that attention is fragmenting into smaller and more committed cultural publics.",
    angles: ["Why audiences are craving screen silence", "The algorithm finally rewards what film school taught", "What a strong per-screen average actually reveals"],
    titles: ["The Films Winning by Whispering", "Quiet Cinema, Loud Results", "The Box Office Has a Volume Problem"],
  },
  {
    id: "practical-effects-renaissance",
    category: "Craft & production",
    title: "Practical effects renaissance",
    shortTitle: "Practical effects",
    description: "Behind-the-scenes footage of handcrafted SFX is outpacing the films themselves.",
    score: "7.8",
    signal: "Rising",
    image: "/images/practical-effects.png",
    imageAlt: "A craftsperson lighting a miniature film set",
    source: "Official video monitor",
    published: "Today, 06:00 GMT",
    trend: "+89%",
    volume: "540K views / day",
    window: "10-day window",
    why: "Process footage is giving audiences a tangible way into film craft. The strongest opportunity is to move beyond the usual practical-versus-digital argument and show how the two practices now depend on one another.",
    angles: ["The death and rebirth of movie magic", "Why AI did not kill practical effects", "The miniature makers becoming stars"],
    titles: ["Movie Magic Has Hands Again", "Inside the Return of the Miniature", "Practical Effects Never Really Left"],
  },
  {
    id: "female-debut-directors",
    category: "Industry shift",
    title: "Female debut directors at box office",
    shortTitle: "Debut directors",
    description: "Three top-ten global films this summer are debut features by women.",
    score: "7.4",
    signal: "Emerging",
    image: "/images/debut-directors.png",
    imageAlt: "Three film directors crossing a studio soundstage",
    source: "Global box office report",
    published: "Today, 07:15 GMT",
    trend: "+67%",
    volume: "320K searches / day",
    window: "2-week window",
    why: "The immediate result is striking, but the deeper story sits in the financing and festival pipelines that made these debuts possible. Treating the pattern as an industry system rather than a novelty will produce the more durable piece.",
    angles: ["What changed in Hollywood financing", "The overlooked festivals that predicted this wave", "Why debut films are becoming safer bets"],
    titles: ["The Debut Directors Rewriting the Top Ten", "A New First-Film Economy", "Hollywood's Most Interesting Directors Are Arriving Early"],
  },
];

export function getOpportunity(id: string) {
  return mockOpportunities.find((item) => item.id === id);
}
