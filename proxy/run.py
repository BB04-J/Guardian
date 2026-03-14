#!/usr/bin/env python3
"""
run.py — CLI wrapper to launch the Guardian proxy with mitmproxy.

Usage:
    python run.py                        # use defaults from .env
    python run.py --port 8888            # custom port
    python run.py --dry-run              # scan only, no blocking/reporting
    python run.py --web                  # launch mitmweb GUI instead of mitmdump

Requirements:
    pip install mitmproxy>=10.0
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="AI Response Guardian — Proxy Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run.py
  python run.py --port 8888 --log-level DEBUG
  python run.py --dry-run
  python run.py --web        # opens mitmweb at http://127.0.0.1:8081
        """,
    )
    parser.add_argument("--host",        default="0.0.0.0",   help="Proxy listen host")
    parser.add_argument("--port",        default=8080, type=int, help="Proxy listen port")
    parser.add_argument("--web",         action="store_true",  help="Launch mitmweb GUI")
    parser.add_argument("--dry-run",     action="store_true",  help="Scan only (no blocking or reporting)")
    parser.add_argument("--log-level",   default="INFO",       help="Log level (DEBUG/INFO/WARNING/ERROR)")
    parser.add_argument("--config",      default=".env",       help="Path to .env config file")
    parser.add_argument("--ssl-ca-cert", default="",           help="Custom CA cert path")
    parser.add_argument("--ssl-ca-key",  default="",           help="Custom CA key path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # Inject CLI overrides into env before Config.load
    if args.dry_run:
        os.environ["DRY_RUN"] = "1"
    if args.log_level:
        os.environ["LOG_LEVEL"] = args.log_level.upper()

    print(f"""
  ╔══════════════════════════════════════════════╗
  ║   AI Response Guardian — Proxy Engine v1.0   ║
  ║   Starting on {args.host}:{args.port:<5}                ║
  ╚══════════════════════════════════════════════╝
""")

    try:
        from mitmproxy.tools import main as mitmproxy_main
    except ImportError:
        print(
            "ERROR: mitmproxy is not installed.\n"
            "Install with:  pip install mitmproxy>=10.0\n",
            file=sys.stderr,
        )
        sys.exit(1)

    addon_path = str(Path(__file__).parent / "guardian_proxy" / "addon.py")

    base_args = [
        "--listen-host", args.host,
        "--listen-port", str(args.port),
        "--scripts",     addon_path,
        "--set",         f"guardian_config={args.config}",
    ]

    if args.ssl_ca_cert:
        base_args += ["--certs", f"*={args.ssl_ca_cert}"]

    if args.web:
        print(f"  mitmweb UI  → http://127.0.0.1:8081\n")
        sys.argv = ["mitmweb"] + base_args
        mitmproxy_main.mitmweb()
    else:
        sys.argv = ["mitmdump"] + base_args
        mitmproxy_main.mitmdump()


if __name__ == "__main__":
    main()
