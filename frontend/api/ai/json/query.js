import {
  callLLM,
  jsonResponse,
  parseJsonBody,
  HttpError,
} from "../../_lib/llm.js";

export const config = { runtime: "edge" };

const MAX_JSON = 20_000;

const SYSTEM = `You are a JSON data assistant. Given a JSON document and a user's
natural-language question, return the requested data as a JSON object with
EXACTLY these keys:

{
  "expression": string,    // Human-readable JSONPath-like expression describing the selection
  "result": string,        // The matched value SERIALIZED AS JSON (e.g. "[\\"Alice\\"]", "42", "null")
  "explanation": string,   // 1-2 short sentences in the user's language
  "matched_count": number  // array length for arrays, 1 for scalars/objects, 0 if no match
}

Rules:
- Think in JSONPath/JMESPath but execute the query yourself and return the concrete result.
- "result" MUST itself be valid JSON (strings inside are escaped).
- "explanation" in the user's language, 1-2 short sentences.
- If the question can't be answered from the data: result="null", matched_count=0, explain why.
- Output JSON only — no prose outside the object, no markdown fences.`;

export default async function handler(request) {
  try {
    if (request.method !== "POST")
      throw new HttpError(405, "Method not allowed");

    const body = await parseJsonBody(request);
    const { json_str, query, lang = "zh" } = body || {};

    if (!json_str || typeof json_str !== "string")
      throw new HttpError(400, "json_str is required (string)");
    if (!query || typeof query !== "string")
      throw new HttpError(400, "query is required (string)");

    const truncated =
      json_str.length > MAX_JSON
        ? json_str.slice(0, MAX_JSON) +
          `\n... (truncated, total ${json_str.length} chars)`
        : json_str;

    const user = `USER LANGUAGE: ${lang}\n\nJSON DATA:\n\`\`\`json\n${truncated}\n\`\`\`\n\nQUESTION:\n${query.trim()}`;

    const result = await callLLM({ system: SYSTEM, user });

    return jsonResponse({
      expression: String(result.expression || ""),
      result:
        typeof result.result === "string"
          ? result.result
          : JSON.stringify(result.result ?? null),
      explanation: String(result.explanation || ""),
      matched_count: Number(result.matched_count) || 0,
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return jsonResponse({ detail: e.message || "AI call failed" }, status);
  }
}
