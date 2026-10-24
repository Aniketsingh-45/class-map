import sqlite3
from contextlib import contextmanager
from . import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS schools (id INTEGER PRIMARY KEY, name TEXT NOT NULL, language TEXT DEFAULT 'hi');
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, school_id INTEGER REFERENCES schools(id),
  username TEXT UNIQUE NOT NULL, pin_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher','headteacher','officer')));
CREATE TABLE IF NOT EXISTS children (
  id INTEGER PRIMARY KEY, teacher_id INTEGER NOT NULL REFERENCES users(id),
  school_id INTEGER REFERENCES schools(id), label TEXT NOT NULL,
  current_reading_level TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (teacher_id, label));
CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY, child_id INTEGER NOT NULL REFERENCES children(id),
  subject TEXT DEFAULT 'reading', task TEXT, passage_id TEXT,
  ai_score REAL, ai_level TEXT, teacher_level TEXT, confidence REAL,
  evidence_json TEXT, pattern_json TEXT, response_json TEXT,
  is_homework INTEGER DEFAULT 0, status TEXT DEFAULT 'confirmed',
  client_request_id TEXT UNIQUE, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS progress_events (
  id INTEGER PRIMARY KEY, child_id INTEGER NOT NULL REFERENCES children(id),
  subject TEXT DEFAULT 'reading', from_level TEXT, to_level TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
"""

@contextmanager
def conn():
    c = sqlite3.connect(config.db_path())
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    try:
        yield c
        c.commit()
    except Exception:
        c.rollback()
        raise
    finally:
        c.close()

def init_db() -> None:
    with conn() as c:
        c.executescript(SCHEMA)
        cols = [r[1] for r in c.execute("PRAGMA table_info(assessments)").fetchall()]
        if "is_homework" not in cols:
            c.execute("ALTER TABLE assessments ADD COLUMN is_homework INTEGER DEFAULT 0")
        if "status" not in cols:
            c.execute("ALTER TABLE assessments ADD COLUMN status TEXT DEFAULT 'confirmed'")
        if "media_path" not in cols:
            c.execute("ALTER TABLE assessments ADD COLUMN media_path TEXT")
        if "teacher_score" not in cols:
            c.execute("ALTER TABLE assessments ADD COLUMN teacher_score REAL")
        if "teacher_notes" not in cols:
            c.execute("ALTER TABLE assessments ADD COLUMN teacher_notes TEXT")
