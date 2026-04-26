# 🔬 Workflow IA Complète - Image Floue + Audio Transcrit

Documentation technique du traitement IA combinant image floue, transcription audio et analyse de gravité.

---

## 📊 Vue d'ensemble

```
SPECTATEUR                    API BÊT                      IA EN BACKGROUND
    │                              │                              │
    ├─ Descriptions          →  (< 100ms)              1️⃣ Transcribe audio
    ├─ 🎤 Audio (WebM)       →  CREATE alerte           2️⃣ Analyse image
    ├─ 📷 Photo (floue)      →  CHECK redondance       3️⃣ Combine contextes
    └─ 📍 Localisation       →  RETURN alerte_id        4️⃣ Groq analyse finale
                                 │
                                 ✅ Response immédiate
                                 │
                                 🤖 IA background (3-5s)
                                    │
                                    ├─ ia_gravite
                                    ├─ ia_transcription
                                    ├─ ia_photo_analysis
                                    └─ ia_confidence
```

---

## 🔄 Flux détaillé

### 1️⃣ FRONTEND (Spectateur)

```javascript
// Formulaire collecte:
{
  categorie: "medical",           // Required
  description: "Patient...",      // Optional si audio
  audio_base64: "webm_audio_b64", // Optional
  photo_base64: "img_blur_b64",   // Optional (blur 10px)
  latitude: 14.7167,              // Optional
  longitude: -17.4674,            // Optional
  spectateur_id: "SPEC_123"       // Required
}

// Image processing AVANT envoi:
const canvas = document.createElement('canvas');
canvas.width = img.width;
canvas.height = img.height;
const ctx = canvas.getContext('2d');
ctx.filter = 'blur(10px)';  // 👈 FLOUTAGE
ctx.drawImage(img, 0, 0);
const photo_base64 = canvas.toDataURL('image/jpeg');
```

### 2️⃣ API RECEPTION (< 100ms)

```python
@router.post("/alerte/")
async def creer_alerte(req: CreerAlerteRequest):
    # 1. Créer l'alerte
    alerte = {
        "id": uuid4(),
        "reference": "AL-2026-000001",
        "status": "CREATED",
        "audio_base64": req.audio_base64,  # Stocké
        "photo_base64": req.photo_base64,  # Stocké (floue)
        "description": req.description
    }
    
    # 2. Vérifier redondance EN PRIORITÉ
    if detecter_redondance(alerte):
        return AlerteResponse(status="DUPLICATE", ...)
    
    # 3. Lancer IA en background
    alerte["status"] = "PROCESSING"
    creer_task_ia_async(alerte)
    
    # 4. Répondre immédiatement
    return AlerteResponse(
        reference="AL-2026-000001",
        status="processing",
        message="Alerte créée et en cours d'analyse"
    )
```

### 3️⃣ IA EN BACKGROUND (3-5s)

#### 3.1 - Transcription Audio (1-2s)

```python
# utils/transcription.py
def transcrire_audio(audio_base64):
    """
    Deepgram API: audio → français
    """
    audio_data = base64.b64decode(audio_base64)
    
    response = requests.post(
        "https://api.deepgram.com/v1/listen",
        params={
            "model": "nova-2",
            "language": "fr",  # 🇫🇷 Français
            "smart_format": "true"
        },
        data=audio_data
    )
    
    # Résultat: "Patient inconscient au stade..."
    return response.json()['results']['channels'][0]['alternatives'][0]['transcript']
```

**Résultat:**
```
"Patient inconscient au stade, il respire très difficilement"
```

---

#### 3.2 - Analyse Image Floue (1-2s)

```python
# utils/vision.py
def analyser_image(photo_base64, categorie):
    """
    Groq: analyse textuelle basée sur catégorie
    (car image est floue + Groq n'a pas vision API)
    """
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "user",
            "content": f"""
Image floue d'incident de type '{categorie}'.
Basé sur ce type, évalue:
- Objets typiques
- Gravité estimée
- Éléments de danger
"""
        }]
    )
    
    # Résultat:
    return {
        "objets_detectes": "Personne au sol, spectateurs",
        "gravite_image": "critique",
        "elements_danger": "Perte de conscience",
        "confiance": 0.8
    }
```

**Résultat:**
```json
{
  "objets_detectes": "Personne au sol, spectateurs autour",
  "gravite_image": "critique",
  "elements_danger": ["Perte de conscience", "Respiration difficile"],
  "confiance": 0.8
}
```

---

#### 3.3 - Combine les Contextes

```python
# services/ia_background_processor.py
def traiter_alerte_ia(alerte):
    """
    Collecte TOUS les contextes
    """
    
    # Source 1: Description
    description = alerte['description']
    # = "Patient inconscient au stade..."
    
    # Source 2: Transcription audio
    transcription_fr = transcrire_audio(alerte['audio_base64'])
    # = "Patient inconscient au stade, il respire très difficilement"
    
    # Source 3: Analyse image
    photo_analysis = analyser_image(
        alerte['photo_base64'],
        alerte['categorie']
    )
    # = {objets, gravite_image, dangers, confiance}
    
    # Source 4: Catégorie
    categorie = alerte['categorie']
    # = "medical"
    
    # Construire contexte complet
    contexte = {
        "categorie": categorie,
        "description": description,
        "transcription_audio": transcription_fr,
        "analyse_image": photo_analysis
    }
    
    return contexte
```

---

#### 3.4 - Analyse Groq Finale (1-2s)

```python
# utils/deepseek.py
def analyser_avec_groq(contexte):
    """
    Groq LLaMA 3.3 70B analyse le contexte COMPLET
    """
    
    prompt = f"""
ANALYSE COMBINÉE - CONTEXTES MULTIPLES

Catégorie: medical

📝 Description (spectateur):
{contexte['description']}

🎙️ Transcription audio:
{contexte['transcription_audio']}

📷 Analyse image:
- Objets: {contexte['analyse_image']['objets_detectes']}
- Gravité image: {contexte['analyse_image']['gravite_image']}
- Dangers: {contexte['analyse_image']['elements_danger']}

ANALYSE:
1. Combine TOUS les contextes
2. Évalue gravité unifiée
3. Évalue cohérence
4. Donne action
5. Retourne JSON
"""
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=350
    )
    
    # Résultat JSON:
    return json.loads(response.choices[0].message.content)
```

**Résultat:**
```json
{
  "gravite": "critique",
  "resume": "Patient inconscient avec respiration difficile - URGENCE MÉDICALE",
  "action_recommandee": "APPELER AMBULANCE + ÉQUIPE MÉDICALE IMMÉDIATEMENT",
  "justification": "Perte de conscience + respiration difficile = état critique",
  "coherence_categorie": 0.98,
  "confiance": 0.95
}
```

---

### 4️⃣ MISE À JOUR BD

```python
alerte_updated = {
    **alerte,
    "status": "VALIDATED",
    "ia_gravite": "critique",
    "ia_transcription": "Patient inconscient au stade...",
    "ia_photo_analysis": {...},
    "ia_confidence": 0.95,
    "ia_metadata": {
        "resume": "...",
        "action": "...",
        "justification": "..."
    }
}
```

---

## 🔐 Points clés

### Image Floue (Confidentialité)

```javascript
// Frontend applique blur 10px
ctx.filter = 'blur(10px)';  // 👈 Rend l'image illisible
ctx.drawImage(img, 0, 0);
```

**Avantages:**
- ✅ Confidentialité préservée
- ✅ Pas de détails sensibles
- ✅ IA comprend quand même la catégorie
- ✅ Léger (peu de données)

**Limitations:**
- Groq ne peut pas analyser visuellement (n'a pas vision API)
- Solution: analyse basée sur catégorie + contexte

---

### Audio en Français

```python
params = {
    "model": "nova-2",
    "language": "fr",  # 🇫🇷 Français
    "smart_format": "true"
}
```

**Support:**
- ✅ Français (🇫🇷 localisé JOJ Dakar)
- ✅ Support multi-langue possible (language=en, etc)
- ✅ Détecte automatiquement si language=auto

---

### Combinaison Contextes

L'IA Groq traite **TOUS les contextes ensemble:**

1. **Redondance**: Description + transcription + image doivent être cohérents
2. **Priorisation**: Si audio/image contredisent description → faire confiance à audio/image
3. **Gravité unifiée**: Combine tous les signaux (description + visual + voice)
4. **Confiance**: Augmente si tous les contextes concordent

---

## 📈 Métriques

| Métrique | Valeur |
|----------|--------|
| API response | < 100ms |
| Redondance detection | < 50ms |
| Audio transcription | 1-2s |
| Image analysis | 1-2s |
| Groq analysis | 1-2s |
| **Total IA** | **3-5s** |
| **Guaranteed responsiveness** | **< 100ms** |

---

## 🔄 Variantes possibles

### Variante 1: Audio uniquement (pas photo)

```python
contexte = {
    "categorie": "medical",
    "description": "[Pas d'écrit]",
    "transcription_audio": "Patient inconscient...",
    "analyse_image": "[Pas d'image]"
}
```

✅ IA utilise description + audio = gravité complète

---

### Variante 2: Photo uniquement (pas audio)

```python
contexte = {
    "categorie": "medical",
    "description": "Patient inconscient",
    "transcription_audio": "[Pas d'audio]",
    "analyse_image": {objets, gravite, dangers}
}
```

✅ IA utilise description + image = gravité complète

---

### Variante 3: Description seule

```python
contexte = {
    "categorie": "medical",
    "description": "Patient inconscient",
    "transcription_audio": "[Pas d'audio]",
    "analyse_image": "[Pas d'image]"
}
```

✅ IA utilise description seule (fallback)

---

## 🚀 Déploiement

### Production avec Celery

```python
from celery import shared_task

@shared_task
def process_alerte_ia(alerte_id: str):
    """Lancé asynchrone via Celery"""
    alerte = get_alerte(alerte_id)
    resultats_ia = traiter_alerte_ia(alerte)
    update_alerte(alerte_id, resultats_ia)
```

**Configuration:**
```bash
# Lancer Celery worker
celery -A ml.tasks worker --loglevel=info

# Lancer Celery beat (scheduleur)
celery -A ml.tasks beat --loglevel=info
```

---

### Scaling

Pour augmenter la capacité:

1. **Ajouter workers Celery** (horizontalement scalable)
2. **Utiliser Redis** pour la queue (au lieu de Rabbit)
3. **Cacher les résultats Groq** (réduire latence)
4. **Paralléliser** (transcription + image en parallèle)

---

## 🧪 Test local

```bash
cd ml

# Lancer l'API
python -m ml.api.app

# Dans un autre terminal: tester le flux complet
python test_e2e_with_ia.py
```

---

## 📚 Fichiers clés

| Fichier | Rôle |
|---------|------|
| `api/routes/alertes.py` | Endpoint /alerte/ |
| `services/alerte_service.py` | Logique création + redondance |
| `services/ia_background_processor.py` | Traitement IA asynchrone |
| `utils/transcription.py` | Deepgram audio→FR |
| `utils/vision.py` | Analyse image |
| `utils/deepseek.py` | Groq analyse finale |
| `interface_simple.html` | Frontend (blur + record) |

---

## ✅ Checklist

Avant déploiement:
- [ ] Tous les tests passent
- [ ] Groq API key configurée
- [ ] Deepgram API key configurée (optionnel)
- [ ] Redis démarré (pour queue)
- [ ] Celery worker démarré (optionnel, pour async)
- [ ] Logs bien configurés
- [ ] Monitoring activé

---

**Dernière mise à jour**: 26 Avril 2026
