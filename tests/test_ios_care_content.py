import json
import unittest
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
CARE_PATH = ROOT / "LunaPlateIOS" / "LunaPlateIOS" / "Resources" / "Data" / "care-rules.json"
ALLOWED_HEALTH_DOMAINS = {"www.acog.org", "www.nhs.uk", "womenshealth.gov"}


class IOSCareContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.payload = json.loads(CARE_PATH.read_text(encoding="utf-8"))

    def test_schema_and_review_metadata(self):
        self.assertEqual(self.payload["schemaVersion"], 1)
        self.assertRegex(self.payload["reviewedAt"], r"^\d{4}-\d{2}-\d{2}$")
        self.assertGreaterEqual(len(self.payload["rules"]), 8)
        self.assertGreaterEqual(len(self.payload["redFlags"]), 2)

    def test_rules_have_complete_localized_copy_and_sources(self):
        source_ids = {source["id"] for source in self.payload["sources"]}
        rule_ids = set()
        for rule in self.payload["rules"]:
            self.assertNotIn(rule["id"], rule_ids)
            rule_ids.add(rule["id"])
            self.assertTrue(rule["phases"])
            self.assertGreater(rule["priority"], 0)
            for field in ("title", "action", "reason", "safety"):
                self.assertEqual(set(rule[field]), {"en", "zh", "ru"})
                self.assertTrue(all(value.strip() for value in rule[field].values()))
            self.assertTrue(rule["sourceIds"])
            self.assertTrue(set(rule["sourceIds"]).issubset(source_ids))

    def test_sources_are_authoritative_https_pages(self):
        for source in self.payload["sources"]:
            parsed = urlparse(source["url"])
            self.assertEqual(parsed.scheme, "https")
            self.assertIn(parsed.netloc, ALLOWED_HEALTH_DOMAINS)

    def test_red_flags_have_localized_messages_and_known_sources(self):
        source_ids = {source["id"] for source in self.payload["sources"]}
        for rule in self.payload["redFlags"]:
            self.assertGreater(rule["threshold"], 0)
            self.assertEqual(set(rule["message"]), {"en", "zh", "ru"})
            self.assertTrue(set(rule["sourceIds"]).issubset(source_ids))


if __name__ == "__main__":
    unittest.main()
