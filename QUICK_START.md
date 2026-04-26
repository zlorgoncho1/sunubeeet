# 🚀 QUICK START - Système Bët

Guide de démarrage en 5 minutes pour développeurs.

## 📋 Pré-requis

- Python 3.10+
- Node.js 18+ (frontend)
- PHP 8.1+ (backend Laravel)
- MySQL 8.0+ (database)

## 🎯 Scénario 1: Tester le ML en local

### Étape 1: Cloner et setup Python (2 min)
```bash
git clone https://github.com/sunubeeet/sunubeeet.git
cd sunubeeet/ml

# Créer environnement virtuel
python -m venv venv
venv\Scripts\activate  # Windows
# ou: source venv/bin/activate  # Linux/Mac

# Installer dépendances
pip install -r requirements.txt
```

### Étape 2: Configuration (1 min)
```bash
cp .env.example .env

# Éditer .env avec:
# GROQ_API_KEY=sk-votre-cle
# (DEEPGRAM_API_KEY est optionnel)
```

### Étape 3: Lancer les serveurs (2 min)

**Terminal 1: API (port 5000)**
```bash
python -m ml.api.app
```

**Terminal 2: Interface (port 8000)**
```bash
python serve_interface.py
```

### Étape 4: Accéder
- 🌐 Interface: http://localhost:8000/interface_simple.html
- 📊 Dashboard: http://localhost:8000/dashboard.html
- 📖 Docs API: http://localhost:5000/docs

---

## 🎯 Scénario 2: Intégrer sur Laravel (Backend)

### Étape 1: Configuration Laravel (3 min)

**1. Publier la config**
```bash
cd backend
php artisan vendor:publish --provider="Sunubeeet\LaravelAlerte\ServiceProvider"
```

**2. Ajouter variables .env**
```env
BET_API_URL=http://localhost:5000
BET_WEBHOOK_SECRET=your-super-secret-key
```

**3. Migrer la BD**
```bash
php artisan migrate
```

### Étape 2: Utiliser le service (2 min)

**Dans un Controller:**
```php
<?php
namespace App\Http\Controllers;

use App\Services\AlerteService;

class AlerteController extends Controller
{
    public function store(AlerteService $service)
    {
        $alerte = $service->create([
            'categorie' => 'medical',
            'description' => 'Patient inconscient',
            'spectateur_id' => auth()->id(),
            'latitude' => 14.7167,
            'longitude' => -17.4674,
        ]);
        
        return response()->json([
            'reference' => $alerte->reference,
            'status' => $alerte->status
        ]);
    }
}
```

### Étape 3: Route API

**routes/api.php**
```php
Route::post('/alertes', [AlerteController::class, 'store']);
Route::get('/alertes', [AlerteController::class, 'index']);
Route::get('/alertes/{alerte}', [AlerteController::class, 'show']);
```

---

## 🎯 Scénario 3: Développer le Frontend

### Étape 1: Setup (2 min)
```bash
cd frontend
npm install
```

### Étape 2: Environnement
```bash
cp .env.example .env
# Éditer:
# VITE_API_URL=http://localhost:5000
# VITE_BACKEND_URL=http://localhost:8000/api
```

### Étape 3: Lancer le dev server
```bash
npm run dev
```

### Étape 4: Accéder
```
http://localhost:5173
```

---

## ✅ Tests rapides

### ML: Tester le flux complet
```bash
cd ml
python test_alertes_workflow.py
```

**Résultat attendu:**
```
✅ Test 1: Création alerte PASS
✅ Test 2: Redondance détectée OK
✅ Test 3: Alerte valide OK
✅ Test 4: Listing OK
🎯 TOTAL: 4/4 tests réussis
```

### API: Test simple
```bash
curl -X POST http://localhost:5000/alerte/ \
  -H "Content-Type: application/json" \
  -d '{
    "categorie": "medical",
    "description": "Test",
    "spectateur_id": "TEST"
  }'
```

**Réponse attendue (< 100ms):**
```json
{
  "alerte_id": "uuid-xxx",
  "reference": "AL-2026-000001",
  "status": "processing",
  "message": "Alerte créée et en cours d'analyse"
}
```

---

## 🔗 Endpoints clés

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/alerte/` | POST | Créer une alerte |
| `/alerte/{id}` | GET | Récupérer une alerte |
| `/alerte/` | GET | Lister les alertes |
| `/classifier` | POST | Analyse immédiate (hérité) |
| `/health` | GET | Vérifier l'API |

---

## 🐛 Problèmes courants

### Port 5000/8000 déjà utilisé
```bash
# Windows
Get-NetTCPConnection -LocalPort 5000 | taskkill /PID {OwningProcess} /F

# Linux
lsof -ti:5000 | xargs kill -9
```

### GROQ_API_KEY invalide
```
❌ APIError: 401 Unauthorized
→ Vérifier la clé dans .env
→ Vérifier que le compte Groq a des crédits
```

### Audio transcription vide
```
→ Vérifier DEEPGRAM_API_KEY (si utilisé)
→ Vérifier la qualité du fichier audio
→ Consulter les logs API
```

---

## 📚 Documentation complète

- **ML**: `ml/README.md`
- **Backend**: `LARAVEL_INTEGRATION.md`
- **API Docs**: http://localhost:5000/docs (au démarrage)
- **Architecture**: `prompt/DESIGN.md`

---

## 🎉 Prochaines étapes

1. ✅ **ML fonctionne?** → Passez au backend Laravel
2. ✅ **Backend fonctionne?** → Développez le frontend
3. ✅ **Frontend fonctionne?** → Déployez en production

---

## 🆘 Aide

Pour plus d'aide:
- Consultez les README de chaque dossier (ml/, backend/, frontend/)
- Vérifiez les logs: `tail -f logs/*.log`
- Ouvrez une issue sur GitHub

**Dernière mise à jour**: 26 Avril 2026
