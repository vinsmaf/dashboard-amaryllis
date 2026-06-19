// Structured logger for CF Pages Functions
// Tail: npx wrangler pages deployment tail --project-name=dashboard-amaryllis --format=json | jq
// Filter errors: ... --status=error | jq '{fn:.logs[0].message|fromjson|.fn, err:.logs[0].message|fromjson|.err}'
export const clog = (fn, level, data = {}) =>
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    JSON.stringify({ fn, level, ...data })
  )

export const timer = () => { const t = performance.now(); return () => Math.round(performance.now() - t) }
