# Charte graphique SunuBët

## 1. Typographie du logo

### Police principale

**Manrope**

La typographie du logo utilise une écriture sobre, moderne et géométrique.

### Style du mot-symbole

Texte du logo :

**SUNUBËT**

Paramètres recommandés :

| Élément | Valeur |
|---|---|
| Police | Manrope |
| Graisse | Light |
| Casse | Full uppercase |
| Espacement | Large |
| Style | Minimaliste, premium, lisible |
| Couleur | Bleu nuit |

### CSS recommandé

```css
.logo-wordmark {
  font-family: 'Manrope', sans-serif;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: #073B63;
}
```

---

## 2. Couleurs du logo

### Couleurs principales

| Nom | Hex | Usage |
|---|---:|---|
| Bleu nuit | `#073B63` | Texte SUNUBËT, base du symbole |
| Teal vert | `#0F8C8C` | Dégradé sur les formes bleues |
| Or ocre | `#C8942D` | Ligne centrale et point du symbole |
| Sable clair | `#F4EFE7` | Fond clair recommandé |
| Blanc cassé | `#FAF7F2` | Fond alternatif très clair |

---

## 3. Dégradé du symbole

Le symbole utilise un dégradé sobre entre le bleu nuit et le teal vert.

```css
.logo-gradient-blue-green {
  background: linear-gradient(135deg, #073B63 0%, #0F8C8C 100%);
}
```

Variante plus profonde :

```css
.logo-gradient-premium {
  background: linear-gradient(135deg, #062F50 0%, #0B6F63 55%, #0F8C8C 100%);
}
```

---

## 4. Accent doré

L’accent doré doit rester limité à la ligne centrale et au point du logo.

```css
.logo-gold-accent {
  color: #C8942D;
}
```

---

## 5. Règle d’usage

Le logo doit rester sobre.

À respecter :

- Ne pas utiliser trop de couleurs à la fois.
- Garder le mot **SUNUBËT** en bleu nuit.
- Garder le doré uniquement comme accent.
- Utiliser le dégradé bleu-vert seulement sur le symbole.
- Privilégier un fond clair : sable clair ou blanc cassé.
