"""Demo data. ALL SYNTHETIC. Run:  cd backend && python -m app.seed [--reset]"""
import json, os, random, sys
from datetime import datetime, timedelta, timezone
from . import auth, config, db
from .level import LADDER

FMT = "%Y-%m-%d %H:%M:%S"
ERRS = ["skipped_words", "substituted_words", "close_words", "none"]

def _ts(days_ago: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime(FMT)

def _user(c, school_id, username, role, pin):
    c.execute("INSERT INTO users (school_id, username, pin_hash, role) VALUES (?,?,?,?)",
              (school_id, username, auth.hash_pin(pin), role))
    return c.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone()["id"]

def _school(c, name, teacher_name, n_children, rng, pin, head_name=None):
    c.execute("INSERT INTO schools (name) VALUES (?)", (name,))
    sid = c.execute("SELECT last_insert_rowid()").fetchone()[0]
    tid = _user(c, sid, teacher_name, "teacher", pin)
    if head_name:
        _user(c, sid, head_name, "headteacher", pin)
    for i in range(1, n_children + 1):
        base = rng.choices([0, 1, 2, 3], weights=[2, 4, 4, 3])[0]
        new = min(base + 1, 4) if rng.random() < 0.45 else base
        c.execute("INSERT INTO children (teacher_id, school_id, label, current_reading_level, created_at) VALUES (?,?,?,?,?)",
                  (tid, sid, f"R{i:02d}", LADDER[new], _ts(30)))
        cid = c.execute("SELECT last_insert_rowid()").fetchone()[0]
        pat = json.dumps({"main_error": rng.choice(ERRS)})
        c.execute("INSERT INTO assessments (child_id, task, ai_score, ai_level, teacher_level, confidence, pattern_json, created_at) VALUES (?,?,?,?,?,?,?,?)",
                  (cid, "seed", 0.5, LADDER[base], LADDER[base], 0.9, pat, _ts(28)))
        c.execute("INSERT INTO progress_events (child_id, from_level, to_level, created_at) VALUES (?,?,?,?)", (cid, None, LADDER[base], _ts(28)))
        if new != base:
            c.execute("INSERT INTO assessments (child_id, task, ai_score, ai_level, teacher_level, confidence, pattern_json, created_at) VALUES (?,?,?,?,?,?,?,?)",
                      (cid, "seed", 0.9, LADDER[new], LADDER[new], 0.9, pat, _ts(3)))
            c.execute("INSERT INTO progress_events (child_id, from_level, to_level, created_at) VALUES (?,?,?,?)", (cid, LADDER[base], LADDER[new], _ts(3)))

def seed_if_empty() -> bool:
    db.init_db()
    with db.conn() as c:
        if c.execute("SELECT COUNT(*) FROM users").fetchone()[0] > 0:
            return False
        pin = os.getenv("DEMO_PIN", "1234")
        rng = random.Random(7)
        _school(c, "Demo Primary School (synthetic data)", "teacher.demo", 24, rng, pin, "head.demo")
        _school(c, "Demo School Two (synthetic data)", "teacher2.demo", 12, rng, pin, "head2.demo")
        _user(c, None, "officer.demo", "officer", pin)
    return True

if __name__ == "__main__":
    if "--reset" in sys.argv:
        p = config.db_path()
        if os.path.exists(p): os.remove(p)
    print("Seeded." if seed_if_empty() else "Database already has users (use --reset).")
    print("Demo logins: teacher.demo / head.demo / officer.demo / teacher2.demo  (PIN from DEMO_PIN, default 1234)")
