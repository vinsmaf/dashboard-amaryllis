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
# Détecte l'empoisonnement de cache (asset manquant servi en HTML 200) et
# vérifie que le bundle référencé existe réellement.
echo ""
echo "🔎 Smoke test post-déploiement (propagation 6s)…"
sleep 6
DOMAIN="https://villamaryllis.com"
SMOKE_FAIL=0

# 1. Un asset inexistant NE DOIT PAS renvoyer 200 (sinon = futur cache empoisonné)
MISS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/assets/__nonexistent_smoke__.js" || echo "000")
if [[ "$MISS_STATUS" == "200" ]]; then
  echo "   ❌ Asset manquant renvoie 200 (risque d'empoisonnement de cache !)"
  SMOKE_FAIL=1
else
  echo "   ✅ Asset manquant → $MISS_STATUS (pas de fallback HTML)"
fi

# 2. Le bundle JS référencé dans l'HTML existe et est servi en JS (pas HTML)
INDEX_JS=$(curl -s "$DOMAIN/" | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1)
if [[ -n "$INDEX_JS" ]]; then
  CT=$(curl -s -o /dev/null -w "%{content_type}" "$DOMAIN/$INDEX_JS")
  if [[ "$CT" == *"javascript"* ]]; then
    echo "   ✅ Bundle $INDEX_JS servi en JS ($CT)"
  else
    echo "   ❌ Bundle $INDEX_JS servi en '$CT' (devrait être JS !)"
    SMOKE_FAIL=1
  fi
else
  echo "   ⚠️  Impossible de trouver le bundle index dans l'HTML"
fi

if [[ "$SMOKE_FAIL" == "1" ]]; then
  echo ""
  echo "🚨 SMOKE TEST ÉCHOUÉ — vérifier public/_redirects (assets → 404, pas 200 HTML)"
  exit 1
fi
echo "✅ Smoke test OK — déploiement sain"
