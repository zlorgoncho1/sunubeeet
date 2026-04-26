#!/usr/bin/env python3
"""
🧪 TEST DU NOUVEAU FLUX ALERTES
Teste:
1. Création d'alerte
2. Détection de redondance EN PRIORITÉ
3. IA lancée en background (stubs)
"""

import requests
import json
from datetime import datetime

API_URL = "http://localhost:5000"

def test_alerte_premiere():
    """Test 1: Créer une première alerte"""
    print("\n" + "="*70)
    print("TEST 1: 🆕 PREMIÈRE ALERTE (NOUVELLE)")
    print("="*70)
    
    payload = {
        "categorie": "incendie",
        "description": "Feu détecté au 3e étage de l'Arena Aftout",
        "audio_base64": None,
        "photo_base64": None,
        "latitude": 14.7167,  # Dakar
        "longitude": -17.4674,
        "spectateur_id": "SPEC_001",
        "client_fingerprint": "browser_fingerprint_123"
    }
    
    try:
        response = requests.post(f"{API_URL}/alerte/", json=payload, timeout=10)
        result = response.json()
        
        print(f"✅ Status: {response.status_code}")
        print(f"📋 Alerte ID: {result['alerte_id']}")
        print(f"📄 Référence: {result['reference']}")
        print(f"📊 Status: {result['status']}")
        print(f"💬 Message: {result['message']}")
        print(f"🔀 Is Duplicate: {result['is_duplicate']}")
        
        if result['status'] == 'processing':
            print(f"🤖 IA lancée en background ✅")
        
        return result
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None


def test_alerte_redondante(ref_alerte1: str):
    """Test 2: Créer une alerte redondante (même IP, proche localisation)"""
    print("\n" + "="*70)
    print("TEST 2: 🚨 DEUXIÈME ALERTE (REDONDANTE - MÊME IP)")
    print("="*70)
    
    # Même localisation, peu de temps après
    payload = {
        "categorie": "incendie",
        "description": "Feu à l'Arena Aftout étage 3",  # Description différente mais redondante
        "audio_base64": None,
        "photo_base64": None,
        "latitude": 14.7168,  # Très proche (<100m)
        "longitude": -17.4675,
        "spectateur_id": "SPEC_002",  # Spectateur différent
        "client_fingerprint": "browser_fingerprint_456"
    }
    
    try:
        response = requests.post(f"{API_URL}/alerte/", json=payload, timeout=10)
        result = response.json()
        
        print(f"✅ Status: {response.status_code}")
        print(f"📋 Alerte ID: {result['alerte_id']}")
        print(f"📄 Référence: {result['reference']}")
        print(f"📊 Status: {result['status']}")
        print(f"💬 Message: {result['message']}")
        print(f"🔀 Is Duplicate: {result['is_duplicate']}")
        
        if result['is_duplicate']:
            print(f"🚨 REDONDANCE DÉTECTÉE! ✅")
            print(f"   Duplicate of: {result['duplicate_of_reference']}")
        
        return result
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None


def test_alerte_differente():
    """Test 3: Créer une alerte DIFFÉRENTE (pas redondante)"""
    print("\n" + "="*70)
    print("TEST 3: ✅ TROISIÈME ALERTE (DIFFÉRENTE - VALIDE)")
    print("="*70)
    
    payload = {
        "categorie": "medical",  # Catégorie DIFFÉRENTE (sans accent)
        "description": "Personne blessée au stade",
        "audio_base64": None,
        "photo_base64": None,
        "latitude": 14.7200,  # Localisation DIFFÉRENTE
        "longitude": -17.4700,
        "spectateur_id": "SPEC_003",
        "client_fingerprint": "browser_fingerprint_789"
    }
    
    try:
        response = requests.post(f"{API_URL}/alerte/", json=payload, timeout=10)
        result = response.json()
        
        print(f"✅ Status: {response.status_code}")
        print(f"📋 Alerte ID: {result['alerte_id']}")
        print(f"📄 Référence: {result['reference']}")
        print(f"📊 Status: {result['status']}")
        print(f"💬 Message: {result['message']}")
        print(f"🔀 Is Duplicate: {result['is_duplicate']}")
        
        if result['status'] == 'processing' and not result['is_duplicate']:
            print(f"✅ ALERTE ACCEPTÉE - IA lancée ✅")
        
        return result
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None


def test_lister_alertes():
    """Test 4: Lister toutes les alertes"""
    print("\n" + "="*70)
    print("TEST 4: 📋 LISTER LES ALERTES")
    print("="*70)
    
    try:
        response = requests.get(f"{API_URL}/alerte/", params={"limit": 10}, timeout=10)
        result = response.json()
        
        print(f"✅ Status: {response.status_code}")
        print(f"📊 Total alertes: {result['total']}")
        
        for i, alerte in enumerate(result['alertes'], 1):
            print(f"\n  {i}. {alerte['reference']}")
            print(f"     Catégorie: {alerte['categorie']}")
            print(f"     Status: {alerte['status']}")
            print(f"     Duplicate: {alerte['is_potential_duplicate']}")
        
        return result
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None


if __name__ == "__main__":
    print("\n" + "🧪"*35)
    print("TESTS DU NOUVEAU FLUX ALERTES")
    print("Détection de redondance EN PRIORITÉ")
    print("IA en background")
    print("🧪"*35)
    
    # Test 1: Première alerte
    alerte1 = test_alerte_premiere()
    if not alerte1:
        print("❌ Test 1 échoué")
        exit(1)
    
    # Test 2: Alerte redondante
    alerte2 = test_alerte_redondante(alerte1['reference'])
    if not alerte2:
        print("❌ Test 2 échoué")
        exit(1)
    
    if not alerte2['is_duplicate']:
        print("⚠️ Test 2 partiel: Redondance non détectée")
    
    # Test 3: Alerte différente
    alerte3 = test_alerte_differente()
    if not alerte3:
        print("❌ Test 3 échoué")
        exit(1)
    
    # Test 4: Lister
    alertes = test_lister_alertes()
    
    # Résumé
    print("\n" + "="*70)
    print("📊 RÉSUMÉ DES TESTS")
    print("="*70)
    
    tests_passed = 0
    tests_total = 4
    
    if alerte1 and alerte1['status'] == 'processing':
        print("✅ Test 1: Création alerte OK")
        tests_passed += 1
    else:
        print("❌ Test 1: Création alerte FAIL")
    
    if alerte2 and alerte2['is_duplicate']:
        print("✅ Test 2: Redondance détectée OK")
        tests_passed += 1
    else:
        print("⚠️ Test 2: Redondance non détectée")
    
    if alerte3 and alerte3['status'] == 'processing' and not alerte3['is_duplicate']:
        print("✅ Test 3: Alerte valide OK")
        tests_passed += 1
    else:
        print("❌ Test 3: Alerte valide FAIL")
    
    if alertes and alertes['total'] >= 2:
        print("✅ Test 4: Listing OK")
        tests_passed += 1
    else:
        print("❌ Test 4: Listing FAIL")
    
    print(f"\n🎯 TOTAL: {tests_passed}/{tests_total} tests réussis")
    
    if tests_passed == tests_total:
        print("\n🎉 TOUS LES TESTS SONT PASSÉS!")
    else:
        print(f"\n⚠️ {tests_total - tests_passed} test(s) en échec")
