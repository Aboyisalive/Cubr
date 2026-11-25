#!/usr/bin/env python3
"""F0.1 scaffold verification.

Proves the fragment's "Done when": every folder and command exists, and the
fresh clone builds nothing yet (no build manifests are asserted absent —
later fragments add them legitimately; only presence is checked here).

Usage: python3 scripts/verify_scaffold.py   (or: just verify)
Exit code 0 = scaffold complete, 1 = something missing.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

REQUIRED_DIRS = [
    "android",
    "web",
    "backend",
    "shared",
    "shared/cube-core",
    "shared/api",
    "vision",
    "infra",
    "scripts",
]

REQUIRED_FILES = [
    "README.md",
    ".gitignore",
    ".editorconfig",
    "justfile",
    "scripts/verify_scaffold.py",
    "scripts/doctor.py",
    # one README per top-level area documents purpose + owning fragment
    "android/README.md",
    "web/README.md",
    "backend/README.md",
    "shared/README.md",
    "shared/cube-core/README.md",
    "shared/api/README.md",
    "vision/README.md",
    "infra/README.md",
]

# Every command the README promises must exist as a just recipe.
REQUIRED_RECIPES = [
    "verify",
    "doctor",
    "clean",
    "codegen",
    "build",
    "test",
    "lint",
    "fmt",
    "check",
    "dev-backend",
    "dev-web",
    "dev-android",
    "db-up",
    "db-down",
    "golden",
    "bench-scan",
]

GITIGNORE_MUST_COVER = ["node_modules/", ".gradle/", "__pycache__/", ".env"]


def main() -> int:
    failures: list[str] = []
    checks = 0

    def check(ok: bool, label: str) -> None:
        nonlocal checks
        checks += 1
        print(f"{'PASS' if ok else 'FAIL'}  {label}")
        if not ok:
            failures.append(label)

    for d in REQUIRED_DIRS:
        check((ROOT / d).is_dir(), f"directory exists: {d}/")

    for f in REQUIRED_FILES:
        p = ROOT / f
        check(p.is_file() and p.stat().st_size > 0, f"file exists, non-empty: {f}")

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    for term in ["Go", "Kotlin", "TypeScript", "PostgreSQL", "cube-core", "just verify", "F0.1", "F0.2"]:
        check(term in readme, f"README mentions: {term}")

    justfile = (ROOT / "justfile").read_text(encoding="utf-8")
    recipes = set(re.findall(r"^([a-z][a-z0-9-]*):", justfile, flags=re.MULTILINE))
    for r in REQUIRED_RECIPES:
        check(r in recipes, f"just recipe exists: just {r}")

    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
    for pattern in GITIGNORE_MUST_COVER:
        check(pattern in gitignore, f".gitignore covers: {pattern}")

    editorconfig = (ROOT / ".editorconfig").read_text(encoding="utf-8")
    check("root = true" in editorconfig, ".editorconfig is rooted (root = true)")
    for section in ["[*.go]", "[*.py]", "[*.{kt,kts}]"]:
        check(section in editorconfig, f".editorconfig section: {section}")

    print()
    if failures:
        print(f"verify_scaffold: {len(failures)}/{checks} checks FAILED")
        return 1
    print(f"verify_scaffold: all {checks} checks passed — F0.1 scaffold complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
