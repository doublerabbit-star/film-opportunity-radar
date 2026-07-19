import type { FilmEvent } from "../../types/index";
import {
  GEMINI_RESPONSE_JSON_SCHEMA,
  parseGeminiAnalysis,
  type GeminiAnalysis,
} from "./analysis-schema.ts";
import {
  GEMINI_API_BASE_URL,
  GEMINI_TIMEOUT_MS,
  getGeminiApiKey,
  getGeminiModel,
} from "./config.ts";
import { buildOpportunityPrompt } from "./prompt.ts";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
};

export class GeminiRequestError extends Error {
  readonly publicMessage: string;

  constructor(message: string, publicMessage: string, options: { cause?: unknown } = {}) {
    super(message, options);
    this.name = "GeminiRequestError";
    this.publicMessage = publicMessage;
  }
}

function requireApiKey(): string {
  const key = getGeminiApiKey();
  if (!key) {
    throw new GeminiRequestError(
      "No supported Gemini API key is configured.",
      "Gemini is not configured on the server.",
    );
  }
  return key;
}

function publicHttpError(status: number): string {
  if (status === 401 || status === 403) return "Gemini authentication failed.";
  if (status === 429) return "Gemini rate limit reached.";
  if (status >= 500) return "Gemini is temporarily unavailable.";
  return `Gemini request failed with HTTP ${status}.`;
}

export async function analyzeEventWithGemini(
  event: FilmEvent,
  fetcher: typeof fetch = fetch,
): Promise<GeminiAnalysis> {
  const model = getGeminiModel();
  const url = `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`;
  let response: Response;

  try {
    response = await fetcher(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": requireApiKey(),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildOpportunityPrompt(event) }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1_500,
          responseFormat: {
            text: {
              mimeType: "application/json",
              schema: GEMINI_RESPONSE_JSON_SCHEMA,
            },
          },
        },
      }),
    });
  } catch (error) {
    if (error instanceof GeminiRequestError) throw error;
    const timedOut = error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new GeminiRequestError(
      `Gemini request ${timedOut ? "timed out" : "failed"}.`,
      timedOut ? "Gemini request timed out." : "Unable to reach Gemini.",
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new GeminiRequestError(
      `Gemini returned HTTP ${response.status}.`,
      publicHttpError(response.status),
    );
  }

  let body: GeminiResponse;
  try {
    body = await response.json() as GeminiResponse;
  } catch (error) {
    throw new GeminiRequestError(
      "Gemini returned an invalid HTTP response.",
      "Gemini returned an unreadable response.",
      { cause: error },
    );
  }

  const text = body.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    const detail = body.promptFeedback?.blockReason
      || body.candidates?.[0]?.finishReason
      || "no candidate text";
    throw new GeminiRequestError(
      `Gemini returned no analysis: ${detail}.`,
      "Gemini returned no usable analysis.",
    );
  }

  return parseGeminiAnalysis(text);
}
