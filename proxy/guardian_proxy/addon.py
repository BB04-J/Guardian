"""
addon.py — mitmproxy addon for AI Response Guardian.

Intercepts HTTP(S) traffic to known AI platforms, scans prompts and responses,
and reports incidents to the Guardian backend API.

Features:
  - Platform whitelisting (dynamic, fetched from backend every 60s)
  - Rate limiting per source IP (configurable, blocks on excess)
  - Large file upload rejection (413 if body > size limit)

Usage (via mitmdump or mitmweb):
    mitmdump -s guardian_proxy/addon.py --listen-port 8080
"""

from __future__ import annotations

import collections
import gzip
import json
import logging
import threading
import time
import sys
from pathlib import Path

# Add project root to sys.path so we can import modules correctly under mitmproxy
_root = str(Path(__file__).parent.parent)
if _root not in sys.path:
    sys.path.append(_root)

from mitmproxy import ctx, http

try:
    from guardian_proxy.config import Config
    from guardian_proxy.platforms import (
        extract_prompt_from_body,
        extract_response_text,
        identify_platform,
        is_inference_request,
    )
    from guardian_proxy.reporter import GuardianReporter, IncidentPayload
    from guardian_proxy.scanner import scan_full, scan_prompt, scan_response
except ImportError:
    # Fallback if started without package context
    try:
        from config import Config
        from platforms import (
            extract_prompt_from_body,
            extract_response_text,
            identify_platform,
            is_inference_request,
        )
        from reporter import GuardianReporter, IncidentPayload
        from scanner import scan_full, scan_prompt, scan_response
    except ImportError:
        # One more try — if we are in guardian_proxy dir
        import config as Config
        import platforms
        import reporter
        import scanner
        from platforms import extract_prompt_from_body, extract_response_text, identify_platform, is_inference_request
        from reporter import GuardianReporter, IncidentPayload
        from scanner import scan_full, scan_prompt, scan_response

import urllib.request
import urllib.error

log = logging.getLogger("guardian.addon")

# Per-connection state keys
_PROMPT_STATE_KEY = "guardian_prompt"
_PLATFORM_KEY     = "guardian_platform"

# ── Rate limiter (sliding window per IP) ──────────────────────────────────────

class SlidingWindowRateLimiter:
    """
    Tracks requests per source IP in a 60-second sliding window.
    Thread-safe.
    """
    def __init__(self, max_requests: int = 50, window_seconds: int = 60):
        self.max_requests   = max_requests
        self.window_seconds = window_seconds
        self._lock          = threading.Lock()
        self._windows: dict[str, collections.deque] = {}

    def is_allowed(self, ip: str) -> bool:
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            if ip not in self._windows:
                self._windows[ip] = collections.deque()
            dq = self._windows[ip]
            # Remove timestamps outside the window
            while dq and dq[0] < cutoff:
                dq.popleft()
            if len(dq) >= self.max_requests:
                return False
            dq.append(now)
            return True

    def request_count(self, ip: str) -> int:
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            dq = self._windows.get(ip, collections.deque())
            return sum(1 for t in dq if t >= cutoff)


# ── Platform Whitelist Cache ───────────────────────────────────────────────────

class WhitelistCache:
    """
    Periodically fetches the list of whitelisted platforms from the backend API.
    Falls back to the last known list if the backend is unreachable.
    """
    def __init__(self, backend_url: str, proxy_secret: str, refresh_interval: int = 60):
        self._url             = backend_url.rstrip("/") + "/api/policies/whitelist"
        self._secret          = proxy_secret
        self._refresh_interval = refresh_interval
        self._whitelist: set[str] = set()
        self._lock            = threading.Lock()
        self._thread          = threading.Thread(
            target=self._refresh_loop,
            name="guardian-whitelist",
            daemon=True,
        )
        self._thread.start()
        log.info("WhitelistCache started → %s (refresh every %ds)", self._url, refresh_interval)

    def is_whitelisted(self, platform: str) -> bool:
        with self._lock:
            return platform in self._whitelist

    def _refresh_loop(self):
        while True:
            self._fetch()
            time.sleep(self._refresh_interval)

    def _fetch(self):
        try:
            req = urllib.request.Request(
                self._url,
                headers={"X-Proxy-Key": self._secret, "User-Agent": "guardian-proxy/1.0"},
                method="GET",
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())
                platforms = set(data.get("whitelist", []))
                with self._lock:
                    self._whitelist = platforms
                log.debug("Whitelist refreshed: %s", platforms)
        except Exception as e:
            log.warning("Failed to refresh whitelist: %s", e)


# ── Main Addon ────────────────────────────────────────────────────────────────

class GuardianAddon:
    """
    mitmproxy addon that scans AI API traffic and reports to Guardian.
    """

    def __init__(self, config: Config | None = None):
        self.cfg      = config or Config.load()
        self.reporter = GuardianReporter(
            backend_url  = self.cfg.BACKEND_URL,
            proxy_secret = self.cfg.PROXY_SECRET,
        )
        self._whitelist = WhitelistCache(
            backend_url   = self.cfg.BACKEND_URL,
            proxy_secret  = self.cfg.PROXY_SECRET,
        )
        self._rate_limiter = SlidingWindowRateLimiter(
            max_requests   = self.cfg.RATE_LIMIT_PROMPTS,
            window_seconds = self.cfg.RATE_LIMIT_WINDOW,
        )
        self._lock    = threading.Lock()
        self._seen    = 0

        log.info(
            "\n"
            "  ╔══════════════════════════════════════════════╗\n"
            "  ║   AI Response Guardian — Proxy Engine v1.0   ║\n"
            "  ║   Starting on %s:%s                 ║\n"
            "  ╚══════════════════════════════════════════════╝\n"
            "%s",
            self.cfg.PROXY_HOST, self.cfg.PROXY_PORT,
            self.cfg.summary()
        )

    # ── mitmproxy lifecycle hooks ──────────────────────────────────────────────

    def request(self, flow: http.HTTPFlow) -> None:
        host   = flow.request.pretty_host.lower()
        path   = flow.request.path
        method = flow.request.method.upper()

        if method not in ("POST", "PUT"):
            return

        # Check bypass list
        if host in self.cfg.BYPASS_HOSTS:
            return

        platform = identify_platform(host, path)
        if not platform:
            return

        if not is_inference_request(path):
            log.debug("Skipping non-inference path: %s %s", method, path)
            return

        # ── Feature 1: Platform Whitelist ──────────────────────────────────────
        if self._whitelist.is_whitelisted(platform):
            log.info("Platform '%s' is whitelisted — allowing traffic untouched.", platform)
            return

        # ── Feature 2: Rate Limiting ───────────────────────────────────────────
        client_ip = flow.client_conn.peername[0] if flow.client_conn.peername else "unknown"
        if not self._rate_limiter.is_allowed(client_ip):
            count = self._rate_limiter.request_count(client_ip)
            log.warning(
                "Rate limit exceeded for IP %s (%d req/%ds) on platform=%s",
                client_ip, count, self.cfg.RATE_LIMIT_WINDOW, platform
            )
            flow.response = http.Response.make(
                429,
                json.dumps({
                    "error": "Too many requests",
                    "message": (
                        "Possible automated data exfiltration detected. "
                        "Access has been temporarily blocked by AI Response Guardian."
                    ),
                    "limit": self.cfg.RATE_LIMIT_PROMPTS,
                    "window_seconds": self.cfg.RATE_LIMIT_WINDOW,
                }),
                {"Content-Type": "application/json", "Retry-After": str(self.cfg.RATE_LIMIT_WINDOW)},
            )
            # Report rate-limit incident
            self.reporter.report(IncidentPayload(
                aiPlatform    = platform,
                riskLevel     = "critical",
                action        = "blocked",
                threatTypes   = ["rate_limit_exceeded"],
                promptPreview = f"Rate limit exceeded: {count} requests from {client_ip}",
                deviceId      = self.cfg.DEVICE_ID,
            ))
            return

        # ── Feature 3: Large body (file upload) check ─────────────────────────
        try:
            content_length = int(flow.request.headers.get("content-length", 0))
        except ValueError:
            content_length = 0

        content_type = flow.request.headers.get("content-type", "")
        is_large_upload = (
            content_length > self.cfg.MAX_BODY_BYTES
            or "multipart/form-data" in content_type
        )

        if is_large_upload:
            log.warning(
                "Large file upload detected from %s to %s (content-length=%d). Blocking.",
                client_ip, platform, content_length
            )
            flow.response = http.Response.make(
                413,
                json.dumps({
                    "error": "Payload Too Large",
                    "message": (
                        "File upload blocked by AI Response Guardian. "
                        "Large file uploads to AI platforms require security review. "
                        "Please contact your IT Security team."
                    ),
                    "max_bytes": self.cfg.MAX_BODY_BYTES,
                }),
                {"Content-Type": "application/json"},
            )
            self.reporter.report(IncidentPayload(
                aiPlatform    = platform,
                riskLevel     = "high",
                action        = "blocked",
                threatTypes   = ["large_file_upload"],
                promptPreview = f"Large upload blocked: {content_length} bytes, Content-Type: {content_type[:80]}",
                deviceId      = self.cfg.DEVICE_ID,
            ))
            return

        # Parse body
        body_bytes = self._read_body(flow.request)
        if not body_bytes:
            return

        try:
            body_json = json.loads(body_bytes)
        except (json.JSONDecodeError, ValueError):
            log.debug("Non-JSON body on %s %s — skipping", host, path)
            return

        prompt = extract_prompt_from_body(body_json, platform)

        if self.cfg.LOG_BODIES:
            log.debug("PROMPT [%s]: %.300s", platform, prompt)

        # Scan prompt immediately (outbound threat detection)
        if prompt:
            prompt_result = scan_prompt(prompt)
            if prompt_result.threat_types and not self.cfg.DRY_RUN:
                if prompt_result.action == "blocked":
                    flow.response = http.Response.make(
                        403,
                        json.dumps({
                            "error": "Request blocked by AI Response Guardian",
                            "threats": prompt_result.threat_types,
                            "risk_level": prompt_result.risk_level,
                        }),
                        {"Content-Type": "application/json"},
                    )
                    self._report(
                        platform      = platform,
                        prompt        = prompt,
                        response      = "",
                        prompt_result = prompt_result,
                        resp_result   = None,
                    )
                    return
                elif prompt_result.action == "sanitized" and prompt_result.sanitized_text:
                    body_json_clean = dict(body_json)
                    if "messages" in body_json_clean:
                        msgs = body_json_clean["messages"]
                        clean_msgs = []
                        for msg in msgs:
                            if msg.get("role") in ("user", "human"):
                                clean_msgs.append({**msg, "content": prompt_result.sanitized_text})
                            else:
                                clean_msgs.append(msg)
                        body_json_clean["messages"] = clean_msgs
                    elif "prompt" in body_json_clean:
                        body_json_clean["prompt"] = prompt_result.sanitized_text

                    flow.request.content = json.dumps(body_json_clean).encode("utf-8")
                    flow.request.headers["content-length"] = str(len(flow.request.content))

        flow.metadata[_PROMPT_STATE_KEY] = prompt
        flow.metadata[_PLATFORM_KEY]     = platform
        with self._lock:
            self._seen += 1

    def response(self, flow: http.HTTPFlow) -> None:
        platform = flow.metadata.get(_PLATFORM_KEY)
        prompt   = flow.metadata.get(_PROMPT_STATE_KEY, "")

        if not platform:
            return

        body_bytes = self._read_body(flow.response)
        if not body_bytes:
            return

        try:
            body_json = json.loads(body_bytes)
        except (json.JSONDecodeError, ValueError):
            return

        response_text = extract_response_text(body_json, platform)

        if self.cfg.LOG_BODIES:
            log.debug("RESPONSE [%s]: %.300s", platform, response_text)

        if not response_text and not prompt:
            return

        result = scan_full(prompt, response_text, self.cfg.POLICY_THRESHOLD)

        if result.threat_types or result.risk_level not in ("safe",):
            self._report(
                platform      = platform,
                prompt        = prompt,
                response      = response_text,
                prompt_result = None,
                resp_result   = None,
                merged_result = result,
            )

        if not self.cfg.DRY_RUN and result.action == "blocked" and result.risk_level == "critical":
            warning_body = json.dumps({
                "error": "Response blocked by AI Response Guardian",
                "threats": result.threat_types,
                "risk_level": result.risk_level,
                "message": "This AI response was identified as potentially harmful and has been blocked. Contact your security team.",
            })
            flow.response.content = warning_body.encode("utf-8")
            flow.response.headers["content-type"] = "application/json"
            flow.response.headers["content-length"] = str(len(flow.response.content))
            flow.response.headers.pop("content-encoding", None)

    def done(self) -> None:
        log.info("Guardian proxy shutting down. Reporter stats: %s", self.reporter.stats)
        self.reporter.stop()

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _read_body(self, msg) -> bytes:
        try:
            content = msg.content
            if not content:
                return b""
            if len(content) > self.cfg.MAX_BODY_BYTES:
                log.debug("Body too large (%d bytes) — skipping scan", len(content))
                return b""
            return content
        except Exception as e:
            log.debug("Could not read body: %s", e)
            return b""

    def _report(self, platform, prompt, response, prompt_result, resp_result, merged_result=None) -> None:
        if self.cfg.DRY_RUN:
            log.info(
                "[DRY RUN] Would report: platform=%s risk=%s threats=%s",
                platform,
                (merged_result or prompt_result).risk_level if (merged_result or prompt_result) else "?",
                (merged_result or prompt_result).threat_types if (merged_result or prompt_result) else [],
            )
            return

        result = merged_result or prompt_result
        if not result:
            return

        prompt_preview   = prompt[:500]   if prompt   else None
        response_preview = response[:500] if response else None

        payload = IncidentPayload(
            aiPlatform      = platform,
            riskLevel       = result.risk_level,
            action          = result.action,
            threatTypes     = result.threat_types,
            promptPreview   = prompt_preview,
            responsePreview = response_preview,
            sanitized       = bool(result.sanitized_text),
            deviceId        = self.cfg.DEVICE_ID,
        )
        self.reporter.report(payload)


# ── mitmproxy entrypoint ───────────────────────────────────────────────────────

_addon_instance: GuardianAddon | None = None


def load(loader):
    loader.add_option(
        name     = "guardian_config",
        typespec = str,
        default  = ".env",
        help     = "Path to Guardian proxy .env config file",
    )


def running():
    global _addon_instance
    env_file = getattr(ctx.options, "guardian_config", ".env")
    cfg = Config.load(env_file)

    import logging as _logging
    _logging.basicConfig(
        level   = getattr(_logging, cfg.LOG_LEVEL, _logging.INFO),
        format  = "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt = "%H:%M:%S",
    )
    _addon_instance = GuardianAddon(cfg)


def request(flow: http.HTTPFlow):
    if _addon_instance:
        _addon_instance.request(flow)


def response(flow: http.HTTPFlow):
    if _addon_instance:
        _addon_instance.response(flow)


def done():
    if _addon_instance:
        _addon_instance.done()
