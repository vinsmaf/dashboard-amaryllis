# FLUX RÉSERVATIONS & ANNULATIONS — Amaryllis Locations
> Référence technique du pipeline complet. MAJ : 2026-06-27. **Testé et validé le 2026-06-27.**

## ✅ Statut validé (test bout-en-bout 2026-06-27)

| Canal | Ajout Sheet | Dashboard | Revenus | Annulation auto | Notif email+ntfy |
|---|---|---|---|---|---|
| **Airbnb** | ✅ via Worker hourly | ✅ | ✅ rebuild | ✅ (cancelReservations_) | ✅ Worker direct |
| **Booking.com** | ✅ via Worker hourly | ✅ | ✅ rebuild | ✅ (cancelReservations_) | ✅ Worker direct |
| **Direct Stripe** | ✅ stripe-webhook+auto-sync | ✅ | ✅ rebuild | ✅ **`deleteReservation` (1 appel)** | ✅ notify-booking |
| **Beds24 Nogent** | ✅ webhook temps réel | ✅ | ✅ rebuild | ✅ (status=Annulé → rebuild auto) | — |

**Preuve test :** résa fictive `airbnb-TEST-20260627` Zandoli Août 330€ → ajoutée (+330€), supprimée (−330€), revenus 2144→1814€ exactement.

**Règle proxy vs Worker :** `cancelReservations_` (delete + rebuild en 1 appel GAS) **timeout via /api/sheets-proxy** (CF Pages Function). Le Worker l'appelle directement via `APPS_SCRIPT_URL` → pas de timeout. `deleteReservation_` = 1 seul appel suffisant (rebuild intégré depuis 2026-06-27 @74). Pour les appels manuels Claude via curl : séparer en `deleteReservation` + `revenus2026RebuildBienApply` uniquement si `deleteReservation` timeout (rare).

## Commandes de vérification rapide (CLAUDE_SECRET requis)

```bash
SECRET="0e091781cd00c38efa118d36f46e6bccbb0d713a6918e23e"

# Vérifier une résa précise + revenus d'un bien
curl -s -X POST "https://villamaryllis.com/api/sheets-proxy" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action":"read"}' | python3 -c "
import json,sys; d=json.load(sys.stdin)
resas=d.get('reservations',[])
print(f'{len(resas)} résas totales')
# Chercher une résa spécifique :
# next((r for r in resas if 'NOM' in str(r.get('voyageur',''))), None)
z=next((b for b in d.get('biens',[]) if b.get('id')=='zandoli'),None)
if z: print('Zandoli rev jan-déc:',[round(v) for v in z.get('revenus',[])[:12]])
"

# Supprimer une ligne + rebuild revenus (2 appels séparés)
curl -s -X POST "https://villamaryllis.com/api/sheets-proxy" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action":"deleteReservation","id":"<ID-SHEET>"}'

curl -s -X POST "https://villamaryllis.com/api/sheets-proxy" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action":"revenus2026RebuildBienApply","fromMonth":<MOIS>,"bien":"<bienId>"}'
```

## 4 canaux d'entrée

### 1. Airbnb (Martinique, 6 biens)
- **Source** : iCal URL secret `AIRBNB_URL_<bienId>` (Worker)
- **Détection** : Worker cron horaire → `syncFeed()` → KV `ICAL_STORE` `{uid, checkout}`
- **Nouveau** : nouvel UID détecté → `sendNouvellesResas()` (email+ntfy) → `pushToSheets()` → GAS `addReservation_` → Sheet "Toutes les Réservations"
- **⚠️ LIMITE** : iCal Airbnb = **pas de nom, pas de prix** → row créée avec voyageur="Airbnb Guest"
- **Action requise** : bouton ✎ admin Planning → `PATCH /api/patch-booking` → `addReservation_` (update) + `rebuildRevenus2026_`
- **Annulation** : UID disparu de l'iCal + checkout futur → `sendCancellations()` → GAS `cancelReservations_` → delete row + `rebuildRevenus2026_(true, month, bienId)` → email+ntfy

### 2. Booking.com (Martinique, 6 biens)
- **Source** : iCal URL secret `BOOKING_URL_<bienId>` (Worker)
- **Flux** : identique Airbnb
- **⚠️ LIMITE** : iCal Booking = "CLOSED - Not available" ou "RESERVED" → même patch manuel ✎ requis
- **Annulation** : identique Airbnb

### 3. Direct Stripe (Martinique, tous biens sauf Iguana)
- **Source** : `villamaryllis.com` BookingModal → `/api/create-payment-intent` → Stripe
- **Paiement confirmé** : `/api/stripe-webhook` → `/api/notify-booking` → D1 `direct_bookings` + GAS `addReservation_` → Sheet + email/ntfy
- **Auto-sync Worker** : toutes les heures `fetchDirectBookingsAsEvents()` → `pushToSheets()` (idempotent, dedup par id)
- **✅ Complet** : nom, montant, email voyageur disponibles dès la résa
- **Annulation** : **MANUELLE UNIQUEMENT** — bouton ✕ admin Planning → GAS `deleteReservation_` → rebuild revenus. Remboursement Stripe = séparé (Manuel ou Stripe Dashboard)
- **Pas d'iCal** pour les résas directes → pas de détection automatique d'annulation

### 4. Beds24 (Nogent UNIQUEMENT — propId 158192)
- **Source** : webhook Beds24 temps réel → `/api/beds24-webhook`
- **Flux** : webhook reçu → purge cache dispo KV Nogent → fetch Beds24 API (résas modifiées 48h) → normalize → GAS `addReservation_` (id=`beds24-<bookingId>`) → Sheet
- **Annulation** : webhook status=`cancelled` → `addReservation_` avec statut "Annulé" (pas de delete, marqué annulé) + rebuild
- **Cron Worker** (toutes les 10 min) : `runCancelUnpaidBeds24Bookings()` → annule les résas non payées restées trop longtemps

## Pipeline GAS (Apps Script)

```
POST /api/sheets-proxy → APPS_SCRIPT_URL
  addReservation_({id, bienId, voyageur, canal, checkin, checkout, montant, statut})
    → upsert sur Sheet "Toutes les Réservations" (dedup par id String)
    → syncRevenus2026() si nouveau (mémo-based)

  cancelReservations_([{uid, bienId, canal}])
    → lit cols A+B+E pour capturer bien+mois AVANT suppression
    → delete row(s)
    → rebuildRevenus2026_(true, month, bienId) par bien/mois affecté ✅

  deleteReservation_({id})
    → lit cols A+B+E AVANT suppression (bienId + mois)
    → delete row
    → rebuildRevenus2026_(true, month, bienId) automatiquement ✅ (depuis @74, 2026-06-27)
    → retourne { ok, action, rebuilt:{bienId,year,month} }

  revenus2026RebuildBienApply({fromMonth, bien})
    → zero + recalcul idempotent depuis "Toutes les Réservations"
    → SEULE fonction sûre pour recalculer les revenus

  revenus2027RebuildBienApply({fromMonth})
    → zero + recalcul idempotent 2027 (sans filtre bienId — tous biens)
```

## Garde-fous

| Garde-fou | Statut | Détail |
|---|---|---|
| `revenus2026FromMonth(ignoreMemo:true)` | 🔴 BLOQUÉ GAS | Retourne erreur 400 — additif = double-compte |
| `cancelReservations_` utilise rebuild | ✅ ACTIF | Capture bien+mois avant delete, rebuild après |
| `patch-booking.js` utilise rebuild | ✅ ACTIF | `revenus2026RebuildBienApply`, jamais `ignoreMemo` |
| KV `{uid, checkout}` anti-faux-positifs | ✅ ACTIF | Filtre rotation UID (même préfixe) + checkout passé |
| Dedup iCal par id String | ✅ ACTIF | `beds24-<id>` stable, conversion String() côté GAS |
| `CLAUDE_SECRET` accès admin | ✅ ACTIF | Bearer token machine Claude, `_adminauth.js` prio 2 |

## Anti-patterns à ne jamais faire

- ❌ `revenus2026FromMonth(ignoreMemo:true)` = double-compte (BLOQUÉ mais ne jamais contourner)
- ❌ `syncRevenus2026()` après une annulation = additif, ne soustrait jamais
- ❌ Créer une résa Beds24 pour un bien autre que Nogent
- ❌ Modifier les revenus via `revenus2026ManualPatch_` sans avoir vérifié le Sheet d'abord
- ❌ Forcer une suppression iCal sans vérifier si c'est une rotation d'UID

## Vérification rapide (Claude peut appeler)

```bash
# Vérifier les résas D1 direct_bookings
curl -s "https://villamaryllis.com/api/sheets-proxy" \
  -H "Authorization: Bearer <CLAUDE_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"action":"getReservations","limit":20}'

# Rebuild revenus un bien / un mois
curl -s "https://villamaryllis.com/api/sheets-proxy" \
  -H "Authorization: Bearer <CLAUDE_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"action":"revenus2026RebuildBienApply","fromMonth":6,"bien":"geko"}'
```
