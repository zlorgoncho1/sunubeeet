"""POST /v1/classify — catégorie + sévérité zero-shot via Groq."""

import logging

from fastapi import APIRouter, HTTPException

from ml.schemas import ClassifyRequest, ClassifyResponse
from ml.services.groq import chat_json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["classify"])

VALID_CATS = {
    "health", "security", "crowd", "access_blocked",
    "fire_danger", "lost_found", "logistics", "transport", "other",
}
VALID_SEV = {"low", "medium", "high", "critical"}

SYSTEM = """Tu es expert en gestion de crise pour les Jeux Olympiques de la Jeunesse Dakar 2026.
Tu reçois la déclaration d'un spectateur (description écrite + transcription audio + catégorie déclarée).
Ton job : valider la catégorie réelle et estimer la sévérité.

Catégories valides (anglais, exactement) :
  health, security, crowd, access_blocked, fire_danger, lost_found, logistics, transport, other.
Sévérités valides : low, medium, high, critical.

Réponds STRICTEMENT au format JSON :
{
  "category": "health|security|crowd|access_blocked|fire_danger|lost_found|logistics|transport|other",
  "severity": "low|medium|high|critical",
  "category_coherence": 0.0-1.0,
  "confidence": 0.0-1.0,
  "summary": "1-2 phrases factuelles, présent",
  "justification": "1 phrase justifiant la sévérité retenue"
}

Règles :
- Si la catégorie déclarée contredit la description, baisse category_coherence (<0.4).
- "critical" = vie en danger immédiat, "high" = besoin intervention rapide,
  "medium" = à traiter, "low" = informatif.
- Reste sobre, jamais alarmiste sans signal explicite."""


@router.post("/classify", response_model=ClassifyResponse)
async def classify(req: ClassifyRequest) -> ClassifyResponse:
    user = (
        f"Catégorie déclarée : {req.declared_category or 'non déclarée'}\n\n"
        f"Description :\n{req.description}\n\n"
        f"Transcription audio :\n{req.transcription or '[aucune]'}"
    )
    result = chat_json(SYSTEM, user, max_tokens=400)
    if not result:
        raise HTTPException(status_code=502, detail="LLM unavailable")

    cat = result.get("category")
    sev = result.get("severity")
    if cat not in VALID_CATS or sev not in VALID_SEV:
        logger.warning("invalid LLM output: %s", result)
        raise HTTPException(status_code=502, detail="LLM returned invalid taxonomy")

    return ClassifyResponse(
        category=cat,
        severity=sev,
        category_coherence=float(max(0.0, min(1.0, result.get("category_coherence", 0.5)))),
        confidence=float(max(0.0, min(1.0, result.get("confidence", 0.5)))),
        summary=str(result.get("summary", ""))[:400],
        justification=str(result.get("justification", ""))[:400],
    )
