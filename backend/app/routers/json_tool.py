from fastapi import APIRouter
from pydantic import BaseModel
from app.services.json_fixer import fix_json

router = APIRouter()


class AiFixRequest(BaseModel):
    json_string: str


class AiFixResponse(BaseModel):
    fixed_json: str | None = None
    fixes: list[str] = []
    method: str = ""
    error: str | None = None


@router.post("/ai-fix", response_model=AiFixResponse)
async def ai_fix(req: AiFixRequest):
    result = await fix_json(req.json_string)
    return AiFixResponse(**result)
