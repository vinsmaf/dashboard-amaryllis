/**
 * GET /api/ack-suggestion?id=xxx&status=done|ignore|later
 * Enregistre l'ack d'une suggestion du sentinel KPI.
 * Appelé par les boutons d'action ntfy (pas besoin d'auth forte — ID difficile à deviner).
 *
 * D1 binding : revenue_manager
 */

import { clog } from './_log.js'
import { DDL_SUGGESTION_ACKS } from './_schema.js'

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id') ?? ''
  const status = url.searchParams.get('status') ?? ''
  const signal = url.searchParams.get('signal') ?? ''

  if (!id || id.length > 200 || !['done', 'ignore', 'later'].includes(status)) {
    return new Response('Paramètres invalides (id + status requis)', { status: 400 })
  }

  const db = env.revenue_manager
  if (!db) return new Response('D1 binding manquant', { status: 503 })

  try {
    await db.prepare(DDL_SUGGESTION_ACKS).run()
    // acked_at en heure Martinique (UTC-4) pour matcher le filtre MTQ de kpi-sentinel (acked_at >= ago7)
    await db.prepare(
      `INSERT INTO suggestion_acks (id, signal, status, acked_at)
       VALUES (?, ?, ?, datetime('now', '-4 hours'))
       ON CONFLICT(id) DO UPDATE SET status = excluded.status, acked_at = excluded.acked_at`
    ).bind(id, signal || id, status).run()

    clog('ack-suggestion', 'info', { id, signal: signal || id, status })
  } catch (e) {
    clog('ack-suggestion', 'error', { id, err: e.message })
    return new Response('Erreur D1', { status: 500 })
  }

  const label = status === 'done' ? '✅ Marqué comme fait' : status === 'ignore' ? '🙈 Ignoré' : '🕐 Reporté à demain'
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Ack</title>
    <style>body{font-family:sans-serif;padding:2rem;max-width:400px;margin:auto;color:#333}
    a{color:#3b82f6}</style></head>
    <body><p style="font-size:1.5rem">${label}</p>
    <p style="color:#666">${esc(id)}</p>
    <a href="https://villamaryllis.com/admin">← Retour admin</a>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
