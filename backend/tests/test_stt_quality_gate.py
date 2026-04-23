import unittest

from backend.app import main


class TestSttQualityGate(unittest.TestCase):
    def test_low_quality_when_transcript_too_short(self) -> None:
        low, reason = main._is_low_quality_transcript("ok", {"confidence": 0.95}, {"rms": 0.01})
        self.assertTrue(low)
        self.assertIn("too_short", reason)

    def test_low_quality_when_confidence_low(self) -> None:
        low, reason = main._is_low_quality_transcript(
            "admission fees for cse",
            {"confidence": 0.31},
            {"rms": 0.02},
        )
        self.assertTrue(low)
        self.assertIn("low_confidence", reason)

    def test_good_quality_transcript(self) -> None:
        low, reason = main._is_low_quality_transcript(
            "show fees for cse department",
            {"confidence": 0.92},
            {"rms": 0.02},
        )
        self.assertFalse(low)
        self.assertEqual(reason, "ok")


if __name__ == "__main__":
    unittest.main()
