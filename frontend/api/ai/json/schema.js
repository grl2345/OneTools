import {
  callLLM,
  jsonResponse,
  parseJsonBody,
  HttpError,
} from "../../_lib/llm.js";

export const config = { runtime: "edge" };

const MAX_JSON = 20_000;

const SYSTEM = `You are a JSON schema analyst. Given a JSON sample, infer a JSON
Schema (draft-07) and produce a flat field dictionary. Output a single JSON
object with EXACTLY these keys:

{
  "schema_json": string,   // JSON Schema encoded AS A JSON STRING (escape inner quotes)
  "fields": [              // FLAT list of the most useful fields
    {
      "path": string,        // dot path like "users[].email"
      "type": string,        // "string"|"number"|"integer"|"boolean"|"object"|"array"|"null"|"mixed"
      "description": string, // ≤ 12 words, in the user's language
      "example": string,     // a concrete value from the sample
      "required": boolean
    }
  ],
  "summary": string         // 1 sentence in user's language describing overall shape
}

Rules:
- "fields" must be FLAT (not nested); use "users[].email" to describe items inside arrays.
- Skip deeply repetitive fields; include only the most useful ones (cap ~20).
- "description" in the user's language, ≤ 12 words.
- "example" must be a concrete value that appears in the sample.
- Output JSON only — no prose outside the object, no markdown fences.`;

export default async function handler(request) {
  try {
    if (request.method !== "POST")
      throw new HttpError(405, "Method not allowed");

    const body = await parseJsonBody(request);
    const { json_str, lang = "zh" } = body || {};

    if (!json_str || typeof json_str !== "string")
      throw new HttpError(400, "json_str is required (string)");

    const truncated =
      json_str.length > MAX_JSON
        ? json_str.slice(0, MAX_JSON) +
          `\n... (truncated, total ${json_str.length} chars)`
        : json_str;

    const user = `USER LANGUAGE: ${lang}\n\nJSON SAMPLE:\n\`\`\`json\n${truncated}\n\`\`\``;

    const result = await callLLM({ system: SYSTEM, user });

    // Normalize: schema_json may come back as an object or a string
    let schemaJson = result.schema_json;
    if (schemaJson && typeof schemaJson !== "string") {
      schemaJson = JSON.stringify(schemaJson);
    }

    return jsonResponse({
      schema_json: String(schemaJson || "{}"),
      fields: Array.isArray(result.fields)
        ? result.fields.map((f) => ({
            path: String(f.path || ""),
            type: String(f.type || "mixed"),
            description: String(f.description || ""),
            example: String(f.example ?? ""),
            required: Boolean(f.required ?? true),
          }))
        : [],
      summary: String(result.summary || ""),
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return jsonResponse({ detail: e.message || "AI call failed" }, status);
  }
}
