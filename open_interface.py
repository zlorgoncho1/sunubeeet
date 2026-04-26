#!/usr/bin/env python3
"""
Script pour ouvrir l'interface d'alerte dans le navigateur
"""

import webbrowser
import time
from pathlib import Path

# Attendre que l'API démarre
print("⏳ Attente du démarrage de l'API (3 secondes)...")
time.sleep(3)

# Chemin de l'interface
interface_path = Path(__file__).parent / "ml" / "interface_simple.html"

if not interface_path.exists():
    print(f"❌ Interface non trouvée: {interface_path}")
    exit(1)

print(f"📂 Interface: {interface_path}")

# Ouvrir dans le navigateur
file_uri = interface_path.as_uri()
print(f"🌐 Ouverture: {file_uri}")

webbrowser.open(file_uri)

print("\n✅ Interface ouverte dans votre navigateur!")
print(f"\n💬 Assurez-vous que l'API tourne sur http://localhost:5000")
print(f"   Endpoint: POST http://localhost:5000/alerte/")
print(f"\n🧪 Testez en remplissant le formulaire et en cliquant 'Envoyer'")
