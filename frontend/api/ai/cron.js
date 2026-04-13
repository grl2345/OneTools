import {
  callLLM,
  jsonResponse,
  parseJsonBody,
  HttpError,
} from "../_lib/llm.js";

export const config = { runtime: "edge" };

const SYSTEM = `You are a cron expression expert. You handle TWO modes:

MODE 1 — "to_cron": Convert a natural-language schedule description into a standard 5-field cron expression (minute hour day-of-month month day-of-week).

MODE 2 — "to_human": Given a cron expression, explain it in natural language and compute the next 5 execution times starting from the provided reference time.

Return a JSON object with this exact structure:

For mode "to_cron":
{
  "cron": "the cron expression (5 fields)",
  "explanation": "human-readable explanation of what this cron does",
  "next_5": ["ISO 8601 datetime strings of the next 5 runs from the reference time"]
}

For mode "to_human":
{
  "cron": "echo back the input cron expression",
  "explanation": "human-readable explanation",
  "next_5": ["ISO 8601 datetime strings of the next 5 runs from the reference time"]
}

Rules:
- Use standard 5-field cron format: minute hour day-of-month month day-of-week
- Respond in the user's specified language for explanation
- For next_5, calculate accurate execution times based on the reference time and timezone
- If the input is ambiguous, pick the most common interpretation and note it in the explanation
- If the cron expression is invalid, set cron to "" and explain the error`;

export default async function handler(request) {
  try {
    if (request.method !== "POST") {
      throw new HttpError(405, "Method not allowed");
    }

    const body = await parseJsonBody(request);
    const { input, mode, lang = "zh", ref_time, timezone } = body || {};

    if (!input || !input.trim()) {
      throw new HttpError(400, "input is required");
    }
    if (!mode || !["to_cron", "to_human"].includes(mode)) {
      throw new HttpError(400, 'mode must be "to_cron" or "to_human"');
    }

    const user = `Mode: ${mode}
Language for explanation: ${lang === "zh" ? "Chinese" : "English"}
Reference time: ${ref_time || new Date().toISOString()}
Timezone: ${timezone || "UTC"}

Input: ${input.trim()}`;

    const result = await callLLM({ system: SYSTEM, user, temperature: 0 });

    return jsonResponse({
      cron: String(result.cron || ""),
      explanation: String(result.explanation || ""),
      next_5: Array.isArray(result.next_5) ? result.next_5 : [],
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return jsonResponse({ detail: e.message }, status);
  }
}
