import {
  callLLM,
  jsonResponse,
  parseJsonBody,
  HttpError,
} from "../_lib/llm.js";

export const config = { runtime: "edge" };

const MAX_LEN = 8_000;

/**
 * A single dispatcher endpoint for "explain what this is" features across
 * Base64 / URL / HTML-entity / Hash / JWT / UUID tools. Each tool has its
 * own tailored system prompt but they all return the same shape:
 *   { explanation, highlights[], suggestions[] }
 */

const PROMPTS = {
  base64: `You are analyzing content that a user just DECODED from Base64. Identify
what the decoded content actually is (JSON object, JWT token, plain text,
UTF-8 with special chars, binary/image header signatures like PNG/JPEG,
protobuf, etc.) and explain it briefly in the user's language.

Output JSON with EXACTLY these keys:
{
  "explanation": string,  // 2-4 sentences: what this is, why it looks this way
  "highlights": string[], // up to 4 short bullet points about notable features
  "suggestions": string[] // up to 3 actionable tips (e.g. "this looks like JWT, try the JWT decoder")
}
Output JSON only — no prose outside the object.`,

  url: `You are analyzing a URL the user pasted. Break down its parts and explain
what each query parameter likely means. When you recognize a well-known
platform's callback pattern (OAuth, Slack, Stripe webhook, GitHub redirect,
Auth0, Firebase Auth, WeChat/Alipay, etc.), say so.

Output JSON with EXACTLY these keys:
{
  "explanation": string,    // 2-4 sentences naming the platform/context if identifiable
  "highlights": string[],   // up to 6 items, each like "param=value → meaning"
  "suggestions": string[]   // up to 3 security/best-practice tips
}
Output JSON only — no prose outside.`,

  html: `The user has a piece of text that was or will be HTML-escaped. Your job is
to point out which characters trigger escaping and WHY (XSS risk, breaking
attribute parsing, preserving whitespace, etc.), and recommend safer
alternatives where relevant.

Output JSON with EXACTLY these keys:
{
  "explanation": string,
  "highlights": string[],   // up to 5 items about specific characters/patterns
  "suggestions": string[]   // up to 3 concrete suggestions
}
Output JSON only — no prose outside.`,

  hash: `The user has either a piece of PLAINTEXT they want to hash, or a HASH VALUE
they want identified. Based on the input length and character set, infer
which hash algorithm it most likely is (MD5 = 32 hex, SHA-1 = 40 hex,
SHA-256 = 64 hex, SHA-512 = 128 hex, bcrypt = starts with $2a$, etc.) OR
if it's plaintext, recommend the right algorithm for the user's stated
purpose (password storage → bcrypt/argon2, deduplication → SHA-256, quick
checksum → xxHash/CRC, etc.).

Output JSON with EXACTLY these keys:
{
  "explanation": string,    // what the input looks like (hash type) OR recommendation
  "highlights": string[],   // up to 4 facts (e.g. algorithm strength, common vulns)
  "suggestions": string[]   // up to 3 recommendations
}
Output JSON only — no prose outside.`,

  jwt: `The user has a decoded JWT (header + payload JSON provided). Explain each
claim in the payload using the user's language. Flag security issues:
expired tokens, weak algorithms (HS256/none), missing exp/iat, overly long
lifetimes, etc. If you can identify the issuer platform (Firebase, Auth0,
Supabase, AWS Cognito, Keycloak, WeChat, Alipay, etc.), say so.

Output JSON with EXACTLY these keys:
{
  "explanation": string,      // overall summary: what platform, expired?, purpose
  "highlights": string[],     // up to 6 claim explanations, e.g. "exp: 2024-05-01, expired 3 hours ago"
  "suggestions": string[]     // up to 4 security/best-practice tips
}
Output JSON only — no prose outside.`,

  uuid: `The user has a UUID. Detect its version (v1/v3/v4/v5/v7) from the format,
extract any encoded information (v1 timestamp + MAC, v7 timestamp), and
recommend when to use each version.

Output JSON with EXACTLY these keys:
{
  "explanation": string,    // detected version + extracted info + use-case
  "highlights": string[],   // up to 4 facts about this version
  "suggestions": string[]   // up to 3 recommendations
}
Output JSON only — no prose outside.`,
};

export default async function handler(request) {
  try {
    if (request.method !== "POST")
      throw new HttpError(405, "Method not allowed");

    const { tool, content, context, lang = "zh" } =
      (await parseJsonBody(request)) || {};

    const prompt = PROMPTS[tool];
    if (!prompt) throw new HttpError(400, `Unknown tool: ${tool}`);
    if (!content || typeof content !== "string")
      throw new HttpError(400, "content is required (string)");
    if (content.length > MAX_LEN)
      throw new HttpError(400, `content too long (max ${MAX_LEN} chars)`);

    let userMsg = `USER LANGUAGE: ${lang}\n\nINPUT:\n${content}`;
    if (context && typeof context === "object") {
      userMsg += `\n\nADDITIONAL CONTEXT:\n${JSON.stringify(context).slice(0, 2000)}`;
    }

    const result = await callLLM({
      system: prompt,
      user: userMsg,
      temperature: 0.2,
    });

    return jsonResponse({
      explanation: String(result.explanation || ""),
      highlights: Array.isArray(result.highlights)
        ? result.highlights.slice(0, 8).map(String)
        : [],
      suggestions: Array.isArray(result.suggestions)
        ? result.suggestions.slice(0, 5).map(String)
        : [],
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return jsonResponse({ detail: e.message || "AI call failed" }, status);
  }
}
