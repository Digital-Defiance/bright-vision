"""Heuristics and normalization for three-layer generated specs."""

from __future__ import annotations

import re


def design_references_requirements(requirements: str, design: str) -> bool:
    req = (requirements or "").strip()
    des = (design or "").strip()
    if not des or not re.search(r"REQ-\d+", req, re.I):
        return True
    if re.search(r"REQ-\d+", des, re.I):
        return True
    nums = [m.group(1) for m in re.finditer(r"REQ-(\d+)", req, re.I)]
    if any(re.search(rf"\b{n}\b", des) for n in nums):
        return True
    if re.search(r"\brequirement\s*\d+", des, re.I):
        return True
    return False


def requirement_ids(requirements: str) -> list[str]:
    return list(dict.fromkeys(re.findall(r"REQ-\d+", requirements, re.I)))


def normalize_spec_layer_traceability(layers: dict[str, str]) -> dict[str, str]:
    """Ensure design cites REQ ids when requirements define them (small-model guard)."""
    req = (layers.get("requirements") or "").strip()
    design = (layers.get("design") or "").strip()
    ids = requirement_ids(req)
    if not ids or design_references_requirements(req, design):
        return layers
    trace = "Covers " + ", ".join(ids) + "."
    out = dict(layers)
    if not design:
        out["design"] = f"## Traceability\n{trace}"
    else:
        out["design"] = f"{design.rstrip()}\n\n## Traceability\n{trace}"
    return out


def assess_generated_spec_layers(
    requirements: str,
    design: str,
    tasks_md: str,
) -> tuple[bool, list[str]]:
    issues: list[str] = []
    req = (requirements or "").strip()
    des = (design or "").strip()
    tasks = (tasks_md or "").strip()

    if not req:
        issues.append("requirements empty")
    if not des:
        issues.append("design empty")
    if not tasks:
        issues.append("tasks_md empty")

    if req:
        if not re.search(r"REQ-\d+", req, re.I):
            issues.append("requirements missing REQ-### id")
        if not re.search(r"\bshall\b", req, re.I):
            issues.append("requirements missing SHALL")
        if not re.search(r"\bwhen\b", req, re.I):
            issues.append("requirements missing WHEN")

    if tasks and not re.search(r"(?:^|\n)\s*(?:-\s*\[[ xX]\]\s*)?\d+\.\s+", tasks):
        issues.append("tasks_md missing numbered implementation steps")

    if des and req and not design_references_requirements(req, des):
        if not (tasks and design_references_requirements(req, tasks)):
            issues.append("design does not reference any REQ id")

    return len(issues) == 0, issues
