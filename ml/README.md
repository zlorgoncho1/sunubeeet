# 🚀 Bët ML Microservice

Système d'intelligence artificielle pour la classification et l'analyse d'incidents en temps réel - JOJ Dakar 2026

## 📋 Vue d'ensemble

Le microservice ML Bët est conçu pour:
- 🎯 **Classifier les incidents** selon 6 catégories (médical, sécurité, foule, technique, incendie, autre)
- 📊 **Analyser la gravité** avec un modèle scikit-learn entraîné (91.94% accuracy)
- 🔊 **Transcrire l'audio** en texte français via Deepgram
- 📷 **Analyser les images** pour déterminer le niveau de gravité
- 📍 **Géolocaliser** les incidents
- 🚨 **Détecter les redondances** (anti-spam) EN PRIORITÉ
- 🤖 **Traiter en arrière-plan** avec IA complète (Groq LLaMA)

---

## 🚀 Démarrage rapide

### 1. Installer les dépendances

```bash
cd ml
pip install -r requirements.txt
```

### 2. Configurer les clés API

```bash
cp .env.example .env
# Éditer .env avec vos clés:
# GROQ_API_KEY=sk-xxx (IA analysis)
# DEEPGRAM_API_KEY=xxx (audio transcription - optionnel)
```

### 3. Lancer l'API (Port 5000)

```bash
python -m ml.api.app
```

### 4. Lancer l'interface (Port 8000) - dans un autre terminal

```bash
python serve_interface.py
```

### 5. Accéder à l'application

- 🌐 Interface: http://localhost:8000/interface_simple.html
- 📊 Dashboard: http://localhost:8000/dashboard.html
- 📖 Docs API: http://localhost:5000/docs

---

## 📊 Architecture

```
ml/
├── models/
│   ├── alerte_models.py         ← Pydantic models (AlerteStatus, etc.)
│   └── modele_gravite.pkl       ← Modèle scikit-learn (91.94%)
│
├── api/
│   ├── app.py                   ← Application FastAPI principale
│   └── routes/
│       ├── alertes.py           ← POST /alerte/ (système NOUVEAU)
│       └── classifier.py        ← POST /classifier (hérité)
│
├── services/
│   └── alerte_service.py        ← Logique métier (création, redondance, IA)
│
├── utils/
│   ├── transcription.py         ← Deepgram: audio → texte français
│   ├── deepseek.py              ← Groq LLaMA: analyse IA complète
│   ├── credibilite.py           ← Score crédibilité
│   ├── actions.py               ← Mapping action recommandée
│   └── vision.py                ← Analyse image
│
├── interface_simple.html        ← Formulaire web (spectateur)
├── dashboard.html               ← Dashboard monitoring
│
└── tests/
    ├── test_api.py              ← Tests endpoints
    ├── test_alertes_workflow.py ← Tests redondance & flux
    └── test_interface_adapted.py ← Tests interface
```

---

## 🔌 Endpoints API

### POST /alerte/ ⭐ (NOUVEAU)
Créer une alerte - **détection redondance EN PRIORITÉ, IA en background**

**Requête:**
```json
{
  "categorie": "medical",
  "description": "Patient inconscient",
  "audio_base64": null,
  "photo_base64": null,
  "latitude": 14.7167,
  "longitude": -17.4674,
  "spectateur_id": "SPEC_123",
  "client_fingerprint": "fp_xxx"
}
```

**Réponse (< 100ms):**
```json
{
  "alerte_id": "b398...",
  "reference": "AL-2026-000001",
  "status": "processing",
  "message": "Alerte créée et en cours d'analyse",
  "is_duplicate": false,
  "duplicate_of_reference": null,
  "created_at": "2026-04-26T10:30:00"
}
```

**Status possibles:**
- `processing` → Alerte acceptée, IA en arrière-plan
- `duplicate` → Redondance détectée (même catégorie, proximité <100m, IP, timing <5min)
- `rejected` → Données invalides

---

### GET /alerte/{alerte_id}
Récupérer une alerte

---

### GET /alerte/
Lister les alertes récentes (limit=10 défaut)

---

### POST /classifier (HÉRITÉ)
Analyse immédiate complète (pour compatibilité)

---

## 🚨 Système de redondance

**Détection EN PRIORITÉ (< 50ms):**

Une alerte est marquée `duplicate` si:
- ✅ Même catégorie
- ✅ Proximité géographique < 100m (0.001° lat/lon)
- ✅ Même IP client OU même fingerprint
- ✅ Créée < 5 minutes avant

**Avantages:**
- Anti-spam automatique
- Réduit la charge IA
- Piste de redondance (champ `duplicate_of_alerte_id`)

---

## 🤖 IA en arrière-plan

Après création d'une alerte (status=processing):

1. **Transcrire audio** (si présent) → Deepgram
2. **Analyser image** (si présente) → Groq vision
3. **Analyse complète** → Groq LLaMA (3.3 70B)
4. **Mettre à jour l'alerte** avec:
   - `ia_gravite`: basse/moyenne/haute/critique
   - `ia_transcription`: texte d'audio
   - `ia_photo_analysis`: analyse visuelle
   - `ia_confidence`: 0-1

**Status → VALIDATED** après IA

---

## ⚙️ Configuration

Éditer `.env`:

```bash
# Obligatoire
GROQ_API_KEY=sk-xxx

# Optionnel
DEEPGRAM_API_KEY=xxx
PORT=5000
```

---

## 🧪 Tests

```bash
# Test complet du flux
python test_alertes_workflow.py

# Test interface
python test_interface_adapted.py

# Diagnostic système
python diagnostic.py
```

---

## 📈 Performance

| Opération | Temps |
|-----------|-------|
| Création alerte | < 100ms |
| Redondance detection | < 50ms |
| IA complète (background) | 3-5s |
| Audio transcription | 1-3s |
| Image analysis | 1-2s |

---

## 🔗 Intégration Backend (Laravel)

Voir [LARAVEL_INTEGRATION.md](../LARAVEL_INTEGRATION.md)

---

## 📞 Support

- Docs API: http://localhost:5000/docs
- Dashboard: http://localhost:8000/dashboard.html

---

## 📝 Licence

© 2026 Bët JOJ Dakar - Team ML
