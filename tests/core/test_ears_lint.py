"""EARS module — deterministic requirements lint."""

from __future__ import annotations

import unittest

from bright_vision_core.ears import analyze_requirements


GOOD = """\
### REQ-001
**WHEN** the user opens Tasks
**THE** system **SHALL** show the active task chip.

### REQ-002
**WHEN** the user saves a requirement
**THE** system **SHALL** sync to `.cecli/specs/{id}/requirements.md`.
"""

BAD_NO_SHALL = """\
### REQ-001
**WHEN** the user opens Tasks
**THE** system shows the active task chip.
"""

DUP_ID = """\
### REQ-001
**WHEN** a
**THE** system **SHALL** do A.

### REQ-001
**WHEN** b
**THE** system **SHALL** do B.
"""


class TestEarsLint(unittest.TestCase):
    def test_good_requirements_ok(self):
        r = analyze_requirements(GOOD)
        self.assertTrue(r.ok)
        self.assertGreaterEqual(len(r.clauses), 2)
        self.assertFalse(any(i.code == "EARS_NO_SHALL" for i in r.issues))

    def test_missing_shall_errors(self):
        r = analyze_requirements(BAD_NO_SHALL)
        self.assertFalse(r.ok)
        self.assertTrue(any(i.code == "EARS_NO_SHALL" for i in r.issues))

    def test_duplicate_req_id(self):
        r = analyze_requirements(DUP_ID)
        self.assertFalse(r.ok)
        self.assertTrue(any(i.code == "EARS_DUP_ID" for i in r.issues))

    def test_to_dict_serializable(self):
        r = analyze_requirements(GOOD)
        d = r.to_dict()
        self.assertIn("ok", d)
        self.assertIn("clauses", d)
        self.assertIn("issues", d)


if __name__ == "__main__":
    unittest.main()
