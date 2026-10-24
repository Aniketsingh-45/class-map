"""Adaptive ladder walk (ASER-style). Thresholds are PLACEHOLDERS: confirm with ASER tool + teacher labels."""
LADDER = ["beginner", "letter", "word", "paragraph", "story"]
THRESH = {"letter": 0.8, "word": 0.8, "paragraph": 0.9, "story": 0.9}   # VERIFY / TUNE

def next_task(history: dict[str, float]) -> str | None:
    """history: task -> score already measured. Returns next task to record, or None if level decided."""
    if "paragraph" not in history: return "paragraph"
    if history["paragraph"] >= THRESH["paragraph"]:
        return "story" if "story" not in history else None
    if "word" not in history: return "word"
    if history["word"] >= THRESH["word"]: return None
    return "letter" if "letter" not in history else None

def decide(history: dict[str, float]) -> str:
    for task in ("story", "paragraph", "word", "letter"):
        if task in history and history[task] >= THRESH[task]:
            return task
    return "beginner"
