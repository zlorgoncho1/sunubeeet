"""
Entraîne un modèle unique pour prédire la GRAVITÉ des incidents
Utilise TfidfVectorizer + MultinomialNB
Sauvegarde en pickle : modele_gravite.pkl
"""

import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report

# Dataset d'entraînement : (description, gravité)
TRAINING_DATA = [
    # MÉDICAL - CRITIQUE
    ("une personne est tombée elle ne répond plus", "critique"),
    ("malaise cardiaque besoin médecin urgent", "critique"),
    ("arrêt cardiaque détecté personne inconsciente", "critique"),
    ("personne évanouie ne bouge plus", "critique"),
    ("accident grave avec perte de sang abondant", "critique"),
    
    # MÉDICAL - HAUTE
    ("quelqu'un a du mal à respirer", "haute"),
    ("convulsions détectées chez une personne", "haute"),
    ("réaction allergique grave difficulté respirer", "haute"),
    ("saignement nasal abondant", "haute"),
    
    # MÉDICAL - MOYENNE
    ("blessure légère au genou", "moyenne"),
    ("personne avec fièvre élevée", "moyenne"),
    ("nausées et étourdissements rapportés", "moyenne"),
    ("douleur thoracique modérée détectée", "moyenne"),
    ("petite coupure au bras", "moyenne"),
    
    # MÉDICAL - BASSE
    ("personne avec petit rhume", "basse"),
    ("fatigue générale signalée", "basse"),
    ("demande d'aspirine", "basse"),
    
    # SÉCURITÉ - CRITIQUE
    ("bagarre violente entre plusieurs personnes", "critique"),
    ("individu armé menaçant les spectateurs", "critique"),
    ("tentative de vol avec agression", "critique"),
    ("intrusion forcée dans zone sécurisée", "critique"),
    
    # SÉCURITÉ - HAUTE
    ("individu suspect rôde autour du site", "haute"),
    ("altercation violente détectée", "haute"),
    ("suspect tentant de s'enfuir", "haute"),
    ("menace verbale envers spectateurs", "haute"),
    
    # SÉCURITÉ - MOYENNE
    ("comportement bizarre d'un individu", "moyenne"),
    ("personne sans accréditation en zone", "moyenne"),
    ("bagarre verbale entre personnes", "moyenne"),
    
    # SÉCURITÉ - BASSE
    ("individu égaré demande direction", "basse"),
    ("personne sans badge à l'entrée", "basse"),
    
    # FOULE - CRITIQUE
    ("foule compacte impossible de circuler", "critique"),
    ("bousculade massive risque d'écrasement", "critique"),
    ("sortie bloquée foule paniquée", "critique"),
    ("congestion humaine critique zone dangereuse", "critique"),
    
    # FOULE - HAUTE
    ("bousculade à l'entrée principale", "haute"),
    ("afflux de personnes bloquant circulation", "haute"),
    ("densité extrême dans les gradins", "haute"),
    ("encombrement causant problèmes circulation", "haute"),
    
    # FOULE - MOYENNE
    ("longue file d'attente qui bloque le passage", "moyenne"),
    ("secteur surpeuplé mais contrôlable", "moyenne"),
    ("accumulation de personnes zone accès", "moyenne"),
    
    # INCENDIE - CRITIQUE
    ("fumée et flammes visibles côté vestiaires", "critique"),
    ("incendie détecté étage supérieur", "critique"),
    ("feu de grande ampleur propagation rapide", "critique"),
    ("explosion et feu au stade", "critique"),
    
    # INCENDIE - HAUTE
    ("odeur de brûlé dans le couloir", "haute"),
    ("fumée épaisse remontant des cuisines", "haute"),
    ("petit foyer d'incendie détecté", "haute"),
    
    # TECHNIQUE - CRITIQUE
    ("électricité coupée partout no power", "critique"),
    ("système de sécurité défaillant", "critique"),
    
    # TECHNIQUE - HAUTE
    ("générateur en panne site B", "haute"),
    ("système de ventilation en panne", "haute"),
    ("ascenseurs bloqués personne à l'intérieur", "haute"),
    
    # TECHNIQUE - MOYENNE
    ("micro ne fonctionne pas sur la scène", "moyenne"),
    ("éclairage défaillant dans une zone", "moyenne"),
    ("système de son en problème", "moyenne"),
    
    # AUTRE - CRITIQUE
    ("situation inconnue nécessite intervention", "critique"),
    ("situation urgente non classée", "critique"),
    
    # AUTRE - HAUTE
    ("objet suspect trouvé", "haute"),
    ("animal errant en zone", "haute"),
    
    # AUTRE - MOYENNE
    ("litière encombrée", "moyenne"),
    ("dégâts matériels mineurs", "moyenne"),
]

def train_gravite_model():
    """
    Entraîne et sauvegarde le modèle de gravité
    """
    descriptions = [item[0] for item in TRAINING_DATA]
    gravites = [item[1] for item in TRAINING_DATA]
    
    # Créer pipeline : TfidfVectorizer + MultinomialNB
    model = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=500, ngram_range=(1, 2), lowercase=True)),
        ('classifier', MultinomialNB())
    ])
    
    # Entraîner
    model.fit(descriptions, gravites)
    
    # Évaluation
    predictions = model.predict(descriptions)
    accuracy = accuracy_score(gravites, predictions)
    
    print("\n" + "="*60)
    print("📊 ENTRAÎNEMENT MODÈLE GRAVITÉ")
    print("="*60)
    print(f"✅ Précision sur dataset : {accuracy:.2%}")
    print(f"📚 Nombre d'exemples : {len(TRAINING_DATA)}")
    print("\nRapport de classification :")
    print(classification_report(gravites, predictions, labels=['basse', 'moyenne', 'haute', 'critique']))
    print("="*60)
    
    # Sauvegarder
    model_path = os.path.join(os.path.dirname(__file__), 'modele_gravite.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\n✅ Modèle sauvegardé : {model_path}")
    
    return model

if __name__ == "__main__":
    train_gravite_model()
