# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Rental property management dashboard for 7 properties in France (Martinique + Nogent-sur-Marne). Combined public website (villamaryllis.com) and private `/admin` dashboard. Stack: React 19 + Vite, deployed on Cloudflare Pages.

## Commands

```bash
npm run dev          # Local dev server (Vite HMR)
npm run dev:cf       # Local dev with Cloudflare Pages Functions (wrangler pages dev)
npm run build        # Production build → dist/
npm run lint         # ESLint
npm run preview      # Serve the dist/ build locally
```

There are no tests. No single-test command exists.

For local dev with backend functions (iCal proxy, Sheets proxy, Beds24), use `npm run dev:cf`. Copy `.dev.vars.example` to `.dev.vars` and fill in the secrets — wrangler reads this file automatically.

## Architecture

### Routing (manual, no react-router)

`src/main.jsx` implements client-side routing via `window.location.pathname` matching with lazy-loaded components:

- `/admin*` → `App.jsx` (private dashboard, password-gated)
- `/{bienId}` (amaryllis, zandoli, iguana, geko, mabouya, schoelcher, nogent) → `PublicSite.jsx`
- `/guide`, `/guide-le-diamant`, `/guide-sainte-anne`, `/activites-sainte-luce`, `/guide-proximite`, `/guide-arlet`, `/explorer`, `/guide-trois-ilets` → dedicated Guide components
- `/landing*` → `Landing.jsx`
- `/villa-rental-martinique` → `GuideEn.jsx`
- Any unmatched path → `NotFound.jsx`

The `LangProvider` from `src/i18n.jsx` wraps the entire app (FR/EN translations for the public site).

### Backend — Cloudflare Pages Functions

All server-side logic lives in `functions/api/` (Cloudflare Pages Functions format, not Netlify). Each file exports `onRequest` or `onRequestGet`/`onRequestPost`:

| Endpoint | File | Purpose |
|---|---|---|
| `GET /api/fetch-ical` | `fetch-ical.js` | CORS proxy for Airbnb/Booking.com iCal URLs |
| `GET /api/get-availability` | `get-availability.js` | Merges iCal from both platforms per property |
| `POST /api/sheets-proxy` | `sheets-proxy.js` | Proxy to Google Apps Script (works around CORS + Apps Script POST redirect bug using chunked GET for array payloads) |
| `GET /api/beds24-bookings` | `beds24-bookings.js` | Proxy to Beds24 V2 API (token never exposed to browser) |
| `POST /api/create-payment-intent` | `create-payment-intent.js` | Stripe payment intent |

The `netlify/functions/` directory is a duplicate/legacy copy — the active functions are in `functions/api/`.

Environment secrets are set in Cloudflare Pages dashboard (production) or `.dev.vars` (local). See `.dev.vars.example` for all required keys: `BEDS24_TOKEN`, `APPS_SCRIPT_URL`, `STRIPE_SECRET_KEY`, iCal URLs per property per platform.

### Cloudflare Worker (separate deploy)

`workers/ical-sync/index.js` is a standalone Cloudflare Worker deployed via `wrangler.toml` (name: `amaryllis-ical-sync`). It runs on cron (`0 * * * *` hourly, `0 9 * * *` daily):
- Fetches iCal from Airbnb + Booking.com for all properties
- Detects new bookings by comparing UIDs against Cloudflare KV (`ICAL_STORE`)
- Sends email notifications via Resend API
- Pushes data to Google Apps Script (`APPS_SCRIPT_URL` secret)

Deploy separately: `wrangler deploy` from project root.

### Data Sources

All financial data flows from a single Google Sheets file (ID: `1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U`). The bridge is a Google Apps Script deployed as a web app — its URL is stored as `APPS_SCRIPT_URL`. The source for the Apps Script is `SCRIPT_SHEETS.gs`.

Data loading in `App.jsx`:
1. On mount, calls `syncFromSheets` → POSTs to `/api/sheets-proxy` → Apps Script reads Sheets and returns JSON
2. Falls back to hardcoded seeds if sync fails: `SEED_BIENS` (current-year data per property), `HIST_SEED` (2022–2025 historical), `CHARGES_2025`, `REVENUS_CANAL_2025`
3. Daily prices are stored in `localStorage` via `seedPrices.js` (`loadDailyPrices`/`saveDailyPrices`)
4. Reservations come from Beds24 V2 API (via `/api/beds24-bookings`) or iCal sync

### App.jsx Structure

Single large file (~3000+ lines). Key sections in order:
- Constants/seed data (`SEED_BIENS`, `ICAL_DEFAULTS`, `HIST_SEED`, `CHARGES_*`, `REVENUS_CANAL_*`)
- Reusable UI components: `Gauge` (SVG circular), `Spark` (sparkline), `PBar` (progress bar), `TodayBanner`, `AISummary`, `FAB`
- Tab components: `Planning`, `Cockpit`, `Previsionnel`, `Charges`, `Pilotage`, `Historique`, `VsAnnee`
- Main `App` component with tab state, sync logic, password gate

### Known Issues (from handoff.md)

1. **OCC scale mismatch**: `SEED_BIENS` stores occupancy as 0–100%; `SCRIPT_SHEETS.gs` returns 0–1 decimals due to `.map(v => v / 100)` at line 59. Defensive fix in `syncFromSheets`: `occ: arr.map(v => v > 1.5 ? v : v * 100)`
2. **HIST is hardcoded**: `HIST_SEED` should become reactive state synced from Google Sheets historical tabs (2022–2025)

### Recharts Gotchas

- Never mix `<Bar>` and `<Line>` inside `<BarChart>` — use `<ComposedChart>` instead
- Always explicitly import every component used (`ComposedChart`, `PieChart`, `Pie`, `Cell`, etc.)
- Avoid `lastIndexOf` on duplicate values in `Spark` — use index-based logic

### Public Site Components

`PublicSite.jsx` — property public pages (booking widget, photos, map via react-leaflet)  
`Landing.jsx` — access portal for Villa Amaryllis  
`EmailSync.jsx` — parses Gmail confirmation emails to extract booking amounts/platforms  
`src/i18n.jsx` — FR/EN translations object + `LangProvider` / `useLang()` hook  
`src/WikiImg.jsx` — Wikipedia image fetcher used in guide pages
