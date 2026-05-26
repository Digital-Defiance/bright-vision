#!/usr/bin/env python3
"""
Scan SVG wordmarks in assets/ for embedded Inter fonts.

Only SVGs with two text blocks containing BRIGHT and VISION are checked.
Expects @font-face rules for Inter-Thin and Inter-Black inside <defs> (from
assets/interthin and assets/interblack).

Usage:
  ./scripts/check_svg_wordmark_fonts.py
  ./scripts/check_svg_wordmark_fonts.py --fix          # prompt per file
  ./scripts/check_svg_wordmark_fonts.py --fix --yes     # fix all without prompting
  ./scripts/check_svg_wordmark_fonts.py --assets path/to/assets
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ASSETS = ROOT / "assets"
INTERTHIN_FILE = "interthin"
INTERBLACK_FILE = "interblack"

FONT_THIN = "Inter-Thin"
FONT_BLACK = "Inter-Black"

TEXT_BRIGHT = re.compile(r">\s*BRIGHT\s*(?:</tspan>|</text>)", re.IGNORECASE)
TEXT_VISION = re.compile(r">\s*VISION\s*(?:</tspan>|</text>)", re.IGNORECASE)
DEFS_RE = re.compile(r"<defs\b[^>]*>(.*?)</defs>", re.IGNORECASE | re.DOTALL)
def _font_face_in_defs_re(family: str) -> re.Pattern[str]:
    return re.compile(
        rf"@font-face\s*\{{[^}}]*font-family:\s*['\"]?{re.escape(family)}['\"]?",
        re.IGNORECASE | re.DOTALL,
    )


@dataclass
class SvgReport:
    path: Path
    has_wordmark: bool
    missing_thin: bool
    missing_black: bool

    @property
    def needs_fix(self) -> bool:
        return self.has_wordmark and (self.missing_thin or self.missing_black)


def _read_font_block(assets_dir: Path, name: str) -> str:
    path = assets_dir / name
    if not path.is_file():
        raise FileNotFoundError(f"Missing font template: {path}")
    block = path.read_text(encoding="utf-8").strip()
    if "@font-face" not in block or "src:" not in block:
        raise ValueError(f"{path} does not look like a complete @font-face block")
    return block + "\n"


def has_bright_vision_text_blocks(svg: str) -> bool:
    """True when BRIGHT and VISION appear as separate text/tspan content."""
    if not TEXT_BRIGHT.search(svg) or not TEXT_VISION.search(svg):
        return False
    text_nodes = re.findall(r"<text\b[^>]*>.*?</text>", svg, re.IGNORECASE | re.DOTALL)
    if not text_nodes:
        return False
    has_bright = any(TEXT_BRIGHT.search(node) for node in text_nodes)
    has_vision = any(TEXT_VISION.search(node) for node in text_nodes)
    return has_bright and has_vision


def _defs_content(svg: str) -> str | None:
    match = DEFS_RE.search(svg)
    return match.group(1) if match else None


def _has_font_in_defs(defs: str, family: str) -> bool:
    return bool(_font_face_in_defs_re(family).search(defs))


def analyze_svg(path: Path) -> SvgReport:
    svg = path.read_text(encoding="utf-8", errors="replace")
    wordmark = has_bright_vision_text_blocks(svg)
    if not wordmark:
        return SvgReport(path, False, False, False)

    defs = _defs_content(svg)
    if defs is None:
        return SvgReport(path, True, True, True)

    missing_thin = not _has_font_in_defs(defs, FONT_THIN)
    missing_black = not _has_font_in_defs(defs, FONT_BLACK)
    return SvgReport(path, True, missing_thin, missing_black)


def _injection_block(assets_dir: Path, missing_thin: bool, missing_black: bool) -> str:
    parts: list[str] = []
    if missing_thin:
        parts.append(_read_font_block(assets_dir, INTERTHIN_FILE))
    if missing_black:
        parts.append(_read_font_block(assets_dir, INTERBLACK_FILE))
    return "\n".join(parts).strip() + "\n" if parts else ""


def inject_fonts(svg: str, injection: str) -> str:
    if not injection.strip():
        return svg

    if re.search(r"<style\b", svg, re.IGNORECASE):
        return re.sub(
            r"(<style\b[^>]*>\s*)",
            r"\1" + injection,
            svg,
            count=1,
            flags=re.IGNORECASE,
        )

    return re.sub(
        r"(<defs\b[^>]*>\s*)",
        r"\1<style>\n" + injection + "</style>\n",
        svg,
        count=1,
        flags=re.IGNORECASE,
    )


def _missing_labels(report: SvgReport) -> str:
    missing = []
    if report.missing_thin:
        missing.append(FONT_THIN)
    if report.missing_black:
        missing.append(FONT_BLACK)
    return ", ".join(missing)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--assets",
        type=Path,
        default=DEFAULT_ASSETS,
        help=f"Directory of SVG assets (default: {DEFAULT_ASSETS})",
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Inject missing @font-face blocks after confirmation",
    )
    parser.add_argument(
        "--yes",
        "-y",
        action="store_true",
        help="With --fix, apply all fixes without prompting",
    )
    args = parser.parse_args(argv)

    assets_dir = args.assets.resolve()
    if not assets_dir.is_dir():
        print(f"error: not a directory: {assets_dir}", file=sys.stderr)
        return 2

    try:
        _read_font_block(assets_dir, INTERTHIN_FILE)
        _read_font_block(assets_dir, INTERBLACK_FILE)
    except (FileNotFoundError, ValueError) as err:
        print(f"error: {err}", file=sys.stderr)
        return 2

    svgs = sorted(assets_dir.glob("*.svg"))
    if not svgs:
        print(f"warning: no SVG files in {assets_dir}")
        return 0

    reports = [analyze_svg(p) for p in svgs]
    wordmarks = [r for r in reports if r.has_wordmark]
    problems = [r for r in wordmarks if r.needs_fix]

    print(f"Scanned {len(svgs)} SVG(s) in {assets_dir}")
    print(f"Wordmarks (BRIGHT + VISION text blocks): {len(wordmarks)}")

    if not wordmarks:
        print("No BRIGHT/VISION wordmark SVGs found — nothing to check.")
        return 0

    for report in wordmarks:
        if not report.needs_fix:
            print(f"  ok   {report.path.name}")
        else:
            print(f"  WARN {report.path.name}  missing in <defs>: {_missing_labels(report)}")

    if not problems:
        print("All wordmark SVGs have Inter-Thin and Inter-Black in <defs>.")
        return 0

    if not args.fix:
        print(f"\n{len(problems)} file(s) need font injection. Re-run with --fix.")
        return 1

    fixed = 0
    for report in problems:
        label = _missing_labels(report)
        if not args.yes:
            try:
                answer = input(f"Fix {report.path.name}? Missing: {label} [y/N/a=all/q] ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print("\nAborted.")
                return 130
            if answer in {"q", "quit"}:
                break
            if answer in {"a", "all"}:
                args.yes = True
            elif answer not in {"y", "yes"}:
                print(f"  skip {report.path.name}")
                continue

        injection = _injection_block(assets_dir, report.missing_thin, report.missing_black)
        original = report.path.read_text(encoding="utf-8", errors="replace")
        updated = inject_fonts(original, injection)
        if updated == original:
            print(f"  failed to update {report.path.name}", file=sys.stderr)
            continue
        report.path.write_text(updated, encoding="utf-8")
        print(f"  fixed {report.path.name}")
        fixed += 1

    remaining = sum(1 for r in problems if analyze_svg(r.path).needs_fix)
    if fixed:
        print(f"\nUpdated {fixed} file(s).")
    if remaining:
        print(f"{remaining} file(s) still missing fonts.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
