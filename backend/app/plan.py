"""Daily 20-minute plan from the reviewed activity bank. Rules only: no LLM."""
import json
from . import config

LEVEL_TO_ACTIVITY_LEVEL = {"beginner": "letter", "letter": "letter", "word": "word", "paragraph": "paragraph", "story": "story"}

def load_activities() -> list[dict]:
    return json.load(open(config.data_dir() / "activities.json", encoding="utf-8"))

def _pick(acts, level, teacher_led: bool, rot: int):
    lv = LEVEL_TO_ACTIVITY_LEVEL.get(level, "letter")
    pool = [a for a in acts if a["subject"] == "reading" and a["level"] == lv and (a["mode"] == "teacher-led") == teacher_led]
    if not pool:   # fall back to any reading activity of that kind
        pool = [a for a in acts if a["subject"] == "reading" and (a["mode"] == "teacher-led") == teacher_led]
    return pool[rot % len(pool)] if pool else None

def build_plan(groups: list[dict], day_ordinal: int) -> dict:
    acts = load_activities()
    groups = groups[:3]                      # plan covers up to 3 groups
    n = len(groups)
    if n == 0:
        return {"total_minutes": 0, "slots": [], "note": "No assessed children yet."}
    block = 16 // n
    slots: list[dict] = [{"time": "0-2 min", "minutes": 2, "what": "Whole class: one simple instruction. Groups go to their places."}]
    t = 2
    if n == 3:
        # Fixed 20-min template from Section 5.7 of the guide
        durations = [8, 7]
        for i in range(2):
            g = groups[i]
            d = durations[i]
            teacher_act = _pick(acts, g["level"], True, day_ordinal + i)
            entry = {"time": f"{t}-{t+d} min", "minutes": d, "with_teacher": g["name"],
                     "teacher_activity": teacher_act, "independent": []}
            for j, other in enumerate(groups):
                if j != i:
                    entry["independent"].append({"group": other["name"], "activity": _pick(acts, other["level"], False, day_ordinal + j)})
            slots.append(entry)
            t += d
        gC = groups[2]
        slots.append({
            "time": "17-20 min", "minutes": 3,
            "what": f"Group {gC['name']} 3-min check. Wrap-up: one line from each group. Praise effort.",
            "check_group": gC["name"]
        })
    else:
        block = 16 // n
        for i, g in enumerate(groups):
            teacher_act = _pick(acts, g["level"], True, day_ordinal + i)
            entry = {"time": f"{t}-{t+block} min", "minutes": block, "with_teacher": g["name"],
                     "teacher_activity": teacher_act, "independent": []}
            for j, other in enumerate(groups):
                if j != i:
                    entry["independent"].append({"group": other["name"], "activity": _pick(acts, other["level"], False, day_ordinal + j)})
            slots.append(entry)
            t += block
        slots.append({"time": f"{t}-20 min", "minutes": 20 - t, "what": "Wrap-up: one line from each group. Praise effort."})
    return {"total_minutes": 20, "slots": slots,
            "note": "Draft activities: have a teacher review the activity bank before real use."}
