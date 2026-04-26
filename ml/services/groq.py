"""Wrapper Groq — texte (Llama 3.3) et vision (Llama 4 Scout).

Free tier Groq Cloud. Gère le parse JSON tolérant + retry simple.
"""

import base64
import json
import logging
import os
import re
import time
from typing import Optional

from openai import OpenAI

logger = logging.getLogger(__name__)

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
TEXT_MODEL = os.environ.get("GROQ_TEXT_MODEL", "llama-3.3-70b-versatile")
VISION_MODEL = os.environ.get("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")

_client: Optional[OpenAI] = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY not set")
        _client = OpenAI(api_key=api_key, base_url=GROQ_BASE_URL)
    return _client


def _strip_json_fence(content: str) -> str:
    content = content.strip()
    content = re.sub(r"^```(?:json)?\s*", "", content)
    content = re.sub(r"\s*```$", "", content)
    return content.strip()


def chat_json(system: str, user: str, *, model: str = TEXT_MODEL,
              temperature: float = 0.1, max_tokens: int = 400,
              max_retries: int = 2) -> dict:
    """Appel chat avec retry et parse JSON tolérant. Renvoie {} si tout échoue."""
    client = get_client()
    last_err: Optional[Exception] = None
    for attempt in range(max_retries + 1):
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=12,
                response_format={"type": "json_object"},
            )
            content = resp.choices[0].message.content or ""
            return json.loads(_strip_json_fence(content))
        except json.JSONDecodeError as exc:
            last_err = exc
            logger.warning("groq json parse failed (attempt %d): %s", attempt, exc)
        except Exception as exc:
            last_err = exc
            logger.warning("groq call failed (attempt %d): %s", attempt, exc)
            time.sleep(0.5 * (attempt + 1))
    logger.error("groq exhausted retries: %s", last_err)
    return {}


def vision_json(system: str, user: str, image_bytes: bytes, *,
                mime: str = "image/jpeg", max_tokens: int = 400) -> dict:
    """Appel vision avec image en data URL. Renvoie {} en cas d'échec."""
    client = get_client()
    b64 = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"
    try:
        resp = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
            temperature=0.1,
            max_tokens=max_tokens,
            timeout=20,
            response_format={"type": "json_object"},
        )
        content = resp.choices[0].message.content or ""
        return json.loads(_strip_json_fence(content))
    except json.JSONDecodeError as exc:
        logger.warning("groq vision json parse failed: %s", exc)
    except Exception as exc:
        logger.warning("groq vision call failed: %s", exc)
    return {}
