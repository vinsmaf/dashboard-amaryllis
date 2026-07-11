---
name: Amaryllis Locations
description: Site de réservation directe villamaryllis.com + dashboard admin — deux registres, une typographie
colors:
  coral: "#c47254"
  coral-deep: "#a85a3f"
  navy: "#0e3b3a"
  gold: "#c9a673"
  ivory: "#faf5e9"
  cream: "#f4ecdc"
  sand: "#e0d4bc"
  muted: "#7a6b5a"
  success: "#16a34a"
  warning: "#d97706"
  danger: "#ef4444"
  info: "#0ea5e9"
  admin-bg-ink: "#0a0f1e"
  admin-bg-panel: "#0f172a"
  admin-bg-elevated: "#1e293b"
  admin-fg-1: "#f1f5f9"
  admin-fg-3: "#94a3b8"
typography:
  display:
    fontFamily: "Jost, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(28px, 6vw, 64px)"
    fontWeight: 200
    lineHeight: 1.1
    letterSpacing: "0.14em"
  body:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "normal"
  label:
    fontFamily: "Jost, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 300
    lineHeight: 1.4
    letterSpacing: "0.45em"
  admin-numeral:
    fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  7: "32px"
  8: "48px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.coral-deep}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.sm}"
    padding: "12px 28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.navy}"
    rounded: "{rounded.sm}"
    padding: "12px 28px"
  chip-default:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.muted}"
    rounded: "4px"
    padding: "6px 14px"
  chip-success:
    backgroundColor: "{colors.success}"
    textColor: "#16a34a"
    rounded: "{rounded.pill}"
    padding: "5px 14px"
---

# Design System: Amaryllis Locations

## 1. Overview

**Creative North Star: "The Island Ledger"**

Amaryllis Locations tient deux registres à la fois : une vitrine chaleureuse qui vend le rêve
antillais (le site public), et un poste de pilotage précis qui fait tourner l'exploitation
derrière (l'admin). Le nom porte les deux : "Island" pour le paper ivoire, l'encre teal, le
corail terracotta et l'italique éditorial du site ; "Ledger" pour le slate sombre, les chiffres
en mono, la densité et la rapidité de lecture de l'admin. Une seule typographie (Jost + Cormorant
Garamond + JetBrains Mono) traverse les deux mondes sans jamais les confondre.

Ce système rejette explicitement l'esthétique OTA générique (le site existe pour convaincre de
réserver en direct plutôt que de ressembler à Airbnb/Booking.com), les gradients criards, les
drop-shadows empilées et les icônes Material Design sur la partie publique.

**Key Characteristics:**
- Deux palettes, un seul système typographique (`data-surface="site"` vs `"admin"`)
- Site : chaleureux, éditorial, photo-forward, italique Cormorant pour la voix humaine
- Admin : sombre, mono pour les chiffres, bordures plutôt qu'ombres, zéro décoration
- Le prix et la disponibilité restent toujours visibles — ceci est un moteur de conversion,
  pas un portfolio

## 2. Colors

Le site utilise une palette chaude et retenue (encre profonde, papier ivoire, un seul accent
terracotta) ; l'admin bascule sur une palette slate sombre où la couleur sert à coder de
l'information (statuts, canaux), jamais la décoration.

### Primary
- **Muted Terracotta** (`#c47254`) : CTA principal, accent site — utilisé avec parcimonie
  (boutons "Réserver", liens actifs). Version hover **Deep Terracotta** (`#a85a3f`).

### Secondary
- **Antillean Ink** (`#0e3b3a`) : encre profonde du site — texte principal, header, fond des
  boutons secondaires. Sur l'admin, remplacée par la scale slate ci-dessous.

### Tertiary
- **Sunbaked Gold** (`#c9a673`) : notes/étoiles, accent secondaire discret.

### Neutral
- **Warm Ivory Paper** (`#faf5e9`) : fond de page du site.
- **Soft Cream** (`#f4ecdc`) : cartes, panneaux en retrait.
- **Sand Border** (`#e0d4bc`) : bordures et séparateurs du site.
- **Muted Clay** (`#7a6b5a`) : texte secondaire / légendes.
- **Deep Slate Night** (`#0a0f1e`) : fond de page admin.
- **Slate Panel** (`#0f172a`) : panneau admin (cartes, sections).
- **Slate Elevated** (`#1e293b`) : surface au-dessus du panneau (modales, dropdowns admin).

### Named Rules
**The One Accent Rule.** Sur le site, le corail est le SEUL accent chaud — jamais un second
orange/rouge ne rentre en compétition avec lui pour l'attention.
**The Semantic-Only Rule (admin).** Sur l'admin, la couleur ne décore jamais : vert/orange/rouge
= statut (succès/attention/danger), bleu/violet/rose = identité de canal ou de bien. Si une
couleur n'encode pas une info, elle n'a rien à faire sur l'admin.

## 3. Typography

**Display Font:** Jost (avec system-ui, -apple-system, 'Segoe UI', sans-serif)
**Body Font:** Cormorant Garamond (avec Georgia, serif)
**Label/Mono Font:** JetBrains Mono (avec ui-monospace, Consolas, monospace)

**Character:** Jost porte la voix institutionnelle — géométrique, aérée, toujours en majuscules
et tracking large sur le site ; Cormorant Garamond en italique porte la voix humaine et
éditoriale (descriptions de biens, citations d'avis) ; JetBrains Mono porte les chiffres de
l'admin, jamais utilisé côté site.

### Hierarchy
- **Display** (poids 200, `clamp(28px, 6vw, 64px)`, line-height 1.1) : H1 du site, majuscules,
  tracking 0.14em.
- **Headline** (poids 200, `clamp(22px, 3vw, 38px)`, line-height 1.15) : H2 du site.
- **Title** (poids 500, `clamp(17px, 2vw, 22px)`) : H3 du site ; sur l'admin, poids 600-700,
  14-24px, sans tracking (rôle informatif, pas décoratif).
- **Body** (poids 400, 17px, line-height 1.8, italique) : paragraphes éditoriaux Cormorant,
  ~65-75ch de large max.
- **Label** (poids 300, 11px, tracking 0.45em, majuscules) : eyebrows du site. Sur l'admin,
  10px, tracking 0.1em, couleur atténuée (labels de KPI).

### Named Rules
**The No-Serif-On-Admin Rule.** Cormorant Garamond n'apparaît jamais sur l'admin — l'italique
éditorial est réservé à la voix humaine du site. L'admin lit des chiffres, pas des histoires.

## 4. Elevation

Le site utilise des ombres douces teal-tintées (jamais noir pur) pour donner de la profondeur
aux cartes ; l'admin est **quasi plat** — la profondeur y est portée par les bordures et les
variations de fond (panel → elevated), pas par les ombres, cohérent avec l'esthétique
"ledger" sombre et dense.

### Shadow Vocabulary
- **Card resting** (`0 2px 16px rgba(14, 59, 58, 0.06)`) : cartes au repos, site.
- **Card hover** (`0 12px 32px rgba(14, 59, 58, 0.10)`) : survol de carte, site.
- **Modal / floating** (`0 20px 48px rgba(14, 59, 58, 0.14)`) : modales, site.
- **CTA glow** (`0 4px 18px rgba(196, 114, 84, 0.30)`) : halo sous le bouton primaire corail.
- **Admin resting** (`0 1px 3px rgba(0,0,0,0.4)`) : quasi imperceptible, juste un ancrage.
- **Admin elevated** (`0 8px 24px rgba(0,0,0,0.5)`) : dropdowns/popovers admin uniquement.

### Named Rules
**The Border-Over-Shadow Rule (admin).** En dark mode, une bordure `rgba(255,255,255,0.08)`
remplace l'ombre pour séparer les surfaces — une ombre sur fond sombre est presque invisible et
coûte du contraste pour rien.

## 5. Components

### Buttons
- **Shape:** coins doux (radius 6px en taille standard, 5px en petit, jamais 0 ni pilule sauf
  cas spécifique).
- **Primary:** fond Muted Terracotta, texte blanc, majuscules, tracking 0.12em, halo CTA en
  ombre, padding 12px 28px.
- **Secondary:** fond Antillean Ink, texte ivoire — même forme que primary, poids 400.
- **Ghost:** fond transparent, texte encre, bordure 1px Sand — pour les CTA de second plan.
- **Hover / Focus:** transition 150ms sur transform + box-shadow + background, jamais de saut
  brutal.

### Chips (site)
- **Default:** fond Soft Cream, bordure Sand, radius 4px (carré, pas pilule) — badges factuels
  (équipements, catégories).
- **onPhoto:** fond blanc 15% + blur, pilule (999px), sans bordure — badges posés sur une photo.
- **Success:** fond succès translucide, pilule, texte vert, poids 700 — confirmation/disponible.

### Cards / Containers
- **Corner Style:** 16px (site, `--radius-xl`) ; 8-12px (admin, plus dense).
- **Background:** Soft Cream sur site ; Slate Panel/Elevated sur admin.
- **Shadow Strategy:** ombre douce teal (site) ; bordure fine, pas d'ombre (admin) — cf.
  Elevation.
- **Border:** aucune sur site (l'ombre suffit) ; `rgba(255,255,255,0.08)` sur admin (remplace
  l'ombre).

### Navigation
Site : header encre pleine largeur, logo + liens Jost majuscules tracking large, CTA corail à
droite. Admin : tabs horizontaux denses, actif = soulignement fin + texte clair, jamais de
fond plein sur l'item actif (contraste suffisant sans bruit visuel).

### KPI Value (signature component, admin)
Chiffre en JetBrains Mono, poids 700, 22px — le SEUL endroit où le mono apparaît en grande
taille. Signale "ceci est une donnée mesurée", jamais utilisé pour de la prose.

## 6. Do's and Don'ts

### Do:
- **Do** utiliser les variables CSS (`var(--c-coral)`, etc.) — jamais de hex codé en dur.
- **Do** utiliser de vraies photos par bien (`assets/photos/`) — jamais de placeholder SVG, la
  marque est photo-forward.
- **Do** garder le corail comme accent unique sur le site — sa rareté fait sa force.
- **Do** utiliser les bordures plutôt que les ombres pour séparer les surfaces en dark
  mode/admin.
- **Do** garder le mono JetBrains réservé aux chiffres admin uniquement.

### Don't:
- **Don't** utiliser de gradients criards (la marque est monochrome nuancée).
- **Don't** empiler des drop-shadows multi-couches (effet "cheap").
- **Don't** utiliser des icônes Material Design sur le site marketing — utiliser le sprite SVG
  maison (`public/icons.svg`).
- **Don't** déclencher d'animations au scroll (gourmand, souvent buggy, déjà proscrit).
- **Don't** inventer une couleur hors tokens — si une nuance manque, l'ajouter à `tokens.css`,
  ne pas la coder en dur localement.
- **Don't** utiliser un border-radius incohérent dans une même vue.
- **Don't** faire ressembler le site public à un template Airbnb/OTA générique — c'est
  l'anti-référence de fond du projet.
