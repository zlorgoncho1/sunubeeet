# 🎯 NOUVEAU FLUX D'ALERTES - BËT DAKAR 2026

## Architecture

```
SPECTATEUR
    ↓
[POST /alerte/]  ← Créer alerte
    ↓
┌─────────────────────────────────────┐
│ ÉTAPE 1: Validation & Stockage      │
│ - Créer alerte en BD (status=CREATED)
│ - Récupérer IP du client            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ ÉTAPE 2: DÉTECTION REDONDANCE       │
│ ⚡ EN PRIORITÉ (synchrone)          │
│ - Chercher alertes proches (<100m)  │
│ - Même catégorie                    │
│ - Même IP/fingerprint               │
│ - Créées < 5 min                    │
└─────────────────────────────────────┘
    ↓
    ├─→ ✅ PAS REDONDANTE
    │       Status: PROCESSING
    │       → Lancer IA en BACKGROUND
    │       ← Retour immédiat au client
    │
    └─→ 🚨 REDONDANTE DÉTECTÉE
            Status: DUPLICATE
            → Lier à l'alerte originale
            ← Retour immédiat (anti-spam)
```

## Endpoints

### 1. Créer une alerte
```http
POST /alerte/
Content-Type: application/json

{
  "categorie": "incendie",
  "description": "Feu au 3e étage",
  "audio_base64": null,
  "photo_base64": null,
  "latitude": 14.7167,
  "longitude": -17.4674,
  "spectateur_id": "SPEC_001",
  "client_fingerprint": "browser_123"
}

RÉPONSE (200 OK - <100ms):
{
  "alerte_id": "8f8e15e9-58fb-...",
  "reference": "AL-2026-000003",
  "status": "processing",  // ou "duplicate"
  "message": "Alerte créée et en cours d'analyse",
  "is_duplicate": false,
  "duplicate_of_reference": null,
  "created_at": "2026-04-25T10:30:00"
}
```

### 2. Récupérer une alerte
```http
GET /alerte/{alerte_id}

RÉPONSE:
{
  "id": "8f8e15e9-...",
  "reference": "AL-2026-000003",
  "status": "processing",
  "categorie": "incendie",
  "description": "Feu au 3e étage",
  "latitude": 14.7167,
  "longitude": -17.4674,
  "is_potential_duplicate": false,
  "ia_gravite": null,  // Rempli une fois IA terminée
  "ia_transcription": null,
  "ia_photo_analysis": null,
  "ia_confidence": null,
  "created_at": "2026-04-25T10:30:00",
  "updated_at": "2026-04-25T10:30:00"
}
```

### 3. Lister les alertes récentes
```http
GET /alerte/?limit=10

RÉPONSE:
{
  "total": 5,
  "alertes": [
    { ... },
    { ... }
  ]
}
```

## Statuts des Alertes

| Statut | Signification | IA Lancée? |
|--------|---------------|-----------|
| `CREATED` | Juste créée | Non |
| `PROCESSING` | En attente d'analyse IA | En cours |
| `DUPLICATE` | Redondance détectée | Non |
| `VALIDATED` | IA a complété l'analyse | ✅ |
| `INCIDENT_CREATED` | Incident créé à partir de l'alerte | ✅ |
| `REJECTED` | Rejetée par IA (spam/hoax) | ✅ |

## Détection de Redondance

Les redondances sont détectées si:
- ✅ **Même catégorie d'incident**
- ✅ **Localisation proche** (<100m, diff lat/lon <0.001°)
- ✅ **Même source client** (IP + timestamp ou fingerprint)
- ✅ **Temps court** (créées < 5 minutes)

Exemple:
```
Alerte 1: Feu @ 14.7167, -17.4674 (Incendie) → Status: PROCESSING
Alerte 2: Feu @ 14.7168, -17.4675 (Incendie) [même IP, 2 min plus tard]
         → Status: DUPLICATE (linked to AL-2026-000001)
```

## Flux Complet (Tableau de Timing)

```
T=0ms   : Alerte reçue par API
T=10ms  : Créer en BD + Valider
T=20ms  : DÉTECTION REDONDANCE (priorité)
T=50ms  : Réponse retournée au client ← IMMÉDIAT!
T=100ms : [Parallèle] IA commence analyse en background
T=5000ms: [Parallèle] IA complète (gravité, transcription, etc)
T=5100ms: Alerte mise à jour avec résultats IA (status=VALIDATED)
```

## Avantages du Design

1. **⚡ Réactivité**: Retour immédiat (<100ms) au spectateur
2. **🚨 Anti-spam**: Redondance détectée EN PRIORITÉ (avant IA)
3. **🎯 Performance**: IA en background (ne bloque pas l'utilisateur)
4. **📊 Scalabilité**: Prêt pour millions d'alertes
5. **🔍 Traçabilité**: Chaque alerte liée à incident + redondances

## Prochaines Étapes

1. **Intégrer IA background** (Celery/RabbitMQ)
   - Mettre à jour `ia_gravite`, `ia_transcription`, etc
   - Créer incident si gravité >= HAUTE

2. **Dashboard temps réel**
   - WebSocket pour notifications
   - Cartes de heatmaps (clustering alertes)

3. **Gestion incidents**
   - Regrouper alertes → 1 incident
   - Escalade automatique

4. **Mobile app spectateur**
   - Interface de report simplifié
   - QR code scanning (source_qr_id)

---

**Version**: 1.0.0 - 25/04/2026  
**Architecture**: Alerte-centric workflow avec redondance EN PRIORITÉ
