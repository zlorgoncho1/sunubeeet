"""Pydantic schemas — contrats d'API du microservice ml/.

Tous les endpoints sont stateless. ml/ ne possède pas de données :
Laravel reste source de vérité, ml/ est un service de calcul.
"""

from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator


# Taxonomie alignée sur prompt/TYPES.md §3.2 (AlerteCategory) et §3.4 (Severity).
# Source de vérité : frontend/src/lib/types/index.ts.
Category = Literal[
    "health", "security", "crowd", "access_blocked",
    "fire_danger", "lost_found", "logistics", "transport", "other",
]
Severity = Literal["low", "medium", "high", "critical"]


# ─── /v1/classify ──────────────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=4000)
    declared_category: Optional[Category] = None
    transcription: Optional[str] = Field(None, max_length=8000)


class ClassifyResponse(BaseModel):
    category: Category
    severity: Severity
    category_coherence: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    summary: str
    justification: str


# ─── /v1/embed + /v1/dedup ─────────────────────────────────────────────────

class EmbedRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1, max_length=64)

    @field_validator("texts")
    @classmethod
    def _no_empty(cls, v: List[str]) -> List[str]:
        if any(not t.strip() for t in v):
            raise ValueError("texts must not contain empty strings")
        return v


class EmbedResponse(BaseModel):
    model: str
    dim: int
    vectors: List[List[float]]


class DedupNeighbor(BaseModel):
    id: str
    text: str


class DedupRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    neighbors: List[DedupNeighbor] = Field(default_factory=list, max_length=64)
    threshold: float = Field(0.78, ge=0.0, le=1.0)


class DedupMatch(BaseModel):
    id: str
    similarity: float


class DedupResponse(BaseModel):
    is_duplicate: bool
    best_match: Optional[DedupMatch]
    matches: List[DedupMatch]


# ─── /v1/vision/blur-faces ─────────────────────────────────────────────────

class MediaInput(BaseModel):
    """Une image, soit par URL signée, soit par base64."""
    media_url: Optional[str] = None
    media_base64: Optional[str] = None

    @field_validator("media_base64")
    @classmethod
    def _exclusive(cls, v, info):
        if v is None and info.data.get("media_url") is None:
            raise ValueError("media_url or media_base64 required")
        return v


class BlurFacesResponse(BaseModel):
    faces_found: int
    blurred_base64: str
    width: int
    height: int


# ─── /v1/vision/analyze ────────────────────────────────────────────────────

class AnalyzeImageRequest(MediaInput):
    category_hint: Optional[Category] = None


class AnalyzeImageResponse(BaseModel):
    tags: List[str]
    fire_or_smoke: bool
    crowd_density: Literal["none", "low", "medium", "high"]
    danger_level: Severity
    description: str
    confidence: float = Field(..., ge=0.0, le=1.0)


# ─── /v1/transcribe ────────────────────────────────────────────────────────

class TranscribeRequest(BaseModel):
    media_url: Optional[str] = None
    audio_base64: Optional[str] = None
    language: str = "fr"

    @field_validator("audio_base64")
    @classmethod
    def _exclusive(cls, v, info):
        if v is None and info.data.get("media_url") is None:
            raise ValueError("media_url or audio_base64 required")
        return v


class TranscribeResponse(BaseModel):
    text: str
    language: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    duration_seconds: Optional[float] = None
