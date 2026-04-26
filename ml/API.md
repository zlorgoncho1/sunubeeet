# Bët ML — référence technique de l'API

Microservice de calcul stateless. Toutes les routes sont sous `/v1`. Aucune
donnée n'est persistée côté ml/ : Laravel reste source de vérité.

- **Source de vérité des contrats** : [`schemas.py`](schemas.py) — pydantic v2.
- **Doc auto-générée** : `http://localhost:5000/docs` (Swagger UI) une fois le
  service démarré, ou `/redoc` pour la version ReDoc.
- **OpenAPI brut** : `http://localhost:5000/openapi.json`.

---

## Sommaire

- [Conventions transverses](#conventions-transverses)
- [Architecture](#architecture)
- [Modèles utilisés](#modèles-utilisés)
- [Endpoints](#endpoints)
  - [`GET  /v1/health`](#get-v1health)
  - [`POST /v1/classify`](#post-v1classify)
  - [`POST /v1/embed`](#post-v1embed)
  - [`POST /v1/dedup`](#post-v1dedup)
  - [`POST /v1/transcribe`](#post-v1transcribe)
  - [`POST /v1/vision/blur-faces`](#post-v1visionblur-faces)
  - [`POST /v1/vision/analyze`](#post-v1visionanalyze)
- [Codes d'erreur](#codes-derreur)
- [Performance](#performance)
- [Intégration côté Laravel](#intégration-côté-laravel)
- [Déploiement](#déploiement)
- [Sécurité](#sécurité)

---

## Conventions transverses

### Format des requêtes / réponses

- **Content-Type** : `application/json` pour requêtes et réponses.
- **Encodage des médias** : `base64` (sans préfixe `data:`) ou URL HTTPS
  téléchargeable. Les schémas qui acceptent un média ont **deux champs
  exclusifs** : `media_url` ou `media_base64` (audio : `audio_base64`).
  Si les deux sont fournis, `media_url` est utilisé.
- **Limite de taille** : 20 Mo par média (cap dur dans
  [`services/storage.py`](services/storage.py)).
- **Taxonomie** : alignée sur [`prompt/TYPES.md`](../prompt/TYPES.md) §3.2 et §3.4.
  - Catégories (9) : `health`, `security`, `crowd`, `access_blocked`,
    `fire_danger`, `lost_found`, `logistics`, `transport`, `other`.
  - Sévérités (4) : `low`, `medium`, `high`, `critical`.

### Authentification

Aucune. Le service est conçu pour vivre **sur le réseau Docker interne** et
n'être appelé que par les jobs Laravel. **Ne jamais exposer publiquement.**
En prod, restreindre `CORS_ORIGINS` aux origines internes uniquement.

### Validation

Tous les payloads passent par un schéma pydantic strict. Les erreurs de
validation renvoient `422 Unprocessable Entity` avec le détail FastAPI
standard :

```json
{
  "detail": [
    { "loc": ["body", "description"], "msg": "string too short", "type": "string_too_short" }
  ]
}
```

### Idempotence

Tous les endpoints sont **purement fonctionnels** : aucun effet de bord, pas
d'écriture en base, pas d'envoi de mail. Réappeler la même requête donne le
même résultat (modulo la non-déterminisme des LLMs avec `temperature > 0`).

---

## Architecture

```
┌──────────────────────┐         POST /v1/...           ┌─────────────────────┐
│  Laravel (jobs)      │  ─────────────────────────────▶│  ml/ FastAPI :5000  │
│  Source de vérité    │◀─────────────────────────────  │  Stateless compute  │
└──────────────────────┘         JSON response          └────────┬────────────┘
                                                                  │
                                       ┌──────────────────────────┼─────────────────────────┐
                                       │                          │                         │
                                  ┌────▼─────┐         ┌──────────▼──────────┐    ┌─────────▼────────┐
                                  │  Groq    │         │  sentence-          │    │   Deepgram       │
                                  │  (cloud) │         │  transformers (CPU) │    │   (cloud)        │
                                  │  free    │         │  local, free        │    │   free 200$      │
                                  └──────────┘         └─────────────────────┘    └──────────────────┘
                                       │                          │
                                  Llama 3.3 70B               MiniLM L12 v2          + OpenCV Haar
                                  Llama-4 Scout (vision)       (384 dim, multi)        local, free
```

### Responsabilités

- **ml/** : tout ce qui demande un modèle (LLM, embeddings, vision, ASR).
- **Laravel** : orchestration, persistance, anti-spam spatio-temporel,
  policies, JWT, médias signés, queue.
- **Frontend** : ne parle **jamais** directement à ml/. Tout passe par Laravel.
  Exception : la page [`api_tester.html`](api_tester.html) qui est un outil
  de dev uniquement.

---

## Modèles utilisés

| Endpoint | Modèle | Provider | Coût | Déploiement |
|---|---|---|---|---|
| `/classify` | `llama-3.3-70b-versatile` | Groq Cloud | free tier | API |
| `/vision/analyze` | `meta-llama/llama-4-scout-17b-16e-instruct` | Groq Cloud | free tier | API |
| `/embed`, `/dedup` | `paraphrase-multilingual-MiniLM-L12-v2` | sentence-transformers (HF) | gratuit | local CPU |
| `/transcribe` | `nova-2` (FR) | Deepgram | 200 $ offerts | API |
| `/vision/blur-faces` | `haarcascade_frontalface_default.xml` | OpenCV | gratuit | local CPU |

**Overrides** via env vars :

```env
GROQ_TEXT_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

---

## Endpoints

### `GET /v1/health`

Health check léger. Renvoie le statut du service et l'état de configuration
des clés API externes.

**Requête**

```bash
curl http://localhost:5000/v1/health
```

**Réponse `200`**

```json
{
  "status": "ok",
  "version": "2.0.0",
  "services": {
    "groq": true,
    "deepgram": false
  }
}
```

`services.groq` / `services.deepgram` indiquent uniquement la **présence**
des clés en env, pas leur validité. Pour vérifier la validité, appeler un
endpoint applicatif.

---

### `POST /v1/classify`

Catégorie + sévérité **zero-shot** d'une alerte à partir de la description
écrite et de la transcription audio. Sert à confirmer / corriger la catégorie
déclarée par le spectateur et à proposer une sévérité au coordinateur.

**Quand l'appeler côté Laravel** : depuis un job `EnrichAlerteJob` dispatché
après la création de l'alerte. Stocker les résultats dans des colonnes
`category_predicted`, `severity_predicted`, `category_coherence` —
**advisory**, le coordinateur décide.

**Requête**

```json
{
  "description": "Une personne s'est effondrée près de la sortie nord, elle ne répond plus.",
  "declared_category": "health",
  "transcription": "j'ai vu un homme tomber il bouge plus"
}
```

| Champ | Type | Requis | Notes |
|---|---|---|---|
| `description` | string (1-4000) | ✅ | description écrite par le spectateur |
| `declared_category` | enum Category | ❌ | catégorie sélectionnée dans le formulaire |
| `transcription` | string (≤ 8000) | ❌ | sortie de `/v1/transcribe` si audio présent |

**Réponse `200`**

```json
{
  "category": "health",
  "severity": "critical",
  "category_coherence": 0.95,
  "confidence": 0.88,
  "summary": "Personne inconsciente en zone nord, intervention médicale urgente requise.",
  "justification": "Perte de conscience signalée + absence de réponse → vie en danger immédiat."
}
```

| Champ | Type | Notes |
|---|---|---|
| `category` | enum Category | catégorie retenue après analyse (peut différer de `declared_category`) |
| `severity` | enum Severity | `low` / `medium` / `high` / `critical` |
| `category_coherence` | float [0,1] | < 0.4 = la description contredit la catégorie déclarée |
| `confidence` | float [0,1] | confiance globale du modèle dans son verdict |
| `summary` | string | 1-2 phrases factuelles |
| `justification` | string | une phrase justifiant la sévérité |

**Erreurs**

- `422` : description vide ou taxonomie invalide en entrée.
- `502 LLM unavailable` : Groq injoignable ou clé invalide.
- `502 LLM returned invalid taxonomy` : le modèle a renvoyé du texte hors
  taxonomie (rare avec `response_format: json_object`).

**Implementation**: [`api/routes/classify.py`](api/routes/classify.py),
[`services/groq.py:chat_json`](services/groq.py).

---

### `POST /v1/embed`

Calcule un vecteur d'embedding multilingue (FR / Wolof / EN) pour chaque
texte fourni. Utilisé pour stocker des `embedding vector(384)` en
`pgvector` côté Laravel et faire de la recherche par similarité.

**Requête**

```json
{
  "texts": [
    "Bagarre violente à la sortie nord",
    "Personne inconsciente près du gradin B"
  ]
}
```

| Champ | Type | Requis | Notes |
|---|---|---|---|
| `texts` | string[] (1-64) | ✅ | aucun élément vide, longueur libre par texte |

**Réponse `200`**

```json
{
  "model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
  "dim": 384,
  "vectors": [
    [-0.0231, 0.0571, ..., 0.0018],
    [ 0.0142, -0.0089, ..., -0.0431]
  ]
}
```

Les vecteurs sont **L2-normalisés** : un produit scalaire entre deux vecteurs
= cosinus. Dimension : **384** (fixe pour ce modèle).

**Erreurs**

- `422` : `texts` vide ou contient des chaînes vides.

---

### `POST /v1/dedup`

Compare une alerte aux voisins spatio-temporels candidats déjà filtrés par
Laravel et identifie les **doublons sémantiques** que la règle `même
catégorie + GPS<100m + <2min` de [`AntiSpamService.php`](../backend/api/app/Services/AntiSpamService.php)
manque (paraphrase, multilingue).

**Requête**

```json
{
  "text": "Une bagarre vient d'éclater à la sortie nord du stade",
  "neighbors": [
    { "id": "a1", "text": "Bagarre côté sortie nord, plusieurs personnes" },
    { "id": "a2", "text": "Pas d'eau aux toilettes du secteur B" },
    { "id": "a3", "text": "Altercation violente près du gradin nord" }
  ],
  "threshold": 0.78
}
```

| Champ | Type | Requis | Défaut | Notes |
|---|---|---|---|---|
| `text` | string (1-4000) | ✅ | — | texte de la nouvelle alerte |
| `neighbors` | DedupNeighbor[] (≤ 64) | ❌ | `[]` | alertes candidates pré-filtrées par Laravel |
| `threshold` | float [0,1] | ❌ | `0.78` | seuil au-delà duquel `is_duplicate=true` |

**Réponse `200`**

```json
{
  "is_duplicate": true,
  "best_match": { "id": "a1", "similarity": 0.892 },
  "matches": [
    { "id": "a1", "similarity": 0.892 },
    { "id": "a3", "similarity": 0.847 },
    { "id": "a2", "similarity": 0.214 }
  ]
}
```

`matches` est trié par similarité décroissante. `is_duplicate` = `true` ssi
`best_match.similarity >= threshold`.

**Recommandation seuil** : commencer à `0.78`, monitorer les faux positifs
sur quelques jours puis ajuster. Trop bas → fusion abusive, trop haut → on
manque les paraphrases.

---

### `POST /v1/transcribe`

Transcription audio FR via Deepgram nova-2. Accepte une URL signée (mode
**pull**, recommandé en prod) ou des bytes en base64 (fallback).

**Requête (URL — préféré)**

```json
{
  "media_url": "https://minio.internal/bet-media/abc?X-Amz-Signature=...",
  "language": "fr"
}
```

**Requête (base64 — fallback / hackathon)**

```json
{
  "audio_base64": "GkXfowEAAAAAAAAfQ...",
  "language": "fr"
}
```

| Champ | Type | Requis | Défaut | Notes |
|---|---|---|---|---|
| `media_url` | string | au moins un | — | URL HTTPS téléchargeable |
| `audio_base64` | string | au moins un | — | bytes audio sans préfixe `data:` |
| `language` | string | ❌ | `"fr"` | code langue Deepgram |

**Réponse `200`**

```json
{
  "text": "j'ai vu un homme tomber il bouge plus",
  "language": "fr",
  "confidence": 0.94,
  "duration_seconds": 4.2
}
```

`confidence` provient de Deepgram (alternative principale, premier
channel). `text` peut être vide (`""`) si l'audio est trop court ou non
reconnaissable — c'est une réponse valide, pas une erreur.

**Erreurs**

- `422` : ni `media_url` ni `audio_base64`.
- `503 DEEPGRAM_API_KEY not set`.
- `502 transcription failed: ...` : erreur Deepgram (timeout, 4xx, parse).

**Note** : envoyer une URL plutôt que du base64. Le base64 est ~33 % plus
gros que les bytes bruts et bloque le worker pendant le transfert.

---

### `POST /v1/vision/blur-faces`

Détecte les visages frontaux et applique un flou irréversible **uniquement
sur les bounding-boxes détectées** — la scène reste lisible pour le
coordinateur. Implémente la règle privacy de [`prompt/RULES.md`](../prompt/RULES.md).

**Pipeline** :
1. Décodage de l'image (JPEG/PNG/WebP via OpenCV).
2. Conversion grayscale + Haar cascade frontal-face (`scaleFactor=1.1`,
   `minNeighbors=5`, `minSize` proportionnelle à l'image).
3. Pour chaque visage : padding 15 %, downsample à 16×16 + upsample nearest
   (= pixelisation), Gaussian (51, 51) par-dessus pour lisser les bords.
4. Ré-encodage JPEG q=85.

**Requête**

```json
{ "media_url": "https://minio.internal/bet-media/photo123?signature=..." }
```

ou

```json
{ "media_base64": "/9j/4AAQSkZJRgABAQAAAQ..." }
```

**Réponse `200`**

```json
{
  "faces_found": 2,
  "blurred_base64": "/9j/4AAQSkZJRgABAQEASABIAA...",
  "width": 3840,
  "height": 2160
}
```

`blurred_base64` est un JPEG. Si `faces_found = 0`, l'image renvoyée est
identique à l'entrée — le **job Laravel** doit décider de la politique
(stocker malgré tout en `audit/`, ou flagger pour revue manuelle).

**Erreurs**

- `400 invalid image bytes` : décodage OpenCV échoué.
- `400 media too large: ...` : > 20 Mo.

**Limites du Haar V1** :
- Mauvais sur profils latéraux et visages de petite taille (< 1/40 de la
  largeur image).
- À upgrader vers OpenCV DNN `res10_300x300_ssd` ou MediaPipe post-hackathon.
  Le contrat d'API ne change pas, seulement le détecteur en interne.

---

### `POST /v1/vision/analyze`

Analyse multimodale d'une image via Groq Llama-4 Scout vision. Sort des
tags visuels concrets, un flag fumée/feu, une densité de foule ordinale,
un niveau de danger et une description.

**Quand l'appeler** : sur les images **déjà passées par `/blur-faces`**
pour ne pas exposer de PII au LLM.

**Requête**

```json
{
  "media_url": "https://minio.internal/bet-media/photo123_blurred?signature=...",
  "category_hint": "fire_danger"
}
```

**Réponse `200`**

```json
{
  "tags": ["smoke", "stairs", "emergency_exit", "panicked_crowd"],
  "fire_or_smoke": true,
  "crowd_density": "high",
  "danger_level": "high",
  "description": "Fumée épaisse remontant d'un escalier, foule visible dans le couloir adjacent.",
  "confidence": 0.86
}
```

| Champ | Type | Notes |
|---|---|---|
| `tags` | string[] (≤ 12, ≤ 40 chars chacun) | mots-clés visuels concrets |
| `fire_or_smoke` | bool | présence détectable de feu ou de fumée |
| `crowd_density` | enum `none\|low\|medium\|high` | estimation ordinale |
| `danger_level` | enum Severity | reflète ce que le modèle voit, pas la catégorie déclarée |
| `description` | string | 1-2 phrases factuelles |
| `confidence` | float [0,1] | confiance du modèle |

**Erreurs**

- `400` : image invalide ou trop grosse.
- `502 vision LLM unavailable` : Groq injoignable.

**Note** : `category_hint` aide le modèle à rester focalisé mais
**n'influence pas `danger_level`** — le modèle doit décrire ce qu'il voit,
pas valider la déclaration. Si l'utilisateur a déclaré `health` mais
l'image montre clairement de la fumée, le `danger_level` reflète la fumée.

---

## Codes d'erreur

| Code | Signification |
|---|---|
| `200` | OK |
| `400` | Payload mal formé (image invalide, taille excessive) |
| `422` | Échec de validation pydantic (champs manquants ou invalides) |
| `502` | Dépendance LLM indisponible (Groq down ou clé invalide) |
| `503` | Clé externe manquante (`DEEPGRAM_API_KEY`, `GROQ_API_KEY`) |
| `5xx` | Erreur interne — vérifier les logs uvicorn |

Le format d'erreur FastAPI standard :

```json
{ "detail": "message ou tableau d'erreurs de validation" }
```

---

## Performance

Mesures indicatives sur un Mac M1 / Linux x86 4 cœurs, free tier Groq, charge
faible. À recalibrer en charge réelle.

| Endpoint | p50 | p95 | Limite primaire |
|---|---|---|---|
| `/v1/health` | < 5 ms | < 20 ms | — |
| `/v1/embed` (5 textes) | 30-80 ms | 150 ms | CPU |
| `/v1/dedup` (10 voisins) | 50-120 ms | 200 ms | CPU |
| `/v1/classify` | 600-1200 ms | 2.5 s | latence Groq |
| `/v1/transcribe` (5 s audio) | 1-3 s | 5 s | latence Deepgram |
| `/v1/vision/blur-faces` (4K) | 200-400 ms | 800 ms | CPU OpenCV |
| `/v1/vision/analyze` | 1.5-3 s | 6 s | latence Groq vision |

**Modèle d'embeddings** : ~120 Mo téléchargés au premier `embed`/`dedup`. Mettre
`WARM_EMBEDDINGS=true` pour précharger au démarrage et éviter la latence du
premier appel.

**Workers** : 2 workers uvicorn par défaut ([Procfile](Procfile),
[Dockerfile](../infra/docker/ml/Dockerfile)). Le modèle d'embeddings est
chargé **par worker** (pas de mémoire partagée) — chaque worker prend ~500 Mo.

---

## Intégration côté Laravel

### Configuration

```php
// config/services.php
'ml' => [
    'url'     => env('ML_URL', 'http://ml:5000'),
    'timeout' => env('ML_TIMEOUT', 15),
],
```

### Pattern recommandé : un job par appel

```php
// app/Jobs/EnrichAlerteJob.php
public function handle(): void
{
    $response = Http::timeout(config('services.ml.timeout'))
        ->post(config('services.ml.url').'/v1/classify', [
            'description'       => $this->alerte->description,
            'declared_category' => $this->alerte->category,
            'transcription'     => $this->alerte->transcription,
        ])
        ->throw()
        ->json();

    $this->alerte->update([
        'category_predicted'   => $response['category'],
        'severity_predicted'   => $response['severity'],
        'category_coherence'   => $response['category_coherence'],
        'classification_summary' => $response['summary'],
    ]);
}
```

### Pattern dédup (compléter `AntiSpamService`)

```php
$neighbors = Alerte::query()
    ->where('category', $alerte->category)
    ->where('created_at', '>=', now()->subMinutes(5))
    ->whereRaw('ST_DWithin(point, ?, 100)', [$alerte->point])
    ->where('id', '!=', $alerte->id)
    ->limit(20)
    ->get(['id', 'description'])
    ->map(fn ($a) => ['id' => (string) $a->id, 'text' => $a->description])
    ->all();

$response = Http::post(config('services.ml.url').'/v1/dedup', [
    'text'      => $alerte->description,
    'neighbors' => $neighbors,
    'threshold' => 0.78,
])->json();

if ($response['is_duplicate']) {
    $alerte->update([
        'is_potential_duplicate' => true,
        'duplicate_of_alerte_id' => $response['best_match']['id'],
    ]);
}
```

### Pattern flou de visages

```php
// 1. URL signée vers l'original (durée courte, pour le job seulement)
$signedUrl = Storage::disk('s3')->temporaryUrl($media->path, now()->addMinutes(2));

// 2. Appel ml/
$response = Http::timeout(30)->post(
    config('services.ml.url').'/v1/vision/blur-faces',
    ['media_url' => $signedUrl],
)->json();

// 3. Re-upload du dérivé
$blurred = base64_decode($response['blurred_base64']);
Storage::disk('s3')->put("blurred/{$media->id}.jpg", $blurred);

$media->update([
    'blurred_path' => "blurred/{$media->id}.jpg",
    'faces_found'  => $response['faces_found'],
]);
```

L'original reste en bucket `audit/` avec lifecycle 7 jours selon spec.
`MediaController::signedUrl` ne sert que `blurred_path` aux clients.

---

## Déploiement

### Local (sans Docker)

```bash
cd ml
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # remplir GROQ_API_KEY et DEEPGRAM_API_KEY
python -m ml.api.app
```

### Docker

Le Dockerfile est dans [`infra/docker/ml/Dockerfile`](../infra/docker/ml/Dockerfile)
(non tracké par git car `.gitignore` racine ignore `Dockerfile` ; utiliser
`git add -f` ou modifier `.gitignore` pour le commiter). Build :

```bash
docker build -f infra/docker/ml/Dockerfile -t bet/ml:dev .
docker run --rm -p 5000:5000 --env-file ml/.env bet/ml:dev
```

### Branchement sur `docker-compose.dev.yml`

Service à ajouter :

```yaml
ml:
  build:
    context: .
    dockerfile: infra/docker/ml/Dockerfile
  image: bet/ml:dev
  env_file:
    - path: .env
      required: false
  environment:
    PORT: 5000
    CORS_ORIGINS: http://localhost:3000
    WARM_EMBEDDINGS: "true"
  ports:
    - "${ML_PORT:-5000}:5000"
  networks: [bet]
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-fsS", "http://localhost:5000/v1/health"]
    interval: 15s
    timeout: 5s
    retries: 3
    start_period: 30s
```

### Workers

`gunicorn ml.api.app:app -k uvicorn.workers.UvicornWorker --workers 2`. Chaque
worker charge sa propre instance du modèle d'embeddings — compter ~500 Mo /
worker. Pour > 4 workers, envisager une architecture séparant les endpoints
CPU-lourds (embeddings, OpenCV) des endpoints purement I/O-bound (Groq,
Deepgram).

---

## Sécurité

- **Pas d'auth** : ml/ doit vivre sur un réseau privé. Ne jamais exposer
  publiquement sans ajouter une couche d'auth (token signé Laravel ou
  mTLS).
- **CORS** : `CORS_ORIGINS=*` en dev pour [`api_tester.html`](api_tester.html),
  à restreindre en prod.
- **Limite de taille** : 20 Mo par média, hard cap dans le service. Au-delà,
  `400 media too large`.
- **Logs** : pas de PII loggée — les bytes média ne sont jamais inscrits dans
  les logs, seulement leur taille. Vérifier avant ajout de logs verbeux.
- **Clés API** : lues depuis `.env` au démarrage. **Ne jamais committer
  `.env`**, c'est dans `.gitignore` racine.
- **Hors scope** : ml/ ne fait pas d'authn / authz, pas de rate-limiting, pas
  de quota. Tout cela vit côté Laravel.
