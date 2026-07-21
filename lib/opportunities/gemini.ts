import type { FilmEvent } from "../../types/index";
import { logSanitizedNetworkError } from "../sanitized-network-error.ts";
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
import { logOpportunityTiming } from "./dev-timing.ts";
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

type SanitizedGeminiError = {
  code: number | string | null;
  status: string | null;
  message: string | null;
  details: unknown[];
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

export function buildGeminiRequestBody(event: FilmEvent) {
  return {
    contents: [{ parts: [{ text: buildOpportunityPrompt(event) }] }],
    generationConfig: {
      maxOutputTokens: 1_500,
      responseMimeType: "application/json",
      responseSchema: GEMINI_RESPONSE_JSON_SCHEMA,
    },
  };
}

function sanitizeGeminiErrorBody(body: unknown): SanitizedGeminiError {
  const error = typeof body === "object" && body !== null && "error" in body
    && typeof body.error === "object" && body.error !== null
    ? body.error as Record<string, unknown>
    : {};

  return {
    code: typeof error.code === "number" || typeof error.code === "string"
      ? error.code
      : null,
    status: typeof error.status === "string" ? error.status : null,
    message: typeof error.message === "string" ? error.message : null,
    details: Array.isArray(error.details) ? error.details : [],
  };
}

async function readAndLogGeminiError(response: Response, targetHost: string): Promise<SanitizedGeminiError> {
  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    // A non-JSON upstream error still receives a controlled public response.
  }

  const sanitized = sanitizeGeminiErrorBody(body);
  if (process.env.NODE_ENV === "development") {
    console.error(
      "[upstream:gemini] http-error",
      JSON.stringify({ targetHost, ...sanitized }),
    );
  }
  return sanitized;
}

export async function analyzeEventWithGemini(
  event: FilmEvent,
  fetcher: typeof fetch = fetch,
  parentSignal?: AbortSignal,
): Promise<GeminiAnalysis> {
  const model = getGeminiModel();
  const url = `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`;
  const targetHost = new URL(url).hostname;
  const startedAt = performance.now();
  const timeoutSignal = AbortSignal.timeout(GEMINI_TIMEOUT_MS);
  const signal = parentSignal
    ? AbortSignal.any([timeoutSignal, parentSignal])
    : timeoutSignal;
  let response: Response;

  logOpportunityTiming("gemini-request:start", startedAt, { eventId: event.id, model });

  try {
    response = await fetcher(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": requireApiKey(),
      },
      cache: "no-store",
      signal,
      body: JSON.stringify(buildGeminiRequestBody(event)),
    });
  } catch (error) {
    if (error instanceof GeminiRequestError) throw error;
    logSanitizedNetworkError("gemini", targetHost, error);
    const timedOut = error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError");
    const causeCode = error instanceof Error
      && "cause" in error
      && typeof error.cause === "object"
      && error.cause !== null
      && "code" in error.cause
      && typeof error.cause.code === "string"
      ? error.cause.code
      : "unavailable";
    logOpportunityTiming("gemini-request:error", startedAt, {
      eventId: event.id,
      timedOut,
      causeCode,
    });
    throw new GeminiRequestError(
      `Gemini request ${timedOut ? "timed out" : "failed"}.`,
      timedOut ? "Gemini request timed out." : "Unable to reach Gemini.",
      { cause: error },
    );
  }

  logOpportunityTiming("gemini-request:response", startedAt, {
    eventId: event.id,
    status: response.status,
  });

  if (!response.ok) {
    const upstreamError = await readAndLogGeminiError(response, targetHost);
    throw new GeminiRequestError(
      `Gemini returned HTTP ${response.status}${upstreamError.message ? `: ${upstreamError.message}` : ""}.`,
      publicHttpError(response.status),
    );
  }

  let body: GeminiResponse;
  const bodyStartedAt = performance.now();
  try {
    body = await response.json() as GeminiResponse;
  } catch (error) {
    throw new GeminiRequestError(
      "Gemini returned an invalid HTTP response.",
      "Gemini returned an unreadable response.",
      { cause: error },
    );
  }
  logOpportunityTiming("gemini-output:body-parsed", bodyStartedAt, { eventId: event.id });

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

  const parseStartedAt = performance.now();
  const analysis = parseGeminiAnalysis(text);
  logOpportunityTiming("gemini-output:validated", parseStartedAt, {
    eventId: event.id,
    accepted: analysis.isOpportunity,
  });
  return analysis;
}
