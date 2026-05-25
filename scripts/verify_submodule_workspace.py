#!/usr/bin/env python3
"""
Roadmap #19: verify superproject workspace + aider-vision-core submodule.

Run from aider-vision repo root (after activate.sh):

    python scripts/verify_submodule_workspace.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / "aider-vision-core"
SUB_REL = "aider-vision-core/aider_vision_core/session.py"
VENV_PYTHON = ROOT / ".venv" / "bin" / "python"


def _python_hint() -> str:
    return (
        "Install deps: source activate.sh (or: python3 -m venv .venv && "
        ".venv/bin/pip install -e aider-vision-core)"
    )


def main() -> int:
    if not CORE.is_dir():
        print(f"FAIL: missing submodule checkout at {CORE}")
        return 1

    sys.path.insert(0, str(CORE))

    try:
        from aider_vision_core.event_io import EventIO
        from aider_vision_core.git_workspace import (
            RepoSet,
            create_git_workspace,
            discover_submodule_paths,
        )
        from aider_vision_core.session import Session
    except ModuleNotFoundError as err:
        print(f"FAIL: cannot import aider_vision_core ({err})")
        print(_python_hint())
        return 1

    checks: list[tuple[str, bool]] = []

    paths = discover_submodule_paths(str(ROOT))
    checks.append(
        (
            "git discovers aider-vision-core submodule",
            "aider-vision-core" in paths,
        )
    )

    io = EventIO(yes=True, echo_to_console=False)
    ws = create_git_workspace(io, [], str(ROOT))
    checks.append(("create_git_workspace is RepoSet", isinstance(ws, RepoSet)))
    checks.append(
        (
            f"path_in_repo({SUB_REL})",
            bool(ws.path_in_repo(SUB_REL)),
        )
    )

    sub_root = ws.repo_for_rel_path(SUB_REL).root if isinstance(ws, RepoSet) else ""
    checks.append(
        (
            "submodule repo root is aider-vision-core",
            sub_root.endswith("aider-vision-core"),
        )
    )

    session = Session.create(
        str(ROOT),
        files=[str(ROOT / SUB_REL)],
        yes=True,
        dry_run=True,
    )
    inchat = session.coder.get_inchat_relative_files()
    checks.append(
        (
            "Session adds submodule file to chat",
            SUB_REL.replace("\\", "/") in [p.replace("\\", "/") for p in inchat],
        )
    )
    checks.append(
        ("coder.root is superproject", Path(session.coder.root).resolve() == ROOT.resolve())
    )

    failed = 0
    for name, ok in checks:
        print(f"{'PASS' if ok else 'FAIL'}: {name}")
        if not ok:
            failed += 1

    if failed:
        print(f"\n{failed} check(s) failed.")
        return 1
    print("\nAll submodule workspace checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
