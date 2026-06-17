import Anthropic from "@anthropic-ai/sdk";
import { FINISH_SCHEDULE_PROMPT } from "./prompts/finish-schedule";

// Recommended default model (best accuracy). Tier down later if cost matters.
export const EXTRACTION_MODEL = "claude-opus-4-8";

export type ExtractedFinish = {
  code: string;
  type: string;
  description: string;
  unit: "SF" | "LF" | "EA" | "SY" | "other";
  category: "floor" | "base" | "transition" | "wall" | "other";
  includedInFlooringScope: boolean;
  reason: string;
  confidence: number;
};

// Structured-output JSON schema (no min/max — not supported by structured outputs).
const FINISH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    finishes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          code: { type: "string" },
          type: { type: "string" },
          description: { type: "string" },
          unit: { type: "string", enum: ["SF", "LF", "EA", "SY", "other"] },
          category: { type: "string", enum: ["floor", "base", "transition", "wall", "other"] },
          includedInFlooringScope: { type: "boolean" },
          reason: { type: "string" },
          confidence: { type: "number" },
        },
        required: [
          "code", "type", "description", "unit", "category",
          "includedInFlooringScope", "reason", "confidence",
        ],
      },
    },
  },
  required: ["finishes"],
} as const;

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/** Hand the PDF (a finish-schedule page) to Claude; get back structured finishes. */
export async function extractFinishSchedule(pdfBase64: string) {
  const res = await client().messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
          { type: "text", text: FINISH_SCHEDULE_PROMPT },
        ],
      },
    ],
    // @ts-expect-error output_config is newer than the installed SDK types
    output_config: { format: { type: "json_schema", schema: FINISH_SCHEMA } },
  });

  const textBlock = res.content.find((b) => b.type === "text") as { text: string } | undefined;
  const parsed = textBlock ? (JSON.parse(textBlock.text) as { finishes: ExtractedFinish[] }) : { finishes: [] };
  return { finishes: parsed.finishes, model: res.model, usage: res.usage };
}
