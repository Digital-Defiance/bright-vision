"""Opt-in LLM e2e: /add fixture file and read E2E_CONTEXT_MAGIC (pairs with e2e/context-llm.spec.ts)."""

from __future__ import annotations

import json
import os
import subprocess
import unittest
from pathlib import Path

try:
    from fastapi.testclient import TestClient

    from bright_vision_core.http_api import app, _sessions
    from bright_vision_core.http_auth import configure_auth, reset_auth_for_tests
except ImportError:
    TestClient = None
    app = None
    configure_auth = None
    reset_auth_for_tests = None

from llm_ollama import ensure_ollama_for_llm_e2e, ollama_reachable, resolve_vision_model

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTEXT_WORKSPACE = REPO_ROOT / "e2e" / "fixtures" / "context-workspace"
WIDGET_REL = "src/e2e_widget.ts"
E2E_CONTEXT_MAGIC = "bv-context-fixture-7f3a"


def _ensure_context_workspace() -> str:
    CONTEXT_WORKSPACE.mkdir(parents=True, exist_ok=True)
    widget = CONTEXT_WORKSPACE / WIDGET_REL
    widget.parent.mkdir(parents=True, exist_ok=True)
    readme = CONTEXT_WORKSPACE / "README.md"
    if not readme.exists():
        readme.write_text("# E2E context workspace\n", encoding="utf8")
    if not widget.exists():
        widget.write_text(
            f'export const E2E_CONTEXT_MAGIC = "{E2E_CONTEXT_MAGIC}"\n',
            encoding="utf8",
        )
    if not (CONTEXT_WORKSPACE / ".git").exists():
        subprocess.run(["git", "init", "-b", "main"], cwd=CONTEXT_WORKSPACE, check=True, capture_output=True)
        subprocess.run(["git", "add", "README.md", WIDGET_REL], cwd=CONTEXT_WORKSPACE, check=True, capture_output=True)
        subprocess.run(
            [
                "git",
                "-c",
                "user.email=e2e@test",
                "-c",
                "user.name=e2e",
                "commit",
                "-m",
                "e2e context fixture",
            ],
            cwd=CONTEXT_WORKSPACE,
            check=True,
            capture_output=True,
        )
    return str(CONTEXT_WORKSPACE)


def _parse_sse_payload(raw: str) -> list[dict]:
    events: list[dict] = []
    for part in raw.split("\n\n"):
        for line in part.split("\n"):
            if not line.startswith("data: "):
                continue
            events.append(json.loads(line[6:]))
    return events


def _assistant_text(events: list[dict]) -> str:
    tokens = [e.get("text", "") for e in events if e.get("type") == "token"]
    text = "".join(tokens)
    if text.strip():
        return text
    done = next((e for e in events if e.get("type") == "done"), None)
    return str(done.get("assistant_text") or "") if done else ""


@unittest.skipIf(TestClient is None, "fastapi not installed")
@unittest.skipIf(os.environ.get("E2E_LLM") != "1", "set E2E_LLM=1 to run real LLM tests")
@unittest.skipIf(not ollama_reachable(), "Ollama not reachable")
class TestContextLlm(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ensure_ollama_for_llm_e2e()

    def setUp(self):
        _sessions.clear()
        reset_auth_for_tests()
        configure_auth("127.0.0.1")

    def tearDown(self):
        reset_auth_for_tests()

    def test_add_fixture_file_then_read_magic_constant(self):
        model = resolve_vision_model()
        workspace = _ensure_context_workspace()
        client = TestClient(app)
        res = client.post("/sessions", json={"workspace": workspace, "model": model})
        if res.status_code == 400:
            self.skipTest(f"Could not create session: {res.text}")
        self.assertEqual(res.status_code, 200, res.text)
        session_id = res.json()["session_id"]

        with client.stream(
            "POST",
            f"/sessions/{session_id}/messages",
            json={"content": f"/add {WIDGET_REL}", "preproc": True},
        ) as stream:
            self.assertEqual(stream.status_code, 200)
            add_body = stream.read().decode("utf-8")
        add_events = _parse_sse_payload(add_body)
        self.assertFalse([e for e in add_events if e.get("type") == "error"])

        question = (
            "Using only the file you have in context, what is the exact string value assigned to "
            "E2E_CONTEXT_MAGIC in TypeScript? Reply with only that string, no quotes or explanation."
        )
        with client.stream(
            "POST",
            f"/sessions/{session_id}/messages",
            json={"content": question, "preproc": True},
        ) as stream:
            self.assertEqual(stream.status_code, 200)
            body = stream.read().decode("utf-8")

        events = _parse_sse_payload(body)
        errors = [e for e in events if e.get("type") == "error"]
        self.assertFalse(errors, errors)
        reply = _assistant_text(events)
        self.assertIn(
            E2E_CONTEXT_MAGIC,
            reply,
            f"expected {E2E_CONTEXT_MAGIC!r} in reply: {reply[:500]!r}",
        )
