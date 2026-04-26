"""POST /v1/embed et POST /v1/dedup — anti-spam sémantique.

Complète le `AntiSpamService` Laravel (qui ne fait que spatio-temporel).
Laravel envoie le texte + les voisins spatio-temporels candidats, ml/
renvoie les similarités cosinus. Source de vérité = Laravel.
"""

import logging

import numpy as np
from fastapi import APIRouter

from ml.schemas import (
    DedupMatch,
    DedupRequest,
    DedupResponse,
    EmbedRequest,
    EmbedResponse,
)
from ml.services.embeddings import MODEL_NAME, embed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["dedup"])


@router.post("/embed", response_model=EmbedResponse)
async def embed_endpoint(req: EmbedRequest) -> EmbedResponse:
    vecs = embed(req.texts)
    return EmbedResponse(
        model=MODEL_NAME,
        dim=int(vecs.shape[1]),
        vectors=vecs.astype(float).tolist(),
    )


@router.post("/dedup", response_model=DedupResponse)
async def dedup_endpoint(req: DedupRequest) -> DedupResponse:
    if not req.neighbors:
        return DedupResponse(is_duplicate=False, best_match=None, matches=[])

    texts = [req.text] + [n.text for n in req.neighbors]
    vecs = embed(texts)
    query, others = vecs[0], vecs[1:]
    sims = others @ query  # cosine, vecs L2-normés
    pairs = sorted(
        ((req.neighbors[i].id, float(sims[i])) for i in range(len(req.neighbors))),
        key=lambda p: p[1],
        reverse=True,
    )
    matches = [DedupMatch(id=i, similarity=s) for i, s in pairs]
    best = matches[0] if matches else None
    is_dup = best is not None and best.similarity >= req.threshold
    return DedupResponse(is_duplicate=is_dup, best_match=best, matches=matches)
