# Plan tracking ROI — data-049 / data-052 / data-046

> Objectif global : mesurer le ROI par canal/bien **avant** de lancer des campagnes Ads.
> Statut : PLAN À RELIRE — aucun code n'est déployé. Les snippets sont prêts à coller.
> Date : 2026-06-02

## Constat d'ancrage (état réel du code)

Ce qui existe DÉJÀ (à ne pas réinventer) :

| Brique | Fichier | Ce qu'elle fait |
|---|---|---|
| Events GA4 funnel | `src/PublicSite.jsx` | `view_item` (l.7939 + 8066), `begin_checkout` (l.2327), `purchase` (l.1388, 2061, 5687), `generate_lead` (l.4886, 6654, 6693), `select_item` (l.3086), `view_item_list` (l.7767) |
| Events GA4 délégués | `src/main.jsx` | `cta_reservation_click`, `whatsapp_click`, `calendar_open`, `date_selected`, `scroll_50/90` — tous avec `bien_id` déjà via `bienFromPath()` |
| Purchase post-Stripe | `src/Merci.jsx` l.90 | `purchase` après redirect Stripe (garde anti-double-fire) |
| A/B infra | `src/utils/abTest.js` | `ab_variant_assigned`, `ab_conversion` |
| Proxy GA4 (sessions) | `functions/api/analytics.js` | 6 rapports : overview, pages, pays, sources, devices, **bienConversions** (trafic par page bien, PAS les events de conversion) |
| Onglet GA4 | `src/tabs/AnalyticsTab.jsx` | sessions/users/bounce/pages/pays/sources/devices. **N'affiche aucun event de conversion.** |
| CPA canal "live" | `src/tabs/Pilotage.jsx` `CanalLivePerf` (l.13-115) | CA brut / commission / net / ADR par canal, **commissions Airbnb 3% / Booking 15% / Direct 0%**, basé sur `reservations` (iCal+Beds24) |
| CPA canal 2025 | `src/tabs/Pilotage.jsx` (l.124-153) | mêmes métriques depuis `REVENUS_CANAL_2025`, commissions **Airbnb 15% / Booking 17%** |
| Conversion par canal/bien | `src/tabs/ConversionTab.jsx` | part directe %, CA, nuits moy. par canal et par bien |
| RevPAR / ADR / Occ par bien | `src/tabs/Cockpit.jsx` (l.306-397) | Occ 30j, RevPAR mois, ADR par bien, occ par bien (champs `b.revpar`, `b.adr`, `b.occ`) |

⚠️ **Incohérence de taux de commission existante** : `CanalLivePerf` utilise Airbnb **3%**, le bloc 2025 utilise Airbnb **15%** + Booking **17%**. À unifier dans data-052 (constante paramétrable unique).

⚠️ **Pas de niveau tarifaire** dans les events : `view_item`/`begin_checkout`/`purchase` envoient `price` mais pas la saison ni la gamme. C'est l'objet de data-049.

⚠️ **Pas de coût marketing** nulle part : aucun des onglets ne connaît la dépense Ads. C'est le maillon manquant pour un vrai CPA. data-052 le branche.

---

## data-049 — Enrichir les events GA4 avec `bien_id` + `niveau_tarifaire`

### Principe

Ajouter 2 paramètres custom à chaque event funnel :
- `bien_id` : l'id technique du bien (`amaryllis`, `zandoli`, …). Déjà présent dans certains events main.jsx mais ABSENT des events e-commerce de PublicSite.jsx (qui mettent `item_id` à l'intérieur de `items[]` — non requêtable simplement comme dimension custom GA4).
- `niveau_tarifaire` : `basse` | `moyenne` | `haute` selon le mois du séjour (saisonnalité Martinique) **et** repli sur la gamme de prix si pas de dates.

> GA4 : pour filtrer/grouper sur ces valeurs dans les rapports, déclarer 2 **dimensions personnalisées** (scope Event) dans GA4 Admin → Custom definitions :
> - `bien_id` (param `bien_id`)
> - `niveau_tarifaire` (param `niveau_tarifaire`)

### Helper à ajouter (1 seul, réutilisé partout)

**Fichier : `src/PublicSite.jsx`** — ajouter en haut du module (près des constantes, avant le composant principal). Snippet **AVANT** : (n'existe pas). **APRÈS** :

```js
// data-049 — niveau tarifaire pour le tracking GA4 ROI
// Saisonnalité Martinique : haute nov–avr, basse mai–oct.
// Repli sur la gamme de prix du bien si aucune date de séjour n'est connue.
function niveauSaison(checkinIso) {
  if (checkinIso) {
    const m = new Date(checkinIso).getMonth() + 1; // 1-12
    if (m >= 11 || m <= 4) return "haute";   // nov, déc, jan, fév, mar, avr
    if (m === 7 || m === 8) return "moyenne"; // pic estival métropole
    return "basse";                           // mai, juin, sept, oct
  }
  return null;
}
function niveauGamme(prix) {
  const p = Number(prix) || 0;
  if (p >= 250) return "premium";
  if (p >= 150) return "intermediaire";
  return "essentiel";
}
// Renvoie un niveau lisible : saison si dates connues, sinon gamme de prix.
export function niveauTarifaire(bien, checkinIso) {
  return niveauSaison(checkinIso) || niveauGamme(bien?.prix);
}
```

### Modif 1 — `view_item` (fiche villa, bloc principal)

**Fichier : `src/PublicSite.jsx` l.7939-7942**

AVANT :
```js
      if (window.gtag) window.gtag("event", "view_item", {
        item_list_id: "villas",
        items: [{ item_id: bien.id, item_name: bien.nom, item_category: bien.lieu?.split(",")[0]?.trim() || "Martinique", price: bien.prix || 0, currency: "EUR" }],
      });
```
APRÈS :
```js
      if (window.gtag) window.gtag("event", "view_item", {
        bien_id: bien.id,
        niveau_tarifaire: niveauTarifaire(bien),
        item_list_id: "villas",
        items: [{ item_id: bien.id, item_name: bien.nom, item_category: bien.lieu?.split(",")[0]?.trim() || "Martinique", price: bien.prix || 0, currency: "EUR" }],
      });
```

### Modif 2 — `view_item` (2ᵉ occurrence, l.8066-8068)

**Fichier : `src/PublicSite.jsx` ~l.8066** — lire le bloc exact avant d'éditer (même forme que ci-dessus). Ajouter les 2 mêmes clés `bien_id` + `niveau_tarifaire` en tête de l'objet, avec `niveauTarifaire(bien)` (pas de date à ce stade).

### Modif 3 — `begin_checkout` (l.2327)

**Fichier : `src/PublicSite.jsx` l.2327**

AVANT :
```js
                      if (window.gtag) window.gtag("event", "begin_checkout", { currency: "EUR", value: total, items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights }] });
```
APRÈS :
```js
                      if (window.gtag) window.gtag("event", "begin_checkout", { bien_id: bien.id, niveau_tarifaire: niveauTarifaire(bien, checkin), currency: "EUR", value: total, items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights }] });
```
> Ici `checkin` EST dans le scope (l.2320 le passe à `generateDevis`). Le niveau reflète donc la vraie saison du séjour.

### Modif 4 — `purchase` (bloc Beds24, l.1388-1391)

**Fichier : `src/PublicSite.jsx` l.1388-1391**

AVANT :
```js
          window.gtag("event", "purchase", {
            transaction_id: paymentIntent.id, currency: "EUR", value: amount,
            items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights || 1 }],
          });
```
APRÈS :
```js
          window.gtag("event", "purchase", {
            transaction_id: paymentIntent.id, currency: "EUR", value: amount,
            bien_id: bien.id,
            niveau_tarifaire: niveauTarifaire(bien, localCheckin || checkin),
            items: [{ item_id: bien.id, item_name: bien.nom, price: bien.prix, quantity: nights || 1 }],
          });
```
> Vérifier le nom exact de la variable de date in-scope à cette ligne (`localCheckin` est utilisé l.1400 ; à confirmer en lisant 1360-1400). Si absente, mettre `niveauTarifaire(bien)`.

### Modif 5 — `purchase` (2ᵉ bloc, l.2061)

Même patch que Modif 4 sur le bloc l.2061-2064 (lire le contexte pour le nom de la variable date).

### Modif 6 — `purchase` (3ᵉ bloc minimaliste, l.5687)

**Fichier : `src/PublicSite.jsx` l.5687**

AVANT :
```js
          try { window.gtag("event", "purchase", { transaction_id: paymentIntent.id, currency: "EUR", value: total }); } catch { /* */ }
```
APRÈS :
```js
          try { window.gtag("event", "purchase", { transaction_id: paymentIntent.id, currency: "EUR", value: total, bien_id: bien?.id, niveau_tarifaire: niveauTarifaire(bien, checkin) }); } catch { /* */ }
```
> Confirmer que `bien` et `checkin` sont in-scope à l.5687 (probable : c'est un widget Beds24). Sinon réduire aux clés disponibles.

### Modif 7 — `purchase` post-Stripe (Merci.jsx)

**Fichier : `src/Merci.jsx` ~l.90** — ce bloc lit l'intent depuis l'URL après redirect Stripe ; le `bien` n'est pas forcément en mémoire. Deux options :
- **Option A (simple, recommandée)** : passer `bien_id` + `niveau_tarifaire` dans la `metadata` du PaymentIntent (`functions/api/create-payment-intent.js`) puis les relire ici depuis les query params si déjà propagés. Si pas dispo → laisser tel quel (le purchase principal est déjà tracké côté PublicSite avant redirect).
- **Option B** : ne rien changer — le `purchase` de PublicSite couvre déjà la majorité ; Merci.jsx est un filet de sécurité. Documenter qu'il n'aura pas le niveau tarifaire.

> Recommandation : Option B pour le MVP (éviter de toucher la chaîne Stripe). Noter la limite dans la doc GA4.

### Définitions GA4 à créer (manuel, hors code)

GA4 Admin → Custom definitions → Create custom dimension :
| Nom affiché | Scope | Event parameter |
|---|---|---|
| Bien | Event | `bien_id` |
| Niveau tarifaire | Event | `niveau_tarifaire` |

Sans ça, les params remontent dans les events mais ne sont pas requêtables comme dimensions dans les explorations / la Data API.

---

## data-052 — Tableau de bord CPA par canal

### Objectif

Un onglet qui répond à : **"combien me coûte une réservation par canal, tout compris (commission OTA + marketing), et quel est le net réel ?"** — le pré-requis pour décider d'investir en Ads.

### Sources de données

| Donnée | Source | Comment |
|---|---|---|
| CA brut, nuits, ADR par canal | `reservations` (contexte `useAppData`) | déjà agrégé dans `CanalLivePerf` — réutiliser la logique |
| Commission OTA | **constante paramétrable** (voir ci-dessous) | appliquée au CA brut par canal |
| Coût marketing par canal | **NOUVEAU** — Sheet `Marketing 2026` | onglet Google Sheet à créer, lu via `/api/sheets-proxy` ; fallback seed `MARKETING_SEED` |
| Réservations directes (pour CPA direct) | `reservations` filtrées `canal=direct` | compteur |
| Sessions / conversions GA4 (option) | `/api/analytics` | pour le taux de conv. du canal direct |

### Constante de commissions — UNIFIER l'existant

Créer `src/config/canauxCommissions.js` (source unique, remplace les 3 valeurs divergentes actuelles) :

```js
// data-052 — taux de commission OTA paramétrables (source unique de vérité)
// Modifiables ici sans toucher au reste du code.
export const COMMISSIONS_CANAL = {
  airbnb:  { label: "Airbnb",      taux: 0.15, color: "#FF5A5F" }, // ~3% hôte + ~12% voyageur ≈ 15% éco. réelle
  booking: { label: "Booking.com", taux: 0.16, color: "#0ea5e9" }, // 15-18% selon zone → 16% par défaut
  direct:  { label: "Direct",      taux: 0.00, color: "#10b981" }, // 0% OTA, mais coût Stripe ~1.5% + marketing
  autre:   { label: "Autre",       taux: 0.00, color: "#a855f7" },
};
export const FRAIS_STRIPE_DIRECT = 0.015; // 1,5% sur les résas directes encaissées par Stripe
```
> Ensuite : faire pointer `CanalLivePerf` (Pilotage.jsx l.15-17) et le bloc 2025 (l.134) vers cette constante pour supprimer la divergence 3%/15%/17%.

### Structure du Sheet marketing (à créer par Vincent)

Onglet `Marketing 2026` dans le Sheet `1xuhU0…`, colonnes :
`mois | canal | plateforme | depense_eur | impressions | clics | resa_attribuees`
Exemple : `2026-05 | direct | google_ads | 320 | 18000 | 240 | 6`
Le canal `direct` regroupe Google/Meta Ads qui poussent vers le site. Airbnb/Booking peuvent porter une dépense de "boost visibilité" si activé.

Exposer via une action Apps Script `getMarketing(year)` (même pattern que les autres lectures) → consommé par `/api/sheets-proxy`. **Fallback** dans le code :

```js
// src/config/marketingSeed.js — fallback si le Sheet n'est pas encore peuplé
export const MARKETING_SEED = {
  // canal: dépense marketing cumulée année en cours (€)
  direct:  0,   // à remplir : budget Google/Meta Ads
  airbnb:  0,
  booking: 0,
};
```

### Métriques calculées (par canal)

| Métrique | Formule |
|---|---|
| CA brut | Σ montant résas du canal |
| Commission OTA | CA brut × taux canal |
| Coût Stripe (direct) | CA direct × 1,5% |
| Coût marketing | depense Sheet/seed du canal |
| **Coût total acquisition** | commission + stripe + marketing |
| Net perçu | CA brut − coût total acquisition |
| Nb résas | count |
| **CPA** | coût total acquisition / nb résas |
| **CPA marketing pur** | coût marketing / nb résas (le vrai coût d'un € de pub) |
| Marge nette % | net / CA brut |

### Design de l'onglet (admin, dark theme)

Nouvel onglet `CPA Canal` (icône 💰) à brancher dans le groupe "Tableau de bord" de `src/App.jsx` (l.1228-1249, à côté de `pilotage`). 3 zones :
1. **4 KPI cards en tête** : CPA moyen pondéré · Coût marketing total · % CA en commissions · Net global.
2. **Tableau par canal** : 1 ligne/canal avec CA brut, commission, marketing, **CPA**, marge % — barre de répartition (reprendre le style `CanalLivePerf` l.79-106).
3. **Encart décision Ads** : "Pour qu'une campagne soit rentable sur le canal direct, le CPA Ads doit rester < (commission Airbnb évitée = ADR × nuits × 15%)". Calcule le seuil de rentabilité automatiquement.

### Ébauche composant — `src/tabs/CpaCanalTab.jsx`

```jsx
import { useMemo } from "react";
import { useAppData } from "../AppDataContext.jsx";
import { COMMISSIONS_CANAL, FRAIS_STRIPE_DIRECT } from "../config/canauxCommissions.js";
import { MARKETING_SEED } from "../config/marketingSeed.js";

const normalize = (c) => {
  const r = (c || "autre").toLowerCase();
  return ["direct", "airbnb", "booking"].find(x => r.includes(x)) || "autre";
};
const nightsOf = (r) =>
  r.checkin && r.checkout
    ? Math.max(0, Math.round((new Date(r.checkout) - new Date(r.checkin)) / 86400000))
    : 0;

export default function CpaCanalTab() {
  const { reservations = [], marketing, mob } = useAppData(); // marketing : à fournir via le contexte (Sheet) ou fallback

  const rows = useMemo(() => {
    const mk = marketing || MARKETING_SEED;
    const agg = {};
    reservations.forEach(r => {
      const c = normalize(r.canal);
      if (!agg[c]) agg[c] = { canal: c, brut: 0, count: 0, nights: 0 };
      agg[c].brut += Number(r.montant) || 0;
      agg[c].count += 1;
      agg[c].nights += nightsOf(r);
    });
    return Object.values(agg).map(s => {
      const conf = COMMISSIONS_CANAL[s.canal] || COMMISSIONS_CANAL.autre;
      const commission = Math.round(s.brut * conf.taux);
      const stripe = s.canal === "direct" ? Math.round(s.brut * FRAIS_STRIPE_DIRECT) : 0;
      const mkt = Math.round(Number(mk[s.canal]) || 0);
      const coutAcq = commission + stripe + mkt;
      const net = s.brut - coutAcq;
      const adr = s.nights ? Math.round(s.brut / s.nights) : 0;
      const cpa = s.count ? Math.round(coutAcq / s.count) : 0;
      const cpaMkt = s.count ? Math.round(mkt / s.count) : 0;
      const marge = s.brut ? Math.round(net / s.brut * 100) : 0;
      return { ...s, ...conf, commission, stripe, mkt, coutAcq, net, adr, cpa, cpaMkt, marge };
    }).sort((a, b) => b.brut - a.brut);
  }, [reservations, marketing]);

  const tBrut = rows.reduce((s, r) => s + r.brut, 0);
  const tMkt  = rows.reduce((s, r) => s + r.mkt, 0);
  const tComm = rows.reduce((s, r) => s + r.commission, 0);
  const tNet  = rows.reduce((s, r) => s + r.net, 0);
  const tCount = rows.reduce((s, r) => s + r.count, 0);
  const cpaMoyen = tCount ? Math.round((tComm + tMkt) / tCount) : 0;

  // Seuil de rentabilité Ads pour le canal direct :
  // une résa directe "évite" la commission Airbnb (ADR×nuits×15%).
  const airbnbTaux = COMMISSIONS_CANAL.airbnb.taux;
  const directRow = rows.find(r => r.canal === "direct");
  const seuilAds = directRow && directRow.count
    ? Math.round((directRow.brut / directRow.count) * airbnbTaux)
    : 0;

  const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" };

  if (rows.length === 0) return <div style={{ color: "#475569", fontSize: 12, padding: 16 }}>Aucune réservation — synchronisez iCal/Beds24.</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "CPA moyen pondéré", value: `${cpaMoyen}€`, color: "#f59e0b" },
          { label: "Coût marketing",    value: `${(tMkt/1000).toFixed(1)}k€`, color: "#ef4444" },
          { label: "% CA en commissions", value: tBrut ? `${Math.round(tComm/tBrut*100)}%` : "—", color: "#a855f7" },
          { label: "Net global",        value: `${(tNet/1000).toFixed(1)}k€`, color: "#10b981" },
        ].map(k => (
          <div key={k.label} style={card}>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color, fontFamily: "var(--font-mono)" }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(r => (
          <div key={r.canal} style={{ ...card }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{r.label}</span>
              <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>{r.count} résa · CPA {r.cpa}€</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
              {[
                { l: "CA brut",    v: `${r.brut.toLocaleString("fr-FR")}€`, c: "#e2e8f0" },
                { l: "Commission", v: r.commission ? `-${r.commission.toLocaleString("fr-FR")}€` : "0€", c: r.commission ? "#f87171" : "#64748b" },
                { l: "Marketing",  v: r.mkt ? `-${r.mkt.toLocaleString("fr-FR")}€` : "0€", c: r.mkt ? "#f87171" : "#64748b" },
                { l: "CPA mkt",    v: `${r.cpaMkt}€`, c: "#f59e0b" },
                { l: "Marge",      v: `${r.marge}%`, c: r.marge >= 80 ? "#10b981" : "#f59e0b" },
              ].map(k => (
                <div key={k.l}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{k.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: k.c, fontFamily: "var(--font-mono)" }}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...card, marginTop: 14, borderColor: "rgba(16,185,129,0.3)" }}>
        <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginBottom: 4 }}>🎯 Seuil de rentabilité Ads (canal direct)</div>
        <div style={{ fontSize: 12, color: "#cbd5e1" }}>
          Tant que le CPA d'une campagne Google/Meta reste sous <strong>{seuilAds}€</strong> par réservation directe,
          la pub est rentable : elle coûte moins que la commission Airbnb évitée ({Math.round(airbnbTaux*100)}% de l'ADR×nuits moyen).
        </div>
      </div>

      <div style={{ fontSize: 9, color: "#334155", marginTop: 10 }}>
        Commissions paramétrables dans src/config/canauxCommissions.js · Coûts marketing : Sheet « Marketing 2026 » (fallback seed). CPA = (commission + Stripe + marketing) / nb résas.
      </div>
    </div>
  );
}
```

### Branchements à faire dans App.jsx

1. Import en tête : `import CpaCanalTab from "./tabs/CpaCanalTab.jsx";`
2. Entrée nav dans le groupe `dashboard` (l.1228-1249), après `pilotage` :
   ```js
   { id: "cpa-canal", icon: "💰", label: "CPA Canal" },
   ```
3. Rendu de l'onglet là où les autres tabs sont rendus (chercher `tab === "pilotage"` / le switch de rendu vers l.1462+) :
   ```jsx
   {tab === "cpa-canal" && <CpaCanalTab />}
   ```
4. Alimenter `marketing` dans `AppDataContext` : lors du `syncFromSheets`, ajouter un appel `getMarketing` et exposer `marketing` dans la value du provider. À défaut, le composant retombe sur `MARKETING_SEED` automatiquement (déjà géré).

---

## data-046 — RevPAR / ADR / Occupation : ce qui existe vs les manques

### Déjà couvert (NE PAS refaire)

- **Cockpit.jsx** (l.306-397) : Occ 30j globale, RevPAR mois global, ADR + Occ **par bien** (`b.revpar`, `b.adr`, `b.occ`), score perf, RevPAR cible/réel.
- **Cockpit.jsx** (l.107-135) : alertes occupation 14j/30j par bien.
- **Pilotage / ConversionTab** : ADR par canal, part directe.

→ Le triptyque RevPAR/ADR/Occ **par bien est complet**. Ne rien dupliquer.

### Le vrai manque : overlay GA4 funnel (sessions → conversions) par bien

Le dashboard mesure le **résultat financier** (RevPAR/ADR) mais **pas l'efficacité du tunnel web** : combien de `view_item` → `begin_checkout` → `purchase` par bien, et le taux de conversion. `AnalyticsTab.jsx` n'affiche que des sessions, jamais les events de conversion. `analytics.js` ne requête PAS la dimension `eventName`.

### Ajout backend — `functions/api/analytics.js`

Ajouter un 7ᵉ rapport dans le `Promise.all` (après `bienConversions`, l.62-76) qui agrège les events funnel par bien (nécessite que la dimension custom `bien_id` de data-049 soit déclarée — sinon repli sur `eventName` global sans ventilation bien) :

```js
      // data-046 : funnel events (view_item/begin_checkout/purchase) ventilé par bien
      runReport(token, propertyId, {
        dimensions: [{ name: "eventName" }, { name: "customEvent:bien_id" }],
        metrics:    [{ name: "eventCount" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: { values: ["view_item", "begin_checkout", "purchase", "generate_lead"] },
          },
        },
      }),
```
> `customEvent:bien_id` n'est valide qu'une fois la dimension perso déclarée dans GA4 (data-049). Tant qu'elle n'existe pas, retirer cette dimension et garder juste `eventName` (funnel global, non ventilé). Ajouter la clé au destructuring du `Promise.all` et à l'objet de réponse JSON (`funnel: parseReport(funnel)`).

### Ajout frontend — `src/tabs/AnalyticsTab.jsx`

Nouvelle section "Tunnel de conversion" sous les sessions : un mini funnel horizontal view_item → begin_checkout → purchase avec taux de passage, + tableau par bien si la ventilation est dispo. Calcul du taux :

```js
const funnel = data.funnel || [];
const sumEvent = (name) => funnel.filter(r => r.eventName === name)
  .reduce((s, r) => s + (r.eventCount || 0), 0);
const vi = sumEvent("view_item"), bc = sumEvent("begin_checkout"), pu = sumEvent("purchase");
const tauxBC = vi ? Math.round(bc / vi * 100) : 0;  // intérêt → checkout
const tauxPU = bc ? Math.round(pu / bc * 100) : 0;  // checkout → achat
const tauxGlobal = vi ? (pu / vi * 100).toFixed(1) : 0;
```
Affichage : 3 cartes (view_item / begin_checkout / purchase) avec les taux entre elles, dans le style KPI existant de l'onglet.

### Pourquoi c'est le bon manque à combler

Sans ce funnel, impossible de savoir si un futur budget Ads convertit. Le CPA de data-052 mesure le coût ; ce funnel mesure **où le tunnel fuit** (ex. beaucoup de view_item mais peu de begin_checkout = problème de prix/dispo affichée, pas de trafic). Les deux ensemble = décision Ads éclairée.

---

## Résumé & quick-wins

**Fichier créé** : `docs/data/plan-tracking-roi.md` (ce document).

**Top 3 quick-wins par impact/effort** :

1. **data-049 — `bien_id` + `niveau_tarifaire` sur les events funnel** · effort ~1h (helper + 6 patchs ciblés dans PublicSite.jsx) + 5 min GA4 (déclarer 2 dimensions custom). **Impact maximal** : sans ces dimensions, aucune analyse ROI par bien/saison n'est possible côté GA4 — c'est le socle de tout le reste. À faire EN PREMIER.

2. **data-052 — Unifier les commissions + onglet CPA Canal** · effort ~2-3h (constante `canauxCommissions.js` + `CpaCanalTab.jsx` + branchement App.jsx ; le Sheet marketing peut rester à 0 au départ). **Impact fort** : donne immédiatement le seuil de rentabilité Ads et corrige l'incohérence 3%/15%/17% existante. Utilisable même avant la 1ʳᵉ campagne.

3. **data-046 — Overlay funnel GA4 dans AnalyticsTab** · effort ~1-2h (7ᵉ rapport analytics.js + section funnel). **Impact moyen-fort** : révèle où le tunnel fuit. Dépend de data-049 pour la ventilation par bien (sinon funnel global only).

**Ordre recommandé** : 049 → 052 → 046 (049 débloque la ventilation de 046 ; 052 est autonome).

**Points de vigilance relevés** :
- Incohérence taux commission Airbnb (3% vs 15%) entre `CanalLivePerf` et le bloc 2025 — à unifier via la nouvelle constante.
- Merci.jsx purchase n'aura pas `niveau_tarifaire` sans propager via metadata Stripe (Option B documentée : acceptable pour MVP).
- `customEvent:bien_id` dans analytics.js ne fonctionne qu'APRÈS déclaration de la dimension custom GA4.
