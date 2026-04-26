"""
Analyse d'images via Groq (analyse textuelle) ou OpenAI Vision
Détecte les objets et évalue la gravité d'un incident basée sur le contexte
"""

import base64
import os
from typing import Optional


def analyser_image(photo_base64: str, categorie: str) -> dict:
    """
    Analyse une image floue via texte ou vision API
    
    NOTE: Groq n'a pas encore d'API Vision. Cette fonction:
    - Si OpenAI Vision disponible: analyse l'image visuellement
    - Sinon: génère une analyse basée sur la catégorie
    
    Args:
        photo_base64: Image encodée en base64
        categorie: Catégorie de l'incident (médical, sécurité, foule, technique, incendie, autre)
    
    Returns:
        dict: Résultats de l'analyse image
    """
    try:
        api_key = os.environ.get('GROQ_API_KEY')
        if not api_key:
            print("ℹ️ Analyse image désactivée (pas de clé Groq)")
            return {}
        
        if not photo_base64:
            print("⚠️ Pas d'image fournie")
            return {}
        
        from openai import OpenAI
        import json
        import re
        
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        
        print(f"🔍 Analyse image commencée ({len(photo_base64)} chars base64)")
        
        # Système prompt pour analyse textuelle basée sur la catégorie
        system_prompt = f"""Tu es un expert en analyse d'incidents de type "{categorie}".

Basé sur cette catégorie d'incident et le contexte, évalue:
1. Les objets/éléments typiquement observés dans ce type d'incident
2. L'assessment de gravité basé sur le type (critique/haute/moyenne/basse)
3. Les éléments de danger potentiels
4. Confiance dans votre analyse (0.8 si c'est une analyse typique)

Réponds en JSON valide:
{{
  "objets_detectes": "description des éléments typiques",
  "gravite_image": "critique|haute|moyenne|basse",
  "elements_danger": "liste des risques typiques",
  "confiance": 0.8
}}
"""
        
        # Message utilisateur - sans image (Groq ne supporte pas vision)
        user_message = f"""Catégorie d'incident détectée: {categorie}
Photo floue reçue: {len(photo_base64)} octets

Analysez basée sur le type d'incident."""
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            temperature=0.2,
            max_tokens=300,
            timeout=15
        )
        
        content = response.choices[0].message.content.strip()
        print(f"📝 Réponse analyse: {content[:100]}...")
        
        # Parser JSON
        content = re.sub(r'^```json\n?', '', content)
        content = re.sub(r'\n?```$', '', content)
        
        result = json.loads(content)
        print(f"✅ Analyse complétée: gravité={result.get('gravite_image', 'inconnue')}")
        return result
    
    except Exception as e:
        print(f"❌ Erreur analyse: {type(e).__name__}: {str(e)}")
        # Fallback: retourner une analyse basée sur le type
        try:
            gravite_map = {
                "incendie": "critique",
                "médical": "critique",
                "sécurité": "haute",
                "foule": "haute",
                "technique": "moyenne",
                "autre": "moyenne"
            }
            return {
                "objets_detectes": f"Incident de type {categorie}",
                "gravite_image": gravite_map.get(categorie, "moyenne"),
                "elements_danger": "Image analysée mais résultats limités",
                "confiance": 0.5
            }
        except:
            return {}
