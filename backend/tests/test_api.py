import json, pytest
from fastapi.testclient import TestClient
from app import main, seed
from app.align import normalize

@pytest.fixture()
def cl(tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "t.db"))
    monkeypatch.setenv("STT_PROVIDER", "mock")
    monkeypatch.setenv("USE_CLAUDE", "0")
    main._hits.clear(); main._cached.clear(); main._activity_cache.clear()
    with TestClient(main.app) as c:
        seed.seed_if_empty()
        yield c

def auth(cl, user="teacher.demo", pin="1234"):
    r = cl.post("/api/login", json={"username": user, "pin": pin})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}

def passage_text(pid):
    return next(p for p in main.passages() if p["id"] == pid)["text"]

def audio():
    return {"audio": ("clip.webm", b"fake-audio-bytes", "audio/webm")}

def new_child(cl, h, label="Asha"):
    r = cl.post("/api/children", json={"label": label}, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]

def test_login_and_roles(cl):
    assert cl.post("/api/login", json={"username": "teacher.demo", "pin": "0000"}).status_code == 401
    head = auth(cl, "head.demo")
    assert cl.get("/api/children", headers=head).status_code == 403      # headteacher cannot use teacher endpoints
    assert cl.get("/api/children").status_code == 401                    # no token

def test_child_label_rules(cl):
    h = auth(cl)
    assert cl.post("/api/children", json={"label": "Asha Sharma"}, headers=h).status_code == 400   # surname
    assert cl.post("/api/children", json={"label": "123456789"}, headers=h).status_code == 400      # ID-like
    assert cl.post("/api/children", json={"label": "Asha"}, headers=h).status_code == 201
    assert cl.post("/api/children", json={"label": "Asha"}, headers=h).status_code == 409           # duplicate

def test_reading_flow_confirm_and_progress_event(cl, monkeypatch):
    h = auth(cl); cid = new_child(cl, h)
    words = normalize(passage_text("P1"))
    said = " ".join(w for i, w in enumerate(words) if i != 5)               # child skips one word
    monkeypatch.setattr(main.stt, "transcribe", lambda a, f, p: said)
    r = cl.post("/api/assess/reading", data={"child_id": cid, "task": "paragraph", "client_request_id": "req-1", "audio_sec": 18}, files=audio(), headers=h)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["counts"]["skipped"] == 1 and j["needs_teacher"] is False
    assert j["ai_level_hint"] == "paragraph" and j["next_task"] == "story"   # ladder walk goes up
    # same client_request_id again: no duplicate row, same answer
    r2 = cl.post("/api/assess/reading", data={"child_id": cid, "task": "paragraph", "client_request_id": "req-1"}, files=audio(), headers=h)
    assert r2.json()["assessment_id"] == j["assessment_id"] and r2.json()["duplicate"] is True
    # teacher changes the level; AI and teacher levels stay separate
    c = cl.post(f"/api/assess/{j['assessment_id']}/confirm", json={"teacher_level": "word"}, headers=h).json()
    assert c["ai_level"] == "paragraph" and c["teacher_level"] == "word" and c["changed_by_teacher"] is True
    kids = {k["label"]: k for k in cl.get("/api/children", headers=h).json()}
    assert kids["Asha"]["level"] == "word"
    assert cl.post(f"/api/assess/{j['assessment_id']}/confirm", json={"teacher_level": "genius"}, headers=h).status_code == 400

def test_audio_limits_and_ownership(cl, monkeypatch):
    h = auth(cl); cid = new_child(cl, h)
    monkeypatch.setenv("MAX_AUDIO_BYTES", "10")
    r = cl.post("/api/assess/reading", data={"child_id": cid, "task": "word"}, files=audio(), headers=h)
    assert r.status_code == 413
    monkeypatch.delenv("MAX_AUDIO_BYTES")
    h2 = auth(cl, "teacher2.demo")                                           # other teacher cannot touch this child
    r = cl.post("/api/assess/reading", data={"child_id": cid, "task": "word"}, files=audio(), headers=h2)
    assert r.status_code == 404

def test_stt_failure_gives_clear_error(cl, monkeypatch):
    h = auth(cl); cid = new_child(cl, h)
    def boom(*a): raise RuntimeError("no credits")
    monkeypatch.setattr(main.stt, "transcribe", boom)
    r = cl.post("/api/assess/reading", data={"child_id": cid, "task": "word"}, files=audio(), headers=h)
    assert r.status_code == 502 and "manual" in r.json()["detail"].lower()

def test_manual_level_offline_mode(cl):
    h = auth(cl); cid = new_child(cl, h, "Ravi")
    r = cl.post("/api/assess/manual", json={"child_id": cid, "level": "letter", "client_request_id": "m1"}, headers=h)
    assert r.status_code == 200
    assert cl.post("/api/assess/manual", json={"child_id": cid, "level": "letter", "client_request_id": "m1"}, headers=h).json()["duplicate"] is True
    assert cl.post("/api/assess/manual", json={"child_id": cid, "level": "nope"}, headers=h).status_code == 400

def test_groups_and_plan(cl):
    h = auth(cl)
    g = cl.get("/api/groups", headers=h).json()
    assert 1 <= len(g["groups"]) <= 4 and g["unassessed"] == []
    assert sum(len(x["children"]) for x in g["groups"]) == 24
    assert all(len(x["children"]) >= 3 for x in g["groups"])
    p = cl.get("/api/plan/today", headers=h).json()
    assert p["total_minutes"] == 20 and sum(s["minutes"] for s in p["slots"]) == 20
    teacher_slots = [s for s in p["slots"] if "with_teacher" in s]
    assert len({s["with_teacher"] for s in teacher_slots}) == len(teacher_slots) <= 3   # one group with teacher at a time

def test_progress_and_aggregate_views(cl):
    h = auth(cl)
    pr = cl.get("/api/progress", headers=h).json()
    assert pr["children_total"] == 24 and pr["moved_up"] >= 1
    head = cl.get("/api/summary", headers=auth(cl, "head.demo")).json()
    assert len(head["schools"]) == 1
    officer = cl.get("/api/summary", headers=auth(cl, "officer.demo")).json()
    assert len(officer["schools"]) == 2
    flat = json.dumps(officer)
    assert "R01" not in flat                                                    # no child names in aggregates
    assert any(v == "<5" for s in officer["schools"] for v in s["by_level"].values())   # small counts hidden
    assert cl.get("/api/summary", headers=h).status_code == 403

def test_samples(cl):
    h = auth(cl)
    sample_ids = {s["id"] for s in cl.get("/api/samples", headers=h).json()}
    assert {"S1", "S2", "S3", "S4", "S5"} == sample_ids
    s1 = cl.post("/api/samples/S1/run", headers=h).json()
    assert s1["mode"] == "cached" and s1["score"] == 1.0
    s2 = cl.post("/api/samples/S2/run?live=true", headers=h).json()
    assert s2["mode"] == "live" and s2["counts"]["skipped"] == 1 and not s2["needs_teacher"]
    s3 = cl.post("/api/samples/S3/run", headers=h).json()
    assert s3["needs_teacher"] is True                                          # noisy sample falls back to the teacher
    s4 = cl.post("/api/samples/S4/run", headers=h).json()
    assert s4["type"] == "maths_slate" and s4["results"][0]["error"] == "smaller_from_larger"
    s5 = cl.post("/api/samples/S5/run", headers=h).json()
    assert s5["type"] == "maths_slate" and s5["needs_manual"] is True

def test_maths_endpoint_with_mock(cl, monkeypatch):
    """Test maths endpoint with a mocked Claude read_slate."""
    h = auth(cl); cid = new_child(cl, h, "Geeta")
    mock_ocr = [{"problem": "52-27", "child_answer": "25", "legibility": "clear"},
                {"problem": "34+18", "child_answer": "52", "legibility": "clear"},
                {"problem": "6+3", "child_answer": "8", "legibility": "partial"}]
    import app.ai_claude as ai_mod
    monkeypatch.setattr(ai_mod, "read_slate", lambda img, probs: mock_ocr)
    r = cl.post("/api/assess/maths",
                data={"child_id": cid, "problems": json.dumps(["52-27", "34+18", "6+3"])},
                files={"photo": ("slate.jpg", b"fake-jpeg", "image/jpeg")}, headers=h)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["total"] == 3 and j["correct"] == 2
    assert j["results"][0]["correct"] is True
    assert j["results"][2]["correct"] is False

def test_passages_and_activities_endpoints(cl):
    h = auth(cl)
    p = cl.get("/api/passages", headers=h)
    assert p.status_code == 200 and len(p.json()) >= 4
    a = cl.get("/api/activities", headers=h)
    assert a.status_code == 200 and len(a.json()) >= 6

def test_claude_budget_endpoint(cl):
    h = auth(cl)
    r = cl.get("/api/claude/budget", headers=h)
    assert r.status_code == 200
    j = r.json()
    assert "input_limit" in j and "output_limit" in j

def test_student_login_and_homework_flow(cl, monkeypatch):
    # 1. Existing child login
    r = cl.post("/api/student/login", json={"label": "R01"})
    assert r.status_code == 200, r.text
    st1 = r.json()
    assert st1["role"] == "student" and st1["label"] == "R01"
    st1_hdr = {"Authorization": f"Bearer {st1['token']}"}

    # 2. New child auto-registration from home
    r = cl.post("/api/student/login", json={"label": "KavyaHome"})
    assert r.status_code == 200, r.text
    st2 = r.json()
    assert st2["role"] == "student" and st2["label"] == "KavyaHome"
    st2_hdr = {"Authorization": f"Bearer {st2['token']}"}

    # 3. Student dashboard
    dash = cl.get("/api/student/dashboard", headers=st2_hdr)
    assert dash.status_code == 200
    dj = dash.json()
    assert "assigned_reading" in dj and "assigned_maths" in dj

    # 4. Student submits reading homework
    import app.stt as stt_mod
    monkeypatch.setattr(stt_mod, "transcribe", lambda d, fn, ref: "राम बाज़ार जाता है वह आम खरीदता है")
    hw_read = cl.post("/api/student/homework/reading",
                      data={"task": "paragraph", "audio_sec": 10.0},
                      files={"audio": ("reading.wav", b"riff-wav-data", "audio/wav")},
                      headers=st2_hdr)
    assert hw_read.status_code == 200, hw_read.text
    rj = hw_read.json()
    assert rj["status"] == "pending_review"
    read_aid = rj["assessment_id"]

    # 5. Student submits maths homework
    hw_math = cl.post("/api/student/homework/maths",
                      data={"problems": json.dumps(["24+15", "48-19", "7+5"])},
                      files={"photo": ("slate.jpg", b"slate-data", "image/jpeg")},
                      headers=st2_hdr)
    assert hw_math.status_code == 200, hw_math.text
    mj = hw_math.json()
    assert mj["status"] == "pending_review"
    math_aid = mj["assessment_id"]

    # 6. Teacher views pending homework
    t_hdr = auth(cl)
    pending = cl.get("/api/homework/pending", headers=t_hdr)
    assert pending.status_code == 200
    p_list = pending.json()
    p_ids = [item["id"] for item in p_list]
    assert read_aid in p_ids and math_aid in p_ids

    # 6b. Teacher listens to audio & views slate image
    media_audio = cl.get(f"/api/homework/{read_aid}/media", headers=t_hdr)
    assert media_audio.status_code == 200
    assert len(media_audio.content) > 0

    media_photo = cl.get(f"/api/homework/{math_aid}/media", headers=t_hdr)
    assert media_photo.status_code == 200
    assert len(media_photo.content) > 0

    # 7. Teacher reviews and confirms reading homework with notes & custom level
    rev = cl.post(f"/api/homework/{read_aid}/review",
                  json={"action": "approve", "teacher_level": "paragraph", "teacher_notes": "Well read!"},
                  headers=t_hdr)
    assert rev.status_code == 200
    assert rev.json()["status"] == "confirmed"

    # 7b. Teacher reviews maths homework with manual correction
    rev_math = cl.post(f"/api/homework/{math_aid}/review",
                       json={"action": "approve", "teacher_score": 1.0, "teacher_notes": "Handwriting verified"},
                       headers=t_hdr)
    assert rev_math.status_code == 200
    assert rev_math.json()["status"] == "confirmed"

    # Verify child level was updated in database
    children = cl.get("/api/children", headers=t_hdr).json()
    kavya = next(c for c in children if c["label"] == "KavyaHome")
    assert kavya["level"] == "paragraph"
