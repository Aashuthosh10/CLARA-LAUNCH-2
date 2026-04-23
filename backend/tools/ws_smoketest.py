"""Smoke test for CLARA HTTP health and WebSocket reply flow."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from typing import Any
from urllib.parse import urlparse

import httpx
import websockets
from fastapi.testclient import TestClient


def _health_url(ws_url: str) -> str:
    parsed = urlparse(ws_url)
    scheme = "https" if parsed.scheme == "wss" else "http"
    return f"{scheme}://{parsed.netloc}/health"


async def _wait_for_final_reply(ws: websockets.WebSocketClientProtocol, timeout_s: float) -> dict[str, Any]:
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout=timeout_s)
        event = json.loads(raw)
        if not isinstance(event, dict):
            continue
        payload = event.get("payload")
        if not isinstance(payload, dict):
            continue
        if payload.get("error"):
            raise RuntimeError(f"backend returned error: {payload.get('error')}")
        if payload.get("isProcessing") is False:
            messages = payload.get("messages")
            if not isinstance(messages, list) or not messages:
                raise RuntimeError("final payload did not include messages")
            if not any(isinstance(message, dict) and message.get("role") == "clara" for message in messages):
                raise RuntimeError("final payload did not include a CLARA reply")
            return payload


async def run_smoke(url: str, timeout_s: float) -> int:
    health_url = _health_url(url)
    async with httpx.AsyncClient(timeout=timeout_s) as client:
        response = await client.get(health_url)
        response.raise_for_status()
        health = response.json()
        if not isinstance(health, dict) or health.get("status") not in {"healthy", "degraded"}:
            raise RuntimeError(f"unexpected health response: {health!r}")

    async with websockets.connect(url, ping_interval=20, ping_timeout=20, max_size=2**23) as ws:
        initial = json.loads(await asyncio.wait_for(ws.recv(), timeout=timeout_s))
        if initial.get("state") != 0:
            raise RuntimeError(f"expected initial state 0, got {initial!r}")
        await ws.send(json.dumps({"action": "user_message", "text": "what is the weather today?"}))
        payload = await _wait_for_final_reply(ws, timeout_s)

    print(
        json.dumps(
            {
                "health_status": health.get("status"),
                "db_connected": bool(health.get("db_connected")),
                "rag_ready": bool(health.get("rag_ready")),
                "reply_messages": len(payload.get("messages") or []),
                "showCard": payload.get("showCard"),
            },
            sort_keys=True,
        )
    )
    return 0


def run_in_process_smoke() -> int:
    from backend.app import main as app_main

    async def fake_normalize_and_classify_query(text: str, language_name: str) -> dict[str, Any]:
        return {"english_translation": text}

    async def fake_tts_to_base64_cached(*args: Any, **kwargs: Any) -> tuple[None, bool]:
        return None, False

    app_main.ENABLE_ACK_EARCON = False
    app_main.normalize_and_classify_query = fake_normalize_and_classify_query
    app_main.resolve_intent_from_features = lambda features: app_main.INTENT_OFF_TOPIC
    app_main.tts_to_base64_cached = fake_tts_to_base64_cached
    app_main.warmup_rag = lambda: False

    with TestClient(app_main.app) as client:
        health = client.get("/health").json()
        if health.get("status") not in {"healthy", "degraded"}:
            raise RuntimeError(f"unexpected health response: {health!r}")

        with client.websocket_connect("/ws/clara") as ws:
            initial = ws.receive_json()
            if initial.get("state") != 0:
                raise RuntimeError(f"expected initial state 0, got {initial!r}")
            ws.send_json({"action": "user_message", "text": "what is the weather today?"})
            while True:
                event = ws.receive_json()
                payload = event.get("payload") if isinstance(event, dict) else None
                if not isinstance(payload, dict):
                    continue
                if payload.get("error"):
                    raise RuntimeError(f"backend returned error: {payload.get('error')}")
                if payload.get("isProcessing") is False:
                    messages = payload.get("messages")
                    if not isinstance(messages, list) or not any(
                        isinstance(message, dict) and message.get("role") == "clara" for message in messages
                    ):
                        raise RuntimeError("final payload did not include a CLARA reply")
                    print(
                        json.dumps(
                            {
                                "health_status": health.get("status"),
                                "db_connected": bool(health.get("db_connected")),
                                "rag_ready": bool(health.get("rag_ready")),
                                "reply_messages": len(messages),
                                "showCard": payload.get("showCard"),
                            },
                            sort_keys=True,
                        )
                    )
                    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=None, help="Optional live WebSocket URL. Defaults to in-process app smoke.")
    parser.add_argument("--timeout", type=float, default=20.0)
    args = parser.parse_args()
    try:
        if args.url:
            return asyncio.run(run_smoke(args.url, args.timeout))
        return run_in_process_smoke()
    except Exception as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
