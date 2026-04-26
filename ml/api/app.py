"""
FastAPI Application - Point d'entrée principal
"""

import os
import sys
from pathlib import Path

# Charger les variables d'environnement AVANT les autres imports
from dotenv import load_dotenv
# Charger depuis le répertoire ml (où se trouve .env)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path, override=True)
print(f"📝 Variables d'env chargées depuis: {env_path}")
print(f"✓ OPENAI_API_KEY présente: {bool(os.environ.get('OPENAI_API_KEY'))}")
print(f"✓ GROQ_API_KEY présente: {bool(os.environ.get('GROQ_API_KEY'))}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ajouter le chemin parent pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from ml.api.routes import classifier, health, alertes
from ml.api.routes.classifier import load_model

# Créer l'application FastAPI
app = FastAPI(
    title="Bët ML Microservice",
    description="Microservice ML pour classification d'incidents JOJ Dakar 2026",
    version="1.0.0"
)

# Configuration CORS pour que Laravel puisse appeler l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrer les blueprints (routes)
app.include_router(health.router)
app.include_router(classifier.router)
app.include_router(alertes.router)  # NOUVEAU: Endpoint alertes

# Charger le modèle au démarrage
@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("🚀 Démarrage Bët ML Microservice")
    print("="*60)
    load_model()
    print("✅ Service prêt !")
    print("="*60 + "\n")


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Lancement sur le port {port}...")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
