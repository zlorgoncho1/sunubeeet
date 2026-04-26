"""Transcription audio via Deepgram (free tier, modèle nova-2 français).

Accepte soit une URL signée (cas standard côté Laravel), soit des bytes
en base64 (fallback / appel direct depuis le frontend hackathon).
"""

import logging
import os
from typing import Optional

import requests

logger = logging.getLogger(__name__)

DEEPGRAM_URL = "https://api.deepgram.com/v1/listen"
TIMEOUT = 20


def _api_key() -> str:
    key = os.environ.get("DEEPGRAM_API_KEY", "").strip()
    if not key:
        raise RuntimeError("DEEPGRAM_API_KEY not set")
    return key


def transcribe_url(media_url: str, language: str = "fr") -> dict:
    """Deepgram pull mode : Deepgram télécharge depuis l'URL signée."""
    headers = {
        "Authorization": f"Token {_api_key()}",
        "Content-Type": "application/json",
    }
    params = {"model": "nova-2", "language": language, "smart_format": "true"}
    resp = requests.post(
        DEEPGRAM_URL, headers=headers, params=params,
        json={"url": media_url}, timeout=TIMEOUT,
    )
    resp.raise_for_status()
    return _parse(resp.json(), language)


def transcribe_bytes(audio_bytes: bytes, language: str = "fr",
                     content_type: str = "audio/webm") -> dict:
    headers = {
        "Authorization": f"Token {_api_key()}",
        "Content-Type": content_type,
    }
    params = {"model": "nova-2", "language": language, "smart_format": "true"}
    resp = requests.post(
        DEEPGRAM_URL, headers=headers, params=params,
        data=audio_bytes, timeout=TIMEOUT,
    )
    resp.raise_for_status()
    return _parse(resp.json(), language)


def _parse(payload: dict, language: str) -> dict:
    results = payload.get("results", {})
    channels = results.get("channels", [])
    if not channels:
        return {"text": "", "language": language, "confidence": 0.0,
                "duration_seconds": payload.get("metadata", {}).get("duration")}
    alts = channels[0].get("alternatives", [])
    if not alts:
        return {"text": "", "language": language, "confidence": 0.0,
                "duration_seconds": payload.get("metadata", {}).get("duration")}
    best = alts[0]
    return {
        "text": (best.get("transcript") or "").strip(),
        "language": language,
        "confidence": float(best.get("confidence", 0.0)),
        "duration_seconds": payload.get("metadata", {}).get("duration"),
    }
