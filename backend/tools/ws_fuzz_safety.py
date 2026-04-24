"""WebSocket safety checks: invalid JSON, unknown action, oversized payload, and liveness."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from typing import Any

import websockets


async def _recv_json(ws: websockets.WebSocketClientProtocol, timeout: float) -> dict[str, Any]:
    raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
    event = json.loads(raw)
    if not isinstance(event, dict):
        raise RuntimeError(f"expected json object event, got: {event!r}")
    return event


async def _assert_error(ws: websockets.WebSocketClientProtocol, timeout: float, code_hint: str) -> None:
    event = await _recv_json(ws, timeout)
    payload = event.get("payload")
    if not isinstance(payload, dict):
        raise RuntimeError(f"{code_hint}: expected payload object, got {payload!r}")
    error_code = payload.get("code") or payload.get("error_code") or payload.get("error")
    if not error_code:
        raise RuntimeError(f"{code_hint}: missing structured error field in {payload!r}")


async def run_fuzz(url: str, timeout: float, oversized_bytes: int) -> int:
    async with websockets.connect(url, ping_interval=20, ping_timeout=20, max_size=2**23) as ws:
        initial = await _recv_json(ws, timeout)
        if initial.get("state") != 0:
            raise RuntimeError(f"expected initial state 0, got {initial!r}")

        # invalid JSON
        await ws.send("{ invalid_json")
        await _assert_error(ws, timeout, "INVALID_JSON")

        # unknown action
        await ws.send(json.dumps({"action": "unknown_action"}))
        await _assert_error(ws, timeout, "UNKNOWN_ACTION")

        # oversized payload
        large = "x" * oversized_bytes
        await ws.send(json.dumps({"action": "user_message", "text": large}))
        await _assert_error(ws, timeout, "PAYLOAD_TOO_LARGE")

        # still alive after errors
        await ws.send(json.dumps({"action": "wake"}))
        alive = await _recv_json(ws, timeout)
        if alive.get("state") != 3:
            raise RuntimeError(f"connection not alive after fuzz checks: {alive!r}")

    print(json.dumps({"fuzz": "pass", "checked": ["invalid_json", "unknown_action", "oversized_payload", "liveness"]}))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="ws://127.0.0.1:6969/ws/clara")
    parser.add_argument("--timeout", type=float, default=15.0)
    parser.add_argument("--oversized-bytes", type=int, default=70000)
    args = parser.parse_args()
    try:
        return asyncio.run(run_fuzz(args.url, args.timeout, args.oversized_bytes))
    except Exception as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
