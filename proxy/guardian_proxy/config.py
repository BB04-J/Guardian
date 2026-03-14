"""
config.py — Configuration loader for the Guardian proxy engine.
Reads from environment variables (with .env file support via dotenv if available).
"""

from __future__ import annotations

import os
import socket
import sys
from pathlib import Path


def _load_dotenv(path: str = ".env") -> None:
    """Minimal .env parser — avoids requiring python-dotenv as a hard dependency."""
    env_path = Path(path)
    if not env_path.exists():
        return
    with env_path.open() as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key   = key.strip()
            value = value.strip().strip("\"'")
            if key and key not in os.environ:
                os.environ[key] = value


def _required(name: str) -> str:
    v = os.environ.get(name, "").strip()
    if not v:
        print(f"[guardian-proxy] ERROR: required env var '{name}' is not set.", file=sys.stderr)
        sys.exit(1)
    return v


class Config:
    # ── Proxy listener ─────────────────────────────────────────────────────────
    LISTEN_HOST:   str  = "0.0.0.0"
    LISTEN_PORT:   int  = 8080

    # ── Backend API ────────────────────────────────────────────────────────────
    BACKEND_URL:   str  = "http://localhost:4000"
    PROXY_SECRET:  str  = ""

    # ── mitmproxy TLS ──────────────────────────────────────────────────────────
    # If set, use a custom CA cert/key instead of mitmproxy's auto-generated one
    SSL_CA_CERT:   str  = ""
    SSL_CA_KEY:    str  = ""

    # ── Behaviour ──────────────────────────────────────────────────────────────
    DRY_RUN:         bool = False    # If True, scan but don't block traffic or report
    LOG_LEVEL:       str  = "INFO"
    LOG_BODIES:      bool = False    # Log full request/response bodies (verbose!)
    POLICY_THRESHOLD: str = "warn"   # "warn" | "block" — default enforcement level
    MAX_BODY_BYTES:  int  = 512_000  # Max body size to scan (skip larger ones)
    DEVICE_ID:       str  = ""       # Optional device identifier tag

    # ── Exclusions ─────────────────────────────────────────────────────────────
    BYPASS_HOSTS: frozenset[str] = frozenset()

    # ── Rate limiting ──────────────────────────────────────────────────────────
    RATE_LIMIT_PROMPTS: int  = 50   # Max AI prompts per window per IP
    RATE_LIMIT_WINDOW:  int  = 60   # Sliding window in seconds

    # ── Aliases (set in load()) ────────────────────────────────────────────────
    PROXY_HOST: str = "0.0.0.0"
    PROXY_PORT: int = 8080

    @classmethod
    def load(cls, env_file: str = ".env") -> "Config":
        _load_dotenv(env_file)

        cfg = cls()
        cfg.LISTEN_HOST      = os.environ.get("PROXY_HOST",          "0.0.0.0")
        cfg.LISTEN_PORT      = int(os.environ.get("PROXY_PORT",       "8080"))
        cfg.BACKEND_URL      = os.environ.get("BACKEND_URL",          "http://localhost:4000")
        cfg.PROXY_SECRET     = _required("PROXY_SECRET_KEY")
        cfg.SSL_CA_CERT      = os.environ.get("SSL_CA_CERT",          "")
        cfg.SSL_CA_KEY       = os.environ.get("SSL_CA_KEY",           "")
        cfg.DRY_RUN          = os.environ.get("DRY_RUN", "").lower() in ("1", "true", "yes")
        cfg.LOG_LEVEL        = os.environ.get("LOG_LEVEL",            "INFO").upper()
        cfg.LOG_BODIES       = os.environ.get("LOG_BODIES", "").lower() in ("1", "true")
        cfg.POLICY_THRESHOLD = os.environ.get("POLICY_THRESHOLD",     "warn").lower()
        cfg.MAX_BODY_BYTES   = int(os.environ.get("MAX_BODY_BYTES",   "512000"))
        cfg.DEVICE_ID        = os.environ.get("DEVICE_ID",            socket.gethostname())

        bypass_raw = os.environ.get("BYPASS_HOSTS", "")
        cfg.BYPASS_HOSTS = frozenset(
            h.strip().lower() for h in bypass_raw.split(",") if h.strip()
        )

        cfg.RATE_LIMIT_PROMPTS = int(os.environ.get("RATE_LIMIT_PROMPTS", "50"))
        cfg.RATE_LIMIT_WINDOW  = int(os.environ.get("RATE_LIMIT_WINDOW",  "60"))

        # Aliases used in addon.py
        cfg.PROXY_HOST = cfg.LISTEN_HOST
        cfg.PROXY_PORT = cfg.LISTEN_PORT

        return cfg

    def summary(self) -> str:
        return (
            f"  Listener   : {self.LISTEN_HOST}:{self.LISTEN_PORT}\n"
            f"  Backend    : {self.BACKEND_URL}\n"
            f"  Mode       : {'DRY RUN (no blocking/reporting)' if self.DRY_RUN else 'LIVE'}\n"
            f"  Policy     : {self.POLICY_THRESHOLD.upper()}\n"
            f"  Rate Limit : {self.RATE_LIMIT_PROMPTS} prompts/{self.RATE_LIMIT_WINDOW}s per IP\n"
            f"  Log level  : {self.LOG_LEVEL}\n"
            f"  Device ID  : {self.DEVICE_ID}\n"
            f"  Bypass     : {', '.join(self.BYPASS_HOSTS) or 'none'}\n"
        )
