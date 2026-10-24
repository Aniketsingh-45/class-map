"""Compute evaluation agreement, Cohen's kappa, and slice metrics on labelled evaluation dataset."""
import json
from pathlib import Path
from collections import Counter

def agreement(a: list, b: list) -> float:
    return sum(x == y for x, y in zip(a, b)) / len(a)

def cohen_kappa(a: list, b: list) -> float:
    n = len(a)
    po = agreement(a, b)
    ca, cb = Counter(a), Counter(b)
    pe = sum(ca[k] * cb[k] for k in set(a) | set(b)) / (n * n)
    return 1.0 if pe == 1 else (po - pe) / (1 - pe)

def evaluate(path: str | Path | None = None) -> dict:
    if path is None:
        path = Path(__file__).resolve().parent / "labelled_clips.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    teacher_labels = [d["teacher_level"] for d in data]
    ai_labels = [d["ai_level"] for d in data]
    
    overall_agr = agreement(teacher_labels, ai_labels)
    overall_kappa = cohen_kappa(teacher_labels, ai_labels)
    
    # Slices
    slices = {}
    for d in data:
        s = d.get("slice", "other")
        slices.setdefault(s, {"t": [], "a": []})
        slices[s]["t"].append(d["teacher_level"])
        slices[s]["a"].append(d["ai_level"])
        
    slice_results = {}
    for s_name, s_data in slices.items():
        slice_results[s_name] = {
            "n": len(s_data["t"]),
            "agreement": round(agreement(s_data["t"], s_data["a"]), 3),
            "kappa": round(cohen_kappa(s_data["t"], s_data["a"]), 3)
        }
        
    return {
        "n_total": len(data),
        "overall_agreement": round(overall_agr, 3),
        "cohen_kappa": round(overall_kappa, 3),
        "slices": slice_results
    }

if __name__ == "__main__":
    res = evaluate()
    print("=== Evaluation Results ===")
    print(f"Total Clips : {res['n_total']}")
    print(f"Agreement   : {res['overall_agreement'] * 100:.1f}%")
    print(f"Cohen Kappa : {res['cohen_kappa']:.3f}")
    print("\nSlice Breakdown:")
    for sl, vals in res["slices"].items():
        print(f"  {sl:16}: Agreement={vals['agreement']*100:.1f}%, Kappa={vals['kappa']:.3f} (n={vals['n']})")
