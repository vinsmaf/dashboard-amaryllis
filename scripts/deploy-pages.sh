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

# ── 0c. LINT — delta baseline : interdit d'AJOUTER des erreurs (pas de blocage historique) ──
# Pour chaque fichier modifié, on compare le nb d'erreurs HEAD (baseline) vs actuel.
# Seule une AUGMENTATION bloque le deploy. Erreurs pré-existantes = ignorées.
if [[ "${SKIP_LINT:-0}" != "1" ]]; then
  echo "🔍 Lint ESLint (delta baseline — interdit d'ajouter des erreurs)…"
  CHANGED=$(git diff --name-only HEAD 2>/dev/null; git diff --name-only 2>/dev/null)
  CHANGED_JS=$(echo "$CHANGED" | { grep -E '\.(js|jsx|ts|tsx)$' || true; } | sort -u | while IFS= read -r f; do [[ -f "$f" ]] && echo "$f"; done)
  if [[ -n "$CHANGED_JS" ]]; then
    LINT_FAIL=0
    LINT_NEW_ERRORS=""
    while IFS= read -r f; do
      # Erreurs actuelles. { … || true; } neutralise l'exit 1 d'ESLint (errors found)
      # pour ne pas déclencher set -o pipefail sur l'assignation.
      CURRENT=$({ npx eslint "$f" 2>&1 || true; } | { grep -E "^\s+[0-9]+:[0-9]+\s+error" || true; } | wc -l | tr -d ' ')
      # Erreurs à HEAD (baseline). Fichier nouveau → baseline=0.
      if git cat-file -e "HEAD:$f" 2>/dev/null; then
        BASELINE=$(git show "HEAD:$f" 2>/dev/null | { npx eslint --stdin --stdin-filename "$f" 2>&1 || true; } | { grep -E "^\s+[0-9]+:[0-9]+\s+error" || true; } | wc -l | tr -d ' ')
      else
        BASELINE=0
      fi
      if [[ "$CURRENT" -gt "$BASELINE" ]]; then
        DELTA=$((CURRENT - BASELINE))
        LINT_NEW_ERRORS="$LINT_NEW_ERRORS\n   $f : +$DELTA nouvelle(s) erreur(s) (baseline=$BASELINE → actuel=$CURRENT)"
        LINT_FAIL=1
      fi
    done <<< "$CHANGED_JS"
    if [[ "$LINT_FAIL" == "1" ]]; then
      echo "❌ ESLint : nouvelles erreurs introduites — déploiement ANNULÉ."
      echo -e "$LINT_NEW_ERRORS"
      exit 1
    fi
    echo "   ✅ Lint delta OK sur $(echo "$CHANGED_JS" | wc -l | tr -d ' ') fichier(s) — aucune nouvelle erreur"
  else
    echo "   ✅ Lint — aucun fichier JS/JSX modifié"
  fi
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

DEPLOY_LOG=$(mktemp)
npx wrangler pages deploy dist --project-name "$PROJECT_NAME" "$@" 2>&1 | tee "$DEPLOY_LOG"
# Alias de déploiement (URL unique <hash>.<projet>.pages.dev, live immédiatement, SANS cache
# CDN). On smoke-teste cette URL plutôt que villamaryllis.com : le CDN met >30s à propager,
# ce qui faisait échouer le smoke (bundle en text/plain, titres absents) sur des déploiements
# pourtant sains. L'alias reflète exactement le déploiement → zéro faux négatif de propagation.
ALIAS_URL=$(grep -oE "https://[a-z0-9-]+\.${PROJECT_NAME}\.pages\.dev" "$DEPLOY_LOG" | head -1 || true)
rm -f "$DEPLOY_LOG"

# ── Smoke test post-déploiement ──────────────────────────────────────────────
# Vérifie que les pages clés rendent et que le bundle référencé est bien servi
# en JS (pas en HTML = symptôme d'empoisonnement). La protection anti-cache est
# assurée par sw.js (v5) + rotation de hash (window.__BUILD__).
DOMAIN="${ALIAS_URL:-https://villamaryllis.com}"
echo ""
if [[ -n "$ALIAS_URL" ]]; then
  echo "🔎 Smoke test post-déploiement → alias frais $DOMAIN (pas de cache CDN)…"
else
  echo "🔎 Smoke test post-déploiement → $DOMAIN (alias non capturé, fallback prod, propagation 6s)…"
  sleep 6
fi
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
  if BASE_URL="$DOMAIN" node scripts/admin-smoke.mjs 2>&1; then
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

# 4. Anti-asset-gelé : /guide-hub doit avoir un <title> non vide en live
#    (on vérifie le live directement — le titre local peut différer de l'injection Function)
GUIDE_LIVE_TITLE=$(curl -s "$DOMAIN/guide-hub" | grep -oE "<title>[^<]+</title>" | head -1 | sed 's/<[^>]*>//g')
if [[ -n "$GUIDE_LIVE_TITLE" ]]; then
  echo "   ✅ /guide-hub servi à jour (titre « ${GUIDE_LIVE_TITLE:0:40}… » présent)"
else
  echo "   ❌ /guide-hub sans <title> en live — page potentiellement gelée ou cassée"
  SMOKE_FAIL=1
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

# 7. (qa-003) une fiche villa contient bien son <title> SEO (meta injectée au runtime)
#    Vérifie le titre live directement — plus fiable que comparer à un pattern hardcodé.
#    Retry 8× / 10s (~80s) pour absorber la propagation CF Pages Function.
MABOUYA_OK=0
for _i in 1 2 3 4 5 6 7 8; do
  MABOUYA_TITLE=$(curl -s "$DOMAIN/mabouya" | grep -oE "<title>[^<]+</title>" | head -1 | sed 's/<[^>]*>//g')
  if [[ -n "$MABOUYA_TITLE" ]]; then
    MABOUYA_OK=1; break
  fi
  sleep 10
done
if [[ "$MABOUYA_OK" == "1" ]]; then
  echo "   ✅ Meta OK (/mabouya — « $MABOUYA_TITLE »)"
else
  echo "   ❌ /mabouya sans <title> après 8 essais — vérifier functions/[slug].js (injectMeta)"
  SMOKE_FAIL=1
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
