#!/usr/bin/env node
// check-digests.mjs — détecteur de dérive des "digests miroir" bakés dans le fleet.
//
// Problème résolu : functions/api/agents-run.js embarque des extraits condensés
// (PLAYBOOK_DIGEST, FISCAL_CONTEXT, VINCENT_PROFILE_DIGEST) recopiés à la main depuis
// ~/.claude/memory/*.md. Une CF Function ne lit pas ~/.claude au runtime → la copie
// inline est nécessaire, mais elle PÉRIME EN SILENCE quand la source change.
//
// Ce script hashe la ZONE MARQUÉE de chaque source (marqueurs <!-- FLEET-DIGEST:x -->)
// et la compare à une baseline committée. Si la source a bougé sans re-tampon → alerte,
// pointant le digest à revoir dans le code. Bornage par marqueurs = pas de faux positif
// quand VINCENT.md reçoit un append daté hors zone.
//
// Usage :
//   node scripts/check-digests.mjs           → rapport (exit 0 ; --strict pour exit≠0 si dérive)
//   node scripts/check-digests.mjs --stamp    → re-baseline tout (après avoir revu les digests)
//   node scripts/check-digests.mjs --stamp x  → re-baseline le seul digest "x"
//
// Les sources vivent dans ~/.claude/memory (hors repo) → si inaccessibles (CI Cloudflare),
// le script SKIP proprement (exit 0). Enforcement réel = local + deploy local + session Claude.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const MEM = join(homedir(), '.claude', 'memory')
const BASELINE = join(__dir, 'digest-baseline.json')

// Digest bakés dans functions/api/agents-run.js ← zone marquée de la source.
const DIGESTS = [
  { name: 'playbook-locatif', source: join(MEM, 'PLAYBOOK-LOCATIF.md'), digest: 'PLAYBOOK_DIGEST (agents-run.js)' },
  { name: 'fiscal-context',   source: join(MEM, 'FISCAL.md'),           digest: 'FISCAL_CONTEXT (agents-run.js)' },
  { name: 'vincent-profil',   source: join(MEM, 'VINCENT.md'),          digest: 'VINCENT_PROFILE_DIGEST (agents-run.js)' },
]

function markedSection(text, name) {
  const open = `<!-- FLEET-DIGEST:${name}`
  const close = `<!-- /FLEET-DIGEST:${name} -->`
  const i = text.indexOf(open)
  if (i === -1) return null
  const bodyStart = text.indexOf('-->', i)
  if (bodyStart === -1) return null
  const j = text.indexOf(close, bodyStart)
  if (j === -1) return null
  return text.slice(bodyStart + 3, j)
}

function hashSection(source, name) {
  if (!existsSync(source)) return { skip: true }
  const section = markedSection(readFileSync(source, 'utf8'), name)
  if (section == null) return { missing: true }
  // Normalise les fins de ligne pour un hash stable cross-OS.
  const norm = section.replace(/\r\n/g, '\n').trim()
  return { hash: createHash('sha256').update(norm).digest('hex').slice(0, 16) }
}

const args = process.argv.slice(2)
const stamp = args.includes('--stamp')
const strict = args.includes('--strict')
const only = args.find((a) => !a.startsWith('--'))

// Toutes les sources absentes = environnement sans ~/.claude (CI) → skip propre.
if (DIGESTS.every((d) => !existsSync(d.source))) {
  console.log('ℹ️  check-digests : sources ~/.claude/memory inaccessibles (CI ?) — vérification ignorée.')
  process.exit(0)
}

let baseline = {}
if (existsSync(BASELINE)) baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))

if (stamp) {
  const today = new Date().toISOString().slice(0, 10)
  for (const d of DIGESTS) {
    if (only && d.name !== only) continue
    const r = hashSection(d.source, d.name)
    if (r.skip || r.missing) { console.log(`⚠️  ${d.name} : source/marqueur introuvable — non tamponné.`); continue }
    baseline[d.name] = { hash: r.hash, stampedAt: today }
    console.log(`✅ tamponné ${d.name} (${r.hash})`)
  }
  writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + '\n')
  process.exit(0)
}

let drift = 0
for (const d of DIGESTS) {
  const r = hashSection(d.source, d.name)
  const base = baseline[d.name]
  if (r.skip) { console.log(`⏭️  ${d.name} : source absente, ignoré.`); continue }
  if (r.missing) { console.log(`❌ ${d.name} : marqueurs <!-- FLEET-DIGEST:${d.name} --> absents de ${d.source}`); drift++; continue }
  if (!base) { console.log(`❓ ${d.name} : pas de baseline — lance \`npm run check-digests -- --stamp ${d.name}\``); drift++; continue }
  if (base.hash === r.hash) { console.log(`✅ ${d.name} : à jour (tampon ${base.stampedAt})`); continue }
  console.log(`⚠️  ${d.name} : la SOURCE a changé depuis le ${base.stampedAt} (${base.hash} → ${r.hash})`)
  console.log(`    → relis ${d.digest}, mets-le à jour si besoin, puis \`npm run check-digests -- --stamp ${d.name}\``)
  drift++
}

if (drift === 0) console.log('\n✅ Aucun digest fleet en dérive.')
else console.log(`\n⚠️  ${drift} digest(s) à revoir avant de trop se fier aux sorties du fleet.`)
process.exit(strict && drift ? 1 : 0)
