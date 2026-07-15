// Structured logger for CF Pages Functions
// Tail: npx wrangler pages deployment tail --project-name=dashboard-amaryllis --format=json | jq
// Filter errors: ... --status=error | jq '{fn:.logs[0].message|fromjson|.fn, err:.logs[0].message|fromjson|.err}'
export const clog = (fn, level, data = {}) =>
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    JSON.stringify({ fn, level, ...data })
  )

export const timer = () => { const t = performance.now(); return () => Math.round(performance.now() - t) }

// redactName()/redactEmail() : filtre PII — nom/email voyageur ne doivent JAMAIS
// apparaître en clair dans les logs Cloudflare (visibles via `wrangler pages
// deployment tail` / dashboard CF). Miroir de workers/ical-sync/_logger.js
// (bundle esbuild séparé, dupliqué à l'identique plutôt que réinventé) — celui-ci
// couvrait déjà le Worker, jamais les Pages Functions (trouvé par audit 2026-07-15).
export function redactName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '?'
  const first = fullName.trim().split(/\s+/)[0]
  return first ? `${first[0].toUpperCase()}.` : '?'
}

export function redactEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '?'
  const [local, domain] = email.split('@')
  return `${(local || '?')[0] || '?'}***@${domain}`
}
