"""Class Map API. Run:  cd backend && uvicorn app.main:app --reload   (docs at /docs)"""
import collections, json, re, time, uuid
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(__import__("pathlib").Path(__file__).resolve().parents[2] / ".env")
from . import auth, config, db, pipeline, plan as planmod, seed, stt
from .grouping import group_children
from .level import decide, next_task
from .levels import LEVEL_SCORE, valid_level

@asynccontextmanager
async def lifespan(app):
    db.init_db()
    if config.env("AUTO_SEED", "1") == "1":
        seed.seed_if_empty()
    yield

app = FastAPI(title="Class Map API", version="0.1", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.cors_origins(), allow_methods=["*"], allow_headers=["*"])

# ---------------- helpers ----------------
_hits: dict[str, list[float]] = collections.defaultdict(list)
def rate_limit(key: str, limit: int, window: int = 3600) -> None:
    now = time.time()
    hits = [t for t in _hits[key] if now - t < window]
    if len(hits) >= limit:
        raise HTTPException(429, "Too many requests. Please wait and try again.")
    hits.append(now); _hits[key] = hits

teacher_only = auth.require("teacher")
student_only = auth.require("student")
LABEL_RE = re.compile(r"^[\w\u0900-\u097F-]{1,20}$")

def check_label(label: str) -> str:
    label = label.strip()
    if " " in label:
        raise HTTPException(400, "Use first name or roll number only (no surname).")
    if sum(ch.isdigit() for ch in label) >= 7 or not LABEL_RE.match(label):
        raise HTTPException(400, "Invalid label. Use a first name or a short roll number (no ID numbers).")
    return label

def get_child(c, child_id: int, user: dict):
    row = c.execute("SELECT * FROM children WHERE id=? AND teacher_id=?", (child_id, user["id"])).fetchone()
    if row is None:
        raise HTTPException(404, "Child not found")
    return row

def passages() -> list[dict]:
    return json.load(open(config.data_dir() / "passages.json", encoding="utf-8"))

def pick_passage(task: str, passage_id: str | None) -> dict:
    for p in passages():
        if (passage_id and p["id"] == passage_id) or (not passage_id and p["level"] == task):
            return p
    raise HTTPException(400, f"No passage for task '{task}'")

def reading_history(c, child_id: int) -> dict[str, float]:
    since = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
    rows = c.execute("SELECT task, ai_score FROM assessments WHERE child_id=? AND ai_score IS NOT NULL AND created_at>=? "
                     "AND task IN ('letter','word','paragraph','story') ORDER BY id", (child_id, since)).fetchall()
    return {r["task"]: r["ai_score"] for r in rows}

def set_level(c, child_id: int, level: str) -> None:
    prev = c.execute("SELECT current_reading_level FROM children WHERE id=?", (child_id,)).fetchone()[0]
    c.execute("UPDATE children SET current_reading_level=? WHERE id=?", (level, child_id))
    if prev != level:
        c.execute("INSERT INTO progress_events (child_id, from_level, to_level) VALUES (?,?,?)", (child_id, prev, level))

# ---------------- auth ----------------
class LoginIn(BaseModel):
    username: str
    pin: str

@app.get("/health")
def health():
    return {"status": "ok", "stt_provider": config.stt_provider(), "claude_enabled": config.use_claude()}

@app.post("/api/login")
def login(body: LoginIn):
    rate_limit(f"login:{body.username}", 30, 300)
    with db.conn() as c:
        row = c.execute("SELECT * FROM users WHERE username=?", (body.username,)).fetchone()
    if row is None or not auth.verify_pin(body.pin, row["pin_hash"]):
        raise HTTPException(401, "Wrong username or PIN")
    return {"token": auth.make_token(row["id"], row["role"]), "role": row["role"], "username": row["username"], "school_id": row["school_id"]}

@app.get("/api/me")
def me(user: dict = Depends(auth.current_user)):
    return user

@app.get("/api/schools")
def list_schools():
    with db.conn() as c:
        rows = c.execute("SELECT id, name FROM schools ORDER BY id").fetchall()
    return [dict(r) for r in rows]

# ---------------- student login & homework portal ----------------
class StudentLoginIn(BaseModel):
    label: str
    school_id: int | None = None

@app.post("/api/student/login")
def student_login(body: StudentLoginIn):
    raw_label = body.label.strip()
    first_name = raw_label.split()[0] if raw_label else "Student"
    rate_limit(f"st_login:{first_name}", 120, 300)
    label = check_label(first_name)
    with db.conn() as c:
        school_id = body.school_id
        if not school_id:
            s = c.execute("SELECT id FROM schools ORDER BY id LIMIT 1").fetchone()
            school_id = s["id"] if s else 1
        
        child = c.execute("SELECT id, teacher_id, school_id, label, current_reading_level FROM children WHERE (school_id=? OR ? IS NULL) AND LOWER(label)=LOWER(?)",
                          (school_id, school_id, label)).fetchone()
        
        if child is None:
            child = c.execute("SELECT id, teacher_id, school_id, label, current_reading_level FROM children WHERE LOWER(label)=LOWER(?)", (label,)).fetchone()

        if child is None:
            t = c.execute("SELECT id FROM users WHERE school_id=? AND role='teacher' ORDER BY id LIMIT 1", (school_id,)).fetchone()
            if not t:
                t = c.execute("SELECT id FROM users WHERE role='teacher' ORDER BY id LIMIT 1").fetchone()
            teacher_id = t["id"] if t else 1
            
            try:
                c.execute("INSERT INTO children (teacher_id, school_id, label, current_reading_level) VALUES (?,?,?,?)",
                          (teacher_id, school_id, label, "beginner"))
                cid = c.execute("SELECT last_insert_rowid()").fetchone()[0]
                child = c.execute("SELECT id, teacher_id, school_id, label, current_reading_level FROM children WHERE id=?", (cid,)).fetchone()
            except Exception:
                child = c.execute("SELECT id, teacher_id, school_id, label, current_reading_level FROM children WHERE LOWER(label)=LOWER(?)", (label,)).fetchone()
        
        token = auth.make_token(child["id"], "student")
        return {
            "token": token,
            "role": "student",
            "child_id": child["id"],
            "label": child["label"],
            "level": child["current_reading_level"] or "beginner",
            "school_id": child["school_id"],
            "teacher_id": child["teacher_id"]
        }

@app.get("/api/student/dashboard")
def student_dashboard(user: dict = Depends(student_only)):
    with db.conn() as c:
        ch = c.execute("SELECT id, label, current_reading_level AS level, school_id, teacher_id FROM children WHERE id=?", (user["id"],)).fetchone()
        if not ch:
            raise HTTPException(404, "Student not found")
        subs = c.execute("""
            SELECT id, subject, task, passage_id, ai_score, teacher_score, ai_level, teacher_level, teacher_notes, status, created_at
            FROM assessments WHERE child_id=? AND is_homework=1 ORDER BY id DESC LIMIT 10
        """, (ch["id"],)).fetchall()

    cur_lvl = ch["level"] or "beginner"
    task_map = {
        "beginner": "letter",
        "letter": "word",
        "word": "paragraph",
        "paragraph": "story",
        "story": "story"
    }
    assigned_task = task_map.get(cur_lvl, "paragraph")
    passage = pick_passage(assigned_task, None)
    maths_hw = ["24+15", "48-19", "7+5"]

    return {
        "child_id": ch["id"],
        "label": ch["label"],
        "level": cur_lvl,
        "assigned_reading": {
            "task": assigned_task,
            "passage": passage,
            "instruction": f"Read this {assigned_task} aloud clearly into your microphone."
        },
        "assigned_maths": {
            "problems": maths_hw,
            "instruction": "Solve these 3 questions in your notebook or slate and upload a clear photo."
        },
        "submissions": [dict(s) for s in subs]
    }

@app.post("/api/student/homework/reading")
def student_submit_reading_homework(
    audio: UploadFile = File(...),
    task: str = Form(...),
    passage_id: str | None = Form(None),
    audio_sec: float = Form(20.0),
    client_request_id: str | None = Form(None),
    user: dict = Depends(student_only)
):
    child_id = user["id"]
    rate_limit(f"st_hw_read:{child_id}", 60, 3600)
    if task not in ("letter", "word", "paragraph", "story"):
        raise HTTPException(400, "task must be letter, word, paragraph or story")
    data = audio.file.read(config.max_audio_bytes() + 1)
    if len(data) > config.max_audio_bytes():
        raise HTTPException(413, "Audio too large")
    passage = pick_passage(task, passage_id)
    try:
        transcript = stt.transcribe(data, audio.filename or "hw_clip.webm", passage["text"])
    except Exception as e:
        raise HTTPException(502, f"Speech-to-text failed: {type(e).__name__}")
    
    # Save audio clip so teacher can listen to it during manual review
    saved_fname = None
    try:
        ext = ".webm" if (audio.filename and "webm" in audio.filename.lower()) else ".wav"
        saved_fname = f"audio_{uuid.uuid4().hex[:12]}{ext}"
        fpath = config.upload_dir() / saved_fname
        with open(fpath, "wb") as f:
            f.write(data)
    except Exception:
        saved_fname = None
    del data

    result = pipeline.score_reading(passage["text"], transcript, audio_sec)
    if config.use_claude() and not result["needs_teacher"]:
        try:
            from .ai_claude import error_pattern
            result["pattern"]["claude"] = error_pattern([e for e in result["evidence"] if e["kind"] != "correct"])
        except Exception:
            pass
    with db.conn() as c:
        history = reading_history(c, child_id)
        history[task] = result["score"]
        ai_level = decide(history)
        c.execute("""
            INSERT INTO assessments (child_id, subject, task, passage_id, ai_score, ai_level, confidence, evidence_json, pattern_json, is_homework, status, client_request_id, media_path)
            VALUES (?,?,?,?,?,?,?,?,?,1,'pending_review',?,?)
        """, (child_id, "reading", task, passage["id"], result["score"], ai_level, result["confidence"],
              json.dumps(result["evidence"], ensure_ascii=False), json.dumps(result["pattern"], ensure_ascii=False), client_request_id, saved_fname))
        aid = c.execute("SELECT last_insert_rowid()").fetchone()[0]
        resp = {
            "assessment_id": aid,
            "status": "pending_review",
            "is_homework": True,
            "message": "Reading homework submitted! Waiting for teacher review.",
            "task": task,
            "passage_id": passage["id"],
            "ai_level_hint": ai_level,
            "media_url": f"/api/homework/{aid}/media" if saved_fname else None,
            **result
        }
        c.execute("UPDATE assessments SET response_json=? WHERE id=?", (json.dumps(resp, ensure_ascii=False), aid))
    return {**resp, "transcript": transcript}

@app.post("/api/student/homework/maths")
def student_submit_maths_homework(
    photo: UploadFile = File(...),
    problems: str = Form(...),
    client_request_id: str | None = Form(None),
    user: dict = Depends(student_only)
):
    child_id = user["id"]
    rate_limit(f"st_hw_math:{child_id}", 30, 3600)
    img = photo.file.read(config.max_photo_bytes() + 1)
    if len(img) > config.max_photo_bytes():
        raise HTTPException(413, "Photo too large")
    prob_list = json.loads(problems)
    prob_strs = [str(p) for p in prob_list]
    parsed = []
    for p in prob_strs:
        p = p.strip()
        if "+" in p:
            parts = p.split("+"); parsed.append((int(parts[0]), "+", int(parts[1])))
        elif "-" in p:
            parts = p.split("-"); parsed.append((int(parts[0]), "-", int(parts[1])))
        else:
            parsed.append((int(p), "+", 0))
    try:
        from .ai_claude import read_slate
        ocr = read_slate(img, prob_strs)
    except Exception:
        ocr = [{"child_answer": None, "legibility": "clear"} for _ in prob_strs]
    
    # Save photo for teacher visual examination
    saved_fname = None
    try:
        saved_fname = f"photo_{uuid.uuid4().hex[:12]}.jpg"
        fpath = config.upload_dir() / saved_fname
        with open(fpath, "wb") as f:
            f.write(img)
    except Exception:
        saved_fname = None
    del img

    from .maths import mark
    results = []
    for i, (prob, reading) in enumerate(zip(parsed, ocr)):
        ans_str = reading.get("child_answer")
        child_ans = int(ans_str) if ans_str and str(ans_str).lstrip("-").isdigit() else None
        m = mark(prob, child_ans)
        results.append({"problem": prob_strs[i], "child_answer": ans_str, "legibility": reading.get("legibility", "unknown"), **m})
    correct_count = sum(1 for r in results if r.get("correct") is True)
    total = len(results)
    score = round(correct_count / max(total, 1), 3)
    with db.conn() as c:
        c.execute("""
            INSERT INTO assessments (child_id, subject, task, ai_score, evidence_json, is_homework, status, client_request_id, media_path)
            VALUES (?,?,?,?,?,1,'pending_review',?,?)
        """, (child_id, "maths", "slate", score, json.dumps(results, ensure_ascii=False), client_request_id, saved_fname))
        aid = c.execute("SELECT last_insert_rowid()").fetchone()[0]
        resp: dict[str, object] = {
            "assessment_id": aid,
            "child_id": child_id,
            "subject": "maths",
            "total": total,
            "correct": correct_count,
            "score": score,
            "results": results,
            "status": "pending_review",
            "is_homework": True,
            "message": "Maths homework submitted! Waiting for teacher review.",
            "media_url": f"/api/homework/{aid}/media" if saved_fname else None
        }
        c.execute("UPDATE assessments SET response_json=? WHERE id=?", (json.dumps(resp, ensure_ascii=False), aid))
    return resp

# ---------------- teacher homework review & media access ----------------
@app.get("/api/homework/pending")
def list_pending_homework(user: dict = Depends(teacher_only)):
    with db.conn() as c:
        rows = c.execute("""
            SELECT a.id, a.child_id, ch.label AS child_label, a.subject, a.task, a.passage_id,
                   a.ai_score, a.ai_level, a.teacher_score, a.teacher_level, a.teacher_notes,
                   a.confidence, a.evidence_json, a.pattern_json,
                   a.response_json, a.media_path, a.status, a.created_at
            FROM assessments a
            JOIN children ch ON ch.id = a.child_id
            WHERE ch.teacher_id = ? AND a.is_homework = 1 AND a.status = 'pending_review'
            ORDER BY a.id DESC
        """, (user["id"],)).fetchall()
        out = []
        for r in rows:
            d = dict(r)
            d["evidence"] = json.loads(d["evidence_json"]) if d["evidence_json"] else []
            d["pattern"] = json.loads(d["pattern_json"]) if d["pattern_json"] else {}
            if d.get("response_json"):
                try:
                    d["response"] = json.loads(d["response_json"])
                except Exception:
                    d["response"] = {}
            if d.get("media_path"):
                d["media_url"] = f"/api/homework/{d['id']}/media"
            else:
                d["media_url"] = None
            if d["subject"] == "reading" and d.get("passage_id"):
                p = next((x for x in passages() if x["id"] == d["passage_id"]), None)
                if p:
                    d["passage"] = p
            out.append(d)
        return out

@app.get("/api/homework/{assessment_id}/media")
def get_homework_media(assessment_id: int, user: dict = Depends(auth.current_user)):
    with db.conn() as c:
        row = c.execute("""
            SELECT a.id, a.child_id, a.subject, a.media_path, ch.teacher_id
            FROM assessments a
            JOIN children ch ON ch.id = a.child_id
            WHERE a.id = ?
        """, (assessment_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Assessment not found")
        if user["role"] == "student" and user["id"] != row["child_id"]:
            raise HTTPException(403, "Forbidden")
        
        media_path = row["media_path"]
        file_path = (config.upload_dir() / media_path) if media_path else None
        
        if not file_path or not file_path.is_file():
            if row["subject"] == "reading":
                fb = config.upload_dir() / "demo_reading.webm"
                if fb.is_file():
                    return FileResponse(path=str(fb), media_type="audio/webm")
            else:
                fb = config.upload_dir() / "demo_slate.jpg"
                if fb.is_file():
                    return FileResponse(path=str(fb), media_type="image/jpeg")
            raise HTTPException(404, "Media file not found")
        
        mtype = "audio/webm"
        if media_path and media_path.endswith(".wav"): mtype = "audio/wav"
        elif media_path and media_path.endswith(".mp3"): mtype = "audio/mpeg"
        elif media_path and (media_path.endswith(".jpg") or media_path.endswith(".jpeg")): mtype = "image/jpeg"
        elif media_path and media_path.endswith(".png"): mtype = "image/png"
        
        return FileResponse(path=str(file_path), media_type=mtype)

@app.post("/api/homework/seed-demo")
def seed_demo_homework(user: dict = Depends(teacher_only)):
    with db.conn() as c:
        aarav = c.execute("SELECT id FROM children WHERE teacher_id=? AND label='Aarav'", (user["id"],)).fetchone()
        if not aarav:
            c.execute("INSERT INTO children (teacher_id, school_id, label, current_reading_level) VALUES (?,?,?,'word')",
                      (user["id"], user["school_id"], "Aarav"))
            aarav_id = c.execute("SELECT last_insert_rowid()").fetchone()[0]
        else:
            aarav_id = aarav["id"]

        priya = c.execute("SELECT id FROM children WHERE teacher_id=? AND label='Priya'", (user["id"],)).fetchone()
        if not priya:
            c.execute("INSERT INTO children (teacher_id, school_id, label, current_reading_level) VALUES (?,?,?,'paragraph')",
                      (user["id"], user["school_id"], "Priya"))
            priya_id = c.execute("SELECT last_insert_rowid()").fetchone()[0]
        else:
            priya_id = priya["id"]

        p = pick_passage("paragraph", "P1")
        transcript = "राम बजार जाता है वह खरीदता है आम मीठा है राम घर आता है"
        r = pipeline.score_reading(p["text"], transcript, 18.0)
        c.execute("""
            INSERT INTO assessments (child_id, subject, task, passage_id, ai_score, ai_level, confidence, evidence_json, pattern_json, is_homework, status, media_path)
            VALUES (?, 'reading', 'paragraph', ?, ?, 'paragraph', 0.92, ?, ?, 1, 'pending_review', 'demo_reading.webm')
        """, (aarav_id, p["id"], r["score"], json.dumps(r["evidence"], ensure_ascii=False), json.dumps(r["pattern"], ensure_ascii=False)))
        aid1 = c.execute("SELECT last_insert_rowid()").fetchone()[0]
        resp1 = {"assessment_id": aid1, "status": "pending_review", "is_homework": True, "task": "paragraph", "media_url": f"/api/homework/{aid1}/media", **r}
        c.execute("UPDATE assessments SET response_json=? WHERE id=?", (json.dumps(resp1, ensure_ascii=False), aid1))

        math_items = [
            {"problem": "24+15", "child_answer": "39", "truth": 39, "correct": True, "error": None, "legibility": "clear"},
            {"problem": "48-19", "child_answer": "31", "truth": 29, "correct": False, "error": "smaller_from_larger", "legibility": "clear"},
            {"problem": "7+5", "child_answer": "12", "truth": 12, "correct": True, "error": None, "legibility": "clear"}
        ]
        score2 = round(2 / 3, 3)
        c.execute("""
            INSERT INTO assessments (child_id, subject, task, ai_score, evidence_json, is_homework, status, media_path)
            VALUES (?, 'maths', 'slate', ?, ?, 1, 'pending_review', 'demo_slate.jpg')
        """, (priya_id, score2, json.dumps(math_items, ensure_ascii=False)))
        aid2 = c.execute("SELECT last_insert_rowid()").fetchone()[0]
        resp2 = {"assessment_id": aid2, "child_id": priya_id, "subject": "maths", "total": 3, "correct": 2, "score": score2, "results": math_items, "status": "pending_review", "is_homework": True, "media_url": f"/api/homework/{aid2}/media"}
        c.execute("UPDATE assessments SET response_json=? WHERE id=?", (json.dumps(resp2, ensure_ascii=False), aid2))

    return {"status": "seeded", "created": [aid1, aid2]}

class HomeworkReviewIn(BaseModel):
    action: str  # "approve" or "reject"
    teacher_level: str | None = None
    teacher_score: float | None = None
    teacher_notes: str | None = None
    results: list[dict] | None = None

@app.post("/api/homework/{assessment_id}/review")
def review_homework(assessment_id: int, body: HomeworkReviewIn, user: dict = Depends(teacher_only)):
    with db.conn() as c:
        a = c.execute("""
            SELECT a.id, a.child_id, a.subject, a.task, a.ai_level, a.response_json, ch.teacher_id
            FROM assessments a
            JOIN children ch ON ch.id = a.child_id
            WHERE a.id = ? AND ch.teacher_id = ?
        """, (assessment_id, user["id"])).fetchone()
        if not a:
            raise HTTPException(404, "Homework assessment not found")
        
        new_status = "confirmed" if body.action == "approve" else "rejected"
        level_to_set = body.teacher_level or a["ai_level"]
        
        curr_resp = {}
        if a["response_json"]:
            try:
                curr_resp = json.loads(a["response_json"])
            except Exception:
                pass
        if body.teacher_notes is not None:
            curr_resp["teacher_notes"] = body.teacher_notes
        if body.teacher_score is not None:
            curr_resp["teacher_score"] = body.teacher_score
        if body.results is not None:
            curr_resp["results"] = body.results
            curr_resp["correct"] = sum(1 for r in body.results if r.get("correct") is True)
            curr_resp["total"] = len(body.results)
            curr_resp["score"] = round(curr_resp["correct"] / max(curr_resp["total"], 1), 3)

        c.execute("""
            UPDATE assessments
            SET status=?, teacher_level=?, teacher_score=?, teacher_notes=?, response_json=?
            WHERE id=?
        """, (new_status, level_to_set, body.teacher_score, body.teacher_notes, json.dumps(curr_resp, ensure_ascii=False), assessment_id))

        if body.action == "approve" and a["subject"] == "reading" and level_to_set and valid_level(level_to_set):
            set_level(c, a["child_id"], level_to_set)
        
        return {
            "assessment_id": assessment_id,
            "status": new_status,
            "teacher_level": level_to_set,
            "teacher_score": body.teacher_score,
            "teacher_notes": body.teacher_notes
        }

# ---------------- children ----------------
class ChildIn(BaseModel):
    label: str

@app.get("/api/children")
def list_children(user: dict = Depends(teacher_only)):
    with db.conn() as c:
        rows = c.execute("""
            SELECT ch.id, ch.label, ch.current_reading_level AS level,
                   (SELECT to_level FROM progress_events pe WHERE pe.child_id=ch.id ORDER BY pe.id LIMIT 1) AS baseline,
                   (SELECT count(*) FROM assessments a WHERE a.child_id=ch.id) AS assessment_count
            FROM children ch WHERE ch.teacher_id=? ORDER BY ch.label
        """, (user["id"],)).fetchall()
        out = []
        for r in rows:
            d = dict(r)
            cur = d.get("level")
            base = d.get("baseline")
            d["moved_up"] = bool(base and cur and LEVEL_SCORE.get(cur, 0) > LEVEL_SCORE.get(base, 0))
            out.append(d)
    return out

@app.post("/api/children", status_code=201)
def add_child(body: ChildIn, user: dict = Depends(teacher_only)):
    label = check_label(body.label)
    with db.conn() as c:
        try:
            c.execute("INSERT INTO children (teacher_id, school_id, label) VALUES (?,?,?)", (user["id"], user["school_id"], label))
        except Exception:
            raise HTTPException(409, "This name/roll already exists in your class")
        cid = c.execute("SELECT last_insert_rowid()").fetchone()[0]
    return {"id": cid, "label": label, "level": None}

# ---------------- reading assessment ----------------
@app.post("/api/assess/reading")
def assess_reading(audio: UploadFile = File(...), child_id: int = Form(...), task: str = Form(...),
                   passage_id: str | None = Form(None), client_request_id: str | None = Form(None),
                   audio_sec: float = Form(20.0), user: dict = Depends(teacher_only)):
    rate_limit(f"assess:{user['id']}", 200, 3600)
    with db.conn() as c:
        get_child(c, child_id, user)
        if client_request_id:
            dup = c.execute("SELECT response_json FROM assessments WHERE client_request_id=?", (client_request_id,)).fetchone()
            if dup and dup["response_json"]:
                return {**json.loads(dup["response_json"]), "duplicate": True}
    if task not in ("letter", "word", "paragraph", "story"):
        raise HTTPException(400, "task must be letter, word, paragraph or story")
    data = audio.file.read(config.max_audio_bytes() + 1)
    if len(data) > config.max_audio_bytes():
        raise HTTPException(413, "Audio too large")
    passage = pick_passage(task, passage_id)
    try:
        transcript = stt.transcribe(data, audio.filename or "clip.webm", passage["text"])
    except Exception as e:                                   # provider down, bad format, no credits...
        raise HTTPException(502, f"Speech-to-text failed: {type(e).__name__}. Teacher can use manual level.")
    del data                                                 # audio is never stored
    result = pipeline.score_reading(passage["text"], transcript, audio_sec)
    if config.use_claude() and not result["needs_teacher"]:
        try:
            from .ai_claude import error_pattern
            result["pattern"]["claude"] = error_pattern([e for e in result["evidence"] if e["kind"] != "correct"])
        except Exception:
            pass                                             # Claude is optional; rules-based pattern remains
    with db.conn() as c:
        history = reading_history(c, child_id)
        history[task] = result["score"]
        ai_level, nxt = decide(history), next_task(history)
        c.execute("INSERT INTO assessments (child_id, task, passage_id, ai_score, ai_level, confidence, evidence_json, pattern_json, client_request_id) VALUES (?,?,?,?,?,?,?,?,?)",
                  (child_id, task, passage["id"], result["score"], ai_level, result["confidence"],
                   json.dumps(result["evidence"], ensure_ascii=False), json.dumps(result["pattern"], ensure_ascii=False), client_request_id))
        aid = c.execute("SELECT last_insert_rowid()").fetchone()[0]
        resp = {"assessment_id": aid, "task": task, "passage_id": passage["id"], "ai_level_hint": ai_level, "next_task": nxt,
                "stt_provider": config.stt_provider(), **result}
        c.execute("UPDATE assessments SET response_json=? WHERE id=?", (json.dumps(resp, ensure_ascii=False), aid))
    return {**resp, "transcript": transcript}

@app.get("/api/assess/next-task")
def get_next_task(child_id: int, user: dict = Depends(teacher_only)):
    with db.conn() as c:
        get_child(c, child_id, user)
        h = reading_history(c, child_id)
    return {"next_task": next_task(h), "ai_level_hint": decide(h) if h else None, "history": h}

class ConfirmIn(BaseModel):
    teacher_level: str

@app.post("/api/assess/{assessment_id}/confirm")
def confirm(assessment_id: int, body: ConfirmIn, user: dict = Depends(teacher_only)):
    if not valid_level(body.teacher_level):
        raise HTTPException(400, f"teacher_level must be one of {list(LEVEL_SCORE)}")
    with db.conn() as c:
        a = c.execute("SELECT a.id, a.child_id, a.ai_level FROM assessments a JOIN children ch ON ch.id=a.child_id WHERE a.id=? AND ch.teacher_id=?",
                      (assessment_id, user["id"])).fetchone()
        if a is None:
            raise HTTPException(404, "Assessment not found")
        c.execute("UPDATE assessments SET teacher_level=? WHERE id=?", (body.teacher_level, assessment_id))
        set_level(c, a["child_id"], body.teacher_level)
    return {"assessment_id": assessment_id, "ai_level": a["ai_level"], "teacher_level": body.teacher_level, "changed_by_teacher": a["ai_level"] != body.teacher_level}

class ManualIn(BaseModel):
    child_id: int
    level: str
    client_request_id: str | None = None

@app.post("/api/assess/manual")
def manual(body: ManualIn, user: dict = Depends(teacher_only)):
    """Offline-friendly: the teacher decides the level herself (no AI)."""
    if not valid_level(body.level):
        raise HTTPException(400, f"level must be one of {list(LEVEL_SCORE)}")
    with db.conn() as c:
        get_child(c, body.child_id, user)
        if body.client_request_id and c.execute("SELECT 1 FROM assessments WHERE client_request_id=?", (body.client_request_id,)).fetchone():
            return {"duplicate": True}
        c.execute("INSERT INTO assessments (child_id, task, teacher_level, client_request_id) VALUES (?,?,?,?)",
                  (body.child_id, "manual", body.level, body.client_request_id))
        set_level(c, body.child_id, body.level)
    return {"child_id": body.child_id, "teacher_level": body.level}

# ---------------- maths assessment ----------------
@app.post("/api/assess/maths")
def assess_maths(photo: UploadFile = File(...), child_id: int = Form(...),
                 problems: str = Form(...), client_request_id: str | None = Form(None),
                 user: dict = Depends(teacher_only)):
    """Teacher photographs a child's slate. Claude reads handwriting, code marks it."""
    rate_limit(f"maths:{user['id']}", 50, 3600)
    with db.conn() as c:
        get_child(c, child_id, user)
        if client_request_id:
            dup = c.execute("SELECT response_json FROM assessments WHERE client_request_id=?", (client_request_id,)).fetchone()
            if dup and dup["response_json"]:
                return {**json.loads(dup["response_json"]), "duplicate": True}
    img = photo.file.read(config.max_photo_bytes() + 1)
    if len(img) > config.max_photo_bytes():
        raise HTTPException(413, "Photo too large")
    prob_list = json.loads(problems)  # e.g. ["52-27", "34+18", "6+3"]
    prob_strs = [str(p) for p in prob_list]
    # Parse problem strings into tuples
    parsed = []
    for p in prob_strs:
        p = p.strip()
        if "+" in p:
            parts = p.split("+"); parsed.append((int(parts[0]), "+", int(parts[1])))
        elif "-" in p:
            parts = p.split("-"); parsed.append((int(parts[0]), "-", int(parts[1])))
        else:
            parsed.append((int(p), "+", 0))
    try:
        from .ai_claude import read_slate
        ocr = read_slate(img, prob_strs)
    except Exception as e:
        raise HTTPException(502, f"Slate reading failed: {type(e).__name__}. Enter answers manually.")
    del img  # photo is never stored (privacy)
    from .maths import mark
    results = []
    for i, (prob, reading) in enumerate(zip(parsed, ocr)):
        ans_str = reading.get("child_answer")
        child_ans = int(ans_str) if ans_str and str(ans_str).lstrip("-").isdigit() else None
        m = mark(prob, child_ans)
        results.append({"problem": prob_strs[i], "child_answer": ans_str, "legibility": reading.get("legibility", "unknown"), **m})
    correct_count = sum(1 for r in results if r.get("correct") is True)
    total = len(results)
    resp = {"child_id": child_id, "subject": "maths", "total": total, "correct": correct_count,
            "score": round(correct_count / max(total, 1), 3), "results": results}
    with db.conn() as c:
        c.execute("INSERT INTO assessments (child_id, subject, task, ai_score, evidence_json, client_request_id) VALUES (?,?,?,?,?,?)",
                  (child_id, "maths", "slate", resp["score"], json.dumps(results, ensure_ascii=False), client_request_id))
        aid = c.execute("SELECT last_insert_rowid()").fetchone()[0]
        resp["assessment_id"] = aid
        c.execute("UPDATE assessments SET response_json=? WHERE id=?", (json.dumps(resp, ensure_ascii=False), aid))
    return resp

# ---------------- activity rewriting ----------------
_activity_cache: dict[str, str] = {}

@app.post("/api/activity/{activity_id}/rewrite")
def rewrite_activity(activity_id: str, user: dict = Depends(teacher_only)):
    """Rewrite an activity into simple Hindi. Cached per activity id."""
    if activity_id in _activity_cache:
        return {"activity_id": activity_id, "instruction_hi": _activity_cache[activity_id], "cached": True}
    acts = json.load(open(config.data_dir() / "activities.json", encoding="utf-8"))
    act = next((a for a in acts if a["id"] == activity_id), None)
    if act is None:
        raise HTTPException(404, "Activity not found")
    try:
        from .ai_claude import rewrite_activity as rw
        text = rw(act)
    except Exception as e:
        raise HTTPException(502, f"Activity rewriting failed: {type(e).__name__}")
    _activity_cache[activity_id] = text
    return {"activity_id": activity_id, "instruction_hi": text, "cached": False}

# ---------------- Claude budget ----------------
@app.get("/api/claude/budget")
def claude_budget(user: dict = Depends(auth.current_user)):
    from .ai_claude import budget_status
    return budget_status()

# ---------------- groups, plan, progress ----------------
def compute_groups(user: dict) -> dict:
    with db.conn() as c:
        kids = c.execute("SELECT id, label, current_reading_level AS lv FROM children WHERE teacher_id=?", (user["id"],)).fetchall()
        pats = {}
        for k in kids:
            r = c.execute("SELECT pattern_json FROM assessments WHERE child_id=? AND pattern_json IS NOT NULL ORDER BY id DESC LIMIT 1", (k["id"],)).fetchone()
            if r: pats[k["label"]] = json.loads(r["pattern_json"])
    levels = {k["label"]: LEVEL_SCORE[k["lv"]] for k in kids if k["lv"]}
    unassessed = sorted(k["label"] for k in kids if not k["lv"])
    names = {k["label"]: k["lv"] for k in kids}
    out = []
    for i, g in enumerate(group_children(levels)):
        lvl_names = [names[ch] for ch in g["children"]]
        level = collections.Counter(lvl_names).most_common(1)[0][0]
        err = pipeline.most_common_error([pats[ch] for ch in g["children"] if ch in pats])
        out.append({"name": "ABCD"[i], "level": level, "children": sorted(g["children"]),
                    "next_skill": pipeline.SKILL_FOR_ERROR[err], "why": f"Grouped by current reading level ({level}); most common error: {err}"})
    return {"groups": out, "unassessed": unassessed}

@app.get("/api/groups")
def groups(user: dict = Depends(teacher_only)):
    return compute_groups(user)

@app.get("/api/plan/today")
def plan_today(user: dict = Depends(teacher_only)):
    return planmod.build_plan(compute_groups(user)["groups"], date.today().toordinal())

def _baseline_and_current(c, where: str, params: tuple):
    rows = c.execute(f"SELECT ch.id, ch.label, ch.school_id, ch.current_reading_level AS cur, "
                     f"(SELECT to_level FROM progress_events pe WHERE pe.child_id=ch.id ORDER BY pe.id LIMIT 1) AS base "
                     f"FROM children ch WHERE {where}", params).fetchall()
    return rows

@app.get("/api/progress")
def progress(user: dict = Depends(teacher_only)):
    with db.conn() as c:
        rows = _baseline_and_current(c, "ch.teacher_id=?", (user["id"],))
    kids = [{"label": r["label"], "baseline": r["base"], "current": r["cur"],
             "moved_up": bool(r["base"] and r["cur"] and LEVEL_SCORE[r["cur"]] > LEVEL_SCORE[r["base"]])} for r in rows]
    assessed = [k for k in kids if k["current"]]
    return {"children_total": len(kids), "assessed": len(assessed), "moved_up": sum(k["moved_up"] for k in kids), "children": kids}

def _sup(n: int):
    return n if n >= 5 else "<5"          # hide small numbers in aggregate views

@app.get("/api/summary")
def summary(user: dict = Depends(auth.require("headteacher", "officer"))):
    with db.conn() as c:
        schools = c.execute("SELECT id, name FROM schools" + (" WHERE id=?" if user["role"] == "headteacher" else ""),
                            (user["school_id"],) if user["role"] == "headteacher" else ()).fetchall()
        out = []
        for s in schools:
            rows = _baseline_and_current(c, "ch.school_id=?", (s["id"],))
            dist = collections.Counter(r["cur"] for r in rows if r["cur"])
            moved = sum(1 for r in rows if r["base"] and r["cur"] and LEVEL_SCORE[r["cur"]] > LEVEL_SCORE[r["base"]])
            out.append({"school": s["name"], "children": len(rows), "assessed": sum(dist.values()),
                        "by_level": {lv: _sup(dist.get(lv, 0)) for lv in LEVEL_SCORE}, "moved_up": _sup(moved)})
    return {"role": user["role"], "note": "Aggregate only. Counts below 5 are hidden.", "schools": out}

# ---------------- evaluator samples ----------------
def _samples() -> list[dict]:
    return json.load(open(config.data_dir() / "samples.json", encoding="utf-8"))

_cached: dict[str, dict] = {}

def _run_sample(s: dict) -> dict:
    if s.get("type") == "maths_slate":
        from .maths import mark
        results = []
        for it in s.get("items", []):
            prob = it["problem"]
            parts = prob.split("-") if "-" in prob else prob.split("+")
            op = "-" if "-" in prob else "+"
            a, b = int(parts[0]), int(parts[1])
            ans = int(it["child_answer"]) if it.get("child_answer") is not None else None
            m = mark((a, op, b), ans)
            results.append({"problem": prob, "child_answer": it.get("child_answer"),
                            "legibility": it.get("legibility", "clear"), **m})
        correct_count = sum(1 for r in results if r.get("correct") is True)
        total = len(results)
        return {"sample_id": s["id"], "type": "maths_slate", "label": s["label"], "note": s["note"],
                "total": total, "correct": correct_count, "score": round(correct_count / max(total, 1), 3),
                "results": results, "needs_manual": any(r.get("correct") is None for r in results)}
    p = next(x for x in passages() if x["id"] == s["passage_id"])
    r = pipeline.score_reading(p["text"], s["transcript"], s["audio_sec"])
    return {"sample_id": s["id"], "type": "reading", "label": s["label"], "note": s["note"], "passage_id": p["id"], **r}

@app.get("/api/samples")
def list_samples(user: dict = Depends(auth.current_user)):
    return [{"id": s["id"], "type": s.get("type", "reading"), "label": s["label"], "title": s.get("title", s["label"]),
             "note": s["note"], "passage_id": s.get("passage_id")} for s in _samples()]

@app.post("/api/samples/{sample_id}/run")
def run_sample(sample_id: str, live: bool = Query(False), user: dict = Depends(auth.current_user)):
    s = next((x for x in _samples() if x["id"] == sample_id), None)
    if s is None:
        raise HTTPException(404, "Sample not found")
    if live:
        rate_limit(f"live:{user['id']}", 20, 3600)
        return {"mode": "live", **_run_sample(s)}
    if sample_id not in _cached:
        _cached[sample_id] = _run_sample(s)
    return {"mode": "cached", **_cached[sample_id]}

# ---------------- passages list for frontend ----------------
@app.get("/api/passages")
def list_passages(user: dict = Depends(auth.current_user)):
    return passages()

# ---------------- activities list for frontend ----------------
@app.get("/api/activities")
def list_activities(user: dict = Depends(auth.current_user)):
    return json.load(open(config.data_dir() / "activities.json", encoding="utf-8"))

# ---------------- serve frontend (must be LAST) ----------------
import os
_frontend = config.static_dir()
if os.path.isdir(_frontend):
    app.mount("/", StaticFiles(directory=str(_frontend), html=True), name="frontend")
