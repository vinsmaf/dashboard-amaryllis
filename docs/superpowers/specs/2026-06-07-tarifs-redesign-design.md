# Redesign onglet Tarifs — Vue d'ensemble + Action rapide

**Status:** Approved — ready for implementation  
**Date:** 2026-06-07  
**Scope:** `src/tabs/Tarifs.jsx` + `src/tabs/CalendrierTarifs.jsx` (en lecture)

---

## Contexte & problème

L'onglet Tarifs est la section la plus critique de l'admin : elle pilote directement les prix facturés aux voyageurs sur le site public. Elle souffre de deux problèmes majeurs :

1. **Absence de vue d'ensemble** : l'admin doit naviguer bien par bien pour voir l'état des prix. Impossible de voir d'un coup ce qui est affiché sur le site pour tous les logements.
2. **Système fantôme** : les "Périodes tarifaires saisonnières" dans Tarifs.jsx utilisent un multiplicateur sur un "prix de base" déconnecté des vrais prix journaliers — elles n'ont jamais piloté le site public. L'aperçu 7 jours montre donc des prix incorrects.

### Sources de vérité (inchangées)

- **Vrais prix sur le site** : `daily[bienId][date]` dans `amaryllis_daily_prices_v2` (localStorage) → synchro serveur via `/api/site-config`
- **Planchers/plafonds** : `rm_properties.price_min / price_max` en D1 (éditable via PUT `/api/rm-properties`)
- **Remises longue durée** : hardcodées dans `pricing.js` (7+ nuits −5%, 14+ −10%, 28+ −15%)

---

## Décisions de design

### Ce qui disparaît (mort, sans perte)
- `Tarifs.jsx` : système "Périodes tarifaires saisonnières" avec multiplicateurs (`seasons`, `seasonForm`, `save()`, `effectivePrice()`, `SEASONAL_KEY`)
- `Tarifs.jsx` : aperçu 7 prochains jours (données fantômes)
- `Tarifs.jsx` : état `prices` + `amaryllis_base_preview` (dead code)

### Ce qui reste 100% intact
`CalendrierTarifs.jsx` est conservé tel quel — aucune modification. Il reste l'outil de précision pour les ajustements fin jour par jour.

---

## Architecture nouvelle

```
src/tabs/Tarifs.jsx  (refonte)
├── Bandeau info "source unique des prix"           [existant]
├── Bandeau info "remises automatiques"             [existant]
├── Zone A — TarifsOverview                         [NOUVEAU composant]
│     src/tabs/tarifs/TarifsOverview.jsx
└── Zone B — TarifsQuickSeason                     [NOUVEAU composant]
│     src/tabs/tarifs/TarifsQuickSeason.jsx
└── Zone C — CalendrierTarifs                      [inchangé]
      src/tabs/CalendrierTarifs.jsx
```

---

## Zone A — TarifsOverview

### Rôle
Tableau de bord lisible en 2 secondes : tous les biens en colonnes, les prochains mois en lignes, prix moyen réel affiché dans chaque cellule.

### Données
- Source : `loadDailyPrices()[bienId]` — mêmes données que CalendrierTarifs
- Calcul par cellule (bien × mois) : moyenne des prix journaliers du mois ; si aucun prix saisi → affiche `??` (prix non défini)
- Rafraîchissement : écoute l'event `amaryllis_prices_updated` + `storage` (même logique que CalendrierTarifs)
- Années affichées : mois courant → +11 mois (glissant, pas d'année fixe)

### Affichage
```
  Vue d'ensemble — Prix actuels sur le site               Année : [2026 ▼]

               Amaryllis   Géko   Zandoli   Mabouya   Schœlcher   Nogent
                           🔗────────────🔗
  Juin 2026      280€      110€    110€       70€        90€        90€
  Juillet        300€      130€    130€        ??        100€        ??
  Août           350€      150€    150€       85€        105€       90€
```

- **Couleurs de cellule** : identiques au CalendrierTarifs (vert promo / bleu standard / orange haute / rouge pic) — seuils relatifs au `DEFAULT_PRIX[bienId]`
- **`??`** : fond orange pâle `rgba(245,158,11,0.15)` — signal visuel "à remplir"
- **🔗** : badge entre Géko et Zandoli (header). Si leurs prix moyens du mois sont identiques → badge vert. S'ils divergent de plus de 5% → badge orange avec tooltip "prix divergents"
- **Clic sur une cellule** : scroll jusqu'à CalendrierTarifs (`document.getElementById('calendrier-tarifs').scrollIntoView()`), sélectionne le bon bien via event custom `tarifs_jump_bien` + `tarifs_jump_month`

### Comportement Géko + Zandoli
Géko et Zandoli sont toujours affichés côte à côte avec le badge 🔗. Pas d'automatisme de synchronisation dans cette zone — c'est la Zone B qui gère ça.

---

## Zone B — TarifsQuickSeason

### Rôle
Fixer un prix sur une période pour un ou plusieurs biens en 3 actions : choisir les biens → choisir la période → entrer le prix → Appliquer.

### Interface
```
  ⚡ Fixer un prix pour une période

  Biens :  [✓ Amaryllis] [✓ Géko+Zandoli 🔗] [ ] Mabouya [ ] Schœlcher [ ] Nogent

  Période : [01/07/2026] → [31/08/2026]
            Raccourcis : [Basse ▼] [Mi ▼] [Haute ▼] [Pic ▼]

  Prix/nuit : [ 280 ] €

  [ ⚡ Appliquer sur X biens · Y dates ]
```

### Détails comportement

**Sélecteur de biens :**
- Géko et Zandoli apparaissent toujours groupés sous un seul bouton "Géko + Zandoli 🔗"
- Cocher ce bouton coche les deux simultanément
- Prix identique appliqué aux deux (pas de facteur différentiel ici — c'est la copie dans CalendrierTarifs qui sert pour ça)
- Iguana absent (non bookable)

**Sélecteur de période :**
- 2 date pickers (début / fin)
- Raccourcis : reprennent les saisons définies dans `saisons_config` (localStorage de CalendrierTarifs)
- Cliquer un raccourci remplit automatiquement les deux dates

**Prix :**
- Champ numérique unique
- Validation immédiate : si le prix est < `price_min` d'un des biens sélectionnés → message d'erreur inline par bien (`"Géko min 100€"`)
- Le bouton Appliquer reste actif même avec des warnings partiels — c'est l'admin qui décide
- Validation bloquante uniquement si le champ est vide

**Appliquer :**
- Écrit dans `daily[bienId][date]` pour chaque bien × chaque date de la période
- Respecte `commitChange` (historique undo) via un appel délégué à CalendrierTarifs via ref ou event
- Déclenche `scheduleServerSync` (debounce 2.5s) — même mécanisme que CalendrierTarifs
- Après application : Zone A se rafraîchit (event `amaryllis_prices_updated`)
- Message de confirmation inline : "✓ 62 dates mises à jour pour 3 biens"

**Partage d'état avec CalendrierTarifs :**
- `TarifsQuickSeason` lit et écrit dans `loadDailyPrices()` / `saveDailyPrices()` — même store que CalendrierTarifs
- Le sync serveur est déclenché via `fetch('/api/site-config', ...)` directement depuis TarifsQuickSeason (même logique que `doServerSync` dans CalendrierTarifs)
- CalendrierTarifs se rafraîchit via l'event `amaryllis_prices_updated` qu'il écoute déjà

---

## Zone C — CalendrierTarifs (inchangé)

Ajout d'un `id="calendrier-tarifs"` sur le wrapper div pour permettre le scroll depuis Zone A.
Ajout d'un listener sur l'event custom `tarifs_jump_bien` pour changer de bien automatiquement quand on clique une cellule de Zone A.

---

## Ce qui ne change pas

- Toute la logique de `CalendrierTarifs.jsx` : undo, drag-select, sync serveur, alerte prix sous seuil, Règles saisonnières, Copie entre biens, Résumé tarifaire
- Les bandeaux info (source unique + remises auto)
- La structure de données (`amaryllis_daily_prices_v2`, `/api/site-config`, D1 rm_properties)

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/tabs/Tarifs.jsx` | Réécriture : supprime les fantômes, intègre les 3 zones |
| `src/tabs/tarifs/TarifsOverview.jsx` | Création |
| `src/tabs/tarifs/TarifsQuickSeason.jsx` | Création |
| `src/tabs/CalendrierTarifs.jsx` | Modification minimale : ajout `id` + listener event |

---

## Tests

- Vérifier que `loadDailyPrices()` retourne bien les prix après `TarifsQuickSeason.applySaison()`
- Vérifier que CalendrierTarifs reflète les changements de TarifsQuickSeason (event refresh)
- Vérifier que Zone A affiche `??` pour les biens sans prix défini
- Vérifier que clic sur cellule scrolle vers le bon bien dans CalendrierTarifs
- Vérifier validation price_min : warning visible, application possible quand même
- Vérifier Géko+Zandoli liés : cocher l'un coche l'autre, même prix appliqué

---

## Non-scope

- Modifier les saisons (pic/haute/mi/basse) : reste dans Règles saisonnières de CalendrierTarifs
- Copie avec facteur % entre biens : reste dans "Copier depuis un autre bien" de CalendrierTarifs
- Ajustement jour par jour : reste dans la grille CalendrierTarifs
- Plancher/plafond : reste dans Règles saisonnières de CalendrierTarifs (ajouté ce jour)
