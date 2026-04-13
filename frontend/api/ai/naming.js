import {
  callLLM,
  jsonResponse,
  parseJsonBody,
  HttpError,
} from "../_lib/llm.js";

export const config = { runtime: "edge" };

const SYSTEM = `You are a naming assistant for software developers. Given a feature description, generate naming suggestions in multiple conventions.

Return a JSON object with this exact structure:
{
  "suggestions": [
    {
      "name": "the suggested name",
      "style": "camelCase | snake_case | kebab-case | PascalCase | UPPER_SNAKE_CASE",
      "category": "variable | function | class | constant | project | file | component",
      "explanation": "brief reason why this name fits"
    }
  ]
}

Rules:
- Generate 8-12 suggestions covering different styles and categories
- Names should be concise, descriptive, and follow common conventions
- camelCase for variables/functions, PascalCase for classes/components, snake_case for Python/Ruby, kebab-case for URLs/files/projects, UPPER_SNAKE_CASE for constants
- Respond in the same language as the user's description for explanations
- Names themselves should always be in English (programming convention)
- Be creative but practical — names should be easy to type and remember`;

export default async function handler(request) {
  try {
    if (request.method !== "POST") {
      throw new HttpError(405, "Method not allowed");
    }

    const body = await parseJsonBody(request);
    const { description, lang = "zh" } = body || {};

    if (!description || !description.trim()) {
      throw new HttpError(400, "description is required");
    }

    const user = `Language for explanations: ${lang === "zh" ? "Chinese" : "English"}

Feature description: ${description.trim()}

Generate naming suggestions.`;

    const result = await callLLM({ system: SYSTEM, user, temperature: 0.7 });

    return jsonResponse({
      suggestions: Array.isArray(result.suggestions)
        ? result.suggestions
        : [],
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return jsonResponse({ detail: e.message }, status);
  }
}
