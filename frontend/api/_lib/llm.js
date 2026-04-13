// Shared helper for calling any OpenAI-compatible LLM (Groq / SiliconFlow /
// OpenAI / OpenRouter etc.). Configured via environment variables:
//   OPENAI_API_KEY   required
//   OPENAI_BASE_URL  optional, default https://api.groq.com/openai/v1
//   OPENAI_MODEL     optional, default llama-3.3-70b-versatile
//
// Expects the model to return a single JSON object matching the prompt's
// contract (we turn on response_format: "json_object").

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Invalid JSON in request body");
  }
}

export async function callLLM({ system, user, temperature = 0 }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl =
    process.env.OPENAI_BASE_URL || "https://api.groq.com/openai/v1";
  const model = process.env.OPENAI_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey) {
    throw new HttpError(
      503,
      "Server not configured: OPENAI_API_KEY is missing. Set it in Vercel Project Settings → Environment Variables."
    );
  }

  let resp;
  try {
    resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch (e) {
    throw new HttpError(502, `Upstream fetch failed: ${e.message || e}`);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new HttpError(
      resp.status === 401 ? 503 : 502,
      `LLM HTTP ${resp.status}: ${text.slice(0, 400)}`
    );
  }

  let data;
  try {
    data = await resp.json();
  } catch (e) {
    throw new HttpError(502, `LLM returned non-JSON envelope: ${e.message}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new HttpError(502, "LLM returned empty message content");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new HttpError(
      502,
      `LLM content is not valid JSON: ${String(content).slice(0, 200)}`
    );
  }
}
