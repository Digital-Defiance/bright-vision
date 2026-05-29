"""Deterministic EARS lint for requirements markdown."""

from __future__ import annotations

from collections import Counter

from bright_vision_core.ears.model import EarsClause, EarsIssue, EarsLintResult, Severity
from bright_vision_core.ears.parse import parse_requirements_markdown
from bright_vision_core.ears.patterns import classify_clause, has_shall, has_the_system_shall


def _issue(
    code: str,
    message: str,
    severity: Severity,
    *,
    line: int | None = None,
    req_id: str | None = None,
) -> EarsIssue:
    return EarsIssue(
        code=code,
        message=message,
        severity=severity,
        line=line,
        req_id=req_id,
    )


def lint_clauses(clauses: list[EarsClause]) -> list[EarsIssue]:
    issues: list[EarsIssue] = []

    if not clauses:
        issues.append(
            _issue(
                "EARS_EMPTY",
                "No requirement clauses found. Add ### REQ-001 headings and EARS bullets.",
                "error",
            )
        )
        return issues

    id_counts = Counter(c.req_id for c in clauses if c.req_id)
    for req_id, count in id_counts.items():
        if count > 1:
            issues.append(
                _issue(
                    "EARS_DUP_ID",
                    f"Duplicate requirement id {req_id} ({count} clauses).",
                    "error",
                    req_id=req_id,
                )
            )

    for clause in clauses:
        if not clause.req_id:
            issues.append(
                _issue(
                    "EARS_REQ_ID",
                    "Clause is not under a ### REQ-### heading.",
                    "warning",
                    line=clause.line,
                )
            )

        if not has_shall(clause.text):
            issues.append(
                _issue(
                    "EARS_NO_SHALL",
                    "Requirement clause should include SHALL (EARS normative statement).",
                    "error",
                    line=clause.line,
                    req_id=clause.req_id,
                )
            )
            continue

        if not has_the_system_shall(clause.text):
            issues.append(
                _issue(
                    "EARS_NO_SUBJECT",
                    "Prefer **THE** system **SHALL** (or THE <name> SHALL) for clarity.",
                    "warning",
                    line=clause.line,
                    req_id=clause.req_id,
                )
            )

        pattern = classify_clause(clause.text)
        upper = clause.text.upper()
        if (
            pattern in ("complex", "unknown")
            and has_shall(clause.text)
            and "WHEN" not in upper
            and "WHILE" not in upper
            and "IF " not in upper
        ):
            issues.append(
                _issue(
                    "EARS_EVENT_NO_WHEN",
                    "Normative clause has no WHEN/WHILE/IF — use event-driven form or ubiquitous THE … SHALL.",
                    "warning",
                    line=clause.line,
                    req_id=clause.req_id,
                )
            )
        if pattern == "unknown" and has_shall(clause.text):
            issues.append(
                _issue(
                    "EARS_AMBIGUOUS",
                    "Could not classify EARS pattern (ubiquitous, event, state, unwanted, optional).",
                    "info",
                    line=clause.line,
                    req_id=clause.req_id,
                )
            )

    return issues


def analyze_requirements(
    text: str,
    *,
    source_path: str | None = None,
) -> EarsLintResult:
    """Lint a requirements markdown string (Tasks layer or .cecli/specs/.../requirements.md)."""
    clauses = parse_requirements_markdown(text)
    issues = lint_clauses(clauses)
    return EarsLintResult(
        issues=issues,
        clauses=clauses,
        source_path=source_path,
    )
