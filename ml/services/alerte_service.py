"""
Service de gestion des alertes
- Création d'alertes
- Détection de redondance
- Lancement analyse IA en background
"""

import json
from datetime import datetime
from typing import Optional, Dict
import hashlib
import uuid

from ml.models.alerte_models import (
    Alerte, AlerteStatus, AlerteCategory, Severity,
    CreerAlerteRequest, AlerteResponse
)


# Simulation BD (en mémoire pour tests)
# En production: utiliser PostgreSQL
alertes_bd = []
incidents_bd = []


def generer_reference_alerte() -> str:
    """Génère une référence unique: AL-YYYY-NNNNNN"""
    now = datetime.now()
    year = now.year
    count = len(alertes_bd) + 1
    return f"AL-{year}-{str(count).zfill(6)}"


def calculer_fingerprint_alerte(req: CreerAlerteRequest, client_ip: Optional[str]) -> str:
    """
    Calcule un fingerprint pour détecter les redondances
    Basé sur: catégorie + localisation + description + IP
    """
    data = {
        "categorie": req.categorie.value,
        "lat": round(req.latitude or 0, 4),  # Arrondir pour capturer zone proximité
        "lon": round(req.longitude or 0, 4),
        "desc": (req.description or "")[:20],  # Premiers 20 chars
        "ip": client_ip or "unknown"
    }
    
    fingerprint = hashlib.sha256(json.dumps(data).encode()).hexdigest()
    return fingerprint


def detecter_redondance(
    req: CreerAlerteRequest, 
    client_ip: Optional[str],
    client_fingerprint: Optional[str],
    window_minutes: int = 5  # Regarder les 5 dernières minutes
) -> Optional[Dict]:
    """
    Détecte les alertes redondantes récentes
    
    Critères de redondance:
    - Même catégorie
    - Localisation proche (<100m)
    - Même IP ou fingerprint client
    - Créée dans les X dernières minutes
    - Description similaire (optionnel)
    """
    
    from datetime import timedelta
    
    now = datetime.now()
    cutoff_time = now - timedelta(minutes=window_minutes)
    
    for alerte_existante in alertes_bd:
        # Vérifier le timing
        if alerte_existante["created_at"] < cutoff_time:
            continue
        
        # Même catégorie?
        if alerte_existante["categorie"] != req.categorie.value:
            continue
        
        # Même localisation (proximité <100m ~ 0.001 degrés)?
        lat_diff = abs((alerte_existante.get("latitude") or 0) - (req.latitude or 0))
        lon_diff = abs((alerte_existante.get("longitude") or 0) - (req.longitude or 0))
        
        if lat_diff > 0.001 or lon_diff > 0.001:
            continue
        
        # Même source (IP ou fingerprint)?
        if client_ip and alerte_existante.get("client_ip") == client_ip:
            return {
                "is_duplicate": True,
                "duplicate_of_id": alerte_existante["id"],
                "duplicate_of_reference": alerte_existante["reference"],
                "raison": "Même adresse IP dans les 5 dernières minutes"
            }
        
        if client_fingerprint and alerte_existante.get("client_fingerprint") == client_fingerprint:
            return {
                "is_duplicate": True,
                "duplicate_of_id": alerte_existante["id"],
                "duplicate_of_reference": alerte_existante["reference"],
                "raison": "Même device (fingerprint) dans les 5 dernières minutes"
            }
    
    return None  # Pas de redondance


def creer_alerte(
    req: CreerAlerteRequest,
    client_ip: Optional[str] = None,
    client_fingerprint: Optional[str] = None
) -> AlerteResponse:
    """
    FLUX PRINCIPAL:
    1. Créer alerte en BD avec status=CREATED
    2. Détecter redondance EN PRIORITÉ
    3. Lancer IA en background (task asynchrone)
    4. Retourner immédiatement l'ID
    """
    
    print(f"\n📋 Création alerte...")
    print(f"   Catégorie: {req.categorie}")
    print(f"   Description: {req.description}")
    print(f"   Localisation: {req.latitude}, {req.longitude}")
    
    # 1. Créer l'alerte
    alerte_id = str(uuid.uuid4())
    reference = generer_reference_alerte()
    
    alerte = {
        "id": alerte_id,
        "reference": reference,
        "source_user_id": req.spectateur_id,
        "categorie": req.categorie.value,
        "description": req.description,
        "audio_base64": req.audio_base64,  # Stocké pour IA
        "photo_base64": req.photo_base64,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "status": AlerteStatus.CREATED.value,
        "client_ip": client_ip,
        "client_fingerprint": client_fingerprint,
        "is_potential_duplicate": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    print(f"✅ Alerte créée: {reference}")
    
    # 2. DÉTECTION REDONDANCE EN PRIORITÉ
    print(f"\n🔍 Vérification redondance...")
    
    redondance = detecter_redondance(req, client_ip, client_fingerprint)
    
    if redondance and redondance["is_duplicate"]:
        print(f"🚨 REDONDANCE DÉTECTÉE!")
        print(f"   Duplicate of: {redondance['duplicate_of_reference']}")
        print(f"   Raison: {redondance['raison']}")
        
        # Marquer comme duplicate
        alerte["status"] = AlerteStatus.DUPLICATE.value
        alerte["is_potential_duplicate"] = True
        alerte["duplicate_of_alerte_id"] = redondance["duplicate_of_id"]
        
        alertes_bd.append(alerte)
        
        return AlerteResponse(
            alerte_id=alerte_id,
            reference=reference,
            status=AlerteStatus.DUPLICATE,
            message=f"Redondance détectée: {redondance['raison']}",
            is_duplicate=True,
            duplicate_of_reference=redondance["duplicate_of_reference"],
            created_at=alerte["created_at"]
        )
    
    print(f"✅ Pas de redondance détectée")
    
    # 3. Pas de redondance: marquer comme PROCESSING et lancer IA en background
    alerte["status"] = AlerteStatus.PROCESSING.value
    alertes_bd.append(alerte)
    
    print(f"\n🤖 Lancement IA en background...")
    print(f"   L'analyse se fera en arrière-plan")
    
    # Lancer le traitement IA en background
    from ml.services.ia_background_processor import creer_task_ia_async
    creer_task_ia_async(alerte_id, alerte)
    
    return AlerteResponse(
        alerte_id=alerte_id,
        reference=reference,
        status=AlerteStatus.PROCESSING,
        message="Alerte créée et en cours d'analyse",
        is_duplicate=False,
        created_at=alerte["created_at"]
    )


def obtenir_alerte(alerte_id: str) -> Optional[Dict]:
    """Récupère une alerte par ID"""
    for alerte in alertes_bd:
        if alerte["id"] == alerte_id:
            return alerte
    return None


def lister_alertes_recentes(limit: int = 10) -> list:
    """Liste les X dernières alertes"""
    return sorted(alertes_bd, key=lambda a: a["created_at"], reverse=True)[:limit]
