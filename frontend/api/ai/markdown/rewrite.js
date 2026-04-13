import {
  callLLM,
  jsonResponse,
  parseJsonBody,
  HttpError,
} from "../../_lib/llm.js";

export const config = { runtime: "edge" };

const MAX_TEXT = 10_000;

const ACTION_INSTRUCTIONS = {
  simplify:
    "Rewrite the passage so it is clearer and more concise. Keep ALL Markdown syntax (headings, lists, code fences, links) intact.",
  formalize:
    "Rewrite the passage in a more professional, polished tone suitable for technical documentation. Preserve Markdown syntax exactly.",
  expand:
    "Expand the passage with more detail, examples and rationale. Keep the existing structure and Markdown syntax.",
  translate:
    "Translate the passage. If the passage is in Chinese, translate to English; if in English, translate to Chinese. Preserve Markdown syntax (code blocks, links, headings, lists).",
  fix_grammar:
    "Fix grammar, spelling, and typography issues. Do NOT change the meaning or style. Preserve Markdown syntax.",
  summarize:
    "Rewrite the passage as a concise summary (≤ 30% of the original length). Preserve any critical terms. Use the SAME language as the input.",
};

const SYSTEM = `You are a careful Markdown editor. Follow the ACTION precisely and
NEVER add explanatory prose outside the required fields.

Output MUST be a single JSON object with EXACTLY these keys:
{
  "rewritten": string,  // the rewritten Markdown text
  "note": string        // optional one-line note in user's language (may be "")
}

Output JSON only — no prose outside the JSON, no markdown fences around it.`;

export default async function handler(request) {
  try {
    if (request.method !== "POST")
      throw new HttpError(405, "Method not allowed");

    const body = await parseJsonBody(request);
    const { text, action, lang = "zh" } = body || {};

    if (!text || typeof text !== "string")
      throw new HttpError(400, "text is required (string)");
    if (text.length > MAX_TEXT)
      throw new HttpError(400, `text too long (max ${MAX_TEXT} chars)`);

    const instruction = ACTION_INSTRUCTIONS[action];
    if (!instruction)
      throw new HttpError(400, `Unknown action: ${action}`);

    const user = `USER LANGUAGE: ${lang}\nACTION: ${action}\nINSTRUCTION: ${instruction}\n\nPASSAGE:\n${text}`;

    const result = await callLLM({
      system: SYSTEM,
      user,
      temperature: 0.3,
    });

    return jsonResponse({
      rewritten: String(result.rewritten ?? ""),
      note: String(result.note || ""),
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return jsonResponse({ detail: e.message || "AI call failed" }, status);
  }
}
