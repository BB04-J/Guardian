"""
platforms.py — Maps intercepted traffic to known AI platform identifiers.
Used to tag incidents with the source AI service.
"""

from __future__ import annotations
import re
from typing import Optional


# Maps (hostname_pattern, path_pattern) → platform_id
# Order matters: more specific entries first.
_PLATFORM_MAP: list[tuple[re.Pattern, re.Pattern | None, str]] = [
    # OpenAI / ChatGPT
    (re.compile(r'(api\.openai\.com|chat\.openai\.com)'),
     None, "chatgpt"),

    # Anthropic / Claude
    (re.compile(r'(api\.anthropic\.com|claude\.ai)'),
     None, "claude"),

    # Google Gemini
    (re.compile(r'(generativelanguage\.googleapis\.com|gemini\.google\.com|bard\.google\.com)'),
     None, "gemini"),

    # Microsoft Copilot / Azure OpenAI
    (re.compile(r'(copilot\.microsoft\.com|sydney\.bing\.com)'),
     None, "copilot"),
    (re.compile(r'\.openai\.azure\.com'),
     None, "copilot"),

    # GitHub Copilot (VS Code extension calls)
    (re.compile(r'(githubcopilot\.com|copilot-proxy\.githubusercontent\.com|api\.githubcopilot\.com)'),
     None, "copilot"),

    # Mistral AI
    (re.compile(r'api\.mistral\.ai'),
     None, "other"),

    # Cohere
    (re.compile(r'api\.cohere\.ai'),
     None, "other"),

    # Hugging Face Inference API
    (re.compile(r'api-inference\.huggingface\.co'),
     None, "other"),

    # Perplexity
    (re.compile(r'(perplexity\.ai|api\.perplexity\.ai)'),
     None, "other"),

    # Grok / xAI
    (re.compile(r'(grok\.x\.ai|api\.x\.ai)'),
     None, "other"),

    # Together AI, Replicate etc.
    (re.compile(r'(api\.together\.xyz|api\.replicate\.com)'),
     None, "other"),
]

# Request path patterns that indicate an actual inference call (not auth/ping)
_INFERENCE_PATHS = re.compile(
    r'/(v\d+/)?(chat/completions|completions|messages|generate|stream|inference|predict)',
    re.IGNORECASE,
)


def identify_platform(host: str, path: str = "") -> Optional[str]:
    """
    Returns the platform id string if the host/path is a known AI API endpoint,
    otherwise returns None (meaning we should NOT intercept/report this request).
    """
    host = host.lower().split(":")[0]   # strip port
    for host_pat, path_pat, platform_id in _PLATFORM_MAP:
        if host_pat.search(host):
            if path_pat is None or path_pat.search(path):
                return platform_id
    return None


def is_inference_request(path: str) -> bool:
    """
    True if the request path looks like an actual model inference endpoint
    (vs. auth, account, billing, etc.)
    """
    return bool(_INFERENCE_PATHS.search(path))


def extract_prompt_from_body(body: dict, platform: str) -> str:
    """
    Extract the user-facing prompt text from the JSON request body,
    handling different API formats across platforms.
    """
    if not body:
        return ""

    # OpenAI / Anthropic messages format: {"messages": [...]}
    messages = body.get("messages", [])
    if messages:
        parts = []
        for msg in messages:
            role    = msg.get("role", "")
            content = msg.get("content", "")
            if isinstance(content, list):
                # Anthropic multimodal: content is list of {"type":"text","text":"..."}
                text = " ".join(
                    block.get("text", "")
                    for block in content
                    if isinstance(block, dict) and block.get("type") == "text"
                )
            else:
                text = str(content)
            if role in ("user", "human") and text:
                parts.append(text)
        return "\n".join(parts)

    # Older completions API: {"prompt": "..."}
    if "prompt" in body:
        return str(body["prompt"])

    # Cohere / other: {"text": "..."}
    if "text" in body:
        return str(body["text"])

    return ""


def extract_response_text(body: dict, platform: str) -> str:
    """
    Extract AI-generated response text from the JSON response body.
    Handles OpenAI, Anthropic, and generic formats.
    """
    if not body:
        return ""

    # OpenAI format: choices[0].message.content  OR  choices[0].text
    choices = body.get("choices", [])
    if choices:
        first = choices[0]
        if isinstance(first, dict):
            msg = first.get("message", {})
            if isinstance(msg, dict) and msg.get("content"):
                return str(msg["content"])
            if first.get("text"):
                return str(first["text"])
            if first.get("delta", {}).get("content"):
                return str(first["delta"]["content"])

    # Anthropic format: content[0].text
    content = body.get("content", [])
    if content and isinstance(content, list):
        texts = [
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ]
        return "\n".join(t for t in texts if t)

    # Cohere / generic
    for key in ("text", "generation", "output", "response"):
        if body.get(key):
            return str(body[key])

    return ""
