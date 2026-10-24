from app.align import normalize, align, summarize, confidence
from app.level import next_task, decide
from app.grouping import group_children
from app.maths import mark, level_from_results
from app.metrics import agreement, cohen_kappa

def test_alignment_close_and_skip():
    ref = normalize("राम बाज़ार जाता है। वह आम खरीदता है।")
    hyp = normalize("राम बजार जाता है वह खरीदता है")
    s = summarize(align(ref, hyp), len(ref))
    assert s["correct"] == 6 and s["close"] == 1 and s["skipped"] == 1
    assert round(s["score"], 3) == 0.875

def test_confidence_drops_for_weird_transcript():
    s = {"close": 0}
    assert confidence(s, 2, 20, 12) < 0.6
    assert confidence({"close": 0, "correct": 20}, 20, 20, 12) == 1.0

def test_ladder_walk():
    assert next_task({}) == "paragraph"
    assert next_task({"paragraph": 0.95}) == "story"
    assert next_task({"paragraph": 0.5}) == "word"
    assert decide({"paragraph": 0.95, "story": 0.6}) == "paragraph"
    assert decide({"paragraph": 0.4, "word": 0.9}) == "word"
    assert decide({}) == "beginner"

def test_grouping_merges_small_levels():
    lv = {f"c{i}": l for i, l in enumerate([0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4])}
    g = group_children(lv)
    assert len(g) <= 4 and sum(len(x["children"]) for x in g) == 12
    assert all(len(x["children"]) >= 3 for x in g)

def test_maths_marking_and_error_type():
    assert mark((52, "-", 27), 25)["correct"] is True
    assert mark((52, "-", 27), 35)["error"] == "smaller_from_larger"
    assert mark((52, "-", 27), None)["error"] == "unreadable"
    assert level_from_results({"num1": True, "num2": True, "subtraction": False}) == 2

def test_kappa():
    a = ["word", "word", "story", "letter", "word"]
    b = ["word", "paragraph", "story", "letter", "word"]
    assert agreement(a, b) == 0.8 and round(cohen_kappa(a, b), 3) == 0.706


def test_spoken_variant_and_stray_mark_are_not_errors():
    ref = normalize("वह रोज़ सुबह घास खाती है।")
    hyp = normalize("वो रोज सुबह घास खाती है      ी")
    s = summarize(align(ref, hyp), len(ref))
    assert s["correct"] == len(ref) and s["extra"] == 0

def test_wrong_passage_read_lowers_confidence():
    ref = normalize("राम बाज़ार जाता है। वह आम खरीदता है। आम मीठा है। राम घर आता है।")
    hyp = normalize("सीता के पास एक छोटी बकरी है वो रोज़ सुबह घास खाती है शाम को सीता उसे पानी पिलाती है")
    s = summarize(align(ref, hyp), len(ref))
    assert confidence(s, len(hyp), len(ref), 20) < 0.5
