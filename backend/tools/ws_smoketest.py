"""Smoke test for CLARA HTTP health and WebSocket flow."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from typing import Any
from urllib.parse import urlparse

import httpx
import websockets


def _health_url(ws_url: str) -> str:
    parsed = urlparse(ws_url)
    scheme = "https" if parsed.scheme == "wss" else "http"
    return f"{scheme}://{parsed.netloc}/health"


async def _wait_for_state(
    ws: websockets.WebSocketClientProtocol, expected_state: int, timeout_s: float
) -> dict[str, Any]:
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout=timeout_s)
        event = json.loads(raw)
        if isinstance(event, dict) and event.get("state") == expected_state:
            return event


async def _wait_for_terminal_payload(ws: websockets.WebSocketClientProtocol, timeout_s: float) -> dict[str, Any]:
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout=timeout_s)
        event = json.loads(raw)
        if not isinstance(event, dict):
            continue
        payload = event.get("payload")
        if not isinstance(payload, dict):
            continue
        if payload.get("status") in {"done", "error"} or payload.get("isProcessing") is False:
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
        await ws.send(json.dumps({"action": "wake"}))
        await _wait_for_state(ws, 3, timeout_s)
        await ws.send(json.dumps({"action": "language_selected", "language": "English"}))
        await _wait_for_state(ws, 5, timeout_s)
        await ws.send(json.dumps({"action": "conversation_started"}))
        await _wait_for_state(ws, 5, timeout_s)
        await ws.send(json.dumps({"action": "user_message", "text": "hello"}))
        payload = await _wait_for_terminal_payload(ws, timeout_s)
        if payload.get("status") not in {"done", "error"}:
            raise RuntimeError(f"terminal payload missing status contract: {payload!r}")

    print(
        json.dumps(
            {
                "health_status": health.get("status"),
                "db_connected": bool(health.get("db_connected")),
                "rag_ready": bool(health.get("rag_ready")),
                "terminal_status": payload.get("status"),
                "reply_messages": len(payload.get("messages") or []),
            },
            sort_keys=True,
        )
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="ws://127.0.0.1:6969/ws/clara", help="Live WebSocket URL.")
    parser.add_argument("--timeout", type=float, default=20.0)
    args = parser.parse_args()
    try:
        return asyncio.run(run_smoke(args.url, args.timeout))
    except Exception as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
