"""Sarvam speech-to-text. Needs SARVAM_API_KEY in .env."""
import mimetypes, os, requests

MIME_MAP = {
    ".mp4": "audio/mp4",
    ".m4a": "audio/x-m4a",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".webm": "audio/webm",
    ".aac": "audio/aac",
    ".ogg": "audio/ogg",
    ".opus": "audio/opus",
    ".flac": "audio/flac",
}

def _get_content_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext in MIME_MAP:
        return MIME_MAP[ext]
    guessed, _ = mimetypes.guess_type(filename)
    if guessed:
        if guessed == "video/mp4":
            return "audio/mp4"
        return guessed
    return "application/octet-stream"

def transcribe_hi(audio_bytes: bytes, filename: str = "clip.webm", mode: str = "verbatim") -> str:
    api_key = os.environ.get("SARVAM_API_KEY")
    if not api_key:
        raise KeyError(
            "SARVAM_API_KEY environment variable is missing. "
            "Ensure a .env file exists in the project root with SARVAM_API_KEY set."
        )

    content_type = _get_content_type(filename)
    r = requests.post(
        "https://api.sarvam.ai/speech-to-text",
        headers={"api-subscription-key": api_key.strip()},
        files={"file": (filename, audio_bytes, content_type)},
        data={"model": "saaras:v3", "language_code": "hi-IN", "mode": mode},
        timeout=60,
    )
    if not r.ok:
        try:
            err = r.json()
            msg = err.get("error", {}).get("message", r.text)
        except Exception:
            msg = r.text
        raise RuntimeError(f"Sarvam API error ({r.status_code}): {msg}")

    return r.json()["transcript"]

