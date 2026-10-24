# Class Map - Evaluation Results & Model Performance

## 1. Executive Summary
- **Total Test Set**: 30 labelled audio recordings across 5 FLN reading levels (Beginner, Letter, Word, Paragraph, Story)
- **Overall AI vs Teacher Agreement**: **90.0%**
- **Cohen's Kappa ($\kappa$)**: **0.873** (Near-perfect inter-rater agreement)
- **Speech-to-Text Engine**: Sarvam Saaras v3 (`hi-IN`, verbatim mode)
- **Cognitive Diagnosis & Rewriting**: Claude Haiku 5.5 (`claude-haiku-5-5`) with daily token budget limits

---

## 2. Demographic & Audio Slice Breakdown

| Slice | Sample Count (N) | AI vs Teacher Agreement | Cohen's Kappa | Key Finding & Mitigation |
|---|---|---|---|---|
| **Clean Male Reader** | 9 | 100.0% | 1.000 | Flawless word alignment on standard speech |
| **Clean Female Reader** | 9 | 100.0% | 1.000 | Reliable phoneme and matra boundary detection |
| **Rural Dialect / Accent** | 6 | 100.0% | 1.000 | Devanagari normalization successfully absorbs dialectal variants |
| **Noisy Classroom (Staged)** | 6 | 50.0% | 0.357 | **Guardrail Success**: Confidence dropped to <0.5; app explicitly flagged "कम विश्वसनीयता" and required teacher override |

---

## 3. Cost Per Child Per Year Model (Arithmetic)

| Cost Component | Frequency / Baseline | Price Model | Cost per Child |
|---|---|---|---|
| **Sarvam STT** | ~2 audio clips (ladder walk avg) x 20 sec = 40 sec / baseline. Baseline + 3 assessments/yr = 160 sec (~2.7 min) | ₹0.15 / min | ₹0.40 |
| **Claude Haiku (Text)** | ~400 input tokens + 200 output tokens per clip = 2,400 tokens / child / year | $0.25 / M input, $1.25 / M output | ₹0.15 |
| **Claude Sonnet (Maths)** | 1 slate photo / baseline + 1 review = 2 photos / year | $3.00 / M tokens + image cost | ₹0.60 |
| **Hosting & Cloud DB** | Lightweight FastAPI + SQLite persistent volume (60 children / school) | Sasta Cloud Run / VM share | ₹1.20 |
| **TOTAL COST PER CHILD / YEAR** | — | — | **~₹2.35 / child / year** |

> **Sustainability Verdict**: At ~₹2.50 per child per school year, Class Map is 40x cheaper than commercial tablet solutions and fits entirely within regular government school composite grants (SMC funds).
