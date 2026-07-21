import type { FilmEvent } from "../../types/index";
import { logSanitizedNetworkError } from "../sanitized-network-error.ts";
import { parseAnalysis, type Analysis } from "./analysis-schema.ts";
import {
  DEEPSEEK_API_BASE_URL,
  DEEPSEEK_TIMEOUT_MS,
  getDeepSeekApiKey,
  getDeepSeekModel,
} from "./config.ts";
import { logOpportunityTiming } from "./dev-timing.ts";
import { buildOpportunityPrompt } from "./prompt.ts";

type DeepSeekResponse = {
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: string | null;
    };
  }>;
};

type SanitizedDeepSeekError = {
  message: string | null;
  type: string | null;
  param: string | null;
  code: string | number | null;
};

export class DeepSeekRequestError extends Error {
  readonly publicMessage: string;

  constructor(message: string, publicMessage: string, options: { cause?: unknown } = {}) {
    super(message, options);
    this.name = "DeepSeekRequestError";
    this.publicMessage = publicMessage;
  }
}

function requireApiKey(): string {
  const key = getDeepSeekApiKey();
  if (!key) {
    throw new DeepSeekRequestError(
      "DEEPSEEK_API_KEY is not configured.",
      "DeepSeek is not configured on the server.",
    );
  }
  return key;
}

function publicHttpError(status: number): string {
  if (status === 401 || status === 403) return "DeepSeek authentication failed.";
  if (status === 402) return "DeepSeek account balance is insufficient.";
  if (status === 429) return "DeepSeek rate limit reached.";
  if (status >= 500) return "DeepSeek is temporarily unavailable.";
  return `DeepSeek request failed with HTTP ${status}.`;
}

export function buildDeepSeekRequestBody(event: FilmEvent) {
  return {
    model: getDeepSeekModel(),
    messages: [{ role: "user" as const, content: buildOpportunityPrompt(event) }],
    thinking: { type: "disabled" as const },
    response_format: { type: "json_object" as const },
    max_tokens: 1_500,
    stream: false,
  };
}

function sanitizeDeepSeekErrorBody(body: unknown): SanitizedDeepSeekError {
  const error = typeof body === "object" && body !== null && "error" in body
    && typeof body.error === "object" && body.error !== null
    ? body.error as Record<string, unknown>
    : {};

  return {
    message: typeof error.message === "string" ? error.message : null,
    type: typeof error.type === "string" ? error.type : null,
    param: typeof error.param === "string" ? error.param : null,
    code: typeof error.code === "string" || typeof error.code === "number"
      ? error.code
      : null,
  };
}

async function readAndLogDeepSeekError(
  response: Response,
  targetHost: string,
): Promise<SanitizedDeepSeekError> {
  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    // A non-JSON upstream error still receives a controlled public response.
  }

  const sanitized = sanitizeDeepSeekErrorBody(body);
  if (process.env.NODE_ENV === "development") {
    console.error(
      "[upstream:deepseek] http-error",
      JSON.stringify({ targetHost, ...sanitized }),
    );
  }
  return sanitized;
}

export async function analyzeEventWithDeepSeek(
  event: FilmEvent,
  fetcher: typeof fetch = fetch,
  parentSignal?: AbortSignal,
): Promise<Analysis> {
  const model = getDeepSeekModel();
  const url = `${DEEPSEEK_API_BASE_URL}/chat/completions`;
  const targetHost = new URL(url).hostname;
  const startedAt = performance.now();
  const timeoutSignal = AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS);
  const signal = parentSignal
    ? AbortSignal.any([timeoutSignal, parentSignal])
    : timeoutSignal;
  let response: Response;

  logOpportunityTiming("deepseek-request:start", startedAt, { eventId: event.id, model });

  try {
    response = await fetcher(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requireApiKey()}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal,
      body: JSON.stringify(buildDeepSeekRequestBody(event)),
    });
  } catch (error) {
    if (error instanceof DeepSeekRequestError) throw error;
    logSanitizedNetworkError("deepseek", targetHost, error);
    const timedOut = error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError");
    logOpportunityTiming("deepseek-request:error", startedAt, {
      eventId: event.id,
      timedOut,
    });
    throw new DeepSeekRequestError(
      `DeepSeek request ${timedOut ? "timed out" : "failed"}.`,
      timedOut ? "DeepSeek request timed out." : "Unable to reach DeepSeek.",
      { cause: error },
    );
  }

  logOpportunityTiming("deepseek-request:response", startedAt, {
    eventId: event.id,
    status: response.status,
  });

  if (!response.ok) {
    const upstreamError = await readAndLogDeepSeekError(response, targetHost);
    throw new DeepSeekRequestError(
      `DeepSeek returned HTTP ${response.status}${upstreamError.message ? `: ${upstreamError.message}` : ""}.`,
      publicHttpError(response.status),
    );
  }

  let body: DeepSeekResponse;
  try {
    body = await response.json() as DeepSeekResponse;
  } catch (error) {
    throw new DeepSeekRequestError(
      "DeepSeek returned an invalid HTTP response.",
      "DeepSeek returned an unreadable response.",
      { cause: error },
    );
  }

  const choice = body.choices?.[0];
  const text = choice?.message?.content?.trim();
  if (!text) {
    throw new DeepSeekRequestError(
      `DeepSeek returned no analysis: ${choice?.finish_reason || "no message content"}.`,
      "DeepSeek returned no usable analysis.",
    );
  }

  const parseStartedAt = performance.now();
  const analysis = parseAnalysis(text);
  logOpportunityTiming("deepseek-output:validated", parseStartedAt, {
    eventId: event.id,
    accepted: analysis.isOpportunity,
  });
  return analysis;
}
