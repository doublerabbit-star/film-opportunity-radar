export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
export const GEMINI_TIMEOUT_MS = 20_000;
export const OPPORTUNITIES_ROUTE_TIMEOUT_MS = 35_000;
export const MAX_GEMINI_CANDIDATES = 5;
export const MAX_EVENT_AGE_HOURS = 72;
export const MIN_EVENT_TEXT_LENGTH = 120;

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim()
    || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
    || null;
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKey() !== null;
}
