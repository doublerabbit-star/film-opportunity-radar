export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
export const GEMINI_TIMEOUT_MS = 20_000;
export const DEEPSEEK_API_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
export const DEEPSEEK_TIMEOUT_MS = 20_000;
export const OPPORTUNITIES_ROUTE_TIMEOUT_MS = 35_000;
export const MAX_ANALYSIS_CANDIDATES = 5;
export const MAX_GEMINI_CANDIDATES = MAX_ANALYSIS_CANDIDATES;
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

export function getDeepSeekModel(): string {
  return process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL;
}

export function getDeepSeekApiKey(): string | null {
  return process.env.DEEPSEEK_API_KEY?.trim() || null;
}

export function isDeepSeekConfigured(): boolean {
  return getDeepSeekApiKey() !== null;
}
