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

# 2. Le bundle JS référencé dans l'HTML est servi en JS (pas HTML = empoisonnement)
INDEX_JS=$(curl -s "$DOMAIN/" | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1)
if [[ -n "$INDEX_JS" ]]; then
  CT=$(curl -s -o /dev/null -w "%{content_type}" "$DOMAIN/$INDEX_JS")
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

# 3. Le Service Worker est bien le kill-switch (désinscription, pas de cache)
if curl -s "$DOMAIN/sw.js" | grep -q "unregister"; then
  echo "   ✅ Service Worker = kill-switch (pas de cache HTML)"
else
  echo "   ⚠️  sw.js n'est pas le kill-switch attendu"
fi

if [[ "$SMOKE_FAIL" == "1" ]]; then
  echo ""
  echo "🚨 SMOKE TEST ÉCHOUÉ — le site ne rend pas correctement, vérifier le déploiement"
  exit 1
fi
echo "✅ Smoke test OK — déploiement sain"
