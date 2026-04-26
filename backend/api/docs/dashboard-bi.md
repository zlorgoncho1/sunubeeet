# Bët — Dashboard BI (Admin & Coordinateur)

Endpoints REST pour les dashboards admin et coordinateur. Ajout de la branche
`business-intelligence` au-dessus du `Coordinator/DashboardController` existant
et d'un `Admin/DashboardController` non encore branché.

## Doc OpenAPI / Swagger

- **Spec OpenAPI 3.0.3** : [`openapi-bi.yaml`](openapi-bi.yaml) — source unique
  pour les contrats. Le frontend peut générer ses types TypeScript en une
  commande :
  ```bash
  npx openapi-typescript backend/api/docs/openapi-bi.yaml -o frontend/src/lib/types/bi.d.ts
  ```
- **Swagger UI standalone** : ouvrir [`swagger-bi.html`](swagger-bi.html)
  directement dans le navigateur (file://). Charge le YAML local, supporte
  le « Try it out » avec un JWT collé dans **Authorize**. Aucune dépendance
  composer requise (CDN jsdelivr).

Tous les endpoints renvoient `{ "data": ... }` (et `meta` si pagination).
PostgreSQL only — utilise `DATE_TRUNC`, `EXTRACT(EPOCH FROM ...)`,
`PERCENTILE_CONT`. Toutes les requêtes lourdes sont mises en cache (TTL 60 s
pour le live, 300 s pour les analytics).

## Permissions

| Préfixe | Middleware |
|---|---|
| `/v1/dashboard/...` (sans `admin/`) | `role:coordinator,admin,super_admin` — scoping par zone si `coordinator` |
| `/v1/dashboard/admin/...` | `role:admin,super_admin` — vue globale |

## Coordinateur

Routes existantes étendues + 2 nouveaux endpoints.

### `GET /v1/dashboard/kpis`

KPIs temps réel scopés sur la zone du coordinateur (admin = global).

```json
{
  "data": {
    "open_incidents": 12,
    "critical_incidents": 2,
    "high_incidents": 5,
    "average_response_time_seconds": 142,
    "average_resolution_time_seconds": 1850,
    "average_validation_time_seconds": 38,
    "active_missions": 7,
    "agents_available": 22,
    "agents_on_site": 4,
    "agents_offline": 3,
    "potential_duplicates_pending": 1,
    "hot_zones_count": 1,
    "unprocessed_alertes": 8,
    "missions_unanswered_5min": 1,
    "missions_completed_today": 14
  }
}
```

Champs ajoutés : `average_validation_time_seconds`, `unprocessed_alertes`,
`missions_unanswered_5min`, `missions_completed_today`.

### `GET /v1/dashboard/timeline`

Chronologie des `tracking_events` du jour, scopée par zone.

Query params :
- `target_type` — `alerte` / `incident` / `mission` (optionnel)
- `action` — préfixe (ex: `mission.`) (optionnel)
- `from` — ISO 8601, défaut `today 00:00`
- `limit` — 1-500, défaut 100

### `GET /v1/dashboard/shift-report`

Synthèse du shift. Par défaut depuis 00:00 → maintenant.

Query params optionnels : `from`, `to` (ISO 8601).

```json
{
  "data": {
    "window": { "from": "2026-04-26T00:00:00+00:00", "to": "...", "duration_hours": 8.0 },
    "alertes": { "total": 142, "received": 8, "validated": 118, "duplicate": 12, "false_alert": 2, "rejected": 2 },
    "alertes_by_category": { "health": 45, "security": 30, "fire_danger": 5, "..." },
    "incidents": { "created": 88, "resolved": 70, "cancelled": 1, "still_open": 17 },
    "missions": { "created": 75, "completed": 64, "cancelled": 1, "refused": 3 },
    "median_validation_seconds": 42.5
  }
}
```

### Existants (rappel)

- `GET /v1/dashboard/incidents/live`
- `GET /v1/dashboard/agents/live`
- `GET /v1/dashboard/alertes/pending-duplicates`

## Administrateur

Préfixe : `/v1/dashboard/admin/`. Vue globale, sans scoping de zone.

### `GET /v1/dashboard/admin/kpis`

8 KPIs instantanés (déjà implémenté, branché aux routes par cette branche) :
`agents_active`, `alertes_today`, `incidents_open`, `missions_active`,
`qr_codes_active`, `sites_active`, `duplicates_detected`, `audit_logs_24h`.

### `GET /v1/dashboard/admin/analytics/alertes-volume`

Volume d'alertes par jour, segmenté par catégorie et source (QR vs App).

Query : `range` = nombre de jours (1-90, défaut 30).

```json
{
  "data": {
    "range_days": 30,
    "buckets": [
      {
        "day": "2026-03-28",
        "total": 45,
        "by_category": { "health": 12, "security": 8, "crowd": 25 },
        "by_source": { "qr": 30, "app": 15 }
      }
    ]
  }
}
```

### `GET /v1/dashboard/admin/analytics/incidents-trend`

Incidents créés vs résolus par semaine.

Query : `range` = nombre de semaines (1-12, défaut 8).

### `GET /v1/dashboard/admin/analytics/agents-performance`

Top agents par missions complétées sur la période.

Query : `range` (jours, 1-90, défaut 30), `limit` (1-50, défaut 10).

```json
{
  "data": {
    "range_days": 30,
    "agents": [
      {
        "agent_id": "uuid",
        "fullname": "Aïssa Diop",
        "missions_assigned": 50,
        "missions_completed": 42,
        "missions_refused": 1,
        "completion_rate": 0.84,
        "avg_on_site_minutes": 35.2
      }
    ]
  }
}
```

### `GET /v1/dashboard/admin/analytics/heatmap`

Densité d'alertes par cluster GPS (lat/lng arrondis selon `precision`).

Query :
- `range` = jours (1-90, défaut 7)
- `precision` = nombre de décimales (1-4, défaut 3 → ~110 m)

Cap dur 5 000 points retournés (les plus denses).

### `GET /v1/dashboard/admin/analytics/sources`

Répartition QR vs App.

```json
{
  "data": {
    "range_days": 30,
    "qr": 1240, "app": 760, "total": 2000,
    "qr_share": 0.62, "app_share": 0.38
  }
}
```

### `GET /v1/dashboard/admin/analytics/processing-time`

Médiane et p95 du délai `created_at → validated_at` par catégorie.
Cible métier : médiane < 300 s.

```json
{
  "data": {
    "range_days": 30,
    "target_median_seconds": 300,
    "by_category": [
      { "category": "health", "count": 412, "median_seconds": 88.0, "p95_seconds": 354.5 }
    ]
  }
}
```

### `GET /v1/dashboard/admin/analytics/duplicates`

Taux de doublons par jour. KPI cible < 10 %, alerte si > 20 %.

### `GET /v1/dashboard/admin/phone-tracking/stats`

Statistiques agrégées sur les suivis téléphonique (flow F1 QR). Aucun
numéro en clair, uniquement des compteurs.

```json
{
  "data": {
    "total_inserts": 1240,
    "verified": 980,
    "active": 720,
    "expiring_in_7_days": 65,
    "expired": 195,
    "verification_rate": 0.79,
    "alertes_with_tracking": 412
  }
}
```

## Cache & invalidation

Toutes les analytics sont en cache (Redis en prod). TTL :
- 60 s pour `phone-tracking/stats`
- 300 s pour `analytics/*`
- 30 s pour `admin/kpis`

Pas d'invalidation explicite en V1 — le TTL court suffit pour un dashboard.
Si besoin, ajouter un `Cache::forget('dashboard:admin:*')` dans les
listeners d'événements (`AlerteReceived`, `IncidentUpdated`).

## Hors scope V1

- WebSocket push pour push live des dashboards (les events `AlerteReceived`,
  `IncidentUpdated`, `MissionAssigned` existent déjà, à brancher côté
  frontend pour invalider le cache).
- Export CSV/PDF.
- Heatmap PostGIS native (V1 utilise `ROUND(latitude, n)` simple).
