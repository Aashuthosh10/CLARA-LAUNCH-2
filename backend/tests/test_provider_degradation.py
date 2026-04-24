from __future__ import annotations

import asyncio
import time

from backend.clients import provider_clients as pc


class _Resp:
    def __init__(self, status_code: int, payload: dict | None = None) -> None:
        self.status_code = status_code
        self._payload = payload or {}
        self.is_success = 200 <= status_code < 300

    def json(self):
        return self._payload


class _Client500:
    async def post(self, *args, **kwargs):  # noqa: ANN002, ANN003
        return _Resp(500, {})


def test_sarvam_tts_enters_fast_fail_window(monkeypatch) -> None:
    async def _fake_http_client():
        return _Client500()

    monkeypatch.setattr(pc, "SARVAM_API_KEY", "fake")
    monkeypatch.setattr(pc, "HTTP_RETRY_ATTEMPTS", 1)
    monkeypatch.setattr(pc, "get_http_client", _fake_http_client)
    pc._provider_open_until.clear()

    out = asyncio.run(pc.sarvam_tts_to_base64("hello", "en-IN"))
    assert out is None
    assert pc._provider_open_until.get("sarvam_tts", 0.0) > time.time()


def test_sarvam_stt_enters_fast_fail_window(monkeypatch) -> None:
    async def _fake_http_client():
        return _Client500()

    monkeypatch.setattr(pc, "SARVAM_API_KEY", "fake")
    monkeypatch.setattr(pc, "HTTP_RETRY_ATTEMPTS", 1)
    monkeypatch.setattr(pc, "get_http_client", _fake_http_client)
    pc._provider_open_until.clear()

    text, meta = asyncio.run(pc.sarvam_stt_from_wav(b"wav-bytes"))
    assert text is None
    assert meta == {}
    assert pc._provider_open_until.get("sarvam_stt", 0.0) > time.time()
