# Bët — Design

## Design guidelines opérationnelles (MVP)

**Version** : 1.0  
**Date** : Avril 2026  
**Statut** : Référence UI/UX (alignée maquettes HTML)

---

## 1. Objectif

Transformer les références visuelles en règles UI strictes et réutilisables pour:

- garantir une cohérence produit entre flows `F1` à `F4`;
- éviter la dérive visuelle lors de l'implémentation;
- accélérer l'exécution via composants communs.

Références utilisées:

- `design/html/generated-page (8).html` (mobile map + alert sheet + settings sheet);
- `design/html/Coordinateur.html` (dashboard coordinateur desktop/tablette).

---

## 2. Principes UX par rôle

### 2.1 Spectateur (F1/F2)

- Mobile-first absolu.
- Accès rapide à l'action centrale "Alerter".
- Friction minimale dans les formulaires.
- Retour de statut lisible et rassurant.

### 2.2 Agent terrain (F3)

- Actions à fort contraste et faible ambiguïté.
- Statut de mission visible en permanence.
- Actions critiques accessibles en un minimum d'étapes.

### 2.3 Coordinateur (F4)

- Densité d'information maîtrisée sur desktop/tablette.
- Priorisation visuelle des urgences (critique, doublon potentiel, mission assignée).
- Navigation rapide entre map, détail incident, assignation.

---

## 3. Tokens visuels (source design system)

### 3.1 Typographie

- Police principale: `Manrope`.
- Hiérarchie:
  - labels/meta: léger, uppercase tracking élevé;
  - texte courant: lisible, poids léger à medium;
  - titres critiques: medium, tracking serré.

### 3.2 Palette de base

- Fonds map dark: tons bleu-noir/gris foncé.
- Surfaces overlay: "glass" (`bg white/10` + `backdrop-blur`) sur mobile.
- Surfaces dashboard: clair, bordures fines, contraste texte neutre.

### 3.3 Couleurs métier (catégories incidents)

- Santé: rose/rouge doux.
- Sécurité: rouge.
- Foule: ambre.
- Accès/Logistique: bleu ciel.
- Danger matériel: orange.
- Perdu/Trouvé: violet.
- Neutre/Autre: slate.

Ces couleurs doivent rester constantes entre map, cartes, badges, filtres et formulaires.

### 3.4 Rayons, bordures, ombres

- Rayons arrondis dominants (`rounded-xl`, `rounded-2xl`, pills).
- Bordures fines (`black/5` à `black/10` ou équivalent alpha).
- Ombres discrètes, jamais lourdes.

### 3.5 Spacing et densité

- Mobile: espacement compact, zones tactiles confortables.
- Dashboard: zones denses mais segmentées (barre KPI, carte, panneau détail).

---

## 4. Système de composants réutilisables

## 4.1 Composants map (mobile)

- `MapTopHeader` (localisation + actions latérales).
- `MapFilterFab` et menu vertical de filtres.
- `SOSPrimaryButton` (CTA principal).
- `AlertTrackerCard` (progression de suivi).

### 4.2 Formulaire d'alerte multi-étapes

- `AlertSheet` (overlay full-screen)
- `CategoryGridStep`
- `SubCategoryGridStep`
- `AlertDetailsStep` (description + photo + vocal)
- `AlertConfirmationStep` (succès + identification optionnelle)
- `ProgressSegments` (étapes visuelles)

### 4.3 Composants média

- `PhotoAttachField`
- `VoiceRecordField` (timer, état recording)
- `MediaPreviewCard`

### 4.4 Dashboard coordinateur

- `SidebarNav`
- `TopBar`
- `KpiBar`
- `MapControlBar` (filtres + toggles overlay)
- `PotentialDuplicateBanner`
- `IncidentDetailPanel`
- `RecommendedAgentsList`
- `NearbySitesCard`
- `IncidentActionsFooter`

### 4.5 Variants d'états (obligatoires)

Pour chaque composant critique:

- `default`
- `active/selected`
- `loading`
- `error`
- `disabled` (si action indisponible)

---

## 5. Règles strictes de cohérence UI

1. Un composant = une responsabilité visuelle claire.
2. Pas de duplication "copier-coller" de variants: factoriser.
3. États visuels métier cohérents avec statuts backend.
4. Couleurs métier constantes d'un écran à l'autre.
5. Structure des overlays et sheets homogène (header, progression, contenu, action).
6. Comportements interactifs reproductibles (menu, modal, tracker, transitions).

---

## 6. Interaction et micro-UX

- Feedback immédiat à chaque action utilisateur.
- Transitions courtes et sobres (pas d'animation décorative excessive).
- Les actions critiques doivent confirmer l'issue (ex: alerte envoyée).
- Dans les flux multi-étapes:
  - progression toujours visible;
  - navigation retour explicite;
  - fermeture claire;
  - conservation ou reset d'état déterministe.

---

## 7. Responsive et comportement par écran

### 7.1 Mobile (spectateur/agent)

- Interface centrée map + overlays.
- CTA d'urgence toujours atteignable.
- Formulaires plein écran ou quasi plein écran.

### 7.2 Tablette/Desktop (coordinateur)

- Layout 3 zones:
  - navigation;
  - carte tactique;
  - panneau détail.
- KPI visibles sans scroll initial.
- Actions de dispatch facilement accessibles depuis le panneau incident.

---

## 8. Accessibilité minimale (MVP)

- Focus clavier visible sur éléments interactifs.
- Libellés explicites pour champs et actions.
- Contraste texte/fond suffisant (notamment sur surfaces glass).
- Cibles tactiles dimensionnées pour mobile.
- Icônes toujours accompagnées d'un contexte textuel quand l'action est critique.

---

## 9. Mapping design -> flows

- **F1/F2**: map mobile, SOS, alert sheet, tracker.
- **F3**: map + statut + actions de mission.
- **F4**: dashboard, KPI, map live, panneau détail, dispatch.

Toute variation visuelle doit préciser le flow cible impacté.

---

## 10. Checklist QA UI

Avant validation d'une feature UI:

1. Conformité aux composants définis (pas de nouveau pattern inutile).
2. Respect des tokens (typo, couleurs, spacing, rayon, bordures).
3. États critiques couverts (`loading`, `error`, `empty`, `success`).
4. Cohérence des statuts affichés avec le domaine (`Alerte/Incident/Mission`).
5. Vérification responsive sur les vues attendues.
6. Accessibilité minimale vérifiée.
7. Non-régression visuelle sur écrans critiques F1/F2/F3/F4.

---

## 11. Matrice de cohérence inter-docs (design)

| Sujet | Référence primaire | Référence secondaire |
|---|---|---|
| Patterns UI et composants | `DESIGN.md` | `RULES.md` |
| Statuts métier affichés | `TYPES.md` | `DESIGN.md` |
| Parcours utilisateur | `FEATURES.md` | `DESIGN.md` |
| Périmètre MVP | `CONTEXT.md` | `DESIGN.md` |

---

## 12. Critères d'acceptation design (MVP)

- Les écrans clés reprennent fidèlement l'intention des maquettes de référence.
- Le système de composants couvre les flux F1 à F4 sans duplication majeure.
- Les règles de cohérence et d'accessibilité sont appliquées.
- Le design reste pragmatique et implémentable rapidement.

---

*Version 1.0 — Avril 2026 — Référence design MVP Bët*
