# PROMPT CURSOR — BËT : SYSTÈME DE GESTION D'ÉVÉNEMENTS
## Spécification complète des Dashboards Admin & Coordinateur

---

## CONTEXTE DU PROJET

Tu vas implémenter les **deux dashboards de pilotage** du système **Bët**, une application de gestion d'événements et d'incidents en temps réel.

- **Dashboard Administrateur** : configuration globale, utilisateurs, QR Codes, Sites, supervision système.
- **Dashboard Coordinateur (PC Opérationnel)** : qualification des alertes, gestion des incidents, dispatch des missions, supervision terrain en temps réel.

Ces dashboards s'appuient sur le modèle de données v2.0 avec les entités suivantes :
`User`, `Alerte`, `Incident`, `Mission`, `Site`, `AgentPresence`, `PhoneTracking`, `AuditLog`, `TrackingEvent`, `MediaFile`.

---

## STACK TECHNIQUE ATTENDUE

- **Frontend** : React (TypeScript), Tailwind CSS
- **Temps réel** : WebSocket (canaux détaillés ci-dessous)
- **Cartographie** : Leaflet.js
- **Graphiques** : Recharts ou Chart.js
- **Auth / Permissions** : RBAC (rôles : `super_admin`, `admin`, `coordinator`, `agent`, `spectator`)
- **API REST** : endpoints documentés en Partie 3

---

---

# PARTIE 1 — DASHBOARD ADMINISTRATEUR

> L'Admin gère la configuration globale, les utilisateurs, les QR Codes, les Sites et la supervision de santé du système.

---

## 1.1 KPIs — Bandeau de tête

> Actualisés toutes les **30 secondes** via WebSocket ou polling.
> Source : `GET /api/v1/dashboard/admin/kpis`

| Indicateur | Description | Source |
|---|---|---|
| **N agents actifs** | Agents avec toggle `is_active = ON` | `users WHERE is_active = true AND role = 'agent'` |
| **N alertes aujourd'hui** | Toutes sources confondues | `alertes WHERE DATE(created_at) = TODAY` |
| **N incidents en cours** | Statuts `open` ou `qualified` | `incidents WHERE status IN ('open', 'qualified')` |
| **N missions actives** | Statuts `accepted`, `on_route`, `on_site` | `missions WHERE status IN (...)` |
| **N QR Codes actifs** | `is_active = true` | `qr_codes WHERE is_active = true` |
| **N sites référencés** | Police, hôpital, secours… | `sites WHERE is_active = true` |
| **N doublons détectés** | Alertes potentiellement dupliquées | `alertes WHERE is_potential_duplicate = true` |
| **N logs audit / 24h** | Logs des dernières 24h | `audit_logs WHERE created_at > NOW() - 24h` |

---

## 1.2 Module — Gestion des Utilisateurs

### Liste & Filtres
- Tableau paginé avec colonnes : `fullname`, `phone`, `role`, `team`, `zone`, `is_active`, `last_login_at`
- Filtres disponibles : `role` (agent / coordinator / spectator), `is_active`, `team_id`, `zone_id`

### Actions disponibles

| Action | Description |
|---|---|
| **Créer un utilisateur** | Formulaire : `fullname`, `phone` (E.164), `role`, `team_id`, `zone_id`. Admin peut créer `agent` & `coordinator`. `super_admin` peut tout créer. |
| **Activer / Désactiver** | Toggle `is_active`. Désactivation = révocation accès sans suppression. Action tracée dans `audit_logs`. |
| **Réinitialiser MDP** | Déclenche un SMS OTP à l'agent. Action tracée dans `audit_logs`. |
| **Historique logins** | Affiche `last_login_at` + nombre de connexions sur 30 jours via `audit_logs WHERE action = 'auth.login'`. |
| **Suppression logique** | `SET deleted_at = NOW()`. L'utilisateur disparaît des listes actives mais l'historique est conservé. |

---

## 1.3 Module — Gestion des QR Codes

### Liste
- Tableau : `location_label`, `zone`, `scan_count`, `last_scanned_at`, `is_active`, `expires_at`
- Tri par `scan_count DESC` pour identifier les zones critiques

### Actions disponibles

| Action | Description |
|---|---|
| **Créer un QR** | Formulaire : `location_label`, `latitude/longitude`, `zone_id`, `site_id` (optionnel), `description`, `expires_at`. Génère token JWT signé avec `QR_TOKEN_SECRET`. |
| **Carte des QR** | Vue cartographique Leaflet : marqueurs par position GPS. Couleur : vert = actif, rouge = expiré/inactif. |
| **Statistiques par QR** | Graphe scans/jour (30 jours) par QR. Source : `alertes WHERE source_qr_id = ? GROUP BY day`. |
| **Activer / Désactiver** | Toggle `is_active`. QR désactivé → plus de nouvelles alertes acceptées via ce token. |
| **Export PDF / CSV** | Export liste QR : référence, label, GPS, `scan_count` pour impression terrain. |

---

## 1.4 Module — Gestion des Sites (Agents tiers)

### Liste
- Tableau : `name`, `type` (badge coloré), `adresse`, `phone`, `is_24_7`, `is_active`
- Filtres : `type`, `is_active`

### Actions disponibles

| Action | Description |
|---|---|
| **Carte des sites** | Marqueurs typés (icône police, hôpital, pompiers…) sur carte interactive. Affiche zone de couverture configurable. |
| **Créer / Éditer un site** | Formulaire : `name`, `type` (enum `SiteType`), GPS, `address`, `phone`, `description`, `is_24_7`, `opening_hours` (JSONB). |
| **Statistiques missions** | Nombre de fois ce site a été attaché à une mission : `COUNT mission_service_infos WHERE site_id = ?`. |
| **Disponibilité temps réel** | Badge `is_24_7` + affichage `opening_hours` calculé (ouvert / fermé maintenant). |

---

## 1.5 Module — Supervision des Alertes

| Élément | Description | Source de données |
|---|---|---|
| **Volume par catégorie** | Graphe barres (7 jours glissants) : `health`, `security`, `crowd`, `fire_danger`… | `alertes GROUP BY category, date` |
| **Taux de doublons** | Ratio `is_potential_duplicate / total`. Objectif < 10 %. Alerte si > 20 %. | `alertes` |
| **Sources QR vs App** | Camembert : alertes avec `source_qr_id` vs `source_user_id`. Mesure adoption des deux canaux. | `alertes` |
| **Alertes rejetées** | Tableau `status IN ('false_alert', 'rejected')` avec `resolution_reason`. | `alertes` |
| **Temps de traitement** | Médiane (`created_at → validated_at`) par catégorie. KPI cible < 5 min. | `alertes` |
| **Heatmap géographique** | Densité alertes sur carte (lat/lng). Identifie zones chaudes pour déploiement QR additionnel. | `alertes` |

---

## 1.6 Module — Suivi Spectateurs (PhoneTracking)

| Élément | Description | Source de données |
|---|---|---|
| **Volume suivis actifs** | `phone_trackings WHERE verified = true AND expires_at > NOW()` | `phone_trackings` |
| **Taux de vérification** | Ratio `verified / total inserts` (mesure efficacité OTP SMS) | `phone_trackings` |
| **Alertes avec suivi** | Alertes ayant au moins 1 numéro attaché (JOIN `phone_trackings`). Mesure engagement spectateurs. | `alertes JOIN phone_trackings` |
| **Expirations à venir** | `phone_trackings.expires_at < NOW() + 7 jours` (pour archivage préventif) | `phone_trackings` |

---

## 1.7 Module — Audit & Sécurité

| Élément | Description | Source de données |
|---|---|---|
| **Journal audit** | Tableau `audit_logs` : `actor`, `action`, `target_type`, `target_id`, `created_at`. Filtres : actor, action, période. Seul le `super_admin` voit tous les logs. | `audit_logs` |
| **Actions sensibles** | Surlignage rouge : `user.deleted`, `user.role_changed`, `qr.disabled`, `alerte.rejected` | `audit_logs` |
| **Connexions suspectes** | Détection multi-login (> 3 connexions en < 1h depuis IPs différentes) | `audit_logs` |
| **Export audit** | Export CSV signé pour conformité / investigations. Accès `super_admin` uniquement. | `audit_logs` |
| **Tokens QR scannés** | Volume scans par QR par heure. Pic anormal = tentative d'abus. | `scan_count + last_scanned_at` |

---

## 1.8 Module — Graphiques & Tendances (Analytics)

| Élément | Description | Source de données |
|---|---|---|
| **Courbe alertes 30j** | Évolution journalière des alertes créées. Segmenté par source (QR / App). | `GET /api/v1/analytics/alertes?range=30d` |
| **Incidents résolus vs ouverts** | Graphe empilé par semaine : `open + in_progress` vs `resolved + closed`. | `incidents` |
| **Performance agents** | Missions complétées / assignées par agent (30 jours). Top 5 agents les plus actifs. | `missions` |
| **Délai mission** | Boxplot des durées `accepted_at → completed_at` par catégorie d'incident. | `missions` |
| **Charge par zone** | Heatmap incidents par `zone_id`. Permet rééquilibrage des équipes. | `incidents GROUP BY zone_id` |

---
---

# PARTIE 2 — DASHBOARD COORDINATEUR (PC OPÉRATIONNEL)

> Le Coordinateur pilote les opérations en temps réel : qualification des alertes, gestion des incidents, dispatch des missions et supervision des agents sur le terrain.

---

## 2.1 KPIs — Bandeau de tête (temps réel)

> Mis à jour en **temps réel via WebSocket** (canal `broadcast:coordinator.{zone_id}`). Priorité visuelle maximale.
> Source : `GET /api/v1/dashboard/coordinator/kpis`

| Indicateur | Description | Source |
|---|---|---|
| **N alertes non traitées** | `status = received` | `alertes WHERE status = 'received'` |
| **N incidents critiques** | `severity = critical` | `incidents WHERE severity = 'critical'` |
| **N missions sans réponse** | `status = assigned` depuis > 5 min | `missions WHERE status = 'assigned' AND age > 5min` |
| **N agents disponibles** | `effective_status = available` | `agent_effective_status` |
| **X min délai moyen traitement** | `received → validated` | `alertes` |
| **N doublons en attente** | `is_potential_duplicate = true` à valider | `alertes` |
| **N zones chaudes actives** | `is_hot_zone = true` | `incidents` |
| **N missions terminées / jour** | `status = completed` today | `missions WHERE DATE(completed_at) = TODAY` |

---

## 2.2 Module — File d'Alertes (Triage)

> Cœur du dashboard coordinateur. Vue **liste + carte côte à côte**. Flux temps réel.
> Source : `GET /api/v1/alertes?status=received&zone_id=X`

### Liste
- Tableau trié par `created_at DESC`
- Colonnes : `référence`, `catégorie` (badge), `description courte`, `source` (QR/App), `GPS`, `est doublon ?`, `âge`
- Filtres rapides : Toutes / `health` / `security` / `fire_danger` / avec doublon

### Volet détail alerte
- Tous les champs `Alerte`
- Aperçu photo (thumbnail floutée)
- Lecteur audio + `transcription_translated`
- Boutons d'action ci-dessous

### Actions disponibles

| Action | Résultat | TrackingEvent |
|---|---|---|
| **Valider → Incident** | Crée ou associe à un incident existant. `alerte.status → validated` | `alerte.validated` |
| **Marquer doublon** | `status → duplicate`. Affiche alerte parente (`duplicate_of_alerte_id`). | `alerte.marked_duplicate` |
| **Fausse alerte** | `status → false_alert`. Champ `resolution_reason` obligatoire. | `alerte.marked_false_alert` |
| **Rejeter** | `status → rejected`. Champ `resolution_reason` obligatoire. | — |

### Carte temps réel
- Marqueurs alertes `received` (rouge clignotant) sur carte
- Cluster par zone
- Clic → ouvre le volet détail

---

## 2.3 Module — Gestion des Incidents

> Source : `GET /api/v1/incidents?status=open,qualified&zone_id=X`

### Liste incidents actifs
- Tableau : `référence`, `title`, `severity` (badge couleur), `priority`, `status`, `alertes_count`, `missions actives`, `zone`, `âge`
- Filtres : `severity` (critical/high/medium/low), `status`, `category`, `zone_id`
- Tri : par `priority` puis `created_at`

### Actions disponibles

| Action | Description | TrackingEvent |
|---|---|---|
| **Créer manuellement** | Formulaire : `title`, `description`, `category`, `sub_category`, `severity`, `priority`, GPS (auto depuis alerte), `zone_id` | — |
| **Qualifier** | `status → qualified`. Champs `severity` et `priority` requis. | `incident.qualified` |
| **Changer severity/priority** | Dropdown inline | `incident.severity_changed` / `incident.priority_changed` |
| **Toggle zone chaude** | Checkbox `is_hot_zone`. Déclenche alerte visuelle sur carte. | TrackingEvent dédié |
| **Timeline incident** | Liste chronologique de tous les `tracking_events` liés à l'incident (alertes/missions associées) | — |
| **Résoudre / Clore** | Boutons séparés → `resolved` / `closed`. Champ `completion_note`. | — |

---

## 2.4 Module — Dispatch & Suivi des Missions

### Créer une mission
- Depuis un incident qualifié : `title`, `briefing`, `assigned_to_user_id` (picker agent), `estimated_duration_minutes`
- GPS pré-rempli depuis incident

### Sélection d'agent
- Liste agents avec `effective_status = available` (vue `agent_effective_status`)
- Affiche : nom, position, **distance de l'incident**, `battery_level`

### Suivi live
- Carte : tracé position agent (`AgentPresence.lat/lng`, heartbeat 30s)
- Statut mission (badge animé `on_route` / `on_site`)

### Actions disponibles

| Action | Description | TrackingEvent |
|---|---|---|
| **Annuler / Réassigner** | Volet mission + timeline (`tracking_events WHERE target_id = mission.id`) | — |
| **Sites attachés (MissionServiceInfo)** | Picker site par type et proximité. Ordre de priorité réglable. | — |
| **Alerter agent** | Notification push à l'agent via WebSocket (`canal agent.{id}`) | — |
| **Réassigner (refus)** | En cas de `status = refused` : picker nouvel agent | `mission.reassigned` |
| **Demande de renfort** | Crée nouvelle mission sur même incident | `mission.reinforcement_requested` |

---

## 2.5 Module — Carte Opérationnelle (vue temps réel)

### Couches activables (toggle)
- Alertes reçues
- Incidents actifs
- Agents disponibles
- Agents en mission
- Sites
- Zones chaudes
- QR Codes

### Détail des couches

| Couche | Rendu |
|---|---|
| **Alertes** | Rouge (received), orange (validated), gris (clos). Taille ∝ severity. |
| **Agents** | Icône avec statut : vert (available), orange (on_route), rouge (on_site), gris (offline). Rafraîchi toutes les 30s. |
| **Incidents / Zones chaudes** | Cercle semi-transparent autour GPS. Rouge si `is_hot_zone = true`. |
| **Sites** | Icônes typées (hôpital, pompiers, police). Clic → détail site + missions attachées. |
| **Cluster & zoom** | Clustering automatique < zoom 13. Dé-cluster au zoom. |
| **Sélection rapide** | Clic sur alerte/incident → popup mini-fiche + CTA (Valider / Dispatcher / Voir détail). |

---

## 2.6 Module — Supervision des Agents

| Élément | Description | Source de données |
|---|---|---|
| **Liste agents de service** | Tableau : nom, `effective_status` (badge), mission en cours (référence + titre), `battery_level` (barre), `last_heartbeat_at`, zone | `agent_effective_status` |
| **Alertes heartbeat** | Agent sans heartbeat > 5 min → badge rouge « Hors ligne inattendu ». Notification coordinator. | `AgentPresence.last_heartbeat_at` |
| **Batterie faible** | Agent avec `battery_level < 20 %` → indicateur orange | `AgentPresence.battery_level` |
| **Historique agent** | Missions accomplies du jour. Durée moyenne sur site. Issues outcome (resolved / transferred / escalated). | `missions` |
| **Disponibilité équipe** | Compte agents disponibles / total par team. Aide rééquilibrage. | `agent_effective_status` |

---

## 2.7 Module — Notifications & Alertes Système

### Centre de notifications
- Fil temps réel : nouvelles alertes, changements de statut incidents/missions, refus d'agent, heartbeat perdu
- Décompte non lus

### Types de notifications

| Priorité | Déclencheur |
|---|---|
| 🔴 **Critique** | Alerte `health` ou `fire_danger` reçue |
| 🟠 **Important** | Mission refusée, agent offline inattendu |
| 🔵 **Info** | Mission completed, incident resolved |

### Actions
- Bouton **Voir** → navigation directe vers l'entité concernée (alerte, incident, mission, agent)
- Le coordinateur peut activer/désactiver certains types de notifications

---

## 2.8 Module — Historique & Reporting

| Élément | Description | Source de données |
|---|---|---|
| **Incidents clôturés** | Tableau `status IN ('resolved', 'closed', 'cancelled')` du jour : durée totale, missions, agents impliqués, outcome | `incidents` |
| **Rapport de service** | Synthèse du shift : N alertes reçues/validées/fausses, N incidents ouverts/résolus, N missions, délai médian. Export PDF. | Aggrégats |
| **Timeline globale** | Vue chronologique de tous les `tracking_events` de la journée. Filtre par `target_type` (alerte / incident / mission). | `tracking_events` |
| **Bilan par catégorie** | Graphe barres : incidents par `category`. Identification des types d'événements dominants. | `incidents GROUP BY category` |

---
---

# PARTIE 3 — CONSIDÉRATIONS TECHNIQUES & TEMPS RÉEL

---

## 3.1 WebSocket — Canaux recommandés

| Canal WebSocket | Données transportées / Usage |
|---|---|
| `broadcast:alertes.new` | Nouvelle alerte créée → mise à jour KPI + ajout ligne file d'alertes coordinateur |
| `broadcast:incident.{id}` | Changement de statut incident → mise à jour volet incident ouvert |
| `broadcast:mission.{id}` | Changement statut mission + position agent → carte live |
| `broadcast:agent.{id}` | Heartbeat position + battery → carte agents + liste supervision |
| `broadcast:coordinator.{zone_id}` | Événements filtrés par zone du coordinateur (volume réduit) |

---

## 3.2 Permissions RBAC

| Rôle | Accès dashboard |
|---|---|
| **admin** | Accès complet dashboard Admin. Peut voir son propre dashboard coordinateur si nécessaire. Ne voit PAS les alertes brutes en temps réel (flow coordinateur). |
| **super_admin** | Accès tout (admin + audit complet). Peut impersonner n'importe quelle vue. |
| **coordinator** | Dashboard coordinateur uniquement. Ne peut pas créer de QR, ni modifier des sites. Ne voit que les incidents/alertes de sa `zone_id`. |
| **agent** | Pas d'accès dashboards. Interface mobile dédiée. |
| **spectator** | Pas d'accès dashboards. Flow App uniquement. |

---

## 3.3 Endpoints API clés

| Endpoint | Usage |
|---|---|
| `GET /api/v1/dashboard/admin/kpis` | Tous les KPIs admin en un seul appel |
| `GET /api/v1/dashboard/coordinator/kpis` | KPIs coordinateur temps réel |
| `GET /api/v1/alertes?status=received&zone_id=X` | File d'alertes coordinateur avec filtres |
| `GET /api/v1/incidents?status=open,qualified&zone_id=X` | Incidents actifs avec tri priority |
| `GET /api/v1/agents/map?zone_id=X` | Positions + `effective_status` de tous les agents de la zone |
| `GET /api/v1/sites?proximity_lat=X&proximity_lng=Y&radius=5000` | Sites proches d'une position GPS |
| `GET /api/v1/audit-logs?actor_id=X&action=Y&from=Z` | Journal audit filtré |
| `GET /api/v1/analytics/alertes?range=30d` | Données graphiques alertes (admin analytics) |

---

## 3.4 Modèle de données — Entités principales

```
User          → id, fullname, phone, role, team_id, zone_id, is_active, last_login_at, deleted_at
Alerte        → id, status, category, source_qr_id, source_user_id, lat, lng, is_potential_duplicate,
                duplicate_of_alerte_id, resolution_reason, created_at, validated_at
Incident      → id, title, description, category, sub_category, severity, priority, status,
                is_hot_zone, zone_id, lat, lng, completion_note, created_at
Mission       → id, incident_id, title, briefing, assigned_to_user_id, status, estimated_duration_minutes,
                accepted_at, completed_at
Site          → id, name, type (SiteType), address, phone, lat, lng, is_24_7, opening_hours (JSONB), is_active
AgentPresence → id, user_id, lat, lng, battery_level, last_heartbeat_at
PhoneTracking → id, alerte_id, phone, verified, expires_at
AuditLog      → id, actor_id, action, target_type, target_id, created_at
TrackingEvent → id, target_type, target_id, event_type, created_at
MediaFile     → id, alerte_id, url, type (photo/audio), created_at
MissionServiceInfo → id, mission_id, site_id, priority_order
```

---

*Bët — Spécification Dashboards v2.0 — Aligné sur modèle de données v2.0 (SUNUBETT Figma Board)*
