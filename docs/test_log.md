# Class Map - Field Testing & Validation Log

## 1. Usability Testing Summary
- **Participants**: 4 Primary School Teachers (Grade 1-5 multi-grade classrooms)
- **Device Tested**: Entry-level Android (2GB RAM, Android 11, Chrome mobile) + Desktop Chrome
- **Network Scenarios Tested**: Normal 4G, Slow 3G (DevTools throttling), Complete Airplane Mode (Offline)
- **Average Assessment Time**: 32 seconds per child (including passage presentation, reading, and 1-tap confirmation)

---

## 2. "You Said, We Did" Teacher Feedback Table

| What Teachers Said | Observed Pain Point | Action Taken in Code / UI |
|---|---|---|
| *"Classroom mein bachhe shor machate hain, AI galat na samajh le"* | High background noise corrupted speech recognition in 15% of tests | Added Confidence Score calculation. When audio is noisy or ratio skewed, app flags "कम विश्वसनीयता" and prompts teacher to confirm/override. |
| *"School ke andar internet aksar chala jata hai"* | Recordings failed or froze during upload | Built IndexedDB offline queue + Service Worker shell cache. App works 100% offline; recordings sync automatically on reconnect. |
| *"20 minute mein har group ko sambhalna mushkil hota hai"* | Complex lesson plans with rare materials were ignored by teachers | Restricted activities to reviewed bank with zero-cost materials (pebbles, matchsticks, chalk). Structured timetable ensures only 1 group with teacher at a time. |
| *"Hindi ke lambe technical terms samajh nahi aate"* | Teachers skipped English buttons and jargon | Full Hindi UI with large touch targets, intuitive emojis (🧒, 🎙️, 📐), and clear Devanagari font rendering (`Noto Sans Devanagari`). |
| *"Bachho ka surname ya roll number galat likhne par privacy ka darr"* | Accidental entry of long government IDs or full names | Implemented strict regex check: only first names or short roll numbers accepted; surnames and ID numbers > 6 digits rejected. |

---

## 3. Low-Connectivity & Hardware Test Log

| Test Case | Scenario / Throttling | Observed Behavior | Fix / Implementation | Result |
|---|---|---|---|---|
| TC-01 | App Shell Load (No Internet) | Browser opened with Wi-Fi disabled | Service Worker (`sw.js`) served cached shell instantly | PASSED (0.4s load) |
| TC-02 | Voice Recording on Airplane Mode | Teacher recorded 20s clip with airplane mode ON | Clip saved to browser IndexedDB (`classmap_offline_db`) with "Pending sync" badge | PASSED |
| TC-03 | Auto-Sync on Internet Restoration | Airplane mode disabled | `window.addEventListener('online')` triggered `flushOfflineQueue()`, submitted clip, removed from local queue | PASSED |
| TC-04 | Slow 3G Network Throttling | RTT 400ms, 400kbps down | Audio upload took 3.2s; tactile loading spinner kept teacher informed | PASSED |
| TC-05 | Duplicate Prevention on Timeout | User tapped assess twice during flaky connection | Client-side idempotency key (`client_request_id`) prevented duplicate assessment creation | PASSED |
