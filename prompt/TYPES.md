# Bët — Spécification des types et de l'API (v2.0)

## Document de référence technique — aligné Figma SUNUBETT

**Version** : 2.0
**Date** : Avril 2026
**Source** : Board Figma SUNUBETT + spécifications techniques
**Stack cible** : Laravel 11 · Next.js 14 · PostgreSQL 16 · Docker · MinIO / S3
**Authentification** : JWT (access + refresh) · QR token signé · Tracking token téléphone

---

## Changelog v1.0 → v2.0

| Changement | Section | Justification |
|---|---|---|
| Suppression du concept de "claim alerte" explicite | 26 | Pas dans le board Figma |
| Remplacement par "attach phone" pour suivi anonyme | 8, 25, 26 | Sticky Figma : suivi par numéro |
| Anti-spam : par localisation+temps (2 min) au lieu de rate-limit token | 19, 26 | Sticky Figma anti-spam |
| Simplification statuts alerte | 17 | Cohérence avec dispatch direct |
| `agent_presences` simplifié à toggle on/off | 14 | Étape Figma "on/off" |
| Renommage : "agent tiers" = `Site` (clarification) | Glossaire | Terminologie Figma |
| Vocal : `transcription_translated` ajouté | 13 | Sticky Figma traduction auto |
| `is_potential_duplicate` sur Alerte | 8 | Anti-spam non bloquant |
| Endpoints "claim" supprimés | 26 | Hors flows |
| Scénarios E2E refaits pour les 4 flows Figma | 37 | Demande explicite |
| Endpoints `/qr/tracking/*` ajoutés | 25 | Flow F1.6 |
| Endpoints `/spectator/map/*` et `/agent/map/*` ajoutés | 33 | Flows F2.2, F3.3 |

---

## Table des matières

1. [Introduction et périmètre](#1-introduction-et-périmètre)
2. [Conventions générales](#2-conventions-générales)
3. [Énumérations centrales](#3-énumérations-centrales)
4. [Modèle de données — vue d'ensemble](#4-modèle-de-données--vue-densemble)
5. [Entité `User`](#5-entité-user)
6. [Entité `QRCode`](#6-entité-qrcode)
7. [Entité `Site` (= Agent tiers)](#7-entité-site--agent-tiers)
8. [Entité `Alerte`](#8-entité-alerte)
9. [Entité `Incident`](#9-entité-incident)
10. [Entité `Mission`](#10-entité-mission)
11. [Entité `TrackingEvent`](#11-entité-trackingevent)
12. [Entité `MissionServiceInfo`](#12-entité-missionserviceinfo)
13. [Entité `MediaFile`](#13-entité-mediafile)
14. [Entité `AgentPresence`](#14-entité-agentpresence)
15. [Entité `PhoneTracking`](#15-entité-phonetracking)
16. [Entité `AuditLog`](#16-entité-auditlog)
17. [Machines à états](#17-machines-à-états)
18. [Authentification JWT](#18-authentification-jwt)
19. [Token QR + Anti-spam localisation](#19-token-qr--anti-spam-localisation)
20. [Stockage des médias (MinIO / S3)](#20-stockage-des-médias-minio--s3)
21. [Format des réponses et erreurs](#21-format-des-réponses-et-erreurs)
22. [Conventions de sécurité API](#22-conventions-de-sécurité-api)
23. [Matrice de permissions (RBAC)](#23-matrice-de-permissions-rbac)
24. [API — Authentification](#24-api--authentification)
25. [API — Flow QR (F1)](#25-api--flow-qr-f1)
26. [API — Alertes (Flow App)](#26-api--alertes-flow-app)
27. [API — Incidents](#27-api--incidents)
28. [API — Missions](#28-api--missions)
29. [API — Utilisateurs](#29-api--utilisateurs)
30. [API — QR codes (gestion admin)](#30-api--qr-codes-gestion-admin)
31. [API — Sites (Agents tiers)](#31-api--sites-agents-tiers)
32. [API — Fichiers (médias)](#32-api--fichiers-médias)
33. [API — Espace personnel et map](#33-api--espace-personnel-et-map)
34. [API — Dashboard coordinateur](#34-api--dashboard-coordinateur)
35. [API — Audit logs](#35-api--audit-logs)
36. [API — WebSocket et temps réel](#36-api--websocket-et-temps-réel)
37. [Annexe A — Scénarios E2E des 4 flows Figma](#37-annexe-a--scénarios-e2e-des-4-flows-figma)
38. [Annexe B — Schéma SQL résumé](#38-annexe-b--schéma-sql-résumé)

---

# 1. Introduction et périmètre

Ce document est la **référence unique** pour le modèle de données, les types et les contrats d'API du système Bët, **strictement aligné sur les 4 flows définis dans le board Figma SUNUBETT** :

1. **Flow 1 — QR Code Urgence** (Spectateur anonyme)
2. **Flow 2 — Application** (Spectateur authentifié)
3. **Flow 3 — Agent de terrain**
4. **Flow 4 — Coordinateur**

## 1.1 Décomposition métier (inchangée)

```text
Scan QR ou app authentifiée
        │
        ▼
   ┌─────────┐    qualification (auto ou manuelle)   ┌──────────┐
   │ Alerte  │ ─────────────────────────────────►    │ Incident │
   └─────────┘                                       └─────┬────┘
                                                           │
                                          dispatch         │
                                          coordinateur     ▼
                                                      ┌─────────┐
                                                      │ Mission │ (1 agent)
                                                      └─────────┘
```

## 1.2 Particularités issues du board Figma

| Source Figma | Implication technique |
|---|---|
| « On authentifie pas le user, mais le QR » | Token QR signé suffit — aucune création de compte requise |
| Anti-spam 2 min même localisation | Détection doublon par proximité, pas rate-limit token |
| Demande numéro pour suivi (flow QR) | Table `phone_trackings` séparée (numéro hashé attaché à des alertes) |
| Vocal avec traduction automatique | Champ `transcription_translated` dans `MediaFile` (phase 2) |
| Photo floutée | Job asynchrone backend (déjà décrit) |
| Toggle on/off agent | `AgentPresence.status` simplifié à `available` / `offline` |
| « Agents tiers » | Synonyme de `Site` — services externes (police, hôpital, pompiers) |
| Postes de secours (flow App) | `Site.type IN (samu, pompiers, hopital, point_secours)` |

---

# 2. Conventions générales

## 2.1 Nommage

Identique à v1.0. Snake_case sur tout l'API.

## 2.2 Identifiants

- PK base : `BIGSERIAL` ou `UUID` selon entité.
- Identifiants exposés via API : **UUID v4 ou v7** pour `Alerte`, `Incident`, `Mission`, `Site`, `User`, `QRCode`.
- BIGSERIAL pour `TrackingEvent`, `AuditLog`.

## 2.3 Coordonnées GPS

```json
{
  "latitude": 14.7234567,
  "longitude": -17.5431234
}
```

Type SQL : `DECIMAL(10, 7)`. Calculs distance : Haversine en Laravel (PostGIS en phase 2).

## 2.4 Dates et heures

UTC. Format ISO 8601 : `"2026-04-17T10:23:45.123Z"`.

## 2.5 Pagination

Format standard `data` + `meta` + `links` (cf v1.0).

## 2.6 Versioning API

Toutes les routes préfixées par `/api/v1`.

---

# 3. Énumérations centrales

## 3.1 `UserRole`

```typescript
type UserRole =
  | "spectator"      // optionnel : spectateur ayant créé un compte (flow App)
  | "agent"          // intervient terrain
  | "coordinator"    // PC opérationnel
  | "admin"          // gère utilisateurs, zones, QR
  | "super_admin";   // contrôle global, audit
```

> Note : un spectateur du **flow QR n'a pas de compte** — pas de ligne dans `users`. Seul le numéro de téléphone (hashé) est stocké dans `phone_trackings` pour le suivi.

## 3.2 `AlerteCategory`

```typescript
type AlerteCategory =
  | "health"
  | "security"
  | "crowd"
  | "access_blocked"
  | "fire_danger"
  | "lost_found"
  | "logistics"
  | "transport"
  | "other";
```

## 3.3 `SubCategory` (JSONB libre)

```json
{
  "type": "malaise",
  "details": {
    "person_count": 1,
    "is_conscious": true
  },
  "tags": ["urgent", "elderly"]
}
```

Index GIN : `CREATE INDEX idx_alertes_sub_category ON alertes USING GIN (sub_category);`

## 3.4 `Severity`

```typescript
type Severity = "low" | "medium" | "high" | "critical";
```

## 3.5 `Priority`

```typescript
type Priority = "p1" | "p2" | "p3" | "p4";
```

## 3.6 `AlerteStatus` (simplifié vs v1.0)

```typescript
type AlerteStatus =
  | "received"            // créée
  | "validated"           // validée et liée à un incident
  | "duplicate"           // doublon (anti-spam ou marquage manuel)
  | "false_alert"         // fausse alerte confirmée
  | "rejected";           // rejetée (malveillante, hors cadre)
```

> Suppression de `under_review` — peu visible dans les flows Figma. Une alerte est soit reçue, soit traitée (validée, doublon, fausse, rejetée).

## 3.7 `IncidentStatus`

```typescript
type IncidentStatus =
  | "open"
  | "qualified"
  | "mission_assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "cancelled";
```

## 3.8 `MissionStatus`

```typescript
type MissionStatus =
  | "created"
  | "assigned"
  | "accepted"
  | "refused"
  | "on_route"
  | "on_site"
  | "completed"
  | "cancelled";
```

## 3.9 `AgentPresenceStatus` (simplifié — toggle on/off Figma)

```typescript
type AgentPresenceStatus =
  | "available"           // toggle ON
  | "offline";            // toggle OFF
```

> v1.0 avait `assigned`, `on_route`, `on_site`, `on_break` séparément. v2.0 dérive ces statuts depuis la mission active de l'agent (cf vue SQL). Seul le toggle utilisateur est `available`/`offline`.

## 3.10 `SiteType`

```typescript
type SiteType =
  | "police"
  | "commissariat"
  | "gendarmerie"
  | "hopital"
  | "clinique"
  | "samu"
  | "pompiers"
  | "protection_civile"
  | "point_secours"        // poste de secours événementiel
  | "evenement_pc"         // PC opérationnel
  | "depannage"
  | "point_eau"
  | "point_repos"
  | "site_evenement"       // lieu d'épreuve / fan zone
  | "autre";
```

> Ajout de `point_secours` et `site_evenement` pour matcher l'étape Figma F2.3.

## 3.11 `TeamType`

```typescript
type TeamType =
  | "health"
  | "security"
  | "logistics"
  | "volunteer"
  | "fire_rescue"
  | "communication";
```

## 3.12 `TrackingAction` (mise à jour)

```typescript
type TrackingAction =
  // Alerte
  | "alerte.created"
  | "alerte.phone_attached"
  | "alerte.validated"
  | "alerte.marked_duplicate"
  | "alerte.marked_false_alert"
  | "alerte.rejected"

  // Incident
  | "incident.created"
  | "incident.qualified"
  | "incident.severity_changed"
  | "incident.priority_changed"
  | "incident.resolved"
  | "incident.closed"
  | "incident.cancelled"

  // Mission
  | "mission.created"
  | "mission.assigned"
  | "mission.accepted"
  | "mission.refused"
  | "mission.on_route"
  | "mission.on_site"
  | "mission.reinforcement_requested"
  | "mission.service_info_added"
  | "mission.service_info_removed"
  | "mission.completed"
  | "mission.cancelled"
  | "mission.reassigned"

  // Agent (toggle on/off uniquement)
  | "agent.toggle_on"
  | "agent.toggle_off"
  | "agent.location_updated";
```

> Suppression de `alerte.claimed` (hors flow Figma). Ajout de `alerte.phone_attached` pour le flow F1.5.

## 3.13 `MediaKind`

```typescript
type MediaKind =
  | "photo"
  | "audio"
  | "document";
```

## 3.14 `MediaProcessingStatus`

```typescript
type MediaProcessingStatus =
  | "pending"
  | "processing"
  | "ready"
  | "failed";
```

## 3.15 `AudioTranscriptionStatus` (nouveau)

```typescript
type AudioTranscriptionStatus =
  | "not_requested"
  | "pending"
  | "processing"
  | "completed"
  | "failed";
```

> Pour la traduction automatique vocale (sticky Figma). Phase 2.

---

# 4. Modèle de données — vue d'ensemble

```text
┌─────────┐         ┌──────────┐         ┌──────────┐
│  users  │────────<│  teams   │────────>│  zones   │
└────┬────┘         └──────────┘         └──────────┘
     │
     │
┌────▼────────┐                          ┌──────────┐
│  alertes    │ * ───────────── 1 ──────►│ incidents│
└─────┬───────┘                          └─────┬────┘
      │ *                                      │ 1
      │                                        │
      ▼                                        ▼
┌──────────┐                              ┌──────────┐
│ qr_codes │                              │ missions │ (1 agent)
└──────────┘                              └─────┬────┘
                                                │ *
                                                ▼
                                          ┌─────────────────────────┐
                                          │ mission_service_infos   │
                                          └─────┬───────────────────┘
                                                │ *
                                                ▼
                                          ┌──────────┐
                                          │  sites   │ (= agents tiers)
                                          └──────────┘

┌──────────────────┐    ┌──────────────────┐
│ phone_trackings  │────│  alertes (M:N)   │  (suivi par numéro flow QR)
└──────────────────┘    └──────────────────┘

┌──────────────────┐
│ tracking_events  │  → références : alerte | incident | mission
└──────────────────┘

┌──────────────────┐
│  media_files     │  → photos floutées, audio + transcription
└──────────────────┘

┌──────────────────┐
│ agent_presences  │  → toggle on/off + position
└──────────────────┘

┌──────────────────┐
│   audit_logs     │
└──────────────────┘
```

---

# 5. Entité `User`

## 5.1 Description

Représente un utilisateur authentifié : agent, coordinator, admin, super_admin, ou spectator (flow App seulement).

> Les spectateurs du flow QR (F1) **ne créent pas de compte** — leurs alertes sont attachées via `phone_trackings`.

## 5.2 Type TypeScript

```typescript
interface User {
  id: string;                    // UUID
  fullname: string;
  phone: string;                 // E.164
  phone_verified_at: string | null;
  password_hash: string;         // jamais retourné par l'API
  role: UserRole;
  team_id: string | null;
  zone_id: string | null;
  is_active: boolean;
  created_by: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

## 5.3 Schéma SQL

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fullname        VARCHAR(255) NOT NULL,
  phone           VARCHAR(20)  NOT NULL UNIQUE,
  phone_verified_at TIMESTAMPTZ,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20)  NOT NULL CHECK (role IN
                  ('spectator','agent','coordinator','admin','super_admin')),
  team_id         UUID REFERENCES teams(id) ON DELETE SET NULL,
  zone_id         UUID REFERENCES zones(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_zone ON users(zone_id);
```

## 5.4 Exemple JSON

```json
{
  "id": "0193d9f1-3b2a-7c4f-9b6a-1234567890ab",
  "fullname": "Aminata Diop",
  "phone": "+221771234567",
  "phone_verified_at": "2026-04-15T08:00:00Z",
  "role": "coordinator",
  "team_id": "0193d9f1-4b2a-7c4f-9b6a-1234567890cd",
  "zone_id": "0193d9f1-5b2a-7c4f-9b6a-1234567890ef",
  "is_active": true,
  "created_by": null,
  "last_login_at": "2026-04-17T10:00:00Z",
  "created_at": "2026-03-01T09:00:00Z",
  "updated_at": "2026-04-17T10:00:00Z"
}
```

## 5.5 Règles métier

- `password_hash` jamais exposé.
- Un coordinator peut créer des `agent` (cf F4.3.a).
- Un admin peut créer `agent` et `coordinator`.
- Un super_admin peut tout créer.
- Un `spectator` se crée lui-même via `POST /auth/spectator/register` (flow F2.1.a).

---

# 6. Entité `QRCode`

## 6.1 Description

QR physique collé sur murs/poteaux. Token signé contenant la localisation. Pas de compte utilisateur dans le scan.

## 6.2 Type TypeScript

```typescript
interface QRCode {
  id: string;                          // UUID
  token: string;                       // JWT HS256 (clé QR_TOKEN_SECRET)
  location_label: string;
  latitude: number;
  longitude: number;
  zone_id: string | null;
  site_id: string | null;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  scan_count: number;
  last_scanned_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

## 6.3 Schéma SQL

```sql
CREATE TABLE qr_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token            TEXT NOT NULL UNIQUE,
  location_label   VARCHAR(255) NOT NULL,
  latitude         DECIMAL(10,7) NOT NULL,
  longitude        DECIMAL(10,7) NOT NULL,
  zone_id          UUID REFERENCES zones(id) ON DELETE SET NULL,
  site_id          UUID REFERENCES sites(id) ON DELETE SET NULL,
  description      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at       TIMESTAMPTZ,
  scan_count       INTEGER NOT NULL DEFAULT 0,
  last_scanned_at  TIMESTAMPTZ,
  created_by       UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qr_codes_active ON qr_codes(is_active);
CREATE INDEX idx_qr_codes_zone   ON qr_codes(zone_id);
```

## 6.4 Token QR (rappel)

JWT signé avec `QR_TOKEN_SECRET`. Payload :

```json
{
  "iss": "bet-api",
  "kind": "qr",
  "qr_id": "0193d9f1-aaaa-...",
  "loc": {
    "lat": 14.7234567,
    "lng": -17.5431234,
    "label": "Entrée Nord — Dakar Arena"
  },
  "iat": 1745400000,
  "exp": null,
  "v": 1
}
```

URL encodée dans le QR : `https://bet.sn/q/<token>`.

---

# 7. Entité `Site` (= Agent tiers)

## 7.1 Description

> Dans le board Figma : **« agent tiers »**. Dans la base de code : **`Site`**.

Représente un service externe ou un lieu de référence : police, hôpital, pompiers, point de secours, PC événement, lieu d'épreuve. Utilisé pour :

- afficher aux **spectateurs** les postes de secours et lieux événements (F2.3, F2.4) ;
- afficher aux **agents** les services proches durant l'intervention (F3.5) ;
- permettre au **coordinateur** d'attacher des sites à une mission (F4.4).

## 7.2 Type TypeScript

```typescript
interface Site {
  id: string;
  name: string;
  type: SiteType;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  description: string | null;
  is_24_7: boolean;
  opening_hours: object | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

## 7.3 Schéma SQL

```sql
CREATE TABLE sites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  type            VARCHAR(30)  NOT NULL CHECK (type IN
                  ('police','commissariat','gendarmerie','hopital','clinique',
                   'samu','pompiers','protection_civile','point_secours',
                   'evenement_pc','depannage','point_eau','point_repos',
                   'site_evenement','autre')),
  latitude        DECIMAL(10,7) NOT NULL,
  longitude       DECIMAL(10,7) NOT NULL,
  address         TEXT,
  phone           VARCHAR(20),
  description     TEXT,
  is_24_7         BOOLEAN NOT NULL DEFAULT FALSE,
  opening_hours   JSONB,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sites_type ON sites(type) WHERE is_active;
CREATE INDEX idx_sites_geo  ON sites(latitude, longitude);
```

## 7.4 Exemple JSON

```json
{
  "id": "0193d9f1-bbbb-7c4f-9b6a-1234567890ab",
  "name": "Hôpital Principal de Dakar",
  "type": "hopital",
  "latitude": 14.6711,
  "longitude": -17.4400,
  "address": "Avenue Nelson Mandela, Dakar",
  "phone": "+221338891010",
  "description": "Service d'urgence 24/7. Hélistation disponible.",
  "is_24_7": true,
  "opening_hours": null,
  "is_active": true,
  "created_at": "2026-03-01T09:00:00Z",
  "updated_at": "2026-03-01T09:00:00Z"
}
```

---

# 8. Entité `Alerte`

## 8.1 Description

Signal brut soumis par un spectateur. Origine :

- via **QR** (flow F1) → `source_qr_id` rempli, pas d'utilisateur ;
- via **App** (flow F2) → `source_user_id` rempli, optionnellement `source_qr_id` aussi.

## 8.2 Type TypeScript

```typescript
interface Alerte {
  id: string;
  reference: string;                   // "AL-2026-0001234"

  // Origine
  source_qr_id: string | null;
  source_user_id: string | null;

  // Métier
  category: AlerteCategory;
  sub_category: object | null;

  description: string | null;
  photo_media_id: string | null;
  audio_media_id: string | null;

  latitude: number;
  longitude: number;
  zone_id: string | null;

  status: AlerteStatus;
  incident_id: string | null;

  // Anti-spam
  is_potential_duplicate: boolean;
  duplicate_of_alerte_id: string | null;
  client_ip: string | null;
  client_fingerprint: string | null;

  resolution_reason: string | null;

  created_at: string;
  updated_at: string;
  validated_at: string | null;
}
```

## 8.3 Schéma SQL

```sql
CREATE TABLE alertes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference                VARCHAR(20) NOT NULL UNIQUE,

  source_qr_id             UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
  source_user_id           UUID REFERENCES users(id)    ON DELETE SET NULL,

  category                 VARCHAR(20) NOT NULL CHECK (category IN
                           ('health','security','crowd','access_blocked',
                            'fire_danger','lost_found','logistics',
                            'transport','other')),
  sub_category             JSONB,

  description              TEXT,
  photo_media_id           UUID REFERENCES media_files(id) ON DELETE SET NULL,
  audio_media_id           UUID REFERENCES media_files(id) ON DELETE SET NULL,

  latitude                 DECIMAL(10,7) NOT NULL,
  longitude                DECIMAL(10,7) NOT NULL,
  zone_id                  UUID REFERENCES zones(id) ON DELETE SET NULL,

  status                   VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN
                           ('received','validated','duplicate','false_alert','rejected')),

  incident_id              UUID REFERENCES incidents(id) ON DELETE SET NULL,

  is_potential_duplicate   BOOLEAN NOT NULL DEFAULT FALSE,
  duplicate_of_alerte_id   UUID REFERENCES alertes(id) ON DELETE SET NULL,
  client_ip                INET,
  client_fingerprint       VARCHAR(128),

  resolution_reason        TEXT,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_at             TIMESTAMPTZ,

  CHECK (
    source_qr_id IS NOT NULL OR source_user_id IS NOT NULL
  )
);

CREATE INDEX idx_alertes_status        ON alertes(status);
CREATE INDEX idx_alertes_category      ON alertes(category);
CREATE INDEX idx_alertes_incident      ON alertes(incident_id);
CREATE INDEX idx_alertes_qr            ON alertes(source_qr_id);
CREATE INDEX idx_alertes_geo           ON alertes(latitude, longitude);
CREATE INDEX idx_alertes_created       ON alertes(created_at DESC);
CREATE INDEX idx_alertes_sub_category  ON alertes USING GIN (sub_category);

-- Index spécial pour anti-spam
CREATE INDEX idx_alertes_antispam
  ON alertes(category, latitude, longitude, created_at)
  WHERE status NOT IN ('false_alert','rejected');
```

## 8.4 Exemple JSON

```json
{
  "id": "0193da00-1111-7c4f-9b6a-1234567890ab",
  "reference": "AL-2026-0001234",

  "source_qr_id": "0193d9f1-aaaa-7c4f-9b6a-1234567890ab",
  "source_user_id": null,

  "category": "health",
  "sub_category": {
    "type": "malaise",
    "details": { "person_count": 1, "is_conscious": true }
  },

  "description": "Personne âgée semble avoir un malaise près du pilier ouest",
  "photo_media_id": "0193da00-2222-...",
  "audio_media_id": null,

  "latitude": 14.7234567,
  "longitude": -17.5431234,
  "zone_id": "0193d9f1-5b2a-...",

  "status": "validated",
  "incident_id": "0193da00-3333-...",

  "is_potential_duplicate": false,
  "duplicate_of_alerte_id": null,

  "resolution_reason": null,

  "created_at": "2026-04-17T10:23:45.123Z",
  "updated_at": "2026-04-17T10:24:10.000Z",
  "validated_at": "2026-04-17T10:24:10.000Z"
}
```

## 8.5 Règles métier (anti-spam intégré)

À chaque `INSERT` dans `alertes`, le backend :

```sql
-- Vérification doublon par proximité spatio-temporelle
SELECT id FROM alertes
WHERE category = $new_category
  AND status NOT IN ('false_alert','rejected','duplicate')
  AND created_at > NOW() - INTERVAL '2 minutes'
  AND (
    -- Distance Haversine < 100 m
    111.111 * DEGREES(ACOS(
      LEAST(1.0,
        COS(RADIANS($new_lat)) * COS(RADIANS(latitude))
      * COS(RADIANS(longitude - $new_lng))
      + SIN(RADIANS($new_lat)) * SIN(RADIANS(latitude))
      )
    )) * 1000 < 100
  )
ORDER BY created_at DESC
LIMIT 1;
```

Si une alerte parente est trouvée :

- la nouvelle alerte est créée avec `is_potential_duplicate = true` ;
- `duplicate_of_alerte_id` pointe vers l'alerte parente ;
- l'alerte n'est **pas bloquée** (toujours créée) — c'est le coordinateur qui valide ou non.

---

# 9. Entité `Incident`

(Inchangée par rapport à v1.0 — voir document v1.0 section 9 pour le détail.)

```typescript
interface Incident {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  category: AlerteCategory;
  sub_category: object | null;
  severity: Severity;
  priority: Priority;
  latitude: number;
  longitude: number;
  zone_id: string | null;
  status: IncidentStatus;
  is_hot_zone: boolean;
  alertes_count: number;
  created_by_user_id: string | null;
  qualified_by_user_id: string | null;
  resolved_by_user_id: string | null;
  closed_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  qualified_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
}
```

(Schéma SQL identique à v1.0.)

---

# 10. Entité `Mission`

(Inchangée — un seul agent par mission.)

```typescript
interface Mission {
  id: string;
  reference: string;
  incident_id: string;
  created_by_user_id: string;
  assigned_to_user_id: string;
  title: string;
  briefing: string | null;
  estimated_duration_minutes: number | null;
  status: MissionStatus;
  latitude: number;
  longitude: number;
  refusal_reason: string | null;
  cancellation_reason: string | null;
  completion_note: string | null;
  outcome: "resolved" | "transferred" | "false_alert" | "escalated" | null;
  created_at: string;
  assigned_at: string | null;
  accepted_at: string | null;
  refused_at: string | null;
  on_route_at: string | null;
  on_site_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
}
```

(Schéma SQL identique à v1.0, avec ajout du champ `outcome`.)

---

# 11. Entité `TrackingEvent`

Inchangée. Source unique de vérité timeline.

```typescript
interface TrackingEvent {
  id: number;
  target_type: "alerte" | "incident" | "mission";
  target_id: string;
  actor_id: string | null;
  actor_role: UserRole | "system" | "anonymous";
  action: TrackingAction;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  metadata: object | null;
  created_at: string;
}
```

---

# 12. Entité `MissionServiceInfo`

Inchangée. Junction mission ↔ site.

```typescript
interface MissionServiceInfo {
  id: string;
  mission_id: string;
  site_id: string;
  suggested_action: string | null;
  priority_order: number;
  added_by_user_id: string;
  created_at: string;
}
```

---

# 13. Entité `MediaFile` (mise à jour)

## 13.1 Description

Fichier (photo ou audio) sur MinIO/S3, métadonnées en base.

**Nouveautés v2.0** : champ pour transcription audio + traduction (sticky Figma : *« vocal optionnel — Prevoir la traduction automatique »*).

## 13.2 Type TypeScript

```typescript
interface MediaFile {
  id: string;
  kind: MediaKind;
  bucket: string;
  object_key: string;
  mime_type: string;
  size_bytes: number;

  uploaded_by_user_id: string | null;
  source_qr_id: string | null;

  // Photo
  is_human_blurred: boolean;
  blur_processing_status: MediaProcessingStatus;
  original_object_key: string | null;

  // Audio
  duration_seconds: number | null;
  transcription_status: AudioTranscriptionStatus;
  transcription_original: string | null;     // texte dans la langue parlée (ex: wolof)
  transcription_language: string | null;     // ISO 639-1: "wo", "fr", "en"
  transcription_translated: string | null;   // traduction française
  transcription_translated_at: string | null;

  // Sécurité
  checksum_sha256: string;
  expires_at: string | null;

  created_at: string;
}
```

## 13.3 Schéma SQL (mis à jour)

```sql
CREATE TABLE media_files (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind                         VARCHAR(15) NOT NULL CHECK (kind IN ('photo','audio','document')),
  bucket                       VARCHAR(63) NOT NULL,
  object_key                   TEXT NOT NULL,
  mime_type                    VARCHAR(100) NOT NULL,
  size_bytes                   BIGINT NOT NULL,

  uploaded_by_user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  source_qr_id                 UUID REFERENCES qr_codes(id) ON DELETE SET NULL,

  is_human_blurred             BOOLEAN NOT NULL DEFAULT FALSE,
  blur_processing_status       VARCHAR(15) NOT NULL DEFAULT 'pending'
                               CHECK (blur_processing_status IN
                               ('pending','processing','ready','failed')),
  original_object_key          TEXT,

  duration_seconds             INTEGER,
  transcription_status         VARCHAR(20) NOT NULL DEFAULT 'not_requested'
                               CHECK (transcription_status IN
                               ('not_requested','pending','processing','completed','failed')),
  transcription_original       TEXT,
  transcription_language       VARCHAR(5),
  transcription_translated     TEXT,
  transcription_translated_at  TIMESTAMPTZ,

  checksum_sha256              VARCHAR(64) NOT NULL,
  expires_at                   TIMESTAMPTZ,

  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (bucket, object_key)
);

CREATE INDEX idx_media_uploader      ON media_files(uploaded_by_user_id);
CREATE INDEX idx_media_kind          ON media_files(kind);
CREATE INDEX idx_media_blur_status   ON media_files(blur_processing_status)
  WHERE kind = 'photo';
CREATE INDEX idx_media_audio_status  ON media_files(transcription_status)
  WHERE kind = 'audio';
```

## 13.4 Exemple JSON (audio avec traduction)

```json
{
  "id": "0193da00-3333-7c4f-9b6a-1234567890ee",
  "kind": "audio",
  "bucket": "bet-media",
  "object_key": "alertes/2026/04/17/0193da00-3333.audio.webm",
  "mime_type": "audio/webm",
  "size_bytes": 89231,

  "uploaded_by_user_id": null,
  "source_qr_id": "0193d9f1-aaaa-...",

  "is_human_blurred": false,
  "blur_processing_status": "ready",
  "original_object_key": null,

  "duration_seconds": 12,
  "transcription_status": "completed",
  "transcription_original": "Aw mag mi dama feebar ci entrée bi",
  "transcription_language": "wo",
  "transcription_translated": "Cette personne âgée se sent mal à l'entrée",
  "transcription_translated_at": "2026-04-17T10:24:30Z",

  "checksum_sha256": "a3f1...",
  "expires_at": null,

  "created_at": "2026-04-17T10:23:50Z"
}
```

---

# 14. Entité `AgentPresence` (simplifiée — toggle on/off)

## 14.1 Description

Statut de disponibilité simple de l'agent — **toggle on/off** (étape Figma F3.2).

Les statuts opérationnels (`on_route`, `on_site`) sont **dérivés** de la mission active de l'agent, pas stockés ici.

## 14.2 Type TypeScript

```typescript
interface AgentPresence {
  agent_id: string;                    // PK
  status: AgentPresenceStatus;         // 'available' | 'offline'
  latitude: number | null;
  longitude: number | null;
  battery_level: number | null;
  last_heartbeat_at: string;
  toggled_on_at: string | null;
  toggled_off_at: string | null;
  updated_at: string;
}
```

## 14.3 Schéma SQL

```sql
CREATE TABLE agent_presences (
  agent_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status             VARCHAR(15) NOT NULL DEFAULT 'offline'
                     CHECK (status IN ('available','offline')),
  latitude           DECIMAL(10,7),
  longitude          DECIMAL(10,7),
  battery_level      SMALLINT CHECK (battery_level BETWEEN 0 AND 100),
  last_heartbeat_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  toggled_on_at      TIMESTAMPTZ,
  toggled_off_at     TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_presences_status ON agent_presences(status);
CREATE INDEX idx_agent_presences_geo    ON agent_presences(latitude, longitude)
  WHERE status = 'available';
```

## 14.4 Vue dérivée — statut effectif

```sql
CREATE VIEW agent_effective_status AS
SELECT
  ap.agent_id,
  CASE
    WHEN ap.status = 'offline' THEN 'offline'
    WHEN active_mission.status = 'on_site'   THEN 'on_site'
    WHEN active_mission.status = 'on_route'  THEN 'on_route'
    WHEN active_mission.status = 'accepted'  THEN 'assigned'
    WHEN active_mission.status = 'assigned'  THEN 'assigned'
    ELSE 'available'
  END AS effective_status,
  active_mission.id AS current_mission_id,
  ap.latitude,
  ap.longitude,
  ap.last_heartbeat_at
FROM agent_presences ap
LEFT JOIN LATERAL (
  SELECT id, status FROM missions
  WHERE assigned_to_user_id = ap.agent_id
    AND status IN ('assigned','accepted','on_route','on_site')
  ORDER BY created_at DESC
  LIMIT 1
) active_mission ON TRUE;
```

## 14.5 Règles

- L'agent fait passer manuellement de `offline` à `available` (toggle).
- Heartbeat toutes les 30 s en `available` ; sans heartbeat > 5 min → bascule auto en `offline`.
- L'agent ne peut **pas** passer en `offline` s'il a une mission `accepted`/`on_route`/`on_site` (forcé à terminer ou refuser d'abord).

---

# 15. Entité `PhoneTracking` (nouveau)

## 15.1 Description

> Étape Figma F1.5 « Demande numéro pour suvi » + F1.6 « Historique suivi »

Permet à un spectateur **anonyme** (flow QR) d'attacher son numéro de téléphone à une ou plusieurs alertes pour pouvoir consulter le suivi ultérieurement.

Le numéro est **hashé** en base pour des raisons de protection des données.

## 15.2 Type TypeScript

```typescript
interface PhoneTracking {
  id: string;
  phone_hash: string;          // sha256(phone + salt)
  phone_e164_masked: string;   // "+221 77 *** ** 67" pour affichage
  alerte_id: string;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
  expires_at: string;          // par défaut +90 jours
}
```

## 15.3 Schéma SQL

```sql
CREATE TABLE phone_trackings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash         CHAR(64) NOT NULL,
  phone_e164_masked  VARCHAR(25) NOT NULL,
  alerte_id          UUID NOT NULL REFERENCES alertes(id) ON DELETE CASCADE,
  verified           BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at         TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '90 days',
  UNIQUE (phone_hash, alerte_id)
);

CREATE INDEX idx_phone_trackings_hash ON phone_trackings(phone_hash) WHERE verified;
CREATE INDEX idx_phone_trackings_alerte ON phone_trackings(alerte_id);
```

## 15.4 Exemple JSON

```json
{
  "id": "0193da00-7777-...",
  "phone_e164_masked": "+221 77 *** ** 67",
  "alerte_id": "0193da00-1111-...",
  "verified": true,
  "verified_at": "2026-04-17T10:24:00Z",
  "created_at": "2026-04-17T10:23:55Z",
  "expires_at": "2026-07-16T10:23:55Z"
}
```

(Le `phone_hash` n'est jamais exposé dans les réponses API.)

## 15.5 Workflow

```text
1. Spectateur fournit son numéro (F1.5)
   POST /qr/alertes/{alerte_id}/attach-phone { phone, tracking_token }
   → Backend hashe le numéro, crée phone_tracking (verified=false)
   → Envoie OTP par SMS
   → Réponse 202

2. Spectateur reçoit l'OTP, le confirme
   POST /qr/tracking/verify-otp { phone, otp }
   → Backend vérifie l'OTP, passe verified=true
   → Retourne un token de session de suivi (valable 30 min)
   → Réponse 200

3. Spectateur consulte son historique (F1.6)
   GET /qr/tracking/alertes (header X-Tracking-Token)
   → Backend retourne toutes les alertes attachées à ce numéro
```

---

# 16. Entité `AuditLog`

(Inchangée — voir document v1.0 section 15.)

---

# 17. Machines à états

## 17.1 `Alerte` (simplifiée)

```text
   ┌──────────┐
   │ received │ ← création (QR ou app)
   └────┬─────┘
        │
   ┌────┼────────────┬──────────────┬────────────┐
   ▼    ▼            ▼              ▼            ▼
validated  duplicate  false_alert  rejected  (resté received)
```

| De → Vers | Acteur | Conditions |
|---|---|---|
| `received` → `validated` | coordinator | crée ou attache à un incident |
| `received` → `duplicate` | coordinator (manuel) ou système (anti-spam confirmé) | `duplicate_of_alerte_id` requis |
| `received` → `false_alert` | coordinator / agent assigné | motif obligatoire |
| `received` → `rejected` | coordinator / admin | motif obligatoire |

## 17.2 `Incident`

(Inchangée — voir document v1.0 section 17.2.)

## 17.3 `Mission`

(Inchangée — voir document v1.0 section 17.3.)

---

# 18. Authentification JWT

(Inchangée — voir document v1.0 section 18.)

Trois types de tokens dans le système :

| Token | Usage | Durée | Section |
|---|---|---|---|
| **Access JWT** | API authentifiée (user) | 15 min | 18 |
| **Refresh JWT** | Renouvellement access | 7 jours | 18 |
| **QR Token** | Source d'alerte anonyme | Permanent (rotable) | 19 |
| **Scan Session** | Période active après scan QR | 15 min | 19 |
| **Tracking Token (phone)** | Consultation suivi anonyme | 30 min | 25 |

---

# 19. Token QR + Anti-spam localisation

## 19.1 Token QR (rappel v1.0)

JWT signé `QR_TOKEN_SECRET`. Voir section 6.4.

## 19.2 Anti-spam : nouveau modèle (Figma)

> Sticky Figma : *« Penser au spamming, les boug qui renvoit plusieurs fois (2 minutes) à la même localisation »*

**Le rate-limit par token QR de v1.0 est remplacé par une détection de doublon par proximité.**

### Algorithme

À chaque création d'alerte :

```text
1. Calculer la distance Haversine entre la nouvelle alerte
   et toutes les alertes :
   - de même catégorie
   - créées dans les 2 dernières minutes
   - de statut ≠ false_alert / rejected / duplicate

2. Si une alerte parente est trouvée à < 100 m :
   - Marquer la nouvelle alerte is_potential_duplicate = true
   - Renseigner duplicate_of_alerte_id
   - Émettre tracking_event "alerte.created" + metadata.is_duplicate

3. Si aucune alerte parente :
   - Créer normalement (is_potential_duplicate = false)
```

### Configuration

Variables d'environnement :

```text
ANTISPAM_DISTANCE_METERS=100
ANTISPAM_TIME_WINDOW_SECONDS=120
```

### Différences avec un rate-limit

| Aspect | Rate-limit (v1.0) | Anti-spam localisation (v2.0) |
|---|---|---|
| Bloque l'utilisateur ? | Oui (429) | Non (alerte créée mais flaggée) |
| Vue coordinateur | Pas de visibilité | Voit le "potentiel doublon" et décide |
| Cas d'usage légitime | Mauvaise UX si plusieurs personnes signalent le même incident | Géré naturellement comme doublon |
| Faux positifs | Rare mais bloquants | Possibles mais non bloquants |

### Garde-fous additionnels

- Rate-limit IP global (10 alertes/10 min par IP) maintenu en sécurité de fond ;
- Fingerprint client tracé pour détection de patterns malveillants.

## 19.3 Scan Session Token

Token court délivré après `POST /qr/scan` :

```json
{
  "kind": "scan_session",
  "qr_id": "...",
  "loc": { ... },
  "iat": 1745482800,
  "exp": 1745483700
}
```

Durée 15 minutes. Permet de soumettre une alerte sans recharger la page (si l'utilisateur prend 5 minutes à remplir le formulaire).

---

# 20. Stockage des médias (MinIO / S3)

(Inchangé v1.0, avec ajout traitement audio.)

## 20.1 Pipeline audio (nouveau)

```text
1. Upload audio (webm, mp3, m4a) via signed URL
2. Job: extraire métadonnées (durée, format)
3. Job (phase 2): envoyer à service de transcription (ex: Google Speech-to-Text)
   - Détecter langue (wolof, français, anglais)
   - Stocker transcription_original
4. Job (phase 2): traduire vers français si nécessaire
   - Stocker transcription_translated
5. Marquer transcription_status = 'completed'
```

Pour le MVP : audio stocké brut, `transcription_status = 'not_requested'`.

---

# 21. Format des réponses et erreurs

(Inchangé — voir document v1.0 section 21.)

---

# 22. Conventions de sécurité API

(Inchangé v1.0, avec ajout.)

## 22.1 Rate limits adaptés v2.0

| Cible | Fenêtre | Limite |
|---|---|---|
| IP global | 1 min | 120 req |
| IP global | 1 h | 2000 req |
| Création alerte par IP | 10 min | 10 alertes |
| Auth login par IP | 15 min | 10 tentatives |
| Auth login par phone | 15 min | 5 tentatives |
| OTP request par phone | 1 h | 5 |
| Upload média par session | 10 min | 30 uploads |
| Heartbeat agent | 30 s | 1 |

> Le rate-limit "30 alertes / 10 min par token QR" de v1.0 est **supprimé**. Remplacé par anti-spam localisation (section 19.2).

---

# 23. Matrice de permissions (RBAC) — alignée Figma

| Action | Anonyme QR | Anonyme +phone | Spectator | Agent | Coord. | Admin | Super Admin |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Scanner un QR | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Créer alerte (via QR)** [F1.4] | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Créer alerte (via app)** [F2.6] | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Attacher numéro à alerte** [F1.5] | ✅ | — | — | — | — | — | — |
| **Consulter suivi par téléphone** [F1.6] | ❌ | ✅ | — | — | — | — | — |
| **Voir ses propres alertes (app)** [F2.8] | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voir toutes les alertes | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Valider alerte → incident | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Marquer fausse alerte | ❌ | ❌ | ❌ | sur sa mission | ✅ | ✅ | ✅ |
| **Voir map spectateur** [F2.2] | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Voir postes de secours** [F2.3] | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Voir détails site** [F2.4] | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Toggle on/off** [F3.2] | ❌ | ❌ | ❌ | ✅ | — | — | — |
| **Voir map agent + alertes** [F3.3, F3.4] | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Suivi mission attitrée** [F3.5] | ❌ | ❌ | ❌ | sa mission | ✅ | ✅ | ✅ |
| **Gérer statut mission** [F3.6] | ❌ | ❌ | ❌ | sa mission | ❌ | ❌ | ❌ |
| **Voir dashboard** [F4.2] | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **CRUD agents (terrain)** [F4.3a] | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **CRUD missions** [F4.3b] | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **CRUD agents tiers (sites)** [F4.3c] | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Dispatcher mission** [F4.4] | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Créer agent (rôle agent) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Créer coordinator | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Créer admin | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| CRUD QR codes | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Rotation token QR | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Audit logs (lecture) | ❌ | ❌ | ❌ | ❌ | partiel | ✅ | ✅ |

---

# 24. API — Authentification

Base URL : `https://api.bet.sn/api/v1`

## 24.1 `POST /auth/login`

**Acteurs** : agent, coordinator, admin, super_admin, spectator (compte créé)
**Auth** : aucune
**Rate limit** : 10/15 min IP, 5/15 min phone

```json
// Request
{
  "phone": "+221771234567",
  "password": "...",
  "device_name": "iPhone Aminata"
}

// Response 200
{
  "data": {
    "user": { "id": "...", "fullname": "...", "role": "coordinator", ... },
    "tokens": {
      "access_token": "eyJ...",
      "access_expires_at": "...",
      "refresh_token": "eyJ...",
      "refresh_expires_at": "..."
    }
  }
}
```

## 24.2 `POST /auth/refresh`

(cf v1.0)

## 24.3 `POST /auth/logout`

(cf v1.0)

## 24.4 `POST /auth/spectator/register`

[Flow F2.1.a]

```json
// Request
{
  "fullname": "Fatou Sow",
  "phone": "+221779998888",
  "password": "..."
}

// Response 201 (suit avec OTP de vérification téléphone)
{
  "data": {
    "user": { ... },
    "tokens": { ... },
    "phone_verification_required": true
  }
}
```

## 24.5 `POST /auth/password/forgot`

(cf v1.0)

## 24.6 `POST /auth/password/reset`

(cf v1.0)

## 24.7 `POST /auth/verify-phone/start`

**Auth** : access token

## 24.8 `POST /auth/verify-phone/confirm`

**Auth** : access token

```json
{ "otp": "483921" }
```

---

# 25. API — Flow QR (F1)

> Endpoints du **Flow 1 (QR Code Urgence)** strictement.

## 25.1 `POST /qr/scan` [F1.2]

**Auth** : aucune

```json
// Request
{ "qr_token": "eyJ..." }

// Response 200
{
  "data": {
    "qr_id": "0193d9f1-aaaa-...",
    "location": {
      "latitude": 14.7234567,
      "longitude": -17.5431234,
      "label": "Entrée Nord — Dakar Arena"
    },
    "zone": { "id": "...", "name": "Entrée Nord" },
    "active_alerts_nearby": 1,
    "scan_session_token": "eyJ...",
    "scan_session_expires_at": "2026-04-17T10:38:45Z"
  }
}
```

## 25.2 `POST /qr/alertes` [F1.4]

**Auth** : header `X-Scan-Session: <token>`
**Anti-spam** : voir 19.2

```json
// Request
{
  "category": "health",
  "sub_category": { "type": "malaise" },
  "description": "...",
  "photo_media_id": "...",
  "audio_media_id": null,
  "client_fingerprint": "abc..."
}

// Response 201
{
  "data": {
    "alerte": {
      "id": "0193da00-1111-...",
      "reference": "AL-2026-0001234",
      "status": "received",
      "is_potential_duplicate": false,
      "category": "health",
      "latitude": 14.7234567,
      "longitude": -17.5431234,
      "created_at": "..."
    },
    "tracking_token": "eyJ...",
    "tracking_expires_at": "2026-04-17T10:38:45Z"
  }
}

// Response 201 avec doublon potentiel détecté
{
  "data": {
    "alerte": {
      ...,
      "is_potential_duplicate": true,
      "duplicate_of_alerte_id": "0193da00-0fff-..."
    },
    "tracking_token": "...",
    "warning": "Une alerte similaire a déjà été signalée à proximité. Votre signalement complète l'information existante."
  }
}
```

## 25.3 `POST /qr/alertes/{alerte_id}/attach-phone` [F1.5]

**Auth** : header `X-Tracking-Token` ou `X-Scan-Session`

```json
// Request
{
  "phone": "+221771234567"
}

// Response 202
{
  "message": "Code OTP envoyé par SMS",
  "verification_token": "eyJ...",
  "expires_at": "2026-04-17T10:33:00Z"
}
```

## 25.4 `POST /qr/tracking/verify-otp` [F1.5 confirmation]

**Auth** : `verification_token` reçu à l'étape précédente

```json
// Request
{ "otp": "483921" }

// Response 200
{
  "data": {
    "tracking_token": "eyJ...",
    "tracking_expires_at": "2026-04-17T11:00:00Z",
    "phone_e164_masked": "+221 77 *** ** 67"
  }
}
```

## 25.5 `POST /qr/tracking/request-otp` [Pour F1.6 retour ultérieur]

**Auth** : aucune
**Rate limit** : 3/h par phone

```json
// Request
{ "phone": "+221771234567" }

// Response 202
{ "message": "Si ce numéro a des alertes, un code SMS a été envoyé." }
```

## 25.6 `GET /qr/tracking/alertes` [F1.6]

**Auth** : header `X-Tracking-Token`

```json
// Response 200
{
  "data": [
    {
      "id": "0193da00-1111-...",
      "reference": "AL-2026-0001234",
      "category": "health",
      "status": "validated",
      "incident_summary": {
        "reference": "INC-2026-0000456",
        "status": "in_progress",
        "mission_status": "on_site"
      },
      "created_at": "2026-04-17T10:23:45Z",
      "updated_at": "2026-04-17T10:30:00Z"
    }
  ]
}
```

## 25.7 `GET /qr/tracking/alertes/{alerte_id}` [F1.6 détail]

**Auth** : header `X-Tracking-Token`

```json
// Response 200
{
  "data": {
    "alerte": { ... },
    "incident_summary": { ... },
    "timeline_public": [
      { "step": "Reçue",         "timestamp": "..." },
      { "step": "Validée",       "timestamp": "..." },
      { "step": "Agent envoyé",  "timestamp": "..." },
      { "step": "Agent sur place", "timestamp": "..." }
    ]
  }
}
```

> Aucune information sensible (nom de l'agent, notes internes) n'est exposée.

---

# 26. API — Alertes (Flow App)

> Endpoints du **Flow 2** + endpoints coordinateur sur les alertes.

## 26.1 `POST /alertes` [F2.6]

**Auth** : access token utilisateur (`spectator+`)
**Rate limit** : 10/10 min par utilisateur

```json
// Request
{
  "category": "health",
  "sub_category": { "type": "malaise" },
  "description": "...",
  "photo_media_id": "...",
  "audio_media_id": null,
  "latitude": 14.7234,
  "longitude": -17.5431,
  "qr_token": "eyJ..."  // optionnel — pour contexte
}

// Response 201 (cf format 25.2)
```

## 26.2 `GET /alertes` [Coordinateur F4.2]

**Auth** : `coordinator+`

Query : `status`, `category`, `severity`, `zone_id`, `qr_id`, `created_from`, `created_to`, `q`, `is_potential_duplicate`, `sort`, `page`, `per_page`.

## 26.3 `GET /alertes/{id}`

**Auth** : `coordinator+` ou propriétaire (via `source_user_id`).

```json
// Response 200
{
  "data": {
    "alerte": { ... },
    "incident": { ... } | null,
    "duplicate_parent": { "id": "...", "reference": "...", ... } | null,
    "media": {
      "photo": { "url": "...", "expires_at": "..." } | null,
      "audio": {
        "url": "...",
        "expires_at": "...",
        "transcription_translated": "...",
        "transcription_status": "completed"
      } | null
    },
    "source": {
      "type": "qr" | "user",
      "qr_code": { "id": "...", "location_label": "..." } | null,
      "user": { "id": "...", "fullname": "..." } | null
    }
  }
}
```

## 26.4 `POST /alertes/{id}/validate`

**Auth** : `coordinator+`

```json
// Request : créer un nouvel incident
{
  "action": "create_new_incident",
  "incident_data": {
    "title": "Malaise — Entrée Nord",
    "severity": "high",
    "priority": "p1"
  }
}

// OU rattacher à un existant
{
  "action": "attach_to_existing",
  "incident_id": "..."
}
```

## 26.5 `POST /alertes/{id}/mark-duplicate`

**Auth** : `coordinator+`

```json
{
  "duplicate_of_alerte_id": "...",
  "note": "..."
}
```

## 26.6 `POST /alertes/{id}/mark-false-alert`

**Auth** : `coordinator+` ou agent assigné à mission liée

```json
{ "reason": "..." }
```

## 26.7 `POST /alertes/{id}/reject`

**Auth** : `coordinator+`

```json
{ "reason": "..." }
```

## 26.8 `GET /alertes/{id}/timeline`

**Auth** : `coordinator+` (timeline complète) ou propriétaire (timeline filtrée).

---

# 27. API — Incidents

(Mêmes endpoints que v1.0, simplifiés.)

```text
GET    /incidents
POST   /incidents                        (création manuelle coord.)
GET    /incidents/{id}
PATCH  /incidents/{id}
POST   /incidents/{id}/qualify
POST   /incidents/{id}/resolve
POST   /incidents/{id}/close
POST   /incidents/{id}/cancel
GET    /incidents/{id}/alertes
GET    /incidents/{id}/missions
GET    /incidents/{id}/timeline
```

(Détails des payloads identiques à v1.0 section 27.)

---

# 28. API — Missions

> Endpoints du **Flow 3 (Agent)** + endpoints coordinateur (F4.3, F4.4).

## 28.1 `GET /missions` [F4.3.b]

**Auth** : `coordinator+`

## 28.2 `POST /missions` [F4.4 — Dispatcher]

**Auth** : `coordinator+`

```json
// Request
{
  "incident_id": "...",
  "assigned_to_user_id": "...",
  "title": "Prise en charge malaise — Entrée Nord",
  "briefing": "Personne âgée. Privilégier sortie via Entrée Est.",
  "estimated_duration_minutes": 20,
  "latitude": 14.7234,
  "longitude": -17.5431,
  "service_info_site_ids": ["..."],
  "send_immediately": true
}

// Response 201
{
  "data": {
    "mission": {
      "id": "...",
      "reference": "MIS-2026-0000789",
      "status": "assigned",
      "assigned_to_user_id": "...",
      "incident_id": "...",
      ...
    }
  }
}

// Erreurs
// 409 — Agent déjà en mission active
// 422 — Agent inactif ou pas de rôle agent
```

## 28.3 `GET /missions/{id}` [F3.5]

**Auth** : `coordinator+` ou agent assigné

Retourne mission + incident + service_infos enrichis.

## 28.4 `PATCH /missions/{id}` [F4.3.b édition]

**Auth** : `coordinator+`

Modifiable tant que `status IN ('created', 'assigned')`.

## 28.5 Endpoints transitions agent [F3.6]

```text
POST /missions/{id}/accept                  → assigned -> accepted
POST /missions/{id}/refuse                  → assigned -> refused
POST /missions/{id}/on-route                → accepted -> on_route
POST /missions/{id}/on-site                 → on_route -> on_site
POST /missions/{id}/complete                → on_site -> completed
POST /missions/{id}/request-reinforcement   (action transversale, pas transition)
```

Détail `POST /missions/{id}/complete` :

```json
// Request
{
  "note": "Personne prise en charge par le SAMU.",
  "outcome": "transferred"
}
```

Outcome : `resolved` | `transferred` | `false_alert` | `escalated`.

## 28.6 Endpoints coordinateur

```text
POST /missions/{id}/cancel
POST /missions/{id}/reassign
POST /missions/{id}/service-infos          (attacher un site)
DELETE /missions/{id}/service-infos/{id}
```

## 28.7 `GET /missions/{id}/timeline`

(cf v1.0)

---

# 29. API — Utilisateurs

[Flow F4.3.a CRUD agents]

## 29.1 `GET /users`

**Auth** : `coordinator+` (filtré par zone/équipe pour coord., global pour admin+)

Query : `role`, `team_id`, `zone_id`, `is_active`, `q`.

## 29.2 `POST /users`

**Auth** :
- `coordinator` : peut créer `agent` ;
- `admin` : peut créer `agent`, `coordinator` ;
- `super_admin` : tout.

```json
// Request
{
  "fullname": "Moussa Ndiaye",
  "phone": "+221770000123",
  "password": "...",
  "role": "agent",
  "team_id": "...",
  "zone_id": "..."
}
```

## 29.3 — 29.10

(cf v1.0 sections 29.3 à 29.10 — endpoints `GET/PATCH /users/{id}`, `change-role`, `activate`, `deactivate`, `reset-password`, `revoke-tokens`, `DELETE`.)

## 29.11 `GET /users/{id}/missions-history` [Pour fiche agent F4.3.a]

**Auth** : `coordinator+`

```json
{
  "data": [
    {
      "id": "...",
      "reference": "MIS-...",
      "status": "completed",
      "outcome": "resolved",
      "incident_category": "health",
      "duration_minutes": 18,
      "completed_at": "..."
    }
  ],
  "meta": { ... }
}
```

---

# 30. API — QR codes (gestion admin)

(Inchangée v1.0 section 30 — `GET /qr-codes`, `POST`, `POST /batch`, `PATCH`, `DELETE`, `POST /rotate`, `GET /svg`, `GET /png`, `GET /scans`.)

---

# 31. API — Sites (Agents tiers)

[Flow F2.3, F2.4 — consultation spectateur ; F4.3.c — CRUD coordinateur]

## 31.1 `GET /sites`

**Auth** : utilisateur authentifié

Query : `type`, `is_24_7`, `is_active`, `q`.

## 31.2 `GET /sites/nearby` [F2.3]

**Auth** : utilisateur authentifié

```text
GET /sites/nearby?latitude=14.72&longitude=-17.54&radius_meters=2000&type=hopital,point_secours
```

```json
// Response 200
{
  "data": [
    {
      "site": { ... },
      "distance_meters": 812,
      "estimated_walk_minutes": 11
    }
  ]
}
```

## 31.3 `POST /sites` [F4.3.c]

**Auth** : `coordinator+`

```json
{
  "name": "Hôpital Principal de Dakar",
  "type": "hopital",
  "latitude": 14.6711,
  "longitude": -17.4400,
  "address": "Avenue Nelson Mandela",
  "phone": "+221338891010",
  "description": "Service d'urgence...",
  "is_24_7": true
}
```

## 31.4 `GET /sites/{id}` [F2.4]

**Auth** : utilisateur authentifié

## 31.5 `PATCH /sites/{id}`

**Auth** : `coordinator+`

## 31.6 `DELETE /sites/{id}`

**Auth** : `coordinator+` (soft delete `is_active = false`)

---

# 32. API — Fichiers (médias)

(Inchangée v1.0 section 32.)

```text
POST /files/upload-url
POST /files/{id}/finalize
POST /files                       (multipart fallback)
GET  /files/{id}
GET  /files/{id}/url              (URL signée 5 min)
DELETE /files/{id}                (admin+)
```

## 32.7 `GET /files/{id}/transcription` (nouveau — phase 2)

**Auth** : selon contexte alerte liée

```json
{
  "data": {
    "media_id": "...",
    "transcription_status": "completed",
    "transcription_language": "wo",
    "transcription_original": "Aw mag mi dama feebar...",
    "transcription_translated": "Cette personne âgée se sent mal..."
  }
}
```

---

# 33. API — Espace personnel et map

> Espace utilisateur connecté + endpoints map spécifiques par rôle.

## 33.1 `GET /me`

(cf v1.0)

## 33.2 `PATCH /me`

(cf v1.0)

## 33.3 `POST /me/change-password`

(cf v1.0)

## 33.4 `GET /me/alertes` [F2.8 Historique]

**Auth** : access token

```json
// Response 200
{
  "data": [
    {
      "id": "...",
      "reference": "AL-2026-...",
      "category": "health",
      "status": "validated",
      "incident_id": "...",
      "current_step": "agent_on_site",
      "created_at": "..."
    }
  ],
  "meta": { ... }
}
```

## 33.5 `GET /me/alertes/{id}/timeline` [F2.7 Suivi signalement]

**Auth** : access token

## 33.6 `GET /me/missions` [Agent — toutes ses missions]

**Auth** : agent

## 33.7 `GET /me/missions/active` [Agent — mission en cours]

**Auth** : agent

```json
// Response 200
{
  "data": {
    "active_missions": [
      {
        "id": "...",
        "reference": "MIS-...",
        "status": "on_site",
        "incident": { ... },
        "service_infos": [ ... ]
      }
    ]
  }
}
```

## 33.8 `PATCH /me/presence` [F3.2 Toggle on/off]

**Auth** : agent

```json
// Request — passage ON
{
  "status": "available",
  "latitude": 14.7240,
  "longitude": -17.5420,
  "battery_level": 78
}

// Request — passage OFF
{
  "status": "offline"
}

// Response 200
{
  "data": {
    "presence": {
      "status": "available",
      "toggled_on_at": "...",
      "updated_at": "..."
    }
  }
}

// Erreur 409 si tentative OFF avec mission active
{
  "error": {
    "code": "CONFLICT",
    "message": "Vous avez une mission active. Terminez ou refusez la mission avant de vous déconnecter."
  }
}
```

## 33.9 `POST /me/presence/heartbeat`

**Auth** : agent

Ping toutes les 30 s. Pas de body. Met à jour position si fournie en query.

## 33.10 `GET /spectator/map/incidents-nearby` [F2.2]

**Auth** : `spectator+`

Incidents publics à proximité (filtrés — pas les détails sensibles).

```text
GET /spectator/map/incidents-nearby?latitude=...&longitude=...&radius=2000
```

```json
// Response 200
{
  "data": [
    {
      "id": "...",
      "reference": "INC-...",
      "category": "crowd",
      "severity": "medium",
      "latitude": 14.72,
      "longitude": -17.54,
      "is_hot_zone": true
    }
  ]
}
```

## 33.11 `GET /agent/map/incidents-nearby` [F3.3]

**Auth** : agent

```text
GET /agent/map/incidents-nearby?radius=1000
```

Vue terrain — toutes les alertes/incidents actifs proches de l'agent.

## 33.12 `GET /agent/map/agents-nearby` [F3.3]

**Auth** : agent

Autres agents disponibles à proximité (situational awareness).

```json
{
  "data": [
    {
      "id": "...",
      "fullname": "Aida F.",
      "team_type": "health",
      "effective_status": "available",
      "distance_meters": 320
    }
  ]
}
```

---

# 34. API — Dashboard coordinateur

[Flow F4.2]

## 34.1 `GET /dashboard/kpis`

**Auth** : `coordinator+`

```json
{
  "data": {
    "open_incidents": 12,
    "critical_incidents": 2,
    "high_incidents": 5,
    "average_response_time_seconds": 204,
    "average_resolution_time_seconds": 612,
    "active_missions": 8,
    "agents_available": 18,
    "agents_on_site": 5,
    "agents_offline": 3,
    "potential_duplicates_pending": 3,
    "hot_zones_count": 1
  }
}
```

## 34.2 `GET /dashboard/incidents/live`

**Auth** : `coordinator+`

## 34.3 `GET /dashboard/agents/live`

**Auth** : `coordinator+`

```json
// Response 200
{
  "data": [
    {
      "agent": {
        "id": "...",
        "fullname": "Moussa Ndiaye",
        "team_type": "health",
        "phone": "+221..."
      },
      "presence": {
        "status": "available",
        "effective_status": "available",
        "latitude": 14.72,
        "longitude": -17.54,
        "battery_level": 78,
        "last_heartbeat_at": "..."
      },
      "current_mission_id": null
    }
  ]
}
```

## 34.4 `GET /dashboard/alertes/pending-duplicates` (nouveau)

**Auth** : `coordinator+`

Liste des alertes flaggées comme potentiels doublons à valider.

## 34.5 `GET /dashboard/hot-zones`

**Auth** : `coordinator+`

---

# 35. API — Audit logs

(Inchangée v1.0 section 35.)

---

# 36. API — WebSocket et temps réel

## 36.1 Authentification WebSocket

(cf v1.0)

## 36.2 Canaux

| Canal | Audience |
|---|---|
| `private-coordinator` | tous coordinateurs |
| `private-coordinator.zone.{zoneId}` | coord. d'une zone |
| `private-agent.{agentId}` | un agent |
| `private-incident.{incidentId}` | abonnés incident |
| `private-spectator.{userId}` | spectateur authentifié pour ses alertes |
| `private-tracking.{phoneHash}` | suivi anonyme par phone |
| `presence-zone.{zoneId}` | spectateurs d'une zone (alertes publiques) |

## 36.3 Événements (mis à jour)

```text
AlerteCreated
AlertePotentialDuplicateDetected   (nouveau v2.0)
AlerteValidated
AlerteMarkedDuplicate
AlerteMarkedFalseAlert
AlertePhoneAttached                 (nouveau v2.0 - F1.5)

IncidentCreated
IncidentQualified
IncidentSeverityChanged
IncidentResolved

MissionCreated
MissionAssigned
MissionAccepted
MissionRefused
MissionStatusChanged
MissionCompleted
MissionCancelled
MissionReassigned
MissionReinforcementRequested

AgentToggledOn                      (renommé v2.0)
AgentToggledOff                     (renommé v2.0)
AgentLocationUpdated

HotZoneDetected
ServiceInfoAdded
ServiceInfoRemoved
```

---

# 37. Annexe A — Scénarios E2E des 4 flows Figma

> **Strictement alignés sur le board Figma SUNUBETT — pas plus, pas moins.**

## 37.1 Scénario Flow 1 — QR Code Urgence

> Étapes Figma : Spectateur → Ouvre téléphone et scan → Rediriger vers la plateforme → Renseigner le formulaire → Soumettre le formulaire → Demande numéro pour suivi → Historique suivi.

```text
═══════════════════════════════════════════════════════
[F1.1 — Spectateur ouvre téléphone et scan]
═══════════════════════════════════════════════════════

Le spectateur scanne avec son appareil photo le QR collé
sur le mur de l'Entrée Nord. URL ouverte dans navigateur :
https://bet.sn/q/eyJhbGciOi...

═══════════════════════════════════════════════════════
[F1.2 — Rediriger vers la plateforme]
═══════════════════════════════════════════════════════

POST /api/v1/qr/scan
  Body: { "qr_token": "eyJhbGciOi..." }

→ 200 {
    "qr_id": "0193d9f1-aaaa-...",
    "location": {
      "latitude": 14.7234567,
      "longitude": -17.5431234,
      "label": "Entrée Nord — Dakar Arena"
    },
    "active_alerts_nearby": 0,
    "scan_session_token": "eyJ...",
    "scan_session_expires_at": "2026-04-17T10:38:45Z"
  }

UI : page d'accueil web avec :
  - localisation reconnue
  - bouton « Signaler un incident »

═══════════════════════════════════════════════════════
[F1.3 — Renseigner le formulaire]
═══════════════════════════════════════════════════════

Le spectateur :
  1. Choisit catégorie : Santé
  2. Sous-catégorie (auto-suggestion) : Malaise
  3. Description : "Personne âgée à terre près du pilier"
  4. Enregistre vocal de 12s en wolof
  5. Prend une photo

→ Pour la photo et l'audio :
   POST /api/v1/files/upload-url
     Header: X-Scan-Session: <token>
     Body: { "kind": "photo", "mime_type": "image/jpeg", "size_bytes": 245678 }
   → 200 { media_id, upload_url, ... }

   PUT <upload_url>
     Body: <binary>
   → 200 OK

   POST /api/v1/files/{media_id}/finalize
     Header: X-Scan-Session: <token>
     Body: { "checksum_sha256": "..." }
   → 200 { media }

(Idem pour l'audio)

═══════════════════════════════════════════════════════
[F1.4 — Soumettre le formulaire]
═══════════════════════════════════════════════════════

POST /api/v1/qr/alertes
  Header: X-Scan-Session: <token>
  Body: {
    "category": "health",
    "sub_category": { "type": "malaise" },
    "description": "Personne âgée à terre près du pilier",
    "photo_media_id": "0193da00-2222-...",
    "audio_media_id": "0193da00-3333-...",
    "client_fingerprint": "abc..."
  }

[Anti-spam : aucune alerte similaire dans les 2 min < 100m → OK]

→ 201 {
    "alerte": {
      "id": "0193da00-1111-...",
      "reference": "AL-2026-0001234",
      "status": "received",
      "is_potential_duplicate": false,
      ...
    },
    "tracking_token": "eyJ...",
    "tracking_expires_at": "..."
  }

UI : confirmation
  ✓ Votre alerte a été reçue (réf. AL-2026-0001234)
  Souhaitez-vous suivre l'évolution ?
  [ Numéro de téléphone : +221 ___ ]

═══════════════════════════════════════════════════════
[F1.5 — Demande numéro pour suivi]
═══════════════════════════════════════════════════════

Le spectateur saisit son numéro : +221771234567

POST /api/v1/qr/alertes/{alerte_id}/attach-phone
  Header: X-Tracking-Token: <token>
  Body: { "phone": "+221771234567" }

→ 202 { "verification_token": "eyJ...", "expires_at": "..." }

[SMS envoyé avec OTP "483921"]

Le spectateur saisit l'OTP :

POST /api/v1/qr/tracking/verify-otp
  Header: X-Verification-Token: <verification_token>
  Body: { "otp": "483921" }

→ 200 {
    "tracking_token": "eyJ...",
    "tracking_expires_at": "...",
    "phone_e164_masked": "+221 77 *** ** 67"
  }

═══════════════════════════════════════════════════════
[F1.6 — Historique suivi]
═══════════════════════════════════════════════════════

(Plus tard, le spectateur revient et veut voir l'évolution)

POST /api/v1/qr/tracking/request-otp
  Body: { "phone": "+221771234567" }

→ 202 (SMS envoyé)

POST /api/v1/qr/tracking/verify-otp
  Body: { "phone": "+221771234567", "otp": "..." }

→ 200 { "tracking_token": "..." }

GET /api/v1/qr/tracking/alertes
  Header: X-Tracking-Token: <token>

→ 200 {
    "data": [
      {
        "reference": "AL-2026-0001234",
        "category": "health",
        "status": "validated",
        "incident_summary": {
          "status": "in_progress",
          "mission_status": "on_site"
        },
        ...
      }
    ]
  }

GET /api/v1/qr/tracking/alertes/{alerte_id}
→ 200 {
    "alerte": { ... },
    "incident_summary": { ... },
    "timeline_public": [
      { "step": "Reçue",         "timestamp": "10:23" },
      { "step": "Validée",       "timestamp": "10:24" },
      { "step": "Agent envoyé",  "timestamp": "10:26" },
      { "step": "Agent sur place", "timestamp": "10:28" }
    ]
  }
```

## 37.2 Scénario Flow 2 — Application Spectateur

> Étapes Figma : Spectateur → Ouvre App + Auth → Redirige vers la map → [Acces postes secours + sites événements / Détails Adresse] / [Historique Signalement] / Alerter → Formulaire d'alerte → Suivi Signalement.

```text
═══════════════════════════════════════════════════════
[F2.1 — Ouvre App + Auth]
═══════════════════════════════════════════════════════

POST /api/v1/auth/login
  Body: { "phone": "+221779998888", "password": "..." }

→ 200 { user (role: spectator), tokens }

═══════════════════════════════════════════════════════
[F2.2 — Redirige vers la map]
═══════════════════════════════════════════════════════

[Geolocation navigateur récupère la position]

GET /api/v1/spectator/map/incidents-nearby?latitude=14.72&longitude=-17.54&radius=2000
  Header: Authorization: Bearer <access>

→ 200 { data: [ ... ] }

GET /api/v1/sites/nearby?latitude=14.72&longitude=-17.54&radius=2000&type=point_secours,hopital,samu
→ 200 { data: [ ... ] }

UI : Mapbox dark plein écran avec
  - position user
  - markers incidents
  - markers sites de secours
  - bouton flottant "Alerter"
  - menu : Postes de secours / Historique

═══════════════════════════════════════════════════════
[F2.3 — Acces adresse postes de secours + sites événements]
═══════════════════════════════════════════════════════

(Le spectateur clique sur "Postes de secours")

GET /api/v1/sites/nearby?latitude=...&longitude=...&radius=2000&type=point_secours,hopital,samu,evenement_pc,site_evenement
→ 200 {
    "data": [
      { "site": { "name": "Poste de secours Tribune A", "type": "point_secours", ... },
        "distance_meters": 120 },
      { "site": { "name": "Hôpital Principal de Dakar", "type": "hopital", ... },
        "distance_meters": 812 },
      ...
    ]
  }

UI : liste des sites avec distance, type, action.

═══════════════════════════════════════════════════════
[F2.4 — Détails Adresse]
═══════════════════════════════════════════════════════

(Le spectateur clique sur "Hôpital Principal de Dakar")

GET /api/v1/sites/0193d9f1-bbbb-...

→ 200 {
    "site": {
      "name": "Hôpital Principal de Dakar",
      "type": "hopital",
      "latitude": 14.6711,
      "longitude": -17.4400,
      "address": "Avenue Nelson Mandela, Dakar",
      "phone": "+221338891010",
      "description": "Service d'urgence 24/7. Hélistation disponible.",
      "is_24_7": true,
      ...
    }
  }

UI : fiche détaillée avec :
  - photo (si dispo)
  - adresse cliquable (ouvre maps)
  - téléphone cliquable (initie appel)
  - itinéraire

═══════════════════════════════════════════════════════
[F2.5 + F2.6 — Alerter + Formulaire d'alerte]
═══════════════════════════════════════════════════════

(Retour à la map, clic "Alerter")

[Formulaire identique à F1.3 — formulaire universel]

POST /api/v1/files/upload-url ... PUT ... POST /finalize
(comme F1.3)

POST /api/v1/alertes
  Header: Authorization: Bearer <access>
  Body: {
    "category": "health",
    "sub_category": { "type": "malaise" },
    "description": "...",
    "photo_media_id": "...",
    "audio_media_id": null,
    "latitude": 14.7234,
    "longitude": -17.5431
  }

→ 201 { "alerte": { id, reference: "AL-2026-0001235", ... } }

═══════════════════════════════════════════════════════
[F2.7 — Suivi Signalement]
═══════════════════════════════════════════════════════

(Redirection vers écran de suivi de l'alerte créée)

GET /api/v1/me/alertes/{alerte_id}/timeline

→ 200 {
    "data": [
      { "action": "alerte.created", "to_status": "received",  "created_at": "..." },
      { "action": "alerte.validated", "to_status": "validated", ... },
      { "action": "mission.assigned", ... },
      { "action": "mission.on_site", ... }
    ]
  }

UI : timeline visuelle avec étapes et horodatage.

(Mise à jour temps réel via WebSocket private-spectator.{userId})

═══════════════════════════════════════════════════════
[F2.8 — Historique Signalement]
═══════════════════════════════════════════════════════

(Le spectateur clique sur "Historique" dans le menu)

GET /api/v1/me/alertes?sort=-created_at

→ 200 {
    "data": [
      { "reference": "AL-2026-0001235", "status": "validated", ... },
      { "reference": "AL-2026-0001150", "status": "resolved",  ... }
    ],
    "meta": { ... }
  }

UI : liste paginée des alertes avec accès au détail.
```

## 37.3 Scénario Flow 3 — Agent de terrain

> Étapes Figma : Agent de terrain → Ouvre App + Auth → on/off → Redirige vers la map → Affichage alerte map + notifications → Suivi incident attitré → gestion statut incident.

```text
═══════════════════════════════════════════════════════
[F3.1 — Agent ouvre l'App + Auth]
═══════════════════════════════════════════════════════

POST /api/v1/auth/login
  Body: { "phone": "+221770000123", "password": "..." }

→ 200 { user (role: agent, team_type: health), tokens }

═══════════════════════════════════════════════════════
[F3.2 — on / off]
═══════════════════════════════════════════════════════

(L'agent voit le toggle de disponibilité, le passe ON)

PATCH /api/v1/me/presence
  Header: Authorization: Bearer <access>
  Body: {
    "status": "available",
    "latitude": 14.7240,
    "longitude": -17.5420,
    "battery_level": 78
  }

→ 200 { "presence": { "status": "available", "toggled_on_at": "..." } }

[Backend émet AgentToggledOn sur le canal coordinateur]

═══════════════════════════════════════════════════════
[F3.3 — Redirige vers la map]
═══════════════════════════════════════════════════════

GET /api/v1/agent/map/incidents-nearby?radius=1000
→ 200 { ... }

GET /api/v1/agent/map/agents-nearby?radius=500
→ 200 { ... }

GET /api/v1/me/missions/active
→ 200 { "active_missions": [] }  (aucune pour le moment)

UI : Mapbox avec :
  - position agent
  - autres agents proches (icônes selon statut)
  - incidents actifs
  - sites de référence proches

[Heartbeat lancé en boucle :
  POST /me/presence/heartbeat toutes les 30s]

═══════════════════════════════════════════════════════
[F3.4 — Affichage alerte map + notifications]
═══════════════════════════════════════════════════════

(Coordinateur dispatche une mission à cet agent, voir Flow 4)

[Backend émet MissionAssigned sur private-agent.{agentId}]

WebSocket reçoit :
  {
    "event": "MissionAssigned",
    "data": {
      "mission": {
        "id": "0193da00-4444-...",
        "reference": "MIS-2026-0000789",
        "title": "Prise en charge malaise — Entrée Nord",
        "status": "assigned",
        ...
      }
    }
  }

UI :
  - Toast persistant en haut de l'écran avec son
  - Marker pulsant sur la carte à la position de la mission
  - Banner d'action en bas : "Nouvelle mission — Voir détails"

(L'agent clique sur le banner)

═══════════════════════════════════════════════════════
[F3.5 — Suivi incident attitré]
═══════════════════════════════════════════════════════

GET /api/v1/missions/0193da00-4444-...
  Header: Authorization: Bearer <access>

→ 200 {
    "mission": {
      "title": "Prise en charge malaise — Entrée Nord",
      "briefing": "Personne âgée. Privilégier sortie via Entrée Est.",
      "status": "assigned",
      ...
    },
    "incident": {
      "reference": "INC-2026-0000456",
      "category": "health",
      "severity": "high",
      "description": "Personne âgée à terre près du pilier",
      "photo_url": "...",
      "audio_url": "...",
      ...
    },
    "service_infos": [
      {
        "site": {
          "name": "Hôpital Principal de Dakar",
          "type": "hopital",
          "phone": "+221338891010",
          "distance_meters": 812
        },
        "suggested_action": "Appeler avant transport",
        "priority_order": 1
      }
    ]
  }

UI :
  - Briefing du coordinateur en gros
  - Photo + audio du signalement (avec lecture audio)
  - Carte avec position cible + itinéraire
  - Liste des "agents tiers" (sites suggérés)
    - Hôpital Principal — 812 m — Bouton "Appeler" (+221338891010)
  - Boutons d'action : Accepter / Refuser

═══════════════════════════════════════════════════════
[F3.6 — Gestion statut incident]
═══════════════════════════════════════════════════════

(Acceptation)
POST /api/v1/missions/{id}/accept
  Body: { "current_location": { "latitude": 14.7250, "longitude": -17.5425 } }
→ 200 { mission: { status: "accepted" } }

(En route)
POST /api/v1/missions/{id}/on-route
→ 200 { mission: { status: "on_route" } }

(Sur place)
POST /api/v1/missions/{id}/on-site
  Body: { "location_check": { ... } }
→ 200 { mission: { status: "on_site" } }

(Demande de renfort si nécessaire)
POST /api/v1/missions/{id}/request-reinforcement
  Body: { "note": "Foule s'amplifie, besoin d'un binôme" }
→ 200

[Coordinateur reçoit notification, peut créer une nouvelle mission
 sur le même incident pour un autre agent]

(Terminer)
POST /api/v1/missions/{id}/complete
  Body: {
    "note": "Personne prise en charge par le SAMU. Témoins informés.",
    "outcome": "transferred"
  }
→ 200 { mission: { status: "completed" } }

[L'agent repasse automatiquement en presence "available"]
```

## 37.4 Scénario Flow 4 — Coordinateur

> Étapes Figma : Coordinateur → Ouvre App + Auth → Dashboard → [CRUD agent terrain/mission/agent tiers] → Dispatcher mission.

```text
═══════════════════════════════════════════════════════
[F4.1 — Coordinateur ouvre App + Auth]
═══════════════════════════════════════════════════════

POST /api/v1/auth/login
  Body: { "phone": "+221771234567", "password": "..." }

→ 200 { user (role: coordinator), tokens }

═══════════════════════════════════════════════════════
[F4.2 — Dashboard]
═══════════════════════════════════════════════════════

GET /api/v1/dashboard/kpis
→ 200 {
    "open_incidents": 5,
    "critical_incidents": 1,
    "active_missions": 3,
    "agents_available": 12,
    "agents_on_site": 2,
    "potential_duplicates_pending": 1,
    ...
  }

GET /api/v1/dashboard/incidents/live
→ 200 [ ... ]

GET /api/v1/dashboard/agents/live
→ 200 [ ... ]

[WebSocket abonnement private-coordinator.zone.{zoneId}]

UI : dashboard complet (cf F4.2 layout)

(Notification temps réel : nouvelle alerte AL-2026-0001234 reçue)

GET /api/v1/alertes/0193da00-1111-...
→ 200 {
    "alerte": {
      "reference": "AL-2026-0001234",
      "category": "health",
      "status": "received",
      "is_potential_duplicate": false,
      "source": { "type": "qr", "qr_code": { "location_label": "Entrée Nord" } },
      ...
    },
    "media": {
      "photo": { "url": "...", ... },
      "audio": {
        "url": "...",
        "transcription_translated": "Cette personne âgée se sent mal..."
      }
    }
  }

(Coordinateur valide l'alerte → crée incident)

POST /api/v1/alertes/{id}/validate
  Body: {
    "action": "create_new_incident",
    "incident_data": {
      "title": "Malaise — Entrée Nord",
      "severity": "high",
      "priority": "p1"
    }
  }

→ 200 {
    "alerte": { "status": "validated", "incident_id": "..." },
    "incident": {
      "reference": "INC-2026-0000456",
      "status": "qualified",
      ...
    }
  }

═══════════════════════════════════════════════════════
[F4.3 — CRUD Agent / Mission / Agent tiers]
═══════════════════════════════════════════════════════

[F4.3.a — Vérifier qu'il y a un agent santé disponible]

GET /api/v1/dashboard/agents/live?team_type=health&status=available
→ 200 {
    "data": [
      {
        "agent": { "fullname": "Moussa Ndiaye", "team_type": "health" },
        "presence": { "effective_status": "available", "latitude": 14.725, ... }
      }
    ]
  }

[F4.3.c — Trouver les agents tiers (sites) proches utiles]

GET /api/v1/sites/nearby?latitude=14.7234&longitude=-17.5431&type=hopital,samu&radius=2000
→ 200 {
    "data": [
      { "site": { "name": "Hôpital Principal", ... }, "distance_meters": 812 }
    ]
  }

═══════════════════════════════════════════════════════
[F4.4 — Dispatcher mission]
═══════════════════════════════════════════════════════

POST /api/v1/missions
  Body: {
    "incident_id": "0193da00-3333-...",
    "assigned_to_user_id": "<moussa_id>",
    "title": "Prise en charge malaise — Entrée Nord",
    "briefing": "Personne âgée. Privilégier sortie via Entrée Est.",
    "estimated_duration_minutes": 20,
    "latitude": 14.7234,
    "longitude": -17.5431,
    "service_info_site_ids": ["<hopital_principal_id>"],
    "send_immediately": true
  }

→ 201 {
    "mission": {
      "reference": "MIS-2026-0000789",
      "status": "assigned",
      "assigned_to_user_id": "<moussa_id>",
      ...
    }
  }

[Backend émet MissionAssigned sur private-agent.<moussa_id>]
[L'incident passe automatiquement en "mission_assigned"]

(Le coordinateur suit l'évolution dans le dashboard via WebSocket)

WebSocket reçoit :
  - MissionAccepted (Moussa accepte)
  - MissionStatusChanged (on_route)
  - MissionStatusChanged (on_site)
  - MissionCompleted (transferred)

(Coordinateur clôture l'incident)

POST /api/v1/incidents/{id}/resolve
  Body: { "note": "Transferé vers Hôpital Principal." }
→ 200
```

---

# Fin du document

**Ce document est la référence unique pour les types et l'API du système Bët, v2.0, strictement aligné sur le board Figma SUNUBETT.**

**Toute évolution des flows Figma doit être reflétée ici en incrémentant la version.**

---

*Version 2.0 — Avril 2026 — Aligné Figma SUNUBETT (use case Alerter — 4 flows)*
