# Runbook — Rotation des tokens critiques (arch-018)

> Cadence : **tous les 90 jours**. Un rappel email automatique part en janvier / avril / juillet / octobre
> (Worker `amaryllis-ical-sync`, fonction `runTokenRotationReminder`, branchée sur le cron mensuel `0 1 1 * *`).

## Pourquoi
Limiter la fenêtre d'exploitation en cas de fuite d'un secret. Le plus sensible est **META_PAGE_TOKEN**
(expire naturellement ~60 jours) — à surveiller en priorité.

## Où sont stockés les secrets
- **Site / API** : Cloudflare Pages → projet `dashboard-amaryllis` → Settings → Environment variables (Production).
- **Worker iCal** : `wrangler secret put <NOM>` (déploiement séparé `amaryllis-ical-sync`).

## Checklist de rotation

| Token | Où le régénérer | Notes |
|---|---|---|
| `BEDS24_TOKEN` | Auto-refresh via `/api/beds24-refresh` (token D1) | Vérifier que le refresh tourne ; rotation manuelle seulement si cassé |
| `META_PAGE_TOKEN` | Graph API Explorer → token Page longue durée | ⚠️ Expire ~60 j — le plus urgent |
| `STRIPE_SECRET_KEY` | Dashboard Stripe → Développeurs → Clés API → Roll | Rouler la clé, mettre à jour, vérifier un paiement test |
| `RESEND_API_KEY` | Resend → API Keys → régénérer | Vérifier l'envoi d'un email après MAJ |
| `GROQ_API_KEY` | Console Groq | Utilisé par `/api/chat` |
| `ANTHROPIC_API_KEY` | Console Anthropic | Utilisé par `/api/ai-summary` + agents |
| `APIFY_TOKEN` | Console Apify | Scraping concurrents (rm-scrape) |
| `APPS_SCRIPT_URL` | Redéployer le Web App Apps Script (nouvel id) | Rotation seulement si fuite suspectée — change l'URL |

## Procédure
1. Régénérer le token chez le fournisseur.
2. Mettre à jour le secret (Cloudflare Pages **et/ou** `wrangler secret put`).
3. Déclencher un redéploiement Pages si nécessaire (`npm run deploy:pages`).
4. Tester le flux concerné (paiement Stripe, email Resend, sync Beds24, chat…).
5. Révoquer l'ancien token chez le fournisseur une fois le nouveau validé.

## Vérifs rapides post-rotation
- Beds24 : Admin → onglet Beds24 → « Tester connexion » → `ok:true`
- Meta : `GET /api/social?action=status` → `token.isValid: true`
- Stripe : un PaymentIntent test
- Resend : un email de test (ou attendre la prochaine notif)
