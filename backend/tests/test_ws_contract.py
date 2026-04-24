from __future__ import annotations

from fastapi.testclient import TestClient
import pytest

from backend.app import main as app_main


def _client() -> TestClient:
    return TestClient(app_main.app)


def test_ws_message_schema_validation_rejects_extra_field() -> None:
    with _client() as client:
        with client.websocket_connect("/ws/clara") as ws:
            first = ws.receive_json()
            assert first["state"] == 0
            ws.send_json({"action": "wake", "unexpected": "x"})
            event = ws.receive_json()
            payload = event.get("payload", {})
            assert payload.get("code") == "INVALID_SCHEMA"


def test_unknown_action_rejected() -> None:
    with _client() as client:
        with client.websocket_connect("/ws/clara") as ws:
            _ = ws.receive_json()
            ws.send_json({"action": "not_supported"})
            event = ws.receive_json()
            payload = event.get("payload", {})
            assert payload.get("code") == "INVALID_SCHEMA" or payload.get("code") == "UNKNOWN_ACTION"


def test_oversized_payload_rejected() -> None:
    huge = "x" * (app_main.MAX_WS_MESSAGE_BYTES + 128)
    with _client() as client:
        with client.websocket_connect("/ws/clara") as ws:
            _ = ws.receive_json()
            ws.send_json({"action": "user_message", "text": huge})
            event = ws.receive_json()
            payload = event.get("payload", {})
            assert payload.get("code") == "PAYLOAD_TOO_LARGE"


def test_terminal_done_error_contract(monkeypatch) -> None:
    async def fake_process(session, text, websocket, timing, stt_meta=None, local_intent=None):
        status = "error" if text == "force-error" else "done"
        await websocket.send_json({"state": 5, "payload": {"status": status, "isProcessing": False, "turn_id": timing.turn_id}})

    monkeypatch.setattr(app_main, "process_user_text_and_reply", fake_process)

    with _client() as client:
        with client.websocket_connect("/ws/clara") as ws:
            _ = ws.receive_json()
            ws.send_json({"action": "user_message", "text": "ok"})
            done_event = ws.receive_json()
            assert done_event["payload"]["status"] == "done"

            ws.send_json({"action": "user_message", "text": "force-error"})
            err_event = ws.receive_json()
            assert err_event["payload"]["status"] == "error"


def test_security_headers_present() -> None:
    with _client() as client:
        resp = client.get("/")
        assert resp.headers.get("x-content-type-options") == "nosniff"
        assert resp.headers.get("x-frame-options") == "DENY"
        assert resp.headers.get("cache-control") == "no-store"


def test_prod_ws_auth_token_required(monkeypatch) -> None:
    monkeypatch.setattr(app_main, "PROD_MODE", True)
    monkeypatch.setattr(app_main, "REQUIRE_WS_AUTH_IN_PROD", True)
    monkeypatch.setattr(app_main, "WS_AUTH_TOKEN", "expected-token")
    with _client() as client:
        with pytest.raises(Exception):
            with client.websocket_connect("/ws/clara") as _ws:
                pass
        with client.websocket_connect("/ws/clara?token=expected-token") as ws:
            first = ws.receive_json()
            assert first["state"] == 0


def test_prod_bad_origin_rejected(monkeypatch) -> None:
    monkeypatch.setattr(app_main, "PROD_MODE", True)
    monkeypatch.setattr(app_main, "WS_ALLOWED_ORIGINS", ("http://localhost:5176",))
    with _client() as client:
        with pytest.raises(Exception):
            with client.websocket_connect("/ws/clara", headers={"origin": "https://evil.example"}) as _ws:
                pass
