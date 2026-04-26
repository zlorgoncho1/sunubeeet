#!/usr/bin/env python3
"""
Diagnostic complet du système d'alerte
"""

import requests
import json
import sys

print("\n" + "="*70)
print("🔍 DIAGNOSTIC COMPLET DU SYSTÈME")
print("="*70)

# Test 1: Vérifier que l'API répond
print("\n1️⃣  TEST API (port 5000)")
print("-" * 70)

try:
    response = requests.get("http://localhost:5000/health", timeout=2)
    print(f"✅ API répond: Status {response.status_code}")
except Exception as e:
    print(f"❌ API ne répond pas: {e}")
    print("   → Assurez-vous que `python -m ml.api.app` tourne en arrière-plan")
    sys.exit(1)

# Test 2: Vérifier que le serveur HTTP répond
print("\n2️⃣  TEST SERVEUR HTTP (port 8000)")
print("-" * 70)

try:
    response = requests.get("http://localhost:8000/interface_simple.html", timeout=2)
    if response.status_code == 200:
        print(f"✅ Serveur HTTP répond: Status {response.status_code}")
        if "interface_simple.html" in response.text or "<html" in response.text.lower():
            print("✅ Interface HTML trouvée")
    else:
        print(f"⚠️  Status: {response.status_code}")
except Exception as e:
    print(f"❌ Serveur HTTP ne répond pas: {e}")
    print("   → Assurez-vous que `python serve_interface.py` tourne")
    sys.exit(1)

# Test 3: Test POST /alerte/
print("\n3️⃣  TEST POST /alerte/")
print("-" * 70)

payload = {
    "categorie": "medical",
    "description": "Test diagnostic",
    "spectateur_id": "DIAG_001",
    "audio_base64": None,
    "photo_base64": None,
    "latitude": None,
    "longitude": None
}

try:
    response = requests.post(
        "http://localhost:5000/alerte/",
        json=payload,
        timeout=5,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"✅ Statut HTTP: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Réponse JSON valide")
        print(f"   Référence: {data.get('reference')}")
        print(f"   Status: {data.get('status')}")
        print(f"   Message: {data.get('message')}")
        
        if data.get('status') in ['processing', 'duplicate']:
            print(f"\n🎉 ALERTE CRÉÉE AVEC SUCCÈS!")
        else:
            print(f"\n⚠️  Status inattendu: {data.get('status')}")
    else:
        print(f"❌ Erreur HTTP: {response.status_code}")
        print(f"   Réponse: {response.text[:500]}")
        
except requests.exceptions.JSONDecodeError as e:
    print(f"❌ Erreur de parsing JSON: {e}")
    print(f"   La réponse n'est pas du JSON")
    print(f"   Contenu: {response.text[:200]}")
    
except Exception as e:
    print(f"❌ Erreur: {e}")

# Test 4: Vérifier CORS
print("\n4️⃣  TEST CORS")
print("-" * 70)

try:
    response = requests.options(
        "http://localhost:5000/alerte/",
        headers={
            "Origin": "http://localhost:8000",
            "Access-Control-Request-Method": "POST"
        },
        timeout=2
    )
    
    cors_headers = response.headers
    print(f"✅ OPTIONS request successful")
    
    if "access-control-allow-origin" in cors_headers:
        print(f"✅ CORS enabled: {cors_headers.get('access-control-allow-origin')}")
    else:
        print(f"⚠️  Pas de header CORS détecté")
        print(f"   Headers: {dict(cors_headers)}")
        
except Exception as e:
    print(f"⚠️  Impossible de vérifier CORS: {e}")

# Résumé
print("\n" + "="*70)
print("📊 RÉSUMÉ")
print("="*70)
print("""
✅ Si tous les tests sont verts:
   1. Interface: http://localhost:8000/interface_simple.html
   2. Remplissez le formulaire
   3. Cliquez "Envoyer"
   4. Vous devriez voir la réponse immédiatement

❌ Si des tests échouent:
   - Vérifiez que les deux serveurs tournent:
     * Terminal 1: `python -m ml.api.app` (port 5000)
     * Terminal 2: `python serve_interface.py` (port 8000)
   - Consultez les logs des serveurs pour plus de détails
""")
