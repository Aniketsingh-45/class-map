# Class Map (कक्षा मानचित्र)

> **One-line pitch**: Teacher records a 30-second voice note of a child reading a known Hindi passage -> Class Map returns the child's foundational reading level, classroom learning groups, and a 20-minute multi-grade daily plan. The teacher confirms every AI suggestion.

Live Local URL: `http://127.0.0.1:8000` | Interactive API Docs: `http://127.0.0.1:8000/docs`

---

## ⚡ Evaluator Quick Test Credentials

All accounts come pre-seeded with **24 synthetic children** and realistic baseline/progress histories. No real children data is ever used.

| Role | Username | PIN | What You Can Test |
|---|---|---|---|
| **Teacher** | `teacher.demo` | `1234` | My class list, reading voice assessment, manual offline mode, maths slate photo, grouping, daily 20-min plan, progress tracker |
| **Headteacher** | `head.demo` | `1234` | School-wide aggregate summary, level distribution chart, movement metrics (<5 privacy suppression) |
| **Block Officer** | `officer.demo` | `1234` | Cross-school aggregate monitoring, macro FLN tracking |

*Tip: The web interface contains **1-Tap Evaluator Switch buttons** at the top banner, so you do not even need to type credentials!*

---

## 🌟 Why Class Map Wins (5 Distinctive Layers)

1. **Layer 1 - Data Input**: 20-30s voice clip against a *known* passage, slate photo arithmetic, teacher confirmation taps.
2. **Layer 2 - Processing**: Sarvam Saaras v3 Hindi STT -> rule-based word-by-word alignment -> adaptive ladder walk (ASER-style) -> Claude 5.5 for error patterns and handwriting.
3. **Layer 3 - Guardrails**:
   - Confidence score drops on noisy audio; app explicitly asks teacher to decide.
   - Code marks arithmetic, *never the LLM*.
   - Activities strictly from reviewed bank with zero-cost materials (pebbles, matchsticks, bottle caps).
   - Strict daily Claude token budget limit (`CLAUDE_DAILY_INPUT_LIMIT=50000`).
4. **Layer 4 - Evaluation**: 90.0% agreement with teachers across 30 labelled clips ($\kappa = 0.873$). Weak slices (noisy rooms) openly reported and safely handled.
5. **Layer 5 - Output**: Actionable FLN level + visual word evidence + 4 classroom groups + 20-min multi-grade timetable + aggregate dashboards.

---

## 🔒 Privacy & DPDP Act 2023 Compliance
- **Zero Audio/Photo Storage**: Voice clips and slate photos are discarded from RAM immediately after inference. No audio or images are ever stored on disk.
- **Data Minimization**: Child records only store a first name or short roll number (e.g. `R01`, `Amit`). Surnames, Aadhaar, and ID numbers > 6 digits are programmatically rejected.
- **Small Group Suppression (<5 Rule)**: Headteacher and officer dashboards suppress counts under 5 as `"<5"` to prevent identification by elimination.
- Full details in [docs/privacy.md](docs/privacy.md).

---

## ✈️ Offline & Low-Connectivity Design
- **Progressive Web App (PWA)**: Works offline via Service Worker (`sw.js`) app-shell cache.
- **IndexedDB Queue**: When offline or in Airplane Mode, recordings and manual level entries are safely queued on the phone and automatically synced when connection is restored.
- **Airplane Mode Simulation**: Evaluators can toggle the "✈️ Airplane Mode" button in the top bar to test offline recording directly in desktop or mobile browsers!
- Detailed test cases in [docs/test_log.md](docs/test_log.md).

---

## 🤖 External AI Services & Models

| Service | Model | Purpose | Environment Variable |
|---|---|---|---|
| **Sarvam AI** | `saaras:v3` | Hindi speech-to-text (`hi-IN`, verbatim) | `SARVAM_API_KEY` |
| **Anthropic** | `claude-haiku-5-5` | Error pattern diagnosis, spoken Hindi activity rewriting | `ANTHROPIC_API_KEY` |
| **Anthropic** | `claude-sonnet-5-5` | Handwritten slate arithmetic OCR | `ANTHROPIC_API_KEY` |

---

## 💰 Cost Model: ~₹2.35 per child / year

| Item | Usage | Unit Rate | Annual Cost / Child |
|---|---|---|---|
| Sarvam STT | ~160s audio / year | ₹0.15 / min | ₹0.40 |
| Claude Haiku (Text) | ~2,400 tokens / year | $0.25 / M in, $1.25 / M out | ₹0.15 |
| Claude Sonnet (Vision) | 2 slate photos / year | $3.00 / M tokens | ₹0.60 |
| Server & Database | Shared lightweight FastAPI + SQLite | Shared instance | ₹1.20 |
| **Total** | | | **~₹2.35 / year** |

---

## 🚀 Quick Start (Local Run)

```bash
# 1. Activate environment
.venv\Scripts\activate              # Windows (PowerShell)
# or: source .venv/bin/activate     # Mac/Linux

# 2. Install dependencies (if needed)
pip install -r requirements.txt

# 3. Environment configuration
# Ensure .env has your SARVAM_API_KEY and ANTHROPIC_API_KEY

# 4. Reset / seed demo database
python -m app.seed --reset

# 5. Run automated test suite (18/18 tests)
pytest

# 6. Start the server (serves API and PWA frontend at root /)
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000` in Google Chrome (Desktop or Mobile).

---

## 🧪 Try Evaluator Samples (S1 - S5)
Inside the web app, click the **⭐ नमूना परखें (Evaluator S1-S5)** tab:
- **S1 (Word level)**: Clean adult reading -> 10/10 words correct -> instant confirm.
- **S2 (Paragraph level)**: Paragraph with 2 errors -> Claude Hindi diagnostic summary.
- **S3 (Noise fallback)**: Staged classroom noise -> confidence drops -> prompts teacher to decide.
- **S4 (Maths slate)**: Borrowing error detected by rules (`smaller_from_larger`).
- **S5 (Letter struggling)**: Early reader recognizing 3/5 letters -> remedial next skill.
