"""Récupère un media (image ou audio) depuis URL signée ou base64."""

import base64
import logging
from typing import Optional

import requests

logger = logging.getLogger(__name__)

MAX_BYTES = 20 * 1024 * 1024  # 20 MB hard cap


def fetch_bytes(media_url: Optional[str], media_base64: Optional[str]) -> bytes:
    """Renvoie les bytes du media. Lève ValueError si invalide / trop gros."""
    if media_base64:
        try:
            data = base64.b64decode(media_base64, validate=False)
        except Exception as exc:
            raise ValueError(f"invalid base64: {exc}") from exc
        if len(data) > MAX_BYTES:
            raise ValueError(f"media too large: {len(data)} bytes")
        return data

    if not media_url:
        raise ValueError("media_url or media_base64 required")

    resp = requests.get(media_url, timeout=15, stream=True)
    resp.raise_for_status()
    data = b""
    for chunk in resp.iter_content(chunk_size=64 * 1024):
        data += chunk
        if len(data) > MAX_BYTES:
            raise ValueError(f"media too large: > {MAX_BYTES} bytes")
    return data
