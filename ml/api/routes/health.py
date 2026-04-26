"""GET /v1/health — pour les checks compose / k8s."""

import os

from fastapi import APIRouter

router = APIRouter(prefix="/v1", tags=["health"])


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "services": {
            "groq": bool(os.environ.get("GROQ_API_KEY")),
            "deepgram": bool(os.environ.get("DEEPGRAM_API_KEY")),
        },
    }
