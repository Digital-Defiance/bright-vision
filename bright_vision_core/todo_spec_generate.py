"""
LLM-assisted three-layer todo spec generation and parsing.
"""

from __future__ import annotations

import re
from typing import Literal

from bright_vision_core.ears.prompt import format_spec_quality_for_prompt
from bright_vision_core.workspace_todos import TodoItem

GenerateMode = Literal["generate", "refine"]
SpecSection = Literal["all", "requirements", "design", "tasks_md"]

_SECTION_HEADERS = {
    "## requirements": "requirements",
    "## design": "design",
    "## implementation tasks": "tasks_md",
}

_GENERATE_TEMPLATE = """\
You are writing a spec-driven development plan for this repository. Do not edit any files.

Feature request:
{prompt}

{existing}
{ears_context}

Respond with markdown only, using exactly these three level-2 headings (no other top-level structure):

## Requirements
Use EARS-style bullets: **WHEN** … **THE** system **SHALL** …

## Design
Overview, architecture, components, and data flow. Cite each requirement id from Requirements (e.g. REQ-001, REQ-002).

## Implementation tasks
Numbered checklist items, one per line, format:
- [ ] 1. Short title (depends: none)
- [ ] 2. Next step (depends: 1)
"""

_REQUIREMENTS_SECTION_TEMPLATE = """\
You are writing requirements for a spec-driven task. Do not edit any files.

Feature request:
{prompt}

{existing_requirements}
{ears_context}

Respond with markdown only, under a single level-2 heading:

## Requirements
Use EARS-style bullets: **WHEN** … **THE** system **SHALL** …
"""

_DESIGN_SECTION_TEMPLATE = """\
You are writing the design layer for a spec-driven task. Do not edit any files.

Task title: {title}

## Requirements (approved — design must satisfy these)
{requirements}

Design note:
{prompt}

{existing_design}
{ears_context}

Respond with markdown only, under a single level-2 heading:

## Design
Overview, architecture, components, and data flow. Cite each requirement id (e.g. REQ-001, REQ-002).
Keep the section brief (under 15 lines of markdown).
"""

_TASKS_SECTION_TEMPLATE = """\
You are writing implementation tasks for a spec-driven task. Do not edit any files.

Task title: {title}

## Requirements
{requirements}

## Design
{design}

Implementation note:
{prompt}

{existing_tasks}
{ears_context}

Respond with markdown only, under a single level-2 heading:

## Implementation tasks
Numbered checklist items, one per line, format:
- [ ] 1. Short title (depends: none)
- [ ] 2. Next step (depends: 1)
Each step should trace to requirement ids from Requirements.
"""

_REFINE_TEMPLATE = """\
You are reviewing a spec-driven task for consistency. Do not edit any files.

Task title: {title}

## Requirements
{requirements}

## Design
{design}

## Implementation tasks
{tasks_md}

User note: {prompt}
{ears_context}

Output an improved version with the same three ## headings. Fix contradictions between layers and align implementation tasks with requirements and design. Resolve every EARS error listed above.
"""


def _optional_existing_block(label: str, text: str) -> str:
    body = (text or "").strip()
    if not body:
        return ""
    return f"Existing {label} (improve and extend):\n{body}\n\n"


def build_generate_message(
    prompt: str,
    *,
    mode: GenerateMode = "generate",
    item: TodoItem | None = None,
    section: SpecSection = "all",
) -> str:
    ears_context = ""
    if item and (mode == "refine" or section in ("all", "requirements")):
        ears_context = format_spec_quality_for_prompt(
            item.requirements,
            item.design,
            item.tasks_md,
        )
    if mode == "refine" and item:
        return _REFINE_TEMPLATE.format(
            title=item.title,
            requirements=item.requirements.strip() or "(empty)",
            design=item.design.strip() or "(empty)",
            tasks_md=item.tasks_md.strip() or "(empty)",
            prompt=prompt.strip() or "Review for consistency.",
            ears_context=ears_context,
        )
    if section == "requirements":
        existing = _optional_existing_block(
            "requirements draft",
            item.requirements if item else "",
        )
        return _REQUIREMENTS_SECTION_TEMPLATE.format(
            prompt=prompt.strip(),
            existing_requirements=existing,
            ears_context=ears_context,
        )
    if section == "design" and item:
        return _DESIGN_SECTION_TEMPLATE.format(
            title=item.title,
            requirements=item.requirements.strip() or "(empty)",
            prompt=prompt.strip(),
            existing_design=_optional_existing_block("design draft", item.design),
            ears_context=ears_context,
        )
    if section == "tasks_md" and item:
        return _TASKS_SECTION_TEMPLATE.format(
            title=item.title,
            requirements=item.requirements.strip() or "(empty)",
            design=item.design.strip() or "(empty)",
            prompt=prompt.strip(),
            existing_tasks=_optional_existing_block("implementation tasks draft", item.tasks_md),
            ears_context=ears_context,
        )
    existing = ""
    if item and (item.requirements or item.design or item.tasks_md):
        existing = (
            "Existing draft (improve and extend):\n"
            f"Requirements:\n{item.requirements}\n\n"
            f"Design:\n{item.design}\n\n"
            f"Implementation tasks:\n{item.tasks_md}\n"
        )
    return _GENERATE_TEMPLATE.format(
        prompt=prompt.strip(),
        existing=existing,
        ears_context=ears_context,
    )


def parse_generated_layers(text: str, *, section: SpecSection = "all") -> dict[str, str]:
    """Extract requirements, design, and tasks_md from model markdown."""
    sections: dict[str, list[str]] = {k: [] for k in ("requirements", "design", "tasks_md")}
    current: str | None = None

    for line in text.replace("\r\n", "\n").split("\n"):
        key = _SECTION_HEADERS.get(line.strip().lower())
        if key:
            current = key
            continue
        if current:
            sections[current].append(line)

    out = {k: "\n".join(v).strip() for k, v in sections.items()}
    if not any(out.values()):
        cleaned = _strip_fences(text)
        if cleaned:
            if section == "design":
                out["design"] = cleaned
            elif section == "tasks_md":
                out["tasks_md"] = cleaned
            else:
                out["requirements"] = cleaned
    return out


def merge_generated_layers(
    item: TodoItem,
    parsed: dict[str, str],
    *,
    section: SpecSection,
) -> dict[str, str]:
    """Merge parsed output with stored layers for phased apply."""
    if section == "all":
        return {
            "requirements": parsed.get("requirements", "") or item.requirements,
            "design": parsed.get("design", "") or item.design,
            "tasks_md": parsed.get("tasks_md", "") or item.tasks_md,
        }
    if section == "requirements":
        return {
            "requirements": parsed.get("requirements", "") or item.requirements,
            "design": item.design,
            "tasks_md": item.tasks_md,
        }
    if section == "design":
        return {
            "requirements": item.requirements,
            "design": parsed.get("design", "") or item.design,
            "tasks_md": item.tasks_md,
        }
    return {
        "requirements": item.requirements,
        "design": item.design,
        "tasks_md": parsed.get("tasks_md", "") or item.tasks_md,
    }


def validate_section_prerequisites(item: TodoItem, section: SpecSection) -> None:
    if section == "design" and not item.requirements.strip():
        raise ValueError("Generate requirements before design")
    if section == "tasks_md":
        if not item.requirements.strip():
            raise ValueError("Generate requirements before implementation tasks")
        if not item.design.strip():
            raise ValueError("Generate design before implementation tasks")


def _strip_fences(text: str) -> str:
    t = text.strip()
    m = re.match(r"^```(?:markdown|md)?\s*\n(.*)\n```\s*$", t, re.DOTALL | re.I)
    return m.group(1).strip() if m else t
