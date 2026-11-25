#!/usr/bin/env python3
"""Report which cubr toolchains are installed or missing.

Informational only: always exits 0. Missing tools are expected on a fresh
clone — each fragment's README names the toolchain it first needs.
"""

from __future__ import annotations

import shutil
import subprocess

# (display name, binary, version args, first needed by)
TOOLS = [
    ("Python 3", "python3", ["--version"], "F0.1 scaffold scripts"),
    ("just", "just", ["--version"], "F0.1 task runner"),
    ("Go", "go", ["version"], "F0.2 backend / F1.1 cube-core"),
    ("Node.js", "node", ["--version"], "F0.5 web"),
    ("npm", "npm", ["--version"], "F0.5 web"),
    ("JDK (java)", "java", ["-version"], "F0.10 mobile"),
    ("Docker", "docker", ["--version"], "F0.2 local Postgres/backend"),
    ("Docker Compose", "docker", ["compose", "version"], "F0.2 local Postgres/backend"),
]


def main() -> int:
    for name, binary, args, needed_by in TOOLS:
        path = shutil.which(binary)
        if path is None:
            print(f"missing  {name:<16} (first needed by {needed_by})")
            continue
        try:
            out = subprocess.run(
                [binary, *args], capture_output=True, text=True, timeout=10
            )
            version = (out.stdout or out.stderr).strip().splitlines()[0]
        except Exception as exc:  # version probe is best-effort
            version = f"found at {path} (version probe failed: {exc})"
        print(f"found    {name:<16} {version}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
