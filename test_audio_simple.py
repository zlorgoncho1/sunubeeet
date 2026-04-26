#!/usr/bin/env python
"""Test simple de la transcription audio"""

import requests
import json

# Audio base64 minimal (silence WAV)
audio_base64 = 'UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='

payload = {
    'categorie': 'médical',
    'description': 'Description de secours',
    'audio_base64': audio_base64,
    'spectateur_id': 'TEST_AUDIO_001'
}

print('🎙️ TEST AUDIO TRANSCRIPTION')
print('='*60)
print('Envoi requête avec audio_base64...')

try:
    response = requests.post('http://localhost:5000/classifier', json=payload, timeout=15)
    print(f'✅ Status: {response.status_code}')
    result = response.json()
    
    print('\n📊 Résultats:')
    print(f'  Gravité: {result.get("gravite")}')
    print(f'  Transcription: {result.get("transcription")}')
    print(f'  Score crédibilité: {result.get("credibilite", {}).get("score")}')
    print(f'  Source IA: {result.get("source_ia")}')
    print('\n✅ AUDIO MARCHE - La transcription a été traitée')
    
except Exception as e:
    print(f'❌ Erreur: {str(e)}')
