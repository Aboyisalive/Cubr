#!/usr/bin/env python3
"""Bundle-size gate (spec section 6: initial JS < 150 KB gzipped).

Measures the gzipped size of the *initial* JS only: the Vite entry chunk
(index-*.js). Lazy chunks (Three.js scroll cube, hero shader) are loaded
after first paint / on approach and are reported for information but do
not count against the initial-JS budget.

Target selection:
  1. web/dist/assets (the real landing bundle; exists from F0.5 on)
  2. shared/api/gen/typescript/dist (stand-in until the web app lands)

Usage: python3 scripts/check-bundle-size.py [dist-dir]
Exit 0 = within budget, 1 = over budget or no bundle found.
"""

from __future__ import annotations

import gzip
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUDGET_BYTES = 150 * 1024


def gzipped_size(path: Path) -> int:
    return len(gzip.compress(path.read_bytes(), compresslevel=9))


def main() -> int:
    candidates = []
    if len(sys.argv) > 1:
        candidates = [Path(sys.argv[1])]
    else:
        candidates = [
            ROOT / "web" / "dist" / "assets",
            ROOT / "web" / "dist",
            ROOT / "shared" / "api" / "gen" / "typescript" / "dist",
        ]

    dist = next((c for c in candidates if c.is_dir() and any(c.rglob("*.js"))), None)
    if dist is None:
        print("bundle-size: no built JS bundle found (run a build first)")
        return 1

    files = sorted(dist.rglob("*.js"))
    entry = [f for f in files if f.name.startswith("index-")] or files
    lazy = [f for f in files if f not in entry]
    total = sum(gzipped_size(f) for f in entry)
    print(f"bundle-size: {dist.relative_to(ROOT) if dist.is_relative_to(ROOT) else dist}")
    for f in entry:
        print(f"  initial {f.name}: {gzipped_size(f) / 1024:.1f} KB gz")
    for f in lazy:
        print(f"  lazy    {f.name}: {gzipped_size(f) / 1024:.1f} KB gz (not counted)")
    print(f"bundle-size: initial total {total / 1024:.1f} KB gz / budget {BUDGET_BYTES // 1024} KB")
    if total > BUDGET_BYTES:
        print("bundle-size: OVER BUDGET")
        return 1
    print("bundle-size: within budget")
    return 0


if __name__ == "__main__":
    sys.exit(main())
