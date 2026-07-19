import { z } from "zod";

const editorialText = z.string().trim().min(1).max(1_500);
const editorialList = z.array(z.string().trim().min(1).max(300)).min(2).max(4);

export const acceptedAnalysisSchema = z.object({
  isOpportunity: z.literal(true),
  title: z.string().trim().min(1).max(120),
  shortTitle: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(400),
  editorialWeight: z.enum(["high", "medium", "low"]),
  whyItMatters: editorialText,
  contentAngles: editorialList,
  titleIdeas: editorialList,
}).strict();

export const rejectedAnalysisSchema = z.object({
  isOpportunity: z.literal(false),
  reason: z.string().trim().min(1).max(400),
}).strict();

export const geminiAnalysisSchema = z.discriminatedUnion("isOpportunity", [
  acceptedAnalysisSchema,
  rejectedAnalysisSchema,
]);

export type AcceptedGeminiAnalysis = z.infer<typeof acceptedAnalysisSchema>;
export type GeminiAnalysis = z.infer<typeof geminiAnalysisSchema>;

export const GEMINI_RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    isOpportunity: { type: "boolean" },
    reason: { type: "string" },
    title: { type: "string" },
    shortTitle: { type: "string" },
    description: { type: "string" },
    editorialWeight: { type: "string", enum: ["high", "medium", "low"] },
    whyItMatters: { type: "string" },
    contentAngles: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" },
    },
    titleIdeas: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" },
    },
  },
  required: ["isOpportunity"],
} as const;

export class GeminiOutputError extends Error {
  readonly publicMessage = "Gemini returned an invalid structured result.";

  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message, options);
    this.name = "GeminiOutputError";
  }
}

export function parseGeminiAnalysis(rawText: string): GeminiAnalysis {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new GeminiOutputError("Gemini returned malformed JSON.", { cause: error });
  }

  const result = geminiAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new GeminiOutputError("Gemini output failed schema validation.");
  }

  return result.data;
}
