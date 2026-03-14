"""
scanner.py — Threat detection engine for AI Response Guardian
Analyses both the PROMPT (outbound) and RESPONSE (inbound) of AI API calls.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Tuple


# ── Threat type constants ──────────────────────────────────────────────────────

class ThreatType:
    # Prompt threats (outbound / data exfiltration risk)
    PII_LEAK            = "pii_leak"
    SECRET_KEY_LEAK     = "secret_key_leak"
    SOURCE_CODE_LEAK    = "source_code_leak"
    INTERNAL_DOMAIN     = "internal_domain"
    FINANCIAL_DATA      = "financial_data"

    # Response threats (inbound / AI-generated risk)
    PROMPT_INJECTION    = "prompt_injection"
    HALLUCINATED_CRED   = "hallucinated_cred"
    CROSS_SESSION_BLEED = "cross_session_bleed"
    MALICIOUS_CODE      = "malicious_code"
    SOCIAL_ENGINEERING  = "social_engineering"
    DATA_EXFIL_ATTEMPT  = "data_exfil_attempt"
    JAILBREAK_ATTEMPT   = "jailbreak_attempt"


# ── Risk scoring ───────────────────────────────────────────────────────────────

THREAT_RISK_SCORES: dict[str, int] = {
    ThreatType.PII_LEAK:            40,
    ThreatType.SECRET_KEY_LEAK:     80,
    ThreatType.SOURCE_CODE_LEAK:    30,
    ThreatType.INTERNAL_DOMAIN:     25,
    ThreatType.FINANCIAL_DATA:      50,
    ThreatType.PROMPT_INJECTION:    90,
    ThreatType.HALLUCINATED_CRED:   85,
    ThreatType.CROSS_SESSION_BLEED: 70,
    ThreatType.MALICIOUS_CODE:      95,
    ThreatType.SOCIAL_ENGINEERING:  60,
    ThreatType.DATA_EXFIL_ATTEMPT:  75,
    ThreatType.JAILBREAK_ATTEMPT:   65,
}


def score_to_risk_level(score: int) -> str:
    if score >= 80: return "critical"
    if score >= 55: return "high"
    if score >= 30: return "medium"
    if score > 0:   return "low"
    return "safe"


# ── Scan result dataclass ──────────────────────────────────────────────────────

@dataclass
class ScanResult:
    threat_types:     List[str]  = field(default_factory=list)
    risk_score:       int        = 0
    risk_level:       str        = "safe"
    action:           str        = "allowed"
    sanitized_text:   str | None = None
    matched_snippets: List[Tuple[str, str]] = field(default_factory=list)  # (threat_type, snippet)

    def add_threat(self, threat: str, snippet: str = "") -> None:
        if threat not in self.threat_types:
            self.threat_types.append(threat)
        pts = THREAT_RISK_SCORES.get(threat, 20)
        self.risk_score = min(100, self.risk_score + pts)
        if snippet:
            self.matched_snippets.append((threat, snippet[:120]))

    def finalise(self, policy_threshold: str = "warn") -> None:
        self.risk_level = score_to_risk_level(self.risk_score)
        # Decide action based on risk and policy threshold
        if self.risk_level == "critical":
            self.action = "blocked"
        elif self.risk_level == "high":
            self.action = "blocked" if policy_threshold == "block" else "warned"
        elif self.risk_level == "medium":
            self.action = "sanitized" if self.sanitized_text else "warned"
        else:
            self.action = "allowed"


# ── Compiled regex patterns ────────────────────────────────────────────────────

_PII_PATTERNS = [
    # Email addresses
    re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b'),
    # Indian Aadhaar  (12-digit)
    re.compile(r'\b[2-9]{1}\d{11}\b'),
    # Indian PAN card
    re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b'),
    # Phone numbers (generic 10-digit, Indian)
    re.compile(r'\b(\+91[\-\s]?)?[6-9]\d{9}\b'),
    # Credit card  (Luhn patterns with separators)
    re.compile(r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b'),
    # SSN (US)
    re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    # Passport (generic)
    re.compile(r'\b[A-Z]{1,2}[0-9]{6,9}\b'),
]

_SECRET_PATTERNS = [
    # AWS access key
    re.compile(r'\bAKIA[0-9A-Z]{16}\b'),
    # AWS secret key (generic 40-char base64ish)
    re.compile(r'(?i)aws.{0,20}secret.{0,20}[\'\"]?([A-Za-z0-9/+=]{40})[\'\"]?'),
    # GitHub / GitLab tokens
    re.compile(r'\b(gh[pousr]_[A-Za-z0-9_]{36,255}|glpat-[A-Za-z0-9\-_]{20,})\b'),
    # Generic API key patterns
    re.compile(r'(?i)(api[_-]?key|secret|token|password|passwd|auth).{0,10}[\'\"]([A-Za-z0-9_\-\.]{20,})[\'"]'),
    # Anthropic / OpenAI keys
    re.compile(r'\b(sk-[A-Za-z0-9]{20,}|ant[_-][A-Za-z0-9]{20,})\b'),
    # JWT tokens
    re.compile(r'\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\b'),
    # Private key header
    re.compile(r'-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'),
]

_CODE_PATTERNS = [
    # Python imports
    re.compile(r'^import\s+\w+|^from\s+\w+\s+import', re.MULTILINE),
    # JS/TS function declarations (multiple lines)
    re.compile(r'function\s+\w+\s*\([^)]*\)\s*\{|const\s+\w+\s*=\s*\(', re.MULTILINE),
    # SQL statements
    re.compile(r'\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|DROP TABLE|ALTER TABLE)\b', re.IGNORECASE),
    # Bash/shell
    re.compile(r'\$\(|`[^`]+`|\bsudo\b|\bchmod\b|\bcurl\b.{0,60}(secret|token|password)', re.IGNORECASE),
]

_INTERNAL_DOMAIN_PATTERN = re.compile(
    r'\b(?:192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|'
    r'localhost:\d+|internal\.|corp\.|intranet\.|staging\.|dev\.)',
    re.IGNORECASE,
)

_FINANCIAL_PATTERNS = [
    # IBAN
    re.compile(r'\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b'),
    # SWIFT/BIC
    re.compile(r'\b[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?\b'),
    # Generic bank account mention
    re.compile(r'(?i)(account\s*(number|no\.?))\s*[:\-]?\s*\d{8,18}'),
    # Large amounts
    re.compile(r'(?i)(revenue|profit|salary|budget)\s*[:\-]?\s*[\$€₹]?\s*[\d,]+'),
]

# ── Response-side threat patterns ──────────────────────────────────────────────

_PROMPT_INJECTION_PATTERNS = [
    re.compile(r'(?i)(ignore\s+(previous|above|prior|all)\s+instructions?|'
               r'forget\s+(everything|what|all|your)\s+(you|i|was|were)|'
               r'new\s+instructions?\s*(follow|are|:)|'
               r'system\s+prompt\s+(is|says|override|leak|reveal)|'
               r'do\s+anything\s+now|DAN\s+mode|jailbreak|'
               r'you\s+are\s+now\s+(an?\s+)?(?!assistant|helpful))'),
]

_HALLUCINATED_CRED_PATTERNS = [
    # AI fabricating API keys in response
    re.compile(r'(?i)(here\s+(is|\'s|are)\s+(your|an?|the)\s+)?(api\s*key|secret|token|password)\s*[:\-]?\s*[\'\"]?([A-Za-z0-9_\-\.]{16,})[\'\"]?'),
    re.compile(r'\bAKIA[0-9A-Z]{16}\b'),  # AWS-like key in response
    re.compile(r'\b(sk-[A-Za-z0-9]{20,})\b'),
]

_MALICIOUS_CODE_PATTERNS = [
    re.compile(r'(?i)(exec\s*\(|eval\s*\(|subprocess\.call|os\.system|'
               r'__import__\s*\(|importlib\.import_module|'
               r'socket\.connect|reverse\s+shell|bind\s+shell|'
               r'nc\s+-[elv]+\s|\bnmap\b|\bmetasploit\b|msfvenom|'
               r'chmod\s+777|rm\s+-rf\s*/|'
               r'curl.{0,60}(sh|bash|python)\s*\||\bwget\b.{0,60}-O\s*-\s*\|)'
               ),
]

_SOCIAL_ENGINEERING_PATTERNS = [
    re.compile(r'(?i)(you\s+(should|must|need\s+to)\s+(send|give|share|provide|enter|type)\s+(your|the)\s+(password|credential|token|otp|pin)|'
               r'click\s+(this\s+)?link\s+(to\s+)?(verify|confirm|reset|update)|'
               r'(your\s+account\s+(has\s+been|is|will\s+be)\s+(suspended|locked|compromised|hacked))|'
               r'act\s+(now|immediately|urgently)|'
               r'(limited\s+time|last\s+chance)\s+(offer|to\s+save))'
               ),
]

_CROSS_SESSION_BLEED_PATTERNS = [
    # AI leaking info about another user in response
    re.compile(r'(?i)(the\s+(previous|other|last|another)\s+(user|person|customer|client)\s+(asked|said|mentioned|requested)|'
               r'from\s+(my|our)\s+previous\s+conversation|'
               r'(earlier|before)\s+(you|i)\s+(mentioned|told\s+me|said)|'
               r'(from|based\s+on)\s+(your|the)\s+(history|past\s+conversation|session))'
               ),
]

_DATA_EXFIL_PATTERNS = [
    # AI suggesting to export/send data somewhere
    re.compile(r'(?i)(send\s+(this|the|that|all).{0,30}(to|via|using)\s+(email|webhook|url|endpoint|server|api)|'
               r'POST\s+(this|the|all|your).{0,40}to\s+https?://|'
               r'exfiltrate|data\s+exfiltration|'
               r'upload.{0,30}(to|into).{0,30}(s3|bucket|cloud|ftp|sftp))'
               ),
]

# ── Sanitizer ──────────────────────────────────────────────────────────────────

def _redact(text: str, pattern: re.Pattern, replacement: str) -> str:
    return pattern.sub(replacement, text)


def sanitize_prompt(text: str) -> str:
    """Remove/mask sensitive data from outbound prompts."""
    result = text
    for p in _PII_PATTERNS:
        result = p.sub("[REDACTED-PII]", result)
    for p in _SECRET_PATTERNS:
        result = p.sub("[REDACTED-SECRET]", result)
    return result


# ── Public scan functions ──────────────────────────────────────────────────────

def scan_prompt(text: str) -> ScanResult:
    """Scan outbound prompt for data leakage threats."""
    result = ScanResult()
    if not text:
        return result

    for p in _PII_PATTERNS:
        m = p.search(text)
        if m:
            result.add_threat(ThreatType.PII_LEAK, m.group(0))

    for p in _SECRET_PATTERNS:
        m = p.search(text)
        if m:
            result.add_threat(ThreatType.SECRET_KEY_LEAK, m.group(0)[:40] + "...")

    code_hits = sum(1 for p in _CODE_PATTERNS if p.search(text))
    if code_hits >= 2:
        result.add_threat(ThreatType.SOURCE_CODE_LEAK, f"{code_hits} code patterns matched")

    if _INTERNAL_DOMAIN_PATTERN.search(text):
        m = _INTERNAL_DOMAIN_PATTERN.search(text)
        result.add_threat(ThreatType.INTERNAL_DOMAIN, m.group(0) if m else "")

    for p in _FINANCIAL_PATTERNS:
        m = p.search(text)
        if m:
            result.add_threat(ThreatType.FINANCIAL_DATA, m.group(0))

    # Sanitized copy
    if result.threat_types:
        result.sanitized_text = sanitize_prompt(text)

    return result


def scan_response(text: str) -> ScanResult:
    """Scan inbound AI response for injection, hallucinated creds, and other threats."""
    result = ScanResult()
    if not text:
        return result

    for p in _PROMPT_INJECTION_PATTERNS:
        m = p.search(text)
        if m:
            result.add_threat(ThreatType.PROMPT_INJECTION, m.group(0))

    for p in _HALLUCINATED_CRED_PATTERNS:
        m = p.search(text)
        if m:
            result.add_threat(ThreatType.HALLUCINATED_CRED, m.group(0)[:60])

    for p in _MALICIOUS_CODE_PATTERNS:
        m = p.search(text)
        if m:
            result.add_threat(ThreatType.MALICIOUS_CODE, m.group(0)[:80])

    for p in _SOCIAL_ENGINEERING_PATTERNS:
        m = p.search(text)
        if m:
            result.add_threat(ThreatType.SOCIAL_ENGINEERING, m.group(0))

    for p in _CROSS_SESSION_BLEED_PATTERNS:
        m = p.search(text)
        if m:
            result.add_threat(ThreatType.CROSS_SESSION_BLEED, m.group(0))

    for p in _DATA_EXFIL_PATTERNS:
        m = p.search(text)
        if m:
            result.add_threat(ThreatType.DATA_EXFIL_ATTEMPT, m.group(0))

    return result


def scan_full(prompt: str, response: str, policy_threshold: str = "warn") -> ScanResult:
    """
    Combined prompt + response scan.
    Merges both results and finalises action based on combined risk.
    """
    pr = scan_prompt(prompt)
    rr = scan_response(response)

    merged = ScanResult()
    for threat, snippet in pr.matched_snippets + rr.matched_snippets:
        merged.add_threat(threat, snippet)

    if pr.sanitized_text:
        merged.sanitized_text = pr.sanitized_text

    merged.finalise(policy_threshold)
    return merged
