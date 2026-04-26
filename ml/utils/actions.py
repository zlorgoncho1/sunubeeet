"""
Dictionnaire d'actions recommandées
"""

ACTIONS = {
    ("médical",   "critique"): "Envoyer équipe médicale immédiatement",
    ("médical",   "haute"):    "Alerter infirmier de zone",
    ("médical",   "moyenne"):  "Surveiller — prévenir médecin si aggravation",
    ("médical",   "basse"):    "Informer le poste médical",
    
    ("sécurité",  "critique"): "Intervention sécurité + police immédiate",
    ("sécurité",  "haute"):    "Alerter agents sécurité zone concernée",
    ("sécurité",  "moyenne"):  "Envoyer agent de surveillance",
    ("sécurité",  "basse"):    "Surveiller la situation",
    
    ("foule",     "critique"): "Évacuation partielle — activer sortie de secours",
    ("foule",     "haute"):    "Rediriger flux vers sortie alternative",
    ("foule",     "moyenne"):  "Renforcer présence agents en zone",
    ("foule",     "basse"):    "Monitorer le flux de personnes",
    
    ("incendie",  "critique"): "Évacuation immédiate + appel pompiers",
    ("incendie",  "haute"):    "Alerter équipe sécurité + vérifier source",
    ("incendie",  "moyenne"):  "Envoyer agent vérifier sur place",
    ("incendie",  "basse"):    "Monitorer la situation",
    
    ("technique", "critique"): "Intervention technique urgente",
    ("technique", "haute"):    "Envoyer technicien d'urgence",
    ("technique", "moyenne"):  "Envoyer technicien disponible",
    ("technique", "basse"):    "Planifier intervention technique",
    
    ("autre",     "critique"): "Envoyer superviseur immédiatement",
    ("autre",     "haute"):    "Envoyer agent évaluer la situation",
    ("autre",     "moyenne"):  "Enregistrer et surveiller",
    ("autre",     "basse"):    "Enregistrer l'incident",
}


def get_action(categorie: str, gravite: str) -> str:
    """
    Retourne l'action recommandée pour un couple (catégorie, gravité)
    
    Args:
        categorie: Catégorie de l'incident
        gravite: Gravité estimée
    
    Returns:
        str: Action recommandée
    """
    return ACTIONS.get(
        (categorie.lower(), gravite.lower()),
        "Envoyer agent de terrain disponible"
    )
