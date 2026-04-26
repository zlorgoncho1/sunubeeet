"""
Endpoint principal de classification d'incidents
"""

import pickle
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

# Les imports de utils se font dans les fonctions pour éviter les erreurs de clés API au chargement

router = APIRouter()


class HistoriqueModel(BaseModel):
    total: int = 0
    valides: int = 0


class ClassifierRequest(BaseModel):
    categorie: str
    description: Optional[str] = None
    audio_base64: Optional[str] = None
    photo_base64: Optional[str] = None  # Nouvelle: photo floue
    latitude: Optional[float] = None  # Géolocalisation
    longitude: Optional[float] = None
    spectateur_id: Optional[str] = None
    nb_signalements_similaires: int = 0
    historique: Optional[HistoriqueModel] = None


# Charger le modèle PKL au démarrage
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    '..', '..', 'models', 'modele_gravite.pkl'
)

model_gravite = None

def load_model():
    global model_gravite
    try:
        with open(MODEL_PATH, 'rb') as f:
            model_gravite = pickle.load(f)
        print(f"✅ Modèle gravité chargé : {MODEL_PATH}")
    except FileNotFoundError:
        print(f"⚠️ Modèle non trouvé : {MODEL_PATH}")
        model_gravite = None


@router.post("/classifier")
async def classify_incident(req: ClassifierRequest):
    """
    Endpoint principal de classification
    
    Processus :
    1. Transcrire audio si présent
    2. Prédire gravité via PKL
    3. Analyser avec DeepSeek
    4. Fusion + crédibilité
    5. Décision finale
    """
    
    # Import lazy pour éviter les erreurs de clés API au démarrage
    from ml.utils.transcription import transcrire_audio
    from ml.utils.deepseek import analyser_incident
    from ml.utils.credibilite import calculer_credibilite
    from ml.utils.actions import get_action
    from ml.utils.vision import analyser_image
    
    # Validation entrée
    description = req.description or ""
    audio_base64 = req.audio_base64 or None
    
    # 1. Transcrire audio si présent
    if audio_base64:
        transcription = transcrire_audio(audio_base64)
        if transcription:
            description = transcription
        # Si transcription échoue mais on a une description → continuer
        # Si transcription échoue ET pas de description → continuer quand même (analyser juste la catégorie)
    
    # Validation finale: au moins une catégorie (toujours requise)
    if not req.categorie:
        raise HTTPException(
            status_code=400,
            detail="Catégorie d'incident requise"
        )
    
    # Si pas de description DU TOUT: utiliser la catégorie comme fallback
    if not description.strip():
        description = f"Incident de catégorie: {req.categorie}"
    
    # 2. Prédire gravité via PKL (fallback)
    pkl_gravite = "moyenne"  # Default fallback
    if model_gravite:
        try:
            pkl_gravite = model_gravite.predict([description])[0]
        except Exception as e:
            print(f"⚠️ Erreur prédiction PKL : {str(e)}")
    
    # 3. Analyser avec DeepSeek
    deepseek_result = analyser_incident(req.categorie, description)
    
    # 4. Fusion : utiliser DeepSeek si disponible et confiance suffisante
    source_ia = "pkl_fallback"
    final_gravite = pkl_gravite
    coherence_categorie = 0.5
    confiance = 0.5
    
    if deepseek_result:
        source_ia = "deepseek"
        deepseek_gravite = deepseek_result.get("gravite", "moyenne")
        coherence_categorie = deepseek_result.get("coherence_categorie", 0.5)
        confiance = deepseek_result.get("confiance", 0.5)
        
        # Utiliser DeepSeek si confiance >= 0.7
        if confiance >= 0.7:
            final_gravite = deepseek_gravite
        else:
            # Sinon utiliser PKL
            source_ia = "pkl_fallback"
            final_gravite = pkl_gravite
    
    # 4. Analyser l'image si présente
    photo_analysis = None
    if req.photo_base64:
        print(f"🖼️ Analyse image en cours... ({len(req.photo_base64)} chars base64)")
        image_result = analyser_image(req.photo_base64, req.categorie)
        if image_result and "elements_danger" in image_result:
            photo_analysis = image_result.get("elements_danger", "Image analysée")
            print(f"✅ Photo analysée: {photo_analysis}")
        else:
            print(f"⚠️ Analyse image échouée ou vide: {image_result}")
    
    # 5. Calculer score crédibilité
    credibilite_data = {
        'description': description,
        'audio_base64': audio_base64,
        'nb_signalements_similaires': req.nb_signalements_similaires,
        'historique': req.historique.dict() if req.historique else {}
    }
    credibilite = calculer_credibilite(credibilite_data, deepseek_result)
    
    # 6. Décision finale
    cred_score = credibilite['score']
    
    if final_gravite == "critique":
        seuil_attente = 30
    else:
        seuil_attente = 50
    
    if cred_score >= 70:
        statut = "validé_automatiquement"
        couleur = "vert" if final_gravite == "basse" else "orange" if final_gravite == "moyenne" else "rouge"
    elif cred_score >= seuil_attente:
        statut = "en_attente_confirmation"
        couleur = "jaune"
    else:
        statut = "suspect"
        couleur = "gris"
    
    # Mapper gravité vers couleur
    if final_gravite == "critique":
        couleur = "rouge"
    elif final_gravite == "haute":
        couleur = "orange"
    elif final_gravite == "moyenne":
        couleur = "jaune"
    else:
        couleur = "vert"
    
    # Construire réponse
    response = {
        "categorie": req.categorie,
        "gravite": final_gravite,
        "resume": deepseek_result.get("resume", f"Incident {req.categorie} de gravité {final_gravite}"),
        "justification": deepseek_result.get("justification", "Analyse basée sur PKL"),
        "action_recommandee": get_action(req.categorie, final_gravite),
        "transcription": description if audio_base64 else None,
        "photo_analysis": photo_analysis,  # Analyse image
        "latitude": req.latitude,  # Géolocalisation
        "longitude": req.longitude,
        "credibilite": credibilite,
        "decision": {
            "statut": statut,
            "couleur": couleur
        },
        "source_ia": source_ia,
        "detail": {
            "pkl_gravite": pkl_gravite,
            "deepseek_gravite": deepseek_result.get("gravite") if deepseek_result else None,
            "coherence_categorie": coherence_categorie,
            "confiance": confiance
        }
    }
    
    return response
