# Migration — Amaryllis Design System → `locatif-dashboard/`

Tout ce qu'il faut pour porter ce design system dans ton vrai projet React + Vite déployé sur Cloudflare Pages.

---

## TL;DR — 3 étapes

```bash
# 1. Télécharger ce projet, le placer comme skill dans ton repo
cd ~/code/locatif-dashboard
mkdir -p .claude/skills
mv ~/Downloads/amaryllis-design-system .claude/skills/amaryllis-design

# 2. Copier les tokens + assets dans src/ et public/
cp .claude/skills/amaryllis-design/colors_and_type.css src/tokens.css
cp .claude/skills/amaryllis-design/assets/icons.svg public/icons.svg
cp .claude/skills/amaryllis-design/voice.md docs/voice.md

# 3. Ajouter une ligne dans src/main.jsx
echo "import './tokens.css';" | cat - src/main.jsx > tmp && mv tmp src/main.jsx
```

Puis lancer `claude` et dire *"Utilise la skill amaryllis-design et porte progressivement PublicSite.jsx pour qu'il consomme les tokens CSS"*.

---

## Couche 1 — Tokens (zéro régression)

Le fichier `colors_and_type.css` contient **exactement les couleurs déjà utilisées dans `PublicSite.jsx`** (j'ai extrait les hex depuis le code). L'importer ne casse rien, et te donne toutes les variables d'un coup.

### Étapes

1. **Copier** `colors_and_type.css` → `src/tokens.css` dans `locatif-dashboard/`
2. **Importer** dans `src/main.jsx` après `'./index.css'` :
   ```js
   import './index.css'
   import './tokens.css'        // ← ajouter
   ```
3. **Activer la surface** au démarrage :
   ```js
   document.body.dataset.surface = window.location.pathname.startsWith("/admin") ? "admin" : "site";
   ```
4. **Replace progressively** dans `PublicSite.jsx` :
   - `"#0e3b3a"` → `"var(--c-navy)"`
   - `"#c47254"` → `"var(--c-coral)"`
   - `"#faf5e9"` → `"var(--c-ivory)"`
   - `"#e0d4bc"` → `"var(--c-sand)"`
   - `"#7a6b5a"` → `"var(--c-muted)"`
   - `"#c9a673"` → `"var(--c-gold)"`
   - `"#f4ecdc"` → `"var(--c-cream)"`

Tu peux faire un find-replace global ; aucun de ces hex n'est utilisé ailleurs pour autre chose.

### Bonus immédiat — mode sombre

Une fois les tokens en place, **le mode sombre du site fonctionne d'office** : ajouter un toggle qui set `document.documentElement.dataset.theme = 'dark'` et toutes les vues basculent.

J'ai écrit `ui_kits/site/ThemeToggle.jsx` prêt à copier.

---

## Couche 2 — Iconographie

`assets/icons.svg` est un sprite SVG de 21 symboles compatible avec `<use href>`.

### Installation

1. **Copier** `assets/icons.svg` → `public/icons.svg`
2. **Utiliser** dans tes composants :
   ```jsx
   <svg width="20" height="20" style={{ color: "var(--c-coral)" }}>
     <use href="/icons.svg#star"/>
   </svg>
   ```

### Inventaire (21 icônes)

```
bed · bath · users · pool · wifi · car · home · calendar · star · heart ·
share · search · check · x · arrow-right · arrow-left · palm · waves ·
map-pin · message · lock
```

Toutes : `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="1.5"`, `fill="none"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.

Tu peux les sertir où tu veux dans `PublicSite.jsx` — par exemple remplacer le texte *"6 voyageurs · 3 chambres · 3 sdb"* par des icônes + chiffres.

---

## Couche 3 — Voice & copy

`voice.md` n'a pas vocation à être importé en JS. C'est un **mémoire** :

- Place-le à `docs/voice.md` ou `.claude/skills/amaryllis-design/voice.md`
- Référence-le dans `CLAUDE.md` à la racine : *"Pour toute copie en français ou en anglais, suivre docs/voice.md."*
- Quand un agent (toi, Claude Code, autre) doit écrire un nouveau microcopy, il regarde d'abord là.

Trois usages immédiats :

1. Standardiser les CTA dans `PublicSite.jsx` (il y en a 3 variantes pour *"réserver"* aujourd'hui)
2. Compléter les traductions EN dans `src/i18n.jsx` à partir des tableaux FR · EN
3. Refonder les messages d'erreur (`payError`, `depositError`) avec les versions canoniques

---

## Couche 4 — Composants UI kit (cherry-pick)

Les composants des UI kits (`ui_kits/site/*.jsx`, `ui_kits/admin/*.jsx`) sont **écrits pour Babel-in-the-browser** avec `Object.assign(window, {...})`. Ils ne marchent pas tels quels dans Vite.

**Pour les porter dans `src/`**, deux changements :

1. Remplacer la fin du fichier :
   ```jsx
   // AVANT (browser Babel)
   Object.assign(window, { PropertyCard, BookingPanel });

   // APRÈS (Vite/ES modules)
   export { PropertyCard, BookingPanel };
   ```

2. Ajouter les imports React explicites :
   ```jsx
   // AVANT
   const { useState: useStateCard, useEffect: useEffectCard } = React;

   // APRÈS
   import { useState, useEffect } from "react";
   ```

3. Adapter les chemins d'assets (les UI kits utilisent `../../assets/photos/...`, dans `src/` ce sera `/photos/...` car Vite sert `public/` à la racine).

### Ordre de portage suggéré

| Priorité | Composant | Bénéfice |
|---|---|---|
| 1 | `Primitives.jsx` (Eyebrow, Display, Editorial, Button, Chip, RatingBadge) | Remplace ~200 occurrences inline dans `PublicSite.jsx` |
| 2 | `Calendar.jsx` (DateRangePicker) | Remplace le composant date inline (~150 lignes) |
| 3 | `Curtain.jsx` | Animation d'ouverture, déjà présente dans le code mais non factorisée |
| 4 | `ThemeToggle.jsx` | Active le mode sombre déjà déclaré |
| 5 | `Header.jsx` (TopBar, Hero, SectionHead) | Réutilisable pour la home + chaque fiche bien |
| 6 | `PropertyCard.jsx` + `Sections.jsx` (DescriptionBlock, AmenityCloud, ReviewBlock, FAQAccordion, Footer) | Le reste |

---

## Couche 5 — Cartographie de Flux (admin)

`ui_kits/admin/cartographie.html` est **pure HTML+SVG+CSS**, zéro React. Tu peux soit :

- **Le servir tel quel** : copier dans `public/cartographie.html`, lier depuis l'admin
- **Le porter en composant React** : 30 minutes de boulot, données à injecter via props

Je te suggère la première option pour aller vite — c'est une page autonome que l'admin ouvre dans une iframe ou nouvel onglet.

---

## Sanity checks après migration

```bash
# 1. Les vars CSS résolvent bien (devtools console)
> getComputedStyle(document.body).getPropertyValue('--c-coral')
"#c47254"

# 2. La surface est bien attachée
> document.body.dataset.surface
"site"

# 3. Mode sombre fonctionne
> document.documentElement.dataset.theme = "dark"
# → la page bascule

# 4. Le sprite icons fonctionne
# Ouvrir devtools, taper :
> document.querySelector('use[href*="icons.svg"]').baseVal
# devrait pointer vers /icons.svg#xxx
```

---

## Ce que je n'ai PAS porté (volontairement)

- `App.jsx` (admin dashboard) — 7500 lignes, dépend de Recharts, beaucoup de logique métier. Le design system documente le **style** ; la **logique** reste là où elle est.
- Les iCal proxies / fonctions Cloudflare — c'est du backend, pas du design.
- `seedPrices.js`, `pricingEngine.js`, etc — logique business pure.

---

## Quand tu seras prêt à déployer

```bash
cd ~/code/locatif-dashboard
npm run dev:cf          # vérifier en local
git add -A && git commit -m "feat: design system tokens + sprite icons + dark mode"
git push                # Cloudflare Pages déploie automatiquement
```

C'est tout. Tu peux faire le port en plusieurs commits incrémentaux — chaque couche est indépendante.

---

## Si quelque chose casse

Les couleurs sont **strictement extraites** du code existant, donc l'import des tokens ne devrait rien changer visuellement. Si tu vois une régression :

1. **Vérifie l'ordre des imports** — `tokens.css` doit être chargé après `index.css`
2. **Vérifie la cascade** — le `<body data-surface="...">` doit envelopper tous les composants qui utilisent les vars
3. **Sauf les overrides `!important`** dans `<style id="__om-edit-overrides">` qui peuvent gagner — édite ce bloc ou supprime-le

Et viens m'en parler avec un screenshot, je débuggue avec toi.
