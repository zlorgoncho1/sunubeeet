"""
Modèles de données pour Alertes et Incidents
Suit la structure TypeScript définie
"""

from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime


class AlerteCategory(str, Enum):
    """Catégories d'alertes"""
    MEDICAL = "medical"
    SECURITE = "securite"
    FOULE = "foule"
    TECHNIQUE = "technique"
    INCENDIE = "incendie"
    AUTRE = "autre"


class AlerteStatus(str, Enum):
    """Statuts d'alertes"""
    CREATED = "created"  # Juste créée
    PROCESSING = "processing"  # Détection redondance/IA en cours
    DUPLICATE = "duplicate"  # Redondance détectée
    VALIDATED = "validated"  # Validée par IA
    INCIDENT_CREATED = "incident_created"  # Incident créé
    REJECTED = "rejected"  # Rejetée (spam/hoax)


class IncidentStatus(str, Enum):
    """Statuts d'incidents"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Severity(str, Enum):
    """Niveaux de gravité"""
    BASSE = "basse"
    MOYENNE = "moyenne"
    HAUTE = "haute"
    CRITIQUE = "critique"


class Priority(str, Enum):
    """Priorités"""
    BASSE = "basse"
    MOYENNE = "moyenne"
    HAUTE = "haute"
    CRITIQUE = "critique"


# ============ REQUÊTE SPECTATEUR ============

class CreerAlerteRequest(BaseModel):
    """Requête du spectateur pour créer une alerte"""
    
    # Métier
    categorie: AlerteCategory
    description: Optional[str] = None
    
    # Médias
    audio_base64: Optional[str] = None
    photo_base64: Optional[str] = None
    
    # Géolocalisation
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Métadonnées spectateur
    spectateur_id: str
    client_ip: Optional[str] = None
    client_fingerprint: Optional[str] = None  # Pour anti-spam


# ============ ALERTE (BD) ============

class Alerte(BaseModel):
    """Modèle d'alerte en base de données"""
    id: str
    reference: str  # "AL-2026-0001234"
    
    # Origine
    source_user_id: str  # spectateur_id
    source_qr_id: Optional[str] = None
    
    # Métier
    categorie: AlerteCategory
    description: Optional[str] = None
    photo_media_id: Optional[str] = None
    audio_media_id: Optional[str] = None
    
    # Localisation
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    zone_id: Optional[str] = None
    
    # Statut
    status: AlerteStatus
    incident_id: Optional[str] = None  # Lié à quel incident?
    
    # Anti-spam
    is_potential_duplicate: bool = False
    duplicate_of_alerte_id: Optional[str] = None
    client_ip: Optional[str] = None
    client_fingerprint: Optional[str] = None
    
    # Données IA (remplies après analyse)
    ia_gravite: Optional[Severity] = None
    ia_transcription: Optional[str] = None
    ia_photo_analysis: Optional[str] = None
    ia_confidence: Optional[float] = None
    
    # Audit
    created_at: datetime
    updated_at: datetime
    validated_at: Optional[datetime] = None
    

class AlerteResponse(BaseModel):
    """Réponse à la création d'alerte"""
    alerte_id: str
    reference: str  # "AL-2026-0001234"
    status: AlerteStatus
    message: str
    
    # Si détection redondance immédiate
    is_duplicate: bool = False
    duplicate_of_reference: Optional[str] = None
    
    # Timing
    created_at: datetime


# ============ INCIDENT (BD) ============

class Incident(BaseModel):
    """Modèle d'incident en base de données"""
    id: str
    reference: str
    title: str
    description: Optional[str] = None
    
    # Classification
    categorie: AlerteCategory
    severity: Severity
    priority: Priority
    
    # Localisation
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    zone_id: Optional[str] = None
    
    # Statut
    status: IncidentStatus
    is_hot_zone: bool = False
    alertes_count: int = 0  # Nombre d'alertes liées
    
    # Traçabilité
    created_by_user_id: Optional[str] = None
    qualified_by_user_id: Optional[str] = None
    resolved_by_user_id: Optional[str] = None
    closed_by_user_id: Optional[str] = None
    
    # Audit
    created_at: datetime
    updated_at: datetime
    qualified_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None


# ============ RÉSULTATS ANALYSE IA ============

class ResultatAnalyseIA(BaseModel):
    """Résultats de l'analyse IA"""
    alerte_id: str
    gravite: Severity
    transcription: Optional[str] = None
    photo_analysis: Optional[str] = None
    credibilite_score: float  # 0-100
    credibilite_niveau: str
    coherence_categorie: float
    confidence: float
