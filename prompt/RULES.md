# Bët — Rules

## Règles d'ingénierie et de qualité (MVP)

**Version** : 1.0  
**Date** : Avril 2026  
**Statut** : Référence d'équipe (document-only, sans enforcement outillé obligatoire)

---

## 1. Objectif

Ce document définit les règles transverses de qualité pour implémenter Bët de façon:

- lisible;
- modulaire;
- cohérente avec `CONTEXT.md`, `FEATURES.md`, `TYPES.md`;
- alignée au design de référence;
- pragmatique pour un contexte hackathon.

---

## 2. Principes directeurs

1. **Lisibilité first**  
   Si un choix technique rend le code plus difficile à comprendre sans gain net, il est rejeté.

2. **Simplicité avant abstraction**  
   On n'introduit une abstraction qu'après duplication réelle ou besoin métier démontré.

3. **Conformité produit stricte**  
   Toute implémentation doit respecter les flows `F1` à `F4` sans invention hors périmètre MVP.

4. **Source de vérité contractuelle**  
   Le contrat API et les états métier viennent de `TYPES.md`.

5. **Modularité orientée domaine**  
   Le découpage doit suivre les domaines (`Alerte`, `Incident`, `Mission`, `Site`, `Auth`), pas des fichiers "fourre-tout".

---

## 3. Invariants métier non négociables

- Cascade stricte: `Alerte -> Incident -> Mission`.
- Une mission assigne un seul agent. Renfort = nouvelle mission.
- Flow QR: on authentifie le QR, pas l'utilisateur.
- Anti-spam: détection par proximité spatio-temporelle, non bloquante.
- Photos: floutage asynchrone avant exposition.
- Médias: URLs signées temporaires uniquement.
- Téléphone flow QR: stockage hashé, jamais exposé en clair dans les réponses.
- Présence agent: toggle `available/offline`; statut opérationnel dérivé de la mission active.

---

## 4. Règles de lisibilité du code

### 4.1 Nommage

- Noms explicites et métier (`validateAlerte`, `assignMissionToAgent`), éviter les noms vagues (`process`, `handleData`).
- Noms d'objets, champs et variables alignés avec le vocabulaire des prompts.

### 4.2 Fonctions et complexité

- Fonctions courtes, responsabilité unique.
- Préférer `early return` à l'imbrication profonde.
- Remplacer les "magic numbers" par des constantes nommées.

### 4.3 Commentaires

- Commenter le **pourquoi**, pas le **quoi** évident.
- Éviter les commentaires redondants avec le code.

---

## 5. Règles de découpage et taille des fichiers (soft limits)

Ces limites servent de signal de refactor, pas de blocage automatique.

- **Composants UI**: cible <= 250 lignes, alerte au-delà de 350.
- **Pages / écrans**: cible <= 400 lignes.
- **Services / actions métier**: préférer petits modules orientés cas d'usage.
- **Classes backend**: éviter les classes monolithiques > 300 lignes.
- **Migrations SQL**: une intention métier claire par migration.

Quand une limite est dépassée, découper par responsabilité (feature, section UI, use case).

---

## 6. Règles d'architecture modulaire

### 6.1 Backend Laravel

Séparation recommandée:

`Controller -> FormRequest -> Service/Action -> Repository/Query -> Resource -> Policy`

Règles:

- Pas de logique métier lourde dans les contrôleurs.
- Validation centralisée via FormRequest.
- Autorisation centralisée via Policies/Gates.
- Réponses API via Resources cohérentes avec le contrat.
- Jobs asynchrones pour traitements lourds (blur, pipelines média, transcription future).

### 6.2 Frontend Next.js

Découpage recommandé par feature:

- `ui/` pour composants de présentation;
- `hooks/` pour logique d'interface;
- `services/api/` pour appels HTTP;
- `types/` pour types du domaine;
- route App Router comme point d'entrée.

Règles:

- Pas de logique métier lourde directement dans un composant présentational.
- Pas de duplication de composants proches: factoriser en composants réutilisables.

---

## 7. Qualité API, état métier et sécurité

- Surface API en **snake_case**.
- Prefix route: `/api/v1`.
- Format de réponse cohérent (`data`, `meta`, `links`).
- Format d'erreur homogène (code, message, détails utiles).
- Respect strict des state machines (`Alerte`, `Incident`, `Mission`).
- Vérifications d'autorisation systématiques (RBAC).
- Séparer clairement les trois familles de tokens (Access/Refresh, QR, Tracking).

---

## 8. Qualité DDL / SQL modulaire

- Convention `snake_case` partout.
- Colonnes contraintes explicitement (`NOT NULL`, `CHECK`, `FK`) selon besoins.
- Index justifiés par les accès réels (listes live, filtres, proximité).
- Migrations réversibles et cohérentes.
- Éviter les changements de schéma breaking non planifiés.
- Toute évolution DDL doit garder la cohérence avec `TYPES.md`.

---

## 9. Garde-fous UI/UX (document-only)

- Respect strict des guidelines de `DESIGN.md`.
- Réutilisabilité prioritaire des composants UI.
- États visuels systématiques: `default`, `loading`, `error`, `disabled`, `active` si pertinent.
- Accessibilité minimale obligatoire:
  - focus visibles;
  - textes lisibles;
  - cibles tactiles adaptées mobile;
  - contrastes suffisants.
- Responsive par rôle:
  - spectator/agent: mobile-first;
  - coordinateur: desktop/tablette d'abord.

---

## 10. Definition of Done (DoD) transversal

Une tâche est considérée terminée si:

1. Conformité au prompt fonctionnel (`FEATURES.md`) et au contrat (`TYPES.md`) validée.
2. Règles métier critiques respectées (anti-spam, statuts, sécurité token, etc.).
3. Gestion des cas d'erreur prévue (validation, permissions, conflits métier).
4. Aucun ajout hors MVP non validé.
5. Code lisible et découpé selon les règles ci-dessus.
6. Impact UI cohérent avec les guidelines design.
7. Non-régression sur les flows touchés (`F1` à `F4`), au moins en vérification manuelle.

---

## 11. Priorisation des règles: MVP vs post-MVP

### 11.1 Obligatoire MVP

- Invariants métier.
- Contrat API et state machines.
- Lisibilité, découpage raisonnable, sécurité de base.
- Alignement design strict sur les écrans critiques.

### 11.2 Renforcement post-MVP

- Seuils plus stricts de complexité et taille.
- Couverture tests plus large et systématique.
- Outillage d'enforcement automatique (lint, static analysis, quality gate CI) si décidé plus tard.

---

## 12. Matrice de cohérence inter-docs (anti-dérive)

| Sujet | Document maître | Document de contrôle |
|---|---|---|
| Vision produit, périmètre, hors scope | `CONTEXT.md` | `RULES.md` |
| Features et DoD fonctionnels | `FEATURES.md` | `RULES.md` |
| Types, API, RBAC, states, SQL de référence | `TYPES.md` | `STACK.md` |
| Règles qualité et gouvernance implémentation | `RULES.md` | `STACK.md`, `DESIGN.md` |
| Guidelines UI/UX et composants | `DESIGN.md` | `RULES.md` |

En cas de conflit, l'ordre de priorité est:
`TYPES.md` (contrat technique) -> `FEATURES.md` (fonctionnel) -> `CONTEXT.md` (cadre produit) -> `RULES.md` -> `STACK.md` -> `DESIGN.md`.

---

*Version 1.0 — Avril 2026 — Référentiel qualité MVP Bët*
