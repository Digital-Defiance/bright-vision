"""Real Ollama generate-spec — opt-in E2E_LLM=1 (dogfood / test:llm:core)."""

from __future__ import annotations

import os
import unittest

try:
    from fastapi.testclient import TestClient

    from bright_vision_core.http_api import app, _sessions
    from bright_vision_core.http_auth import configure_auth, reset_auth_for_tests
    from bright_vision_core.todo_spec_jobs import spec_gen_timeout_s, spec_job_store
except ImportError:
    TestClient = None
    app = None
    configure_auth = None
    reset_auth_for_tests = None
    spec_gen_timeout_s = None
    spec_job_store = None

from cecli.utils import GitTemporaryDirectory, make_repo

from llm_ollama import ensure_ollama_for_llm_e2e, ollama_reachable, resolve_vision_model
from spec_layer_assertions import assess_generated_spec_layers


@unittest.skipIf(TestClient is None, "fastapi not installed")
@unittest.skipIf(os.environ.get("E2E_LLM") != "1", "set E2E_LLM=1 to run real LLM tests")
@unittest.skipIf(not ollama_reachable(), "Ollama not reachable")
class TestGenerateSpecLlm(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ensure_ollama_for_llm_e2e()

    def setUp(self):
        _sessions.clear()
        reset_auth_for_tests()
        configure_auth("127.0.0.1")

    def tearDown(self):
        reset_auth_for_tests()

    def test_generate_spec_produces_sane_layers(self):
        model = resolve_vision_model()
        wait_s = spec_gen_timeout_s()
        with GitTemporaryDirectory() as temp_dir:
            make_repo(temp_dir)
            client = TestClient(app)
            sess = client.post(
                "/sessions",
                json={"workspace": temp_dir, "model": model, "auto_yes": True},
            )
            if sess.status_code == 400:
                self.skipTest(f"Could not create session: {sess.text}")
            self.assertEqual(sess.status_code, 200, sess.text)
            session_id = sess.json()["session_id"]
            created = client.post(
                f"/workspaces/todos?workspace={temp_dir}",
                json={"title": "LLM spec gen", "template": "spec-driven"},
            )
            self.assertEqual(created.status_code, 200, created.text)
            todo_id = created.json()["id"]

            started = client.post(
                f"/workspaces/todos/{todo_id}/generate-spec"
                f"?workspace={temp_dir}&session_id={session_id}",
                json={
                    "prompt": (
                        "Ping counter API. Exactly REQ-001 and REQ-002 with WHEN and SHALL. "
                        "Keep each section short. Two numbered implementation tasks."
                    ),
                    "mode": "generate",
                    "apply": True,
                    "background": True,
                    "enforce_ears": True,
                },
            )
            self.assertIn(started.status_code, (200, 202), started.text)
            job_id = started.json().get("job_id")
            self.assertTrue(job_id, started.text)

            try:
                job = spec_job_store.wait(job_id, timeout_s=wait_s)
            except TimeoutError:
                poll = client.get(f"/workspaces/todos/generate-spec/{job_id}")
                status = poll.json().get("status") if poll.status_code == 200 else "unknown"
                self.fail(
                    f"generate-spec still {status!r} after {int(wait_s)}s — "
                    f"set LLM_SPEC_GEN_TIMEOUT_S higher or use a faster Ollama model "
                    f"(E2E_OLLAMA_MODEL={os.environ.get('E2E_OLLAMA_MODEL', 'ollama_chat/llama3.2:3b')})"
                )

            body = {
                "status": job.status,
                "error": job.error,
                "requirements": job.requirements,
                "design": job.design,
                "tasks_md": job.tasks_md,
                "raw": job.raw,
                "ears_blocked": job.ears_blocked,
                "ears_issues": job.ears_issues,
            }
            self.assertEqual(body.get("status"), "completed", body.get("error") or body)
            if body.get("ears_blocked"):
                self.skipTest(
                    "Model output failed EARS enforce gate — tighten prompt or model: "
                    f"{body.get('ears_issues')}"
                )
            ok, issues = assess_generated_spec_layers(
                body.get("requirements", ""),
                body.get("design", ""),
                body.get("tasks_md", ""),
            )
            self.assertTrue(ok, f"layer sanity: {issues}; raw_len={len(body.get('raw') or '')}")


if __name__ == "__main__":
    unittest.main()
