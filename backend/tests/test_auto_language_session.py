import unittest
from unittest.mock import AsyncMock, patch

from backend.app import main
from backend.services.session_language import set_session_language


class _FakeWebSocket:
    def __init__(self) -> None:
        self.events: list[dict] = []

    async def send_json(self, payload: dict) -> None:
        self.events.append(payload)


class TestAutoLanguageSession(unittest.IsolatedAsyncioTestCase):
    async def test_auto_detect_sets_session_once(self) -> None:
        session = {
            "language_code_key": None,
            "language_name": None,
            "is_language_auto": None,
            "messages": [],
        }
        ws = _FakeWebSocket()

        with patch.object(main, "AUTO_LANGUAGE_DETECT_ENABLED", True), patch.object(
            main,
            "tts_to_base64_cached",
            new=AsyncMock(return_value=(None, False)),
        ):
            await main.maybe_auto_detect_session_language(session, "ನಮಸ್ಕಾರ", ws, main.TurnTiming(), stt_meta=None)
            self.assertEqual(session["language_code_key"], "kn")
            self.assertEqual(session["language_name"], "Kannada")
            self.assertTrue(session["is_language_auto"])
            self.assertFalse(session["language_locked"])
            self.assertTrue(any(e.get("payload", {}).get("type") == "language_auto_detected" for e in ws.events))

            first_event_count = len(ws.events)
            await main.maybe_auto_detect_session_language(session, "hello", ws, main.TurnTiming(), stt_meta=None)
            self.assertEqual(len(ws.events), first_event_count)
            self.assertEqual(session["language_code_key"], "kn")

    async def test_manual_override_skips_auto_detect(self) -> None:
        session = {}
        set_session_language(session, "ta", is_auto=False)
        ws = _FakeWebSocket()

        with patch.object(main, "AUTO_LANGUAGE_DETECT_ENABLED", True), patch.object(
            main,
            "tts_to_base64_cached",
            new=AsyncMock(return_value=(None, False)),
        ):
            await main.maybe_auto_detect_session_language(
                session,
                "hello",
                ws,
                main.TurnTiming(),
                stt_meta={"language_code": "hi", "confidence": 0.99},
            )

        self.assertEqual(session["language_code_key"], "ta")
        self.assertFalse(session["is_language_auto"])
        self.assertTrue(session["language_locked"])
        self.assertEqual(len(ws.events), 0)


if __name__ == "__main__":
    unittest.main()
