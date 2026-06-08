#!/usr/bin/env bash
# Garde-fou de déploiement — empêche d'écraser le projet patrimoine-dashboard.
#
# Usage : npm run deploy:pages
#
# Ce script :
#   1. Vérifie qu'on est bien dans /locatif-dashboard
#   2. Refuse explicitement le projet "patrimoine-dashboard"
#   3. Force le projet "dashboard-amaryllis" pour villamaryllis.com

set -euo pipefail

PROJECT_NAME="dashboard-amaryllis"
FORBIDDEN_NAMES=("patrimoine-dashboard")

# Garde-fou — refuse si on essaie d'override avec un projet interdit
for arg in "$@"; do
  for forbidden in "${FORBIDDEN_NAMES[@]}"; do
    if [[ "$arg" == "$forbidden" ]]; then
      echo "❌ INTERDIT — '$forbidden' appartient à un autre projet Claude."
      echo "   Utilise 'npm run deploy:pages' sans argument."
      exit 1
    fi
  done
done

# Vérifie qu'on est dans locatif-dashboard
if [[ "$(basename "$(pwd)")" != "locatif-dashboard" ]]; then
  echo "⚠️  Attention : tu n'es pas dans /locatif-dashboard (cwd=$(pwd))"
  echo "   Annule (Ctrl+C) si ce n'est pas voulu, ou patiente 5s pour continuer…"
  sleep 5
fi

# ── 0. GATE TESTS — barrière dure : aucun déploiement si la suite vitest échoue ──
if [[ "${SKIP_TESTS:-0}" != "1" ]]; then
  echo "🧪 Tests unitaires (gate)…"
  if ! npm run test:run >/tmp/vitest-gate.log 2>&1; then
    echo "❌ Tests en échec — déploiement ANNULÉ. Détail :"
    tail -30 /tmp/vitest-gate.log
    exit 1
  fi
  echo "   ✅ Suite de tests verte"
  echo ""
fi

# ── 0b. BUILD — garantit que dist/ = la source qu'on vient de tester ──────────
#    (gen-image-variants + vite build + prerender). SKIP_BUILD=1 pour redéployer
#    un dist déjà construit. set -e → un build qui échoue annule le déploiement.
if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  echo "📦 Build (images + vite + prerender)…"
  npm run build
  echo ""
fi

echo "🚀 Déploiement → projet Cloudflare Pages '$PROJECT_NAME' (villamaryllis.com)"
echo ""

npx wrangler pages deploy dist --project-name "$PROJECT_NAME" "$@"

# ── Smoke test post-déploiement ──────────────────────────────────────────────
# Vérifie que les pages clés rendent et que le bundle référencé est bien servi
# en JS (pas en HTML = symptôme d'empoisonnement). La protection anti-cache est
# assurée par sw.js (v5) + rotation de hash (window.__BUILD__).
echo ""
echo "🔎 Smoke test post-déploiement (propagation 6s)…"
sleep 6
DOMAIN="https://villamaryllis.com"
SMOKE_FAIL=0

# 1. Pages clés répondent en 200 (home, villa, admin)
for route in "/" "/amaryllis" "/admin"; do
  ST=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$route" || echo "000")
  if [[ "$ST" == "200" ]]; then
    echo "   ✅ $route → 200"
  else
    echo "   ❌ $route → $ST (attendu 200)"
    SMOKE_FAIL=1
  fi
done

# 1b. Playwright smoke /admin — vérifie que React monte sans pageerror ni chunk 404
#     (un import circulaire passe le HTTP 200 ci-dessus mais crashe au runtime)
if command -v node >/dev/null 2>&1; then
  if node scripts/admin-smoke.mjs 2>&1; then
    : # succès déjà loggué par le script
  else
    echo "   ❌ /admin — crash React détecté (voir ci-dessus)"
    SMOKE_FAIL=1
  fi
else
  echo "   ⚠️  node indisponible — admin-smoke ignoré"
fi

# 2. Le bundle JS référencé dans l'HTML est servi en JS (pas HTML = empoisonnement)
#    ⚠️ Vérif de l'ORIGINE via cache-bust (?_smoke=) : un GET sur le chemin canonique
#    AVANT propagation edge déclenche le fallback /* /index.html 200, et Cloudflare
#    CACHE ce HTML en immutable sous le nom .js (auto-empoisonnement du smoke test).
#    Le cache-bust force un MISS vers l'origine sans polluer le cache du vrai chemin.
INDEX_JS=$(curl -s "$DOMAIN/" | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1)
if [[ -n "$INDEX_JS" ]]; then
  CT=$(curl -s -o /dev/null -w "%{content_type}" "$DOMAIN/$INDEX_JS?_smoke=$(date +%s)")
  if [[ "$CT" == *"javascript"* ]]; then
    echo "   ✅ Bundle $INDEX_JS servi en JS"
  else
    echo "   ❌ Bundle $INDEX_JS servi en '$CT' (devrait être JS !)"
    SMOKE_FAIL=1
  fi
else
  echo "   ⚠️  Bundle index introuvable dans l'HTML"
  SMOKE_FAIL=1
fi

# 2b. Anti-régression INC-2026-06-07 (chunk périmé) — un /assets/*.js INEXISTANT
#     DOIT renvoyer un vrai HTTP 404 (Pages Function functions/assets/[[asset]].js),
#     PAS le SPA fallback (HTTP 200 + text/html). Si on perd cette protection,
#     les visiteurs avec un vieux index.html en cache navigateur voient une
#     page blanche silencieuse après deploy (Failed to fetch dynamically imported module).
SENTINEL_PATH="/assets/__sentinel-stale-$(date +%s).js"
SENTINEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$SENTINEL_PATH")
SENTINEL_HEADER=$(curl -sI "$DOMAIN$SENTINEL_PATH" | grep -i "^x-stale-chunk:" | head -1)
if [[ "$SENTINEL_STATUS" == "404" ]]; then
  echo "   ✅ Chunk périmé simulé → HTTP 404 (anti-régression INC-2026-06-07)"
else
  echo "   ❌ Chunk périmé simulé → HTTP $SENTINEL_STATUS (devrait être 404 !)"
  echo "      ⚠️  La Pages Function functions/assets/[[asset]].js ne s'applique pas."
  echo "      ⚠️  Les visiteurs avec vieux index.html en cache verront une page blanche."
  echo "      → Vérifier : ls functions/assets/[[asset]].js && grep 'x-stale-chunk' functions/assets/[[asset]].js"
  SMOKE_FAIL=1
fi

# 3. Le Service Worker est bien le kill-switch (désinscription, pas de cache)
if curl -s "$DOMAIN/sw.js" | grep -q "unregister"; then
  echo "   ✅ Service Worker = kill-switch (pas de cache HTML)"
else
  echo "   ⚠️  sw.js n'est pas le kill-switch attendu"
fi

# 4. Anti-asset-gelé : la taille du /guide servi doit correspondre au build local
#    (détecte un manifeste Pages figé qui sert une vieille version — cf. incident /guide)
if [[ -f dist/guide-hub/index.html ]]; then
  LOCAL_SZ=$(wc -c < dist/guide-hub/index.html | tr -d ' ')
  REMOTE_SZ=$(curl -s "$DOMAIN/guide-hub" | wc -c | tr -d ' ')
  DELTA=$(( LOCAL_SZ > REMOTE_SZ ? LOCAL_SZ - REMOTE_SZ : REMOTE_SZ - LOCAL_SZ ))
  if [[ "$DELTA" -le 800 ]]; then
    echo "   ✅ /guide servi à jour (local=$LOCAL_SZ, remote=$REMOTE_SZ)"
  else
    echo "   ⚠️  /guide possiblement gelé/caché — local=$LOCAL_SZ vs remote=$REMOTE_SZ (purger le cache ou vérifier le manifeste Pages)"
  fi
fi

# 5. (qa-003) Endpoints API critiques répondent (pas de 5xx ni 404)
for api in "/api/get-config" "/api/social?action=status"; do
  ST=$(curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: Mozilla/5.0" "$DOMAIN$api" || echo "000")
  if [[ "$ST" =~ ^(200|401|405)$ ]]; then
    echo "   ✅ API $api → $ST (vivant)"
  else
    echo "   ❌ API $api → $ST (5xx/404 = fonction cassée)"
    SMOKE_FAIL=1
  fi
done

# 6. (qa-003) sitemap.xml servi en XML et non vide
SMAP=$(curl -s "$DOMAIN/sitemap.xml")
if echo "$SMAP" | grep -q "<urlset"; then
  echo "   ✅ sitemap.xml valide ($(echo "$SMAP" | grep -c "<loc>") URLs)"
else
  echo "   ❌ sitemap.xml absent ou invalide"
  SMOKE_FAIL=1
fi

# 7. (qa-003) une fiche villa prérendue contient bien son <title> SEO (meta injectée)
if curl -s "$DOMAIN/mabouya" | grep -qi "<title>.*Mabouya"; then
  echo "   ✅ Meta prérendue OK (/mabouya a son <title>)"
else
  echo "   ⚠️  /mabouya sans <title> attendu — vérifier le prerender"
fi

if [[ "$SMOKE_FAIL" == "1" ]]; then
  echo ""
  echo "🚨 SMOKE TEST ÉCHOUÉ — le site ne rend pas correctement, vérifier le déploiement"
  exit 1
fi
echo "✅ Smoke test OK — déploiement sain"

# ── Vérifs anti-bugs post-déploiement (non bloquantes) ───────────────────────
# Déclenchées au MOMENT du changement (= ce déploiement), pas en boucle.
#   1. Revue de code LLM du diff → inbox bugs (nécessite POSTSTAY_SECRET en env).
#   2. Crawl visuel de la prod fraîche, en arrière-plan → inbox bugs.
# Désactivable : SKIP_BUG_CHECKS=1 npm run deploy:pages
if [[ "${SKIP_BUG_CHECKS:-0}" != "1" ]]; then
  echo ""
  echo "🐞 Vérifs anti-bugs (au moment du changement)…"
  # Charge le secret local (gitignoré) s'il existe → active la revue de code sans
  # toucher à ~/.zshrc. Coller la valeur dans .deploy.env (cf. .deploy.env.example).
  if [[ -f .deploy.env ]]; then set -a; source .deploy.env; set +a; fi
  # 1. Revue de code du diff (non bloquant — ne fait jamais échouer le déploiement)
  node scripts/code-review-diff.mjs || echo "   ⚠️  revue de code ignorée (erreur non bloquante)"
  # 1b. Audit d'invariants d'archi (source unique des biens, miroirs, CSP, meta, mémoire)
  #     Déterministe + NON BLOQUANT (exit 0 toujours). SKIP_AUDIT=1 pour désactiver.
  if [[ "${SKIP_AUDIT:-0}" != "1" ]]; then
    node scripts/audit-invariants.mjs || echo "   ⚠️  audit invariants ignoré (erreur non bloquante)"
  fi
  # 2. Crawl visuel de la prod, en arrière-plan (ne ralentit pas le déploiement)
  if command -v node >/dev/null 2>&1; then
    nohup node scripts/visual-review.mjs --report >/tmp/visual-review-last.log 2>&1 &
    echo "   🔍 Crawl visuel lancé en arrière-plan → /tmp/visual-review-last.log (résultats dans l'onglet 🐞 Bugs)"
  fi
fi
