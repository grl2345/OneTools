"""Natural language time parser powered by an LLM.

Accepts free-form expressions like "next Friday at 3pm", "下周五下午 3 点",
"three days before Christmas", "1 billion seconds after epoch" and returns
a concrete datetime with explanation and alternative interpretations.
"""

from datetime import datetime
from typing import List
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

from app.config import OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL


class TimeParseResult(BaseModel):
    iso: str = Field(
        description="Parsed datetime as ISO 8601 with timezone offset, e.g. 2024-03-20T15:00:00+08:00"
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="0.0-1.0; lower when the expression is ambiguous",
    )
    explanation: str = Field(
        description="One or two short sentences in the user's language explaining how the expression was parsed"
    )
    alternatives: List[str] = Field(
        default_factory=list,
        description="Other plausible ISO 8601 interpretations when ambiguous",
    )


SYSTEM_PROMPT = """You are a precise natural language time parser.
Your job is to convert a user's free-form time expression into a concrete datetime.

Rules:
1. Output MUST be a datetime in ISO 8601 with timezone offset, e.g. 2024-03-20T15:00:00+08:00
2. Always resolve the datetime in the USER'S timezone unless another is explicit
3. For relative expressions (tomorrow, next Friday, 下周五, 三天后), anchor on CURRENT LOCAL TIME
4. For fully numeric expressions like "1 billion seconds after epoch", compute from Unix epoch (UTC)
5. The explanation field MUST be written in the same language as the user's input
6. If the expression is ambiguous (e.g. "next Monday" — this week's or the one after?),
   lower the confidence to 0.4-0.7 and include up to 3 alternatives
7. If the input is not a time expression at all, set confidence to 0.0 and explain in the explanation field

Keep explanations tight — 1 or 2 sentences max."""


async def parse_time(query: str, tz: str, lang: str = "zh") -> TimeParseResult:
    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured on the server. "
            "Set it in backend/.env to enable AI features."
        )

    now_iso = datetime.now().astimezone().isoformat()

    llm = ChatOpenAI(
        api_key=OPENAI_API_KEY,
        base_url=OPENAI_BASE_URL,
        model=OPENAI_MODEL,
        temperature=0,
        timeout=20,
    ).with_structured_output(TimeParseResult)

    user_prompt = (
        f"CURRENT LOCAL TIME: {now_iso}\n"
        f"USER TIMEZONE: {tz}\n"
        f"USER LANGUAGE: {lang}\n\n"
        f"User input:\n{query}"
    )

    result: TimeParseResult = await llm.ainvoke(
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]
    )
    return result
