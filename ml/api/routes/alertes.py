"""
Routes pour les alertes
Endpoint principal: POST /alerte
"""

from fastapi import APIRouter, HTTPException, Request
from ml.models.alerte_models import CreerAlerteRequest, AlerteResponse
from ml.services.alerte_service import creer_alerte, obtenir_alerte, lister_alertes_recentes

router = APIRouter(prefix="/alerte", tags=["alertes"])


@router.post("/", response_model=AlerteResponse, summary="Créer une alerte")
async def creer_nouvelle_alerte(
    req: CreerAlerteRequest,
    request: Request
) -> AlerteResponse:
    """
    Crée une nouvelle alerte depuis un spectateur
    
    FLUX:
    1. Valider les données
    2. Récupérer IP du client
    3. Créer alerte en BD
    4. Détecter redondance EN PRIORITÉ
    5. Si pas de redondance: lancer IA en background
    6. Retourner immédiatement l'ID de l'alerte
    
    Réponse immédiate (<100ms): {alerte_id, reference, status}
    Analyse IA: en background (asynchrone)
    """
    
    # Récupérer l'IP du client
    client_ip = request.client.host if request.client else None
    
    print(f"\n{'='*70}")
    print(f"📨 NOUVELLE ALERTE REÇUE")
    print(f"{'='*70}")
    print(f"IP Client: {client_ip}")
    print(f"Spectateur: {req.spectateur_id}")
    print(f"Catégorie: {req.categorie}")
    
    try:
        # Créer l'alerte (avec détection redondance)
        response = creer_alerte(
            req,
            client_ip=client_ip,
            client_fingerprint=req.client_fingerprint if hasattr(req, 'client_fingerprint') else None
        )
        
        print(f"\n✅ Réponse: {response.status}")
        print(f"   Référence: {response.reference}")
        print(f"   Message: {response.message}")
        
        if response.is_duplicate:
            print(f"   ⚠️ DUPLICATE DE: {response.duplicate_of_reference}")
        else:
            print(f"   🤖 IA lancée en background")
        
        return response
        
    except Exception as e:
        print(f"\n❌ Erreur: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur création alerte: {str(e)}")


@router.get("/{alerte_id}", summary="Récupérer une alerte")
async def get_alerte(alerte_id: str):
    """Récupère une alerte par ID"""
    alerte = obtenir_alerte(alerte_id)
    if not alerte:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    return alerte


@router.get("/", summary="Lister les alertes récentes")
async def list_alertes(limit: int = 10):
    """Liste les X dernières alertes"""
    alertes = lister_alertes_recentes(limit)
    return {
        "total": len(alertes),
        "alertes": alertes
    }
