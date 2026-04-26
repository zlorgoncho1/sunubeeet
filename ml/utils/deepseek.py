"""
Analyse d'incidents via API Groq
"""

import json
import os
import re
from openai import OpenAI

SYSTEM_PROMPT = """Tu es un expert en gestion de crise et sécurité événementielle pour les Jeux Olympiques de la Jeunesse (JOJ) Dakar 2026.

Ton rôle :
- Analyser les descriptions d'incidents
- Évaluer la gravité (critique, haute, moyenne, basse)
- Vérifier la cohérence entre la catégorie déclarée et la description
- Fournir des recommandations d'action immédiates
- Évaluer ta confiance dans l'analyse

IMPORTANT :
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks
- Pas d'explication en prose, juste le JSON
- Si la description ne correspond pas à la catégorie, mets coherence_categorie bas (ex: 0.1)

Structure du JSON retourné :
{
  "gravite": "critique|haute|moyenne|basse",
  "resume": "résumé précis en 1 phrase",
  "action_recommandee": "action immédiate et précise",
  "justification": "explication concise du niveau de gravité",
  "coherence_categorie": 0.95,
  "confiance": 0.90
}
"""


def get_deepseek_client():
    """Créer un client Groq avec la clé API du .env"""
    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        raise ValueError("GROQ_API_KEY non définie dans .env")
    return OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1"
    )


def analyser_incident(categorie: str, description: str) -> dict:
    """
    Envoie la catégorie + description à Groq pour analyse
    
    Args:
        categorie: Catégorie de l'incident (médical, sécurité, foule, technique, incendie, autre)
        description: Description détaillée de l'incident
    
    Returns:
        dict: Résultats de l'analyse ou dict vide en cas d'erreur
    """
    try:
        client = get_deepseek_client()
        
        user_message = f"""Catégorie déclarée : {categorie}

Description : {description}

Analyse cet incident et retourne le JSON."""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.1,
            max_tokens=350,
            timeout=10
        )
        
        content = response.choices[0].message.content.strip()
        
        # Nettoyer les backticks markdown si présentes
        content = re.sub(r'^```json\n?', '', content)
        content = re.sub(r'\n?```$', '', content)
        content = content.strip()
        
        # Parser JSON
        result = json.loads(content)
        
        # Valider les champs obligatoires
        required_fields = ['gravite', 'resume', 'action_recommandee', 'justification', 'coherence_categorie', 'confiance']
        if not all(field in result for field in required_fields):
            print("⚠️ DeepSeek : champs manquants dans réponse")
            return {}
        
        # Clamp coherence et confiance entre 0 et 1
        result['coherence_categorie'] = max(0, min(1, result.get('coherence_categorie', 0.5)))
        result['confiance'] = max(0, min(1, result.get('confiance', 0.5)))
        
        return result
    
    except json.JSONDecodeError as e:
        print(f"⚠️ Erreur parsing JSON Groq : {str(e)}")
        return {}
    
    except Exception as e:
        print(f"⚠️ Erreur appel Groq : {str(e)}")
        return {}
