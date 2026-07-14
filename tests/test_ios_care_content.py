import json
import struct
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
CARE_PATH = ROOT / "LunaPlateIOS" / "LunaPlateIOS" / "Resources" / "Data" / "care-rules.json"
IOS_ROOT = ROOT / "LunaPlateIOS" / "LunaPlateIOS"
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


class IOSReleaseAssetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.payload = json.loads(CARE_PATH.read_text(encoding="utf-8"))

    def test_app_icon_is_declared_and_exactly_1024_square(self):
        icon_set = IOS_ROOT / "Resources" / "Assets.xcassets" / "AppIcon.appiconset"
        contents = json.loads((icon_set / "Contents.json").read_text(encoding="utf-8"))
        filename = contents["images"][0]["filename"]
        png = (icon_set / filename).read_bytes()
        self.assertEqual(png[:8], b"\x89PNG\r\n\x1a\n")
        width, height = struct.unpack(">II", png[16:24])
        self.assertEqual((width, height), (1024, 1024))

    def test_release_uses_https_and_debug_keeps_local_server(self):
        plist = ET.parse(IOS_ROOT / "Resources" / "Info.plist").getroot()
        values = [node.text for node in plist.iter() if node.text]
        self.assertIn("$(LUNAPLATE_API_BASE_URL)", values)
        project = (ROOT / "LunaPlateIOS" / "LunaPlateIOS.xcodeproj" / "project.pbxproj").read_text(encoding="utf-8")
        self.assertIn('LUNAPLATE_API_BASE_URL = "http://localhost:5178"', project)
        self.assertIn('LUNAPLATE_API_BASE_URL = "https://lunaplate.onrender.com"', project)
        self.assertNotIn("PRODUCT_BUNDLE_IDENTIFIER = com.example.LunaPlate;", project)

    def test_privacy_policy_covers_core_data_controls(self):
        policy = (ROOT / "privacy.html").read_text(encoding="utf-8").lower()
        for required in ("period dates", "symptom identifiers", "do not sell", "delete all local data", "https"):
            self.assertIn(required, policy)
        manifest = ET.parse(IOS_ROOT / "Resources" / "PrivacyInfo.xcprivacy")
        text = " ".join(node.text or "" for node in manifest.iter())
        self.assertIn("NSPrivacyCollectedDataTypeHealth", text)

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
