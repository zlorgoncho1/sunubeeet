"""Embeddings multilingues via sentence-transformers.

Modèle : `paraphrase-multilingual-MiniLM-L12-v2` (384 dim, ~120 Mo, FR/Wolof/EN).
Téléchargé automatiquement par sentence-transformers au premier appel.
Singleton lazy, CPU only (suffisant pour la charge hackathon).
"""

import logging
import os
from typing import List, Optional

import numpy as np

logger = logging.getLogger(__name__)

MODEL_NAME = os.environ.get(
    "EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

_model = None


def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        logger.info("loading embedding model: %s", MODEL_NAME)
        _model = SentenceTransformer(MODEL_NAME, device="cpu")
        logger.info("embedding model ready (dim=%d)", _model.get_sentence_embedding_dimension())
    return _model


def embed(texts: List[str]) -> np.ndarray:
    """Renvoie une matrice (N, dim) L2-normalisée — cosine = produit scalaire."""
    model = get_model()
    vecs = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return vecs


def cosine_against(query_vec: np.ndarray, neighbor_vecs: np.ndarray) -> np.ndarray:
    """Vecs déjà normalisés → produit scalaire = cosine."""
    return neighbor_vecs @ query_vec
