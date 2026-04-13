import json
import re
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from app.config import OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL


def rule_based_fix(broken: str) -> dict | None:
    """Try to fix common JSON errors with regex rules. Returns None if failed."""
    fixed = broken
    fixes = []

    # Trailing commas
    if re.search(r",\s*[\]}]", fixed):
        fixed = re.sub(r",\s*([\]}])", r"\1", fixed)
        fixes.append("removed_trailing_commas")

    # Unquoted keys
    if re.search(r'([{,]\s*)(\w+)\s*:', fixed):
        before = fixed
        fixed = re.sub(r'([{,]\s*)(\w+)\s*:', r'\1"\2":', fixed)
        if before != fixed:
            fixes.append("quoted_keys")

    # Single quotes -> double quotes
    if "'" in fixed:
        fixed = fixed.replace("'", '"')
        fixes.append("replaced_single_quotes")

    # Python booleans / None
    for old, new, fix_name in [
        (r":\s*True\b", ": true", "python_true"),
        (r":\s*False\b", ": false", "python_false"),
        (r":\s*None\b", ": null", "python_none"),
    ]:
        if re.search(old, fixed):
            fixed = re.sub(old, new, fixed)
            fixes.append(fix_name)

    # Second pass for trailing commas (might be revealed after other fixes)
    if re.search(r",\s*[\]}]", fixed):
        fixed = re.sub(r",\s*([\]}])", r"\1", fixed)

    try:
        json.loads(fixed)
        return {"fixed_json": fixed, "fixes": fixes, "method": "rule"}
    except json.JSONDecodeError:
        return None


async def llm_fix(broken: str) -> dict:
    """Use LLM to fix JSON that rule-based fixing couldn't handle."""
    if not OPENAI_API_KEY:
        return {"fixed_json": None, "error": "API key not configured", "method": "llm"}

    llm = ChatOpenAI(
        model=OPENAI_MODEL,
        api_key=OPENAI_API_KEY,
        base_url=OPENAI_BASE_URL,
        temperature=0,
    )

    messages = [
        SystemMessage(content=(
            "You are a JSON repair tool. The user will give you broken JSON. "
            "Fix it and return ONLY the valid JSON, nothing else. "
            "Do not wrap in markdown code blocks. Do not add explanations."
        )),
        HumanMessage(content=broken),
    ]

    response = await llm.ainvoke(messages)
    result = response.content.strip()

    # Strip markdown code fences if the LLM added them
    if result.startswith("```"):
        lines = result.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        result = "\n".join(lines)

    try:
        json.loads(result)
        return {"fixed_json": result, "fixes": ["llm_repair"], "method": "llm"}
    except json.JSONDecodeError as e:
        return {"fixed_json": None, "error": str(e), "method": "llm"}


async def fix_json(broken: str) -> dict:
    """Two-stage fix: try rules first, fall back to LLM."""
    # Stage 1: rule-based
    rule_result = rule_based_fix(broken)
    if rule_result:
        return rule_result

    # Stage 2: LLM
    return await llm_fix(broken)
