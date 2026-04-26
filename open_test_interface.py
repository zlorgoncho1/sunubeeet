#!/usr/bin/env python
"""Ouvre l'interface de test Vue.js dans le navigateur"""

import os
import webbrowser
from pathlib import Path

# Chemin vers le fichier HTML
html_file = Path(__file__).parent / "ml" / "test_interface.html"
html_path = f"file:///{html_file.absolute()}"

print("🚀 Ouverture de l'interface de test Bët ML...")
print(f"📂 Fichier : {html_file}")
print(f"🌐 URL : {html_path}")

# Ouvrir dans le navigateur par défaut
webbrowser.open(html_path)

print("\n✅ Interface ouverte dans votre navigateur !")
print("\nℹ️  Assurez-vous que l'API FastAPI est en cours d'exécution :")
print("   python -m ml.api.app")
