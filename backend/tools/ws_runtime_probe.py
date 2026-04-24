"""Runtime probe for success, failure, and cancellation websocket scenarios."""

from __future__ import annotations

import argparse
import asyncio
import json
from typing import Any

import websockets


async def _recv_json(ws: websockets.WebSocketClientProtocol, timeout: float = 20.0) -> dict[str, Any]:
    raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
    event = json.loads(raw)
    if not isinstance(event, dict):
        raise RuntimeError(f"expected JSON object event, got {event!r}")
    return event


async def _wait_terminal(ws: websockets.WebSocketClientProtocol, timeout: float = 30.0) -> dict[str, Any]:
    while True:
        event = await _recv_json(ws, timeout)
        payload = event.get("payload")
        if payload is None and event.get("state") == 5:
            return {"state": event.get("state"), "status": "ack", "turn_id": None, "isProcessing": None}
        if not isinstance(payload, dict):
            continue
        status = payload.get("status")
        if status in {"done", "error", "cancelled"} or payload.get("isProcessing") is False:
            return {
                "state": event.get("state"),
                "status": status,
                "turn_id": payload.get("turn_id"),
                "isProcessing": payload.get("isProcessing"),
                "errorCode": payload.get("errorCode") or payload.get("code"),
                "messages_count": len(payload.get("messages") or []),
                "utterance_kind": payload.get("utterance_kind"),
            }


async def run_probe(url: str) -> int:
    async with websockets.connect(url, max_size=2**23) as ws:
        init = await _recv_json(ws)
        await ws.send(json.dumps({"action": "wake"}))
        wake = await _recv_json(ws)

        await ws.send(json.dumps({"action": "language_selected", "language": "English"}))
        lang = await _wait_terminal(ws)

        await ws.send(json.dumps({"action": "user_message", "text": "Give admissions details in 3 short sentences"}))
        success_1 = await _wait_terminal(ws)

        await ws.send(json.dumps({"action": "user_message", "text": "Give documents and fee deadline details briefly"}))
        success_2 = await _wait_terminal(ws)

        await ws.send(json.dumps({"action": "mic_cancel"}))
        cancelled = await _wait_terminal(ws)

    # Failure scenario: mic_start can emit capture/stt failure terminal payload on unsupported host capture.
    failed = {"status": "unknown"}
    async with websockets.connect(url, max_size=2**23) as ws2:
        _ = await _recv_json(ws2)
        await ws2.send(json.dumps({"action": "mic_start"}))
        failed = await _wait_terminal(ws2, timeout=40.0)

    print(
        json.dumps(
            {
                "init_state": init.get("state"),
                "wake_state": wake.get("state"),
                "language_selected": lang,
                "success_turn_1": success_1,
                "success_turn_2": success_2,
                "cancelled_turn": cancelled,
                "failed_turn": failed,
            },
            ensure_ascii=False,
        )
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="ws://127.0.0.1:6969/ws/clara")
    args = parser.parse_args()
    return asyncio.run(run_probe(args.url))


if __name__ == "__main__":
    raise SystemExit(main())
