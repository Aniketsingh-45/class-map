"""FIRST EXPERIMENT. Usage (from backend/):  python scripts/transcribe_and_score.py clip.webm P1
Records -> Sarvam STT -> align with known passage -> score + level hint. Needs SARVAM_API_KEY in .env"""
import sys, json, pathlib
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from dotenv import load_dotenv
load_dotenv(pathlib.Path(__file__).resolve().parents[2] / ".env")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
# pyrefly: ignore[missing-import]
from app.align import normalize, align, summarize, confidence
# pyrefly: ignore[missing-import]
from app.ai_sarvam import transcribe_hi

audio_path, pid = sys.argv[1], sys.argv[2]
passages = json.load(open(pathlib.Path(__file__).resolve().parents[2] / "data" / "passages.json", encoding="utf-8"))
p = next(x for x in passages if x["id"] == pid)
audio = open(audio_path, "rb").read()
text = transcribe_hi(audio, filename=pathlib.Path(audio_path).name)
ref, hyp = normalize(p["text"]), normalize(text)
ops = align(ref, hyp); s = summarize(ops, len(ref))
print("STT text :", text)
print("Passage  :", p["text"])
for o in ops: print(f"  {o.kind:8} ref={o.ref} hyp={o.hyp}")
print("score", round(s["score"], 2), "strict", round(s["strict_score"], 2),
      "confidence", confidence(s, len(hyp), len(ref), audio_sec=p.get("sec", 20)))
