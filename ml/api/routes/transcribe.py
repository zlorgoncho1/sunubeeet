"""POST /v1/transcribe — Deepgram nova-2 (free tier)."""

import base64
import logging

from fastapi import APIRouter, HTTPException

from ml.schemas import TranscribeRequest, TranscribeResponse
from ml.services import transcription as tx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["transcribe"])


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(req: TranscribeRequest) -> TranscribeResponse:
    try:
        if req.media_url:
            result = tx.transcribe_url(req.media_url, language=req.language)
        else:
            audio_bytes = base64.b64decode(req.audio_base64 or "", validate=False)
            result = tx.transcribe_bytes(audio_bytes, language=req.language)
    except RuntimeError as exc:
        # Clé manquante
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("transcription failed")
        raise HTTPException(status_code=502, detail=f"transcription failed: {exc}") from exc

    return TranscribeResponse(**result)
