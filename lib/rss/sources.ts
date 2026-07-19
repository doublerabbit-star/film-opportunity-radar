export type RssSource = {
  key: string;
  name: string;
  feedUrl: string;
  enabled: boolean;
};

export const RSS_SOURCES: readonly RssSource[] = [
  {
    key: "deadline",
    name: "Deadline",
    feedUrl: "https://deadline.com/feed/",
    enabled: true,
  },
  {
    key: "variety",
    name: "Variety",
    feedUrl: "https://variety.com/feed/",
    enabled: true,
  },
  {
    key: "hollywood-reporter",
    name: "The Hollywood Reporter",
    feedUrl: "https://www.hollywoodreporter.com/feed/",
    enabled: true,
  },
  {
    key: "indiewire",
    name: "IndieWire",
    feedUrl: "https://www.indiewire.com/feed/",
    enabled: true,
  },
];
