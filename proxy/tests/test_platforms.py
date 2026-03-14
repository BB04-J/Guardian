"""tests/test_platforms.py — Unit tests for the platform detector."""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from guardian_proxy.platforms import (
    identify_platform, is_inference_request,
    extract_prompt_from_body, extract_response_text,
)


class TestIdentifyPlatform:
    def test_openai_api(self):
        assert identify_platform("api.openai.com", "/v1/chat/completions") == "chatgpt"

    def test_anthropic_api(self):
        assert identify_platform("api.anthropic.com", "/v1/messages") == "claude"

    def test_gemini_api(self):
        assert identify_platform("generativelanguage.googleapis.com", "/v1beta/models") == "gemini"

    def test_github_copilot(self):
        assert identify_platform("api.githubcopilot.com", "/v1/chat/completions") == "copilot"

    def test_unknown_host_returns_none(self):
        assert identify_platform("google.com", "/search") is None

    def test_banking_site_returns_none(self):
        assert identify_platform("netbanking.sbi.co.in", "/login") is None


class TestIsInferencePath:
    def test_chat_completions(self):
        assert is_inference_request("/v1/chat/completions") is True

    def test_messages(self):
        assert is_inference_request("/v1/messages") is True

    def test_generate(self):
        assert is_inference_request("/generate") is True

    def test_account_page(self):
        assert is_inference_request("/account/billing") is False

    def test_auth_endpoint(self):
        assert is_inference_request("/v1/auth/token") is False


class TestExtractPrompt:
    def test_openai_messages_format(self):
        body = {
            "model": "gpt-4",
            "messages": [
                {"role": "system", "content": "You are helpful."},
                {"role": "user",   "content": "What is 2+2?"},
            ]
        }
        result = extract_prompt_from_body(body, "chatgpt")
        assert "What is 2+2?" in result

    def test_anthropic_multimodal_content(self):
        body = {
            "model": "claude-3",
            "messages": [
                {"role": "user", "content": [{"type": "text", "text": "Explain quantum computing"}]}
            ]
        }
        result = extract_prompt_from_body(body, "claude")
        assert "quantum computing" in result

    def test_legacy_completions_format(self):
        body = {"prompt": "Once upon a time"}
        result = extract_prompt_from_body(body, "chatgpt")
        assert result == "Once upon a time"

    def test_empty_body(self):
        assert extract_prompt_from_body({}, "chatgpt") == ""
        assert extract_prompt_from_body(None, "chatgpt") == ""


class TestExtractResponse:
    def test_openai_response(self):
        body = {
            "choices": [{"message": {"role": "assistant", "content": "The answer is 4."}}]
        }
        result = extract_response_text(body, "chatgpt")
        assert "The answer is 4." in result

    def test_anthropic_response(self):
        body = {
            "content": [{"type": "text", "text": "Quantum computing uses qubits."}]
        }
        result = extract_response_text(body, "claude")
        assert "Quantum computing uses qubits." in result

    def test_empty_response(self):
        assert extract_response_text({}, "chatgpt") == ""
