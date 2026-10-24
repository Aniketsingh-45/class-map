import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def env(name: str, default: str = "") -> str:
    v = os.getenv(name)
    return v if v is not None else default

def db_path() -> str:
    p = env("DB_PATH")
    return p if p else str(ROOT / "classmap.db")
def secret() -> str:         return env("SECRET_KEY", "dev-secret-change-me")
def stt_provider() -> str:   return env("STT_PROVIDER", "mock")      # mock | sarvam
def use_claude() -> bool:    return env("USE_CLAUDE", "0") == "1"
def max_audio_bytes() -> int: return int(env("MAX_AUDIO_BYTES", "2000000"))
def max_photo_bytes() -> int: return int(env("MAX_PHOTO_BYTES", "5000000"))
def cors_origins() -> list[str]: return [o.strip() for o in env("CORS_ORIGINS", "*").split(",")]
def data_dir() -> Path:      return ROOT / "data"
def upload_dir() -> Path:
    d = ROOT / "data" / "uploads"
    d.mkdir(parents=True, exist_ok=True)
    return d
def static_dir() -> Path:    return ROOT / "frontend"
