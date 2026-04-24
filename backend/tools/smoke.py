"""Cross-platform backend hardening smoke runner."""

from __future__ import annotations

import argparse
import subprocess
import sys


def _run(cmd: list[str]) -> None:
    print(f"$ {' '.join(cmd)}")
    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(cmd)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-tests", action="store_true")
    parser.add_argument("--url", default="ws://127.0.0.1:6969/ws/clara")
    args = parser.parse_args()
    try:
        if not args.skip_tests:
            _run([sys.executable, "-m", "pytest", "backend/tests"])
        _run([sys.executable, "-m", "backend.tools.ws_smoketest", "--url", args.url])
        _run([sys.executable, "-m", "backend.tools.ws_fuzz_safety", "--url", args.url])
        print("Backend smoke suite passed.")
        return 0
    except Exception as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
