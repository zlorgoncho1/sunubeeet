#!/usr/bin/env python3
"""
Script de démarrage complet du système d'alerte Bët
Lance API + Dashboard + Ouvre le navigateur
"""

import subprocess
import time
import sys
import os
from pathlib import Path

print("\n" + "="*70)
print("🚀 DÉMARRAGE SYSTÈME D'ALERTE BËT")
print("="*70 + "\n")

# Vérifier que nous sommes dans le bon répertoire
workspace = Path(__file__).parent
os.chdir(workspace)

print(f"📂 Workspace: {workspace}\n")

# Vérifier les dépendances
print("✓ Vérification des dépendances...")
try:
    import fastapi
    import requests
    print("✓ FastAPI & Requests OK\n")
except ImportError as e:
    print(f"❌ Dépendance manquante: {e}")
    print("   Installez: pip install fastapi uvicorn requests\n")
    sys.exit(1)

# Arrêter les anciens processus (optionnel)
print("🧹 Nettoyage des anciens processus...\n")

# Lancer l'API (Terminal 1)
print("1️⃣  Démarrage API FastAPI (port 5000)...")
api_process = subprocess.Popen(
    [sys.executable, "-m", "ml.api.app"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)
print("   ✓ Processus lancé (PID: {})".format(api_process.pid))

# Attendre que l'API démarre
print("   ⏳ Attente du démarrage...", end="", flush=True)
for i in range(10):
    try:
        import requests
        requests.get("http://localhost:5000/health", timeout=1)
        print(" ✅")
        break
    except:
        print(".", end="", flush=True)
        time.sleep(0.5)
else:
    print(" ⏱️ Timeout")

# Lancer le Dashboard (Terminal 2)
print("\n2️⃣  Démarrage serveur Dashboard (port 8000)...")
dashboard_process = subprocess.Popen(
    [sys.executable, "serve_interface.py"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)
print("   ✓ Processus lancé (PID: {})".format(dashboard_process.pid))

# Attendre que le Dashboard démarre
print("   ⏳ Attente du démarrage...", end="", flush=True)
for i in range(10):
    try:
        requests.get("http://localhost:8000/dashboard.html", timeout=1)
        print(" ✅")
        break
    except:
        print(".", end="", flush=True)
        time.sleep(0.5)
else:
    print(" ⏱️ Timeout")

# Afficher l'info de démarrage
print("\n" + "="*70)
print("✅ SYSTÈME PRÊT!")
print("="*70)
print("""
🔗 ENDPOINTS:
   • API Bët:      http://localhost:5000/
   • Dashboard:    http://localhost:8000/dashboard.html
   • Health:       http://localhost:5000/health

📊 FLUX:
   1. Ouvrez le Dashboard dans le navigateur
   2. Remplissez le formulaire d'alerte
   3. Cliquez "Envoyer l'Alerte"
   4. Résultat immédiat: référence + status

🛑 ARRÊT:
   Appuyez sur Ctrl+C pour arrêter tous les services

📚 DOCUMENTATION:
   • Frontend: http://localhost:8000/dashboard.html
   • API Docs: http://localhost:5000/docs
   • Integration: ./LARAVEL_INTEGRATION.md

""" + "="*70 + "\n")

# Garder les processus actifs
try:
    while True:
        if api_process.poll() is not None:
            print("⚠️  API s'est arrêtée")
        if dashboard_process.poll() is not None:
            print("⚠️  Dashboard s'est arrêté")
        time.sleep(1)
        
except KeyboardInterrupt:
    print("\n\n🛑 Arrêt du système...")
    api_process.terminate()
    dashboard_process.terminate()
    
    try:
        api_process.wait(timeout=5)
        dashboard_process.wait(timeout=5)
        print("✅ Tous les services arrêtés")
    except subprocess.TimeoutExpired:
        api_process.kill()
        dashboard_process.kill()
        print("⚠️  Processus forcément terminés")
    
    sys.exit(0)
