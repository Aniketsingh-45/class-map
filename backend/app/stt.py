"""Speech-to-text switch. STT_PROVIDER=sarvam uses the real API; 'mock' simulates a transcript (for development only)."""
from . import config

def transcribe(audio: bytes, filename: str, passage_text: str) -> str:
    if config.stt_provider() == "sarvam":
        from .ai_sarvam import transcribe_hi
        return transcribe_hi(audio, filename=filename)
    # MOCK: pretend the child skipped every 6th word. NOT real speech recognition.
    words = passage_text.replace("\u0964", " ").split()
    return " ".join(w for i, w in enumerate(words, 1) if i % 6 != 0)
