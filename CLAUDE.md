# Class Map
Mobile-first PWA for teachers (Grades 1-5, Hindi). The teacher records a child reading a KNOWN passage;
the app returns a level, class groups and a 20-minute daily plan. The teacher confirms every AI result.

## Rules
- Python 3.10+ FastAPI backend in backend/app. Keep it simple, minimal dependencies. SQLite for storage.
- AI: Sarvam for Hindi speech-to-text (app/ai_sarvam.py). Claude only for: error-pattern summary,
  slate-photo reading, and simple wording of activities (app/ai_claude.py).
- Levels, grouping and maths marking are done by CODE (app/align.py, level.py, grouping.py, maths.py), never by the LLM.
- Activities come from data/activities.json. The LLM must never invent activities or materials.
- Never store audio or photos after analysis. No surnames, no real child data in the repo.
- API keys only in environment / .env (never commit, never print). Keep .env.example updated.
- Log token usage for every Claude call (see log_usage in ai_claude.py).
- Offline matters: the frontend must record and queue clips without internet; manual level mode must work offline.
- Existing code in backend/app is tested (run: cd backend && pytest). Do not rewrite it; extend it.

## Working style
- One small task at a time. Run pytest after each change. Explain what you changed in 3 lines.
- Ask before adding a new dependency.
