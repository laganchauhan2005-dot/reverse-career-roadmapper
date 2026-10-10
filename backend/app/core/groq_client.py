from __future__ import annotations
from groq import Groq, APIStatusError, APITimeoutError, RateLimitError
from app.core.config import get_settings
import json
import re

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        settings = get_settings()
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def _extract_json(text: str) -> dict:
    """Extract the first JSON object from a text that may have prose around it."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Find first { ... } block
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    raise ValueError(f"Could not extract valid JSON from model response:\n{text[:500]}")


def chat_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> dict:
    """Call the Groq API and return parsed JSON. Raises on failure."""
    settings = get_settings()
    client = _get_client()

    try:
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = response.choices[0].message.content or ""
        return _extract_json(content)

    except RateLimitError as e:
        raise RuntimeError(f"Groq rate limit reached. Please wait a moment and try again. ({e})") from e
    except APITimeoutError as e:
        raise RuntimeError(f"Groq API request timed out. Please try again. ({e})") from e
    except APIStatusError as e:
        raise RuntimeError(f"Groq API error {e.status_code}: {e.message}") from e


def chat_text(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.5,
    max_tokens: int = 2048,
) -> str:
    """Call the Groq API and return plain text. Raises on failure."""
    settings = get_settings()
    client = _get_client()

    try:
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    except RateLimitError as e:
        raise RuntimeError(f"Groq rate limit reached. Please wait a moment and try again. ({e})") from e
    except APITimeoutError as e:
        raise RuntimeError(f"Groq API request timed out. Please try again. ({e})") from e
    except APIStatusError as e:
        raise RuntimeError(f"Groq API error {e.status_code}: {e.message}") from e
