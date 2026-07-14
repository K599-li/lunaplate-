import http.client
import json
import threading
import unittest

from server import LunaPlateHandler
from http.server import ThreadingHTTPServer


class RecommendationAPITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), LunaPlateHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_port

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def post(self, path, payload, content_type="application/json"):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        body = json.dumps(payload).encode("utf-8")
        connection.request("POST", path, body=body, headers={"Content-Type": content_type})
        response = connection.getresponse()
        data = json.loads(response.read().decode("utf-8"))
        connection.close()
        return response.status, data

    def test_post_exercises_keeps_health_values_out_of_url(self):
        status, payload = self.post(
            "/api/female-exercises",
            {"phase": "menstrual", "symptoms": ["cramps", "fatigue"], "limit": 3},
        )
        self.assertEqual(status, 200)
        self.assertEqual(payload["phase"], "menstrual")
        self.assertEqual(payload["symptoms"], ["cramps", "fatigue"])
        self.assertEqual(len(payload["exercises"]), 3)

    def test_post_rejects_invalid_phase(self):
        status, payload = self.post(
            "/api/female-exercises",
            {"phase": "unknown", "symptoms": []},
        )
        self.assertEqual(status, 400)
        self.assertIn("error", payload)

    def test_post_requires_json(self):
        status, _ = self.post(
            "/api/female-exercises",
            {"phase": "luteal", "symptoms": []},
            content_type="text/plain",
        )
        self.assertEqual(status, 415)

    def test_static_file_handler_blocks_parent_traversal(self):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        connection.request("GET", "/..%2Fserver.py")
        response = connection.getresponse()
        response.read()
        connection.close()
        self.assertEqual(response.status, 404)


if __name__ == "__main__":
    unittest.main()
