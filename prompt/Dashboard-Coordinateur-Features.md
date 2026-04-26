# Dashboard Coordinateur — Features

## Contexte

Bët est une plateforme de signalement et de coordination d'incidents pour les grands rassemblements, déployée pour les Jeux Olympiques de la Jeunesse Dakar 2026. Le coordinateur pilote depuis le PC opérationnel et dispatche les agents de terrain.

Trois objets métier :
- **Alerte** : signal brut d'un spectateur
- **Incident** : événement qualifié par le coordinateur
- **Mission** : intervention dispatchée à un agent unique

Ce document liste les features du dashboard.

---

## 1. Carte temps réel

**Éléments affichés** :
- Position du PC opérationnel
- Incidents actifs (référence, catégorie, gravité, statut, position GPS)
- Agents (nom, équipe, statut effectif, position GPS, batterie, dernier ping)
- Zones chaudes (centre, rayon, nombre d'alertes, catégorie dominante)
- Sites de référence (nom, type, téléphone, position, indicateur 24/7)
- QR codes (label, position, statut, nombre de scans)

**Mise à jour temps réel via WebSocket** sur tous les éléments.

---

## 2. Filtres

- **Catégorie** : santé, sécurité, foule, accès, danger, perdu, autre
- **Gravité** : critique, élevée, moyenne, faible
- **Statut** : reçue, validée, mission assignée, en cours, résolue, clôturée
- **Zone** : tout, Dakar, Diamniadio, Saly, par site
- **Ancienneté** : dernière heure, 4h, jour, tout
- **Toggles** : doublons potentiels, agents offline, QR codes, heatmap

---

## 3. Indicateurs KPI temps réel

- Nombre d'incidents ouverts
- Nombre d'incidents critiques
- Temps moyen de prise en charge
- Ratio agents disponibles / agents totaux
- Nombre de zones chaudes actives

---

## 4. Vue d'ensemble (par défaut)

- 3 derniers incidents reçus
- Total incidents reçus aujourd'hui
- Total missions complétées aujourd'hui
- Top 3 catégories les plus fréquentes

---

## 5. Détail d'un incident sélectionné

**Identification** : référence, catégorie, gravité, statut, date de création, date de qualification

**Localisation** : adresse, zone, coordonnées GPS

**Médias** : photo, audio avec lecteur, transcription originale, transcription traduite en français

**Description** : texte brut du spectateur

**Source** :
- Type (QR ou app)
- Si QR : label de localisation, ID QR
- Si app : nom du spectateur, téléphone masqué

**Timeline** : événements chronologiques avec horodatage et acteur

**Alertes liées** : références des alertes regroupées

**Agents proches recommandés** : nom, équipe, distance, batterie, statut

**Sites de référence proches** : nom, type, distance, téléphone

**Actions disponibles** (selon statut) :
- Valider (créer un incident ou rattacher à un existant)
- Dispatcher une mission
- Marquer comme doublon
- Marquer comme fausse alerte
- Rejeter
- Clôturer

---

## 6. Action "Dispatcher une mission"

**Récap incident** : référence, catégorie, gravité, zone, photo

**Sélection agent** : liste triée par disponibilité × matching équipe × distance, avec nom, équipe, distance, batterie, statut

**Briefing** : texte libre (300 caractères max), suggestions de templates par catégorie

**Durée estimée** : minutes

**Sites de référence à proposer** : liste pré-cochée selon catégorie, avec nom, type, distance, téléphone

**Options** : notifier l'agent immédiatement, marquer comme prioritaire

**Règles de validation** :
- Vérifier que l'agent n'a pas déjà une mission active
- Notification temps réel à l'agent à la création

---

## 7. Liste des incidents (vue tableau)

**Colonnes** : référence, heure, catégorie, gravité, statut, zone, agent assigné

**Fonctions** : tri par colonne, recherche, filtres, pagination, export CSV, accès au détail

---

## 8. Liste des agents (live)

**Pour chaque agent** : nom, téléphone, équipe, zone, statut effectif, mission active, distance depuis le PC, batterie, dernier ping

**Filtres** : équipe, statut, zone

---

## 9. Notifications temps réel

Types d'événements à notifier :
- Nouvelle alerte reçue
- Refus de mission par un agent
- Zone chaude détectée
- Doublon potentiel détecté
- Mission terminée

Chaque notification : type, données contextuelles, horodatage, action rapide.

---

## 10. Top bar

- Logo Bët
- Nom du PC opérationnel
- Statut de connexion temps réel
- Nombre de notifications non lues
- Profil coordinateur (nom, rôle, déconnexion)
