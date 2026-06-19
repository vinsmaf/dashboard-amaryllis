/**
 * GET /api/kpi-sentinel?secret=POSTSTAY_SECRET[&dry=1]
 * Agent sentinelle KPI — détecte les anomalies par les données, pas les dates.
 * Déclenché quotidiennement par le Worker cron 0 9 * * *.
 * Ne pousse ntfy QUE si anomalie ≥ 🟡 (anti-fatigue d'alerte).
 *
 * Axe 3 — Feedback loop : IDs stables par signal+date → acks done/ignore filtrent 7j.
 * Axe 4 — Mémoire saisonnière : calendar Martinique (signaux 6) + vs historique (signal 7).
 *
 * Signaux :
 *   1. Occupation forward 30j par bien (🔴 <20% / 🟡 <40%) — source rm_kpi_snapshots
 *   2. Paniers abandonnés non relancés (🟡 >2)
 *   3. Cautions échouées (🔴)
 *   4. Semaine sans résa directe (🟡)
 *   5. RevPAR (30j glissant) en baisse >15% en 7j (🟡)
 *   6. Transition saisonnière Martinique dans ≤14j (🟡)
 *   7. Occupation sous la moyenne historique même mois de ≥20pts (🟡 — seasonal_memory)
 *   8. Pipeline éditorial vide (<3 posts drafted/approved dans 14j) (🟡)
 *
 * D1 binding : revenue_manager · Secrets : POSTSTAY_SECRET · NTFY_TOPIC
 */

import { clog, timer } from './_log.js'
import { DDL_SUGGESTION_ACKS } from './_schema.js'

const BIENS_BOOKABLES = ['amaryllis', 'zandoli', 'geko', 'mabouya', 'schoelcher', 'nogent']

// Transitions saisonnières Martinique (MM-DD → date de début de nouvelle saison)
const TRANSITIONS = [
  { mmdd: '12-01', direction: 'entrée', label: 'saison haute hiver (Noël → Pâques)' },
  { mmdd: '05-01', direction: 'sortie', label: 'basse saison printemps' },
  { mmdd: '07-01', direction: 'entrée', label: 'saison haute été (juil-août)' },
  { mmdd: '09-01', direction: 'sortie', label: 'basse saison automne' },
]

const DDL_ACKS = DDL_SUGGESTION_ACKS

function todayMTQ() {
  const now = new Date()
  return new Date(now.getTime() - 4 * 3600 * 1000).toISOString().slice(0, 10)
}

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

function nomBien(id) {
  const n = { amaryllis: 'Amaryllis', zandoli: 'Zandoli', geko: 'Géko', mabouya: 'Mabouya', schoelcher: 'Schœlcher', nogent: 'Nogent' }
  return n[id] ?? id
}

function ackId(signal, today) {
  const slug = signal.toLowerCase()
    .replace(/[àáâ]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[îï]/g, 'i')
    .replace(/[ôõ]/g, 'o').replace(/[ùûü]/g, 'u').replace(/ç/g, 'c').replace(/œ/g, 'oe')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${slug}-${today}`
}

function ackUrl(base, id, status, signal) {
  return `${base}/api/ack-suggestion?id=${encodeURIComponent(id)}&status=${status}&signal=${encodeURIComponent(signal)}`
}

function ntfyActions(base, id, signal) {
  return [
    `http, Fait ✅, ${ackUrl(base, id, 'done', signal)}, method=GET, clear=true`,
    `http, Ignorer, ${ackUrl(base, id, 'ignore', signal)}, method=GET, clear=true`,
    `http, Plus tard, ${ackUrl(base, id, 'later', signal)}, method=GET, clear=true`,
  ].join('; ')
}

function daysUntil(todayIso, mmdd) {
  const year = parseInt(todayIso.slice(0, 4))
  let candidate = `${year}-${mmdd}`
  if (candidate <= todayIso) candidate = `${year + 1}-${mmdd}`
  const [cy, cm, cd] = candidate.split('-').map(Number)
  const [ty, tm, td] = todayIso.split('-').map(Number)
  const diff = new Date(Date.UTC(cy, cm - 1, cd)) - new Date(Date.UTC(ty, tm - 1, td))
  return Math.round(diff / 86400000)
}

export async function onRequestGet({ request, env }) {
  const t = timer()
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret') ?? ''
  if (!env.POSTSTAY_SECRET || secret !== env.POSTSTAY_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 })
  }
  const dry = url.searchParams.get('dry') === '1'
  const siteUrl = env.SITE_URL || 'https://villamaryllis.com'

  const db = env.revenue_manager
  const ntfyTopic = env.NTFY_TOPIC
  if (!db) return new Response(JSON.stringify({ ok: false, error: 'D1 binding manquant' }), { status: 503 })
  if (!ntfyTopic) return new Response(JSON.stringify({ ok: false, error: 'NTFY_TOPIC manquant' }), { status: 503 })

  const today = todayMTQ()
  const ago7 = addDays(today, -7)
  const ago14 = addDays(today, -14)

  // ── Feedback loop : lire les acks existants (7j) ────────────────────────
  await db.prepare(DDL_ACKS).run().catch(e =>
    clog('kpi-sentinel', 'warn', { step: 'ddl-acks', err: e.message })
  )
  const acksRows = await db.prepare(
    `SELECT id, status FROM suggestion_acks WHERE acked_at >= ?`
  ).bind(ago7).all().then(r => r.results ?? []).catch(e => { clog('kpi-sentinel', 'error', { step: 'read-acks', err: e.message }); return [] })
  const acksMap = {}
  for (const row of acksRows) acksMap[row.id] = row.status

  const anomalies = []  // { level, signal, detail, suggestion, id }

  // latestByBien partagé entre signal 1 (seuils absolus) et signal 7 (vs historique)
  let latestByBien = {}

  // ── 1. Occupation forward 30j par bien (source : rm_kpi_snapshots) ─────
  // Résas OTA incluses — contrairement à direct_bookings (direct only).
  // Snapshot < 48h obligatoire pour éviter faux positifs.
  try {
    const cutoff = Math.floor(Date.now() / 1000) - 48 * 3600
    const snaps = await db.prepare(
      `SELECT property_id, occupancy_rate
       FROM rm_kpi_snapshots
       WHERE period_type = '30d' AND calculated_at >= ?
       ORDER BY calculated_at DESC`
    ).bind(cutoff).all().then(r => r.results ?? [])

    for (const s of snaps) {
      if (!latestByBien[s.property_id]) latestByBien[s.property_id] = s
    }

    // Watchdog: si des biens bookables n'ont pas de snapshot récent (<48h),
    // le Worker cron est probablement en panne → signal rouge pour éviter un faux "ok".
    const missingBiens = BIENS_BOOKABLES.filter(id => !latestByBien[id])
    if (missingBiens.length > 0) {
      anomalies.push({
        level: 'red',
        signal: 'Snapshots manquants',
        detail: `${missingBiens.length} bien(s) sans données récentes : ${missingBiens.map(nomBien).join(', ')}`,
        suggestion: `Vérifier que le Worker cron runOccupancySnapshot tourne bien (GET <worker>/occupancy-snapshot)`,
        id: ackId('snapshots-manquants', today),
      })
    }

    for (const [bienId, snap] of Object.entries(latestByBien).filter(([id]) => BIENS_BOOKABLES.includes(id))) {
      const pct = Math.round((snap.occupancy_rate ?? 0) * 100)
      if (pct < 20) {
        anomalies.push({
          level: 'red',
          signal: `Occupation ${nomBien(bienId)}`,
          detail: `${pct}% sur 30j`,
          suggestion: `Baisser le prix de 10-15% ou activer LastMinute Airbnb`,
          id: ackId(`occupation-${bienId}`, today),
        })
      } else if (pct < 40) {
        anomalies.push({
          level: 'yellow',
          signal: `Occupation ${nomBien(bienId)}`,
          detail: `${pct}% sur 30j (seuil 40%)`,
          suggestion: `Ouvrir des dates bloquées ou relancer Meta Ads`,
          id: ackId(`occupation-${bienId}`, today),
        })
      }
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'occupation', err: e.message })
  }

  // ── 2. Paniers abandonnés non relancés ──────────────────────────────────
  try {
    const carts = await db.prepare(
      `SELECT COUNT(*) as n FROM abandoned_carts WHERE relance_sent = 0 AND email IS NOT NULL AND email != ''`
    ).first().catch(() => null)
    const n = carts?.n ?? 0
    if (n > 2) {
      anomalies.push({
        level: 'yellow',
        signal: 'Paniers abandonnés',
        detail: `${n} non relancés`,
        suggestion: `Vérifier que le cron relance-panier (horaire) tourne bien`,
        id: ackId('paniers-abandonnes', today),
      })
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'carts', err: e.message })
  }

  // ── 3. Cautions échouées ─────────────────────────────────────────────────
  try {
    const failed = (await db.prepare(
      `SELECT bien_id, prenom, amount, checkout FROM caution_schedule WHERE status = 'failed' LIMIT 5`
    ).all()).results ?? []
    for (const f of failed) {
      anomalies.push({
        level: 'red',
        signal: `Caution échouée`,
        detail: `${nomBien(f.bien_id)} · ${f.prenom} · ${f.amount}€`,
        suggestion: `Envoyer le lien caution manuellement depuis l'onglet Cautions`,
        id: ackId(`caution-${f.bien_id}-${f.prenom ?? f.checkout ?? f.amount ?? 'x'}`, today),
      })
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'cautions', err: e.message })
  }

  // ── 4. Semaine sans résa directe ────────────────────────────────────────
  try {
    const recent = await db.prepare(
      `SELECT COUNT(*) as n FROM direct_bookings WHERE created_at >= ?`
    ).bind(ago7).first().catch(() => null)
    if ((recent?.n ?? 1) === 0) {
      anomalies.push({
        level: 'yellow',
        signal: 'Résas directes',
        detail: `0 nouvelle réservation en 7j`,
        suggestion: `Relancer une campagne Meta ou vérifier que le tunnel de paiement fonctionne`,
        id: ackId('resas-directes-zero', today),
      })
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'noBooking', err: e.message })
  }

  // ── 5. RevPAR hebdo en baisse >15% (via rm_kpi_snapshots) ───────────────
  try {
    const snapCurrent = await db.prepare(
      `SELECT property_id, revpar_cents FROM rm_kpi_snapshots
       WHERE snapshot_date >= ? AND period_type = '30d'
       ORDER BY snapshot_date DESC LIMIT 100`
    ).bind(ago7).all().then(r => r.results ?? []).catch(() => [])

    const snapPrev = await db.prepare(
      `SELECT property_id, revpar_cents FROM rm_kpi_snapshots
       WHERE snapshot_date >= ? AND snapshot_date < ? AND period_type = '30d'
       ORDER BY snapshot_date DESC LIMIT 100`
    ).bind(ago14, ago7).all().then(r => r.results ?? []).catch(() => [])

    // Keep only the most recent row per bien (rows are ordered DESC)
    const prevMap = {}
    for (const s of snapPrev) {
      if (!(s.property_id in prevMap)) prevMap[s.property_id] = s.revpar_cents
    }

    const seenCurrent = {}
    for (const s of snapCurrent) {
      if (seenCurrent[s.property_id]) continue  // keep first (newest) only
      seenCurrent[s.property_id] = true
      const prev = prevMap[s.property_id]
      if (!prev || !s.revpar_cents) continue
      const delta = Math.round((s.revpar_cents - prev) / prev * 100)
      if (delta <= -15) {
        anomalies.push({
          level: 'yellow',
          signal: `RevPAR ${nomBien(s.property_id)}`,
          detail: `${delta}% (30j glissant) vs semaine précédente`,
          suggestion: `Analyser les signaux marché ou ajuster les prix conseillés`,
          id: ackId(`revpar-${s.property_id}`, today),
        })
      }
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'revpar', err: e.message })
  }

  // ── 6. Transition saisonnière Martinique dans ≤14j ───────────────────────
  for (const tr of TRANSITIONS) {
    const days = daysUntil(today, tr.mmdd)
    if (days >= 1 && days <= 14) {
      const icon = tr.direction === 'entrée' ? '🌴' : '📉'
      anomalies.push({
        level: 'yellow',
        signal: `Saisonnalité`,
        detail: `${icon} ${days}j → ${tr.label}`,
        suggestion: tr.direction === 'entrée'
          ? `Réviser les prix à la hausse et vérifier la disponibilité des créneaux`
          : `Anticiper la baisse de demande — ajuster les prix pour maintenir le flux`,
        id: ackId(`saison-${tr.mmdd}`, today),
      })
    }
  }

  // ── 7. Occupation sous la moyenne historique même mois ≥20pts ────────────
  // Nécessite seasonal_memory (buildée le 1er du mois par seasonal-update).
  // Graceful : pas de signal si table vide ou données insuffisantes.
  try {
    const currentMonth = parseInt(today.slice(5, 7))
    const histRows = await db.prepare(
      `SELECT property_id, avg_occupancy FROM seasonal_memory
       WHERE month = ? AND snapshot_count >= 7`
    ).bind(currentMonth).all().then(r => r.results ?? []).catch(() => [])

    for (const hist of histRows) {
      if (!BIENS_BOOKABLES.includes(hist.property_id)) continue
      const snap = latestByBien[hist.property_id]
      if (!snap?.occupancy_rate) continue
      const currentPct = Math.round((snap.occupancy_rate ?? 0) * 100)
      const histPct = Math.round((hist.avg_occupancy ?? 0) * 100)
      const delta = currentPct - histPct
      if (delta <= -20) {
        anomalies.push({
          level: 'yellow',
          signal: `Historique ${nomBien(hist.property_id)}`,
          detail: `${currentPct}% vs moy. ${histPct}% même mois (${delta}pts)`,
          suggestion: `Performance sous la moyenne historique — vérifier prix et disponibilité`,
          id: ackId(`hist-${hist.property_id}`, today),
        })
      }
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'historical', err: e.message })
  }

  // ── 8. Pipeline éditorial vide dans les 14 prochains jours ──────────────
  try {
    const editRow = await db.prepare(
      `SELECT COUNT(*) as n FROM editorial_calendar
       WHERE scheduled_at >= unixepoch('now')
         AND scheduled_at <= unixepoch('now','+14 days')
         AND status IN ('drafted','approved')`
    ).first().catch(() => null)
    const nEdit = editRow?.n ?? null
    if (nEdit !== null && nEdit < 3) {
      anomalies.push({
        level: 'yellow',
        signal: 'Calendrier éditorial',
        detail: `${nEdit} post${nEdit !== 1 ? 's' : ''} drafted/approved dans les 14j`,
        suggestion: `Vérifier que le cron éditorial (0 12 * * *) et le LLM draft-gen tournent bien`,
        id: ackId('editorial-pipeline-vide', today),
      })
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'editorial', err: e.message })
  }

  // ── Filtrer les anomalies déjà ackées (done/ignore dans les 7j) ─────────
  const yellowGroupId = ackId('yellow-group', today)
  const yellowGroupStatus = acksMap[yellowGroupId]

  const reds = anomalies.filter(a => {
    if (a.level !== 'red') return false
    const s = acksMap[a.id]
    return s !== 'done' && s !== 'ignore'
  })
  const yellows = anomalies.filter(a => {
    if (a.level !== 'yellow') return false
    if (yellowGroupStatus === 'done' || yellowGroupStatus === 'ignore') return false
    const s = acksMap[a.id]
    return s !== 'done' && s !== 'ignore'
  })

  const nbAcked = anomalies.length - (reds.length + yellows.length)
  clog('kpi-sentinel', (reds.length + yellows.length) > 0 ? 'warn' : 'info', {
    raw: anomalies.length, reds: reds.length, yellows: yellows.length, acked: nbAcked, ms: t(),
    redSignals: reds.map(a => a.signal),
    yellowSignals: yellows.map(a => a.signal),
    ackedIds: Object.keys(acksMap),
  })

  if (reds.length === 0 && yellows.length === 0) {
    return new Response(JSON.stringify({ ok: true, anomalies: 0, acked: nbAcked, dry }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }

  if (dry) {
    return new Response(JSON.stringify({ ok: true, dry: true, reds, yellows, yellowGroupId, acksMap }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }

  const ntfySent = []

  // ── 1 notification individuelle par 🔴 avec 3 boutons d'action ──────────
  for (const a of reds) {
    const body = `${a.detail}\n→ ${a.suggestion}`
    const res = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
      method: 'POST',
      headers: {
        Title: `🔴 ${a.signal}`,
        Priority: '4',
        Tags: 'rotating_light',
        Actions: ntfyActions(siteUrl, a.id, a.signal),
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body,
    })
    ntfySent.push({ id: a.id, signal: a.signal, level: 'red', status: res.status })
    if (!res.ok) clog('kpi-sentinel', 'error', { step: 'ntfy-red', id: a.id, status: res.status })
  }

  // ── 1 notification groupée pour tous les 🟡 + bouton "Ignorer tout" ─────
  if (yellows.length > 0) {
    const lines = yellows.map(a => `• ${a.signal} : ${a.detail}\n  → ${a.suggestion}`)
    lines.push('→ https://villamaryllis.com/admin')
    const res = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
      method: 'POST',
      headers: {
        Title: `🟡 ${yellows.length} signal${yellows.length > 1 ? 's' : ''} Watch`,
        Priority: '3',
        Tags: 'chart_with_downwards_trend',
        Actions: `http, Ignorer tout 🟡, ${ackUrl(siteUrl, yellowGroupId, 'ignore', 'yellow-group')}, method=GET, clear=true`,
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: lines.join('\n\n'),
    })
    ntfySent.push({ id: yellowGroupId, signal: 'yellow-group', level: 'yellow', status: res.status })
    if (!res.ok) clog('kpi-sentinel', 'error', { step: 'ntfy-yellow', id: yellowGroupId, status: res.status })
  }

  return new Response(JSON.stringify({
    ok: true,
    anomalies: reds.length + yellows.length,
    acked: nbAcked,
    reds: reds.length,
    yellows: yellows.length,
    sent: ntfySent,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
