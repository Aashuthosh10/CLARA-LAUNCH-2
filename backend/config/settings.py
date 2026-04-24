"""Configuration management for CLARA."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Base directory (project root containing .env)
BASE_DIR = Path(__file__).resolve().parents[2]

# Load environment variables from project root so PORT etc. are correct when run from any cwd
load_dotenv(BASE_DIR / ".env")

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
# Legacy support (fallback to separate keys if single key not provided)
if not SARVAM_API_KEY:
    SARVAM_API_KEY = os.getenv("SARVAM_ASR_API_KEY", "") or os.getenv("SARVAM_TTS_API_KEY", "")
# Sarvam STT language: "unknown" = auto-detect, or "hi", "en", etc. Empty = do not pass (API default).
_sarvam_language_raw = os.getenv("SARVAM_LANGUAGE_CODE", "unknown").strip().lower()
if "," in _sarvam_language_raw:
    # Some env files mistakenly use comma-separated values; Sarvam expects one code.
    _sarvam_language_raw = next((part.strip() for part in _sarvam_language_raw.split(",") if part.strip()), "unknown")
SARVAM_LANGUAGE_CODE = _sarvam_language_raw or None

# Sarvam TTS voice configuration (Bulbul v3)
_sarvam_speaker = os.getenv("SARVAM_TTS_SPEAKER", "simran").strip().lower()
SARVAM_TTS_SPEAKER = _sarvam_speaker or "simran"
try:
    _sarvam_tts_pace_raw = float(os.getenv("SARVAM_TTS_PACE", "1.25"))
except ValueError:
    _sarvam_tts_pace_raw = 1.25
# Clamp pace to a sensible range (0.5x – 2.0x)
SARVAM_TTS_PACE = max(0.5, min(2.0, _sarvam_tts_pace_raw))

# Auto language detection (text-level after first transcript)
AUTO_LANGUAGE_DETECT_ENABLED = os.getenv("AUTO_LANGUAGE_DETECT_ENABLED", "true").strip().lower() in (
    "1",
    "true",
    "yes",
    "on",
)
AUTO_LANGUAGE_DETECT_CONFIDENCE_THRESHOLD = float(
    os.getenv("AUTO_LANGUAGE_DETECT_CONFIDENCE_THRESHOLD", "0.70")
)

# Hardware Configuration
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
MIC_DEVICE_INDEX = int(os.getenv("MIC_DEVICE_INDEX", "0")) if os.getenv("MIC_DEVICE_INDEX") else None
# Audio input device: by name substring (e.g. "ReSpeaker") or explicit index
AUDIO_INPUT_DEVICE_NAME = os.getenv("AUDIO_INPUT_DEVICE_NAME", "").strip() or None
_audio_idx = os.getenv("AUDIO_INPUT_DEVICE_INDEX", "").strip()
AUDIO_INPUT_DEVICE_INDEX = int(_audio_idx) if _audio_idx.isdigit() else None

# Audio output device (for playback in smoke test / backend playback)
AUDIO_OUTPUT_DEVICE_NAME = os.getenv("AUDIO_OUTPUT_DEVICE_NAME", "").strip() or None
_audio_out_idx = os.getenv("AUDIO_OUTPUT_DEVICE_INDEX", "").strip()  # separate from input
AUDIO_OUTPUT_DEVICE_INDEX = int(_audio_out_idx) if _audio_out_idx.isdigit() else None

# Paths
FACES_DB_PATH = os.getenv("FACES_DB_PATH", str(BASE_DIR / "config" / "faces.dat"))
UI_CONFIG_PATH = os.getenv("UI_CONFIG_PATH", str(BASE_DIR / "config" / "ui_config.json"))
TEMP_DIR = os.getenv("TEMP_DIR", str(BASE_DIR / "temp"))

# RAG Configuration
RAG_MAX_TOKENS = int(os.getenv("RAG_MAX_TOKENS", "6000"))
# Must be a valid Groq chat model id; if API returns 404, set in .env (see https://console.groq.com/docs/models)
RAG_MODEL = os.getenv("RAG_MODEL", "llama-3.1-8b-instant")
COLLEGE_KNOWLEDGE_PATH = os.getenv("COLLEGE_KNOWLEDGE_PATH", str(BASE_DIR / "college_knowledge.txt"))
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "4"))
# Low-latency Groq model for mixed-language query normalization (Hinglish / regional + English).
# Use a currently supported model id; override via .env when needed.
MULTILINGUAL_PREPROCESSOR_MODEL = os.getenv("MULTILINGUAL_PREPROCESSOR_MODEL", "llama-3.1-8b-instant")
MULTILINGUAL_PREPROCESSOR_MAX_TOKENS = int(os.getenv("MULTILINGUAL_PREPROCESSOR_MAX_TOKENS", "320"))
MULTILINGUAL_PREPROCESSOR_TIMEOUT_S = float(os.getenv("MULTILINGUAL_PREPROCESSOR_TIMEOUT_S", "2.8"))

# PostgreSQL + pgvector (RAG storage)
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "127.0.0.1")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "clara_db")
POSTGRES_USER = os.getenv("POSTGRES_USER", "clara_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

# State Machine Configuration
INACTIVITY_TIMEOUT = float(os.getenv("INACTIVITY_TIMEOUT", "20.0"))

# Audio Configuration
AUDIO_SAMPLE_RATE = int(os.getenv("AUDIO_SAMPLE_RATE", "16000"))
AUDIO_CHANNELS = int(os.getenv("AUDIO_CHANNELS", "1"))
AUDIO_VAD_FRAME_MS = int(os.getenv("AUDIO_VAD_FRAME_MS", "20"))  # 10, 20, or 30 for webrtcvad
AUDIO_SILENCE_STOP_MS = int(os.getenv("AUDIO_SILENCE_STOP_MS", "600"))  # stop after this much silence
AUDIO_SPEECH_TIMEOUT_MS = int(os.getenv("AUDIO_SPEECH_TIMEOUT_MS", "10000"))  # max wait for speech to start
AUDIO_VAD_AGGRESSIVENESS = int(os.getenv("AUDIO_VAD_AGGRESSIVENESS", "2"))  # 0–3 for webrtcvad
AUDIO_PREROLL_BUFFER_MS = int(os.getenv("AUDIO_PREROLL_BUFFER_MS", "300"))  # ms of audio before speech start
AUDIO_MAX_UTTERANCE_MS = int(os.getenv("AUDIO_MAX_UTTERANCE_MS", "7000"))  # hard cap utterance length in VAD mode
# Record mode: "fixed" = record N seconds (proves capture on PC mic); "vad" = VAD start/stop
AUDIO_RECORD_MODE = (os.getenv("AUDIO_RECORD_MODE", "fixed").strip().lower() or "fixed")
if AUDIO_RECORD_MODE not in ("fixed", "vad"):
    AUDIO_RECORD_MODE = "fixed"
AUDIO_FIXED_RECORD_SECONDS = float(os.getenv("AUDIO_FIXED_RECORD_SECONDS", "4.0"))
AUDIO_SILENT_RMS_THRESHOLD = float(os.getenv("AUDIO_SILENT_RMS_THRESHOLD", "0.001"))
STT_MIN_CONFIDENCE = float(os.getenv("STT_MIN_CONFIDENCE", "0.60"))
STT_MIN_TRANSCRIPT_CHARS = int(os.getenv("STT_MIN_TRANSCRIPT_CHARS", "6"))
STT_MIN_TRANSCRIPT_TOKENS = int(os.getenv("STT_MIN_TRANSCRIPT_TOKENS", "2"))
STT_MAX_QUALITY_RETRIES = int(os.getenv("STT_MAX_QUALITY_RETRIES", "1"))

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "6969"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5176")
KIOSK_TIMEZONE = os.getenv("KIOSK_TIMEZONE", "Asia/Kolkata").strip() or "Asia/Kolkata"
ENVIRONMENT = os.getenv("ENVIRONMENT", "dev").strip().lower() or "dev"
PROD_MODE = ENVIRONMENT in {"prod", "production"}

# Performance/latency tuning
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "100"))
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.1"))
LLM_STREAM_PARTIAL_DEBOUNCE_MS = int(os.getenv("LLM_STREAM_PARTIAL_DEBOUNCE_MS", "80"))
LLM_STREAM_TIMEOUT_S = float(os.getenv("LLM_STREAM_TIMEOUT_S", "12.0"))
ENABLE_LLM_STREAMING = os.getenv("ENABLE_LLM_STREAMING", "true").strip().lower() in ("1", "true", "yes", "on")
PERF_DEBUG_TIMINGS = os.getenv("PERF_DEBUG_TIMINGS", "true").strip().lower() in ("1", "true", "yes", "on")
RAG_CONTEXT_TIMEOUT_S = float(os.getenv("RAG_CONTEXT_TIMEOUT_S", "1.0"))
ENABLE_FIRST_SENTENCE_TTS = os.getenv("ENABLE_FIRST_SENTENCE_TTS", "true").strip().lower() in (
    "1",
    "true",
    "yes",
    "on",
)
ENABLE_TTS_PIPELINING = os.getenv("ENABLE_TTS_PIPELINING", "true").strip().lower() in ("1", "true", "yes", "on")
# When enabled, never speak overlapping text spans in a single assistant turn.
ENABLE_ONCE_ONLY_TTS_SEGMENTS = os.getenv("ENABLE_ONCE_ONLY_TTS_SEGMENTS", "true").strip().lower() in (
    "1",
    "true",
    "yes",
    "on",
)
ENABLE_ACK_EARCON = os.getenv("ENABLE_ACK_EARCON", "true").strip().lower() in ("1", "true", "yes", "on")
ENABLE_EARLY_PARTIAL_TEXT = os.getenv("ENABLE_EARLY_PARTIAL_TEXT", "true").strip().lower() in ("1", "true", "yes", "on")
MAX_WS_MESSAGE_BYTES = int(os.getenv("MAX_WS_MESSAGE_BYTES", "32768"))
WS_RATE_LIMIT_WINDOW_S = float(os.getenv("WS_RATE_LIMIT_WINDOW_S", "5.0"))
WS_RATE_LIMIT_MAX_MESSAGES = int(os.getenv("WS_RATE_LIMIT_MAX_MESSAGES", "30"))
WS_AUTH_TOKEN = os.getenv("WS_AUTH_TOKEN", "").strip()
WS_ALLOWED_ORIGINS = tuple(
    part.strip()
    for part in os.getenv(
        "WS_ALLOWED_ORIGINS",
        "http://localhost:5176,http://127.0.0.1:5176,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if part.strip()
)
REQUIRE_WS_AUTH_IN_PROD = os.getenv("REQUIRE_WS_AUTH_IN_PROD", "true").strip().lower() in ("1", "true", "yes", "on")
SECURITY_HEADERS_ENABLED = os.getenv("SECURITY_HEADERS_ENABLED", "true").strip().lower() in ("1", "true", "yes", "on")
RAG_CONFIDENCE_THRESHOLD = float(os.getenv("RAG_CONFIDENCE_THRESHOLD", "0.22"))

# Shared HTTP client configuration
HTTP_TIMEOUT_CONNECT_S = float(os.getenv("HTTP_TIMEOUT_CONNECT_S", "2.0"))
HTTP_TIMEOUT_READ_S = float(os.getenv("HTTP_TIMEOUT_READ_S", "15.0"))
HTTP_TIMEOUT_WRITE_S = float(os.getenv("HTTP_TIMEOUT_WRITE_S", "15.0"))
HTTP_TIMEOUT_POOL_S = float(os.getenv("HTTP_TIMEOUT_POOL_S", "2.0"))
HTTP_MAX_KEEPALIVE_CONNECTIONS = int(os.getenv("HTTP_MAX_KEEPALIVE_CONNECTIONS", "20"))
HTTP_MAX_CONNECTIONS = int(os.getenv("HTTP_MAX_CONNECTIONS", "50"))
HTTP_KEEPALIVE_EXPIRY_S = float(os.getenv("HTTP_KEEPALIVE_EXPIRY_S", "30.0"))
HTTP_RETRY_ATTEMPTS = int(os.getenv("HTTP_RETRY_ATTEMPTS", "1"))

# Language Code Mappings (for TTS target_language_code)
TARGET_LANGUAGE_CODES = {
    "en": "en-IN",
    "hi": "hi-IN",
    "kn": "kn-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "ml": "ml-IN",
}

# Optional per-language TTS voice/pace overrides (fallback to global defaults when empty).
SARVAM_TTS_SPEAKER_BY_LANG = {
    "en-IN": os.getenv("SARVAM_TTS_SPEAKER_EN_IN", "").strip().lower(),
    "hi-IN": os.getenv("SARVAM_TTS_SPEAKER_HI_IN", "").strip().lower(),
    "kn-IN": os.getenv("SARVAM_TTS_SPEAKER_KN_IN", "").strip().lower(),
    "ta-IN": os.getenv("SARVAM_TTS_SPEAKER_TA_IN", "").strip().lower(),
    "te-IN": os.getenv("SARVAM_TTS_SPEAKER_TE_IN", "").strip().lower(),
    "ml-IN": os.getenv("SARVAM_TTS_SPEAKER_ML_IN", "").strip().lower(),
}

def _pace_from_env(name: str) -> float | None:
    raw = os.getenv(name, "").strip()
    if not raw:
        return None
    try:
        return max(0.5, min(2.0, float(raw)))
    except ValueError:
        return None

SARVAM_TTS_PACE_BY_LANG = {
    "en-IN": _pace_from_env("SARVAM_TTS_PACE_EN_IN"),
    "hi-IN": _pace_from_env("SARVAM_TTS_PACE_HI_IN"),
    "kn-IN": _pace_from_env("SARVAM_TTS_PACE_KN_IN"),
    "ta-IN": _pace_from_env("SARVAM_TTS_PACE_TA_IN"),
    "te-IN": _pace_from_env("SARVAM_TTS_PACE_TE_IN"),
    "ml-IN": _pace_from_env("SARVAM_TTS_PACE_ML_IN"),
}

# Frontend language display name -> config key (for TARGET_LANGUAGE_CODES)
LANGUAGE_NAME_TO_CODE_KEY = {
    "English": "en",
    "Kannada": "kn",
    "Hindi": "hi",
    "Tamil": "ta",
    "Telugu": "te",
    "Malayalam": "ml",
}
