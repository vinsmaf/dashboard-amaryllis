#!/bin/bash
# Veille sociale Facebook (page + groupes) — wrapper launchd.
# LECTURE SEULE : détecte les leads, envoie un BROUILLON de réponse en ntfy. Ne poste JAMAIS.
# Le secret est lu depuis .dev.vars (jamais en clair dans le plist).
cd /Users/vincentsalomon/locatif-dashboard || exit 1
export SOCIAL_DRAFT_SECRET="$(grep -m1 '^POSTSTAY_SECRET' .dev.vars | cut -d= -f2 | tr -d '"' | tr -d "'")"
if [ -z "$SOCIAL_DRAFT_SECRET" ]; then
  echo "$(date '+%Y-%m-%d %H:%M') ❌ POSTSTAY_SECRET introuvable dans .dev.vars"
  exit 1
fi
echo "===== $(date '+%Y-%m-%d %H:%M') veille sociale FB ====="
/usr/local/bin/node scripts/group-watch.mjs
echo "exit=$?"
