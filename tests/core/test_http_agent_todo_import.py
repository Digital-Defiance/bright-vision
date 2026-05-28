"""Real HTTP: Cecli agent todo.txt → workspace Tasks (no mocks)."""

from __future__ import annotations

import unittest
from pathlib import Path

try:
    from fastapi.testclient import TestClient
except ImportError:
    TestClient = None

from cecli.utils import GitTemporaryDirectory, make_repo


@unittest.skipIf(TestClient is None, "fastapi not installed")
class TestHttpAgentTodoImport(unittest.TestCase):
    def test_import_agent_plan_endpoint(self):
        from bright_vision_core.http_api import app

        with GitTemporaryDirectory() as temp_dir:
            make_repo(temp_dir)
            client = TestClient(app)

            empty = client.post(f"/workspaces/todos/import-agent-plan?workspace={temp_dir}")
            self.assertEqual(empty.status_code, 404)

            agents = Path(temp_dir) / ".cecli" / "agents" / "2026-05-27" / "abc"
            agents.mkdir(parents=True)
            (agents / "todo.txt").write_text(
                "Remaining:\n→ Draft roadmap\n○ Write tests\n",
                encoding="utf-8",
            )

            imported = client.post(f"/workspaces/todos/import-agent-plan?workspace={temp_dir}")
            self.assertEqual(imported.status_code, 200, imported.text)
            body = imported.json()
            self.assertEqual(len(body["todos"]), 1)
            self.assertEqual(body["todos"][0]["title"], "Draft roadmap")

            todos_json = Path(temp_dir) / ".cecli" / "todos.json"
            self.assertTrue(todos_json.is_file())


if __name__ == "__main__":
    unittest.main()
