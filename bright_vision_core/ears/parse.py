"""Parse requirements markdown into EARS clauses."""

from __future__ import annotations

import re

from bright_vision_core.ears.model import EarsClause
from bright_vision_core.ears.patterns import classify_clause

_REQ_HEADING = re.compile(r"^###\s+(REQ-\d+)\s*$", re.I)
_BULLET = re.compile(r"^(\s*[-*]|\s*\d+\.)\s+")


def parse_requirements_markdown(text: str) -> list[EarsClause]:
    """Extract requirement clauses with line numbers and optional REQ ids."""
    lines = text.replace("\r\n", "\n").split("\n")
    clauses: list[EarsClause] = []
    current_req_id: str | None = None
    buf: list[str] = []
    buf_line = 0

    def flush() -> None:
        nonlocal buf, buf_line
        if not buf:
            return
        body = " ".join(s.strip() for s in buf if s.strip())
        if body:
            clauses.append(
                EarsClause(
                    req_id=current_req_id,
                    line=buf_line,
                    text=body,
                    pattern=classify_clause(body),
                )
            )
        buf = []

    for i, raw in enumerate(lines, start=1):
        line = raw.rstrip()
        m = _REQ_HEADING.match(line.strip())
        if m:
            flush()
            current_req_id = m.group(1).upper()
            continue
        stripped = line.strip()
        if not stripped:
            flush()
            continue
        if _BULLET.match(line) or (
            current_req_id and "**WHEN**" in stripped.upper() and not buf
        ):
            flush()
            buf_line = i
            buf = [stripped.lstrip("-* ").strip()]
            continue
        if buf:
            buf.append(stripped)
            continue
        if current_req_id and stripped:
            buf_line = i
            buf = [stripped]

    flush()
    return clauses
