"""Markdown selection rewriter."""

from typing import Literal
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

from app.config import OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL


Action = Literal[
    "simplify",
    "formalize",
    "expand",
    "translate",
    "fix_grammar",
    "summarize",
]


class RewriteResult(BaseModel):
    rewritten: str = Field(description="The rewritten text, preserving Markdown syntax")
    note: str = Field(
        default="",
        description="Optional one-line note describing what was changed (user's language)",
    )


_ACTION_PROMPTS = {
    "simplify": "Rewrite the passage so it is clearer and more concise. Keep ALL Markdown syntax (headings, lists, code, links) intact. Output the rewritten text ONLY — do not include any commentary inside.",
    "formalize": "Rewrite the passage in a more professional, polished tone suitable for technical documentation. Preserve Markdown syntax exactly.",
    "expand": "Expand the passage with more detail, examples and rationale. Keep the existing structure and Markdown syntax.",
    "translate": "Translate the passage. If the passage is in Chinese, translate to English; if in English, translate to Chinese. Preserve Markdown syntax (code blocks, links, headings, lists).",
    "fix_grammar": "Fix grammar, spelling and typography issues. Do NOT change the meaning or style. Preserve Markdown syntax.",
    "summarize": "Rewrite the passage as a concise summary (≤ 30% of the original length). Preserve any critical terms. Use the SAME language as the input.",
}


def _llm():
    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured on the server. "
            "Set it in backend/.env to enable AI features."
        )
    return ChatOpenAI(
        api_key=OPENAI_API_KEY,
        base_url=OPENAI_BASE_URL,
        model=OPENAI_MODEL,
        temperature=0.3,
        timeout=40,
    ).with_structured_output(RewriteResult)


async def rewrite(text: str, action: Action, lang: str = "zh") -> RewriteResult:
    instruction = _ACTION_PROMPTS[action]
    system = (
        "You are a careful Markdown editor. Follow the instruction precisely and "
        "NEVER add explanatory prose outside the required fields."
    )
    user = (
        f"USER LANGUAGE: {lang}\n"
        f"ACTION: {action}\n"
        f"INSTRUCTION: {instruction}\n\n"
        f"PASSAGE:\n{text}"
    )
    llm = _llm()
    return await llm.ainvoke(
        [{"role": "system", "content": system}, {"role": "user", "content": user}]
    )
