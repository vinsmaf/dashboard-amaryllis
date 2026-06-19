// Cloudflare Pages Function — GET /api/health[?deep=1]
// État de santé du système Amaryllis Locations.
//
//   GET /api/health?secret=POSTSTAY_SECRET       → checks config (~5ms)
//   GET /api/health?secret=...&deep=1            → + pings réseau (D1, Stripe, RESEND)
//
// Réponse : { ok, status:"healthy"|"degraded"|"down", ms, checks:{...} }
// status="down"     → au moins un check CRITIQUE échoue  (D1, Stripe, RESEND, POSTSTAY_SECRET)
// status="degraded" → seulement des non-critiques absents (LLM, Beds24, ntfy…)

import { clog, timer } from './_log.js'

const json = (d, s = 200) =>
  new Response(JSON.stringify(d, null, 2), {
    status: s,
    headers: { 'Content-Type': 'application/json' },
  })

// ── Checks config (existence des env vars + bindings) ────────────────────────
function configChecks(env) {
  const c = (ok, detail) => ({ ok, ...(detail ? { detail } : {}) })
  const has = k => !!env[k]

  return {
    // ── CRITIQUES ────────────────────────────────────────────────────────────
    D1:                    c(!!env.revenue_manager, env.revenue_manager ? 'binding ok' : 'missing'),
    STRIPE_SECRET_KEY:     c(has('STRIPE_SECRET_KEY'), env.STRIPE_SECRET_KEY ? env.STRIPE_SECRET_KEY.slice(0, 7) + '…' : 'missing'),
    STRIPE_WEBHOOK_SECRET: c(has('STRIPE_WEBHOOK_SECRET')),
    RESEND_API_KEY:        c(has('RESEND_API_KEY'), env.RESEND_API_KEY ? env.RESEND_API_KEY.slice(0, 6) + '…' : 'missing'),
    APPS_SCRIPT_URL:       c(has('APPS_SCRIPT_URL'), env.APPS_SCRIPT_URL ? 'configured' : 'missing'),
    POSTSTAY_SECRET:       c(has('POSTSTAY_SECRET')),
    // ── SECONDAIRES ──────────────────────────────────────────────────────────
    GROQ_API_KEY:          c(has('GROQ_API_KEY')),
    ANTHROPIC_API_KEY:     c(has('ANTHROPIC_API_KEY')),
    NTFY_TOPIC:            c(has('NTFY_TOPIC'), env.NTFY_TOPIC || 'missing'),
    RESEND_FROM:           c(has('RESEND_FROM'), env.RESEND_FROM || 'missing'),
    ADMIN_PWD:             c(has('ADMIN_PWD') || has('ADMIN_PASSWORD')),
  }
}

const CRITIQUES = ['D1', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY', 'APPS_SCRIPT_URL', 'POSTSTAY_SECRET']

// ── Pings réseau (deep=1 seulement) ──────────────────────────────────────────
async function deepChecks(env) {
  const results = {}

  // D1 — SELECT 1
  try {
    await env.revenue_manager?.prepare('SELECT 1').first()
    results.D1_ping = { ok: true }
  } catch (e) {
    results.D1_ping = { ok: false, detail: e.message.slice(0, 80) }
  }

  // Stripe — vérifie le format de la clé (pas d'appel réseau, juste la cohérence)
  const sk = env.STRIPE_SECRET_KEY || ''
  results.STRIPE_KEY_TYPE = {
    ok: sk.startsWith('sk_live_') || sk.startsWith('sk_test_'),
    detail: sk.startsWith('sk_live_') ? 'LIVE ✓' : sk.startsWith('sk_test_') ? 'TEST ⚠' : 'format inconnu',
  }

  // RESEND — un GET vers l'API (léger, vérifie l'auth)
  try {
    const r = await fetch('https://api.resend.com/emails', {
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    })
    results.RESEND_ping = { ok: r.status !== 401, detail: `HTTP ${r.status}` }
  } catch (e) {
    results.RESEND_ping = { ok: false, detail: e.message.slice(0, 60) }
  }

  // Apps Script — GET ping (timeout court)
  if (env.APPS_SCRIPT_URL) {
    try {
      const r = await fetch(`${env.APPS_SCRIPT_URL}?action=ping`, {
        redirect: 'follow', signal: AbortSignal.timeout(8000),
      })
      results.APPS_SCRIPT_ping = { ok: r.ok || r.status === 302, detail: `HTTP ${r.status}` }
    } catch (e) {
      results.APPS_SCRIPT_ping = { ok: false, detail: e.message.slice(0, 60) }
    }
  }

  return results
}

export async function onRequestGet(context) {
  const { request, env } = context
  const t = timer()
  const url = new URL(request.url)

  // Auth
  if (env.POSTSTAY_SECRET && url.searchParams.get('secret') !== env.POSTSTAY_SECRET)
    return json({ error: 'Non autorisé' }, 401)

  const checks = configChecks(env)

  if (url.searchParams.get('deep') === '1') {
    Object.assign(checks, await deepChecks(env))
  }

  const critDown = CRITIQUES.filter(k => checks[k] && !checks[k].ok)
  const status   = critDown.length > 0 ? 'down' : Object.values(checks).some(c => !c.ok) ? 'degraded' : 'healthy'
  const ok       = status !== 'down'
  const ms       = t()

  clog('health', ok ? 'info' : 'warn', { status, ms, down: critDown })
  return json({ ok, status, ms, checks })
}
