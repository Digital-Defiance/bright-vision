"""Phased spec section prompts and merge (no LLM)."""

from __future__ import annotations

import unittest

from bright_vision_core.todo_spec_generate import (
    build_generate_message,
    merge_generated_layers,
    parse_generated_layers,
    validate_section_prerequisites,
)
from bright_vision_core.workspace_todos import TodoItem


class TestTodoSpecPhased(unittest.TestCase):
    def _item(self) -> TodoItem:
        return TodoItem(
            id="abc",
            title="Moon base",
            requirements="### REQ-001\n**WHEN** launch\n**THE** system **SHALL** land.\n",
            design="## Overview\nREQ-001",
            tasks_md="- [ ] 1. Step (depends: none)",
        )

    def test_requirements_prompt_includes_partial_draft(self):
        item = self._item()
        item.requirements = "### REQ-001\nDraft only"
        msg = build_generate_message("Expand coverage", item=item, section="requirements")
        self.assertIn("Existing requirements draft", msg)
        self.assertIn("Draft only", msg)
        self.assertIn("## Requirements", msg)
        self.assertNotIn("## Design", msg)

    def test_design_prompt_includes_requirements_and_partial_design(self):
        item = self._item()
        item.design = "## Draft\nPartial"
        msg = build_generate_message("Add modules", item=item, section="design")
        self.assertIn("REQ-001", msg)
        self.assertIn("Existing design draft", msg)
        self.assertIn("Partial", msg)
        self.assertNotIn("Current spec quality", msg)

    def test_tasks_prompt_omits_ears_quality_block(self):
        item = self._item()
        msg = build_generate_message("Break down work", item=item, section="tasks_md")
        self.assertNotIn("Current spec quality", msg)

    def test_tasks_prompt_includes_req_and_design(self):
        item = self._item()
        item.tasks_md = ""
        msg = build_generate_message("Break down work", item=item, section="tasks_md")
        self.assertIn("REQ-001", msg)
        self.assertIn("## Overview", msg)
        self.assertIn("## Implementation tasks", msg)

    def test_merge_design_keeps_requirements(self):
        item = self._item()
        parsed = {"requirements": "", "design": "## New design\nREQ-001", "tasks_md": ""}
        merged = merge_generated_layers(item, parsed, section="design")
        self.assertIn("REQ-001", merged["requirements"])
        self.assertIn("New design", merged["design"])
        self.assertIn("Step", merged["tasks_md"])

    def test_validate_prerequisites(self):
        item = self._item()
        item.requirements = ""
        with self.assertRaises(ValueError):
            validate_section_prerequisites(item, "design")
        item.requirements = "req"
        item.design = ""
        with self.assertRaises(ValueError):
            validate_section_prerequisites(item, "tasks_md")

    def test_parse_design_only(self):
        text = "## Design\n## Overview\nHandles REQ-001.\n"
        layers = parse_generated_layers(text, section="design")
        self.assertIn("Overview", layers["design"])


if __name__ == "__main__":
    unittest.main()
