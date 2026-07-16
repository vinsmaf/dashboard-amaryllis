# FLUX RÉSERVATIONS & ANNULATIONS — Amaryllis Locations
> Référence technique du pipeline complet. MAJ : 2026-07-16 (audit multi-agents 24 agents,
> vérification adversariale — plusieurs affirmations ci-dessous datées 2026-06-27 se sont
> révélées fausses en creusant le code réel ; corrigées ce jour, 10 fixes déployés).

> ⚠️ **Secret retiré 2026-07-16** : ce fichier contenait un `CLAUDE_SECRET` en clair, committé
> en git depuis plusieurs commits (historique, pas juste ce fichier) — signalé à Vincent comme
> finding sécurité, **à faire tourner** (rotation) indépendamment du nettoyage de ce doc. Ne
> plus jamais coller de secret réel dans `.memory/` (versionné) — toujours `grep .dev.vars`
> à la demande, ou pointer vers la variable d'env sans révéler sa valeur.

## ✅ Statut réel (vérifié en live 2026-07-16, pas juste lu dans le code)

| Canal | Ajout Sheet | Annulation → Sheet | Cache dispo purgé |
|---|---|---|---|
| **Airbnb** | ✅ Worker */10min | ✅ **fixé 2026-07-16** — était cassé depuis toujours (POST direct hors sheets-proxy + `LBL2ID` non déclaré = ReferenceError certain, ne faisait RIEN en pratique) | ✅ fixé 2026-07-16 |
| **Booking.com** | ✅ Worker */10min (scrape auto nom/prix, cf. `docs/booking-sync.md`) | ✅ **fixé 2026-07-16** (même bug qu'Airbnb) | ✅ fixé 2026-07-16 |
| **Direct Stripe** | ✅ push immédiat au paiement (`context.waitUntil`, fixé 2026-07-16 — avant : jusqu'à 10min via cron seul) | ✅ **fixé 2026-07-16** — `cancel-booking.js` ne touchait jamais le Sheet (ligne restait "Confirmé" pour toujours, revenus gonflés en permanence). Mécanisme : upsert status="Annulé" (PAS un delete, contrairement à ce que ce doc affirmait avant), puis rebuild revenus idempotent | ✅ fixé 2026-07-16 |
| **Beds24 Nogent** | ✅ webhook temps réel | ✅ déjà fonctionnel avant l'audit | ✅ déjà fonctionnel (seul canal protégé avant l'audit) |

**Cadence réelle du cron Worker : `*/10 * * * *` (10 minutes), pas "hourly"/"15min"** — ce doc
affirmait les deux à différents endroits avant sa correction ; source de vérité = `wrangler.toml`.

## Trigger sync manuel (CLAUDE_SECRET requis — voir .dev.vars, jamais coller la valeur ici)

```bash
SECRET=$(grep -m1 '^CLAUDE_SECRET' .dev.vars | cut -d= -f2- | tr -d '"')

# Force re-sync D1 direct_bookings → GAS Sheet (sans attendre le cron 10min)
curl -s -X POST "https://villamaryllis.com/api/trigger-sync" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"direct"}'
# → { ok: true, type:"direct", results:{ direct:{ ok:true, synced:N, gas:{...} } } }

# Full sync (direct + iCal Worker) si WORKER_SYNC_URL configuré dans Cloudflare Pages
curl -s -X POST "https://villamaryllis.com/api/trigger-sync" \
  -H "Authorization: Bearer $SECRET" \
  -d '{"type":"full"}'
```

**Quand utiliser :** dépannage/vérification manuelle uniquement — depuis 2026-07-16, une résa
Stripe pousse déjà immédiatement au Sheet au moment du paiement (best-effort), ce trigger n'est
plus indispensable pour ce cas précis. Reste utile si le push immédiat a échoué (le cron */10min
rattrape aussi automatiquement).

## 4 canaux d'entrée

### 1. Airbnb (Martinique, 6 biens)
- **Source** : iCal URL secret `ICAL_AIRBNB_<bienId>` / `ICAL_<bienId>` (Worker)
- **Détection** : Worker cron */10min → `syncFeed()` → KV `ICAL_STORE` `{uid, checkout}`
- **Nouveau** : nouvel UID détecté → `sendNouvellesResas()` (email+ntfy) → `pushToSheets()` → GAS `importAllReservations_` → Sheet "Toutes les Réservations". Cache dispo (`avail_<bienId>`) purgé au passage (2026-07-16).
- **⚠️ LIMITE** : iCal Airbnb = **pas de nom, pas de prix** → row créée avec voyageur placeholder, enrichie ensuite via `enrich-from-emails.js` (parse les confirmations email)
- **Annulation** : UID disparu de l'iCal + checkout futur → `sendCancellations()` → `/api/sheets-proxy` (GET paginé, PAS un POST direct) → GAS `cancelReservations_` → delete row + `rebuildRevenus2026_/2027_` par bien/mois affecté → email+ntfy. **Fonctionnel depuis 2026-07-16** (cassé avant, cf. tableau ci-dessus).

### 2. Booking.com (Martinique, 6 biens)
- **Source** : iCal URL secret `ICAL_BOOKING_<bienId>` (Worker) — bloque uniquement les dates, jamais nom/prix
- **Enrichissement nom+prix** : scrape automatique serveur (`scrapeBookingDetails()`, timeout 12s depuis 2026-07-16), voir `docs/booking-sync.md` pour le détail complet et le rafraîchissement du token de session
- **Annulation** : identique Airbnb

### 3. Direct Stripe (Martinique, tous biens sauf Iguana)
- **Source** : `villamaryllis.com` BookingModal → `/api/create-payment-intent` → Stripe
- **Paiement confirmé** : `/api/stripe-webhook` → D1 `direct_bookings` (`storeDirectBooking`) + push Sheet immédiat (`context.waitUntil`, best-effort) + purge cache dispo
- **Auto-sync Worker (filet de sécurité)** : `*/10 * * * *` → `fetchDirectBookingsAsEvents()` → `pushToSheets()` (idempotent, dedup par id `direct-<pi>`)
- **Annulation** : `/api/cancel-booking` (admin) → remboursement Stripe optionnel + libération caution + annulation Beds24 si Nogent + D1 `status='cancelled'` + purge cache dispo + **push Sheet status="Annulé"** (upsert via `importAllReservations`, PAS un delete) + rebuild revenus. Tout depuis 2026-07-16 — avant, seul le D1 était mis à jour, le Sheet restait "Confirmé" indéfiniment.

### 4. Beds24 (Nogent UNIQUEMENT — propId 158192)
- **Source** : webhook Beds24 temps réel → `/api/beds24-webhook` — SEUL chemin d'écriture Sheet pour Nogent (pas d'iCal, pas de polling de secours)
- **Flux** : webhook reçu → purge cache dispo KV Nogent → fetch Beds24 API (résas modifiées 48h) → normalize → `/api/sheets-proxy` (`importAllReservations`) → Sheet
- **Annulation** : webhook status=`cancelled` → statut "Annulé" (pas de delete) + rebuild
- **Cron Worker (*/10min)** : `runCancelUnpaidBeds24Bookings()` annule les résas Beds24 `status="new"` âgées ≥4h — **protégé depuis 2026-07-16** contre l'annulation d'une résa réellement payée (croise `direct_bookings.beds24_booking_id`, alerte ntfy si une résa payée est trouvée "new")

## Pipeline GAS (Apps Script) — toutes les écritures protégées par LockService depuis 2026-07-16

```
POST /api/sheets-proxy → GET paginé vers APPS_SCRIPT_URL (contourne le bug redirect Google,
                          bug RESA-001 : un POST direct perd son body, doGet() tombe sur son
                          action par défaut "read" — piège qui a cassé cancelReservations_
                          côté Airbnb/Booking pendant des mois, jamais détecté avant l'audit)

  importAllReservations_({id, bienId, voyageur, canal, checkin, checkout, montant, status})
    → LockService.tryLock(10s) → upsert sur Sheet "Toutes les Réservations" (dedup par id String)
    → statut "Annulé" = juste une valeur de champ (PAS un delete) → colore la ligne en rose

  cancelReservations_([{uid, bienId, canal}])
    → LockService.tryLock(10s) → lit cols A+B+E pour capturer bien+mois AVANT suppression
    → delete row(s) → rebuildRevenus2026_/2027_(true, month, bienId) par bien/mois affecté

  deleteReservation_({id})
    → LockService.tryLock(10s) → lit cols A+B+E AVANT suppression (bienId + mois)
    → delete row → rebuildRevenus2026_(true, month, bienId) automatiquement
    → retourne { ok, action, rebuilt:{bienId,year,month} }

  revenus2026RebuildBienApply({fromMonth, bien}) / revenus2027RebuildBienApply({fromMonth})
    → zero + recalcul idempotent depuis "Toutes les Réservations"
    → SEULE fonction sûre pour recalculer les revenus — jamais ignoreMemo:true (additif, double-compte)
```

## Garde-fous

| Garde-fou | Statut | Détail |
|---|---|---|
| `revenus2026FromMonth(ignoreMemo:true)` | 🔴 BLOQUÉ GAS | Retourne erreur 400 — additif = double-compte |
| `cancelReservations_`/`deleteReservation_`/`importAllReservations_` utilisent rebuild | ✅ ACTIF | Capture bien+mois avant écriture, rebuild après |
| KV `{uid, checkout}` anti-faux-positifs | ✅ ACTIF | Filtre rotation UID (même préfixe) + checkout passé |
| Dedup Sheet par id String | ✅ ACTIF | `beds24-<id>`/`direct-<pi>` stable, conversion String() côté GAS |
| Cache dispo purgé à chaque résa/annulation | ✅ ACTIF (2026-07-16) | Les 4 canaux purgent `avail_<bienId>` (KV) — avant, seul Nogent le faisait |
| LockService sur les 4 écritures Sheet | ✅ ACTIF (2026-07-16) | `tryLock(10s)`, jamais de throw non catché, `{locked:true}` explicite si contention |
| `direct_bookings.beds24_booking_id` | ✅ ACTIF (2026-07-16) | Empêche l'annulation auto d'une résa Nogent réellement payée |
| `CLAUDE_SECRET` accès admin | ✅ ACTIF | Bearer token machine Claude — **jamais coller sa valeur dans un fichier versionné**, toujours `grep .dev.vars` |

## Anti-patterns à ne jamais faire

- ❌ `revenus2026FromMonth(ignoreMemo:true)` = double-compte (BLOQUÉ mais ne jamais contourner)
- ❌ `syncRevenus2026()` après une annulation = additif, ne soustrait jamais
- ❌ Créer une résa Beds24 pour un bien autre que Nogent
- ❌ Modifier les revenus via `revenus2026ManualPatch_` sans avoir vérifié le Sheet d'abord
- ❌ Forcer une suppression iCal sans vérifier si c'est une rotation d'UID
- ❌ POSTer directement vers `APPS_SCRIPT_URL` (bug RESA-001) — toujours passer par `/api/sheets-proxy`
- ❌ Coller un secret réel (CLAUDE_SECRET, POSTSTAY_SECRET...) en clair dans un fichier `.memory/` versionné
