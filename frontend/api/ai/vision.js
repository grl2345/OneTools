import {
  callLLMRaw,
  jsonResponse,
  parseJsonBody,
  HttpError,
} from "../_lib/llm.js";

export const config = { runtime: "edge" };

const MAX_IMAGE_URL = 3_000_000; // ~3 MB base64 → ~2.2 MB actual image

/**
 * Unified vision endpoint. Uses Groq's llama-3.2-vision (or whatever the
 * server's OPENAI_MODEL env var points at, as long as it supports images).
 *
 * Actions:
 *   - "ocr"          : extract all text (preserve newlines)
 *   - "code_ocr"     : same, optimized for code snippets (preserve indent)
 *   - "table"        : extract tabular data as rows/columns
 *   - "handwriting"  : recognize handwritten text (CJK + EN friendly)
 */

const SYSTEM_BY_ACTION = {
  ocr: `You are an OCR engine. Extract EVERY piece of text visible in the image,
preserving original line breaks. Output JSON:

{
  "text": string,     // all extracted text, newline-separated
  "language": string, // detected language code (zh, en, mixed, etc.)
  "confidence": string // low / medium / high
}
Output JSON only.`,

  code_ocr: `You are an OCR engine for code screenshots. Extract the code EXACTLY,
preserving indentation, whitespace, and special characters. Use 2 or 4
spaces consistently. Detect the programming language.

Output JSON:
{
  "text": string,     // the code exactly as written, with newlines
  "language": string, // programming language (e.g. "python", "javascript", "go")
  "confidence": string
}
Output JSON only.`,

  table: `You are extracting a table from an image. Identify the columns, rows, and
cell values. Preserve numeric values exactly. Output JSON:

{
  "headers": string[],      // column names; empty if no header row detected
  "rows": string[][],       // each row is an array of cell values as strings
  "notes": string           // any caveats, e.g. "merged cells approximated"
}
Output JSON only.`,

  handwriting: `You are an OCR engine specialized for handwritten text (Chinese + English
mixed). Recognize the content as literally as possible. Normalize spacing
but keep line breaks.

Output JSON:
{
  "text": string,
  "language": string, // zh, en, mixed
  "confidence": string,
  "notes": string     // short note about legibility challenges, if any
}
Output JSON only.`,
};

export default async function handler(request) {
  try {
    if (request.method !== "POST")
      throw new HttpError(405, "Method not allowed");

    const { action, image_url, lang = "zh" } =
      (await parseJsonBody(request)) || {};

    const system = SYSTEM_BY_ACTION[action];
    if (!system) throw new HttpError(400, `Unknown action: ${action}`);

    if (!image_url || typeof image_url !== "string")
      throw new HttpError(400, "image_url is required (data URL or https URL)");
    if (image_url.length > MAX_IMAGE_URL)
      throw new HttpError(
        413,
        `image_url too large (${image_url.length} chars, max ${MAX_IMAGE_URL}). Please resize first.`
      );

    const userContent = [
      { type: "text", text: `USER LANGUAGE: ${lang}. Analyze this image.` },
      { type: "image_url", image_url: { url: image_url } },
    ];

    const result = await callLLMRaw({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      temperature: 0,
      // Some providers need an image-capable model explicitly; allow override via env
      modelOverride: process.env.OPENAI_VISION_MODEL,
    });

    return jsonResponse(result);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return jsonResponse({ detail: e.message || "AI call failed" }, status);
  }
}
