"""
reporter.py — Asynchronously posts detected incidents to the Guardian backend API.

Uses a background thread + queue so the proxy never blocks on network I/O to
the backend. Incidents are batched in memory and retried on transient failures.
"""

from __future__ import annotations

import json
import logging
import os
import queue
import threading
import time
import urllib.request
import urllib.error
from dataclasses import asdict, dataclass, field
from typing import Optional


log = logging.getLogger("guardian.reporter")


# ── Incident payload dataclass ─────────────────────────────────────────────────

@dataclass
class IncidentPayload:
    aiPlatform:      str
    riskLevel:       str
    action:          str
    threatTypes:     list[str]        = field(default_factory=list)
    userId:          Optional[str]    = None
    department:      Optional[str]    = None
    promptPreview:   Optional[str]    = None
    responsePreview: Optional[str]    = None
    sanitized:       bool             = False
    deviceId:        Optional[str]    = None


# ── Reporter ───────────────────────────────────────────────────────────────────

class GuardianReporter:
    """
    Thread-safe incident reporter.
    Enqueues incidents and dispatches them from a background worker thread.
    """

    def __init__(
        self,
        backend_url:  str,
        proxy_secret: str,
        max_retries:  int   = 3,
        retry_delay:  float = 2.0,
        queue_maxsize: int  = 500,
    ):
        self._url         = backend_url.rstrip("/") + "/api/incidents"
        self._secret      = proxy_secret
        self._max_retries = max_retries
        self._retry_delay = retry_delay
        self._queue: queue.Queue[IncidentPayload] = queue.Queue(maxsize=queue_maxsize)
        self._running     = True
        self._stats       = {"sent": 0, "failed": 0, "queued": 0}

        self._thread = threading.Thread(
            target=self._worker,
            name="guardian-reporter",
            daemon=True,
        )
        self._thread.start()
        log.info("GuardianReporter started → %s", self._url)

    def report(self, payload: IncidentPayload) -> None:
        """Non-blocking enqueue. Drops silently if queue is full."""
        try:
            self._queue.put_nowait(payload)
            self._stats["queued"] += 1
        except queue.Full:
            log.warning("Reporter queue full — incident dropped (platform=%s risk=%s)",
                        payload.aiPlatform, payload.riskLevel)

    def stop(self, timeout: float = 5.0) -> None:
        self._running = False
        try:
            self._queue.put_nowait(None)  # sentinel
        except queue.Full:
            pass
        self._thread.join(timeout=timeout)
        log.info("GuardianReporter stopped. Stats: %s", self._stats)

    # ── Worker thread ──────────────────────────────────────────────────────────

    def _worker(self) -> None:
        while self._running:
            try:
                item = self._queue.get(timeout=1.0)
            except queue.Empty:
                continue

            if item is None:
                break

            self._send_with_retry(item)
            self._queue.task_done()

    def _send_with_retry(self, payload: IncidentPayload) -> None:
        body = json.dumps(asdict(payload)).encode("utf-8")
        headers = {
            "Content-Type":  "application/json",
            "X-Proxy-Key":   self._secret,
            "User-Agent":    "guardian-proxy/1.0",
        }

        for attempt in range(1, self._max_retries + 1):
            try:
                req = urllib.request.Request(
                    self._url,
                    data=body,
                    headers=headers,
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    if resp.status in (200, 201):
                        self._stats["sent"] += 1
                        log.debug("Incident reported → %s %s (attempt %d)",
                                  payload.riskLevel, payload.aiPlatform, attempt)
                        return
                    log.warning("Backend returned %d on attempt %d", resp.status, attempt)

            except urllib.error.HTTPError as e:
                log.warning("HTTP %d from backend (attempt %d/%d): %s",
                            e.code, attempt, self._max_retries, e.reason)
                if e.code in (400, 401, 403):
                    # Not worth retrying client errors
                    self._stats["failed"] += 1
                    return

            except (urllib.error.URLError, OSError, TimeoutError) as e:
                log.warning("Network error on attempt %d/%d: %s", attempt, self._max_retries, e)

            if attempt < self._max_retries:
                time.sleep(self._retry_delay * attempt)

        self._stats["failed"] += 1
        log.error("Failed to report incident after %d attempts (platform=%s risk=%s)",
                  self._max_retries, payload.aiPlatform, payload.riskLevel)

    @property
    def stats(self) -> dict:
        return dict(self._stats, queue_size=self._queue.qsize())
