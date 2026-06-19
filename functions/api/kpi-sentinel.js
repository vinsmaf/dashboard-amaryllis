/**
 * GET /api/kpi-sentinel?secret=POSTSTAY_SECRET[&dry=1]
 * Agent sentinelle KPI — détecte les anomalies par les données, pas les dates.
 * Déclenché quotidiennement par le Worker cron 0 9 * * *.
 * Ne pousse ntfy QUE si anomalie ≥ 🟡 (anti-fatigue d'alerte).
 *
 * Signaux surveillés :
 *   - Occupation forward 30j par bien (seuil 🔴 <20% / 🟡 <40%)
 *   - Paniers abandonnés non relancés (🟡 >2)
 *   - Cautions échouées (🔴 toujours)
 *   - Semaine sans nouvelle résa directe (🟡)
 *   - RevPAR hebdo en baisse >15% (🟡)
 *
 * D1 binding : revenue_manager · Secrets : POSTSTAY_SECRET · NTFY_TOPIC
 */

import { clog, timer } from './_log.js'

const BIENS_BOOKABLES = ['amaryllis', 'zandoli', 'geko', 'mabouya', 'schoelcher', 'nogent']

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

export async function onRequestGet({ request, env }) {
  const t = timer()
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret') ?? ''
  if (env.POSTSTAY_SECRET && secret !== env.POSTSTAY_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 })
  }
  const dry = url.searchParams.get('dry') === '1'

  const db = env.revenue_manager
  const ntfyTopic = env.NTFY_TOPIC
  if (!db) return new Response(JSON.stringify({ ok: false, error: 'D1 binding manquant' }), { status: 503 })
  if (!ntfyTopic) return new Response(JSON.stringify({ ok: false, error: 'NTFY_TOPIC manquant' }), { status: 503 })

  const today = todayMTQ()
  const in30 = addDays(today, 30)
  const ago7 = addDays(today, -7)
  const ago14 = addDays(today, -14)

  const anomalies = []  // { level: 'red'|'yellow', signal, detail, suggestion }

  // ── 1. Occupation forward 30j par bien (source : rm_kpi_snapshots, calculé par le Worker)
  // Les résas OTA (Airbnb/Booking) sont incluses — contrairement à direct_bookings (résas directes seules).
  // On ignore les biens sans snapshot récent (<48h) pour éviter les faux positifs.
  try {
    const cutoff = Math.floor(Date.now() / 1000) - 48 * 3600
    const snaps = await db.prepare(
      `SELECT property_id, occupancy_rate
       FROM rm_kpi_snapshots
       WHERE period_type = '30d' AND calculated_at >= ?
       ORDER BY calculated_at DESC`
    ).bind(cutoff).all().then(r => r.results ?? [])

    // Garder uniquement le snap le plus récent par bien
    const latestByBien = {}
    for (const s of snaps) {
      if (!latestByBien[s.property_id]) latestByBien[s.property_id] = s
    }

    for (const [bienId, snap] of Object.entries(latestByBien).filter(([id]) => BIENS_BOOKABLES.includes(id))) {
      const pct = Math.round((snap.occupancy_rate ?? 0) * 100)
      if (pct < 20) {
        anomalies.push({
          level: 'red',
          signal: `Occupation ${nomBien(bienId)}`,
          detail: `${pct}% sur 30j`,
          suggestion: `Baisser le prix de 10-15% ou activer LastMinute Airbnb`,
        })
      } else if (pct < 40) {
        anomalies.push({
          level: 'yellow',
          signal: `Occupation ${nomBien(bienId)}`,
          detail: `${pct}% sur 30j (seuil 40%)`,
          suggestion: `Ouvrir des dates bloquées ou relancer Meta Ads`,
        })
      }
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'occupation', err: e.message })
  }

  // ── 2. Paniers abandonnés non relancés ──────────────────────────────────
  try {
    const carts = await db.prepare(
      `SELECT COUNT(*) as n FROM abandoned_carts
       WHERE relance_sent = 0 AND email IS NOT NULL AND email != ''`
    ).first().catch(() => null)
    const n = carts?.n ?? 0
    if (n > 2) {
      anomalies.push({
        level: 'yellow',
        signal: 'Paniers abandonnés',
        detail: `${n} non relancés`,
        suggestion: `Vérifier que le cron relance-panier (horaire) tourne bien`,
      })
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'carts', err: e.message })
  }

  // ── 3. Cautions échouées ─────────────────────────────────────────────────
  try {
    const failed = await db.prepare(
      `SELECT bien_id, prenom, amount FROM caution_schedule WHERE status = 'failed' LIMIT 5`
    ).all().then(r => r.results ?? []).catch(() => [])
    for (const f of failed) {
      anomalies.push({
        level: 'red',
        signal: `Caution échouée`,
        detail: `${nomBien(f.bien_id)} · ${f.prenom} · ${f.amount}€`,
        suggestion: `Envoyer le lien caution manuellement depuis l'onglet Cautions`,
      })
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'cautions', err: e.message })
  }

  // ── 4. Semaine sans résa directe ────────────────────────────────────────
  try {
    const recent = await db.prepare(
      `SELECT COUNT(*) as n FROM direct_bookings WHERE checkin >= ?`
    ).bind(ago7).first().catch(() => null)
    if ((recent?.n ?? 1) === 0) {
      anomalies.push({
        level: 'yellow',
        signal: 'Résas directes',
        detail: `0 nouvelle réservation en 7j`,
        suggestion: `Relancer une campagne Meta ou vérifier que le tunnel de paiement fonctionne`,
      })
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'noBooking', err: e.message })
  }

  // ── 5. RevPAR hebdo en baisse (via rm_kpi_snapshots) ───────────────────
  try {
    const snapCurrent = await db.prepare(
      `SELECT property_id, revpar_cents FROM rm_kpi_snapshots
       WHERE snapshot_date >= ? AND period_type = '30d'
       ORDER BY snapshot_date DESC LIMIT 10`
    ).bind(ago7).all().then(r => r.results ?? []).catch(() => [])

    const snapPrev = await db.prepare(
      `SELECT property_id, revpar_cents FROM rm_kpi_snapshots
       WHERE snapshot_date >= ? AND snapshot_date < ? AND period_type = '30d'
       ORDER BY snapshot_date DESC LIMIT 10`
    ).bind(ago14, ago7).all().then(r => r.results ?? []).catch(() => [])

    const prevMap = {}
    for (const s of snapPrev) prevMap[s.property_id] = s.revpar_cents

    for (const s of snapCurrent) {
      const prev = prevMap[s.property_id]
      if (!prev || !s.revpar_cents) continue
      const delta = Math.round((s.revpar_cents - prev) / prev * 100)
      if (delta <= -15) {
        anomalies.push({
          level: 'yellow',
          signal: `RevPAR ${nomBien(s.property_id)}`,
          detail: `${delta}% vs semaine précédente`,
          suggestion: `Analyser les signaux marché ou ajuster les prix conseillés`,
        })
      }
    }
  } catch (e) {
    clog('kpi-sentinel', 'warn', { step: 'revpar', err: e.message })
  }

  // ── Assemblage ───────────────────────────────────────────────────────────
  const reds = anomalies.filter(a => a.level === 'red')
  const yellows = anomalies.filter(a => a.level === 'yellow')

  clog('kpi-sentinel', anomalies.length > 0 ? 'warn' : 'info', {
    anomalies: anomalies.length, reds: reds.length, yellows: yellows.length, ms: t(),
  })

  if (anomalies.length === 0) {
    return new Response(JSON.stringify({ ok: true, anomalies: 0, dry }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }

  const lines = []
  if (reds.length > 0) {
    lines.push('🔴 CRITIQUE :\n' + reds.map(a =>
      `• ${a.signal} : ${a.detail}\n  → ${a.suggestion}`
    ).join('\n'))
  }
  if (yellows.length > 0) {
    lines.push('🟡 WATCH :\n' + yellows.map(a =>
      `• ${a.signal} : ${a.detail}\n  → ${a.suggestion}`
    ).join('\n'))
  }
  lines.push('→ https://villamaryllis.com/admin')

  const body = lines.join('\n\n')
  const title = `📊 Sentinel KPI — ${reds.length}🔴 ${yellows.length}🟡`
  const priority = reds.length > 0 ? 4 : 3

  if (dry) {
    return new Response(JSON.stringify({ ok: true, dry: true, title, priority, anomalies, body }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }

  const ntfyRes = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
    method: 'POST',
    headers: {
      Title: title,
      Priority: String(priority),
      Tags: 'chart_with_downwards_trend,rotating_light',
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body,
  })

  return new Response(JSON.stringify({
    ok: ntfyRes.ok,
    ntfyStatus: ntfyRes.status,
    anomalies: anomalies.length,
    reds: reds.length,
    yellows: yellows.length,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
