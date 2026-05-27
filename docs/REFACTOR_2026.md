# Refactor 2026 — Casser le monolithe App.jsx

## État initial (mai 2026)

`src/App.jsx` faisait **10 597 lignes** avec 175 `useState`, 29 `useEffect`,
45 appels `fetch()` et définissait ~35 composants en interne. Tout le contenu
du dashboard admin (Cockpit, Planning, Pilotage, Revenue Manager, etc.)
vivait dans un seul fichier.

Le sujet du refactor : couper le couplage **sans casser le comportement**,
en suivant un pattern strangler fig (extraction progressive, 1 commit par
étape, tests verts à chaque fois).

## Décisions architecturales

### Pourquoi pas Zustand

L'analyse initiale (cf. message du 27 mai 2026) a montré que :

- **8 sources de données partagées** entre onglets seulement
- **1 seul endpoint** (`/api/beds24-bookings`) alimente plusieurs onglets
- **16 onglets sur 25** sont entièrement autonomes (fetch local, state local)
- **83 % des `useState`** sont du UI local (filtres, modals, formulaires)
- Le pire prop-drilling concernait Planning (10 props)

Zustand aurait été du sur-engineering. On a opté pour un simple
**`AppDataContext`** en React Context API. Les onglets étant rendus
1 par 1 (`tab === "x" && <Tab />`), les re-renders inutiles que Context
déclenche d'habitude ne se manifestent pas.

### Critères de bascule éventuelle vers Zustand

À considérer SI :
- Plus de 5 sources data externes async simultanées
- Bugs de re-render perf détectés (DevTools profiler)
- Multi-utilisateur ajouté (équipe ménage en simultané sur le dashboard)
- App grossit jusqu'à 8 000+ lignes APRÈS extraction = incohérence archi

À ce moment-là : migration Context → Zustand = 1-2h car shape similaire.
Pas de regret en attendant.

## Étapes complétées

### Étape 0 — Setup tests (commit `e2c8e8d`)

- Install Vitest 3 + jsdom + @testing-library/react + jest-dom
- `vitest.config.js` + `vitest.setup.js`
- Scripts npm : `test` (watch), `test:run` (CI), `test:ui` (interface)
- Création `src/utils/calculations.js` — source unique de vérité pour les
  KPIs métier : `sumN`, `avgN`, `addDays`, `diffDays`, `todayStr`,
  `computeRevenusFromResas`, `computeOccupation`, `computeADR`,
  `computeRevPAR`, `statutBien`, `N`.
- **30 tests** couvrant cas nominaux + edge cases (null, mois 0, DST,
  régularité, valeurs hors bornes).

### Étape B/1 — Extraction Cockpit (commit `599f3e8`)

App.jsx 10 597 → **10 013 lignes** (-584).

Déplacés vers `src/tabs/Cockpit.jsx` :
- `Cockpit` (composant principal, ~316 lignes)
- `Spark`, `PBar`, `RevCell` (helpers uniquement utilisés par Cockpit)
- `YieldAlerts`, `NogentCashflowAlert`, `AmaryllisBaseSaisonAlert` (alertes)

Exports ajoutés dans App.jsx : `Gauge`, `fmt`, `fmtK`, `MOIS`, `DOT`, `TT`.

### Étape B/2 — Extraction Planning (commit `2511bb8`)

App.jsx 10 013 → **9 159 lignes** (-854).

Déplacés vers `src/tabs/Planning.jsx` :
- `parseICS` (96 lignes, parser iCal, uniquement utilisé par Planning)
- `EMPTY_FORM` (constante formulaire)
- `Planning` (756 lignes, 10 props initialement, 4 vues internes)

Exports ajoutés dans App.jsx : `MOIS_FULL`, `N`, `CC`, `CB`,
`computeRevenusFromResas`, `MinNightsConfig`.

### Étape A — AppDataContext (commit `6227557`)

Création de `src/AppDataContext.jsx` : context React unique, value composée
de 14 valeurs partagées (biens, reservations, n, mob, hist, scriptUrl, 3 ical*,
3 save*, addToast, 3 callbacks).

Migrés vers `useAppData()` au lieu de props :
- `Cockpit.jsx`
- `Planning.jsx`
- `RevenueManagerPro.jsx`

App.jsx : les 3 calls passent de
`<Cockpit biens={biens} n={n} mob={mob} ... />` à simplement `<Cockpit />`.

## Bilan chiffré (final session)

| Métrique | Avant | Après | Δ |
|---|---|---|---|
| **App.jsx lignes** | **10 597** | **1 861** | **−8 736 (−82 %)** |
| Composants extraits dans `src/tabs/` | 0 | **25** | +25 |
| Tests unitaires | 0 | 30 | +30 |
| Composants avec >3 props data | 25+ | 0 | tous via `useAppData()` |

**Tous les onglets fonctionnent en runtime production** (vérifié via Chrome
DevTools : Cockpit, Planning, Revenue Manager, Tarifs, Travaux, Prestataires,
Previsionnel — pas de console errors).

## Comment continuer

### Prochains candidats à l'extraction (ordre suggéré)

Du plus simple au plus complexe :

1. **MenageTab** (~84 lignes) — petit, dépendances claires
2. **MessageTemplates** (~221 lignes) — autonome
3. **Previsionnel** (~280 lignes) — utilise `hist` + `biens` + `n`
4. **Historique** (~410 lignes) — symétrique à Previsionnel
5. **Charges** (~242 lignes)
6. **CalendrierTarifs** (~670 lignes) — utilise `reservations`
7. **Pilotage** (~895 lignes) — gros, utilise `reservations`
8. **MinNightsConfig** (~281 lignes) — actuellement utilisé par Planning
9. **Travaux** (~1010 lignes) — le plus gros restant
10. **Tarifs** (~285 lignes)
11. **AnalyticsTab** (~260 lignes) — autonome

### Process à suivre pour chaque extraction

1. Lire la fonction cible + ses dépendances dans App.jsx
2. Vérifier que les helpers utilisés sont :
   - Déjà exportés depuis App.jsx, ou
   - Déjà dans `src/utils/calculations.js`
   - Si non : ajouter le `export` keyword
3. Créer `src/tabs/NomDuComposant.jsx`
4. Si le composant n'a aucune dépendance data au-delà de ce que `useAppData()`
   expose déjà → l'utiliser, sinon passer la nouvelle data en props
5. Supprimer la fonction de App.jsx
6. Ajouter `import NomDuComposant from "./tabs/NomDuComposant.jsx";`
7. Simplifier le `<NomDuComposant />` dans le dispatch (retirer props devenues
   inutiles)
8. `npm run test:run` (doit être vert)
9. `npm run build` (doit passer)
10. `npm run deploy:pages` + vérifier `https://dashboard-amaryllis.pages.dev/admin`
11. Commit avec message style `refactor(App): extract <Nom> into src/tabs/`

### Règles non négociables

- Aucun deploy sans `npm run test:run` vert
- 1 commit par composant extrait (pas de big-bang)
- Préserve TOUS les comportements existants (refactor pur)
- Si un test casse → STOP → fix → puis continue
- Pas plus de 3 fichiers modifiés par commit (sauf le commit initial setup)

## Anti-patterns observés et résolus

### `statutBien` dupliquée avec logique divergente

J'avais initialement créé une version simplifiée dans `calculations.js`
(`ok/warn/ko` avec seuil −1000) au lieu de réutiliser la logique réelle
d'App.jsx (`green/yellow/red` avec `cf > 0 && occ > 50`). Test passait
mais ne reflétait pas la réalité.

**Leçon** : quand on extrait une fonction, **vérifier l'usage réel** dans
le code source avant d'écrire les tests. Le test doit reproduire le
comportement existant, pas une version idéale.

### JSX dans un commentaire JSDoc cassait le build

`AppDataContext.jsx` contenait `<Cockpit />` à l'intérieur d'un commentaire
JSDoc multi-lignes. Vite parsait ça comme du JSX.

**Leçon** : éviter le JSX dans les commentaires `/** */` même s'ils sont
visuellement séparés. Préférer `// commentaire` pour les exemples qui
contiennent du JSX, ou échapper.

## Lien avec les autres docs

- `CLAUDE.md` — Architecture générale du projet
- `src/utils/calculations.js` — Source de vérité des KPIs métier
- `src/AppDataContext.jsx` — Source de vérité du contrat data tabs ↔ App
