import unittest

from backend.services.answer_generation import (
    INTENT_ADMISSIONS,
    INTENT_COURSE_MENU,
    INTENT_DEPARTMENT_FEES,
    INTENT_DEPARTMENT_OVERVIEW,
    INTENT_DOCUMENTS,
    INTENT_HOD_PROFILE,
    build_language_style_directive,
    extract_features,
    normalize_spoken_query,
    resolve_intent_from_features,
)


class TestIntentPipeline(unittest.TestCase):
    def _resolve(self, text: str) -> tuple[str, str | None]:
        features = extract_features(text)
        return resolve_intent_from_features(features), features.department_name

    def test_cse_hod_yaaru(self) -> None:
        intent, dept = self._resolve("cse hod yaaru")
        self.assertEqual(intent, INTENT_HOD_PROFILE)
        self.assertEqual(dept, "CSE")

    def test_datascience_fees_bagge_helu(self) -> None:
        intent, dept = self._resolve("datascience fees bagge helu")
        self.assertEqual(intent, INTENT_DEPARTMENT_FEES)
        self.assertEqual(dept, "CSE (Data Science)")

    def test_courses_en_ide(self) -> None:
        intent, _ = self._resolve("courses en ide")
        self.assertEqual(intent, INTENT_COURSE_MENU)

    def test_multilingual_course_phrases(self) -> None:
        phrases = [
            "courses available",
            "course ide",
            "yava course",
            "course ideya",
            "college ali yaav courses ide",
            "college ali yaav yaav departments aithe",
            "course pathi solu",
            "courses enti",
            "course kurich parayu",
            "what are the courses",
            "kaunse courses hai",
            "course kya hai",
            "kaunse course",
            "enna course",
            "course iruka",
            "course enti",
            "course unnaya",
            "course ideya svit alli",
        ]
        for p in phrases:
            with self.subTest(phrase=p):
                feats = extract_features(p)
                self.assertTrue(feats.is_course_query)
                self.assertEqual(resolve_intent_from_features(feats), INTENT_COURSE_MENU)

    def test_fees_structure_without_department(self) -> None:
        intent, dept = self._resolve("fees structure")
        self.assertEqual(intent, INTENT_ADMISSIONS)
        self.assertIsNone(dept)

    def test_multilingual_fee_phrases(self) -> None:
        phrases = [
            "fees eshtu",
            "fees estu",
            "fees bagge",
            "fees kitna",
            "fee kya hai",
            "fees evlo",
            "fees entha",
        ]
        for p in phrases:
            with self.subTest(phrase=p):
                feats = extract_features(p)
                self.assertTrue(feats.is_fee_query)

    def test_datascience_fee_transliterated_phrase(self) -> None:
        intent, dept = self._resolve("cse )datascience du fees estu")
        self.assertEqual(intent, INTENT_DEPARTMENT_FEES)
        self.assertEqual(dept, "CSE (Data Science)")

    def test_fuzzy_broken_datascience_fees(self) -> None:
        intent, dept = self._resolve("cse dtascience du fees estu")
        self.assertEqual(intent, INTENT_DEPARTMENT_FEES)
        self.assertEqual(dept, "CSE (Data Science)")

    def test_ds_fees_evlo(self) -> None:
        intent, dept = self._resolve("ds fees evlo")
        self.assertEqual(intent, INTENT_DEPARTMENT_FEES)
        self.assertEqual(dept, "CSE (Data Science)")

    def test_ai_ml_fee_entha(self) -> None:
        intent, dept = self._resolve("ai ml fee entha")
        self.assertEqual(intent, INTENT_DEPARTMENT_FEES)
        self.assertEqual(dept, "CSE (AI & ML)")

    def test_fees_pathi_solu(self) -> None:
        intent, dept = self._resolve("fees pathi solu")
        self.assertEqual(intent, INTENT_ADMISSIONS)
        self.assertIsNone(dept)

    def test_fees_kurich_parayu(self) -> None:
        intent, dept = self._resolve("fees kurich parayu")
        self.assertEqual(intent, INTENT_ADMISSIONS)
        self.assertIsNone(dept)

    def test_aiml_department_query(self) -> None:
        intent, dept = self._resolve("aiml")
        self.assertEqual(intent, INTENT_DEPARTMENT_OVERVIEW)
        self.assertEqual(dept, "CSE (AI & ML)")

    def test_courses_in_cse_prefers_course_menu(self) -> None:
        intent, dept = self._resolve("courses in cse")
        self.assertEqual(intent, INTENT_COURSE_MENU)
        self.assertEqual(dept, "CSE")

    def test_documents_intent_multilingual(self) -> None:
        phrases = [
            "documents required",
            "documents bagge helu",
            "doccuments kaunse",
            "documents enna venum",
            "documents enti",
            "documents entha",
            "documents kurich parayu",
        ]
        for p in phrases:
            with self.subTest(phrase=p):
                intent, _ = self._resolve(p)
                self.assertEqual(intent, INTENT_DOCUMENTS)

    def test_normalize_spoken_query_aliases(self) -> None:
        q = normalize_spoken_query("pls tell me comp sci hod")
        self.assertIn("cse", q)
        self.assertNotIn("pls", q)

    def test_language_style_directive_contains_codemix_terms(self) -> None:
        style = build_language_style_directive("Hindi")
        self.assertIn("code-mixed", style)
        self.assertIn("HOD", style)


if __name__ == "__main__":
    unittest.main()
