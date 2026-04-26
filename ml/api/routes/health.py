"""
Health check endpoint
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    """
    Health check endpoint
    Retourne le statut du service
    """
    return {
        "status": "ok",
        "modeles": "pkl+groq+whisper",
        "version": "1.0.0"
    }
