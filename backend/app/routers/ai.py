from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.ai_time import parse_time

router = APIRouter(prefix="/api/ai", tags=["ai"])


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
