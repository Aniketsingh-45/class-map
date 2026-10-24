"""Claude calls. Needs ANTHROPIC_API_KEY. Daily token budget enforced to control costs."""
import os, json, base64, time, threading, anthropic
from anthropic.types import TextBlock
from pathlib import Path

TEXT_MODEL = os.getenv("CLAUDE_TEXT_MODEL", "claude-haiku-5-5")      # cheap: error summary, wording
VISION_MODEL = os.getenv("CLAUDE_VISION_MODEL", "claude-sonnet-5-5")  # slate handwriting
_client = None

# ---------- daily budget ----------
_MAX_INPUT_TOKENS_PER_DAY = int(os.getenv("CLAUDE_DAILY_INPUT_LIMIT", "50000"))
_MAX_OUTPUT_TOKENS_PER_DAY = int(os.getenv("CLAUDE_DAILY_OUTPUT_LIMIT", "10000"))
_lock = threading.Lock()
_day_key: str = ""
_day_input: int = 0
_day_output: int = 0

def _check_budget(est_input: int = 500, est_output: int = 300) -> None:
    """Raise if today's estimated call would exceed the daily budget."""
    global _day_key, _day_input, _day_output
    today = time.strftime("%Y-%m-%d")
    with _lock:
        if today != _day_key:
            _day_key, _day_input, _day_output = today, 0, 0
        if _day_input + est_input > _MAX_INPUT_TOKENS_PER_DAY:
            raise RuntimeError(f"Claude daily input token limit reached ({_MAX_INPUT_TOKENS_PER_DAY})")
        if _day_output + est_output > _MAX_OUTPUT_TOKENS_PER_DAY:
            raise RuntimeError(f"Claude daily output token limit reached ({_MAX_OUTPUT_TOKENS_PER_DAY})")

def _record(resp) -> None:
    global _day_input, _day_output
    u = resp.usage
    with _lock:
        _day_input += u.input_tokens
        _day_output += u.output_tokens

def budget_status() -> dict:
    return {"day": _day_key, "input_used": _day_input, "input_limit": _MAX_INPUT_TOKENS_PER_DAY,
            "output_used": _day_output, "output_limit": _MAX_OUTPUT_TOKENS_PER_DAY}

# ---------- client ----------
def client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic()          # reads ANTHROPIC_API_KEY from the environment
    return _client

# ---------- error pattern ----------
ERR_SYSTEM = (
    "You help a Grade 1-5 teacher in India. You get ALIGNED reading data (word by word). "
    "Describe the 1-2 most common error patterns in simple Hindi. Use only the data given. "
    "If there is no clear pattern, say so. Never label the child (no 'weak'). "
    'Return ONLY JSON: {"pattern_hi": str, "examples": [str], "next_skill": str}'
)

def _get_text(resp) -> str:
    for block in resp.content:
        if isinstance(block, TextBlock):
            return block.text
    return ""

def error_pattern(ops: list[dict]) -> dict:
    _check_budget(400, 200)
    r = client().messages.create(model=TEXT_MODEL, max_tokens=300, system=ERR_SYSTEM,
        messages=[{"role": "user", "content": json.dumps(ops, ensure_ascii=False)}])
    _record(r); log_usage("error_pattern", r)
    txt = _get_text(r)
    try:
        return json.loads(txt)
    except (json.JSONDecodeError, IndexError):
        return {"pattern_hi": txt, "examples": [], "next_skill": ""}

# ---------- slate handwriting reading ----------
def read_slate(image_bytes: bytes, problems: list[str]) -> list[dict]:
    _check_budget(1200, 500)
    b64 = base64.standard_b64encode(image_bytes).decode()
    media_type = "image/jpeg"
    if image_bytes.startswith(b"\x89PNG"):
        media_type = "image/png"
    elif image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
        media_type = "image/webp"

    prompt = ("Read a child's handwritten arithmetic on a slate. Problems given: " + ", ".join(problems) +
              '. For each return {"problem","child_answer" (string or null if unreadable),'
              '"legibility":"clear|partial|unreadable"}. Do not correct the child. '
              "Do not guess unreadable digits. Return only a JSON list.")
    r = client().messages.create(model=VISION_MODEL, max_tokens=1000, messages=[{"role": "user", "content": [
        {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
        {"type": "text", "text": prompt}]}])
    _record(r); log_usage("read_slate", r)
    txt = _get_text(r).strip()
    try:
        if "```" in txt:
            parts = txt.split("```")
            for p in parts:
                p = p.strip()
                if p.startswith("json"): p = p[4:].strip()
                if p.startswith("[") and p.endswith("]"):
                    return json.loads(p)
        import re
        m = re.search(r'\[\s*\{.*\}\s*\]', txt, re.DOTALL)
        if m:
            return json.loads(m.group(0))
        return json.loads(txt)
    except (json.JSONDecodeError, IndexError, Exception):
        return [{"problem": p, "child_answer": None, "legibility": "unreadable"} for p in problems]

# ---------- activity wording ----------
ACTIVITY_SYSTEM = (
    "You are a friendly Hindi-speaking teaching assistant. "
    "Rewrite the given activity into a simple 2-3 line Hindi instruction (40-60 words) "
    "that a village teacher can read aloud to children. "
    "Include what the teacher does and what the children do. "
    "Do not add materials not listed. Do not invent new activities. "
    'Return ONLY JSON: {"instruction_hi": str}'
)

def rewrite_activity(activity: dict) -> str:
    """Rewrite an activity bank entry into simple Hindi instructions."""
    _check_budget(300, 200)
    r = client().messages.create(model=TEXT_MODEL, max_tokens=200, system=ACTIVITY_SYSTEM,
        messages=[{"role": "user", "content": json.dumps(activity, ensure_ascii=False)}])
    _record(r); log_usage("rewrite_activity", r)
    txt = _get_text(r)
    try:
        return json.loads(txt)["instruction_hi"]
    except (json.JSONDecodeError, KeyError, IndexError):
        return txt

# ---------- usage logging ----------
LOG_PATH = Path(__file__).resolve().parents[1] / "usage_log.jsonl"

def log_usage(task: str, resp) -> None:
    """Append token usage to a local log. This is your REAL cost data for the deck."""
    u = resp.usage
    entry = {"task": task, "model": resp.model, "in": u.input_tokens,
             "out": u.output_tokens, "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except OSError:
        pass  # logging is best-effort
