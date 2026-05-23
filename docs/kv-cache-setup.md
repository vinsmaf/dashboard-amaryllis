# KV Cache — Disponibilités (AVAIL_CACHE)

Le binding KV `AVAIL_CACHE` est optionnel. Sans lui, `get-availability.js` fonctionne exactement comme avant. Avec lui, les résultats iCal/Beds24 sont mis en cache 10 minutes, ce qui évite les timeouts répétés et le risque de double réservation si Airbnb/Booking.com est lent.

## Créer le namespace KV

1. Ouvrir le [dashboard Cloudflare](https://dash.cloudflare.com/) → **Workers & Pages** → **KV**.
2. Cliquer **Create a namespace**, nommer-le `avail-cache` (ou tout autre nom).
3. Copier l'**ID** du namespace (format `abc123...`).

## Binder au Pages project

1. Aller dans **Workers & Pages** → sélectionner le projet `locatif-dashboard`.
2. Onglet **Settings** → **Functions** → section **KV namespace bindings**.
3. Cliquer **Add binding** :
   - **Variable name** : `AVAIL_CACHE`
   - **KV namespace** : sélectionner `avail-cache`
4. Enregistrer et **redéployer** le projet (un nouveau déploiement active le binding).

## Dev local

Les KV bindings ne sont pas disponibles en `.dev.vars`. Pour tester localement sans KV, le code se dégrade gracieusement (pas d'erreur). Pour tester avec un KV simulé, utiliser `wrangler pages dev --kv AVAIL_CACHE`.

## Durée de cache

TTL : **600 secondes (10 min)**. Modifiable dans `functions/api/get-availability.js` (`expirationTtl`).

Les requêtes avec un `bookingUrl` en paramètre (passé depuis l'admin) ne sont **pas** mises en cache pour éviter de polluer le cache avec des URLs dynamiques.
