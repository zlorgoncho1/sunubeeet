# 🎯 Bët - Système d'Alerte Intelligent JOJ Dakar 2026

Plateforme complète d'analyse et de classification d'incidents en temps réel pour les Jeux Olympiques de la Jeunesse.

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Démarrage rapide](#démarrage-rapide)
4. [Structure du projet](#structure-du-projet)
5. [Documentation](#documentation)
6. [Contribution](#contribution)

---

## 🌟 Vue d'ensemble

**Bët** est une plateforme d'intelligence artificielle qui:

- 🚨 **Capture des alertes** via formulaire web (spectateurs/agents)
- 🤖 **Analyse automatique** via Groq LLaMA et scikit-learn
- 🎯 **Classification** en 6 catégories (médical, sécurité, foule, technique, incendie, autre)
- 🔴 **Évalue la gravité** (basse/moyenne/haute/critique)
- 🎙️ **Transcrit l'audio** en français (Deepgram)
- 📷 **Analyse les images** pour déterminer le niveau de danger
- 🚫 **Détecte les doublons** EN PRIORITÉ pour anti-spam
- 📍 **Géolocalise** les incidents
- 💾 **Intègre** avec Laravel backend

**Caractéristiques clés:**
- ✅ Réponse API < 100ms (détection redondance prioritaire)
- ✅ IA en arrière-plan (asynchrone)
- ✅ 91.94% accuracy sur classification
- ✅ Déploiement Docker-ready
- ✅ Dashboard de monitoring en temps réel

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              Frontend (Vue/React)                   │
│        Formulaire d'alerte + Dashboard              │
├─────────────────────────────────────────────────────┤
│          Interface HTML5 (port 8000)                │
│  - Microphone (MediaRecorder)                       │
│  - Photo upload (Canvas blur)                       │
│  - Géolocalisation (GPS)                            │
└──────────────────────┬────────────────────────────┘
                       │ HTTP POST
                       ▼
┌─────────────────────────────────────────────────────┐
│      API Bët ML (Python FastAPI)                    │
│           Port 5000                                 │
├─────────────────────────────────────────────────────┤
│  ✅ POST /alerte/          Créer alerte             │
│  ✅ GET /alerte/{id}       Récupérer alerte        │
│  ✅ GET /alerte/           Lister alertes           │
│  ✅ GET /health            Vérifier API             │
└──────────────────────┬────────────────────────────┘
                       │ HTTP + Webhooks
                       ▼
┌─────────────────────────────────────────────────────┐
│      Backend Laravel                                │
│    Stockage + Logique métier                        │
├─────────────────────────────────────────────────────┤
│  - Modèles DB (Eloquent)                            │
│  - Services (AlerteService)                         │
│  - Controllers (API REST)                           │
│  - Jobs (Background processing)                     │
│  - Notifications (WebSocket)                        │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Démarrage rapide

### 5 minutes pour tester le ML

```bash
# 1. Clone et setup (2 min)
git clone https://github.com/sunubeeet/sunubeeet.git
cd sunubeeet/ml
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 2. Configuration (1 min)
cp .env.example .env
# Éditer .env avec GROQ_API_KEY

# 3. Lancer (2 min)
# Terminal 1:
python -m ml.api.app

# Terminal 2:
python serve_interface.py

# 4. Accéder
# http://localhost:8000/interface_simple.html
```

**Pour plus de détails:** Consultez [QUICK_START.md](QUICK_START.md)

---

## 📁 Structure du projet

```
sunubeeet/
├── ml/                          # 🤖 Microservice ML (Python)
│   ├── api/
│   │   ├── app.py               # Application FastAPI
│   │   └── routes/
│   │       ├── alertes.py       # POST /alerte/ (nouveau)
│   │       └── classifier.py    # POST /classifier (hérité)
│   ├── models/
│   │   ├── alerte_models.py     # Pydantic models
│   │   └── modele_gravite.pkl   # Modèle scikit-learn
│   ├── services/
│   │   └── alerte_service.py    # Logique métier
│   ├── utils/
│   │   ├── transcription.py     # Deepgram (audio)
│   │   ├── deepseek.py          # Groq LLaMA (IA)
│   │   ├── vision.py            # Image analysis
│   │   ├── credibilite.py       # Crédibilité
│   │   └── actions.py           # Actions
│   ├── tests/
│   ├── interface_simple.html    # Formulaire spectateur
│   ├── dashboard.html           # Monitoring
│   ├── requirements.txt         # Dépendances
│   ├── README.md                # Doc ML
│   └── .gitignore               # Ignore files
│
├── backend/                     # 🔧 Backend Laravel
│   ├── app/
│   ├── routes/
│   ├── migrations/
│   └── .env.example
│
├── frontend/                    # 🎨 Frontend (Vue/React)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── prompt/                      # 📝 Documentation/Prompts
│   ├── DESIGN.md
│   ├── STACK.md
│   └── RULES.md
│
├── infra/                       # 🐳 Infrastructure (Docker)
├── bi/                          # 📊 Business Intelligence
├── llm-gateway/                 # 🌐 LLM Gateway
│
├── QUICK_START.md               # 🚀 Démarrage rapide
├── LARAVEL_INTEGRATION.md       # 📚 Intégration Laravel
├── .gitignore                   # Ignore files (root)
└── README.md                    # Ce fichier
```

---

## 📚 Documentation

### Par composant

| Composant | Fichier | Contenu |
|-----------|---------|---------|
| **ML** | `ml/README.md` | Architecture, API, endpoints, tests |
| **Backend** | `LARAVEL_INTEGRATION.md` | Intégration, migrations, models, controllers |
| **Démarrage** | `QUICK_START.md` | Setup 5 min, 3 scénarios, troubleshooting |
| **Architecture** | `prompt/DESIGN.md` | Design system, flux de données |
| **Stack** | `prompt/STACK.md` | Technologies utilisées |

### Par rôle

**Développeur ML/Python:**
- Lire: `ml/README.md` → `QUICK_START.md` (Scénario 1)
- Tester: `python test_alertes_workflow.py`
- API Docs: http://localhost:5000/docs

**Développeur Backend/Laravel:**
- Lire: `LARAVEL_INTEGRATION.md` → `QUICK_START.md` (Scénario 2)
- Migrer: `php artisan migrate`
- Routes: `backend/routes/api.php`

**Développeur Frontend:**
- Lire: `frontend/README.md` (non fourni, à créer)
- Setup: `npm install && npm run dev`
- Interface: http://localhost:5173 ou http://localhost:8000

---

## 🧪 Tests

### Tests ML
```bash
cd ml

# Test complet du flux
python test_alertes_workflow.py

# Test interface
python test_interface_adapted.py

# Diagnostic système
python diagnostic.py
```

### Tests API
```bash
# Créer une alerte
curl -X POST http://localhost:5000/alerte/ \
  -H "Content-Type: application/json" \
  -d '{"categorie": "medical", "description": "Test", "spectateur_id": "TEST"}'

# Lister les alertes
curl http://localhost:5000/alerte/
```

---

## 🔧 Configuration

### Variables d'environnement ML (`.env`)
```env
# Obligatoire
GROQ_API_KEY=sk-xxx

# Optionnel
DEEPGRAM_API_KEY=xxx
PORT=5000
DEBUG=False
```

### Variables d'environnement Backend (`.env`)
```env
BET_API_URL=http://localhost:5000
BET_WEBHOOK_SECRET=your-secret-key
BET_TIMEOUT=10
BET_STORAGE=database
```

---

## 🚢 Déploiement

### Docker (tous les services)
```bash
docker-compose up -d
```

### Gunicorn (ML seulement)
```bash
cd ml
gunicorn -w 4 -b 0.0.0.0:5000 ml.api.app:app
```

### Laravel (Backend)
```bash
cd backend
php artisan serve
```

---

## 📊 Flux de traitement

```
1. Utilisateur (spectateur) soumet alerte via formulaire
   └─ Catégorie + Description minimum (ou Audio)
   
2. Alerte envoyée à API Bët: POST /alerte/
   └─ < 100ms response guarantee
   
3. 🚨 EN PRIORITÉ: Vérification redondance
   └─ Même catégorie + proximité < 100m + IP + timing < 5min?
   
4. Si REDONDANCE:
   └─ Status: DUPLICATE
   └─ Lier à alerte originale
   └─ Répondre immédiatement
   
5. Si NOUVELLE:
   └─ Status: PROCESSING
   └─ Lancer IA en background
   └─ Répondre immédiatement avec référence
   
6. 🤖 IA en arrière-plan (3-5s):
   ├─ Transcrire audio (Deepgram)
   ├─ Analyser photo (Groq vision)
   ├─ Analyse complète (Groq LLaMA)
   └─ Mettre à jour alerte en BD
   
7. Status final: VALIDATED
   └─ Notifier stakeholders
   └─ Dashboard actualisé
```

---

## 🔐 Sécurité

- ✅ Variables d'env protégées (.env dans .gitignore)
- ✅ Validation Pydantic (ML)
- ✅ Validation Laravel (Backend)
- ⏳ Rate limiting (À implémenter)
- ⏳ Authentification JWT (À implémenter)
- ⏳ HTTPS en production (À configurer)

---

## 🐛 Troubleshooting

### Port déjà utilisé
```bash
# Windows
Get-NetTCPConnection -LocalPort 5000 | taskkill /PID {OwningProcess} /F

# Linux
lsof -ti:5000 | xargs kill -9
```

### API ne répond pas
```bash
# Vérifier que l'API tourne
curl http://localhost:5000/health

# Vérifier les logs
tail -f logs/api.log
```

### Tests échouent
```bash
# Vérifier les variables d'env
cat ml/.env

# Tester directement
python -c "import requests; print(requests.get('http://localhost:5000/health').status_code)"
```

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/xyz`)
3. Commit les changements (`git commit -am 'Add xyz'`)
4. Push vers la branche (`git push origin feature/xyz`)
5. Ouvrir une Pull Request

**Conventions:**
- Messages de commit en français
- Tests obligatoires avant PR
- Code formaté (black pour Python, prettier pour JS)

---

## 📈 Performance

| Opération | Temps |
|-----------|-------|
| Création alerte | < 100ms |
| Redondance detection | < 50ms |
| IA complète | 3-5s |
| Audio transcription | 1-3s |
| Image analysis | 1-2s |

---

## 📞 Support

- **Issues**: GitHub Issues
- **Email**: support@sunubeeet.com
- **Chat**: Slack (pour team interne)

---

## 📝 Licence

Propriétaire - Sunubeeet © 2026

---

## 🎉 Dernières mises à jour

- **26 Avril 2026**: Système d'alerte EN PRIORITÉ + redondance + IA background
- **25 Avril 2026**: Intégration Deepgram + Groq LLaMA
- **20 Avril 2026**: Structure ML + API initiale

---

**Bienvenue dans l'équipe Bët! 🚀**
