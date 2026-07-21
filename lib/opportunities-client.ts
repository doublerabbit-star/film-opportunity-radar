import type { Opportunity } from "@/types";
import { isOpportunityRecord } from "@/lib/opportunity-cache";

const OPPORTUNITIES_REQUEST_TIMEOUT_MS = 40_000;

export type OpportunitiesApiResponse = {
  count: number;
  opportunities: Opportunity[];
  model: string;
  generatedAt: string;
  error?: string;
};

export class OpportunitiesRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpportunitiesRequestError";
  }
}

function isApiResponse(value: unknown): value is OpportunitiesApiResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return Array.isArray(response.opportunities)
    && response.opportunities.every(isOpportunityRecord)
    && typeof response.count === "number"
    && typeof response.model === "string"
    && typeof response.generatedAt === "string";
}

export async function fetchOpportunities(
  externalSignal?: AbortSignal,
): Promise<OpportunitiesApiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), OPPORTUNITIES_REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    const response = await fetch("/api/opportunities", {
      cache: "no-store",
      signal: controller.signal,
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new OpportunitiesRequestError("The briefing service returned an unreadable response.");
    }

    if (!response.ok) {
      const serverMessage = body && typeof body === "object" && "error" in body
        && typeof body.error === "string"
        ? body.error
        : null;
      throw new OpportunitiesRequestError(
        serverMessage || "The briefing service is temporarily unavailable.",
      );
    }

    if (!isApiResponse(body)) {
      throw new OpportunitiesRequestError("The briefing service returned an unexpected response.");
    }

    return body;
  } catch (error) {
    if (error instanceof OpportunitiesRequestError) throw error;
    if (externalSignal?.aborted) throw error;
    if (controller.signal.aborted) {
      throw new OpportunitiesRequestError("The briefing took too long to load. Please try again.");
    }
    throw new OpportunitiesRequestError("The briefing could not be loaded. Please try again.");
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromCaller);
  }
}
