# Bët — Features

## Catalogue fonctionnel

**Version** : 1.0
**Date** : Avril 2026
**Source** : Board Figma SUNUBETT
**Méthode** : chaque feature mappe directement à une étape du board Figma

---

## Table des matières

1. [Conventions](#1-conventions)
2. [Features transverses](#2-features-transverses)
3. [Flow 1 — QR Code Urgence (Spectateur)](#3-flow-1--qr-code-urgence-spectateur)
4. [Flow 2 — Application (Spectateur)](#4-flow-2--application-spectateur)
5. [Flow 3 — Agent de terrain](#5-flow-3--agent-de-terrain)
6. [Flow 4 — Coordinateur](#6-flow-4--coordinateur)
7. [Features admin (configuration système)](#7-features-admin-configuration-système)
8. [Vue récapitulative](#8-vue-récapitulative)

---

# 1. Conventions

Pour chaque feature, on précise :

- **ID** : identifiant unique (ex. `F1.3` pour Flow 1, étape 3)
- **Étape Figma** : nom du nœud dans le board
- **Acteur** : qui déclenche la feature
- **Description** : ce que fait la feature
- **Composants UI** : écrans / composants impliqués
- **Endpoints API** : appels backend
- **Règles métier** : contraintes spécifiques
- **Définition of Done** : critères d'acceptation

---

# 2. Features transverses

Communes à plusieurs flows.

## F0.1 — Formulaire d'alerte universel

**Acteur** : Spectateur (QR ou app)

**Description** : interface unique de saisie d'un signalement, partagée entre flow QR et flow App.

**Champs** :

| Champ | Type | Obligatoire |
|---|---|---|
| Catégorie | enum (Santé, Sécurité, Foule, Accès bloqué, Incendie/danger, Perdu/trouvé, Logistique, Transport, Autre) | ✅ |
| Sous-catégorie | JSONB libre | ❌ |
| Description | texte (300 caractères max) | ❌ |
| Vocal | audio (max 60s) | ❌ |
| Photo | image (jpg/png, max 5MB) | ❌ |

**Règles** :

- Au moins **un** des trois champs (description, vocal, photo) doit être renseigné en plus de la catégorie ;
- Photo automatiquement floutée côté backend si humains détectés ;
- Vocal stocké brut, transcription/traduction en phase 2 ;
- Sous-catégorie est un JSON libre — l'UI propose des templates par catégorie principale.

**Endpoints API** :
- `POST /api/v1/files/upload-url` (préparer upload photo/vocal)
- `PUT <signed-url>` (upload direct S3/MinIO)
- `POST /api/v1/files/{id}/finalize`
- `POST /api/v1/qr/alertes` (flow QR) **ou** `POST /api/v1/alertes` (flow App)

**Composants UI** : `AlerteForm`, `MediaUploader`, `CategoryPicker`, `SubCategoryEditor`.

## F0.2 — Anti-spam par proximité spatio-temporelle

**Acteur** : système (transparent pour l'utilisateur)

**Description** : détection automatique des doublons.

**Règle** :

```text
SI une alerte existe avec :
  - même catégorie
  - distance GPS < 100 m (configurable)
  - âge < 2 minutes (configurable)
  - statut ≠ resolved/false_alert/rejected

ALORS la nouvelle alerte est marquée potentiel_doublon
ET référencée à l'alerte parente.
```

**Comportement** :
- L'alerte est **acceptée** (créée en base) ;
- Mais marquée `is_potential_duplicate = true` ;
- Le coordinateur peut confirmer ou infirmer via l'interface.

**Endpoints** : appliqué automatiquement dans `POST /alertes` et `POST /qr/alertes`.

## F0.3 — Floutage automatique des humains

**Acteur** : système (job asynchrone)

**Description** : à l'upload d'une photo, un job vérifie la présence d'humains et applique un flou gaussien sur les visages détectés.

**Stack technique** :
- Job Laravel queue Redis ;
- Détection via modèle léger (mediapipe / face-api.js côté worker Node.js, ou OpenCV en PHP) ;
- Image floutée remplace l'originale au même `object_key` ;
- Originale conservée 7 jours en bucket privé (audit).

**Statut suivable** : `media_files.blur_processing_status` = `pending` → `processing` → `ready` (ou `failed`).

## F0.4 — Stockage médias signé (MinIO/S3)

**Description** : aucune URL S3 n'est servie publiquement. L'API génère des **URLs signées** valables 5 minutes.

**Endpoints** :
- `GET /api/v1/files/{id}/url` → URL signée
- Régénérée à chaque consultation.

## F0.5 — Notifications temps réel

**Description** : diffusion des événements opérationnels via WebSocket (Laravel Reverb).

**Canaux** :
- `private-coordinator.zone.{zoneId}` → coordinateurs
- `private-agent.{agentId}` → un agent spécifique
- `private-spectator-tracking.{phone_hash}` → suivi anonyme par téléphone

**Fallback** : polling 5s si WebSocket indisponible.

---

# 3. Flow 1 — QR Code Urgence (Spectateur)

> Sticky Figma : *« On authentifie pas le user, mais le QR »*

## F1.1 — Spectateur scanne le QR

**Étape Figma** : « Ouvre téléphone et scan »

**Description** : le spectateur ouvre l'appareil photo de son téléphone (ou un lecteur QR), scanne un QR collé sur un mur/poteau.

**Comportement** :
- Le QR encode une URL : `https://bet.sn/q/<token>`
- Le navigateur ouvre cette URL automatiquement.
- **Aucune installation d'app requise.**

**Caractéristiques techniques** :
- Token = JWT signé (HS256) avec clé `QR_TOKEN_SECRET` ;
- Payload : `{ qr_id, lat, lng, label, kind: "qr" }` ;
- Validité : permanente par défaut, rotation possible.

## F1.2 — Redirection vers la plateforme

**Étape Figma** : « Rediriger vers la plateforme »

**Description** : la web app charge, valide le token QR auprès du backend, et présente l'écran d'alerte.

**Endpoints** :
- `POST /api/v1/qr/scan` → retourne `{ qr_id, location, scan_session_token, active_alerts_nearby }`

**UI** : écran d'accueil avec :
- localisation détectée (label + coordonnées) ;
- bouton principal « Signaler un incident » ;
- éventuelles alertes actives à proximité.

**Règles** :
- Si `qr_id` invalide → écran d'erreur.
- Si QR désactivé (`is_active = false`) → écran d'erreur explicite.
- Le `scan_session_token` est conservé en mémoire (durée 15 min).

## F1.3 — Renseigner le formulaire

**Étape Figma** : « Renseigner le formulaire »
**Sticky** : *« Catégorie d'incidents · Sous catégorie · Description optionnel · Vocal optionnel (Prevoir la traduction automatique) · photo floute »*

**Description** : voir [F0.1 — Formulaire d'alerte universel](#f01--formulaire-dalerte-universel).

**Spécificité flow QR** :
- la position GPS **n'est pas demandée** au navigateur — elle vient du token QR ;
- un attaquant ne peut donc pas spoofer la position.

## F1.4 — Soumettre le formulaire

**Étape Figma** : « Soumettre le formulaire »
**Sticky** : *« Penser au spamming, les boug qui renvoit plusieurs fois (2 minutes) à la même localisation »*

**Description** : envoi de l'alerte au backend.

**Endpoint** :
- `POST /api/v1/qr/alertes`
- Header : `X-Scan-Session: <token>`

**Règle anti-spam** : voir [F0.2](#f02--anti-spam-par-proximité-spatio-temporelle).

**Réponse** :
```json
{
  "data": {
    "alerte": { "id": "...", "reference": "AL-2026-0001234", "status": "received" },
    "tracking_token": "..."
  }
}
```

**UI** : écran de confirmation avec référence d'alerte.

## F1.5 — Demande numéro pour suivi

**Étape Figma** : « Demande numéro pour suvi »

**Description** : après soumission, le spectateur peut **optionnellement** fournir son numéro de téléphone pour permettre la consultation ultérieure du suivi.

**UI** :
```text
✓ Votre alerte a été reçue (AL-2026-0001234)

Souhaitez-vous suivre l'évolution de cette alerte ?
[ Numéro de téléphone : +221 ___ ]
[ Recevoir le code SMS ]
```

**Endpoint** :
- `POST /api/v1/qr/alertes/{alerte_id}/attach-phone`
- Body : `{ "phone": "+221771234567", "tracking_token": "..." }`

**Règles** :
- OTP envoyé par SMS pour vérifier le numéro ;
- Le téléphone est stocké hashé (sha256 + sel) sur l'alerte ;
- Une alerte peut avoir un numéro attaché ; un numéro peut suivre plusieurs alertes.

**Cette étape est facultative** — le spectateur peut fermer la fenêtre, l'alerte est tout de même traitée.

## F1.6 — Historique suivi

**Étape Figma** : « Historique suivi »

**Description** : page de consultation du statut de l'alerte (pour le spectateur ayant fourni son numéro).

**Accès** :
- via lien direct envoyé par SMS : `https://bet.sn/suivi?phone=+221...&otp=...`
- ou via formulaire web : saisir téléphone + recevoir OTP.

**Endpoint** :
- `POST /api/v1/qr/tracking/request-otp` → `{ phone }` → SMS envoyé
- `POST /api/v1/qr/tracking/verify-otp` → `{ phone, otp }` → token de session
- `GET /api/v1/qr/tracking/alertes` (header `X-Tracking-Token`) → liste des alertes

**UI** : liste des alertes avec :
- référence (`AL-2026-...`)
- catégorie
- statut courant (Reçue, Validée, Mission assignée, En cours, Résolue)
- timeline simplifiée

**Règles** :
- Aucune information sensible exposée (pas le nom de l'agent, pas les notes internes).
- Seulement les alertes attachées au numéro fourni.

---

# 4. Flow 2 — Application (Spectateur)

## F2.1 — Spectateur ouvre l'app + auth

**Étape Figma** : « Ouvre App + Auth »

**Description** : authentification du spectateur via numéro de téléphone et mot de passe.

**Sous-features** :

### F2.1.a — Inscription
- Champs : nom complet, téléphone, mot de passe ;
- OTP de vérification téléphone ;
- Endpoint : `POST /api/v1/auth/spectator/register`

### F2.1.b — Connexion
- Champs : téléphone, mot de passe ;
- Endpoint : `POST /api/v1/auth/login`

### F2.1.c — Mot de passe oublié
- OTP par SMS ;
- Endpoint : `POST /api/v1/auth/password/forgot` puis `POST /api/v1/auth/password/reset`.

**UI** : écrans `Login`, `Register`, `ForgotPassword` mobile-first.

## F2.2 — Redirige vers la map

**Étape Figma** : « Redirige vers la map »

**Description** : après authentification, le spectateur arrive directement sur une carte interactive (Mapbox dark).

**Affichage sur la map** :
- position du spectateur (geolocation navigateur, fallback ville par défaut) ;
- alertes/incidents actifs à proximité (zones colorées) ;
- postes de secours (markers spéciaux, voir F2.3) ;
- périmètre de l'événement (zones).

**Endpoints** :
- `GET /api/v1/spectator/map/incidents-nearby?radius=2000`
- `GET /api/v1/sites/nearby?type=secours&radius=2000`

**Composants UI** : `MapView`, `IncidentMarker`, `SiteMarker`, `UserPositionPin`, `BottomActionBar`.

## F2.3 — Accès adresse postes de secours + sites événements

**Étape Figma** : « Acces addresse poste de secours + Site evenements »

**Description** : depuis la map, le spectateur peut consulter les sites de référence (postes de secours, points de premier secours, hôpitaux, lieux d'événement).

**UI** :
- bouton flottant « Postes de secours » ;
- liste filtrée par type (secours, hôpital, point info, point eau) ;
- chaque entrée : nom, type, distance, action (appeler, voir).

**Endpoint** :
- `GET /api/v1/sites/nearby?lat=...&lng=...&radius=2000&type=...`

## F2.4 — Détails adresse

**Étape Figma** : « Details Adresse »

**Description** : fiche complète d'un site sélectionné.

**Contenu** :
- nom, type, photo (si disponible) ;
- adresse complète ;
- coordonnées GPS ;
- numéro de téléphone (cliquable pour appel direct) ;
- horaires (ou « 24/7 ») ;
- description ;
- bouton « Itinéraire » (ouvre Maps).

**Endpoint** :
- `GET /api/v1/sites/{id}`

## F2.5 — Alerter

**Étape Figma** : « Alerter »

**Description** : depuis la map, bouton central « Alerter » qui ouvre le formulaire d'alerte.

**Spécificité flow App vs flow QR** :
- la position vient du **GPS du téléphone** (pas du QR) ;
- la position est validée via la geolocation API ;
- l'utilisateur peut **ajuster** la position sur la carte si elle est imprécise.

## F2.6 — Formulaire d'alerte

**Étape Figma** : « formulaire d'alerte »

**Description** : voir [F0.1](#f01--formulaire-dalerte-universel) — même formulaire que flow QR.

**Endpoint** :
- `POST /api/v1/alertes`
- Header : `Authorization: Bearer <access_token>`
- Body : champs du formulaire + lat/lng GPS

## F2.7 — Suivi signalement

**Étape Figma** : « Suivi Signalement »

**Description** : après soumission, écran de suivi de l'alerte créée.

**Différence avec flow QR** :
- pas besoin de saisir un numéro — l'utilisateur est connecté ;
- accès direct à la timeline depuis l'app.

**Endpoint** :
- `GET /api/v1/me/alertes/{id}/timeline`

**UI** : timeline visuelle avec étapes :
1. Reçue
2. En cours d'examen
3. Mission assignée à un agent
4. Agent en route / sur place
5. Résolue

## F2.8 — Historique signalement

**Étape Figma** : « Historique Signalement »

**Description** : depuis l'écran principal, accès à la liste des alertes que l'utilisateur a soumises.

**Endpoint** :
- `GET /api/v1/me/alertes?sort=-created_at`

**UI** : liste paginée avec :
- référence
- catégorie + icône
- date
- statut actuel (badge coloré)
- aperçu description
- accès au détail (timeline, médias)

---

# 5. Flow 3 — Agent de terrain

## F3.1 — Agent ouvre l'app + auth

**Étape Figma** : « Ouvre App + Auth »

**Description** : authentification de l'agent (téléphone + mot de passe).

**Spécificité** : compte créé par un coordinateur (l'agent ne peut pas s'inscrire seul).

**Endpoint** :
- `POST /api/v1/auth/login`

**Premier login** : changement de mot de passe obligatoire.

## F3.2 — Toggle on/off

**Étape Figma** : « on / of »

**Description** : juste après login, l'agent voit un **toggle de disponibilité** (on/off) clairement visible.

**Statuts possibles** :
- `available` (toggle ON) → reçoit des missions ;
- `offline` (toggle OFF) → ne reçoit pas de missions, n'apparaît pas sur la carte coordinateur.

**UI** : grand toggle visuel en haut de l'écran principal de l'agent.

```text
┌──────────────────────────────┐
│  Statut                      │
│  ┌─────────────────────────┐ │
│  │  [●━━━━━]    DISPONIBLE │ │
│  └─────────────────────────┘ │
│                              │
│  Position partagée ✓         │
└──────────────────────────────┘
```

**Endpoint** :
- `PATCH /api/v1/me/presence`
- Body : `{ "status": "available" | "offline", "latitude": ..., "longitude": ... }`

**Règles** :
- En `available`, position partagée toutes les 30 secondes ;
- En `offline`, plus de partage de position ;
- Le toggle peut être bloqué si l'agent a une mission active (passage forcé en `assigned`).

## F3.3 — Redirige vers la map

**Étape Figma** : « Redirige vers la map »

**Description** : map de l'agent, similaire à celle du spectateur mais avec :
- les **incidents proches** (vue terrain) ;
- les **autres agents proches** (situational awareness) ;
- sa **mission active** mise en évidence ;
- les **sites de référence** à proximité (postes de secours, hôpitaux).

**Endpoints** :
- `GET /api/v1/agent/map/incidents-nearby`
- `GET /api/v1/agent/map/agents-nearby`
- `GET /api/v1/me/missions/active`

## F3.4 — Affichage alerte map + notifications

**Étape Figma** : « Affichage alerte map + notifications »

**Description** : quand une mission est dispatchée à l'agent, il reçoit :

1. **Notification in-app** (toast persistant + son) ;
2. **Marker spécial** sur la map (pulsant, couleur priorité) ;
3. **Banner d'action** en bas de l'écran : « Nouvelle mission — Accepter / Voir détails ».

**Canal WebSocket** :
- `private-agent.{agentId}` → événement `MissionAssigned`

**Fallback** : polling toutes les 5 secondes sur `GET /api/v1/me/missions/active`.

**UI** : composant `MissionNotification` avec actions rapides.

## F3.5 — Suivi incident attitré

**Étape Figma** : « Suivi incident attitre »

**Description** : écran détaillé de la mission acceptée.

**Contenu** :
- titre + briefing du coordinateur ;
- localisation cible + itinéraire ;
- photo / vocal / description du signalement initial ;
- liste des **agents tiers** suggérés par le coordinateur (hôpital, police, pompiers proches) avec :
  - nom + type
  - distance
  - bouton « Appeler »
  - action suggérée par le coordinateur ;
- timeline de la mission ;
- boutons d'action (voir F3.6).

**Endpoint** :
- `GET /api/v1/missions/{id}` → détail complet
- `GET /api/v1/missions/{id}/service-infos` → sites suggérés

## F3.6 — Gestion statut incident

**Étape Figma** : « gestion statut incident »

**Description** : l'agent met à jour le statut de sa mission depuis le terrain.

**Boutons d'action** (selon le statut courant) :

| Statut courant | Actions disponibles |
|---|---|
| `assigned` | Accepter / Refuser (motif) |
| `accepted` | En route |
| `on_route` | Sur place |
| `on_site` | Demander renfort / Terminer |

**Endpoints** :
- `POST /api/v1/missions/{id}/accept`
- `POST /api/v1/missions/{id}/refuse` (avec `reason`)
- `POST /api/v1/missions/{id}/on-route`
- `POST /api/v1/missions/{id}/on-site`
- `POST /api/v1/missions/{id}/complete` (avec `note`, `outcome`)
- `POST /api/v1/missions/{id}/request-reinforcement` (avec `note`)

**Règles** :
- Transitions strictement séquentielles (cf machine à états Mission) ;
- Chaque action enregistrée dans `tracking_events` ;
- Position GPS capturée à chaque transition (pour audit) ;
- À la complétion, l'agent passe automatiquement de `on_site` à `available`.

---

# 6. Flow 4 — Coordinateur

## F4.1 — Coordinateur ouvre l'app + auth

**Étape Figma** : « Ouvre App + Auth »

**Description** : authentification du coordinateur (téléphone + mot de passe).

**Spécificité** : compte créé par un admin.

**Endpoint** : `POST /api/v1/auth/login`.

**UI** : formulaire login standard, redirection vers Dashboard après succès.

## F4.2 — Dashboard

**Étape Figma** : « Dashboard »

**Description** : interface centralisée du coordinateur, pensée pour un usage **desktop / tablette** (vue large).

**Layout principal** :

```text
┌────────────────────────────────────────────────────────┐
│ Bët · PC Dakar Arena       Aminata · Coordinator       │
├──────────┬───────────────────────────────────┬─────────┤
│ Filtres  │                                   │ Détail  │
│          │                                   │         │
│ ☑ Santé  │       CARTE LIVE MAPBOX          │ #INC-... │
│ ☐ Séc.   │       (incidents + agents +       │  health │
│ ☑ Foule  │        zones d'alerte)            │  HIGH   │
│          │                                   │         │
│ Gravité  │                                   │ Photo   │
│ ☑ crit.  │                                   │ Audio   │
│ ☑ high   │                                   │         │
│          │                                   │ Timeline│
│ Statut   │                                   │         │
│ ☑ ouvert │                                   │ Agents  │
│ ☐ résolu │                                   │ proches │
│          │                                   │         │
│          │                                   │ [Disp.] │
├──────────┴───────────────────────────────────┴─────────┤
│ KPIs : 12 ouverts · 3 critiques · TMP 3'24" · ...     │
└────────────────────────────────────────────────────────┘
```

**Sous-composants** :

### F4.2.a — Carte live
- Mapbox dark plein écran ;
- Markers incidents (couleur = gravité) ;
- Markers agents (icône = type d'équipe, halo selon statut) ;
- Markers QR codes (gris, faibles) ;
- Markers sites (catégorisés par icône) ;
- Zones d'alerte actives.

### F4.2.b — Liste latérale incidents
- triable et filtrable ;
- colonnes : référence, catégorie, gravité, statut, zone, agent assigné, créé.

### F4.2.c — Panneau détail
- ouvert au clic sur un marker ou item de liste ;
- affiche tous les détails de l'incident sélectionné ;
- accès direct aux médias (photo, vocal) ;
- timeline ;
- actions (qualifier, dispatcher mission, etc.).

### F4.2.d — Barre de KPIs
- incidents ouverts ;
- critiques ;
- temps moyen de prise en charge ;
- agents disponibles / sur le terrain.

**Endpoints** :
- `GET /api/v1/dashboard/kpis`
- `GET /api/v1/dashboard/incidents/live`
- `GET /api/v1/dashboard/agents/live`
- `GET /api/v1/incidents/{id}`

## F4.3 — CRUD Agent de terrain / Mission / Agent tiers

**Étape Figma** : « CRUD Agent de terrain/mission/agent tiers »

**Description** : trois sous-modules CRUD accessibles depuis le dashboard.

### F4.3.a — CRUD Agent de terrain

**Description** : création et gestion des comptes agents.

**UI** : page `/coordinator/agents`

**Actions** :
- Lister les agents (filtre par statut, équipe) ;
- Créer un agent (nom, téléphone, équipe, zone) ;
- Modifier (équipe, zone, infos) ;
- Activer / Désactiver ;
- Réinitialiser mot de passe ;
- Voir historique missions d'un agent.

**Endpoints** :
- `GET /api/v1/users?role=agent`
- `POST /api/v1/users` (avec `role: "agent"`)
- `PATCH /api/v1/users/{id}`
- `POST /api/v1/users/{id}/activate` / `/deactivate`
- `POST /api/v1/users/{id}/reset-password`
- `GET /api/v1/users/{id}/missions-history`

### F4.3.b — CRUD Mission

**Description** : voir [F4.4 — Dispatcher mission](#f44--dispatcher-mission). La création de mission est l'action principale ; les autres opérations (modifier briefing, annuler, réassigner) sont accessibles depuis le détail de chaque mission.

**Endpoints** :
- `GET /api/v1/missions` (liste avec filtres)
- `POST /api/v1/missions` (créer = dispatcher)
- `PATCH /api/v1/missions/{id}` (modifier avant acceptation)
- `POST /api/v1/missions/{id}/cancel`
- `POST /api/v1/missions/{id}/reassign`

### F4.3.c — CRUD Agent tiers (= Sites)

**Description** : gestion des services externes (police, hôpital, pompiers, SAMU, etc.) qui peuvent être appelés en renfort ou suggérés à un agent.

**UI** : page `/coordinator/sites`

**Actions** :
- Lister les sites par type ;
- Créer un site (nom, type, coordonnées, téléphone, horaires) ;
- Modifier ;
- Activer / désactiver.

**Types** (alignés avec l'enum `SiteType`) :
- `police`, `commissariat`, `gendarmerie`
- `hopital`, `clinique`, `samu`
- `pompiers`, `protection_civile`
- `depannage`
- `evenement_pc`
- `point_eau`, `point_repos`
- `autre`

**Endpoints** :
- `GET /api/v1/sites`
- `POST /api/v1/sites`
- `PATCH /api/v1/sites/{id}`
- `DELETE /api/v1/sites/{id}` (soft delete)

## F4.4 — Dispatcher mission

**Étape Figma** : « Dispatcher mission »

**Description** : action principale du coordinateur. Une fois qu'un incident est qualifié (depuis une alerte ou créé manuellement), le coordinateur **dispatche** une mission en sélectionnant un agent disponible.

**UI** : modal ou panneau latéral depuis le détail d'un incident.

```text
┌────────────────────────────────────┐
│ Dispatcher mission — INC-2026-0456 │
├────────────────────────────────────┤
│ Incident : Malaise — Entrée Nord   │
│ Gravité : HIGH                     │
│                                    │
│ ── Agent à assigner ──             │
│ ○ Moussa N. (Santé · 80m · ✓)     │
│ ○ Aida F. (Santé · 320m · ✓)      │
│ ○ Cheikh D. (Santé · 540m · ✓)    │
│                                    │
│ ── Briefing ──                     │
│ ┌────────────────────────────────┐ │
│ │ Personne âgée en malaise.      │ │
│ │ Foule autour. Privilégier      │ │
│ │ sortie via Entrée Est.         │ │
│ └────────────────────────────────┘ │
│                                    │
│ Durée estimée : [ 20 ] min        │
│                                    │
│ ── Agents tiers à proposer ──     │
│ ☑ Hôpital Principal (812m)        │
│ ☐ Commissariat Médina (1.2km)     │
│                                    │
│ ☑ Notifier l'agent immédiatement  │
│                                    │
│ [ Annuler ]    [ Dispatcher ]     │
└────────────────────────────────────┘
```

**Composants** :
- liste d'agents triés par : disponibilité (`available`), spécialité d'équipe (matching catégorie), distance ;
- éditeur de briefing (texte libre, suggestions par catégorie) ;
- sélecteur de **sites à proposer** comme service info (suggéré sur base de la position) ;
- toggle « Notifier immédiatement » (sinon mission reste en `created`).

**Endpoints** :
- `GET /api/v1/dashboard/agents/live?available=true&team_type=health` (liste agents recommandés)
- `GET /api/v1/sites/nearby?lat=...&lng=...&type=hopital,police` (sites suggérés)
- `POST /api/v1/missions` (création + dispatch)

**Règles** :
- Vérifier que l'agent n'a pas déjà une mission active (sinon erreur `409 CONFLICT`) ;
- Au moins un agent doit être disponible pour dispatcher ;
- Le briefing est optionnel mais recommandé (warning si vide) ;
- L'incident passe automatiquement en `mission_assigned` ;
- L'agent reçoit la mission via WebSocket / push notification.

---

# 7. Features admin (configuration système)

Non visibles dans le board Figma mais nécessaires pour faire fonctionner le système.

## F5.1 — CRUD Coordinateurs

**Description** : seul un admin peut créer un coordinateur.

**Endpoint** : `POST /api/v1/users` avec `role: "coordinator"`.

## F5.2 — CRUD QR codes

**Description** : génération, impression et rotation des QR codes.

**Sous-features** :
- Création unitaire ou en batch ;
- Téléchargement SVG/PNG pour impression ;
- Rotation du token (en cas de fuite) ;
- Désactivation.

**Endpoints** : voir section 30 du document `types-et-api-bet.md`.

## F5.3 — CRUD Zones

**Description** : hiérarchie de zones (Sénégal → Dakar → Dakar Arena → Entrée Nord).

## F5.4 — Audit Logs

**Description** : consultation des logs de toutes les actions sensibles.

**Endpoint** : `GET /api/v1/audit-logs`.

---

# 8. Vue récapitulative

## 8.1 Mapping étapes Figma → features

| ID Feature | Étape Figma | Acteur | Sprint cible |
|---|---|---|---|
| F0.1 | (transverse) Formulaire alerte | Spectator | Sprint 2 |
| F0.2 | (transverse) Anti-spam | Système | Sprint 2 |
| F0.3 | (transverse) Floutage photo | Système | Sprint 2 |
| F0.4 | (transverse) Médias signés | Système | Sprint 1 |
| F0.5 | (transverse) Notifications RT | Système | Sprint 4 |
| **F1.1** | Ouvre téléphone et scan | Spectator | Sprint 2 |
| **F1.2** | Rediriger vers la plateforme | Spectator | Sprint 2 |
| **F1.3** | Renseigner le formulaire | Spectator | Sprint 2 |
| **F1.4** | Soumettre le formulaire | Spectator | Sprint 2 |
| **F1.5** | Demande numéro pour suivi | Spectator | Sprint 2 |
| **F1.6** | Historique suivi | Spectator | Sprint 3 |
| **F2.1** | Ouvre App + Auth | Spectator | Sprint 1 |
| **F2.2** | Redirige vers la map | Spectator | Sprint 2 |
| **F2.3** | Acces postes secours + sites | Spectator | Sprint 4 |
| **F2.4** | Détails adresse | Spectator | Sprint 4 |
| **F2.5** | Alerter | Spectator | Sprint 2 |
| **F2.6** | Formulaire d'alerte | Spectator | Sprint 2 |
| **F2.7** | Suivi signalement | Spectator | Sprint 3 |
| **F2.8** | Historique signalement | Spectator | Sprint 3 |
| **F3.1** | Ouvre App + Auth (agent) | Agent | Sprint 1 |
| **F3.2** | on / off | Agent | Sprint 3 |
| **F3.3** | Redirige vers la map | Agent | Sprint 3 |
| **F3.4** | Affichage alerte + notifs | Agent | Sprint 3 |
| **F3.5** | Suivi incident attitré | Agent | Sprint 3 |
| **F3.6** | Gestion statut incident | Agent | Sprint 3 |
| **F4.1** | Ouvre App + Auth (coord) | Coordinateur | Sprint 1 |
| **F4.2** | Dashboard | Coordinateur | Sprint 2 |
| **F4.3** | CRUD agents/missions/tiers | Coordinateur | Sprint 3 |
| **F4.4** | Dispatcher mission | Coordinateur | Sprint 3 |
| F5.1 | (admin) CRUD Coordinateurs | Admin | Sprint 1 |
| F5.2 | (admin) CRUD QR codes | Admin | Sprint 1 |
| F5.3 | (admin) CRUD Zones | Admin | Sprint 1 |
| F5.4 | (admin) Audit Logs | Admin | Sprint 5 |

## 8.2 Couverture par sprint

```text
Sprint 1 — Auth tous rôles, comptes seedés, QR codes admin
Sprint 2 — Flow QR + Flow App alerter (cœur métier)
Sprint 3 — Agent terrain + Coordinateur dispatch
Sprint 4 — Postes de secours, sites, polish
Sprint 5 — Démo, audit, bugs
```

## 8.3 Critères de succès du MVP

Le MVP est validé si **tous les flows Figma sont démontrables** :

- [ ] **F1** : Un spectateur scanne un QR, soumet une alerte, donne son numéro, peut consulter son suivi.
- [ ] **F2** : Un spectateur ouvre l'app, voit la map, soumet une alerte, voit l'historique.
- [ ] **F3** : Un agent ouvre l'app, passe ON, reçoit une mission, gère son statut jusqu'à clôture.
- [ ] **F4** : Un coordinateur voit son dashboard, dispatche une mission à un agent disponible, voit l'évolution.

Les transversales :

- [ ] Anti-spam fonctionnel (test avec 2 alertes successives proches).
- [ ] Photo floutée à l'arrivée.
- [ ] Notification temps réel agent (au moins polling).
- [ ] CRUD agents tiers fonctionnel.

---

*Version 1.0 — Avril 2026 — Aligné précisément sur le board Figma SUNUBETT*
