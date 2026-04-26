"""Bët ML — point d'entrée FastAPI.

Microservice stateless de calcul. 6 endpoints sous /v1 :
  GET  /v1/health
  POST /v1/classify          (Groq texte)
  POST /v1/embed             (sentence-transformers)
  POST /v1/dedup             (sentence-transformers + cosine)
  POST /v1/transcribe        (Deepgram)
  POST /v1/vision/blur-faces (OpenCV Haar)
  POST /v1/vision/analyze    (Groq Llama-4 Scout vision)

Aucun état persistant. Laravel reste source de vérité.
"""

import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path, override=False)

# Permet `python -m ml.api.app` depuis n'importe où.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from ml.api.routes import classify, dedup, health, transcribe, vision  # noqa: E402

app = FastAPI(
    title="Bët ML",
    description="Microservice ML stateless — JOJ Dakar 2026.",
    version="2.0.0",
)

cors_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

for r in (health.router, classify.router, dedup.router, transcribe.router, vision.router):
    app.include_router(r)


@app.on_event("startup")
async def _startup() -> None:
    logger.info("Bët ML v2.0.0 ready (groq=%s, deepgram=%s)",
                bool(os.environ.get("GROQ_API_KEY")),
                bool(os.environ.get("DEEPGRAM_API_KEY")))
    if os.environ.get("WARM_EMBEDDINGS", "false").lower() == "true":
        from ml.services.embeddings import get_model
        get_model()


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("ml.api.app:app", host="0.0.0.0", port=port, reload=False)
