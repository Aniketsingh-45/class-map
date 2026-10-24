# Class Map API (v0.1)
Base URL (local): http://127.0.0.1:8000   |   Interactive docs: /docs
Auth: `POST /api/login` returns a token. Send it as header `Authorization: Bearer <token>`.
Demo accounts (synthetic data): teacher.demo, teacher2.demo, head.demo, head2.demo, officer.demo  (PIN: 1234 unless DEMO_PIN is set)

| Method + path | Role | What it does |
|---|---|---|
| GET /health | none | status, STT provider (mock/sarvam) |
| POST /api/login `{username, pin}` | none | `{token, role, username, school_id}` |
| GET /api/me | any | current user |
| GET /api/children | teacher | list `[ {id, label, level} ]` |
| POST /api/children `{label}` | teacher | add child (first name or roll only; surname/ID rejected) |
| POST /api/assess/reading (multipart: audio, child_id, task, [passage_id], [client_request_id], [audio_sec]) | teacher | score a reading clip. task = letter/word/paragraph/story |
| GET /api/assess/next-task?child_id= | teacher | next clip to record (ladder walk) |
| POST /api/assess/{id}/confirm `{teacher_level}` | teacher | teacher accepts/changes the level (AI level kept separately) |
| POST /api/assess/manual `{child_id, level, [client_request_id]}` | teacher | teacher sets level herself (offline / low-confidence fallback) |
| POST /api/assess/maths (multipart: photo, child_id, problems) | teacher | photograph slate → Claude reads handwriting → code marks answers |
| GET /api/groups | teacher | groups A-D, children, level, next skill, why |
| GET /api/plan/today | teacher | 20-minute plan from the activity bank |
| POST /api/activity/{id}/rewrite | teacher | rewrite activity into simple Hindi instructions (Claude, cached) |
| GET /api/progress | teacher | before/after levels, how many moved up |
| GET /api/summary | headteacher, officer | aggregate only; counts below 5 shown as "<5" |
| GET /api/samples | any | list evaluator samples S1-S5 |
| POST /api/samples/{id}/run?live=false | any | cached result (default) or live re-run (rate limited) |
| GET /api/passages | any | list all reading passages |
| GET /api/activities | any | list all activities from the bank |
| GET /api/claude/budget | any | today's Claude token usage vs daily limits |

## Reading result (POST /api/assess/reading)
`assessment_id, task, passage_id, score, strict_score, confidence, needs_teacher, ai_level_hint, next_task,
counts{correct,close,wrong,skipped,extra}, evidence[{kind,ref,hyp}], pattern{main_error,skipped,substituted,close}, stt_provider, transcript`
- If `needs_teacher` is true, show "please listen and choose the level" and call /confirm or /manual.
- Always send a unique `client_request_id` (offline queue retries will not create duplicates).
- Levels: beginner, letter, word, paragraph, story.
- Errors: 401 not logged in, 403 wrong role, 404 not your child, 413 audio too large, 429 too many requests, 502 speech-to-text failed (use manual level).

## Maths result (POST /api/assess/maths)
`assessment_id, child_id, subject, total, correct, score, results[{problem, child_answer, legibility, correct, error, truth}]`
- `problems` is a JSON array of strings like `["52-27", "34+18", "6+3"]`.
- Claude Vision reads the slate photo; code marks each answer.
- `error` types: `smaller_from_larger`, `borrowed_but_forgot_to_reduce_tens`, `added_instead_of_subtracted`, `other`, `unreadable`.
- Errors: 413 photo too large, 502 slate reading failed (enter answers manually).

## Activity rewriting (POST /api/activity/{id}/rewrite)
- Returns `{activity_id, instruction_hi, cached}`.
- Uses Claude to rewrite activity bank entries into 2-3 line simple Hindi instructions.
- Results are cached per activity id (one Claude call per unique activity).

## Claude budget (GET /api/claude/budget)
- Returns `{day, input_used, input_limit, output_used, output_limit}`.
- Daily limits configurable via `CLAUDE_DAILY_INPUT_LIMIT` and `CLAUDE_DAILY_OUTPUT_LIMIT` in .env.
