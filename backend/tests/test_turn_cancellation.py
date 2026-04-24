from __future__ import annotations

import asyncio

from fastapi.testclient import TestClient

from backend.app import main as app_main


def test_one_active_turn_cancellation_behavior(monkeypatch) -> None:
    async def slow_process(session, text, websocket, timing, stt_meta=None, local_intent=None):
        await asyncio.sleep(0.6)
        await websocket.send_json(
            {"state": 5, "payload": {"status": "done", "isProcessing": False, "turn_id": timing.turn_id}}
        )

    monkeypatch.setattr(app_main, "process_user_text_and_reply", slow_process)

    with TestClient(app_main.app) as client:
        with client.websocket_connect("/ws/clara") as ws:
            _ = ws.receive_json()
            ws.send_json({"action": "user_message", "text": "first"})
            ws.send_json({"action": "mic_cancel"})
            event = ws.receive_json()
            payload = event.get("payload", {})
            assert payload.get("status") in {"cancelled", "done"}
            assert payload.get("isProcessing") is False
