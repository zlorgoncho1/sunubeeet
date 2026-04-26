#!/usr/bin/env python3
"""
Lanceur complet pour l'interface Bët
Démarre l'API et le serveur web simultanément
"""
import subprocess
import threading
import time
import webbrowser
import os

def start_api():
    """Démarrer l'API FastAPI"""
    print("\n🚀 Démarrage de l'API FastAPI sur http://localhost:5000...")
    subprocess.run(
        ["python", "-m", "ml.api.app"],
        cwd=".",
        env={**os.environ, "PYTHONUNBUFFERED": "1"}
    )

def start_web():
    """Démarrer le serveur web"""
    print("🌐 Démarrage du serveur web sur http://localhost:8000...")
    os.chdir("ml")
    subprocess.run(
        ["python", "-m", "http.server", "8000"],
        env={**os.environ, "PYTHONUNBUFFERED": "1"}
    )

if __name__ == "__main__":
    print("=" * 60)
    print("📋 Bët - Interface de Signalement d'Incidents")
    print("=" * 60)
    
    # Démarrer API en thread séparé
    api_thread = threading.Thread(target=start_api, daemon=True)
    api_thread.start()
    
    # Attendre que l'API démarre
    time.sleep(3)
    
    # Ouvrir le navigateur
    print("\n🌐 Ouverture du navigateur...")
    time.sleep(1)
    webbrowser.open("http://localhost:8000/interface_simple.html")
    
    # Démarrer le serveur web en thread principal
    start_web()
