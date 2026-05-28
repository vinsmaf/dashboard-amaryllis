# 🔍 Rapport QA — villamaryllis.com (nuit du 27→28 mai 2026)

> Audit automatisé complet du site public + dashboard admin, réalisé pendant que tu dormais.
> Méthode : crawl navigateur réel (Chrome) + lecture console + scan statique des imports + tests Vitest + santé des APIs.

---

## ✅ TL;DR

| Zone | Résultat |
|---|---|
| **Site public** (8 pages clés + 7 villas) | ✅ **0 bug** — tout rend, 0 erreur console, 0 image cassée |
| **Admin** (30 onglets) | 🔴 **1 crash trouvé → corrigé** (Pilotage) — les 30 onglets rendent désormais |
| **Tests Vitest** | ✅ 40/40 |
| **APIs critiques** (7) | ✅ 7/7 en 200 |
| **Tunnel réservation** | ✅ event GA4 `cta_reservation_click` opérationnel |

**Bilan : 1 bug bloquant identifié et corrigé cette nuit. Site sain au réveil.**

---

## 🔴 BUG CORRIGÉ — Onglet Pilotage (crash total)

- **Symptôme** : clic sur l'onglet "💼 Pilotage" → écran "Une erreur est survenue" (et la nav disparaissait).
- **Cause** : `POSTES_CHARGES` défini dans `App.jsx` mais **non exporté**, et utilisé dans `Pilotage.jsx` sans import. `ReferenceError: POSTES_CHARGES is not defined`.
- **Origine** : régression du refactor d'extraction des onglets (26 mai). Même famille que les 4 bugs corrigés plus tôt (`BIEN_NAMES_ADMIN`, `DEFAULT_PRIX`, `Beds24Admin`).
- **Fix** : `export const POSTES_CHARGES` + ajout à l'import de `Pilotage.jsx`. ✅ Déployé + vérifié.

### 🛡️ Garantie qu'il n'en reste plus
J'ai lancé un **scan statique exhaustif** de tous les fichiers `src/tabs/*.jsx` croisé avec les exports de `App.jsx`.
→ Résultat : **plus aucun import manquant**. (Seul faux positif : `AISummary` dans Cockpit, mais il est commenté/désactivé.)

---

## ✅ Site public — détail (0 bug)

| Page | Rendu | Images | Console |
|---|---|---|---|
| `/` (home) | ✅ 50 images | 0 cassée | 0 erreur |
| `/amaryllis` | ✅ | 0 cassée | 0 erreur |
| `/zandoli` `/iguana` `/geko` | ✅ | 0 cassée | 0 erreur |
| `/mabouya` `/schoelcher` `/nogent` | ✅ | 0 cassée | 0 erreur |
| `/explorer` `/faq` `/avis` `/links` | ✅ | — | 0 erreur |

---

## ✅ Admin — 30 onglets (tous OK après fix)

Planning ✅ · Ménage ✅ · Interventions ✅ · Inventaire ✅ · Stocks ✅ · Linge ✅ · Prestataires ✅ · Messages ✅ · Emails ✅ · Cockpit ✅ · Revenue Mgr ✅ · Tarifs ✅ · Prévisionnel ✅ · Historique ✅ · Analytics ✅ · Conversion ✅ · Charges ✅ · **Pilotage ✅ (corrigé)** · Cautions ✅ · Travaux ✅ · Devis ✅ · QR/Livrets ✅ · Guides ✅ · Réseaux sociaux ✅ · Approbations ✅ · Planning éditorial ✅ · Croissance ✅ · SEO Audit ✅ · Assistant IA ✅ · Orchestrateur ✅

Sous-vues vérifiées : **Beds24 Nogent** ✅ (4 résa, CA 2 969€) · **Nuits min** ✅ · **Calendrier Planning** ✅ (grille gantt + prix)

---

## ✅ APIs critiques (7/7 → 200)

`agents-actions` · `social` · `beds24-bookings` · `analytics` · `google-reviews` · `weather` · `get-availability`

---

## 📌 Points d'attention (non bloquants, à voir ensemble)

1. **`/explorer` très court** (1755 caractères de contenu) — vérifier si c'est volontaire ou si du contenu manque.
2. **A/B testing prêt mais non câblé** : `src/utils/abTest.js` est déployé mais aucun composant ne l'utilise encore. Le 1er test (CTA `growth-001`) reste à activer.
3. **GA4 `booking_widget_loaded`** non ré-implémenté (nécessitait le MutationObserver retiré). La conversion réelle est captée par `booking_completed` server-side, donc impact faible.
4. **Secret GA4 + mot de passe admin** : partagés en clair dans le chat — à faire tourner par précaution.

---

## 🔧 Protections anti-régression en place

- **Smoke test post-déploiement** : tout `npm run deploy:pages` vérifie désormais home + villa + admin en 200 + bundle JS + SW kill-switch, et **bloque le deploy si ça casse**.
- **Service Worker kill-switch** : plus de cache HTML → plus d'écran blanc/404 fantôme.
- **Rotation de hash** (`window.__BUILD__`) : tout cache empoisonné devient obsolète à chaque deploy.

---

*Rapport généré automatiquement — tous les fixes sont commités et déployés en prod.*
