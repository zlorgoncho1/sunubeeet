# Bët — Stack

## Référence technique et conventions d'implémentation

**Version** : 1.0  
**Date** : Avril 2026  
**Statut** : Référence d'équipe (MVP)

---

## 1. Objectif

Ce document fixe:

- la stack canonique du MVP;
- les conventions d'architecture backend/frontend;
- les frontières entre couches;
- les règles de données et sécurité minimales;
- le runbook de développement attendu dès le scaffold.

Ce document complète `TYPES.md` (contrat technique) et `RULES.md` (gouvernance qualité).

---

## 2. Stack canonique (MVP)

### 2.1 Backend

- **Laravel 11** (API REST + auth + jobs + policies)
- **Laravel Reverb** (WebSocket)
- **Redis** (queues, cache opérationnel)

### 2.2 Frontend

- **Next.js 14** (App Router)
- Web app **mobile-first** pour spectator/agent
- Web app dashboard **desktop/tablette** pour coordinateur

### 2.3 Données et stockage

- **PostgreSQL 16**
- **MinIO/S3** pour médias avec URLs signées

### 2.4 Infra locale

- **Docker Compose** pour environnement reproductible local

---

## 3. Organisation des répertoires (frontières)

- `backend/`: API, logique métier, auth, jobs, events, RBAC
- `frontend/`: interfaces utilisateur Next.js
- `infra/`: orchestration locale et scripts infra
- `bi/`: analytics/reporting (hors noyau MVP opérationnel)
- `ml/`: futures capacités ML (hors MVP)

Règle: ne pas mélanger responsabilités entre dossiers.

---

## 4. Conventions backend Laravel

### 4.1 Architecture par domaine

Découper par domaines métier:

- `Alertes`
- `Incidents`
- `Missions`
- `Sites`
- `Auth`
- `Dashboard`
- `Files/Media`

### 4.2 Flux de traitement recommandé

`Route -> Controller -> FormRequest -> Service/Action -> Query/Repository -> Resource`

### 4.3 Règles d'implémentation

- Contrôleurs fins (orchestration uniquement).
- Validation d'entrée via FormRequest.
- Autorisation via Policy/Gate selon RBAC.
- Réponses via API Resource alignées sur `TYPES.md`.
- Jobs pour tâches asynchrones:
  - blur photo;
  - pipeline média;
  - transcription/traduction future.
- Événements de domaine tracés via `tracking_events`.

### 4.4 Contrat API

- Prefix: `/api/v1`
- Surface JSON: `snake_case`
- Format réponse: `data`, `meta`, `links`
- Erreurs cohérentes (code/message/details)

---

## 5. Conventions frontend Next.js (App Router)

### 5.1 Découpage recommandé par feature

Pour chaque feature/route:

- `ui/` : composants de présentation réutilisables
- `hooks/` : logique d'interface
- `services/api/` : clients HTTP
- `types/` : types de vue alignés domaine

### 5.2 Server vs Client Components

- Préférer Server Components pour rendu statique/data initiale quand possible.
- Utiliser Client Components pour interactions riches (map, formulaires multi-étapes, live status).

### 5.3 Data fetching et cache

- Appels API exclusivement vers le contrat `/api/v1`.
- Gestion explicite des états `loading/error/empty/success`.
- Revalidation cohérente avec besoins temps réel.
- Fallback polling 5s quand canal temps réel indisponible.

### 5.4 Règles UI

- Ne pas embarquer de logique métier lourde dans un composant purement visuel.
- Prioriser composants réutilisables sur duplication locale.

---

## 6. Contrats inter-couches

### 6.1 Alignement type/DTO

- Les DTO backend et types frontend doivent refléter `TYPES.md`.
- Aucun renommage implicite non documenté entre API et UI.

### 6.2 Versionnement et compatibilité

- Toute évolution contractuelle passe par versioning explicite.
- Les changements breaking sont interdits sans migration de contrat planifiée.

### 6.3 Temps réel

Canaux et événements alignés sur `TYPES.md`:

- coordinator zone channels;
- agent channels;
- tracking spectator channels.

Fallback obligatoire: polling 5 secondes.

---

## 7. Base de données et DDL modulaire

### 7.1 Principes

- Schéma en `snake_case`.
- Contraintes explicites (`NOT NULL`, `CHECK`, `FK`).
- Index guidés par usages réels (listes live, géolocalisation, filtres).
- Rollback propre sur migration.

### 7.2 Évolutions de schéma

- Une migration = une intention métier.
- Pas de modification destructive non planifiée.
- Vérifier cohérence avec:
  - enums/statuts;
  - relations métier;
  - exigences anti-spam et tracking.

### 7.3 Seeds

Prévoir des données de démonstration minimales:

- users par rôle;
- zones et QR codes;
- sites de secours;
- incidents/missions de simulation.

---

## 8. Sécurité et opérations minimales

- Secrets en variables d'environnement, jamais en dur.
- Distinction stricte entre:
  - JWT access/refresh;
  - QR token;
  - tracking token.
- Numéros téléphone hashés pour suivi QR.
- Médias non publics, accès par URLs signées.
- Journaliser actions sensibles dans audit/tracking.

---

## 9. Runbook développement (à documenter dès scaffold)

Chaque service doit documenter ses commandes canoniques:

1. Installer dépendances.
2. Lancer environnement local.
3. Exécuter migrations + seed.
4. Lancer backend/frontend.
5. Exécuter tests essentiels.

Tant qu'aucun scaffold n'existe, conserver ce runbook comme contrat à implémenter.

---

## 10. Matrice d'alignement technique

| Sujet | Référence primaire | Référence secondaire |
|---|---|---|
| Modèle de données, états, API | `TYPES.md` | `STACK.md` |
| Règles qualité transverses | `RULES.md` | `STACK.md` |
| Flux fonctionnels | `FEATURES.md` | `STACK.md` |
| UX/UI | `DESIGN.md` | `STACK.md` |

---

## 11. Critères d'acceptation du cadre stack

- L'équipe peut démarrer un scaffold sans décision bloquante supplémentaire.
- Les frontières backend/frontend sont claires.
- Les conventions Laravel/Next.js sont actionnables.
- Les règles DDL et sécurité couvrent le MVP.
- Le document reste cohérent avec `CONTEXT.md`, `FEATURES.md`, `TYPES.md`, `RULES.md`.

---

*Version 1.0 — Avril 2026 — Référence technique MVP Bët*
