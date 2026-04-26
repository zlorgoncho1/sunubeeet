#!/usr/bin/env python
"""Ouvre l'interface simple dans le navigateur"""

import webbrowser
from pathlib import Path

html_file = Path(__file__).parent / "ml" / "interface_simple.html"

print("🚀 Ouverture de l'interface de signalement...")
print(f"📂 Fichier : {html_file}")

webbrowser.open(f'file:///{html_file}')

print("✅ Interface ouverte !")
print("\n⚠️  Assurez-vous que l'API tourne : python -m ml.api.app")
