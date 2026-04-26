"""
Transcription audio → texte via Deepgram (gratuit et sans quota)
"""

import base64
import os
import requests


def transcrire_audio(audio_base64: str, format: str = "webm") -> str:
    """
    Transcription audio → texte en français via Deepgram
    
    Args:
        audio_base64: Audio encodé en base64
        format: Format du fichier (par défaut "webm")
    
    Returns:
        str: Texte transcrit en français, ou "" en cas d'erreur
    """
    try:
        # Vérifier si Deepgram est disponible
        api_key = os.environ.get('DEEPGRAM_API_KEY')
        if not api_key or api_key.strip() == "":
            print("ℹ️ Transcription désactivée (pas de clé Deepgram)")
            return ""
        
        # Décoder base64
        audio_data = base64.b64decode(audio_base64)
        print(f"📊 Audio reçu: {len(audio_data)} bytes")
        
        if len(audio_data) < 1000:
            print(f"⚠️ Audio trop court ({len(audio_data)} bytes), probablement vide")
            return ""
        
        # Appel API Deepgram
        url = "https://api.deepgram.com/v1/listen"
        
        # Détecter le type MIME
        mime_type = f"audio/{format}" if format != "webm" else "audio/webm"
        
        headers = {
            "Authorization": f"Token {api_key}",
            "Content-Type": mime_type
        }
        
        params = {
            "model": "nova-2",
            "language": "fr",  # Français
            "smart_format": "true",
            "include_intelligibility": "true"  # Pour meilleure détection
        }
        
        print(f"🎙️ Envoi vers Deepgram: {mime_type}")
        
        response = requests.post(
            url,
            headers=headers,
            params=params,
            data=audio_data,
            timeout=15
        )
        
        print(f"📡 Réponse Deepgram: {response.status_code}")
        
        if response.status_code != 200:
            error_data = response.json()
            error_msg = error_data.get('err_msg') or error_data.get('error', {}).get('message', str(response.text))
            print(f"⚠️ Erreur Deepgram ({response.status_code}): {error_msg}")
            print(f"📋 Réponse complète: {response.text}")
            return ""
        
        # Parser la réponse
        result = response.json()
        print(f"✓ Réponse JSON reçue")
        print(f"📋 Structure: {list(result.keys())}")
        
        # Naviguer la structure JSON
        channels = result.get("results", {}).get("channels", [])
        if not channels:
            print(f"⚠️ Pas de channels. Réponse complète: {result}")
            return ""
        
        alternatives = channels[0].get("alternatives", [])
        if not alternatives:
            print(f"⚠️ Pas d'alternatives. Channel[0]: {channels[0]}")
            return ""
        
        transcription = alternatives[0].get("transcript", "")
        
        if transcription.strip():
            print(f"✅ Transcription réussie: {len(transcription)} caractères")
            return transcription.strip()
        else:
            print("ℹ️ Deepgram n'a rien détecté (audio trop faible ou bruyant?)")
            return ""
    
    except Exception as e:
        print(f"⚠️ Erreur Deepgram: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return ""

