"""Session-level language state helpers for CLARA."""

from __future__ import annotations

from typing import Any

from backend.config.settings import TARGET_LANGUAGE_CODES
from backend.core.language_detection import LANGUAGE_KEY_TO_NAME, SUPPORTED_LANGUAGE_KEYS


def set_session_language(
    session: dict[str, Any],
    language_code_key: str,
    *,
    is_auto: bool,
    confidence: float | None = None,
    method: str | None = None,
    sample: str | None = None,
) -> None:
    code_key = language_code_key if language_code_key in SUPPORTED_LANGUAGE_KEYS else "en"
    language_name = LANGUAGE_KEY_TO_NAME.get(code_key, "English")

    session["language_code_key"] = code_key
    session["language_name"] = language_name
    session["is_language_auto"] = bool(is_auto)
    session["language_locked"] = not bool(is_auto)

    # Backward-compatible fields used by existing code paths.
    session["language"] = language_name
    session["language_code"] = TARGET_LANGUAGE_CODES.get(code_key, TARGET_LANGUAGE_CODES["en"])

    if is_auto:
        session["language_detection"] = {
            "method": method or "unknown",
            "confidence": float(confidence or 0.0),
            "sample": (sample or "")[:200],
        }


def resolve_session_language(session: dict[str, Any]) -> tuple[str, str, str]:
    code_key = session.get("language_code_key") or "en"
    if code_key not in SUPPORTED_LANGUAGE_KEYS:
        code_key = "en"
    language_name = session.get("language_name") or LANGUAGE_KEY_TO_NAME.get(code_key, "English")
    tts_code = TARGET_LANGUAGE_CODES.get(code_key, TARGET_LANGUAGE_CODES["en"])
    return code_key, language_name, tts_code


def should_run_auto_detect(session: dict[str, Any]) -> bool:
    if session.get("language_locked"):
        return False
    if session.get("is_language_auto") is False:
        return False
    return not bool(session.get("language_code_key"))


def can_override_language_with_auto_detect(
    session: dict[str, Any],
    *,
    candidate_key: str,
    confidence: float,
    threshold: float,
    collapse_margin: float = 0.20,
) -> bool:
    """Allow override only when language was auto-selected and confidence collapsed."""
    if session.get("language_locked"):
        return False
    current = session.get("language_code_key")
    if not current:
        return True
    if current == candidate_key:
        return False
    detection = session.get("language_detection") or {}
    prev_conf = float(detection.get("confidence") or 0.0)
    # Collapse rule: previous auto-detect was weak and current candidate is clearly stronger.
    return prev_conf < max(0.0, threshold - collapse_margin) and confidence >= min(1.0, threshold + 0.10)
