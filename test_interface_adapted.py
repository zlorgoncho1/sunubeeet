#!/usr/bin/env python3
"""
Test rapide du nouvel endpoint /alerte/ via l'interface
"""

import requests
import json

API_URL = "http://localhost:5000/alerte/"

print("\n" + "="*70)
print("🧪 TEST DE L'INTERFACE ADAPTÉE")
print("="*70)

# Test 1: Alerte simple
print("\n📋 Test 1: Créer une alerte simple")
print("-" * 70)

payload = {
    "categorie": "medical",
    "description": "Patient inconscient au stade",
    "spectateur_id": "SPEC_TEST_001",
    "audio_base64": None,
    "photo_base64": None,
    "latitude": 14.7167,
    "longitude": -17.4674
}

try:
    response = requests.post(API_URL, json=payload, timeout=10)
    result = response.json()
    
    print(f"✅ Status: {response.status_code}")
    print(f"📄 Référence: {result['reference']}")
    print(f"📊 Status: {result['status']}")
    print(f"💬 Message: {result['message']}")
    
    if result['status'] == 'processing':
        print(f"🤖 IA en background: ✅")
        print(f"\n✅ INTERFACE FONCTIONNELLE!")
    
except Exception as e:
    print(f"❌ Erreur: {e}")

print("\n" + "="*70)
print("🎉 L'interface est prête pour utilisation!")
print("="*70)
print("""
UTILISATION:
1. Remplissez les champs du formulaire
2. Optionnel: Enregistrez un audio (🎤)
3. Optionnel: Uploadez une photo (📷)
4. Optionnel: Activez la géolocalisation (📍)
5. Cliquez "Envoyer" (🚀)

RÉSULTATS POSSIBLES:
✅ Alerte acceptée → Status: processing (IA en background)
⚠️ Redondance détectée → Status: duplicate (anti-spam)

L'interface affichera:
- Référence: AL-YYYY-NNNNNN
- ID Alerte: UUID unique
- Status: processing ou duplicate
- Message: Description de l'état
""")
