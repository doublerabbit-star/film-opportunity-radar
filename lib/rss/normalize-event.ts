import { createHash } from "node:crypto";
import type { FilmEvent } from "../../types/index";
import type { ParsedFeedItem } from "./parse-feed.ts";
import type { RssSource } from "./sources.ts";

const TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "vero_conv",
  "vero_id",
]);
const DESCRIPTION_LIMIT = 1_000;

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#")) {
      const hexadecimal = code[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }

    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

export function cleanFeedText(value: string | null | undefined): string {
  if (!value) return "";

  return decodeHtmlEntities(
    value
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--([\s\S]*?)-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").trim();
}

function truncateDescription(value: string): string {
  if (value.length <= DESCRIPTION_LIMIT) return value;

  const shortened = value.slice(0, DESCRIPTION_LIMIT + 1);
  const wordBoundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, wordBoundary > 0 ? wordBoundary : DESCRIPTION_LIMIT).trim()}...`;
}

export function canonicalizeSourceUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    url.hash = "";

    for (const key of [...url.searchParams.keys()]) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.startsWith("utm_") || TRACKING_PARAMETERS.has(normalizedKey)) {
        url.searchParams.delete(key);
      }
    }

    url.searchParams.sort();
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeTitle(value: string): string {
  return cleanFeedText(value).normalize("NFKC").toLocaleLowerCase("en-US");
}

export function generateEventId(input: {
  sourceUrl?: string | null;
  guid?: string | null;
  source: string;
  title: string;
  publishedAt: string;
}): string {
  const identity = input.sourceUrl
    || input.guid?.trim()
    || `${input.source}\n${normalizeTitle(input.title)}\n${input.publishedAt}`;
  const hash = createHash("sha256").update(identity).digest("hex").slice(0, 24);
  return `evt_${hash}`;
}

function normalizePublishedAt(item: ParsedFeedItem): string | null {
  const date = item.published ?? item.updated;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function getArticleUrl(item: ParsedFeedItem): string | null {
  return canonicalizeSourceUrl(item.url) || canonicalizeSourceUrl(item.id);
}

export function normalizeFeedItem(source: RssSource, item: ParsedFeedItem): FilmEvent | null {
  const title = cleanFeedText(item.title);
  const sourceUrl = getArticleUrl(item);
  const publishedAt = normalizePublishedAt(item);

  if (!title || !sourceUrl || !publishedAt) return null;

  const cleanedDescription = cleanFeedText(item.description);
  const cleanedContent = cleanFeedText(item.content);
  const content = cleanedContent || cleanedDescription || undefined;
  const descriptionSource = cleanedDescription || cleanedContent;
  const description = descriptionSource
    ? truncateDescription(descriptionSource)
    : undefined;

  return {
    id: generateEventId({
      sourceUrl,
      guid: item.id,
      source: source.name,
      title,
      publishedAt,
    }),
    title,
    source: source.name,
    sourceUrl,
    publishedAt,
    ...(description ? { description } : {}),
    ...(content ? { content } : {}),
  };
}
