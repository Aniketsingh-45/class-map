"""Scoring pipeline shared by the API and the sample runner. Pure code, no network."""
from collections import Counter
from .align import normalize, align, summarize, confidence

def score_reading(passage_text: str, transcript: str, audio_sec: float) -> dict:
    ref, hyp = normalize(passage_text), normalize(transcript)
    ops = align(ref, hyp)
    s = summarize(ops, len(ref))
    conf = confidence(s, len(hyp), len(ref), audio_sec)
    evidence = [{"kind": o.kind, "ref": o.ref, "hyp": o.hyp} for o in ops]
    # Reading accuracy: A test where the student makes pronunciation/word errors
    # can NEVER show 100% accuracy. We use strict_score (exact correct words / total words).
    strict = round(s["strict_score"], 3)
    lenient = round(s["score"], 3)
    return {"score": strict, "strict_score": strict, "lenient_score": lenient,
            "confidence": round(conf, 2), "needs_teacher": conf < 0.5,
            "counts": {k: s[k] for k in ("correct", "close", "wrong", "skipped", "extra")},
            "evidence": evidence, "pattern": simple_pattern(evidence)}

def simple_pattern(evidence: list[dict]) -> dict:
    skipped = [e["ref"] for e in evidence if e["kind"] == "skipped"]
    wrong = [{"ref": e["ref"], "hyp": e["hyp"]} for e in evidence if e["kind"] == "wrong"]
    close = [{"ref": e["ref"], "hyp": e["hyp"]} for e in evidence if e["kind"] == "close"]
    counts = {"skipped_words": len(skipped), "substituted_words": len(wrong), "close_words": len(close)}
    main = max(counts, key=counts.__getitem__) if any(counts.values()) else "none"
    return {"main_error": main, "skipped": skipped, "substituted": wrong, "close": close}

SKILL_FOR_ERROR = {"skipped_words": "read every word, do not skip",
                   "substituted_words": "match sounds to letters",
                   "close_words": "accuracy of sounds",
                   "none": "fluency and expression"}

def most_common_error(patterns: list[dict] | list[dict | None]) -> str:
    c = Counter(p.get("main_error", "none") for p in patterns if p)
    c.pop("none", None)
    return c.most_common(1)[0][0] if c else "none"
