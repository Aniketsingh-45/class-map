"""Reading alignment: compare STT transcript with the known passage (Hindi/Devanagari)."""
import re, unicodedata
from dataclasses import dataclass

# Spoken forms that speech-to-text writes differently from the textbook spelling.
# Both the passage and the transcript are mapped to the same form, so these never count as errors.
VARIANTS = {"\u0935\u094b": "\u0935\u0939",      # vo -> vah
            "\u092f\u0947": "\u092f\u0939"}      # ye -> yah   (extend this list after you see real transcripts)

def _has_base_letter(tok: str) -> bool:
    return any(ch.isalnum() and not unicodedata.category(ch).startswith("M") for ch in tok)

def normalize(text: str) -> list[str]:
    t = unicodedata.normalize("NFC", text)
    t = t.replace("\u0964", " ").replace("\u0965", " ")       # danda, double danda
    t = re.sub(r"[^\w\s\u0900-\u097F]", " ", t)                # drop punctuation
    t = t.replace("\u093c", "")                                # remove nukta (nukta variants)
    t = t.replace("\u0901", "\u0902")                          # chandrabindu -> anusvara
    toks = [w for w in t.split() if _has_base_letter(w)]       # drop stray marks like a lone vowel sign
    return [VARIANTS.get(w, w) for w in toks]

def lev(a: str, b: str) -> int:
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (ca != cb)))
        prev = cur
    return prev[-1]

def sim(a: str, b: str) -> float:
    return 1 - lev(a, b) / max(len(a), len(b), 1)

@dataclass
class Op:
    kind: str            # correct | close | wrong | skipped | extra
    ref: str | None
    hyp: str | None

def align(ref: list[str], hyp: list[str], close_thr: float = 0.7) -> list[Op]:
    n, m = len(ref), len(hyp)
    INF = 1e9
    cost: list[list[float]] = [[float(INF)] * (m + 1) for _ in range(n + 1)]
    back: list[list[tuple[int, int, str] | None]] = [[None] * (m + 1) for _ in range(n + 1)]
    cost[0][0] = 0.0
    for i in range(n + 1):
        for j in range(m + 1):
            if i < n and cost[i][j] + 1 < cost[i + 1][j]:           # skipped
                cost[i + 1][j] = cost[i][j] + 1; back[i + 1][j] = (i, j, "skipped")
            if j < m and cost[i][j] + 1 < cost[i][j + 1]:           # extra
                cost[i][j + 1] = cost[i][j] + 1; back[i][j + 1] = (i, j, "extra")
            if i < n and j < m:
                s = sim(ref[i], hyp[j])
                c = 0.0 if s == 1 else (0.3 if s >= close_thr else 1.0)
                if cost[i][j] + c < cost[i + 1][j + 1]:
                    cost[i + 1][j + 1] = cost[i][j] + c
                    kind = "correct" if s == 1 else ("close" if s >= close_thr else "wrong")
                    back[i + 1][j + 1] = (i, j, kind)
    ops: list[Op] = []
    i, j = n, m
    while (i, j) != (0, 0):
        step = back[i][j]
        if step is None:
            break
        pi, pj, kind = step
        ops.append(Op(kind, ref[pi] if kind != "extra" else None, hyp[pj] if kind not in ("skipped",) else None))
        i, j = pi, pj
    return ops[::-1]

def summarize(ops: list[Op], n_ref: int) -> dict:
    c = lambda k: sum(o.kind == k for o in ops)
    return {"n_ref": n_ref, "correct": c("correct"), "close": c("close"), "wrong": c("wrong"),
            "skipped": c("skipped"), "extra": c("extra"),
            "score": (c("correct") + c("close")) / max(n_ref, 1),
            "strict_score": c("correct") / max(n_ref, 1)}

def confidence(summary: dict, hyp_len: int, ref_len: int, audio_sec: float) -> float:
    """0..1. Low when STT output looks unreliable. Tune on your labelled recordings."""
    ratio = hyp_len / max(ref_len, 1)
    conf = 1.0
    if ratio < 0.4 or ratio > 1.8: conf -= 0.5     # transcript length very different from passage
    if summary["close"] / max(ref_len, 1) > 0.25:  conf -= 0.2  # many near-matches: ambiguous
    if audio_sec < 3 or audio_sec > 60:           conf -= 0.2  # too short / too long
    matched = (summary.get("correct", 0) + summary.get("close", 0)) / max(hyp_len, 1)
    if hyp_len >= 3 and matched < 0.25:           conf -= 0.6  # almost nothing matches: wrong passage read, or STT failed
    return max(conf, 0.0)
