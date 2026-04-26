"""POST /v1/vision/blur-faces et POST /v1/vision/analyze.

- blur-faces : OpenCV Haar cascade, flou ciblé sur visages.
- analyze    : Groq Llama-4 Scout (vision, free tier) — tags + dangers.
"""

import base64
import logging

from fastapi import APIRouter, HTTPException

from ml.schemas import (
    AnalyzeImageRequest,
    AnalyzeImageResponse,
    BlurFacesResponse,
    MediaInput,
)
from ml.services.face_blur import detect_and_blur
from ml.services.groq import vision_json
from ml.services.storage import fetch_bytes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/vision", tags=["vision"])


@router.post("/blur-faces", response_model=BlurFacesResponse)
async def blur_faces(req: MediaInput) -> BlurFacesResponse:
    try:
        data = fetch_bytes(req.media_url, req.media_base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    try:
        jpeg, boxes, w, h = detect_and_blur(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return BlurFacesResponse(
        faces_found=len(boxes),
        blurred_base64=base64.b64encode(jpeg).decode("ascii"),
        width=w,
        height=h,
    )


SYSTEM_VISION = """Tu analyses une photo d'incident soumise par un spectateur d'un grand événement (JOJ Dakar 2026).
La photo a déjà été passée par un floutage de visages — ne commente jamais l'identité des personnes.

Renvoie STRICTEMENT le JSON suivant (aucun markdown) :
{
  "tags": ["tag1", "tag2", ...],
  "fire_or_smoke": true|false,
  "crowd_density": "none|low|medium|high",
  "danger_level": "low|medium|high|critical",
  "description": "1-2 phrases factuelles, présent",
  "confidence": 0.0-1.0
}

Tags = mots-clés visuels concrets (ex: "smoke", "blood", "barrier", "emergency_exit").
danger_level reflète ce que tu vois, pas la catégorie déclarée."""


@router.post("/analyze", response_model=AnalyzeImageResponse)
async def analyze(req: AnalyzeImageRequest) -> AnalyzeImageResponse:
    try:
        data = fetch_bytes(req.media_url, req.media_base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    user = (
        f"Catégorie déclarée par le spectateur : {req.category_hint or 'non déclarée'}.\n"
        "Analyse l'image et renvoie le JSON strict."
    )
    result = vision_json(SYSTEM_VISION, user, data, mime="image/jpeg")
    if not result:
        raise HTTPException(status_code=502, detail="vision LLM unavailable")

    tags = result.get("tags") or []
    if not isinstance(tags, list):
        tags = []
    density = result.get("crowd_density")
    if density not in {"none", "low", "medium", "high"}:
        density = "none"
    danger = result.get("danger_level")
    if danger not in {"low", "medium", "high", "critical"}:
        danger = "medium"

    return AnalyzeImageResponse(
        tags=[str(t)[:40] for t in tags][:12],
        fire_or_smoke=bool(result.get("fire_or_smoke", False)),
        crowd_density=density,
        danger_level=danger,
        description=str(result.get("description", ""))[:400],
        confidence=float(max(0.0, min(1.0, result.get("confidence", 0.5)))),
    )
