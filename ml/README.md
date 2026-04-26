# Bët ML — microservice de calcul

Microservice **stateless** consommé par le backend Laravel via jobs asynchrones.
Aucune donnée n'est stockée ici : Laravel reste source de vérité.

**Modèles 100 % gratuits** : Groq Cloud (free tier), Deepgram (200 $ offerts),
`sentence-transformers` local, OpenCV local.

## Endpoints

Tout est sous `/v1`. Réponses en JSON.

| Méthode | Route | Service utilisé | Usage côté Laravel |
|---|---|---|---|
| `GET`  | `/v1/health` | — | health check |
| `POST` | `/v1/classify` | Groq Llama 3.3 70B | Confirmer la catégorie déclarée + estimer la gravité |
| `POST` | `/v1/embed` | sentence-transformers MiniLM multilingue | Calculer un vecteur 384 dim à stocker en `pgvector` |
| `POST` | `/v1/dedup` | sentence-transformers + cosine | Compléter `AntiSpamService` (dédup sémantique sur voisins spatio-temporels) |
| `POST` | `/v1/transcribe` | Deepgram nova-2 FR | Transcrire un audio uploadé sur MinIO |
| `POST` | `/v1/vision/blur-faces` | OpenCV Haar cascade | Flouter les visages avant exposition (spec privacy) |
| `POST` | `/v1/vision/analyze` | Groq Llama-4 Scout (vision) | Tags / fumée / densité de foule / niveau de danger |

Les schémas exacts sont dans [schemas.py](schemas.py) (source unique de vérité).
Doc auto-générée disponible sur `http://localhost:5000/docs` une fois lancé.

## Démarrage

```bash
cd ml
python -m venv .venv
source .venv/bin/activate          # Windows : .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Renseigner GROQ_API_KEY et DEEPGRAM_API_KEY (free tiers)

python -m ml.api.app
```

Au premier appel à `/v1/embed` ou `/v1/dedup`, `sentence-transformers`
télécharge le modèle (~120 Mo) en cache. Pour préchauffer au boot :
`WARM_EMBEDDINGS=true` dans `.env`.

## Intégration côté Laravel

Le pattern recommandé : un job par appel ML, déclenché après l'événement
métier qui crée l'alerte ou le média. Exemple pour la dédup sémantique
augmentant `AntiSpamService.php` :

```php
$neighbors = Alerte::query()
    ->where('category', $alerte->category)
    ->where('created_at', '>=', now()->subMinutes(5))
    ->whereRaw('ST_DWithin(point, ?, 100)', [$alerte->point])
    ->get(['id', 'description'])
    ->map(fn ($a) => ['id' => $a->id, 'text' => $a->description]);

$response = Http::timeout(5)->post(config('services.ml.url').'/v1/dedup', [
    'text'      => $alerte->description,
    'neighbors' => $neighbors,
    'threshold' => 0.78,
])->json();

if ($response['is_duplicate']) {
    $alerte->update([
        'is_potential_duplicate'   => true,
        'duplicate_of_alerte_id'   => $response['best_match']['id'],
    ]);
}
```

Le flou de visages se branche sur le job `BlurFacesJob` qui télécharge
l'original depuis MinIO via URL signée, l'envoie à `/v1/vision/blur-faces`,
et ré-uploade le `blurred_base64` comme dérivé. L'original reste 7 jours
en bucket `audit/` selon le spec.

## Structure

```
ml/
├── api/
│   ├── app.py                 ← FastAPI bootstrap
│   └── routes/
│       ├── health.py
│       ├── classify.py
│       ├── dedup.py           ← /v1/embed + /v1/dedup
│       ├── transcribe.py
│       └── vision.py          ← /v1/vision/blur-faces + /analyze
├── services/
│   ├── groq.py                ← chat_json + vision_json
│   ├── embeddings.py          ← sentence-transformers singleton
│   ├── face_blur.py           ← OpenCV Haar + pixelisation
│   ├── transcription.py       ← Deepgram (URL ou bytes)
│   └── storage.py             ← fetch image/audio (URL ou base64)
├── schemas.py                 ← contrats pydantic des endpoints
├── requirements.txt
├── .env.example
└── README.md
```

## Choix techniques (V1, livraison hackathon)

- **Détection visages = Haar cascade** plutôt qu'OpenCV DNN ou MediaPipe :
  livré avec `opencv-python`, zéro téléchargement réseau, déploiement fiable.
  À upgrader vers `res10_300x300_ssd` post-hackathon pour de meilleurs
  profils latéraux et faux négatifs.
- **Vision LLM = Groq Llama-4 Scout** plutôt qu'un modèle dédié fire/smoke :
  un seul appel donne tags + fumée + densité + danger, et reste gratuit.
  Si Groq sature, fallback sur un modèle local `keras-fire-smoke`.
- **Embeddings = MiniLM multilingue** plutôt que BGE/E5 large :
  CPU friendly, 120 Mo, latence < 50 ms par phrase. Suffisant pour
  comparer 5-10 voisins par alerte.
- **Floutage** : pixelisation 16×16 + Gaussian par-dessus, **uniquement**
  sur les bounding-boxes de visages — la scène reste lisible pour le
  coordinateur. Différent du blur global client-side qui détruit l'info.

## Hors scope

- Stockage. Tout vient de Laravel via URL signée.
- Auth. ml/ est sur le réseau interne Docker, pas exposé publiquement.
- Modèles fine-tunés sur des données JOJ. Tout est zero-shot ou pré-entraîné.
- Crowd counting numérique précis (CSRNet, MCNN). On utilise une catégorie
  ordinale `none|low|medium|high` retournée par le LLM vision.
- Détection d'événements acoustiques (PANNs). Skip V1.

## Démos historiques

`interface_simple.html`, `dashboard.html`, `test_interface.html` sont des
pages de démonstration legacy. Elles **ne sont pas** branchées sur les
nouveaux endpoints — gardées pour le pitch / vidéo. Le frontend canonique
de Bët est dans [../frontend/](../frontend/).
