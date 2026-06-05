# 💶 Gestion des prix — comment ça marche et comment faire un devis JUSTE

> **Règle d'or (à retenir avant tout devis) :**
> **Le prix que paie un client = les PRIX JOURNALIERS du tunnel de réservation (= onglet admin « Tarifs »).
> JAMAIS le « dès X€ » affiché sur le site / dans `src/data/biens.js`.**
> Le « dès X€ » est un libellé marketing indicatif, souvent **périmé** (trop haut).

---

## 1. Les deux « prix » à ne pas confondre

| | « dès X€ » (affichage) | Prix réel facturé |
|---|---|---|
| **Où** | `src/data/biens.js` champ `prix` + guides + FAQ + SEO | **Onglet admin « Tarifs »** (prix par jour) → lu par le tunnel |
| **Rôle** | accroche marketing « à partir de » + **fallback** de dernier recours | **ce que le client paie réellement** |
| **Fiable ?** | ❌ **NON** — valeurs figées, souvent obsolètes | ✅ OUI — c'est la source de vérité |
| **Exemple Zandoli** | « dès **220 €** » (faux) | **130 €/nuit** réel |

⚠️ **L'erreur classique** (déjà commise) : faire un devis à partir du `prix` de `biens.js` (220 €) au lieu du vrai tarif journalier (130 €). **Ne plus jamais faire ça.**

---

## 2. Comment le tunnel calcule le prix réel (ordre de résolution)

Pour chaque nuit : `prix du jour = override admin (localStorage "amaryllis_prices") ?? SEED_DAILY_PRICES[bien][date] ?? bien.prix (fallback)`

- **`SEED_DAILY_PRICES`** (`src/seedPrices.js`) : grille journalière intégrée au bundle (peut être périmée).
- **Overrides admin** : ce que tu saisis dans l'onglet **Tarifs** (`saveDailyPrices` → localStorage `amaryllis_prices`, + sync serveur).
- **`bien.prix`** : utilisé **seulement** si aucune des deux sources n'a de prix pour la date.

**Total séjour** (`src/utils/pricing.js` `computeStayTotal`) :
`total = Σ(prix journaliers) − remise durée + frais de ménage (+ suppléments voyageurs/animaux)`

### Cas particuliers par bien
- **Nogent** : prix tirés de **Beds24** (`/api/beds24-prices` / `/api/beds24-rates`) — pas du seed.
- **Martinique (autres biens)** : prix journaliers du seed/overrides ; le bloc « Tarifs prévisionnels » public est masqué pour geko/mabouya/zandoli/schoelcher (`PRICING_CAL_HIDDEN`) — on s'appuie sur le calendrier de réservation.

---

## 3. Frais, remises, suppléments, caution (constantes `src/PublicSite.jsx`)

| Bien | Ménage | Caution | Voyageurs inclus | Voyageur sup. |
|---|---|---|---|---|
| Amaryllis | 180 € | 1 500 € | 6 | +50 €/nuit |
| Zandoli | 70 € | **500 €** | 4 | +30 €/nuit |
| Géko | 70 € | 500 € | — | — |
| Mabouya | 50 € | 500 € | — | — |
| Schœlcher | 70 € | 1 000 € | — | — |
| Nogent | 45 € | 500 € | — | — |
| Iguana | 0 € | 500 € | — | — (bail long, non réservable) |

- **Remises durée** (`pricing.js`) : **−5 %** dès 7 nuits · **−10 %** dès 14 · **−15 %** dès 28.
- **Animaux** : forfait **40 €/séjour** (max 2), interdits à Nogent.
- **Caution** : pré-autorisation CB (empreinte, **non débitée**), libérée après l'état des lieux.

---

## 4. Faire un devis JUSTE — la procédure

**Option A (la plus sûre) — le tunnel fait foi :**
Ouvre le lien de réservation avec les dates pré-remplies et lis le total affiché :
`https://villamaryllis.com/<bien>?checkin=AAAA-MM-JJ&checkout=AAAA-MM-JJ`

**Option B — onglet admin « Tarifs »** : lis les prix journaliers réels du bien sur les dates voulues, puis `Σ nuits + ménage − remise`.

**Option C — onglet admin « Devis »** : remplit bien/dates/montant séjour/ménage/caution → génère un **lien de paiement Stripe** (récap + paiement) à envoyer au client. ⚠️ Le champ caution peut afficher une valeur périmée → vérifier (Zandoli = 500 €, pas 700 €).

**❌ À NE JAMAIS FAIRE :** quoter d'après le « dès X€ » du site, des guides ou de `biens.js`.

---

## 5. Dette connue à corriger (affichages périmés)

Les libellés « dès X€ » sont **plus chers que le vrai tarif** sur presque tous les biens (sauf Amaryllis) → ça peut faire fuir des réservations. À aligner sur les vrais tarifs (source : onglet Tarifs) :

| Bien | « dès X€ » affiché (biens.js) | Tarif réel (à confirmer onglet Tarifs) |
|---|---|---|
| Zandoli | 220 € | **130 €** (confirmé) |
| Géko | 150 € | ~110–137 € |
| Mabouya | 110 € | ~95–99 € |
| Schœlcher | 100 € | ~90–93 € |
| Amaryllis | 280 € | ~280 € (≈ OK) |

Fichiers à modifier lors de l'alignement : `src/data/biens.js` (`prix` + `seoDesc`), `src/GuideVillaPiscine.jsx`, `src/GuideExplorer.jsx`, `src/GuideProximite.jsx`, `src/GuideActivites.jsx`, `src/Faq.jsx`. Puis `npm run deploy:pages`.

## 6. À vérifier (point ouvert)
Les overrides de prix de l'onglet Tarifs vivent en **localStorage** (navigateur admin). **Vérifier** que les vrais tarifs sont bien propagés aux **visiteurs publics** (via overrides serveur), sinon un visiteur verrait le `SEED_DAILY_PRICES` (périmé) au lieu du vrai prix. Si écart → câbler une source serveur unique des prix journaliers.
