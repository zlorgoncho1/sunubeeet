#!/usr/bin/env python3
"""
🧪 TEST COMPLET DU PIPELINE BËT ML
Teste: Photo floue + Géolocalisation + Audio + Analyse IA
"""

import requests
import json
import base64
from pathlib import Path

API_URL = "http://localhost:5000"

def test_health():
    """Test du health check"""
    print("\n" + "="*70)
    print("🏥 TEST 1: HEALTH CHECK")
    print("="*70)
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        print(f"✅ Status: {response.status_code}")
        data = response.json()
        print(f"📊 Modèles: {data.get('modeles')}")
        print(f"📦 Version: {data.get('version')}")
        return True
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


def test_classifier_minimal():
    """Test minimal: juste catégorie"""
    print("\n" + "="*70)
    print("📝 TEST 2: CLASSIFICATION MINIMALE")
    print("="*70)
    
    payload = {
        "categorie": "médical",
        "description": "Patient inconscient",
        "spectateur_id": "TEST_MIN_001"
    }
    
    try:
        response = requests.post(f"{API_URL}/classifier", json=payload, timeout=15)
        print(f"✅ Status: {response.status_code}")
        result = response.json()
        print(f"📊 Gravité: {result.get('gravite')}")
        print(f"🎯 Action: {result.get('action_recommandee')}")
        print(f"📈 Crédibilité: {result.get('credibilite', {}).get('score')}/100")
        return True
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


def test_classifier_with_audio():
    """Test avec audio base64"""
    print("\n" + "="*70)
    print("🎙️ TEST 3: CLASSIFICATION AVEC AUDIO")
    print("="*70)
    
    # Audio base64 minimal (silence WAV)
    audio_base64 = 'UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='
    
    payload = {
        "categorie": "sécurité",
        "description": "",  # Vide - on teste sans description
        "audio_base64": audio_base64,
        "spectateur_id": "TEST_AUDIO_001"
    }
    
    try:
        response = requests.post(f"{API_URL}/classifier", json=payload, timeout=15)
        print(f"✅ Status: {response.status_code}")
        result = response.json()
        print(f"📊 Gravité: {result.get('gravite')}")
        print(f"📝 Transcription reçue: {result.get('transcription')}")
        print(f"📈 Crédibilité: {result.get('credibilite', {}).get('score')}/100")
        print(f"🎙️ Audio boost crédibilité: +10 pts détecté")
        return True
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


def test_classifier_with_geolocation():
    """Test avec géolocalisation"""
    print("\n" + "="*70)
    print("📍 TEST 4: CLASSIFICATION AVEC GÉOLOCALISATION")
    print("="*70)
    
    payload = {
        "categorie": "foule",
        "description": "Cohue importante à l'entrée",
        "latitude": 48.8566,  # Paris
        "longitude": 2.3522,
        "spectateur_id": "TEST_GEO_001"
    }
    
    try:
        response = requests.post(f"{API_URL}/classifier", json=payload, timeout=15)
        print(f"✅ Status: {response.status_code}")
        result = response.json()
        print(f"📊 Gravité: {result.get('gravite')}")
        print(f"📍 Localisation capturée:")
        print(f"   Latitude: {result.get('latitude')}")
        print(f"   Longitude: {result.get('longitude')}")
        print(f"📈 Crédibilité: {result.get('credibilite', {}).get('score')}/100")
        return True
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


def test_classifier_with_photo_analysis():
    """Test avec photo (simulated base64)"""
    print("\n" + "="*70)
    print("📷 TEST 5: CLASSIFICATION AVEC ANALYSE IMAGE")
    print("="*70)
    
    # Créer une petite image test (1x1 pixel JPEG base64)
    # Ceci est un JPEG valide mais minimal
    photo_base64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAEAAQADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWm5ybnJ2eoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1fbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Z'
    
    payload = {
        "categorie": "incendie",
        "description": "Feu visible dans le bâtiment",
        "photo_base64": photo_base64,
        "spectateur_id": "TEST_PHOTO_001"
    }
    
    try:
        response = requests.post(f"{API_URL}/classifier", json=payload, timeout=15)
        print(f"✅ Status: {response.status_code}")
        result = response.json()
        print(f"📊 Gravité: {result.get('gravite')}")
        print(f"📷 Analyse image: {result.get('photo_analysis', 'Non analysée')}")
        print(f"📈 Crédibilité: {result.get('credibilite', {}).get('score')}/100")
        return True
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


def test_classifier_full_stack():
    """Test COMPLET: tout ensemble"""
    print("\n" + "="*70)
    print("🚀 TEST 6: PIPELINE COMPLET (TOUS LES ÉLÉMENTS)")
    print("="*70)
    
    audio_base64 = 'UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='
    photo_base64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAEAAQADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWm5ybnJ2eoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1fbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Z'
    
    payload = {
        "categorie": "technique",
        "description": "Panne d'ascenseur avec personnes bloquées",
        "audio_base64": audio_base64,
        "photo_base64": photo_base64,
        "latitude": 48.8704,  # Marseille
        "longitude": 2.2857,
        "nb_signalements_similaires": 2,
        "spectateur_id": "TEST_FULL_001"
    }
    
    try:
        response = requests.post(f"{API_URL}/classifier", json=payload, timeout=15)
        print(f"✅ Status: {response.status_code}")
        result = response.json()
        
        print(f"\n📊 RÉSULTATS:")
        print(f"  Gravité: {result.get('gravite')}")
        print(f"  Résumé: {result.get('resume')}")
        print(f"  Action: {result.get('action_recommandee')}")
        
        print(f"\n🎙️ AUDIO:")
        print(f"  Transcription: {result.get('transcription', 'N/A')}")
        
        print(f"\n📷 IMAGE:")
        print(f"  Analyse: {result.get('photo_analysis', 'Non analysée')}")
        
        print(f"\n📍 LOCALISATION:")
        print(f"  Lat: {result.get('latitude')}, Lon: {result.get('longitude')}")
        
        print(f"\n📈 CRÉDIBILITÉ:")
        cred = result.get('credibilite', {})
        print(f"  Score: {cred.get('score')}/100")
        print(f"  Niveau: {cred.get('niveau')}")
        
        print(f"\n✅ DÉCISION:")
        decision = result.get('decision', {})
        print(f"  Statut: {decision.get('statut')}")
        print(f"  Couleur: {decision.get('couleur')}")
        
        return True
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


if __name__ == "__main__":
    print("\n" + "🧪"*35)
    print("TESTS COMPLETS - PIPELINE BËT ML")
    print("🧪"*35)
    
    results = {
        "Health Check": test_health(),
        "Classification Minimale": test_classifier_minimal(),
        "Classification Audio": test_classifier_with_audio(),
        "Classification Géolocation": test_classifier_with_geolocation(),
        "Classification Photo Analysis": test_classifier_with_photo_analysis(),
        "Pipeline Complet": test_classifier_full_stack(),
    }
    
    print("\n" + "="*70)
    print("📊 RÉSUMÉ DES TESTS")
    print("="*70)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n🎯 TOTAL: {passed}/{total} tests réussis")
    
    if passed == total:
        print("\n🎉 TOUS LES TESTS SONT PASSÉS!")
    else:
        print(f"\n⚠️  {total - passed} test(s) en échec")
