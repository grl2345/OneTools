"""AI-powered JSON helpers: natural-language query and schema inference."""

import json
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

from app.config import OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL


MAX_JSON_CHARS = 20_000  # protect against giant payloads


class JsonQueryResult(BaseModel):
    expression: str = Field(
        description="Human-readable path/expression describing what was selected (e.g. JSONPath $.users[?(@.active)].name)"
    )
    result: str = Field(
        description="Final result serialized as JSON (string, number, array or object). MUST be valid JSON."
    )
    explanation: str = Field(
        description="One or two sentences in the user's language explaining how the query was executed"
    )
    matched_count: int = Field(
        description="Number of matched items (length for arrays, 1 for scalars/objects, 0 if nothing)"
    )


class SchemaField(BaseModel):
    path: str = Field(description="Dot path from the root, e.g. users[].email")
    type: str = Field(description="Type: string / number / integer / boolean / object / array / null / mixed")
    description: str = Field(description="Short natural-language purpose in the user's language")
    example: str = Field(description="A concrete sample value from the data")
    required: bool = Field(default=True)


class JsonSchemaResult(BaseModel):
    schema_json: str = Field(
        description="A JSON Schema (draft-07) as a JSON string, inferred from the data"
    )
    fields: List[SchemaField] = Field(
        description="A flat dictionary of the most useful fields with descriptions"
    )
    summary: str = Field(
        description="One sentence in user's language describing the overall shape of the data"
    )


def _llm(structured_cls):
    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured on the server. "
            "Set it in backend/.env to enable AI features."
        )
    return ChatOpenAI(
        api_key=OPENAI_API_KEY,
        base_url=OPENAI_BASE_URL,
        model=OPENAI_MODEL,
        temperature=0,
        timeout=40,
    ).with_structured_output(structured_cls)


def _truncate(raw: str) -> str:
    if len(raw) > MAX_JSON_CHARS:
        return raw[:MAX_JSON_CHARS] + f"\n... (truncated, total {len(raw)} chars)"
    return raw


QUERY_SYSTEM = """You are a JSON data assistant. Given a JSON document and a user's
natural-language question, return the requested data.

Rules:
1. Think in JSONPath/JMESPath, but execute the query yourself and return the CONCRETE result.
2. "expression" must be a human-readable JSONPath-like string showing what was selected.
3. "result" MUST be a JSON-serialized string (e.g. "[\\"Alice\\",\\"Bob\\"]", "42", "null").
4. "explanation" is written in the user's language, 1-2 short sentences.
5. If the question can't be answered from the data, return result="null", matched_count=0
   and explain why in "explanation".
"""

SCHEMA_SYSTEM = """You are a JSON schema analyst. Given a JSON sample, infer a JSON
Schema (draft-07) and produce a flat field dictionary to help the user understand
the shape of the data.

Rules:
1. "schema_json" is a JSON Schema encoded as a JSON string (escape inner quotes).
2. "fields" must be a FLAT list (not nested); use "users[].email" to describe items inside arrays.
3. Only include the MOST USEFUL fields - skip deeply repetitive ones.
4. Field "description" must be in user's language, ≤ 12 words.
5. "example" must be a concrete value that appears in the sample.
6. "summary" is 1 sentence in the user's language, describing the top-level shape.
"""


async def json_query(json_str: str, query: str, lang: str = "zh") -> JsonQueryResult:
    llm = _llm(JsonQueryResult)
    user = (
        f"USER LANGUAGE: {lang}\n\n"
        f"JSON DATA:\n```json\n{_truncate(json_str)}\n```\n\n"
        f"QUESTION:\n{query}"
    )
    return await llm.ainvoke(
        [{"role": "system", "content": QUERY_SYSTEM}, {"role": "user", "content": user}]
    )


async def json_schema(json_str: str, lang: str = "zh") -> JsonSchemaResult:
    llm = _llm(JsonSchemaResult)
    user = (
        f"USER LANGUAGE: {lang}\n\n"
        f"JSON SAMPLE:\n```json\n{_truncate(json_str)}\n```"
    )
    return await llm.ainvoke(
        [{"role": "system", "content": SCHEMA_SYSTEM}, {"role": "user", "content": user}]
    )
