#!/bin/bash
# Lance Google Chrome en mode debug CDP pour le scraper Booking.com
# Usage : bash scripts/booking-chrome-debug.sh
# Laisse Chrome tourner, puis dans un autre terminal : npm run booking:sync

PORT=9222

# Vérifier si CDP déjà actif
if curl -s "http://localhost:${PORT}/json/version" >/dev/null 2>&1; then
  echo "✅ Chrome CDP déjà actif sur le port ${PORT}"
  echo "   Lance directement : npm run booking:sync"
  exit 0
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -f "$CHROME" ]; then
  echo "❌ Google Chrome non trouvé à : $CHROME"
  exit 1
fi

# Fermer Chrome proprement s'il tourne (sinon conflit de profil)
if pgrep -x "Google Chrome" >/dev/null; then
  echo "⚠️  Chrome est déjà ouvert. Fermeture..."
  osascript -e 'quit app "Google Chrome"'
  sleep 2
fi

echo "🚀 Lancement de Chrome avec remote debugging sur le port ${PORT}..."
"$CHROME" \
  --remote-debugging-port="${PORT}" \
  --no-first-run \
  --no-default-browser-check \
  > /tmp/chrome-debug.log 2>&1 &

sleep 2

if curl -s "http://localhost:${PORT}/json/version" >/dev/null 2>&1; then
  echo "✅ Chrome lancé avec succès (port ${PORT})"
  echo ""
  echo "👉 Connecte-toi à https://admin.booking.com si besoin"
  echo "   Puis lance : npm run booking:sync"
else
  echo "❌ Chrome n'a pas démarré. Logs : /tmp/chrome-debug.log"
  exit 1
fi
