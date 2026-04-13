import {
  callLLM,
  jsonResponse,
  parseJsonBody,
  HttpError,
} from "../_lib/llm.js";

export const config = { runtime: "edge" };

const SYSTEM = `You are a flowchart generator. Given a natural-language description
of a process, algorithm, user journey, or business logic, output valid
Mermaid flowchart syntax that visualizes it clearly.

Output MUST be a single JSON object with EXACTLY these keys:
{
  "mermaid": string,     // valid Mermaid source, starting with "flowchart TD" or "flowchart LR"
  "explanation": string, // 1-2 sentences in the user's language
  "direction": string    // "TD" or "LR"
}

Mermaid rules:
- Use "flowchart TD" (top-down) by default; use "LR" only when many sibling branches benefit
- Node IDs should be short ASCII tokens: A, B, C... or snake_case. NEVER use Chinese/special chars in IDs
- Node labels can be any language. Wrap with [], {}, (), or (()) to choose shape:
  - [text] = process
  - {text} = decision
  - (text) = start / end
  - ((text)) = small circle node
- Edges use --> or -->|label|
- For decisions, use branch labels like -->|Yes|  or -->|否|
- Keep under 25 nodes. Use subgraphs if grouping is natural
- Escape quotes in labels; use " (not ')

Output JSON only — no prose, no markdown fences around the object.`;

export default async function handler(request) {
  try {
    if (request.method !== "POST")
      throw new HttpError(405, "Method not allowed");

    const { description, lang = "zh" } =
      (await parseJsonBody(request)) || {};

    if (!description || typeof description !== "string")
      throw new HttpError(400, "description is required (string)");
    if (description.length > 4000)
      throw new HttpError(400, "description too long (max 4000 chars)");

    const result = await callLLM({
      system: SYSTEM,
      user: `USER LANGUAGE: ${lang}\n\nDESCRIPTION:\n${description.trim()}`,
      temperature: 0.2,
    });

    // Strip markdown fences if the model snuck them in anyway
    let mermaid = String(result.mermaid || "").trim();
    mermaid = mermaid
      .replace(/^```(?:mermaid)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    return jsonResponse({
      mermaid,
      explanation: String(result.explanation || ""),
      direction: String(result.direction || "TD"),
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return jsonResponse({ detail: e.message || "AI call failed" }, status);
  }
}
