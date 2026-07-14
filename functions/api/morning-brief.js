/**
 * GET /api/morning-brief?secret=POSTSTAY_SECRET[&dry=1]
 * Brief matinal locatif envoyé via ntfy à 6h Martinique (10:00 UTC).
 * Déclenchement : cron-job.org ou Worker cron — GET ?secret=POSTSTAY_SECRET
 *
 * Contenu :
 *   - Arrivées du jour (direct_bookings)
 *   - Départs du jour (direct_bookings)
 *   - Cautions en attente (caution_schedule)
 *   - Occupation cette semaine (nb biens occupés / 7 disponibles)
 *   - Revenus résas directes mois en cours
 *   - Posts éditoriaux planifiés aujourd'hui
 *
 * Secrets : POSTSTAY_SECRET · NTFY_TOPIC
 * D1 binding : DB (revenue_manager)
 */

import { clog, timer } from './_log.js'

const BIENS_TOTAL = 6  // biens bookables (Iguana = bail long → exclu)

function todayMTQ() {
  // Martinique = UTC-4
  const now = new Date()
  const mtq = new Date(now.getTime() - 4 * 3600 * 1000)
  return mtq.toISOString().slice(0, 10)
}

function jourFr(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const mois = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  return `${jours[dt.getDay()]} ${d} ${mois[m - 1]}`
}

function dateToUnix(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return Math.floor(new Date(Date.UTC(y, m - 1, d)) / 1000)
}

function addDays(isoDate, n) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

function nomBien(id, nom) {
  if (nom) return nom
  return id ? id.charAt(0).toUpperCase() + id.slice(1) : '?'
}

export async function onRequestGet({ request, env }) {
  const t = timer()
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret') ?? ''
  if (!env.POSTSTAY_SECRET || secret !== env.POSTSTAY_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 })
  }
  const dry = url.searchParams.get('dry') === '1'

  const db = env.revenue_manager
  const ntfyTopic = env.NTFY_TOPIC
  if (!ntfyTopic) return new Response(JSON.stringify({ ok: false, error: 'NTFY_TOPIC manquant' }), { status: 503 })
  if (!db) return new Response(JSON.stringify({ ok: false, error: 'D1 binding manquant' }), { status: 503 })

  const today = todayMTQ()
  const tomorrow = addDays(today, 1)
  const weekEnd = addDays(today, 7)
  const monthStart = today.slice(0, 7) + '-01'
  const monthEnd = today.slice(0, 7) + '-' + String(new Date(Date.UTC(
    parseInt(today.slice(0, 4)), parseInt(today.slice(5, 7)), 0
  )).getUTCDate())

  const lines = []
  let priority = 3
  let actionLine = ''
  const errors = []
  let dbErrors = 0

  // ── Arrivées du jour ─────────────────────────────────────────────────────
  const arrivals = await db.prepare(
    `SELECT prenom, bien_nom, bien_id, nb_guests, total FROM direct_bookings WHERE checkin = ? AND (status IS NULL OR status != 'cancelled') ORDER BY bien_id`
  ).bind(today).all().then(r => r.results ?? []).catch(e => { clog('morning-brief', 'warn', { step: 'arrivals', err: e?.message }); errors.push('arrivals'); dbErrors++; return [] })

  // ── Départs du jour ──────────────────────────────────────────────────────
  const departures = await db.prepare(
    `SELECT prenom, bien_nom, bien_id FROM direct_bookings WHERE checkout = ? AND (status IS NULL OR status != 'cancelled') ORDER BY bien_id`
  ).bind(today).all().then(r => r.results ?? []).catch(e => { clog('morning-brief', 'warn', { step: 'departures', err: e?.message }); errors.push('departures'); dbErrors++; return [] })

  // ── Cautions en attente / échouées ───────────────────────────────────────
  const cautionsPending = await db.prepare(
    `SELECT prenom, bien_id, amount, status, checkout FROM caution_schedule WHERE status IN ('pending','failed') ORDER BY checkout ASC LIMIT 10`
  ).all().then(r => r.results ?? []).catch(e => { clog('morning-brief', 'warn', { step: 'cautionsPending', err: e?.message }); errors.push('cautions'); dbErrors++; return [] })

  // ── Occupation forward 7j (nb jours-biens occupés) ───────────────────────
  const occupiedRows = await db.prepare(
    `SELECT DISTINCT bien_id FROM direct_bookings WHERE checkin < ? AND checkout > ? AND (status IS NULL OR status != 'cancelled')`
  ).bind(weekEnd, today).all().then(r => r.results ?? []).catch(e => { clog('morning-brief', 'warn', { step: 'occupiedRows', err: e?.message }); errors.push('occupancy'); dbErrors++; return [] })

  // ── Revenus résas directes — mois en cours ────────────────────────────────
  const monthRevenue = await db.prepare(
    `SELECT SUM(total) as total, COUNT(*) as nb FROM direct_bookings WHERE checkin >= ? AND checkin <= ? AND (status IS NULL OR status != 'cancelled')`
  ).bind(monthStart, monthEnd).first().catch(e => { clog('morning-brief', 'warn', { step: 'monthRevenue', err: e?.message }); errors.push('revenue'); dbErrors++; return null })

  // ── Posts éditoriaux du jour ─────────────────────────────────────────────
  const todayUnix = dateToUnix(today)
  const tomorrowUnix = dateToUnix(tomorrow)
  const todayPosts = await db.prepare(
    `SELECT bien_id, theme, platform, status FROM editorial_calendar WHERE scheduled_at >= ? AND scheduled_at < ? ORDER BY bien_id`
  ).bind(todayUnix, tomorrowUnix).all().then(r => r.results ?? []).catch(e => { clog('morning-brief', 'warn', { step: 'todayPosts', err: e?.message }); errors.push('editorial'); dbErrors++; return [] })

  // ── Agents fleet — alertes ouvertes (48h) ────────────────────────────────
  const agentAlerts = await db.prepare(
    `SELECT priority, COUNT(*) as cnt FROM agent_actions WHERE status != 'fait' AND last_analyzed > ? GROUP BY priority`
  ).bind(Math.floor(Date.now() / 1000) - 48 * 3600).all()
    .then(r => r.results ?? [])
    .catch(e => { clog('morning-brief', 'warn', { step: 'agentAlerts', err: e?.message }); errors.push('agents'); dbErrors++; return [] })

  const agentByPrio = {}
  for (const row of agentAlerts) agentByPrio[row.priority] = row.cnt
  const agentCritique = agentByPrio['critique'] ?? 0
  const agentHaute = agentByPrio['haute'] ?? 0
  const agentOpen = agentAlerts.reduce((s, r) => s + r.cnt, 0)

  // ── Action du jour ────────────────────────────────────────────────────────
  if (cautionsPending.some(c => c.status === 'failed')) {
    priority = 5
    const f = cautionsPending.find(c => c.status === 'failed')
    actionLine = `🚨 CAUTION ÉCHOUÉE → ${nomBien(f.bien_id)} · ${f.prenom} · ${f.amount}€ — envoyer le lien manuellement`
  } else if (arrivals.length > 0) {
    actionLine = `🎯 Arrivée${arrivals.length > 1 ? 's' : ''} du jour : ${arrivals.map(a => nomBien(a.bien_id, a.bien_nom)).join(' · ')}`
  } else if (cautionsPending.length > 0) {
    priority = 4
    actionLine = `🎯 ${cautionsPending.length} caution${cautionsPending.length > 1 ? 's' : ''} à placer`
  }

  if (actionLine) lines.push(actionLine)

  // ── Section arrivées/départs ──────────────────────────────────────────────
  const mvt = []
  if (arrivals.length > 0) {
    mvt.push('🛬 Arrivées :\n' + arrivals.map(a =>
      `• ${nomBien(a.bien_id, a.bien_nom)} · ${a.prenom || 'Voyageur'} · ${a.nb_guests ?? 1}p · ${a.total != null ? a.total : '?'}€`
    ).join('\n'))
  }
  if (departures.length > 0) {
    mvt.push('🛫 Départs :\n' + departures.map(d =>
      `• ${nomBien(d.bien_id, d.bien_nom)} · ${d.prenom}`
    ).join('\n'))
  }
  if (mvt.length === 0) mvt.push('📅 Aucun mouvement aujourd\'hui')
  lines.push(mvt.join('\n\n'))

  // ── Cautions ─────────────────────────────────────────────────────────────
  if (cautionsPending.length > 0) {
    const failedC = cautionsPending.filter(c => c.status === 'failed')
    const pendingC = cautionsPending.filter(c => c.status === 'pending')
    const parts = []
    if (failedC.length) parts.push(`🔴 Échouées : ${failedC.map(c => `${nomBien(c.bien_id)} (${c.prenom})`).join(', ')}`)
    if (pendingC.length) parts.push(`🟡 À placer : ${pendingC.map(c => `${nomBien(c.bien_id)} checkout ${c.checkout}`).join(', ')}`)
    lines.push('🔐 Cautions :\n' + parts.join('\n'))
  }

  // ── Occupation ────────────────────────────────────────────────────────────
  const occupied = occupiedRows.length
  const pct = Math.round(occupied / BIENS_TOTAL * 100)
  const occIcon = pct >= 80 ? '🟢' : pct >= 50 ? '🟡' : '🔴'
  lines.push(`${occIcon} Occupation 7j (résas directes) : ${occupied}/${BIENS_TOTAL} biens (${pct}%)`)

  // ── Revenus mois ─────────────────────────────────────────────────────────
  if (monthRevenue?.total) {
    const mois = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
    const m = parseInt(today.slice(5, 7)) - 1
    lines.push(`💶 Résas directes ${mois[m]} : ${Math.round(monthRevenue.total).toLocaleString('fr-FR')}€ (${monthRevenue.nb} résa${monthRevenue.nb > 1 ? 's' : ''})`)
  }

  // ── Posts éditoriaux ──────────────────────────────────────────────────────
  if (todayPosts.length > 0) {
    const published = todayPosts.filter(p => p.status === 'published').length
    const planned = todayPosts.filter(p => p.status !== 'published').length
    const parts = []
    if (published) parts.push(`${published} publié${published > 1 ? 's' : ''}`)
    if (planned) parts.push(`${planned} planifié${planned > 1 ? 's' : ''}`)
    lines.push(`📱 Réseaux sociaux : ${parts.join(' · ')} — ${todayPosts.map(p => nomBien(p.bien_id)).join(', ')}`)
  }

  // ── Agents fleet (alertes ouvertes 48h) ──────────────────────────────────
  if (agentOpen > 0) {
    const parts = []
    if (agentCritique > 0) parts.push(`🔴 ${agentCritique} critique${agentCritique > 1 ? 's' : ''}`)
    if (agentHaute > 0) parts.push(`🟡 ${agentHaute} haute${agentHaute > 1 ? 's' : ''}`)
    const restOpen = agentOpen - agentCritique - agentHaute
    if (restOpen > 0) parts.push(`${restOpen} autre${restOpen > 1 ? 's' : ''}`)
    lines.push(`🤖 Agents (28) : ${parts.join(' · ')} — ${agentOpen} open`)
    if (agentCritique > 0 && priority < 4) priority = 4
  }

  if (errors.length) lines.push('⚠️ Données manquantes : ' + errors.join(', '))
  lines.push('→ https://villamaryllis.com/admin')

  const body = lines.join('\n\n')
  const title = `🏠 Locatif — ${jourFr(today)}`

  clog('morning-brief', dbErrors > 0 ? 'warn' : 'info', { arrivals: arrivals.length, departures: departures.length, cautions: cautionsPending.length, occupied, pct, revenusEuros: Math.round(monthRevenue?.total ?? 0), posts: todayPosts.length, agentOpen, agentCritique, agentHaute, priority, dbErrors, ms: t() })

  if (dry) {
    return new Response(JSON.stringify({
      ok: true, dry: true, title, priority, body,
      debug: {
        arrivals: arrivals.length,
        departures: departures.length,
        cautions: cautionsPending.length,
        occupied,
        pct,
        revenusEuros: Math.round(monthRevenue?.total ?? 0),
        posts: todayPosts.length,
      },
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }

  const ntfyRes = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
    method: 'POST',
    headers: {
      Title: title,
      Priority: String(priority),
      Tags: 'house,sunrise',
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body,
  })

  if (!ntfyRes.ok) clog('morning-brief', 'error', { step: 'ntfy', status: ntfyRes.status, topic: ntfyTopic?.slice(0, 8) + '…' })

  return new Response(JSON.stringify({
    ok: ntfyRes.ok,
    ntfyStatus: ntfyRes.status,
    title,
    preview: body.slice(0, 300),
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
