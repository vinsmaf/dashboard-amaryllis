#!/usr/bin/env node
// test-function.mjs — test rapide des CF Pages Functions en local
// Usage:
//   node scripts/test-function.mjs              # toutes les fixtures
//   node scripts/test-function.mjs caution      # filtre sur le nom du dossier ou fichier
//   node scripts/test-function.mjs --watch      # relance toutes les 30s
//
// Prérequis: wrangler pages dev lancé en parallèle (npm run dev:cf)
// Secrets résolus depuis .dev.vars → ${POSTSTAY_SECRET} dans les fixtures

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir  = dirname(fileURLToPath(import.meta.url))
const ROOT   = join(__dir, '..')
const FX_DIR = join(ROOT, 'functions', '_fixtures')
const DEV_VARS = join(ROOT, '.dev.vars')
const BASE_URL = process.env.CF_LOCAL_URL || 'http://localhost:8788'

const args   = process.argv.slice(2)
const filter = args.find(a => !a.startsWith('--'))
const watch  = args.includes('--watch')

// ── .dev.vars parser ─────────────────────────────────────────────────────────
function loadVars() {
  if (!existsSync(DEV_VARS)) return {}
  return Object.fromEntries(
    readFileSync(DEV_VARS, 'utf8').split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#') && l.trim())
      .map(l => {
        const i = l.indexOf('=')
        let v = l.slice(i + 1).trim()
        if (/^["']/.test(v) && v[0] === v.at(-1)) v = v.slice(1, -1)
        return [l.slice(0, i).trim(), v]
      })
  )
}

const resolve = (s, vars) => s.replace(/\$\{(\w+)\}/g, (_, k) => vars[k] ?? '')

// ── Charger fixtures depuis functions/_fixtures/<endpoint>/<scenario>.json ───
function loadFixtures() {
  if (!existsSync(FX_DIR)) return []
  return readdirSync(FX_DIR)
    .filter(n => statSync(join(FX_DIR, n)).isDirectory())
    .flatMap(ep =>
      readdirSync(join(FX_DIR, ep))
        .filter(f => f.endsWith('.json'))
        .map(f => ({ ep, name: f.replace('.json', ''), path: join(FX_DIR, ep, f) }))
    )
    .filter(({ ep, name }) => !filter || ep.includes(filter) || name.includes(filter))
}

// ── Deep partial match (on vérifie seulement les clés déclarées dans expected) ─
function matches(actual, expected) {
  if (expected == null) return true
  if (typeof expected !== 'object') return actual === expected
  return Object.entries(expected).every(([k, v]) => matches(actual?.[k], v))
}

const G = s => `\x1b[32m${s}\x1b[0m`
const R = s => `\x1b[31m${s}\x1b[0m`
const Y = s => `\x1b[33m${s}\x1b[0m`
const B = s => `\x1b[36m${s}\x1b[0m`
const DIM = s => `\x1b[2m${s}\x1b[0m`

async function runAll() {
  const vars     = loadVars()
  const fixtures = loadFixtures()

  if (!fixtures.length) {
    console.log(Y(`⚠  Aucune fixture${filter ? ` correspondant à "${filter}"` : ''} dans functions/_fixtures/`))
    return
  }

  // Vérifier que wrangler dev tourne
  try {
    await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) })
  } catch {
    console.error(R(`\n✗ Serveur inaccessible → ${BASE_URL}`))
    console.error(DIM(`  Lancer dans un autre terminal : npm run dev:cf\n`))
    process.exit(1)
  }

  console.log(B(`\n⚡ CF Functions — ${fixtures.length} fixture(s) → ${BASE_URL}\n`))

  let pass = 0, fail = 0
  for (const { ep, name, path } of fixtures) {
    const fx  = JSON.parse(readFileSync(path, 'utf8'))
    const url = BASE_URL + resolve(fx.url, vars)
    const label = `${ep}/${name}`
    const opts  = { method: fx.method || 'GET', signal: AbortSignal.timeout(30_000) }
    if (fx.headers) opts.headers = Object.fromEntries(
      Object.entries(fx.headers).map(([k, v]) => [k, resolve(v, vars)])
    )
    if (fx.body) opts.body = typeof fx.body === 'string' ? fx.body : JSON.stringify(fx.body)
    if (!opts.headers?.['Content-Type'] && fx.body) opts.headers = { ...(opts.headers || {}), 'Content-Type': 'application/json' }

    const t0 = Date.now()
    try {
      const res  = await fetch(url, opts)
      const ms   = Date.now() - t0
      let body   = null
      try { body = await res.json() } catch {}

      const statusOk = !fx.expected?.status || res.status === fx.expected.status
      const bodyOk   = !fx.expected?.body   || matches(body, fx.expected.body)
      const ok       = statusOk && bodyOk

      let detail = ''
      if (!statusOk) detail = `status ${res.status} ≠ ${fx.expected.status}`
      else if (!bodyOk) detail = `body: ${JSON.stringify(body).slice(0, 100)}`

      const tag = ok ? G('✓ PASS') : R('✗ FAIL')
      console.log(`  ${tag}  ${label.padEnd(40)} ${DIM(ms + 'ms')}${detail ? '  ' + Y(detail) : ''}`)
      if (fx.description && !ok) console.log(`         ${DIM(fx.description)}`)
      ok ? pass++ : fail++
    } catch (e) {
      console.log(`  ${R('✗ ERR ')}  ${label.padEnd(40)} ${R(e.message)}`)
      fail++
    }
  }

  const total = pass + fail
  console.log(`\n  ${G(`${pass}/${total} pass`)}${fail ? `  ${R(`${fail} fail`)}` : ''}\n`)
  if (fail) process.exit(1)
}

if (watch) {
  const run = () => runAll().catch(console.error)
  run()
  setInterval(run, 30_000)
} else {
  runAll()
}
