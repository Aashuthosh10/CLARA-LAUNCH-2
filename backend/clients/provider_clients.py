"""Shared network clients and low-latency service wrappers."""

from __future__ import annotations

import asyncio
import base64
import io
import logging
import time
from typing import Any

import httpx

from backend.config.settings import (
    GROQ_API_KEY,
    HTTP_KEEPALIVE_EXPIRY_S,
    HTTP_MAX_CONNECTIONS,
    HTTP_MAX_KEEPALIVE_CONNECTIONS,
    HTTP_RETRY_ATTEMPTS,
    HTTP_TIMEOUT_CONNECT_S,
    HTTP_TIMEOUT_POOL_S,
    HTTP_TIMEOUT_READ_S,
    HTTP_TIMEOUT_WRITE_S,
    SARVAM_API_KEY,
    SARVAM_LANGUAGE_CODE,
    SARVAM_TTS_PACE_BY_LANG,
    SARVAM_TTS_PACE,
    SARVAM_TTS_SPEAKER_BY_LANG,
    SARVAM_TTS_SPEAKER,
)

logger = logging.getLogger(__name__)

_SARVAM_ASR_MODEL = "saaras:v3"
_SARVAM_TTS_MODEL = "bulbul:v3"
_SARVAM_BASE = "https://api.sarvam.ai"

_http_client: httpx.AsyncClient | None = None
_groq_client: Any = None
_lock = asyncio.Lock()
_provider_open_until: dict[str, float] = {}


def _http_timeout() -> httpx.Timeout:
    return httpx.Timeout(
        connect=HTTP_TIMEOUT_CONNECT_S,
        read=HTTP_TIMEOUT_READ_S,
        write=HTTP_TIMEOUT_WRITE_S,
        pool=HTTP_TIMEOUT_POOL_S,
    )


def _http_limits() -> httpx.Limits:
    return httpx.Limits(
        max_connections=HTTP_MAX_CONNECTIONS,
        max_keepalive_connections=HTTP_MAX_KEEPALIVE_CONNECTIONS,
        keepalive_expiry=HTTP_KEEPALIVE_EXPIRY_S,
    )


async def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is not None:
        return _http_client
    async with _lock:
        if _http_client is None:
            # Prefer HTTP/2 for lower latency; gracefully fall back if h2 extra isn't installed.
            try:
                _http_client = httpx.AsyncClient(timeout=_http_timeout(), limits=_http_limits(), http2=True)
            except ImportError:
                logger.warning("httpx HTTP/2 extras not installed; falling back to HTTP/1.1 client")
                _http_client = httpx.AsyncClient(timeout=_http_timeout(), limits=_http_limits(), http2=False)
    return _http_client


async def get_groq_client() -> Any | None:
    global _groq_client
    if not GROQ_API_KEY:
        return None
    if _groq_client is not None:
        return _groq_client
    async with _lock:
        if _groq_client is None:
            try:
                from groq import AsyncGroq

                _groq_client = AsyncGroq(api_key=GROQ_API_KEY)
            except Exception as exc:  # pragma: no cover - import failure path
                logger.exception("Failed to init AsyncGroq client: %s", exc)
                _groq_client = None
    return _groq_client


def _parse_sarvam_audio(response_json: dict[str, Any]) -> str | None:
    if "audio" in response_json and isinstance(response_json["audio"], str):
        return response_json["audio"]
    audios = response_json.get("audios")
    if isinstance(audios, list) and audios:
        if all(isinstance(x, str) for x in audios):
            if len(audios) == 1:
                return audios[0]
            # best-effort concatenate decoded wav chunks
            combined = b""
            for idx, chunk in enumerate(audios):
                data = base64.b64decode(chunk)
                if idx == 0:
                    combined = data
                else:
                    data_pos = data.find(b"data")
                    if data_pos != -1:
                        combined += data[data_pos + 8 :]
            if combined:
                return base64.b64encode(combined).decode("utf-8")
    return None


async def sarvam_tts_to_base64(text: str, target_language_code: str) -> str | None:
    if not SARVAM_API_KEY or not text.strip():
        return None

    client = await get_http_client()
    headers = {"api-subscription-key": SARVAM_API_KEY, "Authorization": f"Bearer {SARVAM_API_KEY}"}
    speaker = SARVAM_TTS_SPEAKER_BY_LANG.get(target_language_code) or SARVAM_TTS_SPEAKER
    pace = SARVAM_TTS_PACE_BY_LANG.get(target_language_code)
    if pace is None:
        pace = SARVAM_TTS_PACE
    payload = {
        "text": text,
        "model": _SARVAM_TTS_MODEL,
        "target_language_code": target_language_code,
        "speaker": speaker,
        "pace": pace,
    }

    endpoint_candidates = (
        f"{_SARVAM_BASE}/text-to-speech",
        f"{_SARVAM_BASE}/speech/text-to-speech",
    )

    if _provider_open_until.get("sarvam_tts", 0.0) > time.time():
        return None
    for endpoint in endpoint_candidates:
        for attempt in range(max(1, HTTP_RETRY_ATTEMPTS + 1)):
            try:
                resp = await client.post(endpoint, json=payload, headers=headers)
                if resp.status_code >= 500:
                    await asyncio.sleep(min(0.6, 0.15 * (2**attempt)))
                    continue
                if resp.is_success:
                    body = resp.json()
                    audio = _parse_sarvam_audio(body if isinstance(body, dict) else {})
                    if audio:
                        return audio
            except Exception:
                await asyncio.sleep(min(0.6, 0.15 * (2**attempt)))
                continue
    _provider_open_until["sarvam_tts"] = time.time() + 6.0

    # SDK fallback for compatibility with existing deployments.
    try:
        from sarvamai import SarvamAI

        def _sync_call() -> str | None:
            sdk = SarvamAI(api_subscription_key=SARVAM_API_KEY)
            result = sdk.text_to_speech.convert(
                text=text,
                model=_SARVAM_TTS_MODEL,
                target_language_code=target_language_code,
                speaker=speaker,
                pace=pace,
            )
            audios = getattr(result, "audios", None)
            if not audios:
                return None
            if len(audios) == 1:
                return audios[0]
            combined = b""
            for idx, chunk in enumerate(audios):
                data = base64.b64decode(chunk)
                if idx == 0:
                    combined = data
                else:
                    data_pos = data.find(b"data")
                    if data_pos != -1:
                        combined += data[data_pos + 8 :]
            return base64.b64encode(combined).decode("utf-8") if combined else None

        return await asyncio.to_thread(_sync_call)
    except Exception as exc:
        logger.exception("Sarvam TTS failed: %s", exc)
        return None


async def sarvam_stt_from_wav(
    wav_bytes: bytes,
    *,
    language_code_override: str | None = None,
    phrase_hints: list[str] | None = None,
) -> tuple[str | None, dict[str, Any]]:
    if not SARVAM_API_KEY or not wav_bytes:
        return None, {}

    client = await get_http_client()
    headers = {"api-subscription-key": SARVAM_API_KEY, "Authorization": f"Bearer {SARVAM_API_KEY}"}
    data: dict[str, str] = {"model": _SARVAM_ASR_MODEL, "mode": "transcribe"}
    requested_lang = (language_code_override or SARVAM_LANGUAGE_CODE or "").strip().lower()
    if requested_lang and requested_lang != "unknown":
        data["language_code"] = requested_lang
    if phrase_hints:
        # Best-effort bias payload; ignored by APIs that don't support it.
        data["vocabulary"] = ",".join([h.strip() for h in phrase_hints if h and h.strip()][:64])

    endpoint_candidates = (
        f"{_SARVAM_BASE}/speech-to-text",
        f"{_SARVAM_BASE}/speech/speech-to-text",
    )

    if _provider_open_until.get("sarvam_stt", 0.0) > time.time():
        return None, {}
    for endpoint in endpoint_candidates:
        for attempt in range(max(1, HTTP_RETRY_ATTEMPTS + 1)):
            try:
                files = {"file": ("audio.wav", wav_bytes, "audio/wav")}
                resp = await client.post(endpoint, data=data, files=files, headers=headers)
                if resp.status_code >= 500:
                    await asyncio.sleep(min(0.6, 0.15 * (2**attempt)))
                    continue
                if resp.is_success:
                    body = resp.json()
                    if isinstance(body, dict):
                        text = (body.get("text") or body.get("transcript") or "").strip()
                        meta = {
                            k: body.get(k)
                            for k in (
                                "language_code",
                                "detected_language",
                                "language",
                                "locale",
                                "confidence",
                                "language_confidence",
                                "detected_language_confidence",
                            )
                            if body.get(k) is not None
                        }
                        return (text or None), meta
            except Exception:
                await asyncio.sleep(min(0.6, 0.15 * (2**attempt)))
                continue
    _provider_open_until["sarvam_stt"] = time.time() + 6.0

    # SDK fallback
    try:
        from sarvamai import SarvamAI

        def _sync_call() -> tuple[str | None, dict[str, Any]]:
            sdk = SarvamAI(api_subscription_key=SARVAM_API_KEY)
            kwargs: dict[str, Any] = {
                "file": io.BytesIO(wav_bytes),
                "model": _SARVAM_ASR_MODEL,
                "mode": "transcribe",
            }
            if requested_lang and requested_lang != "unknown":
                kwargs["language_code"] = requested_lang
            result = sdk.speech_to_text.transcribe(**kwargs)
            text = None
            if hasattr(result, "text"):
                text = result.text
            elif isinstance(result, str):
                text = result
            elif isinstance(result, dict):
                text = result.get("text") or result.get("transcript")
            meta: dict[str, Any] = {}
            for key in (
                "language_code",
                "detected_language",
                "language",
                "locale",
                "confidence",
                "language_confidence",
                "detected_language_confidence",
            ):
                val = result.get(key) if isinstance(result, dict) else getattr(result, key, None)
                if val is not None:
                    meta[key] = val
            return (text or "").strip() or None, meta

        return await asyncio.to_thread(_sync_call)
    except Exception as exc:
        logger.exception("Sarvam STT failed: %s", exc)
        return None, {}


async def warmup_clients() -> None:
    # Non-blocking best-effort warmups, bounded by short timeouts.
    try:
        await get_http_client()
    except Exception:
        pass

    async def _warmup_groq() -> None:
        try:
            groq_client = await get_groq_client()
            if not groq_client:
                return
            await asyncio.wait_for(
                groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": "hi"}],
                    max_tokens=1,
                    temperature=0,
                ),
                timeout=2.0,
            )
            logger.info("Warmup: Groq OK")
        except Exception:
            logger.info("Warmup: Groq skipped or timed out")

    async def _warmup_tts() -> None:
        try:
            await asyncio.wait_for(sarvam_tts_to_base64("hi", "en-IN"), timeout=2.0)
            logger.info("Warmup: Sarvam TTS OK")
        except Exception:
            logger.info("Warmup: Sarvam TTS skipped or timed out")

    await asyncio.gather(_warmup_groq(), _warmup_tts(), return_exceptions=True)


async def close_clients() -> None:
    global _http_client
    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None
