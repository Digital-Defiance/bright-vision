"""HTTP generate-spec with mocked LLM output (no Ollama)."""

from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from bright_vision_core.http_api import app
from bright_vision_core.session import Session
from cecli.utils import GitTemporaryDirectory, make_repo
from spec_layer_assertions import SAMPLE_GENERATED_MARKDOWN, assess_generated_spec_layers


class TestHttpGenerateSpecMock(unittest.TestCase):
    def test_generate_spec_applies_sane_layers(self):
        with GitTemporaryDirectory() as temp_dir:
            make_repo(temp_dir)
            client = TestClient(app)
            sess = client.post(
                "/sessions",
                json={"workspace": temp_dir, "model": "gpt-4o", "auto_yes": True},
            )
            self.assertEqual(sess.status_code, 200, sess.text)
            session_id = sess.json()["session_id"]
            created = client.post(
                f"/workspaces/todos?workspace={temp_dir}",
                json={"title": "Generate me", "template": "spec-driven"},
            )
            todo_id = created.json()["id"]

            with patch.object(Session, "run_one_shot", return_value=SAMPLE_GENERATED_MARKDOWN):
                res = client.post(
                    f"/workspaces/todos/{todo_id}/generate-spec"
                    f"?workspace={temp_dir}&session_id={session_id}",
                    json={
                        "prompt": "Ping counter feature",
                        "mode": "generate",
                        "apply": True,
                        "background": False,
                        "enforce_ears": True,
                    },
                )
            self.assertEqual(res.status_code, 200, res.text)
            body = res.json()
            self.assertFalse(body.get("ears_blocked"), body)
            ok, issues = assess_generated_spec_layers(
                body.get("requirements", ""),
                body.get("design", ""),
                body.get("tasks_md", ""),
            )
            self.assertTrue(ok, issues)
            item = body.get("item") or {}
            self.assertIn("REQ-001", item.get("requirements", ""))


if __name__ == "__main__":
    unittest.main()
