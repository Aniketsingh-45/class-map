# Class Map - Privacy & DPDP Compliance Architecture

## Principles & Commitments

Class Map is designed strictly under the **Digital Personal Data Protection (DPDP) Act, 2023** and **DPDP Rules (November 2025)**, with special adherence to Section 9 (Processing of Personal Data of Children).

### 1. Minimal Data Storage (Data Minimization)
- **First Name or Roll Only**: Child records only store a first name (e.g., "Priya", "Amit") or a short roll number (e.g., "R01").
- **Strict Validation**: The API programmatically rejects any surname, whitespace in label, or ID string containing 7 or more digits.
- **No Demographics**: No date of birth, caste, religion, address, or parent phone numbers are ever stored in the database.

### 2. Zero Retention of Biometric Audio and Slate Photos (Ephemeral Processing)
- **Audio Clips**: Voice recordings are streamed directly in memory to the STT provider (Sarvam Saaras v3) and discarded from memory immediately after alignment. No audio file is ever written to disk or database.
- **Slate Photos**: Slate photos are converted to base64 for Claude Vision OCR and discarded immediately after digit extraction. No photo is ever saved.
- **Phone Queue**: In offline mode, temporary audio clips in IndexedDB are permanently purged from the browser storage immediately upon successful sync.

### 3. Role-Based Access Control (RBAC) & Aggregate Anonymity
- **Teacher**: Can only see children enrolled in their specific class section.
- **Headteacher & Block Officer**: Cannot see individual child names or individual records. They only receive aggregate counts across school sections.
- **Small Group Suppression (<5 Rule)**: In all aggregate reports, any cell count smaller than 5 is replaced with `"<5"` to prevent re-identification through elimination.

### 4. Consent Framework (DPDP Section 9 & Fourth Schedule)
- Assessments are conducted within government/NGO schooling environments under legitimate educational assessment exceptions (Fourth Schedule).
- Verifiable institutional/parental consent scripts are integrated for any pilot studies.

### 5. AI Guardrails & Human-in-the-Loop
- AI never labels a child (no derogatory tags like "weak" or "slow reader").
- The teacher retains complete authority: the AI provides an evidence-based recommendation, but the teacher explicitly confirms or overrides every level.
