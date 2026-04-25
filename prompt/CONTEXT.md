# Bët — Context

## Document de cadrage produit

**Version** : 1.0
**Date** : Avril 2026
**Source** : Board Figma SUNUBETT (use case « Alerter »)
**Statut** : Référence produit

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Contexte d'usage](#2-contexte-dusage)
3. [Problème adressé](#3-problème-adressé)
4. [Use case central : Alerter](#4-use-case-central--alerter)
5. [Acteurs du système](#5-acteurs-du-système)
6. [Les quatre flux principaux](#6-les-quatre-flux-principaux)
7. [Principes structurants](#7-principes-structurants)
8. [Périmètre du MVP](#8-périmètre-du-mvp)
9. [Hors périmètre](#9-hors-périmètre)
10. [Glossaire](#10-glossaire)

---

# 1. Vue d'ensemble

**Bët est une plateforme de signalement et de coordination d'incidents pour les grands événements**, avec comme premier cas d'usage les Jeux Olympiques de la Jeunesse Dakar 2026.

Le système connecte trois populations qui, dans un événement de masse, communiquent aujourd'hui par des canaux dispersés (radio, WhatsApp, bouche-à-oreille) :

- les **spectateurs** qui constatent un problème ;
- les **agents de terrain** qui interviennent ;
- les **coordinateurs** qui dispatchent les missions.

Le board Figma SUNUBETT formalise ces interactions autour d'un use case unique : **Alerter**.

---

# 2. Contexte d'usage

## 2.1 Cadre événementiel

Les JOJ Dakar 2026 réunissent sur plusieurs sites (Dakar, Diamniadio, Saly) :

- des dizaines de milliers de spectateurs ;
- des athlètes, délégations, médias internationaux ;
- des forces de sécurité, de santé, de logistique ;
- des équipes de volontaires.

Dans ce contexte, **un signalement mal remonté ou mal localisé peut transformer un incident mineur en crise**.

## 2.2 Deux modes d'accès

Le board Figma distingue clairement **deux portes d'entrée** pour le spectateur :

| Mode | Public cible | Caractéristique |
|---|---|---|
| **QR code urgence** | Tout spectateur, sans inscription | QR collé sur murs/poteaux. Scan → plateforme web. Pas de compte. Suivi par numéro de téléphone. |
| **Application** | Spectateur engagé (volontaire, organisateur, fan régulier) | Authentification. Carte interactive. Historique. Accès aux postes de secours. |

Cette dualité est un choix produit : la friction zéro pour l'urgence, l'expérience riche pour les usagers réguliers.

## 2.3 Spécificités africaines

Bët est pensé pour le contexte sénégalais et africain :

- support **vocal** (la voix avant l'écrit, surtout en wolof) ;
- **traduction automatique** prévue pour les vocaux ;
- **photo floutée** pour respecter les personnes ;
- **anti-spam basé sur localisation** (proximité = même incident) ;
- **suivi par numéro de téléphone** (canal dominant en Afrique).

---

# 3. Problème adressé

## 3.1 Formulation

**Pendant un grand événement, les incidents sont mal remontés, mal localisés, difficilement priorisés et insuffisamment suivis, ce qui ralentit l'intervention et augmente le risque de crise.**

## 3.2 Manifestations concrètes

- Le PC de coordination reçoit le même incident par plusieurs canaux.
- La localisation verbale ("entrée Nord") est ambiguë.
- Les agents de terrain sont sollicités sans contexte clair.
- Personne ne sait formellement où est qui, et qui fait quoi.
- Un spectateur qui signale ne sait pas si son alerte a été reçue.

## 3.3 Coûts

- **Coût humain** : retard de prise en charge des malaises, blessures.
- **Coût opérationnel** : coordination à l'intuition, redondance, dispersion.
- **Coût d'image** : rumeurs amplifiées sur les réseaux sociaux faute d'information officielle.

---

# 4. Use case central : Alerter

Le board Figma place **« Alerter »** au cœur du système. Tout converge vers cette action :

- le spectateur **alerte** (via QR ou via app) ;
- l'agent **reçoit une alerte** (via map + notifications) ;
- le coordinateur **dispatche** (suite à une alerte).

## 4.1 Cycle complet

```text
┌──────────────┐           ┌─────────────┐           ┌──────────────┐
│  Spectateur  │── alerte ►│ Coordinateur│── mission►│    Agent     │
└──────────────┘           └─────────────┘           └──────────────┘
       ▲                                                      │
       │                                                      │
       └────────── retour de statut (suivi) ──────────────────┘
```

## 4.2 Promesse

Bët transforme un signalement dispersé en **intervention coordonnée et tracée**.

---

# 5. Acteurs du système

Le board Figma identifie clairement quatre rôles fonctionnels.

## 5.1 Spectateur

Personne du public. Deux modes d'interaction :

- **mode QR** : anonyme, web, suivi par téléphone ;
- **mode app** : authentifié, accès complet (map, historique, postes de secours).

Le board précise : *« On authentifie pas le user, mais le QR »* — pour le mode QR, c'est le code physique qui sert d'authentification de la source.

## 5.2 Agent de terrain

Personnel d'intervention (sécurité, santé, logistique, secours, volontaires). Authentifié via app. Caractéristiques :

- statut de disponibilité (toggle **on/off**) ;
- carte des alertes ;
- mission attitrée à suivre ;
- gestion du statut de l'incident sur le terrain.

## 5.3 Coordinateur

Personnel de PC opérationnel. Authentifié via app/dashboard. Responsabilités :

- vue dashboard ;
- CRUD agents de terrain ;
- CRUD missions ;
- CRUD **agents tiers** (services externes : police, hôpitaux, pompiers — appelés "Sites" dans la suite) ;
- **dispatcher** les missions.

## 5.4 Admin / Super Admin

Non visibles dans le board (qui se concentre sur les flux opérationnels), mais nécessaires techniquement pour :

- créer les coordinateurs ;
- gérer les zones, QR codes en masse ;
- configurer le système.

Présents dans le système, mais hors du périmètre fonctionnel principal du board.

---

# 6. Les quatre flux principaux

## 6.1 Flow 1 — QR Code Urgence (Spectateur)

Aucune authentification utilisateur. Le QR est l'élément authentifié.

```text
[Spectateur]
     │
     ▼
Ouvre téléphone et scan
     │
     ▼
Rediriger vers la plateforme
     │
     ▼
Renseigner le formulaire
  (catégorie, sous-catégorie,
   description optionnelle,
   vocal optionnel + traduction,
   photo floutée)
     │
     ▼
Soumettre le formulaire
  (anti-spam : pas plusieurs
   alertes en 2 min même localisation)
     │
     ▼
Demande numéro pour suivi
     │
     ▼
Historique suivi
```

**Caractéristiques** :
- pas de compte, pas de mot de passe ;
- accès web direct depuis le scan ;
- numéro de téléphone uniquement pour permettre la consultation de suivi ultérieure ;
- traçabilité complète de l'alerte par le coordinateur.

## 6.2 Flow 2 — Application (Spectateur)

```text
[Spectateur]
     │
     ▼
Ouvre App + Auth
     │
     ├──► Historique Signalement
     │
     ▼
Redirige vers la map
     │
     ├──► Acces adresse postes de secours
     │    + Sites événements
     │         │
     │         ▼
     │    Détails Adresse
     │
     ▼
Alerter
     │
     ▼
Formulaire d'alerte
     │
     ▼
Suivi Signalement
```

**Caractéristiques** :
- expérience plus riche : carte interactive, historique consultable, accès aux postes de secours ;
- destinée aux spectateurs réguliers, volontaires, ou personnes engagées ;
- même formulaire d'alerte que le flow QR (cohérence produit).

## 6.3 Flow 3 — Agent de terrain

```text
[Agent de terrain]
     │
     ▼
Ouvre App + Auth
     │
     ├──► on / off (disponibilité)
     │
     ▼
Redirige vers la map
     │
     ▼
Affichage alerte map + notifications
     │
     ▼
Suivi incident attitré
     │
     ▼
Gestion statut incident
```

**Caractéristiques** :
- toggle de disponibilité avant tout ;
- réception de notifications quand une mission est dispatchée ;
- focus sur l'incident attitré (pas la vue globale) ;
- gestion du statut (en route, sur place, terminé) directement depuis le terrain.

## 6.4 Flow 4 — Coordinateur

```text
[Coordinateur]
     │
     ▼
Ouvre App + Auth
     │
     ▼
Dashboard
     │
     ├──► CRUD Agent de terrain
     │    + Mission
     │    + Agent tiers
     │
     ▼
Dispatcher mission
```

**Caractéristiques** :
- vue dashboard centralisée ;
- gestion des ressources (agents internes, agents tiers comme police/hôpitaux/pompiers) ;
- mission est l'unité de coordination dispatché à un agent.

---

# 7. Principes structurants

Tirés du board et des notes (sticky) Figma.

## 7.1 « On authentifie pas le user, mais le QR »

Le QR collé sur un mur **est lui-même authentifié** (token signé). L'utilisateur qui le scanne reste anonyme. Cela fluidifie l'expérience et préserve la traçabilité côté backend.

## 7.2 Le formulaire d'alerte est universel

Que l'on vienne du flow QR ou du flow App, le **formulaire d'alerte est le même** :

- catégorie d'incident
- sous-catégorie
- description (optionnel)
- vocal (optionnel, avec traduction automatique prévue)
- photo (avec floutage des humains)

Cohérence produit, cohérence de saisie, cohérence backend.

## 7.3 Anti-spam par proximité spatio-temporelle

> *« Penser au spamming, les boug qui renvoit plusieurs fois (2 minutes) à la même localisation »*

L'anti-spam ne repose pas sur un compte utilisateur (qui n'existe pas en flow QR). Il repose sur :

- **distance géographique** : seuil configurable ;
- **fenêtre temporelle** : 2 minutes par défaut ;
- **catégorie identique** : un même incident est probable.

## 7.4 Suivi par numéro de téléphone (flow QR)

Pour le flow anonyme via QR, le **numéro de téléphone** est l'identifiant de suivi. Le spectateur peut revenir consulter le statut de son alerte sans avoir créé de compte.

## 7.5 Mission solo, dispatch coordinateur

Une mission = un agent. Le coordinateur dispatche. Si renfort nécessaire, créer une nouvelle mission sur le même incident.

## 7.6 Map au cœur de l'expérience

Pour les trois rôles authentifiés (spectateur app, agent, coordinateur), **la carte est l'interface principale** après l'authentification. Voir, c'est comprendre.

## 7.7 Flou automatique des humains sur photo

Toute photo soumise est floutée côté backend (job asynchrone) avant d'être servie. Respect des personnes, respect du cadre légal sénégalais (CDP).

## 7.8 Vocal avec traduction automatique (futur proche)

Le vocal est un canal naturel en Afrique. La traduction automatique (wolof → français en priorité) est prévue. Pour le MVP, on stocke le vocal brut, transcription en phase 2.

---

# 8. Périmètre du MVP

## 8.1 Couverture par flow

| Flow | MVP |
|---|---|
| Flow 1 — QR Code Urgence | ✅ Complet |
| Flow 2 — Application Spectateur | ✅ Complet |
| Flow 3 — Agent de terrain | ✅ Complet |
| Flow 4 — Coordinateur | ✅ Complet |

## 8.2 Fonctionnalités MVP (avec mappage Figma)

| Étape Figma | MVP |
|---|---|
| Scan QR → plateforme web | ✅ |
| Formulaire d'alerte (cat, sous-cat, desc, photo) | ✅ |
| Vocal avec traduction | ⚠️ vocal stocké, traduction en phase 2 |
| Photo floutée | ✅ |
| Anti-spam localisation 2 min | ✅ |
| Numéro pour suivi | ✅ |
| Historique suivi (par téléphone) | ✅ |
| Auth App spectateur | ✅ |
| Map spectateur | ✅ |
| Postes de secours + sites événements | ✅ |
| Détails adresse site | ✅ |
| Historique signalement (utilisateur connecté) | ✅ |
| Auth agent | ✅ |
| Toggle on/off agent | ✅ |
| Map agent + alertes notifications | ✅ |
| Suivi incident attitré | ✅ |
| Gestion statut incident terrain | ✅ |
| Auth coordinateur | ✅ |
| Dashboard coordinateur | ✅ |
| CRUD agents de terrain | ✅ |
| CRUD missions | ✅ |
| CRUD agents tiers (sites) | ✅ |
| Dispatcher mission | ✅ |

---

# 9. Hors périmètre

Tout ce qui n'apparaît pas dans le board Figma est hors périmètre du MVP.

| Item | Statut | Raison |
|---|---|---|
| Application mobile native | Hors MVP | Web mobile-first suffit |
| Notifications push natives | Hors MVP | Notifications in-app + WebSocket |
| Mode offline complet | Hors MVP | Stockage localStorage minimal |
| Intégration SMS bidirectionnelle | Hors MVP | OTP suffit pour MVP |
| Multilingue complet (UI) | Hors MVP | Français seul, traduction vocal en phase 2 |
| Prédiction zones chaudes ML | Hors MVP | Détection règle simple |
| Application desktop native | Hors MVP | Dashboard web suffit |
| Integration vidéosurveillance | Hors MVP | Hors périmètre Bët |
| Communication inter-agents | Hors MVP | Passage par coordinateur |
| Système de chat / messagerie | Hors MVP | Pas dans le flow |
| Notation / évaluation des agents | Hors MVP | Pas dans le flow |
| Paiements / monétisation | Hors MVP | Outil opérationnel |

---

# 10. Glossaire

| Terme | Définition |
|---|---|
| **Alerter** | Action centrale du système — soumettre un signalement |
| **Alerte** | Signal brut soumis par un spectateur (entité métier) |
| **Incident** | Événement métier qualifié, agrégeant une ou plusieurs alertes |
| **Mission** | Intervention dispatché par le coordinateur, assignée à un agent |
| **Spectateur** | Public présent sur l'événement |
| **Agent** | Personnel d'intervention sur le terrain |
| **Coordinateur** | Personnel de PC opérationnel |
| **Agent tiers** | Service externe (police, hôpital, pompiers) — modélisé comme `Site` |
| **QR Urgence** | Code QR physique collé sur murs/poteaux contenant un token signé |
| **Anti-spam localisation** | Mécanisme de déduplication par proximité spatiale et temporelle |
| **Toggle on/off** | Statut de disponibilité de l'agent (available / offline) |
| **Site / Poste de secours** | Lieu de référence (police, hôpital, etc.) |

---

*Version 1.0 — Avril 2026 — Aligné sur le board Figma SUNUBETT*
