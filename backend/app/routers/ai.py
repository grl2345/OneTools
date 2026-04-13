from datetime import datetime
from typing import List, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.ai_time import parse_time
from app.services.ai_json import json_query, json_schema
from app.services.ai_markdown import rewrite as markdown_rewrite

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ── Time parsing ─────────────────────────────────────────
class ParseTimeRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    tz: str = Field(default="UTC", max_length=64)
    lang: str = Field(default="zh", max_length=8)


class ParseTimeResponse(BaseModel):
    iso: str
    timestamp_s: int
    timestamp_ms: int
    confidence: float
    explanation: str
    alternatives: List[str]


@router.post("/parse-time", response_model=ParseTimeResponse)
async def ai_parse_time(req: ParseTimeRequest) -> ParseTimeResponse:
    try:
        result = await parse_time(req.query.strip(), req.tz, req.lang)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI call failed: {e}")

    try:
        dt = datetime.fromisoformat(result.iso)
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail=f"Model returned an invalid ISO datetime: {result.iso}",
        )

    ms = int(dt.timestamp() * 1000)
    return ParseTimeResponse(
        iso=result.iso,
        timestamp_s=ms // 1000,
        timestamp_ms=ms,
        confidence=result.confidence,
        explanation=result.explanation,
        alternatives=result.alternatives,
    )


# ── JSON · natural-language query ────────────────────────
class JsonQueryRequest(BaseModel):
    json_str: str = Field(..., min_length=2, max_length=50_000)
    query: str = Field(..., min_length=1, max_length=500)
    lang: str = Field(default="zh", max_length=8)


class JsonQueryResponse(BaseModel):
    expression: str
    result: str
    explanation: str
    matched_count: int


@router.post("/json/query", response_model=JsonQueryResponse)
async def ai_json_query(req: JsonQueryRequest) -> JsonQueryResponse:
    try:
        r = await json_query(req.json_str, req.query.strip(), req.lang)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI call failed: {e}")
    return JsonQueryResponse(**r.model_dump())


# ── JSON · schema inference ──────────────────────────────
class JsonSchemaRequest(BaseModel):
    json_str: str = Field(..., min_length=2, max_length=50_000)
    lang: str = Field(default="zh", max_length=8)


class SchemaFieldModel(BaseModel):
    path: str
    type: str
    description: str
    example: str
    required: bool = True


class JsonSchemaResponse(BaseModel):
    schema_json: str
    fields: List[SchemaFieldModel]
    summary: str


@router.post("/json/schema", response_model=JsonSchemaResponse)
async def ai_json_schema(req: JsonSchemaRequest) -> JsonSchemaResponse:
    try:
        r = await json_schema(req.json_str, req.lang)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI call failed: {e}")
    return JsonSchemaResponse(**r.model_dump())


# ── Markdown · rewrite selection ─────────────────────────
Action = Literal[
    "simplify", "formalize", "expand", "translate", "fix_grammar", "summarize"
]


class MarkdownRewriteRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10_000)
    action: Action
    lang: str = Field(default="zh", max_length=8)


class MarkdownRewriteResponse(BaseModel):
    rewritten: str
    note: str = ""


@router.post("/markdown/rewrite", response_model=MarkdownRewriteResponse)
async def ai_markdown_rewrite(req: MarkdownRewriteRequest) -> MarkdownRewriteResponse:
    try:
        r = await markdown_rewrite(req.text, req.action, req.lang)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI call failed: {e}")
    return MarkdownRewriteResponse(**r.model_dump())
