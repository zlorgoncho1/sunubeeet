"""
Calcul objectif du score de crédibilité
"""


def calculer_credibilite(data: dict, deepseek_result: dict) -> dict:
    """
    Calcule un score de crédibilité 0-100 basé sur des faits vérifiables.
    
    Args:
        data: Dict avec description, audio_base64, nb_signalements_similaires, historique
        deepseek_result: Résultats de DeepSeek avec coherence_categorie
    
    Returns:
        dict: {score, niveau, raisons}
    """
    score = 0
    raisons = []
    
    # 1. QUALITÉ DE LA DESCRIPTION (30 pts max)
    description = data.get('description', '').strip()
    if data.get('audio_base64'):
        # Si audio, on part du principe que la transcription est utilisée
        # On compte les mots
        word_count = len(description.split())
    else:
        word_count = len(description.split())
    
    if word_count >= 15:
        score += 30
        raisons.append(f"Description détaillée {word_count} mots (+30)")
    elif word_count >= 7:
        score += 15
        raisons.append(f"Description correcte {word_count} mots (+15)")
    else:
        score += 5
        raisons.append(f"Description vague {word_count} mots (+5)")
    
    # 2. COHÉRENCE CATÉGORIE vs DESCRIPTION (30 pts max)
    coherence = deepseek_result.get('coherence_categorie', 0.5)
    if coherence >= 0.8:
        score += 30
        raisons.append("Catégorie cohérente avec description (+30)")
    elif coherence >= 0.5:
        score += 15
        raisons.append("Catégorie partiellement cohérente (+15)")
    else:
        score -= 20  # Pénalité
        raisons.append("Catégorie incohérente avec description (-20)")
    
    # 3. DOUBLONS GPS - plusieurs signalements similaires (20 pts max)
    nb_signalements = data.get('nb_signalements_similaires', 0)
    if nb_signalements >= 3:
        score += 20
        raisons.append(f"{nb_signalements} signalements similaires detected (+20)")
    elif nb_signalements >= 1:
        score += 10
        raisons.append(f"{nb_signalements} signalement similaire (+10)")
    else:
        raisons.append("Aucun signalement similaire (+0)")
    
    # 4. DESCRIPTION VOCALE vs TEXTE (10 pts)
    if data.get('audio_base64'):
        score += 10
        raisons.append("Description vocale (plus sincère) (+10)")
    else:
        raisons.append("Description textuelle seule (+0)")
    
    # 5. HISTORIQUE DU COMPTE (10 pts max)
    historique = data.get('historique', {})
    if historique:
        total = historique.get('total', 0)
        valides = historique.get('valides', 0)
        if total > 0:
            taux_valides = valides / total
            if taux_valides >= 0.8:
                score += 10
                raisons.append(f"Bon historique ({taux_valides:.0%} valides) (+10)")
            elif taux_valides < 0.3:
                score -= 15  # Pénalité
                raisons.append(f"Mauvais historique ({taux_valides:.0%} valides) (-15)")
        else:
            raisons.append("Aucun historique (+0)")
    else:
        raisons.append("Aucun historique (+0)")
    
    # Clamp entre 0 et 100
    score = max(0, min(100, score))
    
    # Déterminer le niveau
    if score >= 70:
        niveau = "haute"
    elif score >= 40:
        niveau = "moyenne"
    else:
        niveau = "faible"
    
    return {
        "score": score,
        "niveau": niveau,
        "raisons": raisons
    }
