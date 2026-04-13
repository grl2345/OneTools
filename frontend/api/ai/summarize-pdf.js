import {
  callLLM,
  jsonResponse,
  parseJsonBody,
  HttpError,
} from "../_lib/llm.js";

export const config = { runtime: "edge" };

const MAX_TEXT = 30_000;

const SYSTEM = `You summarize documents. Given extracted PDF text, produce a
structured, skimmable summary so the user can understand the document at a
glance.

Output MUST be a single JSON object with EXACTLY these keys:
{
  "doc_type": string,        // e.g. "学术论文" / "Legal contract" / "Technical report" / "Financial statement" / "User manual"
  "title": string,           // best guess at the document title from the text
  "summary": string,         // 3-5 sentences in the user's language
  "key_points": [            // 5-10 bullet points, most important first
    { "point": string, "detail": string }
  ],
  "entities": string[]       // up to 10 named entities / key terms (people, organizations, products, acronyms)
}

Rules:
- summary / key_points / doc_type in the user's language
- If the document is short or not substantial, still fill every field on best-effort basis
- Do NOT invent facts not present in the text
- Output JSON only — no prose outside the object, no markdown fences`;

export default async function handler(request) {
  try {
    if (request.method !== "POST")
      throw new HttpError(405, "Method not allowed");

    const { text, lang = "zh" } = (await parseJsonBody(request)) || {};

    if (!text || typeof text !== "string")
      throw new HttpError(400, "text is required (string)");
    if (text.trim().length < 20)
      throw new HttpError(400, "text too short to summarize");

    const truncated =
      text.length > MAX_TEXT
        ? text.slice(0, MAX_TEXT) +
          `\n\n... (truncated, total ${text.length} chars)`
        : text;

    const result = await callLLM({
      system: SYSTEM,
      user: `USER LANGUAGE: ${lang}\n\nDOCUMENT TEXT:\n${truncated}`,
      temperature: 0.2,
    });

    const keyPoints = Array.isArray(result.key_points)
      ? result.key_points.slice(0, 12).map((p) => ({
          point: String(p?.point || ""),
          detail: String(p?.detail || ""),
        }))
      : [];

    return jsonResponse({
      doc_type: String(result.doc_type || ""),
      title: String(result.title || ""),
      summary: String(result.summary || ""),
      key_points: keyPoints,
      entities: Array.isArray(result.entities)
        ? result.entities.slice(0, 12).map(String)
        : [],
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return jsonResponse({ detail: e.message || "AI call failed" }, status);
  }
}
