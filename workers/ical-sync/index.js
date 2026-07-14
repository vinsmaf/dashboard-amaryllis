/**
 * Amaryllis — Cloudflare Worker : automatisation complète
 *
 * Crons :
 *   "0 * * * *"   → sync iCal toutes les heures
 *   "0 9 * * *"   → audit + rappels J-7conseils/J-3/J-1/J+1/J+2/J+3/J-7direct + alertes + gap pricing + yield pricing
 *   "0 6 * * 1"   → rapport hebdomadaire (lundi matin)
 *   "0 1 1 * *"   → export comptable mensuel (1er du mois) + rapport SLA Exploitation (maintenance+stock)
 *
 * Fonctions principales :
 *   runSync            — Fetch iCal Airbnb + Booking, détecte nouvelles réservations
 *   runReminders       — Rappels J-7conseils, J-3, J-1 (+ ntfy ménage), J+1, J+2 avis, J+3 Google, J-7 direct
 *   runOccupancyAlerts — Alertes sous-occupation 30j + urgence 0 résa 14j
 *   runGapPricing      — Remises automatiques sur trous de calendrier 1-4 nuits
 *   runYieldPricing    — Yield management : -20%/-15% si occ < 30% sur 14j
 *   runMonitor         — Audit HTTP + alerte expiration token Beds24
 *   runWeeklyReport    — Rapport hebdomadaire (occupation, revenus, arrivées)
 *   runPrixRecap       — Rappel lundi : vérifier/synchroniser les prix Airbnb
 *   runMonthlyExport   — Export CSV comptable mensuel
 *   runCautionAutoRelease — Libération automatique des cautions Stripe J+3
 *
 * Secrets requis :
 *   RESEND_API_KEY        — Resend (email)
 *   APPS_SCRIPT_URL       — Google Apps Script
 *   NTFY_TOPIC            — Topic ntfy.sh pour notifs ménage (ex: menage-amaryllis-2025)
 *   NOTIFICATION_EMAIL    — Email hôte (défaut: contact@villamaryllis.com)
 *   BEDS24_TOKEN          — Token API Beds24 V2 (optionnel, alerte expiration)
 *   STRIPE_SECRET_KEY     — Stripe (caution + auto-release)
 *   WORKER_SECRET         — Token de sécurité pour les endpoints déclencheurs
 */

import { clog, redactName } from "./_logger.js";

// ── iCal URLs Airbnb ─────────────────────────────────────────────────────────
// URLs Airbnb — lues depuis les secrets wrangler (ICAL_AIRBNB_*)
// Fallback sur les valeurs hardcodées pour la rétrocompatibilité
// Pour migrer : wrangler secret put ICAL_AIRBNB_AMARYLLIS --name amaryllis-ical-sync
const ICAL_AIRBNB_FALLBACK = {
  amaryllis:  "https://www.airbnb.fr/calendar/ical/54269844.ics?t=681e7d55c76a4845839d24c0bc18ca94",
  schoelcher: "https://www.airbnb.fr/calendar/ical/24242415.ics?t=400f2712fa95485692d5911972f5533d",
  geko:       "https://www.airbnb.fr/calendar/ical/1263155865459755724.ics?t=1c95f057feda4b2fa08519aad1001ca9",
  mabouya:    "https://www.airbnb.fr/calendar/ical/1046596752160926069.ics?t=05c0e5dbdd9542878d58aa760416cf4f",
  zandoli:    "https://www.airbnb.fr/calendar/ical/792768220924504884.ics?t=cfc774d9c7fa40bfbe5f0757ba06b090",
};

function getAirbnbUrls(env) {
  const map = {};
  const keys = { amaryllis: "ICAL_AIRBNB_AMARYLLIS", geko: "ICAL_AIRBNB_GEKO",
                 mabouya: "ICAL_AIRBNB_MABOUYA", schoelcher: "ICAL_AIRBNB_SCHOELCHER",
                 zandoli: "ICAL_AIRBNB_ZANDOLI" };
  for (const [bienId, envKey] of Object.entries(keys)) {
    map[bienId] = env[envKey] || ICAL_AIRBNB_FALLBACK[bienId];
  }
  return map;
}

// URLs iCal Booking.com — SOURCE UNIQUE = projet Pages (secrets ICAL_BOOKING_*),
// lue au runtime via /api/ical-config (auth POSTSTAY_SECRET). Le Worker a son PROPRE
// store de secrets : dupliquer les URLs ici avait créé une divergence silencieuse
// (Worker sans aucun secret Booking → TOUTES les résas Booking invisibles au
// pipeline notif/Sheet/dashboard, alors que le calendrier site restait bloqué car
// Pages, lui, les avait). Fallback sur les secrets env du Worker si la lecture
// Pages échoue (ou s'ils y sont ajoutés un jour). Async : seul appelant = runSync.
const BOOKING_KEYS = { amaryllis: "ICAL_BOOKING_AMARYLLIS", geko: "ICAL_BOOKING_GEKO",
                       mabouya: "ICAL_BOOKING_MABOUYA", schoelcher: "ICAL_BOOKING_SCHOELCHER",
                       zandoli: "ICAL_BOOKING_ZANDOLI" };
async function getBookingUrls(env) {
  // 1) Source unique : projet Pages
  try {
    const siteUrl = env.SITE_URL || "https://villamaryllis.com";
    const secret  = env.POSTSTAY_SECRET || env.WORKER_SECRET || "";
    if (secret) {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(`${siteUrl}/api/ical-config?secret=${encodeURIComponent(secret)}`, { signal: ctrl.signal });
      clearTimeout(tid);
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        const booking = (d && d.booking) || {};
        const map = {};
        for (const bienId of Object.keys(BOOKING_KEYS)) if (booking[bienId]) map[bienId] = booking[bienId];
        if (Object.keys(map).length > 0) return map;
        console.warn("[booking-urls] ical-config OK mais 0 URL Booking — fallback env");
      } else {
        console.warn(`[booking-urls] ical-config HTTP ${r.status} — fallback env`);
      }
    }
  } catch (e) {
    console.warn("[booking-urls] lecture Pages échouée — fallback env:", e.message);
  }
  // 2) Fallback : secrets env du Worker
  const map = {};
  for (const [bienId, envKey] of Object.entries(BOOKING_KEYS)) if (env[envKey]) map[bienId] = env[envKey];
  return map;
}

const NOMS = {
  amaryllis:  "Villa Amaryllis",
  schoelcher: "Bellevue Schœlcher",
  geko:       "Géko",
  mabouya:    "Mabouya",
  zandoli:    "Zandoli",
  iguana:     "Villa Iguana",
  nogent:     "Appartement Nogent",
};

// Plancher absolu = minimums PRIX_LIMITS (App.jsx). Miroir de src/App.jsx PRIX_LIMITS.
// Utilisé si D1 price_min non configuré. Les remises gap/yield ne descendent jamais sous ces seuils.
const SITE_PRIX_CENTS = {
  amaryllis: 20000, zandoli: 10000, iguana: 5000,
  geko: 10000, mabouya: 6000, schoelcher: 9000, nogent: 7000,
};

const GUIDE_URLS = {
  amaryllis:  "https://villamaryllis.com/bienvenue/amaryllis",
  schoelcher: "https://villamaryllis.com/bienvenue/schoelcher",
  geko:       "https://villamaryllis.com/bienvenue/geko",
  mabouya:    "https://villamaryllis.com/bienvenue/mabouya",
  zandoli:    "https://villamaryllis.com/bienvenue/zandoli",
  iguana:     "https://villamaryllis.com/bienvenue/iguana",
  nogent:     "https://villamaryllis.com/bienvenue/nogent",
};

// ── Helpers dates ─────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function diffDays(a, b) {
  return Math.round((new Date(b + "T12:00:00Z") - new Date(a + "T12:00:00Z")) / 86400000);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ── Parser ICS ────────────────────────────────────────────────────────────────
// canal : "airbnb" | "booking". Booking.com N'EXPOSE PAS le nom du voyageur → TOUTE
// réservation y est "CLOSED - Not available". On ne peut donc PAS skipper ces
// événements pour Booking (sinon 0 résa captée — cause de l'incident 26/06). Pour
// Airbnb au contraire, "Not available" = blocage manuel de l'hôte → à ignorer.
function parseICS(text, bienId, canal) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);
  for (const block of blocks) {
    const get = (key) => {
      const m = block.match(new RegExp(key + "[^:]*:([^\\r\\n]+)"));
      return m ? m[1].trim() : "";
    };
    const cleanDate = (s) => {
      const d = s.replace(/T.*/, "");
      return d.length === 8 ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}` : d;
    };
    const ci  = cleanDate(get("DTSTART"));
    const co  = cleanDate(get("DTEND"));
    const uid = get("UID");
    const sum = get("SUMMARY");
    if (!ci || !co || !uid) continue;
    const isBlocked = /not available|blocked|closed/i.test(sum);
    // Airbnb : blocage manuel → ignorer. Booking : c'est une vraie résa → garder.
    if (isBlocked && canal !== "booking") continue;
    // Booking : un bloc multi-mois = fermeture manuelle de l'hôte, pas un séjour.
    // Filtre les ranges aberrants (ex: 6 mois) sans risquer un vrai séjour (<90 nuits).
    if (canal === "booking" && isBlocked) {
      const nights = diffDays(ci, co);
      if (nights > 90) { console.log(`[parseICS] ${bienId}/booking: bloc ${nights} nuits (${ci}→${co}) = fermeture, ignoré`); continue; }
    }
    const desc = get("DESCRIPTION").replace(/\\n/g, "\n");
    const descGet = (patterns) => {
      for (const p of patterns) {
        const m = desc.match(new RegExp(p + "\\s*[:\\-]\\s*([^\\n\\r]+)", "i"));
        if (m) return m[1].trim();
      }
      return "";
    };
    const montantRaw = descGet(["Montant total","Total","Amount","Payout"]);
    const montantParsed = montantRaw ? parseFloat(montantRaw.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;
    const montant = (montantParsed > 0 && montantParsed <= 50000) ? montantParsed : 0;
    let voyageur = sum.replace(/^(Réservé|Reserved|Booking)\s*[-–]?\s*/i, "").replace(/\(.*\)/g, "").trim();
    // Booking ne donne pas le nom ("CLOSED - Not available") → placeholder à compléter dans l'admin.
    if (!voyageur || /closed|not available|blocked/i.test(voyageur)) voyageur = "Voyageur";
    events.push({ uid, bienId, nom: NOMS[bienId] || bienId, voyageur, checkin: ci, checkout: co, montant });
  }
  return events;
}

// Parse "toutes les plages indisponibles" sans filtrage — pour l'occupation réelle
// (RM/vacance/gap/yield), PAS pour les notifs/Sheets. Bug trouvé le 2026-07-06 : sur
// certaines annonces Airbnb (ex. Schœlcher, Amaryllis), le SUMMARY générique "Airbnb
// (Not available)" est utilisé À LA FOIS pour les blocages manuels de l'hôte ET pour
// les vraies résas voyageur — Airbnb ne distingue pas les deux dans ce flux iCal.
// parseICS() ci-dessus continue de les ignorer (à raison : pas de nom/montant fiable,
// donc pas de notif "nouvelle résa" ni de ligne Sheet) mais ça faisait aussi croire à
// l'occupation réelle (rm_kpi_snapshots), aux alertes vacance et au gap/yield pricing
// que ces dates étaient VIDES alors qu'elles sont occupées → occupancy-stats à 0%
// pour un bien complet, risque de fausse remise vacance. Ce parseur garde TOUTE plage
// (bloc manuel ou résa, peu importe) comme "indisponible", ce qui est le bon signal
// pour ces 4 usages.
function parseICSAvailability(text, bienId) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);
  for (const block of blocks) {
    const get = (key) => {
      const m = block.match(new RegExp(key + "[^:]*:([^\\r\\n]+)"));
      return m ? m[1].trim() : "";
    };
    const cleanDate = (s) => {
      const d = s.replace(/T.*/, "");
      return d.length === 8 ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}` : d;
    };
    const ci = cleanDate(get("DTSTART"));
    const co = cleanDate(get("DTEND"));
    if (!ci || !co) continue;
    events.push({ bienId, checkin: ci, checkout: co });
  }
  return events;
}

async function fetchICS(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AmaryllisSync/1.0)" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes("VCALENDAR")) throw new Error("Format ICS invalide");
    return text;
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`Timeout (>${timeoutMs}ms) : ${url}`);
    throw err;
  } finally {
    clearTimeout(tid);
  }
}

// ── WhatsApp via CallMeBot ───────────────────────────────────────────────────
async function sendWhatsApp(env, text) {
  const topic = env.NTFY_TOPIC;
  if (!topic) {
    console.log("[ntfy] NTFY_TOPIC absent — ignoré");
    return;
  }
  try {
    const r = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Title": "🏠 Ménage",
        "Priority": "high",
        "Tags": "broom",
      },
      body: text,
    });
    console.log(`[ntfy] ${r.ok ? "✓ envoyé" : "✗ erreur " + r.status}`);
  } catch (e) {
    console.error("[ntfy] Erreur:", e.message);
  }
}

// Adresse expéditeur vérifiée. ⚠️ Une variable RESEND_FROM cassée (domaine manquant,
// ex "Amaryllis <notifications@>") faisait rejeter TOUS les emails par Resend
// ("Domain not verified"). On valide donc la présence d'un domaine FQDN ; sinon on
// retombe sur l'adresse vérifiée en dur. Robuste quelle que soit la valeur d'env.
const VERIFIED_FROM = "Amaryllis <contact@villamaryllis.com>";
function resendFrom(env) {
  const f = env && env.RESEND_FROM;
  return (f && /@[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(f)) ? f : VERIFIED_FROM;
}

// ── Email via Resend ─────────────────────────────────────────────────────────
async function sendEmail(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY) return;
  const dest = to || env.NOTIFICATION_EMAIL || "contact@villamaryllis.com";
  const fromAddr = resendFrom(env);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromAddr,
      to: String(dest).split(",").map(s => s.trim()).filter(Boolean), // multi-destinataires (hotmail + gmail)
      subject,
      html,
    }),
  });
  if (!r.ok) console.error("[resend] Erreur:", await r.text());
  else console.log(`[resend] ✓ "${subject}"`);
}

function emailWrapper(content) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#f4ecdc;border-radius:12px;">${content}<p style="margin-top:24px;font-size:10px;color:#b0a898;text-align:center;">Amaryllis · automatique</p></div>`;
}

// ── Montants caution par bien ─────────────────────────────────────────────────
const CAUTION_AMOUNTS = {
  amaryllis: 1500, schoelcher: 1000, zandoli: 700,
  iguana: 500, geko: 500, mabouya: 500, nogent: 500,
};

// Crée un lien Stripe Checkout (caution) depuis le worker
async function createCautionLink(env, { bienId, voyageur, checkin, checkout }) {
  if (!env.STRIPE_SECRET_KEY) return null;
  const amount    = CAUTION_AMOUNTS[bienId] || 500;
  const bienNom   = NOMS[bienId] || bienId;
  const expiresAt = Math.floor(Date.now() / 1000) + 72 * 3600;

  const payload = new URLSearchParams({
    mode: "payment",
    "payment_intent_data[capture_method]": "manual",
    "payment_intent_data[metadata][type]":     "caution",
    "payment_intent_data[metadata][bienId]":   bienId,
    "payment_intent_data[metadata][checkin]":  checkin || "",
    "payment_intent_data[metadata][checkout]": checkout,
    "payment_intent_data[metadata][voyageur]": voyageur || "",
    "line_items[0][price_data][currency]":     "eur",
    "line_items[0][price_data][unit_amount]":  String(amount * 100),
    "line_items[0][price_data][product_data][name]": `Caution — ${bienNom}`,
    "line_items[0][price_data][product_data][description]":
      `Préautorisation de caution. Votre carte ne sera PAS débitée. Libération automatique 3 jours après votre départ (${checkout}).`,
    "line_items[0][quantity]": "1",
    "success_url":  "https://villamaryllis.com/?caution=ok",
    "cancel_url":   "https://villamaryllis.com/?caution=cancelled",
    "expires_at":   String(expiresAt),
    "locale":       "fr",
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    });
    const data = await res.json();
    return data.url || null;
  } catch { return null; }
}

// ── Nouvelle réservation ─────────────────────────────────────────────────────
async function sendNouvellesResas(env, nouvelles) {
  if (!env.RESEND_API_KEY) return;

  const cards = await Promise.all(nouvelles.map(async e => {
    const nuits = diffDays(e.checkin, e.checkout);
    const guideUrl = GUIDE_URLS[e.bienId] || "";
    // Caution uniquement pour Booking.com et direct (Airbnb gère lui-même)
    const cautionUrl = e.canal !== "airbnb" ? await createCautionLink(env, {
      bienId:   e.bienId,
      voyageur: e.voyageur,
      checkin:  e.checkin,
      checkout: e.checkout,
    }) : null;
    const cautionAmt = CAUTION_AMOUNTS[e.bienId] || 500;
    const canal = e.canal === "airbnb" ? "🏠 Airbnb" : e.canal === "booking" ? "🔵 Booking" : e.canal;

    return `
      <div style="background:#fff;border-radius:12px;padding:20px 22px;margin-bottom:16px;border-left:4px solid #0e3b3a;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
          <div>
            <div style="font-size:16px;font-weight:800;color:#0e3b3a;">${e.nom}</div>
            <div style="font-size:13px;color:#7a6b5a;margin-top:2px;">${e.voyageur || "Voyageur"} · ${canal}</div>
          </div>
          <div style="background:#e0f0e8;color:#1a6e3c;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;">${nuits} nuit${nuits > 1 ? "s" : ""}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;color:#0e3b3a;margin-bottom:14px;">
          <div>📅 <strong>Arrivée :</strong> ${formatDate(e.checkin)}</div>
          <div>🚪 <strong>Départ :</strong> ${formatDate(e.checkout)}</div>
          ${e.montant ? `<div>💶 <strong>Montant :</strong> ${e.montant}€</div>` : ""}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${guideUrl ? `<a href="${guideUrl}" style="background:#0e3b3a;color:#faf5e9;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;">📖 Guide voyageur</a>` : ""}
          ${cautionUrl ? `<a href="${cautionUrl}" style="background:#6366f1;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;">🔒 Lien caution ${cautionAmt}€</a>` : ""}
        </div>
        ${cautionUrl ? `<div style="font-size:10px;color:#b0a898;margin-top:8px;">Lien caution valable 72h · Copier et envoyer au voyageur via Airbnb/Booking</div>` : ""}
        ${(e.canal === "airbnb" || e.canal === "booking") ? `<div style="font-size:11px;color:#92400e;background:rgba(245,158,11,0.12);border-radius:6px;padding:8px 12px;margin-top:10px;">✏️ <strong>À faire dans l'admin :</strong> renseigner le <strong>nom du voyageur</strong> et le <strong>prix</strong> — ${e.canal === "airbnb" ? "Airbnb" : "Booking"} ne les transmet pas (sinon le CA est sous-compté).</div>` : ""}
      </div>
    `;
  }));

  await sendEmail(env, {
    subject: `🔔 ${nouvelles.length} nouvelle${nouvelles.length > 1 ? "s" : ""} réservation${nouvelles.length > 1 ? "s" : ""}`,
    html: emailWrapper(`
      <h2 style="color:#0e3b3a;margin:0 0 6px">🌺 Nouvelle${nouvelles.length > 1 ? "s" : ""} réservation${nouvelles.length > 1 ? "s" : ""}</h2>
      <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${new Date().toLocaleString("fr-FR", { timeZone: "America/Martinique" })} (heure Martinique)</p>
      ${cards.join("")}
      <div style="margin-top:20px;text-align:center;">
        <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px;">Ouvrir le planning →</a>
      </div>
    `),
  });

  // Notification push temps réel (ntfy) — en plus de l'email
  if (env.NTFY_TOPIC) {
    try {
      const lignes = nouvelles.map(e => {
        const n = diffDays(e.checkin, e.checkout);
        const c = e.canal === "airbnb" ? "Airbnb" : e.canal === "booking" ? "Booking" : (e.canal || "Direct");
        return `${e.nom} · ${formatDate(e.checkin)}→${formatDate(e.checkout)} (${n} nuit${n > 1 ? "s" : ""}) · ${c}`;
      }).join("\n");
      // Rappel : les résas OTA (Airbnb/Booking via iCal) arrivent sans nom ni prix → à compléter à la main.
      const otaACompleter = nouvelles.filter(e => e.canal === "airbnb" || e.canal === "booking").length;
      const body = otaACompleter > 0
        ? `${lignes}\n\n✏️ ${otaACompleter} à compléter dans l'admin (nom + prix — non transmis par l'OTA)`
        : lignes;
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Title": `🌺 ${nouvelles.length} nouvelle${nouvelles.length > 1 ? "s" : ""} réservation${nouvelles.length > 1 ? "s" : ""}`,
          "Priority": "high",
          "Tags": "tada,calendar",
          "Click": `${env.SITE_URL || "https://villamaryllis.com"}/admin`,
        },
        body,
      });
      console.log("[ntfy] ✓ notif nouvelle réservation envoyée");
    } catch (e) {
      console.error("[ntfy] notif résa erreur:", e.message);
    }
  }
}

// ── Rappels hôte (J-3 / J-1 / J+1 / J+2 avis / J-7 direct) ─────────────────
// RM-16 (hospitalité) — digest HÔTE des arrivées de demain (J+1) en ntfy, avec flag prioritaire
// sur les biens notés <4,7 (à soigner pour remonter la note). Miroir des notes : src/data/biens.js.
const LOW_RATED = new Set(["zandoli", "mabouya"]); // notes <4,7 — MAJ si les notes évoluent

async function runArrivalsDigest(env, allEvents) {
  if (!env.NTFY_TOPIC) return;
  const tomorrow = addDays(today(), 1);
  const arrivals = (allEvents || []).filter(e => e.checkin === tomorrow);
  if (!arrivals.length) { console.log("[arrivals] aucune arrivée demain"); return; }
  const lines = arrivals.map(e => {
    const who = e.voyageur && e.voyageur !== "?" ? e.voyageur : "voyageur";
    return `• ${e.nom || e.bienId} — ${who}${LOW_RATED.has(e.bienId) ? " ⭐ soigner (note basse)" : ""}`;
  });
  const hasPrio = arrivals.some(e => LOW_RATED.has(e.bienId));
  try {
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
      method: "POST",
      body: `Demain (${formatDate(tomorrow)}) — ${arrivals.length} arrivée(s) :\n${lines.join("\n")}\n\n→ préparer le geste d'accueil (RM-16).`,
      headers: { "Title": "🛬 Arrivées demain", "Priority": hasPrio ? "high" : "default", "Tags": "wave" },
    });
    console.log(`[arrivals] digest poussé (${arrivals.length} arrivées, prio=${hasPrio})`);
  } catch (e) { console.error("[arrivals] ntfy:", e.message); }
}

async function runReminders(env, allEvents, allEventsCtx) {
  const todayStr  = today();
  const eventsCtx = allEventsCtx || allEvents; // contexte complet pour chercher prochaine arrivée

  for (const e of allEvents) {
    const daysToCheckin  = diffDays(todayStr, e.checkin);
    const daysToCheckout = diffDays(todayStr, e.checkout);
    const nom   = e.nom;
    const guest = e.voyageur;
    const guide = GUIDE_URLS[e.bienId] || "https://villamaryllis.com";
    const nights = diffDays(e.checkin, e.checkout);

    // ── J-3 : rappel pré-arrivée ─────────────────────────────────────────────
    if (daysToCheckin === 3) {
      const kvKey = `reminder:j3:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      await sendEmail(env, {
        subject: `📋 J-3 · ${guest} arrive dans 3 jours — ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">📋 Rappel J-3 · Pré-arrivée</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · arrivée le ${formatDate(e.checkin)}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">💬 Message à envoyer via Airbnb/Booking :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

Votre séjour à ${nom} approche — nous avons hâte de vous accueillir !

Voici quelques informations pratiques pour préparer votre arrivée :
📅 Arrivée : ${formatDate(e.checkin)} à partir de 15h00
📅 Départ : ${formatDate(e.checkout)} avant 11h00
📖 Guide complet (WiFi, accès, bons plans) : ${guide}

N'hésitez pas si vous avez des questions. À très bientôt !
— Vincent</div>
          </div>
          ${(e.canal === "airbnb" || e.canal === "booking") ? `
          <div style="margin-top:12px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 14px;font-size:12px;color:#713f12;">
            ⚠️ <strong>${e.canal === "airbnb" ? "Airbnb" : "Booking.com"} envoie déjà ses propres rappels au voyageur.</strong> N'envoie ce message que si tu souhaites ajouter une info spécifique — sinon le voyageur recevrait 2 messages identiques.
          </div>` : ""}
          <div style="margin-top:16px;text-align:center;">
            <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Voir le planning →</a>
          </div>
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      clog("reminders", "info", { step: "j-3", bien: nom, guest: redactName(guest) });
    }

    // ── Mi-séjour : check satisfaction + upsells (J+3 après check-in) ─────────
    // Ne déclenche que si le séjour fait 5+ nuits et que le voyageur est encore là
    if (daysToCheckin === -3 && daysToCheckout >= 1 && nights >= 5) {
      const kvKey = `reminder:midstay:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      const canalNom = e.canal === "airbnb" ? "Airbnb" : e.canal === "booking" ? "Booking.com" : "messagerie directe";
      const bookingLink = `https://villamaryllis.com/${e.bienId}`;

      await sendEmail(env, {
        subject: `🌟 Mi-séjour · ${guest} est chez vous depuis 3 jours — ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">🌟 Mi-séjour · Satisfaction + services</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · arrivée le ${formatDate(e.checkin)} · départ le ${formatDate(e.checkout)} (${daysToCheckout} nuit${daysToCheckout > 1 ? "s" : ""} restante${daysToCheckout > 1 ? "s" : ""})</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">✅ 2 actions à faire maintenant :</p>
            <ul style="margin:0 0 20px;padding-left:20px;font-size:13px;color:#3d2c1e;line-height:2.2;">
              <li>
                💬 <strong>Vérifier la satisfaction</strong> — envoyer ce message via ${canalNom} :<br/>
                <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:12px 16px;font-size:12px;color:#3d2c1e;white-space:pre-line;margin-top:8px;">Bonjour ${guest}, j'espère que votre séjour à ${nom} se déroule pour le mieux ! Tout est à votre convenance ? N'hésitez pas si vous avez besoin de quoi que ce soit. Profitez bien de ces derniers jours 🌴</div>
              </li>
              <li style="margin-top:12px;">
                🎁 <strong>Proposer des services supplémentaires</strong> :<br/>
                <ul style="margin:8px 0 0 0;padding-left:16px;font-size:12px;line-height:2;">
                  <li>🍽️ Chef à domicile (+150€/repas) — à proposer si séjour longue durée</li>
                  <li>🚗 Transfert retour aéroport (+80€)</li>
                  <li>🧹 Ménage intermédiaire (+60€) — si séjour >7 nuits</li>
                </ul>
              </li>
            </ul>
          </div>
          <div style="margin-top:16px;background:#e8f4f3;border-radius:8px;padding:14px 18px;font-size:12px;color:#0e3b3a;">
            📌 Rappel : le départ est prévu le ${formatDate(e.checkout)} avant 11h. L'équipe ménage est planifiée pour après le départ.
          </div>
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 30 });
      clog("reminders", "info", { step: "mi-sejour", bien: nom, guest: redactName(guest) });
    }

    // ── J-1 : rappel pré-départ + WhatsApp ménage ────────────────────────────
    if (daysToCheckout === 1) {
      const kvKey = `reminder:j1:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      // Email hôte
      await sendEmail(env, {
        subject: `🧹 J-1 · ${guest} part demain — ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">🧹 Rappel J-1 · Départ demain</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · départ le ${formatDate(e.checkout)} avant 11h</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">💬 Message à envoyer via Airbnb/Booking :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

Votre séjour touche à sa fin — nous espérons que vous avez passé un excellent moment à ${nom} !

Pour le départ demain (avant 11h) :
✅ Éteindre climatisation et lumières
✅ Fermer fenêtres et volets
✅ Sortir les poubelles
✅ Remettre les clés dans le boîtier
✅ Laisser les draps sur le lit

Si vous avez apprécié votre séjour, un avis sur Airbnb nous aide énormément 🙏

Merci et à bientôt !
— Vincent</div>
          </div>
        `),
      });

      // WhatsApp ménage — checklist détaillée avec prochaine arrivée
      const nextArrival = eventsCtx
        .filter(x => x.bienId === e.bienId && x.checkin > e.checkout)
        .sort((a, b) => a.checkin.localeCompare(b.checkin))[0];
      const nextArrivalLine = nextArrival
        ? `➡️ Prochaine arrivée : ${formatDate(nextArrival.checkin)} (${nextArrival.voyageur})`
        : "➡️ Prochaine arrivée : aucune planifiée";
      const waText = [
        `🏠 MÉNAGE — ${nom}`,
        `👤 Voyageur : ${guest} (${nights} nuit${nights > 1 ? "s" : ""})`,
        `⏰ Départ avant 11h — ${formatDate(e.checkout)}`,
        nextArrivalLine,
        "",
        "📋 Checklist ménage :",
        "□ Retirer et mettre draps/serviettes à laver",
        "□ Vider et sortir les poubelles",
        "□ Nettoyage complet cuisine (plan de travail, four, frigo)",
        "□ Nettoyage WC",
        "□ Nettoyage salle de bain (douche, lavabo, miroir)",
        "□ Vérifier inventaire (vaisselle, linge, équipements)",
        "□ Aérer + remettre climatisation sur mode auto",
      ].join("\n");
      await sendWhatsApp(env, waText);

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      clog("reminders", "info", { step: "j-1-whatsapp-menage", bien: nom, guest: redactName(guest) });
    }

    // ── J+1 : message post-séjour ────────────────────────────────────────────
    if (daysToCheckout === -1) {
      const kvKey = `reminder:j1plus:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      await sendEmail(env, {
        subject: `⭐ J+1 · Message post-séjour à envoyer — ${guest} · ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">⭐ Rappel J+1 · Post-séjour</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · séjour du ${formatDate(e.checkin)} au ${formatDate(e.checkout)}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">💬 Message à envoyer via Airbnb/Booking :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

J'espère que votre séjour à ${nom} vous a plu ! C'est toujours un plaisir d'accueillir des voyageurs attentionnés.

Si vous souhaitez revenir, sachez que vous pouvez réserver directement sur notre site et économiser 15% par rapport à Airbnb :
🌐 https://villamaryllis.com

Un avis de votre part nous aiderait vraiment — merci d'avance 🙏

À bientôt en Martinique !
— Vincent</div>
          </div>
          ${(e.canal === "airbnb" || e.canal === "booking") ? `
          <div style="margin-top:12px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 14px;font-size:12px;color:#713f12;">
            ⚠️ <strong>${e.canal === "airbnb" ? "Airbnb" : "Booking.com"} envoie déjà un message post-séjour automatique.</strong> N'envoie ce message que si tu veux personnaliser — sinon le voyageur recevrait 2 messages.
          </div>` : ""}
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      clog("reminders", "info", { step: "j+1", bien: nom, guest: redactName(guest) });
    }

    // ── J+2 : demande d'avis ─────────────────────────────────────────────────
    if (daysToCheckout === -2) {
      const kvKey = `reminder:j2review:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      const bookingLink = `https://villamaryllis.com/${e.bienId}`;
      const canalNote = e.canal === "airbnb"
        ? `<p style="margin:12px 0 0;font-size:12px;color:#0f766e;background:#e0f8f4;padding:10px 14px;border-radius:6px;">💡 Rappel : pense à laisser un avis au voyageur aussi sur Airbnb !</p>`
        : "";

      await sendEmail(env, {
        subject: `⭐ Demande d'avis — ${guest} · ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">⭐ Rappel J+2 · Demande d'avis</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · séjour du ${formatDate(e.checkin)} au ${formatDate(e.checkout)}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">💬 Message à copier-coller sur Airbnb/Booking pour demander un avis :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

J'espère que votre retour s'est bien passé 🙂 Votre séjour à ${nom} nous a fait très plaisir !

Si vous avez quelques minutes, un avis de votre part nous aide énormément à accueillir de futurs voyageurs dans les meilleures conditions.

Vous pouvez également retrouver et réserver directement nos logements sur :
🌐 ${bookingLink}

Merci encore, et à bientôt peut-être en Martinique !
— Vincent</div>
          </div>
          ${canalNote}
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 21 });
      clog("reminders", "info", { step: "j+2-avis", bien: nom, guest: redactName(guest) });
    }

    // ── J+3 : avis Google + fidélisation ─────────────────────────────────────
    if (daysToCheckout === -3) {
      const kvKey = `reminder:j3google:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      const bookingLink = `https://villamaryllis.com/${e.bienId}`;
      const directLink = `https://villamaryllis.com/reservation-directe-martinique`;
      const googleReviewUrl = env.GOOGLE_REVIEW_URL || "https://search.google.com/local/writereview?placeid=ChIJWbdLR7ghDowRCpp037VX9Jk";
      // Code promo unique par séjour — format mémorable
      const promoCode = `AMARYLLIS-${e.bienId.toUpperCase().slice(0,4)}-DIRECT`;

      await sendEmail(env, {
        subject: `🌟 J+3 · Avis Google + fidélisation — ${guest} · ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">🌟 Rappel J+3 · Avis Google & fidélisation</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · séjour du ${formatDate(e.checkin)} au ${formatDate(e.checkout)}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">📌 2 actions post-séjour à faire :</p>
            <ul style="margin:0 0 20px;padding-left:20px;font-size:13px;color:#3d2c1e;line-height:2.2;">
              <li>
                ⭐ <strong>Demander un avis Google</strong> — envoyer ce lien à ${guest} :<br/>
                <a href="${googleReviewUrl}" style="color:#0e3b3a;word-break:break-all;">${googleReviewUrl}</a>
              </li>
              <li>
                🎁 <strong>Offre fidélité −10%</strong> — réservation directe, sans frais Airbnb :<br/>
                Code : <strong style="font-family:monospace;font-size:14px;color:#c47254;">${promoCode}</strong><br/>
                Page directe : <a href="${directLink}" style="color:#0e3b3a;">${directLink}</a><br/>
                <span style="font-size:12px;color:#7a6b5a;">Mentionner le code lors de la réservation — économie de 12–18% vs Airbnb/Booking</span>
              </li>
            </ul>
            <p style="margin:0 0 12px;font-weight:700;">💬 Message à copier-coller pour ${guest} :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

J'espère que votre retour s'est bien passé et que votre séjour à ${nom} vous a laissé de beaux souvenirs !

Un service comme le vôtre mérite un avis — si vous avez 2 minutes, cela nous aide énormément :
⭐ ${googleReviewUrl}

Et si l'envie de revenir en Martinique vous prend, sachez que vous pouvez réserver directement sur notre site (sans frais Airbnb ni Booking, soit 12–18% d'économie) :
🌐 ${directLink}

Mentionnez le code <strong>${promoCode}</strong> pour bénéficier de -10% supplémentaires sur votre prochain séjour.

À très bientôt peut-être !
— Vincent, Résidence Amaryllis</div>
          </div>
          <div style="margin-top:16px;text-align:center;">
            <a href="${googleReviewUrl}" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;margin-right:8px;">Avis Google →</a>
            <a href="${directLink}" style="background:#c47254;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Page réservation directe →</a>
          </div>
          <p style="font-size:11px;color:#888;margin-top:20px;">💡 La caution de ${CAUTION_AMOUNTS[e.bienId] || 500}€ est libérée automatiquement aujourd'hui (J+3).</p>
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 30 });
      clog("reminders", "info", { step: "j+3-google-fidelisation", bien: nom, guest: redactName(guest) });
    }

    // ── J-7 : réservation directe ────────────────────────────────────────────
    if (daysToCheckin === 7 && e.canal !== "airbnb" && e.canal !== "booking") {
      const kvKey = `reminder:j7direct:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      const cautionAmt = CAUTION_AMOUNTS[e.bienId] || 500;
      const guide = GUIDE_URLS[e.bienId] || "https://villamaryllis.com";

      await sendEmail(env, {
        subject: `🌺 J-7 · Réservation directe — ${guest} arrive bientôt · ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">🌺 Rappel J-7 · Réservation directe</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · arrivée le ${formatDate(e.checkin)}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">✅ Checklist actions hôte — réservation directe :</p>
            <ul style="margin:0;padding-left:20px;font-size:13px;color:#3d2c1e;line-height:2;">
              <li>📖 Envoyer le guide voyageur : <a href="${guide}" style="color:#0e3b3a;">${guide}</a></li>
              <li>📅 Confirmer l'heure d'arrivée et modalités d'accès avec ${guest}</li>
              <li>🔒 Envoyer le lien de caution (${cautionAmt}€) si pas encore fait</li>
              <li>🏠 Vérifier l'état du logement + linge de maison prêt</li>
              <li>📞 Partager un numéro d'urgence joignable le jour J</li>
            </ul>
          </div>
          <div style="margin-top:16px;text-align:center;">
            <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Voir le planning →</a>
          </div>
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      clog("reminders", "info", { step: "j-7-direct", bien: nom, guest: redactName(guest) });
    }

    // ── J-7 : conseils locaux (Airbnb / Booking) ──────────────────────────────
    if (daysToCheckin === 7 && (e.canal === "airbnb" || e.canal === "booking")) {
      const kvKey = `reminder:j7conseils:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      const guide = GUIDE_URLS[e.bienId] || "https://villamaryllis.com";
      const canalNom = e.canal === "airbnb" ? "Airbnb" : "Booking.com";
      const canalIcon = e.canal === "airbnb" ? "🏠" : "📋";
      const nights = diffDays(e.checkin, e.checkout);

      await sendEmail(env, {
        subject: `🌴 J-7 · Conseils locaux à partager — ${guest} · ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">🌴 Rappel J-7 · Conseils locaux à partager</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · arrivée le ${formatDate(e.checkin)} · ${nights} nuit${nights > 1 ? "s" : ""} · via ${canalNom}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">${canalIcon} Message à envoyer via ${canalNom} :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

Nous avons hâte de vous accueillir dans ${nom} dans une semaine !

Voici notre guide voyageur avec nos adresses et bons plans pour votre séjour :
👉 ${guide}

Vous y trouverez :
• Les meilleures plages à proximité
• Nos restaurants préférés (avec les adresses que les guides ne mentionnent pas)
• Les activités incontournables selon la saison
• Les infos pratiques pour votre arrivée

N'hésitez pas à nous contacter si vous avez des questions. À très bientôt !
— Vincent & Amaryllis Locations</div>
          </div>
          <div style="background:#e8f4f3;border-radius:8px;padding:16px 20px;margin-top:16px;font-size:13px;color:#0e3b3a;">
            <p style="margin:0 0 8px;font-weight:700;">✅ Checklist J-7 :</p>
            <ul style="margin:0;padding-left:20px;line-height:2;">
              <li>Copier-coller le message ci-dessus sur ${canalNom}</li>
              <li>Vérifier les horaires d'arrivée avec ${guest}</li>
              <li>Préparer les codes d'accès et plan de la maison</li>
              <li>Linge de maison commandé / confirmé</li>
            </ul>
          </div>
          <div style="margin-top:16px;text-align:center;">
            <a href="${guide}" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Voir le guide voyageur →</a>
          </div>
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      clog("reminders", "info", { step: "j-7-conseils-locaux", bien: nom, guest: redactName(guest) });
    }
  }
}

// ── Rapport hebdomadaire (lundi) ─────────────────────────────────────────────
// Prix moyens par nuit (estimation pour le rapport — hors saison)
const BASE_PRIX = {
  amaryllis: 300, schoelcher: 130, zandoli: 200,
  iguana: 150, geko: 110, mabouya: 100, nogent: 85,
};

async function runWeeklyReport(env, allEvents) {
  const todayStr = today();
  const in7  = addDays(todayStr, 7);
  const in14 = addDays(todayStr, 14);
  const in30 = addDays(todayStr, 30);

  // ── Arrivées 14j ──
  const upcoming = allEvents
    .filter(e => e.checkin >= todayStr && e.checkin <= in14)
    .sort((a, b) => a.checkin.localeCompare(b.checkin));

  // ── Départs 7j ──
  const departures = allEvents
    .filter(e => e.checkout >= todayStr && e.checkout <= in7)
    .sort((a, b) => a.checkout.localeCompare(b.checkout));

  // ── Occupation + revenu par bien (7j et 30j) ──
  const occ7 = {}, occ30 = {}, rev7 = {}, rev30 = {};
  for (const e of allEvents) {
    for (const [horizon, occMap, revMap, days] of [[in7, occ7, rev7, 7], [in30, occ30, rev30, 30]]) {
      if (e.checkin > horizon || e.checkout < todayStr) continue;
      const start = e.checkin > todayStr ? e.checkin : todayStr;
      const end   = e.checkout < horizon ? e.checkout : horizon;
      const n = diffDays(start, end);
      occMap[e.bienId] = (occMap[e.bienId] || 0) + n;
      revMap[e.bienId] = (revMap[e.bienId] || 0) + n * (BASE_PRIX[e.bienId] || 100);
    }
  }

  const totalRev7  = Object.values(rev7).reduce((s, v) => s + v, 0);
  const totalRev30 = Object.values(rev30).reduce((s, v) => s + v, 0);
  const totalOcc7  = Object.values(occ7).reduce((s, v) => s + v, 0);
  const maxOcc7    = Object.keys(NOMS).length * 7;
  const globalPct7 = Math.round(totalOcc7 / maxOcc7 * 100);

  // ── Trous détectés (gap pricing) ──
  const gapRaw = await env.ICAL_STORE.get("gap_prices").catch(() => null);
  const gaps = gapRaw ? JSON.parse(gapRaw) : {};
  const gapCount = Object.values(gaps).reduce((s, m) => s + Object.keys(m).length, 0);
  const gapBiens = Object.entries(gaps).filter(([, m]) => Object.keys(m).length > 0).map(([id]) => NOMS[id] || id);

  // ── Lignes tableau occupation ──
  const propRows = Object.entries(NOMS).map(([id, nom]) => {
    const o7  = occ7[id]  || 0;
    const o30 = occ30[id] || 0;
    const p7  = Math.round(o7  / 7  * 100);
    const p30 = Math.round(o30 / 30 * 100);
    const bar = "█".repeat(Math.round(p7 / 10)) + "░".repeat(10 - Math.round(p7 / 10));
    const r7  = (rev7[id]  || 0).toLocaleString("fr-FR");
    const hasGap = gaps[id] && Object.keys(gaps[id]).length > 0;
    return `<tr style="border-bottom:1px solid #f0e8d8;">
      <td style="padding:8px 12px;color:#0e3b3a;font-weight:600;">${nom}${hasGap ? ' <span style="font-size:10px;background:#e0f8f4;color:#0f766e;padding:1px 5px;border-radius:8px;">-prix gap</span>' : ""}</td>
      <td style="padding:8px 12px;font-family:monospace;font-size:12px;color:#0e3b3a;">${bar}</td>
      <td style="padding:8px 12px;text-align:right;color:#7a6b5a;">${p7}%</td>
      <td style="padding:8px 12px;text-align:right;color:#7a6b5a;">${p30}%</td>
      <td style="padding:8px 12px;text-align:right;color:#1a6e3c;font-weight:600;">~${r7}€</td>
    </tr>`;
  }).join("");

  const arriveeRows = upcoming.map(e => {
    const canal = e.canal === "airbnb" ? "🏠" : e.canal === "booking" ? "🔵" : "🌐";
    return `<tr style="border-bottom:1px solid #f0e8d8;">
      <td style="padding:6px 12px;color:#0e3b3a;">${formatDate(e.checkin)}</td>
      <td style="padding:6px 12px;font-weight:600;color:#0e3b3a;">${e.nom}</td>
      <td style="padding:6px 12px;color:#7a6b5a;">${e.voyageur || "—"} ${canal}</td>
      <td style="padding:6px 12px;color:#7a6b5a;text-align:right;">${diffDays(e.checkin, e.checkout)} nuits</td>
    </tr>`;
  }).join("") || `<tr><td colspan="4" style="padding:12px;color:#b0a898;text-align:center;font-style:italic;">Aucune arrivée prévue</td></tr>`;

  const departRows = departures.map(e =>
    `<tr style="border-bottom:1px solid #f0e8d8;">
      <td style="padding:6px 12px;color:#0e3b3a;">${formatDate(e.checkout)}</td>
      <td style="padding:6px 12px;font-weight:600;color:#0e3b3a;">${e.nom}</td>
      <td style="padding:6px 12px;color:#7a6b5a;">${e.voyageur || "—"}</td>
    </tr>`
  ).join("") || `<tr><td colspan="3" style="padding:12px;color:#b0a898;text-align:center;font-style:italic;">Aucun départ cette semaine</td></tr>`;

  const weekLabel = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";

  // ── Réservations directes — 30j glissant (santé projet) ──
  let directCount = 0, directNights = 0, directRevEur = 0;
  if (env.revenue_manager) {
    try {
      const row = await env.revenue_manager.prepare(
        `SELECT COUNT(*) as cnt,
                COALESCE(SUM(CAST(julianday(checkout) - julianday(checkin) AS INTEGER)), 0) as nights,
                COALESCE(SUM(CAST(total AS REAL) / 100.0), 0) as rev
         FROM direct_bookings WHERE created_at >= unixepoch('now', '-30 days') AND (status IS NULL OR status != 'cancelled')`
      ).first();
      directCount  = row?.cnt    || 0;
      directNights = row?.nights || 0;
      directRevEur = Math.round(row?.rev || 0);
    } catch (e) { console.error("[weekly] direct_bookings:", e.message); }
  }
  const directColor = directCount >= 3 ? "#1a6e3c" : directCount >= 1 ? "#b45309" : "#dc2626";
  const directEmoji = directCount >= 3 ? "🟢" : directCount >= 1 ? "🟡" : "🔴";

  await sendEmail(env, {
    subject: `📊 Rapport semaine — ${globalPct7}% occ. · ~${totalRev7.toLocaleString("fr-FR")}€`,
    html: emailWrapper(`
      <h2 style="color:#0e3b3a;margin:0 0 4px">📊 Rapport hebdomadaire</h2>
      <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">Semaine du ${weekLabel}</p>

      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px;">
        <div style="background:#fff;border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#0e3b3a;">${globalPct7}%</div>
          <div style="font-size:11px;color:#7a6b5a;margin-top:3px;">Occ. 7 jours</div>
        </div>
        <div style="background:#fff;border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#1a6e3c;">~${totalRev7.toLocaleString("fr-FR")}€</div>
          <div style="font-size:11px;color:#7a6b5a;margin-top:3px;">Revenus 7j estimés</div>
        </div>
        <div style="background:#fff;border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#0369a1;">~${totalRev30.toLocaleString("fr-FR")}€</div>
          <div style="font-size:11px;color:#7a6b5a;margin-top:3px;">Revenus 30j estimés</div>
        </div>
      </div>

      <!-- Santé projet : ratio réservations directes -->
      <div style="background:#fff7ed;border-radius:8px;padding:12px 16px;margin-bottom:20px;border-left:3px solid ${directColor};">
        <strong style="color:${directColor};">${directEmoji} Résas directes 30j : ${directCount} résa · ${directNights} nuits · ~${directRevEur.toLocaleString("fr-FR")}€</strong>
        <span style="color:#9a8a7a;font-size:12px;display:block;margin-top:4px;">Indicateur santé projet — viser ≥3 résas/mois. Ratio direct/OTA à comparer dans le dashboard.</span>
      </div>

      ${gapCount > 0 ? `
      <div style="background:#e0f8f4;border-radius:8px;padding:12px 16px;margin-bottom:20px;border-left:3px solid #14b8a6;">
        <strong style="color:#0f766e;">🏷 ${gapCount} date${gapCount > 1 ? "s" : ""} à prix réduit (gap pricing)</strong>
        <span style="color:#0f766e;font-size:13px;"> — ${gapBiens.join(", ")}</span>
      </div>` : ""}

      <h3 style="color:#0e3b3a;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 8px">Occupation par logement</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <thead><tr style="background:#e8e0d0;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Logement</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">7 jours</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#7a6b5a;">Occ. 7j</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#7a6b5a;">Occ. 30j</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#7a6b5a;">Rev. est. 7j</th>
        </tr></thead>
        <tbody>${propRows}</tbody>
      </table>

      <h3 style="color:#0e3b3a;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 8px">Arrivées — 14 prochains jours</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <thead><tr style="background:#e8e0d0;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Date</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Logement</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Voyageur</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#7a6b5a;">Durée</th>
        </tr></thead>
        <tbody>${arriveeRows}</tbody>
      </table>

      <h3 style="color:#0e3b3a;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 8px">Départs — 7 prochains jours</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <thead><tr style="background:#e8e0d0;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Date</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Logement</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Voyageur</th>
        </tr></thead>
        <tbody>${departRows}</tbody>
      </table>

      <div style="text-align:center;">
        <a href="${siteUrl}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:13px;">Ouvrir le dashboard →</a>
      </div>
    `),
  });

  console.log("[weekly] Rapport envoyé");
}

// ── Alertes sous-occupation ──────────────────────────────────────────────────
// Persiste l'occupation forward (30j/90j) par bien dans rm_kpi_snapshots → le RM "voit"
// enfin l'occupation réelle. Mirroir de src/utils/occupancy.js (garder synchro). Advisory only.
async function runOccupancySnapshot(env, allEvents) {
  if (!env.revenue_manager) { console.log("[occupancy] pas de binding D1 — skip"); return; }
  const db = env.revenue_manager;
  const todayStr = today();
  const activeBiens = new Set(Object.keys(getAirbnbUrls(env)));
  Object.keys(NOMS).forEach((id) => activeBiens.add(id)); // inclut nogent (Beds24)

  function nightsBooked(bienId, fromStr, toStr) {
    let n = 0;
    for (const e of allEvents) {
      if (e.bienId !== bienId || !e.checkin || !e.checkout) continue;
      const start = e.checkin > fromStr ? e.checkin : fromStr;
      const end   = e.checkout < toStr ? e.checkout : toStr;
      if (end > start) n += diffDays(start, end);
    }
    return n;
  }

  let written = 0;
  for (const bienId of activeBiens) {
    for (const [period, horizon] of [["30d", 30], ["90d", 90]]) {
      const to   = addDays(todayStr, horizon);
      const sold = Math.min(horizon, nightsBooked(bienId, todayStr, to));
      const rate = horizon > 0 ? sold / horizon : 0;
      const id   = `${bienId}-${todayStr}-${period}`;
      try {
        await db.prepare(
          "INSERT INTO rm_kpi_snapshots (id, property_id, snapshot_date, period_type, occupancy_rate, nights_sold, nights_available, calculated_at) " +
          "VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET occupancy_rate=excluded.occupancy_rate, nights_sold=excluded.nights_sold, nights_available=excluded.nights_available, calculated_at=excluded.calculated_at"
        ).bind(id, bienId, todayStr, period, rate, sold, horizon, Math.floor(Date.now() / 1000)).run();
        written++;
      } catch (e) { console.error(`[occupancy] ${bienId} ${period}: ${e.message}`); }
    }
  }
  console.log(`[occupancy] snapshot écrit (${written} lignes, ${activeBiens.size} biens)`);
}

async function runOccupancyAlerts(env, allEvents) {
  const todayStr = today();
  const in14 = addDays(todayStr, 14);
  const in30 = addDays(todayStr, 30);

  const byProp = {}, byProp14 = {};
  for (const e of allEvents) {
    if (e.checkout < todayStr) continue;

    // Occupation 30j
    if (e.checkin <= in30) {
      const start = e.checkin > todayStr ? e.checkin : todayStr;
      const end   = e.checkout < in30 ? e.checkout : in30;
      byProp[e.bienId] = (byProp[e.bienId] || 0) + diffDays(start, end);
    }

    // Occupation 14j
    if (e.checkin <= in14) {
      const start14 = e.checkin > todayStr ? e.checkin : todayStr;
      const end14   = e.checkout < in14 ? e.checkout : in14;
      byProp14[e.bienId] = (byProp14[e.bienId] || 0) + diffDays(start14, end14);
    }
  }

  // Biens actifs (dans Airbnb ou Booking URLs)
  const activeBiens = new Set(Object.keys(getAirbnbUrls(env)));

  // Alertes 0 résa dans 14j pour biens actifs
  const zeroAlerts = [];
  for (const bienId of activeBiens) {
    if ((byProp14[bienId] || 0) === 0) {
      zeroAlerts.push(bienId);
    }
  }
  const hasUrgent = zeroAlerts.length > 0;

  const alerts = Object.entries(NOMS).filter(([id]) => {
    const pct = ((byProp[id] || 0) / 30) * 100;
    return pct < 40; // seuil 40%
  });

  if (alerts.length === 0 && !hasUrgent) return;

  const urgentBlock = hasUrgent ? `
    <div style="background:#fde8e0;border-radius:8px;padding:14px 18px;margin-bottom:20px;border-left:4px solid #c47254;">
      <strong style="color:#c47254;">🚨 URGENT — 0 réservation dans les 14 prochains jours :</strong>
      <ul style="margin:8px 0 0;padding-left:18px;color:#c47254;font-size:13px;">
        ${zeroAlerts.map(id => `<li>${NOMS[id] || id}</li>`).join("")}
      </ul>
    </div>` : "";

  const subjectPrefix = hasUrgent ? "⚠️ URGENT" : "⚠️";

  const rows = alerts.map(([id, nom]) => {
    const occ   = byProp[id] || 0;
    const pct   = Math.round(occ / 30 * 100);
    const occ14 = byProp14[id] || 0;
    const pct14 = Math.round(occ14 / 14 * 100);
    const isZero14 = occ14 === 0 && activeBiens.has(id);
    return `<tr><td style="padding:8px 14px;font-weight:600;color:#0e3b3a;">${nom}${isZero14 ? ' <span style="font-size:10px;background:#fde8e0;color:#c47254;padding:1px 5px;border-radius:8px;">0 résa 14j</span>' : ""}</td><td style="padding:8px 14px;color:#c47254;font-weight:700;">${pct14}%</td><td style="padding:8px 14px;color:#c47254;font-weight:700;">${pct}%</td><td style="padding:8px 14px;color:#7a6b5a;">${occ} nuits sur 30</td></tr>`;
  }).join("");

  await sendEmail(env, {
    subject: `${subjectPrefix} ${alerts.length} logement${alerts.length > 1 ? "s" : ""} sous-occupé${alerts.length > 1 ? "s" : ""} — 30 prochains jours`,
    html: emailWrapper(`
      <h2 style="color:#c47254;margin:0 0 8px">${hasUrgent ? "🚨 Alerte URGENTE — sous-occupation" : "⚠️ Alerte sous-occupation"}</h2>
      <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">Logements avec moins de 40% d'occupation dans les 30 prochains jours</p>
      ${urgentBlock}
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#fde8e0;">
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Logement</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Occ. 14j</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Occ. 30j</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Détail</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:16px;font-size:13px;color:#7a6b5a;">💡 Pensez à ajuster vos tarifs ou à promouvoir ces dates.</p>
      <div style="margin-top:16px;text-align:center;">
        <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="background:#c47254;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:13px;">Gérer les tarifs →</a>
      </div>
    `),
  });

  // Push ntfy — résumé concis pour le téléphone
  if (env.NTFY_TOPIC) {
    const ntfyLines = alerts.map(([id, nom]) => {
      const occ = byProp[id] || 0;
      const pct = Math.round(occ / 30 * 100);
      return `${nom} : ${pct}% (${occ}/30 nuits)`;
    });
    if (hasUrgent) ntfyLines.unshift(`🚨 0 résa 14j : ${zeroAlerts.map(id => NOMS[id] || id).join(", ")}`);
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Title": hasUrgent ? "🚨 Vacance URGENTE" : "⚠️ Vacance 30j",
        "Priority": hasUrgent ? "urgent" : "default",
        "Tags": "chart_decreasing",
      },
      body: ntfyLines.join("\n"),
    }).catch(e => console.error("[occupancy] ntfy:", e.message));
  }

  console.log(`[occupancy] Alerte envoyée — ${alerts.length} logement(s) sous le seuil${hasUrgent ? `, ${zeroAlerts.length} URGENT(s) 0 résa 14j` : ""}`);
}

// ── Alertes inventaire (cron quotidien 9h UTC) ───────────────────────────────
// Envoie un email récap au propriétaire si des items sont en rupture imminente.
// Implémente log-008 (Option B Phase 5).
async function runInventoryAlerts(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    const r = await fetch(`${siteUrl}/api/inventory?action=alerts`);
    const d = await r.json();
    const items = (d.items || []).filter(i => i.status === "critique" || i.status === "rupture");
    if (items.length === 0) {
      console.log("[inventory-alerts] ✓ Aucun item critique");
      return;
    }

    // Grouper par bien
    const byBien = {};
    for (const it of items) {
      if (!byBien[it.bien_id]) byBien[it.bien_id] = [];
      byBien[it.bien_id].push(it);
    }

    // Construire HTML email
    const sections = Object.entries(byBien).map(([bienId, list]) => {
      const rows = list.map(it => `
        <tr>
          <td style="padding:6px 10px;font-size:12px;color:#0e3b3a">${it.item_name}</td>
          <td style="padding:6px 10px;font-size:11px;color:#94a3b8">${it.category}</td>
          <td style="padding:6px 10px;font-size:13px;color:${it.status === "rupture" ? "#dc2626" : "#ef4444"};font-weight:700;text-align:right;font-family:var(--font-mono)">${it.qty_current} ${it.unit}</td>
          <td style="padding:6px 10px;font-size:11px;color:#64748b;text-align:right;font-family:var(--font-mono)">min ${it.qty_min}</td>
          <td style="padding:6px 10px;font-size:11px;color:${it.eta_rupture_days !== null && it.eta_rupture_days < 7 ? "#ef4444" : "#94a3b8"};text-align:right;font-family:var(--font-mono)">${it.eta_rupture_days !== null ? it.eta_rupture_days + "j" : "—"}</td>
        </tr>
      `).join("");
      return `
        <div style="margin-bottom:18px">
          <h3 style="margin:0 0 8px;color:#0e3b3a;font-size:13px;text-transform:uppercase;letter-spacing:1px">${bienId.toUpperCase()} — ${list.length} item${list.length > 1 ? "s" : ""}</h3>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;overflow:hidden">
            <thead><tr style="background:#f8f4ed"><th style="padding:6px 10px;text-align:left;font-size:10px;color:#64748b">Item</th><th style="padding:6px 10px;text-align:left;font-size:10px;color:#64748b">Cat.</th><th style="padding:6px 10px;text-align:right;font-size:10px;color:#64748b">Stock</th><th style="padding:6px 10px;text-align:right;font-size:10px;color:#64748b">Min</th><th style="padding:6px 10px;text-align:right;font-size:10px;color:#64748b">ETA</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join("");

    await sendEmail(env, {
      subject: `🚨 Inventaire — ${items.length} item${items.length > 1 ? "s" : ""} en rupture imminente`,
      html: emailWrapper(`
        <h2 style="color:#dc2626;margin:0 0 8px">🚨 Alerte stocks bas</h2>
        <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${items.length} item${items.length > 1 ? "s" : ""} en stock bas ou rupture sur ${Object.keys(byBien).length} bien${Object.keys(byBien).length > 1 ? "s" : ""}. Penser à commander.</p>
        ${sections}
        <div style="margin-top:20px;text-align:center">
          <a href="${siteUrl}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:13px;display:inline-block">Voir Inventaire →</a>
        </div>
      `),
    });
    console.log(`[inventory-alerts] Email envoyé — ${items.length} items en rupture`);
  } catch (e) {
    console.error("[inventory-alerts] Erreur:", e.message);
  }
}

// ── Article SEO long-tail mensuel ────────────────────────────────────────────
// Génère un article 600-900 mots via seo-content-writer le 1er du mois.
// L'article apparaît comme draft dans Approbations admin.
async function runMonthlySeoArticle(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const moisLabels = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const now = new Date();
  const moisCourant = moisLabels[now.getMonth()];
  const annee = now.getFullYear();

  // Rotation des sujets long-tail (12 sujets = 1 par mois)
  const SUJETS = [
    { kw: "location villa Sainte-Luce piscine débordement", target: "/amaryllis" },
    { kw: "studio jacuzzi privatif Martinique",              target: "/mabouya" },
    { kw: "villa Martinique 8 personnes vue mer",            target: "/amaryllis" },
    { kw: "meilleure saison Martinique voyage",              target: "/meilleure-saison-martinique" },
    { kw: "plongée Martinique débutant",                     target: "/guide-plongee-martinique" },
    { kw: "distilleries rhum Martinique visite",             target: "/guide-distilleries-martinique" },
    { kw: "randonnée Montagne Pelée Martinique",             target: "/guide-randonnees-martinique" },
    { kw: "Rocher du Diamant Martinique",                    target: "/guide-le-diamant" },
    { kw: "Trois-Îlets Martinique activités",                target: "/guide-trois-ilets" },
    { kw: "Saint-Pierre Martinique histoire",                target: "/guide-saint-pierre-martinique" },
    { kw: "gastronomie créole Martinique",                   target: "/guide-gastronomie-martinique" },
    { kw: "réservation directe villa Martinique",            target: "/reservation-directe-martinique" },
  ];
  const sujet = SUJETS[now.getMonth()];

  const brief = `Article de blog SEO long-tail — ${moisCourant} ${annee}
Mot-clé cible : "${sujet.kw}"
URL cible pour maillage interne : ${sujet.target}

Type : article 600-900 mots, optimisé SEO mais lisible et utile.
Structure : H1 (mot-clé), intro 80 mots, 3-4 H2 thématiques, conclusion + CTA.
Ton : voix Amaryllis (formel, sensoriel, informatif), jamais pub Meta Ads.
Inclure 2 liens internes : 1 vers ${sujet.target}, 1 vers /amaryllis ou un autre bien pertinent.

Données canoniques INTERDITES À ENFREINDRE :
- Villa Amaryllis : piscine débordement eau salée 4×7m, 3 chambres, 8 pers (PAS de jacuzzi)
- Mabouya : jacuzzi privatif (le seul)
- Iguana : piscine eau salée non chlorée
- Zandoli + Géko : chacune sa piscine privative à cascade
- Tous sur les hauteurs, vue mer 180° (PAS bord de mer)

Retourne UN draft type "social_post" avec caption = article complet markdown.`;

  try {
    console.log(`[seo-article] Démarrage génération article : ${sujet.kw}`);
    const r = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: "seo-content-writer", brief }),
    });
    const data = await r.json();
    console.log(`[seo-article] ✓ ${data.draftsCreated || 0} draft(s) créé(s) sur "${sujet.kw}"`);
  } catch (e) {
    console.error("[seo-article] Erreur:", e.message);
  }
}

// ── Export comptable mensuel ─────────────────────────────────────────────────
async function runMonthlyExport(env, allEvents) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7); // "2025-05"
  const label = lastMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const daysInMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();

  const events = allEvents.filter(e => e.checkin.startsWith(lastMonthStr) || e.checkout.startsWith(lastMonthStr));

  if (events.length === 0) {
    console.log("[monthly] Aucune réservation le mois dernier — export ignoré");
    return;
  }

  // ── CSV (inchangé, pour le comptable) ──────────────────────────────────────
  const csvLines = [
    "Logement,Voyageur,Canal,Arrivée,Départ,Nuits,Montant€",
    ...events.map(e => {
      const nights = diffDays(e.checkin, e.checkout);
      return `"${e.nom}","${e.voyageur}","${e.canal || ""}","${e.checkin}","${e.checkout}",${nights},${e.montant || ""}`;
    }),
  ];
  const totalCA = events.reduce((s, e) => s + (e.montant || 0), 0);
  csvLines.push(`,,,,TOTAL,${events.length} réservations,${totalCA}`);
  const csv = csvLines.join("\n");
  const csvB64 = btoa(unescape(encodeURIComponent(csv)));

  // ── KPIs globaux ───────────────────────────────────────────────────────────
  const totalNuits = events.reduce((s, e) => s + diffDays(e.checkin, e.checkout), 0);
  const prixMoyenNuit = totalNuits > 0 ? Math.round(totalCA / totalNuits) : 0;
  const nbBiensActifs = Object.keys(NOMS).length; // 7 logements
  const tauxOcc = Math.round((totalNuits / (daysInMonth * nbBiensActifs)) * 100);

  // ── Stats par logement ─────────────────────────────────────────────────────
  const byBien = {};
  for (const e of events) {
    if (!byBien[e.bienId]) byBien[e.bienId] = { nom: e.nom, ca: 0, nuits: 0, nb: 0, airbnb: 0, booking: 0 };
    const b = byBien[e.bienId];
    const n = diffDays(e.checkin, e.checkout);
    b.ca += (e.montant || 0);
    b.nuits += n;
    b.nb += 1;
    if (e.canal === "airbnb") b.airbnb += 1;
    else if (e.canal === "booking") b.booking += 1;
  }

  // ── Canal mix global ───────────────────────────────────────────────────────
  const nbAirbnb   = events.filter(e => e.canal === "airbnb").length;
  const nbBooking  = events.filter(e => e.canal === "booking").length;
  const nbDirect   = events.length - nbAirbnb - nbBooking;
  const pctAirbnb  = Math.round((nbAirbnb / events.length) * 100);
  const pctBooking = Math.round((nbBooking / events.length) * 100);
  const pctDirect  = 100 - pctAirbnb - pctBooking;

  // ── Couleur de performance ─────────────────────────────────────────────────
  const kpiColor = (val, good, warn) => val >= good ? "#16a34a" : val >= warn ? "#d97706" : "#dc2626";

  // ── HTML riche ─────────────────────────────────────────────────────────────
  const bienRows = Object.values(byBien)
    .sort((a, b) => b.ca - a.ca)
    .map(b => {
      const pMoyNuit = b.nuits > 0 ? Math.round(b.ca / b.nuits) : 0;
      const occPct = Math.round((b.nuits / daysInMonth) * 100);
      const canalTag = b.airbnb > 0 && b.booking === 0 ? "Airbnb" :
                       b.booking > 0 && b.airbnb === 0 ? "Booking" : "Mix";
      return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;font-weight:500;color:#0e3b3a;font-size:13px;">${b.nom}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;text-align:right;font-weight:700;color:#0e3b3a;font-size:14px;">${b.ca.toLocaleString("fr-FR")}€</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;text-align:center;color:#7a6b5a;font-size:13px;">${b.nuits}n</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;text-align:center;font-size:12px;color:${kpiColor(occPct, 60, 40)};">${occPct}%</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;text-align:center;color:#7a6b5a;font-size:13px;">${pMoyNuit}€/n</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;text-align:center;font-size:11px;color:#7a6b5a;">${canalTag}</td>
      </tr>`;
    }).join("");

  // Barres canal mix (proportionnelles, 200px de large)
  const barAirbnb  = Math.round(200 * pctAirbnb / 100);
  const barBooking = Math.round(200 * pctBooking / 100);
  const barDirect  = 200 - barAirbnb - barBooking;

  const resa20 = events.slice(0, 20); // max 20 lignes
  const resaRows = resa20.map(e => {
    const n = diffDays(e.checkin, e.checkout);
    const cIcon = e.canal === "airbnb" ? "🏠" : e.canal === "booking" ? "🔵" : "🌐";
    return `
    <tr>
      <td style="padding:7px 10px;border-bottom:1px solid #f0e8d8;font-size:12px;color:#0e3b3a;">${e.nom}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0e8d8;font-size:12px;color:#7a6b5a;">${e.checkin} → ${e.checkout}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0e8d8;font-size:12px;text-align:center;">${n}n</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0e8d8;font-size:12px;text-align:right;font-weight:600;color:#0e3b3a;">${e.montant ? e.montant.toLocaleString("fr-FR") + "€" : "—"}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0e8d8;font-size:12px;text-align:center;">${cIcon}</td>
    </tr>`;
  }).join("");

  const html = `
  <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#f4ecdc;">

    <!-- HEADER -->
    <div style="background:#0e3b3a;padding:32px 28px;border-radius:12px 12px 0 0;text-align:center;">
      <p style="color:#c47254;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Rapport mensuel</p>
      <h1 style="color:#faf5e9;font-size:26px;font-weight:300;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;">${label}</h1>
      <p style="color:rgba(250,245,233,0.6);font-size:13px;margin:0;">${events.length} réservation${events.length > 1 ? "s" : ""} · CSV en pièce jointe</p>
    </div>

    <!-- KPI ROW -->
    <div style="display:flex;gap:0;background:#fff;border-left:1px solid #e8dcc8;border-right:1px solid #e8dcc8;">
      ${[
        { label: "CA Total", value: totalCA.toLocaleString("fr-FR") + "€", color: kpiColor(totalCA, 8000, 4000) },
        { label: "Nuits vendues", value: totalNuits + "n", color: "#0e3b3a" },
        { label: "Taux occ.", value: tauxOcc + "%", color: kpiColor(tauxOcc, 55, 35) },
        { label: "Prix moy./nuit", value: prixMoyenNuit + "€", color: "#0e3b3a" },
      ].map(k => `
        <div style="flex:1;padding:18px 12px;text-align:center;border-right:1px solid #e8dcc8;">
          <div style="font-size:22px;font-weight:700;color:${k.color};margin-bottom:4px;">${k.value}</div>
          <div style="font-size:10px;color:#7a6b5a;letter-spacing:0.08em;text-transform:uppercase;">${k.label}</div>
        </div>`).join("")}
    </div>

    <!-- PAR LOGEMENT -->
    <div style="background:#fff;border:1px solid #e8dcc8;border-top:none;padding:0;">
      <div style="padding:16px 16px 8px;border-bottom:1px solid #f0e8d8;">
        <span style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#c47254;">Par logement</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f4ecdc;">
            <th style="padding:8px 12px;text-align:left;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">Logement</th>
            <th style="padding:8px 12px;text-align:right;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">CA</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">Nuits</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">Occ.</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">Moy./n</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">Canal</th>
          </tr>
        </thead>
        <tbody>${bienRows}</tbody>
        <tfoot>
          <tr style="background:#f4ecdc;">
            <td style="padding:10px 12px;font-weight:700;color:#0e3b3a;font-size:13px;">TOTAL</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;color:#c47254;font-size:14px;">${totalCA.toLocaleString("fr-FR")}€</td>
            <td style="padding:10px 12px;text-align:center;font-weight:600;color:#0e3b3a;font-size:13px;">${totalNuits}n</td>
            <td style="padding:10px 12px;text-align:center;font-weight:600;font-size:13px;color:${kpiColor(tauxOcc, 55, 35)};">${tauxOcc}%</td>
            <td style="padding:10px 12px;text-align:center;color:#7a6b5a;font-size:13px;">${prixMoyenNuit}€/n</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- CANAL MIX -->
    <div style="background:#fff;border:1px solid #e8dcc8;border-top:none;padding:16px;">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#c47254;display:block;margin-bottom:14px;">Mix canal (nb réservations)</span>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
        ${barAirbnb > 0 ? `<div style="width:${barAirbnb}px;height:18px;background:#ff5a5f;border-radius:4px 0 0 4px;"></div>` : ""}
        ${barBooking > 0 ? `<div style="width:${barBooking}px;height:18px;background:#003580;"></div>` : ""}
        ${barDirect > 0 ? `<div style="width:${barDirect}px;height:18px;background:#16a34a;border-radius:0 4px 4px 0;"></div>` : ""}
      </div>
      <div style="display:flex;gap:16px;font-size:11px;color:#7a6b5a;">
        ${nbAirbnb > 0 ? `<span>🏠 Airbnb ${pctAirbnb}% (${nbAirbnb})</span>` : ""}
        ${nbBooking > 0 ? `<span>🔵 Booking ${pctBooking}% (${nbBooking})</span>` : ""}
        ${nbDirect > 0 ? `<span>🌐 Direct ${pctDirect}% (${nbDirect})</span>` : ""}
      </div>
      ${pctBooking > 70 ? `<p style="margin:10px 0 0;font-size:12px;color:#dc2626;font-weight:600;">⚠️ Booking.com > 70% — forte dépendance à surveiller</p>` : ""}
    </div>

    <!-- DETAIL RÉSERVATIONS -->
    <div style="background:#fff;border:1px solid #e8dcc8;border-top:none;padding:0;">
      <div style="padding:16px 16px 8px;border-bottom:1px solid #f0e8d8;">
        <span style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#c47254;">Détail des réservations</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f4ecdc;">
            <th style="padding:7px 10px;text-align:left;font-size:10px;color:#7a6b5a;font-weight:600;text-transform:uppercase;">Logement</th>
            <th style="padding:7px 10px;text-align:left;font-size:10px;color:#7a6b5a;font-weight:600;text-transform:uppercase;">Dates</th>
            <th style="padding:7px 10px;text-align:center;font-size:10px;color:#7a6b5a;font-weight:600;text-transform:uppercase;">N</th>
            <th style="padding:7px 10px;text-align:right;font-size:10px;color:#7a6b5a;font-weight:600;text-transform:uppercase;">Montant</th>
            <th style="padding:7px 10px;text-align:center;font-size:10px;color:#7a6b5a;font-weight:600;text-transform:uppercase;">Canal</th>
          </tr>
        </thead>
        <tbody>${resaRows}</tbody>
      </table>
      ${events.length > 20 ? `<p style="padding:10px 12px;font-size:11px;color:#7a6b5a;margin:0;">… et ${events.length - 20} autres réservations dans le CSV ci-joint.</p>` : ""}
    </div>

    <!-- CTA -->
    <div style="background:#fff;border:1px solid #e8dcc8;border-top:none;border-radius:0 0 12px 12px;padding:24px;text-align:center;">
      <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="display:inline-block;background:#0e3b3a;color:#faf5e9;text-decoration:none;padding:12px 28px;border-radius:9px;font-size:13px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;margin-right:10px;">Dashboard admin →</a>
      <p style="margin:16px 0 0;font-size:10px;color:#b0a898;">Le fichier CSV joint contient toutes les réservations pour votre comptable · Amaryllis automatique</p>
    </div>

  </div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: resendFrom(env),
      to: String(env.NOTIFICATION_EMAIL || "contact@villamaryllis.com").split(",").map(s => s.trim()).filter(Boolean),
      subject: `📊 Rapport ${label} — ${totalCA.toLocaleString("fr-FR")}€ · ${totalNuits}n · ${tauxOcc}% occ.`,
      html,
      attachments: [{
        filename: `reservations-${lastMonthStr}.csv`,
        content: csvB64,
      }],
    }),
  });

  if (!r.ok) console.error("[monthly] Resend error:", await r.text());
  else console.log(`[monthly] Rapport ${label} envoyé — ${events.length} réservations, ${totalCA}€, ${tauxOcc}% occ.`);
}

// ── direct_bookings D1 → format event (résas Stripe Martinique sans bookingId Beds24) ──
// Sans ça, le cron iCal pousse 0 résa directe vers la Sheet → invisible côté admin/compta/revenus.
// Le Worker hérite du binding D1 `revenue_manager` (cf. wrangler.toml).
async function fetchDirectBookingsAsEvents(env) {
  if (!env.revenue_manager) return [];
  try {
    // Migration idempotente — colonne ajoutée par functions/api/cancel-booking.js.
    try { await env.revenue_manager.prepare(`ALTER TABLE direct_bookings ADD COLUMN status TEXT DEFAULT 'confirmed'`).run(); } catch { /* déjà présente */ }
    // Exclut les résas annulées : sans ce filtre, ce sync (15 min) re-poussait vers le
    // Sheet une résa qu'on venait juste de supprimer manuellement (résurrection silencieuse).
    const rows = await env.revenue_manager.prepare(
      `SELECT payment_intent_id, bien_id, bien_nom, voyageur, total, depot, checkin, checkout
       FROM direct_bookings
       WHERE checkout >= date('now', '-90 days') AND (status IS NULL OR status != 'cancelled')`
    ).all();
    return (rows?.results || []).filter(r => r.bien_id && r.checkin && r.checkout).map(r => ({
      uid:      "direct-" + r.payment_intent_id,  // pushToSheets utilise e.uid comme id
      bienId:   r.bien_id,
      voyageur: r.voyageur || "—",
      canal:    "Direct",
      checkin:  r.checkin,
      checkout: r.checkout,
      montant:  Math.round(r.total || 0),
    }));
  } catch (e) {
    console.error("[direct-bookings] D1 read error:", e.message);
    return [];
  }
}

// ── Push vers Google Sheets ──────────────────────────────────────────────────
async function pushToSheets(env, allEvents) {
  if (!env.APPS_SCRIPT_URL) return;
  const reservations = allEvents.map(e => ({
    id: e.uid, bienId: e.bienId, voyageur: e.voyageur,
    canal: e.canal, checkin: e.checkin, checkout: e.checkout,
    montant: e.montant, fromIcal: true, notes: "",
  }));
  // ⚠️ Apps Script SUPPRIME le body des POST (bug redirect Google) → on passe par
  //    /api/sheets-proxy qui envoie en GET paginé (forwardChunked). Le POST direct
  //    vers APPS_SCRIPT_URL n'écrivait JAMAIS rien dans le Sheet (body perdu).
  try {
    const siteUrl = env.SITE_URL || "https://villamaryllis.com";
    const r = await fetch(`${siteUrl}/api/sheets-proxy?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Script-Url": env.APPS_SCRIPT_URL },
      body: JSON.stringify({ action: "importAllReservations", reservations }),
    });
    const d = await r.json().catch(() => ({}));
    console.log(`[sheets] push via proxy — ok=${d.ok} added=${d.added ?? "?"} updated=${d.updated ?? "?"} (${reservations.length} envoyées)`);
    if (d.errors) console.error("[sheets] erreurs chunks:", JSON.stringify(d.errors));
  } catch (e) {
    console.error("[sheets] Erreur:", e.message);
  }
}

// ── Sync iCal ────────────────────────────────────────────────────────────────
async function syncFeed(env, bienId, url, canal, allEvents, nouvelles, annulations, allAvailEvents) {
  try {
    const text = await fetchICS(url);
    const events = parseICS(text, bienId, canal).map(e => ({ ...e, canal }));
    if (allAvailEvents) allAvailEvents.push(...parseICSAvailability(text, bienId));
    const kvKey = `uids:${bienId}:${canal}`;
    const todayStr = new Date().toISOString().slice(0, 10);
    // raw === null ⇒ feed JAMAIS synchronisé. On distingue du feed déjà vu mais vide ("[]").
    const raw = await env.ICAL_STORE.get(kvKey, "json");
    const isFirstRun = raw === null;
    // Support ancien format (tableau de strings) et nouveau ({uid, checkout})
    const stored = (raw || []).map(e => typeof e === "string" ? { uid: e, checkout: null } : e);
    const storedByUid = new Map(stored.map(e => [e.uid, e]));
    const currentUids = new Set(events.map(e => e.uid));
    // Détecter les rotations d'UID Airbnb (même préfixe avant le 1er "-", hash différent)
    const currentPrefixes = new Map(events.map(e => [e.uid.split("-")[0], e.uid]));
    const newForFeed = events.filter(e => {
      if (storedByUid.has(e.uid)) return false;
      // Même préfixe qu'un UID stocké → rotation Airbnb, pas une vraie nouveauté
      const prefix = e.uid.split("-")[0];
      return !stored.some(s => s.uid.split("-")[0] === prefix);
    });
    // Premier run d'un feed → SEED silencieux
    if (newForFeed.length > 0 && !isFirstRun) nouvelles.push(...newForFeed);
    if (isFirstRun && events.length > 0) console.log(`[sync] ${bienId}/${canal}: SEED initial ${events.length} résa(s) (silencieux, push Sheet sans notif)`);
    // Annulations : UIDs connus qui ont disparu de l'iCal (jamais au premier run)
    // — Filtrer les faux positifs : checkout passé = séjour terminé normalement, pas une annulation
    // — Filtrer les rotations UID : même préfixe encore présent = Airbnb a juste changé le hash
    const cancelledUids = isFirstRun ? [] : stored.filter(e => {
      if (currentUids.has(e.uid)) return false;
      // Rotation UID : même préfixe toujours dans le feed actuel → pas une vraie annulation
      const prefix = e.uid.split("-")[0];
      if (currentPrefixes.has(prefix)) {
        console.log(`[sync] ${bienId}/${canal}: rotation UID ignorée (${e.uid} → ${currentPrefixes.get(prefix)})`);
        return false;
      }
      // Checkout passé → séjour terminé normalement, faux positif "annulation"
      if (e.checkout && e.checkout < todayStr) {
        console.log(`[sync] ${bienId}/${canal}: séjour terminé ignoré (checkout ${e.checkout} < aujourd'hui)`);
        return false;
      }
      return true;
    });
    if (cancelledUids.length > 0) {
      cancelledUids.forEach(e => annulations.push({ uid: e.uid, bienId, canal }));
      console.log(`[sync] ${bienId}/${canal}: ${cancelledUids.length} annulation(s) détectée(s)`);
    }
    // Stocker {uid, checkout} pour filtrer les faux positifs futurs
    await env.ICAL_STORE.put(kvKey, JSON.stringify(events.map(e => ({ uid: e.uid, checkout: e.checkout }))), { expirationTtl: 60 * 60 * 24 * 90 });
    allEvents.push(...events);
    console.log(`[sync] ${bienId}/${canal}: ${events.length} evt, ${newForFeed.length} nouveau(x)`);
    return { ok: true };
  } catch (err) {
    console.error(`[sync] ${bienId}/${canal} erreur:`, err.message);
    return { ok: false, bienId, canal, error: err.message };
  }
}

async function sendCancellations(env, annulations) {
  const BIEN_LABELS = { amaryllis: "Villa Amaryllis", iguana: "Villa Iguana", zandoli: "Zandoli",
    geko: "Géko", mabouya: "Mabouya", schoelcher: "T2 Schœlcher", nogent: "T2 Nogent" };

  // 1. Push à Apps Script pour retirer du Sheet + recalcul revenus
  try {
    const r = await fetch(env.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancelReservations", annulations }),
    });
    const data = await r.json().catch(() => ({}));
    console.log(`[annulation] Apps Script: cancelled=${data.cancelled}, ids=${JSON.stringify(data.ids)}`);
  } catch (e) {
    console.error("[annulation] Apps Script erreur:", e.message);
  }

  // 2. Notif email + ntfy par annulation
  for (const ann of annulations) {
    const bienLabel = BIEN_LABELS[ann.bienId] || ann.bienId;
    const canal = ann.canal.charAt(0).toUpperCase() + ann.canal.slice(1);
    const subject = `🚨 Annulation ${bienLabel} (${canal})`;
    const html = `<p>Une réservation a été annulée sur <strong>${bienLabel}</strong> via <strong>${canal}</strong>.</p>
<p>UID iCal : <code>${ann.uid}</code></p>
<p>La réservation a été supprimée du Sheet et les revenus ont été mis à jour.</p>`;
    await sendEmail(env, { to: "vinsmaf@gmail.com", subject, html }).catch(() => {});
    if (env.NTFY_TOPIC) {
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: { "Title": subject, "Priority": "high", "Content-Type": "text/plain" },
        body: `Annulation ${bienLabel} (${canal}) — vérifier Planning + Revenus`,
      }).catch(() => {});
    }
  }
}

// ── Auto-import Booking.com ──────────────────────────────────────────────────
// Quand l'iCal détecte une nouvelle résa Booking.com, on scrape l'admin
// pour récupérer le nom du voyageur + le montant, puis on upsert en D1.
// Prérequis : token `ses` enregistré via POST /api/booking-session

const BOOKING_BIEN_NOMS = {
  amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko",
  mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", nogent: "Appartement Nogent",
};

// "8 déc. 2025" → "2025-12-08"
function parseFrBookingDate(s) {
  if (!s) return null;
  const M = { janv:1, fevr:2, mars:3, avr:4, mai:5, juin:6, juil:7, aout:8, sept:9, oct:10, nov:11, dec:12 };
  const norm = s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\./g, "").toLowerCase().trim();
  const m = norm.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (!m) return null;
  const month = M[m[2].slice(0, 4)];
  if (!month) return null;
  return `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

// Parse la table HTML admin Booking.com — cherche la ligne arrivée = targetCheckin
function parseBookingAdminHtml(html, targetCheckin) {
  const rowBlocks = html.split(/<tr[\s>]/i).slice(1);
  for (const row of rowBlocks) {
    const cell = (h) => {
      const m = row.match(new RegExp(`data-heading=["']${h}["'][^>]*>([\\s\\S]*?)</td>`, "i"));
      return m ? m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
    };
    const arrivee = cell("Arrivée") || cell("Arrival");
    if (!arrivee || parseFrBookingDate(arrivee) !== targetCheckin) continue;

    const nomRaw   = cell("Nom du client") || cell("Guest name");
    const voyageur = nomRaw.split(/\n|\s{2,}/)[0].trim() || null;
    const paiement = cell("Paiement total") || cell("Total price");
    const price    = paiement.match(/([\d\s.,]+)/);
    const total    = price ? parseFloat(price[1].replace(/\s/g, "").replace(",", ".")) || 0 : 0;
    const resaCell = cell("Numéro de réservation") || cell("Reservation number");
    const bookingId = (row.match(/reservation_id=(\d+)/) || row.match(/bookingId=(\d+)/) || resaCell.match(/(\d{8,12})/))?.[1] || null;
    return { voyageur, total, bookingId };
  }
  return null;
}

// Scrape l'admin Booking pour récupérer nom+montant d'une résa par date arrivée
async function scrapeBookingDetails(env, bienId, checkin) {
  let ses;
  try {
    const row = await env.revenue_manager.prepare("SELECT value FROM app_config WHERE key='booking_ses'").first();
    ses = row?.value;
  } catch (e) { console.warn("[booking-scrape] D1 app_config:", e.message); return null; }
  if (!ses) { console.log("[booking-scrape] Aucun token ses — import partiel"); return null; }

  const url = `https://admin.booking.com/hotel/hoteladmin/groups/reservations/index.html`
    + `?lang=fr&ses=${ses}&dateType=ARRIVAL&dateFrom=${checkin}&dateTo=${checkin}`;
  let html;
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
      redirect: "follow",
    });
    const finalUrl = resp.url || "";
    if (resp.status === 401 || resp.status === 403 || finalUrl.includes("signin") || finalUrl.includes("login")) {
      console.warn("[booking-scrape] ⚠️ Session expirée");
      fetch(`https://ntfy.sh/${env.NTFY_TOPIC || "amaryllis-alertes-7r4k9"}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain; charset=utf-8", "Title": "⚠️ Session Booking.com expirée", "Priority": "high", "Tags": "warning,booking" },
        body: `Résa ${bienId} ${checkin} importée SANS nom/prix.\nOuvre admin.booking.com → lance le bookmarklet "Booking→Admin"`,
      }).catch(() => {});
      return null;
    }
    if (!resp.ok) { console.error(`[booking-scrape] HTTP ${resp.status}`); return null; }
    html = await resp.text();
  } catch (e) { console.error("[booking-scrape] fetch:", e.message); return null; }

  const details = parseBookingAdminHtml(html, checkin);
  if (details) clog("booking-scrape", "info", { bienId, checkin, guest: redactName(details.voyageur), total: details.total, bookingId: details.bookingId });
  else clog("booking-scrape", "warn", { bienId, checkin, msg: "aucune ligne trouvée" });
  return details;
}

// Upsert D1 direct_bookings (avec ou sans détails scrapés)
async function upsertBookingReservation(env, evt, details) {
  const { bienId, checkin, checkout, uid } = evt;
  const bookingId       = details?.bookingId;
  const paymentIntentId = bookingId ? `booking.com-${bookingId}` : `booking.com-ical-${uid}`;
  const voyageur        = (details?.voyageur && !/^voyageur/i.test(details.voyageur)) ? details.voyageur : "Voyageur Booking";
  const total           = details?.total || 0;

  try { await env.revenue_manager.prepare(`CREATE TABLE IF NOT EXISTS app_config (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT DEFAULT (datetime('now')))`).run(); } catch { /* ok */ }
  try { await env.revenue_manager.prepare(`ALTER TABLE direct_bookings ADD COLUMN canal TEXT DEFAULT 'Direct'`).run(); } catch { /* ok */ }
  try { await env.revenue_manager.prepare(`ALTER TABLE direct_bookings ADD COLUMN platform_booking_id TEXT`).run(); } catch { /* ok */ }
  try { await env.revenue_manager.prepare(`ALTER TABLE direct_bookings ADD COLUMN raw_subject TEXT`).run(); } catch { /* ok */ }

  try {
    await env.revenue_manager.prepare(`
      INSERT INTO direct_bookings
        (payment_intent_id, bien_id, bien_nom, voyageur, email, phone,
         nb_guests, total, depot, checkin, checkout, canal, platform_booking_id, raw_subject)
      VALUES (?, ?, ?, ?, '', '', 1, ?, 0, ?, ?, 'Booking.com', ?, ?)
      ON CONFLICT(payment_intent_id) DO UPDATE SET
        voyageur            = CASE WHEN excluded.voyageur NOT IN ('Voyageur Booking','Voyageur') THEN excluded.voyageur ELSE direct_bookings.voyageur END,
        total               = CASE WHEN excluded.total > 0 THEN excluded.total ELSE direct_bookings.total END,
        checkin             = excluded.checkin,
        checkout            = excluded.checkout,
        platform_booking_id = COALESCE(excluded.platform_booking_id, direct_bookings.platform_booking_id),
        raw_subject         = excluded.raw_subject
    `).bind(paymentIntentId, bienId, BOOKING_BIEN_NOMS[bienId] || bienId, voyageur, total, checkin, checkout, bookingId || null, `Auto-import iCal ${new Date().toISOString().slice(0, 10)}`).run();
    clog("booking-auto-import", total > 0 ? "info" : "warn", { paymentIntentId, guest: redactName(voyageur), bienId, checkin, checkout, total });
  } catch (e) { clog("booking-auto-import", "error", { step: "d1", err: e.message }); }
}

// Appelé depuis runSync après détection des nouvelles résas
async function autoImportNewBookings(env, nouvelles) {
  const evts = nouvelles.filter(e => e.canal === "booking");
  if (evts.length === 0) return;
  console.log(`[booking-auto-import] ${evts.length} nouvelle(s) résa(s) Booking à traiter`);
  await Promise.all(evts.map(async (evt) => {
    try {
      const details = await scrapeBookingDetails(env, evt.bienId, evt.checkin);
      await upsertBookingReservation(env, evt, details);
    } catch (e) { console.error(`[booking-auto-import] ${evt.bienId}/${evt.checkin}:`, e.message); }
  }));
}
// ── Fin auto-import Booking.com ──────────────────────────────────────────────

async function runSync(env) {
  console.log(`[amaryllis-sync] Démarrage — ${new Date().toISOString()}`);
  const allEvents = [], nouvelles = [], annulations = [], allAvailEvents = [];

  // Fetch tous les feeds en parallèle (5× plus rapide qu'en série)
  const bookingUrls = await getBookingUrls(env);
  const airbnbUrls  = getAirbnbUrls(env);
  const airbnbFeeds   = Object.entries(airbnbUrls).map(([id, url]) => syncFeed(env, id, url, "airbnb", allEvents, nouvelles, annulations, allAvailEvents));
  const bookingFeeds  = Object.entries(bookingUrls).map(([id, url]) => syncFeed(env, id, url, "booking", allEvents, nouvelles, annulations, allAvailEvents));
  const feedResults   = await Promise.all([...airbnbFeeds, ...bookingFeeds]);

  // Alerte ntfy si un ou plusieurs feeds iCal échouent (throttle 2h via KV)
  const failedFeeds = feedResults.filter(r => r && !r.ok);
  if (failedFeeds.length > 0) {
    const alertKey  = "ical_failure_alert";
    const lastAlert = await env.ICAL_STORE.get(alertKey).catch(() => null);
    if (!lastAlert) {
      const body = failedFeeds.map(f => `• ${f.bienId}/${f.canal}: ${f.error}`).join("\n");
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC || "amaryllis-alertes-7r4k9"}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Title": `⚠️ iCal sync échoué (${failedFeeds.length} feed${failedFeeds.length > 1 ? "s" : ""})`,
          "Priority": "high",
          "Tags": "warning,calendar",
        },
        body,
      }).catch(e => console.error("[sync-alert] ntfy:", e.message));
      await env.ICAL_STORE.put(alertKey, "1", { expirationTtl: 7200 }).catch(() => {});
      console.warn(`[sync] ⚠️ ${failedFeeds.length} feed(s) en erreur — alerte ntfy envoyée`);
    } else {
      console.warn(`[sync] ⚠️ ${failedFeeds.length} feed(s) en erreur — alerte déjà envoyée (throttle 2h)`);
    }
  }

  // ── Ajouter les résas DIRECTES Stripe (D1) à allEvents avant push Sheets ──
  // Auto-sync : toutes les 15 min, les direct_bookings remontent dans
  // « Toutes les Réservations » → Revenus 2026 → admin Planning.
  const directs = await fetchDirectBookingsAsEvents(env);
  if (directs.length > 0) {
    allEvents.push(...directs);
    allAvailEvents.push(...directs);
    console.log(`[direct-bookings] ${directs.length} résa(s) directe(s) ajoutée(s) au push Sheets`);
  }

  if (annulations.length > 0) await sendCancellations(env, annulations);
  if (nouvelles.length > 0) await sendNouvellesResas(env, nouvelles);
  // Auto-import Booking.com : scrape nom+prix et upsert D1 pour chaque nouvelle résa Booking
  if (nouvelles.some(e => e.canal === "booking")) await autoImportNewBookings(env, nouvelles);
  if (allEvents.length > 0) await pushToSheets(env, allEvents);

  console.log(`[amaryllis-sync] Terminé — ${allEvents.length} evt (dont ${directs.length} direct), ${nouvelles.length} nouveaux, ${annulations.length} annulations`);
  return { allEvents, allAvailEvents, total: allEvents.length, nouvelles: nouvelles.length, annulations: annulations.length };
}

// ── Monitoring quotidien ─────────────────────────────────────────────────────
const CHECKS = [
  { name: "Home",            url: "https://villamaryllis.com/" },
  { name: "Villa Amaryllis", url: "https://villamaryllis.com/amaryllis" },
  { name: "API reviews",     url: "https://villamaryllis.com/api/google-reviews", expectJson: "ok" },
  { name: "Sitemap",         url: "https://villamaryllis.com/sitemap.xml" },
];

async function runMonitor(env) {
  const errors = [];
  for (const check of CHECKS) {
    try {
      const res = await fetch(check.url, { headers: { "User-Agent": "AmaryllisMonitor/1.0" } });
      let jsonOk = true;
      if (check.expectJson) {
        try { const d = await res.clone().json(); jsonOk = d[check.expectJson] === true; } catch { jsonOk = false; }
      }
      if (res.status !== 200 || !jsonOk) errors.push(`❌ ${check.name} — HTTP ${res.status}`);
    } catch (e) { errors.push(`❌ ${check.name} — ${e.message}`); }
  }
  // ── Alerte expiration token Beds24 ──────────────────────────────────────────
  if (env.BEDS24_TOKEN) {
    try {
      const b24 = await fetch("https://beds24.com/api/v2/authentication/details", { headers: { token: env.BEDS24_TOKEN } });
      const d = await b24.json();
      if (!d.validToken) {
        errors.push("❌ Beds24 — Token invalide !");
      } else {
        const expiresIn = d.token?.expiresIn ?? 0;
        const days = Math.floor(expiresIn / 86400);
        if (days < 7) errors.push(`⚠️ Beds24 — Token expire dans ${days} jour${days !== 1 ? "s" : ""} — renouveler sur beds24.com`);
      }
    } catch (err) { errors.push(`❌ Beds24 — ${err.message}`); }
  }

  // ── Garde-fou : les feeds Booking.com sont-ils bien câblés ? ─────────────────
  // Régression vécue (juin 2026) : le Worker n'avait AUCUNE URL Booking → toutes les
  // résas Booking invisibles au pipeline pendant des mois, le calendrier site restant
  // bloqué (Pages avait les URLs). On rend ce silence bruyant.
  try {
    const bk = await getBookingUrls(env);
    if (Object.keys(bk).length === 0) {
      errors.push("❌ Aucun feed Booking.com configuré — résas Booking NON synchronisées (vérifier ICAL_BOOKING_* côté Pages + /api/ical-config + POSTSTAY_SECRET du Worker)");
    }
  } catch (err) { errors.push(`❌ Feeds Booking — ${err.message}`); }

  if (errors.length > 0) {
    await sendEmail(env, {
      subject: `🚨 ${errors.length} problème(s) — villamaryllis.com`,
      html: emailWrapper(`<h2 style="color:#c47254">🚨 Audit</h2><p>${errors.join("<br>")}</p>`),
    });
  }
  return { errors: errors.length };
}

// ── Annulation des réservations Beds24 non payées (Nogent) ───────────────────
// Toutes les heures : cherche les réservations avec status="new" créées il y a
// plus de 4h et les annule (l'utilisateur n'a pas finalisé le paiement).
// Les réservations confirmées (status="confirmed") sont épargnées.
async function runCancelUnpaidBeds24Bookings(env) {
  const token = env.BEDS24_TOKEN;
  if (!token) return;

  const PROP_ID = "158192";
  const THRESHOLD_HOURS = 4; // délai avant annulation automatique

  try {
    // Chercher les réservations récentes non confirmées
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString().slice(0, 10); // 48h max
    const qp = new URLSearchParams({ propId: PROP_ID, modifiedFrom: since, numId: "100" });
    const res = await fetch(`https://beds24.com/api/v2/bookings?${qp}`, { headers: { token } });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) return;

    const now = Date.now();
    const toCancel = data.data.filter(b => {
      if (b.status !== "new") return false; // garder: confirmed, cancelled, etc.
      // bookingTime format : "2026-05-22 14:35:00" ou ISO
      const created = b.bookingTime ? new Date(b.bookingTime.replace(" ", "T") + "Z").getTime() : 0;
      if (!created) return false;
      const ageHours = (now - created) / 3600000;
      return ageHours >= THRESHOLD_HOURS;
    });

    if (toCancel.length === 0) return;

    console.log(`[beds24-cleanup] ${toCancel.length} réservation(s) non payée(s) à annuler`);

    const payload = toCancel.map(b => ({ id: String(b.id), status: "cancelled" }));
    const putRes = await fetch("https://beds24.com/api/v2/bookings", {
      method: "PUT",
      headers: { token, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const putData = await putRes.json().catch(() => ({}));
    console.log(`[beds24-cleanup] Annulation PUT → ${putRes.status}`, JSON.stringify(putData).slice(0, 200));

  } catch (e) {
    console.error("[beds24-cleanup] Erreur:", e.message);
  }
}

// ── Caution auto-release J+3 ──────────────────────────────────────────────────
// Interroge Stripe pour tous les PaymentIntents de type "caution" en requires_capture
// Si checkout + 3 jours <= today → annule (libère les fonds)
async function runCautionAutoRelease(env) {
  if (!env.STRIPE_SECRET_KEY) { console.log("[caution] STRIPE_SECRET_KEY absent"); return; }
  const todayStr = today();

  // Stripe Search API — tous les PI caution en attente de capture
  // Le site crée les cautions avec type='deposit' (create-deposit-intent.js)
  const query = encodeURIComponent("status:'requires_capture' AND metadata['type']:'deposit'");
  let released = 0;

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/payment_intents/search?query=${query}&limit=100`,
      { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } }
    );
    const data = await res.json();
    if (data.error) { console.error("[caution] Stripe error:", data.error.message); return; }

    for (const pi of (data.data || [])) {
      // Cautions DIFFÉRÉES (résas lointaines) : cycle complet géré par caution-cron
      // (pose / re-pose glissante / libération). Ne pas les libérer ici.
      if (pi.metadata?.kind === "caution-auto") continue;
      const checkoutDate = pi.metadata?.checkout;
      if (!checkoutDate) continue;
      const releaseDate = addDays(checkoutDate, 3);
      if (todayStr < releaseDate) continue; // pas encore J+3

      // Annuler le PaymentIntent → libère le hold sur la CB du voyageur
      const cancelRes = await fetch(
        `https://api.stripe.com/v1/payment_intents/${pi.id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ cancellation_reason: "abandoned" }).toString(),
        }
      );
      const cancelled = await cancelRes.json();
      if (cancelled.status === "canceled") {
        released++;
        const bienId = pi.metadata?.bienId || "?";
        const voyageur = pi.metadata?.voyageur || "voyageur";
        const montant = (pi.amount / 100).toFixed(0);
        clog("caution", "info", { step: "release", montant, guest: redactName(voyageur), bienId, checkoutDate });

        // Email de confirmation à l'hôte
        await sendEmail(env, {
          subject: `✅ Caution libérée — ${bienId} (${voyageur})`,
          html: emailWrapper(`
            <h2 style="color:#14b8a6">✅ Caution libérée automatiquement</h2>
            <p>La caution de <strong>${montant}€</strong> pour <strong>${voyageur}</strong>
            (${bienId}) a été libérée automatiquement 3 jours après le départ du ${checkoutDate}.</p>
            <p style="color:#7a6b5a;font-size:14px;">La CB du voyageur n'a pas été débitée.</p>
          `),
        });
      } else {
        console.error(`[caution] ✗ Échec libération ${pi.id}:`, cancelled.error?.message);
      }
    }
    console.log(`[caution] ${released} caution(s) libérée(s)`);
  } catch (e) {
    console.error("[caution] Erreur:", e.message);
  }
  return { released };
}

// ── Gap Pricing — remise automatique sur les trous de calendrier ─────────────
// Logique : si 2 réservations sont séparées de 1-4 nuits et que le gap
// commence dans les 21 prochains jours → remise pour combler le trou.
// Discount : 1-2 nuits = -25%, 3-4 nuits = -15%
// RM-01 (last-room-value) : facteur de remise par bien — on PROTÈGE l'amiral (Amaryllis :
// unique, 8p, 4,94, peu de substituts) et on remise PLUS les biens substituables (studios 2p).
// Iguana exclu (bail long, bookable:false). Le plancher price_min reste appliqué en aval. TUNABLE.
const DISCOUNT_FACTOR = { amaryllis: 0.4, zandoli: 0.7, iguana: 0, geko: 1.0, mabouya: 1.2, schoelcher: 1.2, nogent: 1.0 };
const factorBien = (id) => (id in DISCOUNT_FACTOR ? DISCOUNT_FACTOR[id] : 1.0);
// RM-02 (lead-time) : ne pas lâcher la remise trop tôt — faible loin de la date, pleine à l'approche.
const factorLeadTime = (daysUntil) => (daysUntil > 14 ? 0.5 : daysUntil > 7 ? 0.8 : 1.0);
// Remise finale = base × bien × lead-time (arrondie). Le clamp price_min se fait à la consommation.
const adjustDiscountPct = (basePct, bienId, daysUntil) => Math.round(basePct * factorBien(bienId) * factorLeadTime(daysUntil));

// RM-01 (last-room-value) — SENS HAUSSE : forte demande → premium sur les dernières dates libres.
// Facteur INVERSÉ vs remise : l'amiral/bien rare commande le plus gros premium ; les studios
// substituables le plus faible (sinon le voyageur va ailleurs). Iguana exclu. Plafonné price_max
// (clamp autoritaire côté widget, sur le prix réel). Stocké en pct NÉGATIF dans gap_prices. TUNABLE.
const UPLIFT_FACTOR = { amaryllis: 1.4, zandoli: 1.1, iguana: 0, geko: 1.0, mabouya: 0.7, schoelcher: 0.7, nogent: 1.0 };
const factorUpBien = (id) => (id in UPLIFT_FACTOR ? UPLIFT_FACTOR[id] : 1.0);
// Lead-time hausse : date proche + pleine = dernières chambres → premium plus fort.
const factorUpLead = (daysUntil) => (daysUntil <= 2 ? 1.0 : daysUntil <= 4 ? 0.85 : 0.7);
const adjustUpliftPct = (baseUp, bienId, daysUntil) => Math.round(baseUp * factorUpBien(bienId) * factorUpLead(daysUntil));

async function runGapPricing(env, allEvents) {
  const todayStr = today();
  const horizon  = addDays(todayStr, 21);
  const gaps     = {}; // { bienId: { date: discountPct } }

  // Grouper les événements par bien, triés par date de début
  const byBien = {};
  for (const ev of allEvents) {
    if (!byBien[ev.bienId]) byBien[ev.bienId] = [];
    byBien[ev.bienId].push(ev);
  }
  for (const [bienId, evs] of Object.entries(byBien)) {
    const sorted = evs.slice().sort((a, b) => a.checkin.localeCompare(b.checkin));
    for (let i = 0; i < sorted.length - 1; i++) {
      const endA   = sorted[i].checkout;      // départ du séjour A (date libre)
      const startB = sorted[i + 1].checkin;   // arrivée du séjour B
      const gapLen = diffDays(endA, startB);
      if (gapLen < 1 || gapLen > 4) continue;           // pas un trou utile
      if (endA < todayStr || endA > horizon) continue;   // hors fenêtre 21j
      const basePct = gapLen <= 2 ? 25 : 15;
      for (let d = 0; d < gapLen; d++) {
        const date = addDays(endA, d);
        const adj = adjustDiscountPct(basePct, bienId, diffDays(todayStr, date)); // RM-01 + RM-02
        if (adj <= 0) continue;  // bien protégé (amiral/iguana) ou remise nulle
        if (!gaps[bienId]) gaps[bienId] = {};
        gaps[bienId][date] = adj;
      }
    }
  }

  // Sauvegarder dans KV (clé globale, TTL 24h)
  await env.ICAL_STORE.put("gap_prices", JSON.stringify(gaps), { expirationTtl: 86400 });
  const totalDates = Object.values(gaps).reduce((s, m) => s + Object.keys(m).length, 0);
  console.log(`[gap-pricing] ${totalDates} dates remisées sur ${Object.keys(gaps).length} biens`);
  return gaps;
}

// ── Yield Management — ajustement tarifaire automatique sur 14j ─────────────
// Couvre également les "last-minute deals" (feature #3) — pas de fonction séparée :
//   les dates libres à J+0→J+4 obtiennent -20%, J+5→J+13 -15% si occ < 30%.
// Logique :
//   occ < 30% sur 14j  → -20% sur J à J+4 libres, -15% sur J+5 à J+13 libres
//   occ > 80% sur 7j   → log seulement, pas de modification des prix
// Merge dans la clé KV `gap_prices` (prend le max entre gap_pricing et yield)
// Envoie un email récap à l'hôte si des remises ont été appliquées
async function runYieldPricing(env, allEvents) {
  const todayStr = today();
  const in14     = addDays(todayStr, 14);
  const in7      = addDays(todayStr, 7);
  const yieldPrices = {}; // { bienId: { date: pct } }

  // ── Charger les price_min depuis D1 (plancher absolu par bien) ──────────────
  const priceMinMap = {}; // { bienId: { priceMin, basePriceLow } }
  try {
    const db = env.revenue_manager;
    if (db) {
      const { results: props } = await db.prepare(
        "SELECT id, price_min, price_max, base_price_low, base_price_high FROM rm_properties WHERE is_active = 1"
      ).all();
      for (const p of (props || [])) {
        priceMinMap[p.id] = { priceMin: p.price_min || 0, priceMax: p.price_max || 0, basePriceLow: p.base_price_low || 0, basePriceHigh: p.base_price_high || 0 };
      }
    }
  } catch (e) {
    console.log("[yield] Impossible de charger price_min depuis D1:", e.message);
  }

  // Calculer occupation par bien sur 14j et 7j
  const occ14 = {}, occ7 = {};
  for (const e of allEvents) {
    if (e.checkin > in14 || e.checkout <= todayStr) continue;
    const start14 = e.checkin > todayStr ? e.checkin : todayStr;
    const end14   = e.checkout < in14 ? e.checkout : in14;
    const n14 = diffDays(start14, end14);
    occ14[e.bienId] = (occ14[e.bienId] || 0) + n14;

    if (e.checkin < in7 && e.checkout > todayStr) {
      const start7 = e.checkin > todayStr ? e.checkin : todayStr;
      const end7   = e.checkout < in7 ? e.checkout : in7;
      const n7 = diffDays(start7, end7);
      occ7[e.bienId] = (occ7[e.bienId] || 0) + n7;
    }
  }

  // Calculer les dates réservées par bien (pour ne jamais promo une date occupée)
  const reservedDates = {};
  for (const e of allEvents) {
    if (e.checkout <= todayStr || e.checkin > in14) continue;
    if (!reservedDates[e.bienId]) reservedDates[e.bienId] = new Set();
    let cur = e.checkin > todayStr ? e.checkin : todayStr;
    const endR = e.checkout < in14 ? e.checkout : in14;
    while (cur < endR) {
      reservedDates[e.bienId].add(cur);
      cur = addDays(cur, 1);
    }
  }

  const allBienIds = new Set([
    ...Object.keys(getAirbnbUrls(env)),
    ...Object.keys(occ14),
  ]);

  let totalAdjusted = 0;

  for (const bienId of allBienIds) {
    const pct14 = ((occ14[bienId] || 0) / 14) * 100;
    const pct7  = ((occ7[bienId]  || 0) / 7)  * 100;

    // Forte demande sur 7j → PREMIUM auto sur les dernières dates libres (RM-01 last-room-value).
    // Stocké en pct NÉGATIF (uplift) ; le plafond price_max est clampé côté widget (prix réel).
    if (pct7 > 80) {
      if (!yieldPrices[bienId]) yieldPrices[bienId] = {};
      const reserved = reservedDates[bienId] || new Set();
      const pmData = priceMinMap[bienId] || {};
      const priceMaxCents = pmData.priceMax || 0;
      // Cap contre le HAUT normal (base_price_high) → base_high×(1+up%) ≤ price_max garantit le
      // plafond pour TOUT prix réel du jour (≤ base_high), sans dépendre du widget (endpoint 401).
      const capBaseCents = pmData.basePriceHigh || pmData.basePriceLow || 0;
      const baseUp = pct7 >= 95 ? 25 : 15; // quasi-plein = dernières chambres → pousser plus fort
      let nUp = 0;
      for (let d = 0; d < 7; d++) {
        const dateStr = addDays(todayStr, d);
        if (reserved.has(dateStr)) continue; // date déjà vendue
        let up = adjustUpliftPct(baseUp, bienId, d);
        if (up <= 0) continue; // bien exclu (iguana) ou premium nul
        // Plafond price_max garanti (cap contre base_high) :
        if (priceMaxCents > 0 && capBaseCents > 0) {
          const maxUpPct = Math.floor((priceMaxCents / capBaseCents - 1) * 100);
          if (maxUpPct <= 0) continue;
          if (up > maxUpPct) up = maxUpPct;
        }
        yieldPrices[bienId][dateStr] = -up; // négatif = uplift
        nUp++;
      }
      console.log(`[yield] ${bienId} — occ ${Math.round(pct7)}% → premium sur ${nUp} date(s) libre(s)`);
      continue;
    }

    // Sous-occupation sur 14j → appliquer remises (avec respect du price_min)
    if (pct14 < 30) {
      if (!yieldPrices[bienId]) yieldPrices[bienId] = {};
      const reserved = reservedDates[bienId] || new Set();
      const pmData = priceMinMap[bienId] || {};
      // Plancher : price_min D1 si configuré, sinon prix site biens.js (jamais 0)
      const siteFloor = SITE_PRIX_CENTS[bienId] || 0;
      const priceMinCents = pmData.priceMin || siteFloor;
      const basePriceCents = pmData.basePriceLow || siteFloor;

      for (let d = 0; d < 14; d++) {
        const dateStr = addDays(todayStr, d);
        if (reserved.has(dateStr)) continue; // date occupée, skip

        const discount = adjustDiscountPct(d <= 4 ? 20 : 15, bienId, d); // RM-01 (bien) + RM-02 (lead-time = d jours)
        if (discount <= 0) continue; // bien protégé (amiral/iguana)

        // Vérifier que le prix après remise respecte le plancher absolu
        if (priceMinCents > 0 && basePriceCents > 0) {
          const discountedCents = Math.round(basePriceCents * (1 - discount / 100));
          if (discountedCents < priceMinCents) {
            const maxDiscountPct = Math.floor((1 - priceMinCents / basePriceCents) * 100);
            if (maxDiscountPct <= 0) {
              console.log(`[yield] ${bienId} ${dateStr} — plancher atteint (${priceMinCents/100}€), remise annulée`);
              continue;
            }
            console.log(`[yield] ${bienId} ${dateStr} — remise plafonnée à ${maxDiscountPct}% (plancher ${priceMinCents/100}€)`);
            yieldPrices[bienId][dateStr] = maxDiscountPct;
            totalAdjusted++;
            continue;
          }
        }

        yieldPrices[bienId][dateStr] = discount;
        totalAdjusted++;
      }
    }
  }

  // Juillet-août : pas de yield pricing (CalendrierTarifs = référence unique)
  for (const bienId of Object.keys(yieldPrices)) {
    for (const date of Object.keys(yieldPrices[bienId])) {
      if (date >= "2026-07-01" && date <= "2026-08-31") delete yieldPrices[bienId][date];
    }
    if (Object.keys(yieldPrices[bienId]).length === 0) delete yieldPrices[bienId];
  }

  // Merge dans gap_prices (prend le max entre gap et yield)
  const gapRaw = await env.ICAL_STORE.get("gap_prices").catch(() => null);
  const gapPrices = gapRaw ? JSON.parse(gapRaw) : {};
  for (const [bienId, dates] of Object.entries(yieldPrices)) {
    if (!gapPrices[bienId]) gapPrices[bienId] = {};
    for (const [date, pct] of Object.entries(dates)) {
      // pct < 0 = uplift (forte demande) → set direct ; pct > 0 = remise → max. (un bien est soit
      // en creux soit en forte demande, jamais les deux sur la même date → pas de conflit)
      gapPrices[bienId][date] = pct < 0 ? pct : Math.max(gapPrices[bienId][date] || 0, pct);
    }
  }
  await env.ICAL_STORE.put("gap_prices", JSON.stringify(gapPrices), { expirationTtl: 86400 });

  console.log(`[yield] ${totalAdjusted} dates ajustées`);

  // ── Email récap yield pricing ────────────────────────────────────────────────
  if (Object.keys(yieldPrices).length > 0) {
    const rows = Object.entries(yieldPrices).map(([bienId, dates]) => {
      const nom = NOMS[bienId] || bienId;
      const pct14 = Math.round(((occ14[bienId] || 0) / 14) * 100);
      const datesSorted = Object.keys(dates).sort();
      const first = datesSorted[0], last = datesSorted[datesSorted.length - 1];
      const sample20 = Object.entries(dates).filter(([, p]) => p === 20).length;
      const sample15 = Object.entries(dates).filter(([, p]) => p === 15).length;
      return `<tr>
        <td style="padding:8px 14px;font-weight:600;color:#0e3b3a;">${nom}</td>
        <td style="padding:8px 14px;color:#c47254;font-weight:700;">${pct14}% occ.</td>
        <td style="padding:8px 14px;color:#0e3b3a;">${datesSorted.length} dates<br><span style="font-size:11px;color:#7a6b5a;">${first} → ${last}</span></td>
        <td style="padding:8px 14px;font-size:12px;color:#0e3b3a;">${sample20 > 0 ? `<span style="color:#ef4444;font-weight:700;">-20%</span> × ${sample20}` : ""}${sample20 > 0 && sample15 > 0 ? " · " : ""}${sample15 > 0 ? `<span style="color:#f59e0b;font-weight:700;">-15%</span> × ${sample15}` : ""}</td>
      </tr>`;
    }).join("");

    await sendEmail(env, {
      subject: `📉 Yield pricing appliqué — ${Object.keys(yieldPrices).length} bien(s) remisé(s)`,
      html: emailWrapper(`
        <h2 style="color:#0e3b3a;margin:0 0 8px">📉 Yield Management — Récapitulatif</h2>
        <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · ${totalAdjusted} dates remisées au total</p>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
          <thead><tr style="background:#fde8e0;">
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Logement</th>
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Occupation 14j</th>
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Dates concernées</th>
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Remises</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;font-size:12px;color:#7a6b5a;">Les remises sont visibles sur le calendrier public et se désactivent automatiquement une fois les dates réservées.</p>
        <div style="margin-top:12px;text-align:center;">
          <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Voir le planning →</a>
        </div>
      `),
    });
  } else {
    console.log("[yield] Aucune remise appliquée aujourd'hui (tous les biens bien occupés)");
  }

  return yieldPrices;
}

// ── Rappel hebdomadaire : mise à jour des prix Airbnb ────────────────────────
// Envoyé chaque lundi avec le rapport hebdomadaire (cron 0 6 * * 1)
const AIRBNB_LISTINGS = [
  { nom: "Villa Amaryllis", id: "54269844",             base: 280 },
  { nom: "Zandoli",         id: "792768220924504884",   base: 220 },
  { nom: "Géko",            id: "1263155865459755724",  base: 150 },
  { nom: "Mabouya",         id: "1046596752160926069",  base: 110 },
  { nom: "Bellevue",        id: "24242415",             base: 100 },
];

async function runPrixRecap(env) {
  if (!env.RESEND_API_KEY) { console.log("[prix-recap] RESEND_API_KEY manquante — ignoré"); return; }
  const dest = env.RECAP_EMAIL || env.NOTIFICATION_EMAIL || "contact@villamaryllis.com";
  const dateStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const rows = AIRBNB_LISTINGS.map(l => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e8dcc8;font-weight:600;color:#0e3b3a;">${l.nom}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e8dcc8;color:#555;">À partir de <strong>${l.base}€</strong>/nuit</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e8dcc8;">
        <a href="https://www.airbnb.fr/hosting/listings/${l.id}/pricing"
           style="background:#c47254;color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">
          Modifier →
        </a>
      </td>
    </tr>`).join("");

  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf5e9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#0e3b3a;padding:32px 32px 24px;">
      <p style="color:#c47254;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Rappel automatique · Lundi</p>
      <h1 style="color:#faf5e9;font-weight:300;font-size:24px;margin:0;letter-spacing:0.05em;">Synchronisation des prix Airbnb</h1>
      <p style="color:rgba(250,245,233,0.6);font-size:13px;margin:12px 0 0;">${dateStr}</p>
    </div>
    <div style="padding:28px 32px 8px;">
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Pensez à vérifier et synchroniser vos tarifs sur Airbnb pour les 30 prochains jours.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e8dcc8;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f5efe0;">
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Logement</th>
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Prix de base</th>
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Action</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:24px 32px 32px;display:flex;gap:12px;flex-wrap:wrap;">
      <a href="https://www.airbnb.fr/hosting/listings"
         style="display:inline-block;background:#0e3b3a;color:#faf5e9;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.06em;">
        Ouvrir Airbnb Host →
      </a>
      <a href="${siteUrl}/admin"
         style="display:inline-block;background:#c47254;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">
        Dashboard →
      </a>
    </div>
    <div style="background:#f5efe0;padding:16px 32px;text-align:center;">
      <p style="color:#aaa;font-size:12px;margin:0;">Message automatique · <a href="${siteUrl}" style="color:#aaa;">villamaryllis.com</a></p>
    </div>
  </div>
</body>
</html>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: resendFrom(env),
      to: [dest],
      subject: `📅 Rappel prix Airbnb — ${new Date().toLocaleDateString("fr-FR")}`,
      html,
    }),
  });
  if (!r.ok) console.error("[prix-recap] Resend error:", await r.text());
  else console.log(`[prix-recap] ✓ Rappel envoyé à ${dest}`);
}

// ── Génération d'un draft Reel pour une entrée format=reel ─────────────────
// Chemin séparé du social_post : caption LLM + plan de montage déterministe.
// videoUrl reste null jusqu'au render Container (Phase future).
async function generateReelDraft(env, entry, siteUrl) {
  const bienId   = entry.bien_id  || "amaryllis";
  const theme    = entry.theme    || "logement";
  const variante = entry.variante || "";

  const BIEN_NAMES = {
    amaryllis: "Villa Amaryllis", iguana: "Villa Iguana",
    zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya",
    schoelcher: "Schœlcher", nogent: "Nogent",
  };
  const bienName = BIEN_NAMES[bienId] || bienId;

  // 1. Caption LLM via /api/llm-generate (cascade résiliente — /api/ai-summary dépend
  //    d'ANTHROPIC_API_KEY absente en prod → échouait systématiquement, silencieusement).
  const captionPrompt = `Tu es le community manager d'Amaryllis Locations (conciergerie Martinique). Rédige un caption Instagram Reel pour "${bienName}", thème "${theme}"${variante ? `, angle "${variante}"` : ""}.

Structure OBLIGATOIRE (5 blocs séparés par \\n\\n) :
1. HOOK (1 ligne sensorielle stop-scroll — pas de question)
2. DESCRIPTION (2-3 lignes immersives, vue/lumière/ambiance)
3. BÉNÉFICE voyageur (1 ligne concrète)
4. CTA : "Réservez sur https://villamaryllis.com/${bienId} ⤴️"
5. HASHTAGS (8-10 hashtags : #martinique #villamaryllis + lieu + ambiance)

VOIX : "vous" formel, sensoriel, jamais pub Meta.
INTERDIT (biens sur les hauteurs, pas en bord de mer) : vagues, clapotis, plage privée, pieds dans l'eau.

Retourne UNIQUEMENT le caption brut (pas de JSON, pas de balises).`;

  const aiRes  = await fetch(`${siteUrl}/api/llm-generate?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: captionPrompt, maxTokens: 600 }),
  });
  const aiData = await aiRes.json().catch(() => ({}));
  const caption = (aiData.text || "").trim();
  if (!caption) throw new Error("LLM caption vide" + (aiData.error ? `: ${aiData.error}` : ""));

  // 2. Plan de montage déterministe (5 photos par bien, Ken Burns varié) ────
  const PHOTO_SETS = {
    amaryllis:  ["01.webp","03.webp","05.webp","07.webp","09.webp"],
    iguana:     ["01.webp","02.webp","03.webp","04.webp","05.webp"],
    zandoli:    ["01.webp","02.webp","03.webp","04.webp","05.webp"],
    geko:       ["01.webp","02.webp","03.webp","04.webp","05.webp"],
    mabouya:    ["01.webp","02.webp","03.webp","04.webp","05.webp"],
    schoelcher: ["01.webp","02.webp","03.webp","04.webp","05.webp"],
    nogent:     ["01.webp","02.webp","03.webp","04.webp","05.webp"],
  };
  const KB_CYCLE = ["in","out","left","in","right"];
  const photos   = PHOTO_SETS[bienId] || PHOTO_SETS.amaryllis;
  const clips    = photos.map((src, i) => ({ src, duration: 3, kenburns: KB_CYCLE[i % KB_CYCLE.length] }));

  const plan = {
    bienId, title: bienName,
    fps: 30, width: 1080, height: 1920,
    transition: "fade", transitionDuration: 0.5,
    clips,
    audio: null, // À compléter manuellement ou par le Container
  };

  // 3. Choisir la vidéo depuis la whitelist D1 (editorial_videos), fallback reel-{bien}.mp4
  let videoUrl = `${siteUrl}/videos/reel-${bienId}.mp4`;
  try {
    const vidsRes = await fetch(`${siteUrl}/api/editorial-videos?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
    const vidsData = await vidsRes.json().catch(() => ({}));
    const vids = (vidsData.videos || {})[bienId] || [];
    if (vids.length > 0) videoUrl = `${siteUrl}/videos/${vids[Math.floor(Math.random() * vids.length)]}`;
  } catch { /* fallback reel-{bien}.mp4 */ }

  // Créer le draft reel_post en D1 ───────────────────────────────────────
  const draftRes  = await fetch(
    `${siteUrl}/api/agent-drafts?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent: "community-manager",
        agent_label: "Community Manager",
        agent_emoji: "🎬",
        type: "reel_post",
        payload: {
          caption,
          videoUrl,          // Vidéo whitelistée ou fallback reel-{bien}.mp4
          coverUrl: null,
          channels: ["ig", "fb"],
          plan,              // Contrat JSON pour render.mjs
          calendarId: entry.id,
          bienId,
          scheduledAt: entry.scheduled_at,
        },
        rationale: `Reel ${bienName} — ${theme}${variante ? " / " + variante : ""}`,
        preview: caption.slice(0, 200),
      }),
    },
  );
  const draftData = await draftRes.json();
  if (!draftData.ok || !draftData.id) throw new Error(`Draft création échouée : ${JSON.stringify(draftData)}`);

  // 4. Lier le draft au calendrier éditorial ────────────────────────────────
  await fetch(`${siteUrl}/api/editorial-calendar?id=${entry.id}&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft_id: draftData.id, status: "drafted" }),
  }).catch(() => {});

  console.log(`[editorial-J-2] 🎬 reel_post #${draftData.id} créé pour entry ${entry.id} (${bienName})`);

  // 5. Auto-validation gate — scorer le caption, approuver si ≥ 75 ──────────
  const SCORE_THRESHOLD = 75;
  try {
    const judgePrompt = `Tu es un expert Instagram Reels. Note ce caption de 0 à 100.
CAPTION :
"""
${caption}
"""
Critères (total 100pts) :
- Hook stop-scroll sensoriel : 20pts
- Immersion (vue/lumière/ambiance) : 25pts
- CTA clair avec URL villamaryllis.com : 15pts
- Hashtags stratégiques (8-10) : 20pts
- Voix formelle "vous" respectée : 10pts
- Pas d'erreurs factuelles (biens sur hauteurs, pas bord de mer) : 10pts
Retourne UNIQUEMENT : {"score":0-100,"verdict":"approve"|"reject","reason":"1 phrase"}`;

    const jRes  = await fetch(`${siteUrl}/api/llm-generate?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: judgePrompt, maxTokens: 120 }),
    });
    const jData = await jRes.json().catch(() => ({}));
    const jText = jData.text || "{}";
    let judge = { score: 0, verdict: "reject", reason: "parse error" };
    try { judge = JSON.parse(jText.match(/\{[\s\S]*\}/)?.[0] || "{}"); } catch {}

    const score  = Math.min(100, Math.max(0, Number(judge.score) || 0));
    const autoOK = score >= SCORE_THRESHOLD && judge.verdict === "approve";

    // Stocker le score dans le payload
    await fetch(`${siteUrl}/api/agent-drafts?id=${draftData.id}&action=edit&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          caption, videoUrl, coverUrl: null, channels: ["ig", "fb"], plan,
          calendarId: entry.id, bienId, scheduledAt: entry.scheduled_at,
          reviews: { score, verdict: judge.verdict, reason: judge.reason || "" },
        },
      }),
    }).catch(() => {});

    // Approuver automatiquement si score suffisant
    if (autoOK) {
      const approveRes = await fetch(`${siteUrl}/api/agent-drafts?id=${draftData.id}&action=approve&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
        method: "PATCH",
      }).catch((e) => { console.error(`[editorial-J-2] approve #${draftData.id} fetch error:`, e.message); return null; });
      if (approveRes && !approveRes.ok) {
        const errBody = await approveRes.text().catch(() => "");
        console.error(`[editorial-J-2] approve #${draftData.id} HTTP ${approveRes.status}:`, errBody);
      }
      console.log(`[editorial-J-2] ✅ reel_post #${draftData.id} AUTO-APPROUVÉ (${score}/100)`);
    } else {
      console.log(`[editorial-J-2] ⚠️ reel_post #${draftData.id} — score ${score}/100 < seuil → révision manuelle`);
    }

    // ntfy Vincent
    const ntfyTopic = env.NTFY_TOPIC || "amaryllis-alertes-7r4k9";
    const ntfyBody  = autoOK
      ? `${bienName} — ${score}/100 ✅ Caption approuvée. Render la vidéo et remplis videoUrl pour activer la publi.`
      : `${bienName} — ${score}/100 ⚠️ ${judge.reason || "qualité insuffisante"} · Révision manuelle.`;
    await fetch(`https://ntfy.sh/${ntfyTopic}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Title": autoOK ? "🎬 Reel approuvé" : "⚠️ Reel à relire",
        "Priority": autoOK ? "default" : "high",
        "Tags": "film_strip",
      },
      body: ntfyBody,
    }).catch(() => {});

  } catch (judgeErr) {
    console.warn(`[editorial-J-2] scoring reel #${draftData.id} échoué:`, judgeErr.message);
  }
}

// ── Editorial Calendar : génération drafts J+2 (cron quotidien 12h UTC) ────
async function runEditorialDraftGen(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    // Cible : entrées planifiées dont scheduled_at est dans 2 jours (±12h)
    const now    = Math.floor(Date.now() / 1000);
    const target = now + 2 * 86400;
    const from   = new Date((target - 12 * 3600) * 1000).toISOString().slice(0, 10);
    const to     = new Date((target + 12 * 3600) * 1000).toISOString().slice(0, 10);

    const r = await fetch(`${siteUrl}/api/editorial-calendar?from=${from}&to=${to}&status=planned`);
    const d = await r.json();
    const entries = d.entries || [];
    if (entries.length === 0) { console.log("[editorial-J-2] Aucune entrée planifiée à J+2"); return; }

    // Whitelist photos (les « plus belles » cochées par Vincent) — la génération ne pioche QUE dedans.
    let allowedPhotos = {};
    try {
      const wr = await fetch(`${siteUrl}/api/editorial-photos?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
      const wd = await wr.json();
      allowedPhotos = wd.photos || {};
    } catch (err) { console.warn("[editorial-J-2] whitelist photos indisponible:", err.message); }

    console.log(`[editorial-J-2] ${entries.length} entrée(s) à générer`);
    for (const e of entries) {
      // Marque "generating"
      await fetch(`${siteUrl}/api/editorial-calendar?id=${e.id}&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "generating" }),
      }).catch(() => {});

      // Reels → chemin dédié (caption LLM + plan déterministe, pas de community-manager)
      if (e.format === "reel") {
        try {
          await generateReelDraft(env, e, siteUrl);
        } catch (err) {
          console.error(`[editorial-J-2] reel entry ${e.id}:`, err.message);
          await fetch(`${siteUrl}/api/editorial-calendar?id=${e.id}&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "failed" }),
          }).catch(() => {});
          // Alerte immédiate : un échec de génération silencieux (console non lu) était
          // la cause principale des posts ratés — cf. incidents 06/2026-07/2026.
          try {
            await fetch(`https://ntfy.sh/${env.NTFY_TOPIC || "amaryllis-alertes-7r4k9"}`, {
              method: "POST",
              headers: { Title: `⚠️ Reel non généré — ${e.bien_id || "?"}`, Priority: "default", Tags: "movie_camera,x" },
              body: `Entry #${e.id} (${e.theme || "?"}) — génération échouée : ${err.message.slice(0, 150)}\n\nLa relance auto (J+1) tentera de le régénérer en carrousel.`,
            });
          } catch { /* best-effort */ }
        }
        continue;
      }

      // Photo = une photo autorisée du bien (rotation déterministe). Si rien de coché → photo du calendrier (le gate escaladera).
      const wl = allowedPhotos[e.bien_id] || [];
      const relPhotoUrl = wl.length ? `/photos/${e.bien_id}/${wl[Math.abs(e.id) % wl.length]}.webp` : (e.photo_url || `/photos/${e.bien_id}/01.webp`);
      // URL absolue obligatoire pour l'API Meta (Instagram/Facebook)
      const absPhotoUrl = relPhotoUrl.startsWith("http") ? relPhotoUrl : `https://villamaryllis.com${relPhotoUrl}`;

      // Brief enrichi → community-manager — imageUrl OBLIGATOIRE et EXACTE (pas d'invention)
      const brief = `BRIEF CALENDRIER ÉDITORIAL — date=${new Date(e.scheduled_at*1000).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}, bien=${e.bien_id}, thème=${e.theme}, variante=${e.variante}, format=${e.format}, CTA="${e.cta}".
RÈGLE ABSOLUE : le champ imageUrl du draft DOIT être EXACTEMENT "${absPhotoUrl}". Ne pas inventer d'autre URL. Ne pas modifier ce chemin. Utiliser cette URL telle quelle.
Génère UN draft social_post avec cette imageUrl exacte.`;
      const beforeGen = Math.floor(Date.now() / 1000);
      try {
        const runRes = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agents: ["community-manager"], brief, calendar_id: e.id }),
        });
        const runData = await runRes.json();
        const drafts = runData.results?.[0]?.drafts || 0;
        const newStatus = drafts > 0 ? "drafted" : "failed";
        await fetch(`${siteUrl}/api/editorial-calendar?id=${e.id}&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }).catch(() => {});

        // Post-processing : corriger l'imageUrl si le LLM a halluciné une URL différente
        if (drafts > 0 && env.revenue_manager) {
          try {
            const { results: recentDrafts } = await env.revenue_manager.prepare(
              "SELECT id, payload FROM agent_drafts WHERE type='social_post' AND created_at >= ? ORDER BY id DESC LIMIT 3"
            ).bind(beforeGen - 30).all();
            for (const dr of (recentDrafts || [])) {
              const p = JSON.parse(dr.payload || "{}");
              const imgUrl = p.imageUrl || p.image_url || p.photo_url || "";
              if (!imgUrl.includes(`/photos/${e.bien_id}/`)) {
                p.imageUrl = absPhotoUrl;
                await env.revenue_manager.prepare("UPDATE agent_drafts SET payload=?, updated_at=unixepoch() WHERE id=?")
                  .bind(JSON.stringify(p), dr.id).run();
                console.log(`[editorial-J-2] imageUrl corrigée draft ${dr.id}: "${imgUrl}" → "${absPhotoUrl}"`);
              }
            }
          } catch (fixErr) { console.warn("[editorial-J-2] post-fix imageUrl:", fixErr.message); }
        }
      } catch (err) {
        console.error(`[editorial-J-2] erreur entry ${e.id}:`, err.message);
        await fetch(`${siteUrl}/api/editorial-calendar?id=${e.id}&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "failed" }),
        }).catch(() => {});
      }
    }

    // Gate de qualité : juge les drafts générés → auto-approuve (live) ou escalade en ntfy (shadow/fail).
    // mode=live : les drafts qui passent les 4 filtres sont auto-approuvés (status → 'approved') pour la publi horaire.
    try {
      const gateMode = env.EDITORIAL_GATE_MODE || "live";
      const gr = await fetch(`${siteUrl}/api/editorial-gate?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}&mode=${gateMode}`, { method: "POST" });
      const gd = await gr.json();
      console.log(`[editorial-gate] mode=${gd.mode} évalués=${gd.evaluated} auto-publiés=${gd.queued_for_publish} shadow=${gd.would_publish} escaladés=${gd.escalated}`);
    } catch (err) { console.error("[editorial-gate] error:", err.message); }
  } catch (e) {
    console.error("[editorial-J-2] error:", e.message);
  }
}

// ── Editorial Calendar : re-seed auto (horizon glissant 30j, zéro clic « Seed »)
// Idempotent : handleSeed30Days skippe les dates déjà planifiées → relancer chaque jour
// ne crée pas de doublon, ajoute juste le nouveau J+30 entrant dans la fenêtre.
async function runEditorialReseed(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    const r = await fetch(`${siteUrl}/api/editorial-calendar?action=seed_30days&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // start_date = aujourd'hui par défaut
    });
    const d = await r.json();
    console.log(`[editorial-reseed] +${d.inserted || 0} jour(s) planifié(s) (${d.skipped || 0} déjà présents)`);
  } catch (e) {
    console.error("[editorial-reseed] error:", e.message);
  }
}

// ── Auto-rédaction guides voyageurs D1 (cron hebdomadaire, lundi) ────────────
// Appelle /api/guide-write en mode live pour chaque bien avec un guide en D1.
// Les champs critiques (wifi/code/horaires) sont INTOUCHABLES ; seule la prose d'accueil est réécrite.
// En cas d'échec fact-check : escalade ntfy « à revoir » sans rien écrire.
async function runGuideWrite(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = encodeURIComponent(env.POSTSTAY_SECRET || "");
  const biens = ["amaryllis", "zandoli", "geko", "mabouya", "schoelcher", "nogent", "iguana"];
  for (const bien of biens) {
    try {
      const r = await fetch(`${siteUrl}/api/guide-write?property_id=${bien}&mode=live&secret=${secret}`);
      const d = await r.json();
      if (d.disabled) { console.log("[guide-write] kill-switch actif, skip"); break; }
      console.log(`[guide-write] ${bien}: action=${d.action || "?"} valid=${d.valid} changed=${(d.changed||[]).join(",")}`);
    } catch (e) {
      console.error(`[guide-write] ${bien} error:`, e.message);
    }
  }
}

// ── Editorial Calendar : retry des posts échoués (< 24h, max 3 tentatives) ────
// Réinitialise les entrées récemment failed en 'approved' pour que le cron
// de publication les reprenne. Ignore les échecs > 24h (contenu périmé).
async function runEditorialRetry(env) {
  const db = env.revenue_manager;
  if (!db) return;
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - 24 * 3600;
  try {
    // Entrées failed dans les 24 dernières heures avec draft ayant < 3 tentatives
    const { results } = await db.prepare(`
      SELECT ec.id, ec.draft_id, ec.bien_id, ec.updated_at,
             CAST(json_extract(ad.result, '$.retry_count') AS INTEGER) as retry_count
      FROM editorial_calendar ec
      LEFT JOIN agent_drafts ad ON ad.id = ec.draft_id
      WHERE ec.status = 'failed' AND ec.updated_at > ? AND ec.draft_id IS NOT NULL
      ORDER BY ec.updated_at DESC LIMIT 10
    `).bind(cutoff).all();

    let retried = 0;
    for (const e of (results || [])) {
      const retryCount = (e.retry_count || 0);
      if (retryCount >= 3) { console.log(`[editorial-retry] entry ${e.id} — max tentatives atteint (${retryCount}), skip`); continue; }
      // Incrémenter retry_count dans le result du draft
      const newCount = retryCount + 1;
      await db.prepare("UPDATE editorial_calendar SET status='approved', updated_at=? WHERE id=?").bind(now, e.id).run();
      await db.prepare("UPDATE agent_drafts SET status='approved', result=json_set(COALESCE(result,'{}'),'$.retry_count',?), published_at=NULL, updated_at=? WHERE id=?")
        .bind(newCount, now, e.draft_id).run().catch(() => {});
      console.log(`[editorial-retry] entry ${e.id} (${e.bien_id}) — tentative ${newCount}/3 reprogrammée`);
      retried++;
    }
    if (retried > 0) console.log(`[editorial-retry] ${retried} entrée(s) reprogrammée(s)`);

    // Cas spécial : entrées failed sans draft (draft_id IS NULL) → relancer la génération du draft
    const { results: orphans } = await db.prepare(`
      SELECT id, bien_id, theme, variante, format, cta, photo_url, scheduled_at
      FROM editorial_calendar
      WHERE status = 'failed' AND draft_id IS NULL AND updated_at > ?
      ORDER BY updated_at DESC LIMIT 5
    `).bind(cutoff).all();
    let regenerated = 0;
    for (const e of (orphans || [])) {
      const relPhoto = e.photo_url || `/photos/${e.bien_id}/01.webp`;
      const absPhoto = relPhoto.startsWith("http") ? relPhoto : `https://villamaryllis.com${relPhoto}`;
      const brief = `BRIEF CALENDRIER ÉDITORIAL — date=${new Date(e.scheduled_at*1000).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}, bien=${e.bien_id}, thème=${e.theme}, variante=${e.variante}, format=${e.format}, CTA="${e.cta}".
RÈGLE ABSOLUE : le champ imageUrl du draft DOIT être EXACTEMENT "${absPhoto}". Ne pas inventer d'autre URL. Utiliser cette URL telle quelle.
Génère UN draft social_post avec cette imageUrl exacte.`;
      try {
        const siteUrl = env.SITE_URL || "https://villamaryllis.com";
        const beforeGen = Math.floor(Date.now() / 1000);
        const runRes = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agents: ["community-manager"], brief, calendar_id: e.id }),
        });
        const runData = await runRes.json();
        const drafts = runData.results?.[0]?.drafts || 0;
        if (drafts > 0) {
          // Post-processing imageUrl
          const { results: recentDrafts } = await db.prepare(
            "SELECT id, payload FROM agent_drafts WHERE type='social_post' AND created_at >= ? ORDER BY id DESC LIMIT 3"
          ).bind(beforeGen - 30).all();
          for (const dr of (recentDrafts || [])) {
            const p = JSON.parse(dr.payload || "{}");
            const imgUrl = p.imageUrl || p.image_url || p.photo_url || "";
            if (!imgUrl.includes(`/photos/${e.bien_id}/`)) {
              p.imageUrl = absPhoto;
              await db.prepare("UPDATE agent_drafts SET payload=?, updated_at=unixepoch() WHERE id=?")
                .bind(JSON.stringify(p), dr.id).run();
            }
          }
          await db.prepare("UPDATE editorial_calendar SET status='drafted', updated_at=? WHERE id=?").bind(now, e.id).run();
          console.log(`[editorial-retry] entry ${e.id} (${e.bien_id}) — draft regénéré (orphelin sans draft_id)`);
          regenerated++;
        }
      } catch (rErr) { console.warn(`[editorial-retry] regen entry ${e.id}:`, rErr.message); }
    }
    if (regenerated > 0) console.log(`[editorial-retry] ${regenerated} draft(s) orphelin(s) regénéré(s)`);

    // Nettoyage des entrées failed > 7 jours (contenu périmé — archivées en 'archived')
    await db.prepare("UPDATE editorial_calendar SET status='archived', updated_at=? WHERE status='failed' AND updated_at < ?")
      .bind(now, now - 7 * 24 * 3600).run().catch(() => {});
  } catch (e) {
    console.error("[editorial-retry] error:", e.message);
  }
}

// ── Editorial Calendar : réparation automatique des drafts escaladés (après le gate J-2) ────
// Garantit 1 publication/jour même si le gate bloque un draft.
// Deux cas traités :
//   • doublon bien_id (<7j) → swap vers un bien disponible + regénère un draft
//   • score/verdict/mots_interdits → applique les improved_blocks calculés par le gate + réexécute le gate
// Tourne juste après runEditorialDraftGen + gate dans le cron 0 12 * * *.
async function runEditorialRepair(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const db = env.revenue_manager;
  if (!db) return;

  const now = Math.floor(Date.now() / 1000);
  const horizon = now + 48 * 3600;

  // Entrées 'drafted' dans les 48h dont le gate a escaladé
  const { results: entries } = await db.prepare(
    "SELECT ec.id, ec.bien_id, ec.draft_id, ec.scheduled_at FROM editorial_calendar ec WHERE ec.status='drafted' AND ec.scheduled_at BETWEEN ? AND ? AND ec.draft_id IS NOT NULL"
  ).bind(now, horizon).all().catch(() => ({ results: [] }));

  if (!entries?.length) { console.log("[editorial-repair] aucun draft escaladé dans les 48h"); return; }

  // Biens publiés dans les 7 derniers jours (anti-doublon)
  const { results: recent } = await db.prepare(
    "SELECT DISTINCT bien_id FROM editorial_calendar WHERE status='published' AND published_at >= ?"
  ).bind(now - 6 * 86400).all().catch(() => ({ results: [] }));
  const recentSet = new Set((recent || []).map(r => r.bien_id));

  const ALL_BIENS = ["schoelcher", "nogent", "amaryllis", "zandoli", "geko", "mabouya"];

  let repaired = 0;
  for (const entry of entries) {
    const draft = await db.prepare("SELECT * FROM agent_drafts WHERE id=?").bind(entry.draft_id).first();
    if (!draft) continue;

    let reviews = {};
    try { reviews = JSON.parse(draft.reviews || "{}"); } catch {}

    const gate = reviews.gate || {};
    if (gate.decision !== "escalated") continue; // déjà approuvé ou pas évalué

    const failTypes = new Set((gate.fails || []).map(f => f.filter));
    const improved = reviews.improved_blocks;

    if (failTypes.has("doublon")) {
      // Swap : choisir un bien non récent + non déjà planifié dans la fenêtre
      const { results: plannedInWindow } = await db.prepare(
        "SELECT DISTINCT bien_id FROM editorial_calendar WHERE scheduled_at BETWEEN ? AND ? AND id != ?"
      ).bind(now, horizon, entry.id).all().catch(() => ({ results: [] }));
      const plannedBiens = new Set((plannedInWindow || []).map(r => r.bien_id));
      const available = ALL_BIENS.filter(b => !recentSet.has(b) && !plannedBiens.has(b));

      if (!available.length) {
        console.log(`[editorial-repair] entry ${entry.id}: doublon, aucun bien disponible → skip`);
        continue;
      }
      const newBien = available[0];

      // Reset calendar entry + générer un nouveau draft pour le nouveau bien
      await db.prepare("UPDATE editorial_calendar SET bien_id=?, draft_id=NULL, status='planned', updated_at=? WHERE id=?")
        .bind(newBien, now, entry.id).run();

      const dt = new Date(entry.scheduled_at * 1000).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      const brief = `RÉPARATION DOUBLON — date=${dt}, bien=${newBien}, thème=logement, variante=charme tropical, format=post. Génère UN draft social_post pour ${newBien}. Insiste sur le prix direct (-15% vs Airbnb) et l'ambiance unique du bien.`;
      try {
        const rr = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agents: ["community-manager"], brief, calendar_id: entry.id }),
        });
        const rd = await rr.json();
        const drafted = (rd.results?.[0]?.drafts || 0) > 0;
        await db.prepare("UPDATE editorial_calendar SET status=?, updated_at=? WHERE id=?")
          .bind(drafted ? "drafted" : "failed", now, entry.id).run();
        console.log(`[editorial-repair] entry ${entry.id}: swap ${entry.bien_id}→${newBien} drafted=${drafted}`);
        if (drafted) {
          await fetch(`${siteUrl}/api/editorial-gate?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}&mode=live`, { method: "POST" })
            .catch(e => console.error("[editorial-repair] gate after swap:", e.message));
        }
        repaired++;
      } catch (err) { console.error(`[editorial-repair] swap error entry ${entry.id}:`, err.message); }

    } else if (improved && (failTypes.has("mots_interdits") || failTypes.has("score") || failTypes.has("verdict"))) {
      // Reconstruire caption depuis improved_blocks
      const caption = [improved.hook, improved.description, improved.benefice, improved.cta, improved.hashtags]
        .filter(Boolean).join("\n\n");

      let payload = {};
      try { payload = JSON.parse(draft.payload || "{}"); } catch {}
      payload.caption = caption;
      payload.text = caption;

      // Effacer la décision gate pour que le gate réévalue
      delete reviews.gate;

      // Approuver directement : le draft a déjà passé une revue LLM complète, les improved_blocks
      // représentent la meilleure version possible — re-passer le gate risque de boucler.
      await db.prepare("UPDATE agent_drafts SET payload=?, reviews=?, status='approved', updated_at=? WHERE id=?")
        .bind(JSON.stringify(payload), JSON.stringify(reviews), now, draft.id).run();
      await db.prepare("UPDATE editorial_calendar SET status='approved', updated_at=? WHERE id=?")
        .bind(now, entry.id).run();

      console.log(`[editorial-repair] entry ${entry.id} (${entry.bien_id}): improved_blocks appliqués → approved`);
      repaired++;
    }
  }
  console.log(`[editorial-repair] ${repaired} draft(s) réparé(s)`);

  // Archiver les entrées 'drafted' en retard de >3j (contenu périmé, gate ne les approuvera pas)
  const staleTs = now - 3 * 86400;
  const { meta: archiveMeta } = await db.prepare(
    "UPDATE editorial_calendar SET status='archived', updated_at=? WHERE status='drafted' AND scheduled_at < ?"
  ).bind(now, staleTs).run().catch(() => ({ meta: { changes: 0 } }));
  if (archiveMeta?.changes > 0) console.log(`[editorial-repair] ${archiveMeta.changes} entrée(s) périmée(s) archivée(s)`);
}

// ── Editorial Calendar : publication auto des drafts approuvés (cron horaire)
async function runEditorialAutoPublish(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    // Cible : entrées dont status='approved' ET scheduled_at <= maintenant + 1h
    // Fenêtre 14j en arrière pour récupérer les posts bloqués (bug fenêtre 24h, fix 2026-06-18)
    const now    = Math.floor(Date.now() / 1000);
    const upTo   = now + 3600;
    const fromYMD = new Date((now - 90 * 86400) * 1000).toISOString().slice(0, 10);
    const toYMD   = new Date(upTo * 1000).toISOString().slice(0, 10);

    // Vérifier si un post a été publié dans les 2 dernières heures (rythme 1 post/2h)
    const recentR = await fetch(`${siteUrl}/api/editorial-calendar?from=${new Date((now - 7200) * 1000).toISOString().slice(0,10)}&to=${toYMD}&status=published`);
    const recentD = await recentR.json().catch(() => ({}));
    const lastPub = (recentD.entries || []).filter(e => e.published_at && e.published_at >= now - 7200);
    if (lastPub.length > 0) {
      console.log(`[editorial-publish] Post publié il y a <2h — skip (rythme 1/2h)`);
      return;
    }

    const r = await fetch(`${siteUrl}/api/editorial-calendar?from=${fromYMD}&to=${toYMD}&status=approved`);
    const d = await r.json();
    // 1 post par run max (rythme 1/2h garanti par le check ci-dessus)
    const dueEntries = (d.entries || [])
      .filter(e => e.scheduled_at <= upTo)
      .sort((a, b) => a.scheduled_at - b.scheduled_at)
      .slice(0, 1);
    if (dueEntries.length === 0) { console.log("[editorial-publish] Aucun draft à publier"); return; }

    console.log(`[editorial-publish] ${dueEntries.length} draft(s) à publier`);
    const ntfyTopic = env.NTFY_TOPIC || "amaryllis-alertes-7r4k9";
    for (const e of dueEntries) {
      if (!e.draft_id) {
        console.warn(`[editorial-publish] entry ${e.id} sans draft_id`);
        continue;
      }
      try {
        const pubRes = await fetch(`${siteUrl}/api/agent-drafts?id=${e.draft_id}&action=publish&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
          method: "PATCH",
        });
        const pubData = await pubRes.json();
        const newStatus = pubData.ok ? "published" : (pubData.retry ? "approved" : "failed");
        await fetch(`${siteUrl}/api/editorial-calendar?id=${e.id}&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, result: JSON.stringify(pubData) }),
        }).catch(() => {});
        console.log(`[editorial-publish] entry ${e.id} → ${newStatus}`);
        // Ntfy sur échec définitif (pas sur retry IG en cours)
        if (!pubData.ok && !pubData.retry) {
          await fetch(`https://ntfy.sh/${ntfyTopic}`, {
            method: "POST",
            headers: { "Content-Type": "text/plain", "Title": `❌ Post échoué — ${e.bien_id || "?"}`, "Priority": "high", "Tags": "x,rotating_light" },
            body: `Entry #${e.id} draft #${e.draft_id} → ${JSON.stringify(pubData.result?.error || pubData.error || "?").slice(0, 120)}`,
          }).catch(() => {});
        }
      } catch (err) {
        console.error(`[editorial-publish] erreur entry ${e.id}:`, err.message);
      }
    }
  } catch (e) {
    console.error("[editorial-publish] error:", e.message);
  }
}

// ── arch-018 : rappel rotation des tokens critiques (cadence mensuelle) ────────
// Appelé par le cron mensuel ; agit tous les mois (META_PAGE_TOKEN expire ~60j).
async function runTokenRotationReminder(env) {
  // Mensuel — pas de filtre sur le mois (ancienne cadence trimestrielle supprimée)
  const tokens = [
    "BEDS24_TOKEN (auto-refresh via /api/beds24-refresh — vérifier que le refresh tourne)",
    "STRIPE_SECRET_KEY (Dashboard Stripe → Développeurs → Clés API → Roll)",
    "RESEND_API_KEY (Resend → API Keys → régénérer)",
    "META_PAGE_TOKEN (Graph API → token longue durée Page, ~60j → à régénérer)",
    "GROQ_API_KEY (console Groq)",
    "ANTHROPIC_API_KEY (console Anthropic)",
    "APPS_SCRIPT_URL (rotation seulement si fuite suspectée)",
    "APIFY_TOKEN (console Apify)",
  ];
  const html = `<h2>🔐 Rotation trimestrielle des tokens (arch-018)</h2>
    <p>Rappel automatique tous les 90 jours. À vérifier / faire tourner :</p>
    <ul>${tokens.map((t) => `<li>${t}</li>`).join("")}</ul>
    <p>Après rotation, mettre à jour les secrets dans <strong>Cloudflare Pages → dashboard-amaryllis → Settings → Environment variables</strong> (et <code>wrangler secret put</code> pour le Worker).</p>
    <p style="color:#888;font-size:12px">⚠️ META_PAGE_TOKEN expire ~tous les 60 j — c'est le plus urgent.</p>`;
  try {
    await sendEmail(env, { subject: "🔐 Rotation des tokens — checklist trimestrielle", html });
    console.log("[token-rotation] rappel envoyé");
  } catch (e) {
    console.error("[token-rotation] erreur:", e.message);
  }
}

// ── Exports Cloudflare Worker ────────────────────────────────────────────────
// ── Ingestion RAG hebdomadaire (rafraîchit l'index vectoriel Vectorize) ──────
// C2 — Solde des devis payés en 2 fois : lien de solde à J-30, relances J-25/J-20,
// annulation auto J-15. (Logique dans /api/devis-solde-cron ; ici on le déclenche.)
async function runDevisSoldeCron(env) {
  const secret = env.POSTSTAY_SECRET || env.PRIX_RECAP_SECRET || "";
  if (!secret) { console.log("[devis-solde] secret absent — skip"); return; }
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    const r = await fetch(`${siteUrl}/api/devis-solde-cron?secret=${encodeURIComponent(secret)}`);
    const j = await r.json().catch(() => ({}));
    console.log(`[devis-solde] ${j.ok ? "OK" : "KO"} — scanned=${j.scanned ?? "?"} actions=${(j.actions || []).length}`);
  } catch (e) {
    console.error("[devis-solde] error:", e.message);
  }
}

async function runRagIngest(env) {
  try {
    if (!env.POSTSTAY_SECRET) { console.log("[rag] POSTSTAY_SECRET absent — skip"); return; }
    const siteUrl = env.SITE_URL || "https://villamaryllis.com";
    const r = await fetch(`${siteUrl}/api/rag-ingest?secret=${env.POSTSTAY_SECRET}`);
    const j = await r.json().catch(() => ({}));
    console.log("[rag] ingestion:", JSON.stringify(j).slice(0, 150));
  } catch (e) { console.error("[rag] ingestion échouée:", e.message); }
}

// Rafraîchit les 2 snapshots factuels (trafic SEO + signaux marché) en D1, PUIS
// ré-ingère le RAG dans la foulée — sinon le snapshot du jour reste frais en D1
// mais invisible du vecteur jusqu'au prochain lundi (runRagIngest n'est QUE
// hebdo). Demandé par Vincent le 2026-07-04 pour une fraîcheur quotidienne réelle.
async function runDocsRefresh(env) {
  try {
    if (!env.POSTSTAY_SECRET) { console.log("[docs-refresh] POSTSTAY_SECRET absent — skip"); return; }
    const siteUrl = env.SITE_URL || "https://villamaryllis.com";
    const r = await fetch(`${siteUrl}/api/docs-refresh?secret=${env.POSTSTAY_SECRET}`);
    const j = await r.json().catch(() => ({}));
    console.log(`[docs-refresh] generated=${JSON.stringify(j.generated ?? [])}`);
    await runRagIngest(env);
  } catch (e) { console.error("[docs-refresh] error:", e.message); }
}

// ── Auto-complétion résas OTA Airbnb depuis les mails (cron horaire) ─────────
// L'iCal Airbnb ne transmet ni nom ni prix. Un Zap (Outlook → onglet « Emails » du
// Sheet) y dépose les mails de confirmation ; cet appel parse ces mails et complète
// le voyageur + le payout net dans « Toutes les Réservations ». Écriture NON destructive
// et idempotente (ne remplit que les cases vides → ré-exécutable sans risque).
async function runEnrichFromEmails(env) {
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[enrich-emails] POSTSTAY_SECRET absent — skip"); return; }
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    const r = await fetch(`${siteUrl}/api/enrich-from-emails?secret=${encodeURIComponent(secret)}`);
    const j = await r.json().catch(() => ({}));
    console.log(`[enrich-emails] ${j.ok ? "OK" : "KO"} — mails=${j.airbnbMails ?? "?"} enrichis=${j.enrichis ?? 0} ignorés=${j.ignores ?? 0}`);
  } catch (e) {
    console.error("[enrich-emails] error:", e.message);
  }
}

// Évaluateur qualité auto (boucle A) : note les sorties d'agents du jour (llm_outputs)
// → llm_evals, et renvoie une consigne corrective aux agents faibles (agent_memory).
// Appelé APRÈS agents-run pour noter les sorties fraîches du run.
async function runAgentsEval(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[agents-eval] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const r = await fetch(`${siteUrl}/api/agents-eval?secret=${encodeURIComponent(secret)}&limit=30`);
    const j = await r.json().catch(() => ({}));
    console.log(`[agents-eval] ✓ ${j.scored ?? 0}/${j.candidats ?? 0} notés · ${j.feedback ?? 0} corrections renvoyées`);
  } catch (e) { console.error("[agents-eval] error:", e.message); }
}

// Agent-mémoire (B2) : distille evals 7j + impacts mesurés + signaux en apprentissages
// durables (agent_memory '_shared/learning:N') injectés dans tous les agents. Hebdo.
async function runMemoryDistill(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[memory-distill] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const r = await fetch(`${siteUrl}/api/memory-distill?secret=${encodeURIComponent(secret)}`);
    const j = await r.json().catch(() => ({}));
    console.log(`[memory-distill] ${j.ok ? "✓" : "✗"} ${j.written ?? 0} apprentissages distillés${j.note ? " — " + j.note : ""}`);
  } catch (e) { console.error("[memory-distill] error:", e.message); }
}

async function runAgentsExecuteAndDigest(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  if (!env.POSTSTAY_SECRET) { console.log("[agents] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const e = await fetch(`${siteUrl}/api/agents-execute?secret=${env.POSTSTAY_SECRET}`);
    console.log("[agents-execute]", JSON.stringify(await e.json().catch(() => ({}))).slice(0, 150));
  } catch (err) { console.error("[agents-execute] échec:", err.message); }
  try {
    const g = await fetch(`${siteUrl}/api/agents-digest?secret=${env.POSTSTAY_SECRET}`);
    console.log("[agents-digest]", JSON.stringify(await g.json().catch(() => ({}))).slice(0, 150));
  } catch (err) { console.error("[agents-digest] échec:", err.message); }
}

// Refresh mensuel des avis voyageurs Airbnb : déclenche le scrape Apify (tous les
// biens actifs) puis stocke en D1. Idempotent (ON CONFLICT DO NOTHING côté endpoint).
async function runReviewRefresh(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[reviews] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const ingest = await fetch(`${siteUrl}/api/voyageur-feedback?action=ingest&secret=${encodeURIComponent(secret)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ maxReviews: 50 }),
    });
    const ij = await ingest.json().catch(() => ({}));
    if (!ij.runId) { console.log("[reviews] ingest sans runId:", JSON.stringify(ij).slice(0, 200)); return; }
    console.log("[reviews] run démarré:", ij.runId);
    // Poll collect jusqu'à SUCCEEDED (~96s max ; le run prend ~1 min).
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 12000));
      const col = await fetch(`${siteUrl}/api/voyageur-feedback?action=collect&runId=${ij.runId}&secret=${encodeURIComponent(secret)}`);
      const cj = await col.json().catch(() => ({}));
      if (cj.ok && typeof cj.stored === "number") {
        console.log(`[reviews] ✓ ${cj.stored} avis stockés (fetched ${cj.fetched})`);
        await runReviewDrafts(env);
        return;
      }
      if (cj.status === "FAILED") { console.log("[reviews] run FAILED"); return; }
    }
    console.log(`[reviews] run pas encore terminé — collect manuel possible (runId ${ij.runId})`);
  } catch (e) { console.error("[reviews] erreur:", e.message); }
}

// Génère les brouillons de réponse (classification auto/escalade + LLM) sur les avis
// fraîchement ingérés par runReviewRefresh — sans ça, action=draft ne tournait qu'au
// déclenchement manuel (jamais rebranché depuis sa création le 2026-07-04), et le
// garde-fou d'alerte sur les avis "escalade" (notifyEscalatedReviews) ne servait à rien.
async function runReviewDrafts(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[reviews-draft] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const r = await fetch(`${siteUrl}/api/voyageur-feedback?action=draft&secret=${encodeURIComponent(secret)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    const j = await r.json().catch(() => ({}));
    console.log(`[reviews-draft] générés=${j.generated ?? "?"} échoués=${j.failed ?? "?"} escaladés=${j.escalated ?? "?"}`);
  } catch (e) { console.error("[reviews-draft] erreur:", e.message); }
}

// Santé du token Meta (META_PAGE_TOKEN, expire ~60j). Alerte email si invalide ou
// expiration < 7j — comble le trou entre les rappels trimestriels.
async function runTokenHealthCheck(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const alerts = [];

  // 1. META_PAGE_TOKEN (expire ~60j — le plus critique)
  try {
    const r = await fetch(`${siteUrl}/api/social?action=status`);
    const j = await r.json().catch(() => ({}));
    const valid = j?.token?.isValid;
    const expiresIn = j?.token?.expiresIn;
    const soon = typeof expiresIn === "number" && expiresIn > 0 && expiresIn < 7 * 86400;
    if (valid === false) alerts.push({ key: "META_PAGE_TOKEN", msg: "INVALIDE — Facebook/Instagram ne publient plus", runbook: "Graph API Explorer → token Page longue durée → mettre à jour Cloudflare Pages + Worker" });
    else if (soon) alerts.push({ key: "META_PAGE_TOKEN", msg: `expire dans ~${Math.round((expiresIn || 0) / 86400)} jours`, runbook: "Graph API Explorer → token Page longue durée → mettre à jour Cloudflare Pages + Worker" });
  } catch (e) { console.error("[token-health] Meta check error:", e.message); }

  // 2. APIFY_TOKEN — scraping concurrents
  if (env.APIFY_TOKEN) {
    try {
      const r = await fetch("https://api.apify.com/v2/users/me", {
        headers: { Authorization: `Bearer ${env.APIFY_TOKEN}` },
      });
      if (r.status === 401 || r.status === 403) alerts.push({ key: "APIFY_TOKEN", msg: "invalide (401/403) — scraping concurrents cassé", runbook: "Console Apify → API & Integrations → regénérer le token" });
    } catch (e) { console.error("[token-health] Apify check error:", e.message); }
  }

  // 3. OPENWEATHER_API_KEY — météo admin
  if (env.OPENWEATHER_API_KEY) {
    try {
      const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Martinique,MQ&appid=${env.OPENWEATHER_API_KEY}`);
      if (r.status === 401) alerts.push({ key: "OPENWEATHER_API_KEY", msg: "invalide (401) — widget météo cassé", runbook: "openweathermap.org → My API Keys → regénérer" });
    } catch (e) { console.error("[token-health] OpenWeather check error:", e.message); }
  }

  if (alerts.length === 0) {
    console.log("[token-health] OK — Meta + Apify + OpenWeather valides");
    return;
  }

  const lines = alerts.map(a => `<li><strong>${a.key}</strong> : ${a.msg}<br><small>👉 ${a.runbook}</small></li>`).join("");
  const ntfyLines = alerts.map(a => `• ${a.key} : ${a.msg}`).join("\n");

  await Promise.allSettled([
    sendEmail(env, {
      to: env.NOTIFICATION_EMAIL || "contact@villamaryllis.com",
      subject: `🔐 Token(s) critique(s) — ${alerts.length} alerte(s) détectées`,
      html: `<h2>🔐 Alerte token(s) — runTokenHealthCheck</h2><ul>${lines}</ul><p style="color:#888;font-size:12px">Voir <code>docs/runbook-rotation-tokens.md</code> pour le détail complet.</p>`,
    }),
    env.NTFY_TOPIC ? fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
      method: "POST",
      headers: { Title: "🔐 Token(s) critique(s) à renouveler", Priority: "urgent", Tags: "key" },
      body: ntfyLines,
    }).catch(() => {}) : Promise.resolve(),
  ]);
  console.log(`[token-health] ${alerts.length} alerte(s) envoyées : ${alerts.map(a => a.key).join(", ")}`);
}

// Rapport SEO hebdomadaire (Search Console) → email. Suit les impressions
// commerciales vs marque + pages actives, pour mesurer la montée en référencement.
async function runSeoReport(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) return;
  try {
    const r = await fetch(`${siteUrl}/api/seo-report?secret=${encodeURIComponent(secret)}`);
    const d = await r.json().catch(() => ({}));
    if (!d.ok) { console.log("[seo-report] indisponible:", JSON.stringify(d).slice(0, 200)); return; }
    const org = d.organique || {};
    const delta = org.deltaPct;
    const arrow = delta == null ? "" : delta > 0 ? `▲ +${delta}%` : delta < 0 ? `▼ ${delta}%` : "= 0%";
    const rows = (d.topPagesOrganique || []).map(p =>
      `<tr${p.commercial ? ' style="background:#eef7ee"' : ''}><td style="padding:3px 8px">${p.page}${p.commercial ? " 💰" : ""}</td><td style="padding:3px 8px;text-align:right">${p.sessions}</td></tr>`).join("");
    await sendEmail(env, {
      to: env.NOTIFICATION_EMAIL || "contact@villamaryllis.com",
      subject: `📈 SEO hebdo — ${org.sessions || 0} sessions organiques ${arrow}`,
      html: `<div style="font-family:system-ui,sans-serif;color:#2c2c2c">
        <h2 style="color:#0e3b3a">Suivi SEO hebdomadaire (trafic organique Google)</h2>
        <ul>
          <li><b>Sessions organiques</b> (7 derniers jours) : ${org.sessions || 0} ${arrow} <span style="color:#888">(vs ${org.sessionsPrec || 0} la semaine d'avant)</span></li>
          <li><b>Sessions organiques sur les landing commerciales</b> (28 j) : ${d.pagesCommercialesOrganique28j || 0} <span style="color:#888">— l'indicateur clé, doit décoller</span></li>
        </ul>
        <h3 style="color:#0e3b3a">Top pages d'atterrissage organiques (28 j)</h3>
        <p style="color:#888;font-size:12px;margin:0 0 8px">💰 = landing commerciale (objectif : les voir monter)</p>
        <table style="border-collapse:collapse;font-size:13px"><tr style="background:#f5efe0"><th style="padding:3px 8px;text-align:left">Page</th><th style="padding:3px 8px">Sessions</th></tr>${rows}</table>
        <p style="color:#888;font-size:12px;margin-top:16px">Source : GA4 (trafic réel). Objectif : voir le trafic organique grimper, surtout sur les pages 💰.</p>
      </div>`,
    });
    console.log(`[seo-report] ✓ envoyé (${org.sessions} sessions org, ${d.pagesCommercialesOrganique28j} commercial 28j)`);
  } catch (e) { console.error("[seo-report] erreur:", e.message); }
}

// 🐞 Triage hebdo des bugs — classe les bugs captés en prod, pousse au backlog, digest.
async function runBugTriage(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[bug-triage] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const r = await fetch(`${siteUrl}/api/bug-triage?secret=${encodeURIComponent(secret)}`);
    const d = await r.json().catch(() => ({}));
    if (!d.ok) { console.log("[bug-triage] indisponible:", JSON.stringify(d).slice(0, 200)); return; }
    console.log(`[bug-triage] ✓ ${d.analyzed || 0} analysés, ${d.created || 0} backlog, ${d.ignored || 0} ignorés`);
    // Pas de bruit si rien de neuf
    if (!d.analyzed) return;
    const summaryHtml = (d.summary || "").replace(/\n/g, "<br>");
    const crit = /CRITIQUE/.test(d.summary || "");
    await sendEmail(env, {
      to: env.NOTIFICATION_EMAIL || "contact@villamaryllis.com",
      subject: `🐞 Bugs hebdo — ${d.created || 0} au backlog${crit ? " ⚠️ CRITIQUE" : ""}`,
      html: `<div style="font-family:system-ui,sans-serif;color:#2c2c2c">
        <h2 style="color:#0e3b3a">Triage automatique des bugs (semaine)</h2>
        <p style="font-size:14px;white-space:pre-line">${summaryHtml}</p>
        <p style="color:#888;font-size:12px;margin-top:16px">Détail + captures dans l'admin → onglet 🐞 Bugs. Les bugs ont été classés et poussés au backlog par l'agent QA.</p>
      </div>`,
    });
    // Alerte poussée immédiate si un bug critique a été détecté
    if (crit) await sendWhatsApp(env, `🐞⚠️ Bug CRITIQUE détecté en prod cette semaine.\n${(d.summary || "").slice(0, 300)}\n→ admin / onglet Bugs`);
  } catch (e) { console.error("[bug-triage] erreur:", e.message); }
}

// 🧹 Triage hebdo du backlog des agents IA — bloque les items hors-sol détectables
// automatiquement (outil banni / fait bien contredit / doublon), voir agents-triage.js.
// Ne remplace PAS une revue humaine avec accès au repo (ne détecte jamais "déjà codé").
async function runAgentsTriage(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[agents-triage] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const r = await fetch(`${siteUrl}/api/agents-triage?secret=${encodeURIComponent(secret)}`);
    const d = await r.json().catch(() => ({}));
    if (!d.ok) { console.log("[agents-triage] indisponible:", JSON.stringify(d).slice(0, 200)); return; }
    console.log(`[agents-triage] ✓ ${d.analyzed || 0} analysés, ${d.blocked || 0} bloqués`);
    if (!d.blocked) return; // pas de bruit si rien à signaler
    const summaryHtml = (d.summary || "").replace(/\n/g, "<br>");
    await sendEmail(env, {
      to: env.NOTIFICATION_EMAIL || "contact@villamaryllis.com",
      subject: `🧹 Triage backlog agents — ${d.blocked} item${d.blocked > 1 ? "s" : ""} bloqué${d.blocked > 1 ? "s" : ""}`,
      html: `<div style="font-family:system-ui,sans-serif;color:#2c2c2c">
        <h2 style="color:#0e3b3a">Triage automatique du backlog agents (semaine)</h2>
        <p style="font-size:14px;white-space:pre-line">${summaryHtml}</p>
        <p style="color:#888;font-size:12px;margin-top:16px">Détecte outils bannis (agent_lessons), faits biens contredits, doublons — jamais "déjà codé" (nécessite une revue avec accès au repo). Détail dans l'admin → onglet Agents.</p>
      </div>`,
    });
  } catch (e) { console.error("[agents-triage] erreur:", e.message); }
}

// ── Newsletter : séquence J+7 (offre abonné) ─────────────────────────────────
async function runNewsletterSequence(env) {
  const db = env.revenue_manager;
  if (!db) return;
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) return;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let rows;
  try {
    const res = await db.prepare(`
      SELECT id, email, first_name, unsub_token
      FROM newsletter_subscribers
      WHERE confirmed_at IS NOT NULL
        AND unsubscribed_at IS NULL
        AND sequence_step = 0
        AND confirmed_at <= ?
      LIMIT 50
    `).bind(sevenDaysAgo).all();
    rows = res.results || [];
  } catch (e) {
    console.error("[newsletter-seq] DB error:", e?.message); return;
  }
  if (!rows.length) return;

  let sent = 0;
  for (const row of rows) {
    try {
      const unsubUrl = `${siteUrl}/api/newsletter-unsubscribe?token=${row.unsub_token}`;
      const prenom = row.first_name || "Voyageur";

      const tplRes = await fetch(`${siteUrl}/email-templates/newsletter-offer?cb=${Date.now()}`, {
        cache: "no-store", cf: { cacheTtl: 0, cacheEverything: false },
      });
      const raw = tplRes.ok ? await tplRes.text() : null;
      const html = raw
        ? raw.replace(/\{\{(\w+)\}\}/g, (_, k) => ({ prenom, unsub_url: unsubUrl })[k] ?? "")
        : `<p>Bonjour ${prenom},<br>Réservez en direct sur <a href="${siteUrl}">${siteUrl}</a> et mentionnez le code DIRECT10.</p><p><a href="${unsubUrl}">Se désabonner</a></p>`;

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Amaryllis Locations <contact@villamaryllis.com>",
          to: [row.email],
          subject: `Votre avantage abonné — réservez en direct, ${prenom}`,
          html,
        }),
      });
      if (r.ok) {
        await db.prepare(
          "UPDATE newsletter_subscribers SET sequence_step=1, sequence_sent_at=? WHERE id=?"
        ).bind(Date.now(), row.id).run();
        sent++;
      } else {
        console.error("[newsletter-seq] Resend error:", await r.text());
      }
    } catch (e) {
      console.error("[newsletter-seq] row error:", e?.message);
    }
  }
  if (sent > 0) console.log(`[newsletter-seq] ✓ ${sent} offres J+7 envoyées`);
}

// ── Réunion Générale Cross-Fleet (cron lundi 11h UTC = 7h Martinique) ────────
async function runReunioneGenerale(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const today = new Date();
  const dateTag = today.toISOString().slice(0, 10).replace(/-/g, "");
  const nowTs = Math.floor(Date.now() / 1000);

  // Chaque étape D1 ci-dessous est déjà entourée d'un try/catch qui ne fait que console.error
  // (pas de wrangler tail/Logpush en place → invisible en prod). Incident du 2026-07-06 : l'écriture
  // mémoire (étape 6) a échoué silencieusement, découvert 2 jours après en creusant manuellement.
  // Cette alerte rend tout échec futur visible immédiatement au lieu de dépendre d'une investigation.
  const alertReunionFailure = async (step, errMsg) => {
    try {
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC || "amaryllis-alertes-7r4k9"}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Title": "⚠️ Réunion Générale — échec silencieux",
          "Priority": "high",
          "Tags": "warning,office",
        },
        body: `Étape "${step}" a échoué : ${errMsg}\nLa réunion continue en dégradé, mais l'accountability de la semaine prochaine sera faussée si ce n'est pas corrigé.`,
      }).catch(() => {});
    } catch { /* noop */ }
  };

  // 1. ACCOUNTABILITY — statut ACTUEL des items référencés par la réunion N-1 (pas des
  //    doublons "reunion" — cf. rg-memory-last.notes.actions, la liste d'ids d'origine)
  let execRate = null;
  let openActions = [];
  try {
    const memRow = await env.revenue_manager
      .prepare("SELECT notes FROM agent_actions WHERE id='rg-memory-last'").first();
    var lastMem = memRow?.notes ? JSON.parse(memRow.notes) : {};
    const prevIds = Array.isArray(lastMem.actions) ? lastMem.actions : [];
    if (prevIds.length) {
      const placeholders = prevIds.map(() => "?").join(",");
      const { results: prev } = await env.revenue_manager
        .prepare(`SELECT action, status FROM agent_actions WHERE id IN (${placeholders})`)
        .bind(...prevIds).all();
      if (prev.length) {
        const fait = prev.filter(a => a.status === "fait").length;
        execRate = Math.round(fait / prev.length * 100);
        openActions = prev.filter(a => a.status !== "fait").map(a => a.action.slice(0, 80));
      }
    }
  } catch (e) {
    console.error("[reunion] accountability:", e.message);
    await alertReunionFailure("accountability (lecture N-1)", e.message);
    var lastMem = {};
  }

  // 2. LOCATIF — backlog critique/haute depuis D1 (id inclus — jamais dupliqué en étape 5,
  //    seulement référencé, pour ne pas créer un 2ᵉ item pour un bug/reco déjà tracké ailleurs)
  let alerts = [], watches = [];
  try {
    const { results } = await env.revenue_manager
      .prepare(`SELECT id, agent, agent_label, agent_emoji, action, priority
                FROM agent_actions
                WHERE status='backlog' AND category != 'reunion'
                ORDER BY CASE priority WHEN 'critique' THEN 1 WHEN 'haute' THEN 2 ELSE 3 END
                LIMIT 30`)
      .all();
    alerts  = results.filter(a => a.priority === "critique");
    watches = results.filter(a => a.priority === "haute").slice(0, 8);
  } catch (e) {
    console.error("[reunion] locatif D1:", e.message);
    await alertReunionFailure("backlog locatif", e.message);
  }

  // 3. PATRIMOINE — fleet HTTP (si FLEET_SECRET configuré)
  let patrimoineText = "(FLEET_SECRET absent — configurer via: wrangler secret put FLEET_SECRET --name amaryllis-ical-sync)";
  if (env.FLEET_SECRET) {
    try {
      const pRes = await fetch("https://patrimoine-dashboard.pages.dev/api/patrimoine-agents-run", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.FLEET_SECRET}`, "Content-Type": "application/json" },
        body: JSON.stringify({ which: "all" }),
      });
      const pData = await pRes.json().catch(() => ({}));
      const pAlerts = (pData.results || []).filter(r => r.signal === "alert").map(r => `• ${r.id}: ${String(r.message).slice(0, 100)}`);
      const pWatch  = (pData.results || []).filter(r => r.signal === "watch").map(r => `• ${r.id}: ${String(r.message).slice(0, 100)}`);
      patrimoineText = `Alertes: ${pAlerts.join("\n") || "aucune"}\nWatch: ${pWatch.join("\n") || "aucun"}`;
    } catch (e) {
      patrimoineText = `Erreur patrimoine: ${e.message}`;
    }
  }

  // 4. LLM SYNTHESIS via /api/ai-summary
  const prompt = `Rédige un compte-rendu de Réunion Générale cross-fleet Amaryllis pour le ${today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.

ACCOUNTABILITY N-1: taux ${execRate !== null ? execRate + "%" : "première réunion"} | non faites: ${openActions.slice(0, 2).join(" / ") || "aucune"}

LOCATIF — ${alerts.length} alertes critiques:
${alerts.slice(0, 4).map(a => `🔴 ${a.agent_emoji}${a.agent_label} — ${a.action.slice(0, 100)}`).join("\n") || "Aucune"}

LOCATIF — ${watches.length} points d'attention:
${watches.slice(0, 4).map(a => `🟡 ${a.agent_emoji}${a.agent_label} — ${a.action.slice(0, 100)}`).join("\n") || "Aucun"}

PATRIMOINE:
${patrimoineText.slice(0, 400)}

Delta signals vs semaine passée: alertes ${alerts.length} (était ${lastMem.alerts ?? "?"}) | watch ${watches.length} (était ${lastMem.watch ?? "?"})

Format de réponse (français, concis, max 400 mots):
📊 ACCOUNTABILITY — 1 ligne
🔴 ALERTES — 3 max, avec l'agent responsable
🟡 WATCH — 3 max
⚡ SYNERGIE — 1 connexion locatif×patrimoine pertinente (réelle, pas inventée)
📋 TOP 3 ACTIONS SEMAINE — agent · action courte · priorité`;

  let synthesis = "Synthèse indisponible";
  try {
    const aiRes = await fetch(`${siteUrl}/api/ai-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, maxTokens: 700 }),
    });
    const aiData = await aiRes.json().catch(() => ({}));
    synthesis = aiData.result || aiData.summary || synthesis;
  } catch (e) {
    console.error("[reunion] LLM:", e.message);
  }

  // 5. TOP 3 ACTIONS DE LA SEMAINE — référencées par leur id d'origine, jamais dupliquées
  //    en D1 (le doublon "category=reunion" créait un 2ᵉ item indépendant pour chaque bug/reco
  //    déjà tracké ailleurs — divergence de statut constatée le 2026-07-06, cf. BLOCKERS).
  const top3 = [...alerts.slice(0, 2), ...watches.slice(0, 1)];

  // 6. MÉMOIRE (rg-memory-last) — ids ORIGINAUX (pas de nouveaux ids synthétiques) pour que
  //    l'accountability de la prochaine réunion vérifie le statut réel de CES items.
  const memJson = JSON.stringify({ date: dateTag, ts: nowTs, alerts: alerts.length, watch: watches.length, exec_rate: execRate, actions: top3.map(a => a.id) });
  try {
    await env.revenue_manager.prepare(`
      INSERT INTO agent_actions (id, agent, agent_label, agent_emoji, category, action, priority, effort, status, notes, created_at, updated_at)
      VALUES ('rg-memory-last','reunion-generale','Réunion Générale','🏛️','reunion',?,'basse','auto','backlog',?,?,?)
      ON CONFLICT(id) DO UPDATE SET action=excluded.action, notes=excluded.notes, updated_at=excluded.updated_at
    `).bind(`Mémoire réunion ${dateTag}`, memJson, nowTs, nowTs).run();
  } catch (e) {
    console.error("[reunion] mémoire:", e.message);
    await alertReunionFailure("écriture mémoire (rg-memory-last)", e.message);
  }

  // 7. PUSH NTFY
  const ntfyTitle = `🏛️ Réunion Générale ${today.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}`;
  const ntfyBody  = `📊 Exec N-1: ${execRate !== null ? execRate + "%" : "1ère"} | 🔴${alerts.length} | 🟡${watches.length}\n\n${synthesis.slice(0, 800)}`;
  try {
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC || "amaryllis-alertes-7r4k9"}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Title": ntfyTitle,
        "Priority": alerts.length > 0 ? "high" : "default",
        "Tags": "office",
      },
      body: ntfyBody,
    }).catch(e => console.error("[reunion] ntfy:", e.message));
  } catch (e) {
    console.error("[reunion] ntfy outer:", e.message);
  }

  console.log(`[reunion] ✅ exec=${execRate}% alertes=${alerts.length} watch=${watches.length} top3=${top3.length} date=${dateTag}`);
}

// ── Batch QA (générique) ────────────────────────────────────────────────────
// agents : liste d'IDs à appeler · kvKey : clé KV de la dernière session
// label  : "hebdo" | "mensuel" (pour les logs/notif)
const QA_WEEKLY  = ["qa-tester", "webmaster", "data-analyst", "prompt-engineer", "crm-manager"];
const QA_MONTHLY = ["architecte-reseau", "seo-local", "developpeur-multimedia"];

async function runQABatch(env, agents, kvKey, label) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const now = Math.floor(Date.now() / 1000);
  const defaultWindow = label === "mensuel" ? 30 * 86400 : 7 * 86400;

  // 1. Dernière session depuis KV
  let lastSession = { ts: now - defaultWindow };
  try {
    const raw = await env.ICAL_STORE.get(kvKey, { type: "json" });
    if (raw?.ts) lastSession = raw;
  } catch { /* première session */ }

  const sinceLast = lastSession.ts;
  const db = env.revenue_manager;

  // 2. Delta agent_actions
  let newActions = 0, resolvedActions = 0;
  try {
    const [nr, dr] = await Promise.all([
      db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE created_at > ? AND status NOT IN ('done','ignored')").bind(sinceLast).first(),
      db.prepare("SELECT COUNT(*) n FROM agent_actions WHERE updated_at > ? AND status IN ('done','ignored')").bind(sinceLast).first(),
    ]);
    newActions = nr?.n ?? 0;
    resolvedActions = dr?.n ?? 0;
  } catch { /* D1 indisponible */ }

  const dateStr = new Date(now * 1000).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const lastDateStr = new Date(sinceLast * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const freq = label === "mensuel" ? "mensuel" : "hebdomadaire";

  const brief = `SESSION QA ${freq.toUpperCase()} — ${dateStr}
Site : https://villamaryllis.com — 7 biens (Amaryllis, Zandoli, Géko, Mabouya, Schœlcher, Nogent, Iguana-bail)
Dernière QA : ${lastDateStr} | Delta : +${newActions} actions créées, ${resolvedActions} résolues depuis.

MISSION selon TON domaine spécifique :
— Tester les flux critiques, détecter les régressions vs la dernière session.
— Vérifier les endpoints, formulaires, emails, calendriers, paiements.
— Identifier les anomalies silencieuses (rien ne crash mais quelque chose dérive).

SORTIE ATTENDUE : liste de findings (titre · sévérité critique/moyen/faible · action concrète).
Ne rapporter QUE ce qui est cassé, dégradé ou à risque. Pas de "tout va bien" sans vérif.`;

  let okCount = 0;
  try {
    const res = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agents, brief, source: `qa_${label}` }),
    });
    const data = await res.json().catch(() => ({}));
    okCount = data.ok_count ?? 0;
    console.log(`[qa-${label}] ✓ ${okCount}/${agents.length} agents · +${newActions} delta`);
  } catch (e) {
    console.error(`[qa-${label}] Erreur agents-run:`, e.message);
    return;
  }

  const topic = env.NTFY_TOPIC;
  if (topic) {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: { Title: `🔍 QA ${freq} Amaryllis`, Priority: "default", Tags: "mag,white_check_mark" },
      body: `${dateStr}\n+${newActions} actions · ${resolvedActions} résolues depuis ${lastDateStr}\n${okCount}/${agents.length} agents OK → Admin > Agents`,
    }).catch(() => {});
  }

  await env.ICAL_STORE.put(kvKey, JSON.stringify({
    ts: now, agents, new_actions: newActions, resolved: resolvedActions,
    summary: `${okCount}/${agents.length} agents · +${newActions} delta`,
  })).catch(() => {});
}

// ── Accountability hebdo (dimanche 20h UTC = 16h Martinique) ──────────────────
// Calcule taux d'exécution des actions de la semaine, envoie résumé ntfy.
// Prépare la réunion générale du lundi.
async function runAccountability(env) {
  try {
    const db = env.revenue_manager;
    const ntfyTopic = env.NTFY_TOPIC;
    if (!db || !ntfyTopic) { console.log('[accountability] SKIP — D1 ou NTFY_TOPIC absent'); return; }
    const weekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
    const rows = await db.prepare(
      `SELECT COUNT(*) as total,
       SUM(CASE WHEN status='fait' THEN 1 ELSE 0 END) as fait,
       SUM(CASE WHEN status!='fait' AND priority='critique' THEN 1 ELSE 0 END) as critique_open,
       SUM(CASE WHEN status!='fait' AND priority='haute' THEN 1 ELSE 0 END) as haute_open
       FROM agent_actions WHERE created_at > ?`
    ).bind(weekAgo).first().catch(() => null);
    const total = rows?.total ?? 0;
    const fait = rows?.fait ?? 0;
    const critique_open = rows?.critique_open ?? 0;
    const haute_open = rows?.haute_open ?? 0;
    const pct = total > 0 ? Math.round(fait / total * 100) : 0;
    // Patrimoine — lecture fleet
    let patrimoineLines = '';
    try {
      if (env.FLEET_SECRET) {
        const pRes = await fetch('https://patrimoine-dashboard.pages.dev/api/patrimoine-agents-run?read=1', {
          headers: { Authorization: `Bearer ${env.FLEET_SECRET}` },
        });
        const pData = await pRes.json().catch(() => ({}));
        const pFleet = Object.values(pData.fleet || {});
        const pCrit = pFleet.filter(a => (a.actions || []).some(x => x.priority === 'critique')).length;
        patrimoineLines = `\n📊 Patrimoine: ${pFleet.length} agents · 🔴 ${pCrit} critique(s)`;
      }
    } catch { }
    // Outcomes : actions clôturées cette semaine sans note d'impact (boucle feedback)
    let outcomeLines = '';
    try {
      const outcomes = await db.prepare(
        `SELECT aa.action, ao.user_note FROM agent_actions aa
         JOIN action_outcomes ao ON ao.action_id = aa.id
         WHERE ao.completed_at > ? AND ao.impact_label IS NULL
         LIMIT 5`
      ).bind(weekAgo).all().catch(() => ({ results: [] }));
      const noNote = (outcomes?.results || []).filter(o => !o.user_note);
      if (noNote.length > 0) {
        outcomeLines = `\n📝 ${noNote.length} action(s) sans note d'impact — annoter dans le dashboard pour que les agents apprennent`;
      }
    } catch { }
    const title = `📊 Accountability sem. — ${fait}/${total} (${pct}%) · 🔴 ${critique_open} critique(s)`;
    const lines = [
      `🏠 Locatif (7j) : ${fait}/${total} réalisées (${pct}%)`,
      critique_open > 0 ? `  🔴 ${critique_open} critique(s) non résolue(s)` : `  ✅ 0 critique en attente`,
      haute_open > 0 ? `  🟡 ${haute_open} haute(s) en attente` : '',
      outcomeLines,
      patrimoineLines,
      '',
      `→ Réunion générale lundi 10h Martinique`,
    ].filter(s => s !== '').join('\n');
    await fetch(`https://ntfy.sh/${ntfyTopic}`, {
      method: 'POST',
      headers: {
        Title: title,
        Priority: String(critique_open > 0 ? 4 : 3),
        Tags: 'bar_chart,clipboard',
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: lines,
    });
    console.log(`[accountability] ✓ ${fait}/${total} (${pct}%) · critique_open=${critique_open}`);
  } catch (e) {
    console.error('[accountability] Cron error:', e.message);
  }
}

export default {
  async scheduled(event, env, ctx) {
    const cron = event.cron;

    if (cron === "0 11 * * 1") {
      // Lundi 11h UTC (7h Martinique) — Réunion Générale cross-fleet
      ctx.waitUntil(runReunioneGenerale(env));

    } else if (cron === "0 6 * * 1") {
      // Lundi 6h UTC — rapport hebdomadaire + rappel prix Airbnb
      const { allEvents } = await runSync(env);
      ctx.waitUntil((async () => {
      await Promise.all([
        runWeeklyReport(env, allEvents),
        runPrixRecap(env),
        runRagIngest(env), // #2 RAG — rafraîchit l'index vectoriel chaque lundi
        runAgentsExecuteAndDigest(env), // L4 — agents-execute (auto drafts) puis digest hebdo
        runTokenHealthCheck(env), // alerte si META_PAGE_TOKEN invalide/expire <7j
        runSeoReport(env), // 📈 rapport SEO hebdo (Search Console) par email
        runBugTriage(env), // 🐞 triage hebdo des bugs captés en prod → backlog + digest
        runAgentsTriage(env), // 🧹 triage hebdo backlog agents IA → bloque outils bannis/faits contredits/doublons
        runMemoryDistill(env), // 🧠 B2 — distille l'expérience du réseau en apprentissages durables
        runQABatch(env, QA_WEEKLY, "qa_session:weekly", "hebdo"), // 🔍 QA hebdo (flux, endpoints, tracking, emails, agents)
        runGuideWrite(env), // 📝 réécriture prose d'accueil guides D1 (welcome_message + tagline)
        (async () => {
          try {
            const siteUrl = env.SITE_URL || "https://villamaryllis.com";
            const res = await fetch(`${siteUrl}/api/rm-auto-update?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}&scan=1`);
            const data = await res.json().catch(() => ({}));
            const scanned = (data.scan || []).reduce((s, r) => s + (r.scanned ?? 0), 0);
            console.log(`[rm-auto-update lundi] ${(data.recalc || []).filter(r => r.ok).length}/${6} biens · ${scanned} concurrents scannés`);
          } catch (e) { console.error("[rm-auto-update lundi] Cron error:", e.message); }
        })(),
        // veille-005 : détecte les nouveaux listings apparus dans la zone (diff S vs S-1),
        // distinct du re-scan prix des concurrents déjà identifiés ci-dessus.
        (async () => {
          try {
            const siteUrl = env.SITE_URL || "https://villamaryllis.com";
            const res = await fetch(`${siteUrl}/api/veille-zone-scan?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
            const data = await res.json().catch(() => ({}));
            const zones = Object.entries(data.zones || {});
            const newTotal = zones.reduce((s, [, z]) => s + (z.newFound || 0), 0);
            console.log(`[veille-zone-scan] ${zones.map(([k, z]) => `${k}:${z.scanned ?? "?"}${z.isBaseline ? "(baseline)" : ""}`).join(" ")} · ${newTotal} nouveau(x) listing(s)`);
          } catch (e) { console.error("[veille-zone-scan] Cron error:", e.message); }
        })(),
        // Vague 4 — rapport business autonome (data-analyst, 100% lecture seule direct_bookings,
        // synthèse LLM → ntfy). Cadence hebdo (pas quotidien, évite le bruit notif).
        (async () => {
          try {
            const siteUrl = env.SITE_URL || "https://villamaryllis.com";
            const res = await fetch(`${siteUrl}/api/rapport-business?token=${encodeURIComponent(env.RAPPORT_TOKEN || "")}`);
            const data = await res.json().catch(() => ({}));
            console.log(`[rapport-business] ✓ notified=${data.notified ?? "?"} provider=${data.provider ?? "?"}`);
          } catch (e) { console.error("[rapport-business] Cron error:", e.message); }
        })(),
      ]);
      // veille-003 : rapport hebdo veille concurrentielle — SÉQUENCÉ après le Promise.all
      // ci-dessus (pas dedans) car il doit lire rm_market_signals APRÈS que rm-auto-update
      // ?scan=1 les ait recalculés et veille-zone-scan ait posé ses nouveaux signaux ; dans
      // le même Promise.all ces 3 appels seraient concurrents et le rapport risquerait de
      // lire des données de la semaine précédente.
      try {
        const siteUrl = env.SITE_URL || "https://villamaryllis.com";
        const res = await fetch(`${siteUrl}/api/send-veille-recap?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
        const data = await res.json().catch(() => ({}));
        console.log(`[send-veille-recap] ✓ sent=${data.ok ?? "?"} biens=${data.biens ?? "?"} signaux=${data.signaux ?? "?"}`);
      } catch (e) { console.error("[send-veille-recap] Cron error:", e.message); }
      })());

    } else if (cron === "0 1 1 * *") {
      // 1er du mois — export comptable + article SEO long-tail mensuel + mémoire saisonnière
      const { allEvents } = await runSync(env);
      ctx.waitUntil(Promise.all([
        runMonthlyExport(env, allEvents),
        runMonthlySeoArticle(env),
        runTokenRotationReminder(env), // arch-018 — mensuel (META_PAGE_TOKEN expire ~60j)
        runQABatch(env, QA_MONTHLY, "qa_session:monthly", "mensuel"), // 🔍 QA mensuel (sécu, SEO, perf médias)
        runReviewRefresh(env), // refresh mensuel des avis Airbnb (scrape + D1)
        (async () => {
          // Mémoire saisonnière : agrège rm_kpi_snapshots → seasonal_memory
          try {
            const siteUrl = env.SITE_URL || "https://villamaryllis.com";
            const res = await fetch(`${siteUrl}/api/seasonal-update?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
            const data = await res.json().catch(() => ({}));
            console.log(`[seasonal-update] ✓ total=${data.total ?? "?"} upserted=${data.upserted ?? "?"}`);
          } catch (e) {
            console.error("[seasonal-update] Cron error:", e.message);
          }
        })(),
        (async () => {
          // Rapport mensuel SLA Exploitation (maintenance + stock) — log-036. Calcule le
          // mois calendaire qui vient de se terminer (défaut de l'endpoint si ?month= absent).
          try {
            const siteUrl = env.SITE_URL || "https://villamaryllis.com";
            const res = await fetch(`${siteUrl}/api/ops-sla-report?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
            const data = await res.json().catch(() => ({}));
            console.log(`[ops-sla-report] ✓ mois=${data.month ?? "?"} email=${data.email?.ok ?? "?"} ntfy=${data.ntfy?.ok ?? "?"}`);
          } catch (e) {
            console.error("[ops-sla-report] Cron error:", e.message);
          }
        })(),
      ]));

    } else if (cron === "0 12 * * *") {
      // 12h UTC chaque jour (8h Martinique) — re-seed horizon 30j puis génération drafts éditoriaux J+2 + alerte ménage
      ctx.waitUntil((async () => {
        await runEditorialReseed(env);
        await runEditorialDraftGen(env);
        await runEditorialRepair(env);
        // ── Alerte ménage (8h Martinique) ──────────────────────────────────────────────────────────
        try {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          const mgRes = await fetch(`${siteUrl}/api/send-menage-alert?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const mgData = await mgRes.json().catch(() => ({}));
          console.log(`[send-menage-alert] sent=${mgData.sent ?? 0} skipped=${mgData.skipped ?? 0}`);
        } catch (e) {
          console.error("[send-menage-alert] Cron error:", e.message);
        }
      })());

    } else if (cron === "0 9 * * *") {
      // 9h UTC chaque jour — brief matinal + audit + rappels + alertes + gap pricing + agents autonomes
      const { allEvents, allAvailEvents } = await runSync(env);
      ctx.waitUntil((async () => {
        // ── Brief matinal locatif (5h Martinique) ─────────────────────────────────────────────────────
        try {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          const briefRes = await fetch(`${siteUrl}/api/morning-brief?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const briefData = await briefRes.json().catch(() => ({}));
          console.log(`[morning-brief] ✓ ntfy=${briefData.ntfyStatus ?? "?"} · ${briefData.title ?? ""}`);
        } catch (e) {
          console.error("[morning-brief] Cron error:", e.message);
        }
        // ── Sentinel KPI (anomalies données — push ntfy si signal détecté) ──────────────────────────
        try {
          const sentinelUrl = env.SITE_URL || "https://villamaryllis.com";
          const sentinelRes = await fetch(`${sentinelUrl}/api/kpi-sentinel?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const sentinelData = await sentinelRes.json().catch(() => ({}));
          console.log(`[kpi-sentinel] ✓ anomalies=${sentinelData.anomalies ?? 0} (🔴${sentinelData.reds ?? 0} 🟡${sentinelData.yellows ?? 0})`);
        } catch (e) {
          console.error("[kpi-sentinel] Cron error:", e.message);
        }
        // ── Refresh modèles LLM (AI-Ops) — en premier pour que les agents utilisent les meilleurs modèles ──
        try {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          const aiOpsRes = await fetch(`${siteUrl}/api/ai-ops?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const aiOpsData = await aiOpsRes.json().catch(() => ({}));
          console.log(`[ai-ops] ✓ ${aiOpsData.okCount ?? "?"}/${aiOpsData.total ?? "?"} providers OK · âge=${aiOpsData.age_h ?? "?"}h`);
        } catch (e) {
          console.error("[ai-ops] Cron error:", e.message);
        }
        // Chaque sous-tâche isolée dans son propre try/catch : sans ça, un throw sur l'une
        // d'elles fait sauter TOUTES les suivantes en silence — y compris runCautionAutoRelease
        // en fin de chaîne (les cautions ne se libèrent plus) (SEC audit Fable 5 2026-07-09).
        try { await runMonitor(env); } catch (e) { console.error("[monitor] Cron error:", e.message); }
        try { await runReminders(env, allEvents, allEvents); } catch (e) { console.error("[reminders] Cron error:", e.message); }
        try { await runArrivalsDigest(env, allEvents); } catch (e) { console.error("[arrivals-digest] Cron error:", e.message); } // RM-16 — récap arrivées de demain à l'hôte
        try { await runOccupancyAlerts(env, allAvailEvents); } catch (e) { console.error("[occupancy-alerts] Cron error:", e.message); }
        try { await runOccupancySnapshot(env, allAvailEvents); } catch (e) { console.error("[occupancy-snapshot] Cron error:", e.message); } // persiste l'occupation réelle → rm_kpi_snapshots
        try { await runGapPricing(env, allAvailEvents); } catch (e) { console.error("[gap-pricing] Cron error:", e.message); }
        try { await runYieldPricing(env, allAvailEvents); } catch (e) { console.error("[yield-pricing] Cron error:", e.message); }
        try { await runCautionAutoRelease(env); } catch (e) { console.error("[caution-auto-release] Cron error:", e.message); }
        // Caution DIFFÉRÉE (résas lointaines) : pose ~2 j avant l'arrivée, re-bloque avant chaque
        // expiration (couvre tout séjour), libère 3 j après le départ — off-session sur la carte
        // enregistrée. Les résas proches (≤3 j) gardent leur caution prise au paiement (inline).
        try {
          const siteCa = env.SITE_URL || "https://villamaryllis.com";
          const caRes = await fetch(`${siteCa}/api/caution-cron?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const caData = await caRes.json().catch(() => ({}));
          console.log(`[caution-cron] ✓ ${caData.total ?? "?"} suivie(s) · posées=${caData.placed ?? 0} re-posées=${caData.reauthed ?? 0} libérées=${caData.released ?? 0} échecs=${caData.failed ?? 0}`);
        } catch (e) {
          console.error("[caution-cron] Cron error:", e.message);
        }
        await runInventoryAlerts(env);
        // ── Emails voyageurs résas directes : J-3 (infos pratiques) + J+1 (vérif arrivée) + J-1 (codes d'accès + pré-départ) ──
        try {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          const sec = encodeURIComponent(env.POSTSTAY_SECRET || "");
          const [r3, rv, r1, rd] = await Promise.all([
            fetch(`${siteUrl}/api/send-prearrivee?secret=${sec}`).then(r => r.json()).catch(() => ({})),
            fetch(`${siteUrl}/api/send-verif-arrivee?secret=${sec}`).then(r => r.json()).catch(() => ({})),
            fetch(`${siteUrl}/api/send-j1-acces?secret=${sec}`).then(r => r.json()).catch(() => ({})),
            fetch(`${siteUrl}/api/send-pre-depart?secret=${sec}`).then(r => r.json()).catch(() => ({})),
          ]);
          console.log(`[prearrivee J-3]   sent=${r3.sent ?? 0} failed=${r3.failed ?? 0} target=${r3.target ?? "?"}`);
          console.log(`[verif-arrivee J+1] sent=${rv.sent ?? 0} failed=${rv.failed ?? 0} target=${rv.target ?? "?"}`);
          console.log(`[j1-acces J-1]     sent=${r1.sent ?? 0} failed=${r1.failed ?? 0} target=${r1.target ?? "?"}`);
          console.log(`[pre-depart J-1]   sent=${rd.sent ?? 0} failed=${rd.failed ?? 0} target=${rd.target ?? "?"}`);
        } catch (e) {
          console.error("[emails-voyageurs] Cron error:", e.message);
        }
        // ── Post-séjour (J+1/J+3 résas directes + Beds24 Nogent) ────────────────────────────────────
        try {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          const psRes = await fetch(`${siteUrl}/api/send-poststay?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const psData = await psRes.json().catch(() => ({}));
          console.log(`[send-poststay] sent=${psData.sent ?? 0} failed=${psData.failed ?? 0}`);
        } catch (e) {
          console.error("[send-poststay] Cron error:", e.message);
        }
        await runDevisSoldeCron(env); // C2 — solde devis 2 fois : lien J-30 + relances J-25/J-20 + annulation J-15
        // runEnrichFromEmails déplacé sur son propre cron horaire (0 * * * *, cf. ci-dessous) —
        // tournait ici seulement 1×/jour malgré le commentaire "cron horaire" d'origine (trouvé 2026-07-14).
        // pré-départ J-1 = géré uniquement par /api/send-pre-depart (voir Promise.all plus haut) —
        // doublon runPredepart()/send-predepart supprimé le 2026-07-04 (envoyait le même email 2×,
        // chaque fonction suivant sa propre colonne pre_depart_sent/predepart_sent).
        // ── Contrôle de cohérence des réservations (chantier 2 Robustesse) ──
        //    Détecte double-bookings / totaux aberrants / bien inconnu → inbox 🐞 Bugs + ntfy si critique.
        try {
          const siteCoh = env.SITE_URL || "https://villamaryllis.com";
          const cohRes = await fetch(`${siteCoh}/api/coherence-check?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const cohData = await cohRes.json().catch(() => ({}));
          console.log(`[coherence] ✓ ${cohData.checked ?? "?"} résas · ${cohData.findings ?? 0} anomalies (${cohData.critical ?? 0} critiques)`);
        } catch (e) {
          console.error("[coherence] Cron error:", e.message);
        }
        // ── Analyse autonome des 17 agents (GROQ_API_KEY requis dans les secrets CF Pages) ──
        if (env.GROQ_API_KEY) {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          let agentsData = {};
          let orchData   = {};

          try {
            console.log("[agents-run] Démarrage analyse autonome 17 agents...");
            const agentsRes = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agents: "all" }),
            });
            agentsData = await agentsRes.json().catch(() => ({}));
            console.log(`[agents-run] ✓ ${agentsData.ok_count || 0} OK / ${agentsData.error_count || 0} erreurs`);
          } catch (e) {
            console.error("[agents-run] Cron error:", e.message);
          }

          // ── Orchestrateur : synthèse cross-agents ──────────────────────────
          try {
            console.log("[orchestrateur] Démarrage orchestration...");
            const orchRes = await fetch(`${siteUrl}/api/orchestrator`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trigger: "cron-daily", event_data: { cron: "0 9 * * *" } }),
            });
            orchData = await orchRes.json().catch(() => ({}));
            console.log(`[orchestrateur] ✓ Run #${orchData.run?.id || "?"} — ${orchData.run?.summary?.slice(0, 80) || "ok"}`);
          } catch (e) {
            console.error("[orchestrateur] Cron error:", e.message);
          }

          // ── Évaluateur qualité auto (boucle A) — note les sorties du run + feedback aux agents ──
          await runAgentsEval(env);

          // ── Digest email quotidien ─────────────────────────────────────────
          if (env.RESEND_API_KEY && orchData.run) {
            try {
              const run       = orchData.run;
              const today     = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
              const okCount   = agentsData.ok_count    || 0;
              const errCount  = agentsData.error_count || 0;
              const durationS = run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "?";

              // Désérialiser urgences / synergies / decisions
              let urgences  = [];
              let synergies = [];
              let decisions = [];
              try { urgences  = JSON.parse(run.urgences  || "[]"); } catch {}
              try { synergies = JSON.parse(run.synergies || "[]"); } catch {}
              try { decisions = JSON.parse(run.decisions || "[]"); } catch {}

              const urgencesHtml = urgences.length
                ? urgences.map(u => `<li>🔴 <strong>[${u.action_id}]</strong> ${u.raison}</li>`).join("")
                : "<li><em>Aucune urgence détectée</em></li>";

              const synergiesHtml = synergies.length
                ? synergies.map(s => `<li>🔗 <strong>${(s.agents || []).join(" + ")}</strong> — ${s.opportunite}</li>`).join("")
                : "<li><em>Aucune synergie identifiée</em></li>";

              const decisionsHtml = decisions.length
                ? decisions.map(d => `<li>✅ <strong>${d.type}</strong> — ${d.details}</li>`).join("")
                : "<li><em>Aucune décision</em></li>";

              const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#1e293b;border-radius:12px;overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:28px 32px;">
      <div style="font-size:11px;color:#93c5fd;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Amaryllis Locations</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🧠 Digest IA — ${today}</h1>
      <div style="margin-top:8px;color:#bfdbfe;font-size:13px;">${okCount} agents analysés · ${errCount} erreur${errCount > 1 ? "s" : ""} · ${durationS}</div>
    </div>

    <!-- Synthèse -->
    <div style="padding:24px 32px;border-bottom:1px solid #334155;">
      <div style="font-size:11px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Situation globale</div>
      <p style="margin:0;color:#e2e8f0;font-size:15px;line-height:1.6;">${run.summary || "Analyse non disponible."}</p>
    </div>

    <!-- Urgences -->
    <div style="padding:24px 32px;border-bottom:1px solid #334155;">
      <div style="font-size:11px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">⚡ Urgences</div>
      <ul style="margin:0;padding-left:20px;color:#fca5a5;font-size:14px;line-height:1.8;">${urgencesHtml}</ul>
    </div>

    <!-- Synergies -->
    <div style="padding:24px 32px;border-bottom:1px solid #334155;">
      <div style="font-size:11px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">🔗 Synergies détectées</div>
      <ul style="margin:0;padding-left:20px;color:#93c5fd;font-size:14px;line-height:1.8;">${synergiesHtml}</ul>
    </div>

    <!-- Décisions -->
    <div style="padding:24px 32px;border-bottom:1px solid #334155;">
      <div style="font-size:11px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">✅ Décisions d'orchestration</div>
      <ul style="margin:0;padding-left:20px;color:#86efac;font-size:14px;line-height:1.8;">${decisionsHtml}</ul>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;text-align:center;">
      <a href="${siteUrl}/admin" style="display:inline-block;padding:10px 24px;background:#1d4ed8;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Ouvrir le dashboard →</a>
      <p style="margin:16px 0 0;color:#475569;font-size:11px;">Amaryllis Locations · Généré automatiquement chaque matin à 9h UTC</p>
    </div>

  </div>
</body>
</html>`;

              const toEmail = env.NOTIFICATION_EMAIL || "contact@villamaryllis.com";
              const fromAddr = resendFrom(env);

              const r = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ from: fromAddr, to: toEmail, subject: `🧠 Digest IA Amaryllis — ${today}`, html }),
              });
              if (!r.ok) console.error("[digest] Erreur Resend:", await r.text());
              else console.log(`[digest] ✓ Email envoyé à ${toEmail}`);
            } catch (e) {
              console.error("[digest] Erreur:", e.message);
            }
          }
        }
        // ── Newsletter séquence J+7 (offre abonné) ───────────────────────────────
        try { await runNewsletterSequence(env); } catch (e) { console.error("[newsletter-seq] Cron error:", e.message); }
        // ── RM recalcul automatique (recos 30j pour tous les biens) ──────────────
        try {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          const res = await fetch(`${siteUrl}/api/rm-auto-update?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const data = await res.json().catch(() => ({}));
          const okCount = (data.recalc || []).filter(r => r.ok).length;
          console.log(`[rm-auto-update] ${okCount}/6 biens · ${data.totalDates ?? 0} dates recalculées`);
        } catch (e) { console.error("[rm-auto-update] Cron error:", e.message); }
      })());

    } else if (cron === "0 13 * * *") {
      // 13h UTC chaque jour — charge-balance soldes 2× J-30 (migré cron-job.org 7798126)
      ctx.waitUntil((async () => {
        try {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          const r = await fetch(`${siteUrl}/api/charge-balance?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const d = await r.json().catch(() => ({}));
          console.log(`[charge-balance] charged=${d.charged ?? 0} skipped=${d.skipped ?? 0} failed=${d.failed ?? 0}`);
        } catch (e) {
          console.error("[charge-balance] Cron error:", e.message);
        }
      })());
      // Snapshots factuels (trafic SEO + signaux marché) → D1 → ré-ingestion RAG
      // immédiate (PAS un rewrite des docs légaux/stratégie, cf. docs-refresh.js).
      ctx.waitUntil(runDocsRefresh(env));

    } else if (cron === "0 20 * * 7") {
      // Dimanche 20h UTC (16h Martinique) — accountability hebdo (prépare réunion générale lundi)
      ctx.waitUntil(runAccountability(env));

    } else {
      // Toutes les 10 min — sync iCal + annulation Beds24 non payées + publication éditoriale due + relance panier
      ctx.waitUntil((async () => {
        await runSync(env);
        await runCancelUnpaidBeds24Bookings(env);
        // Enrichissement résas Airbnb (nom+prix+voyageurs depuis les mails) — replié ici depuis
        // son propre cron horaire (2026-07-14) pour matcher la cadence de la sync iCal elle-même
        // (10 min) plutôt qu'attendre jusqu'à 1h avant qu'une résa apparaisse enrichie.
        await runEnrichFromEmails(env);
        await runEditorialRetry(env);
        // Gate horaire (top of hour) AVANT l'auto-publish : donne une 2e chance aux drafts
        // escaladés à 12h UTC (réévaluation TTL 4h + réécriture) le jour même, au lieu de
        // rater silencieusement leur créneau 20h (incidents #156/#157 des 01-02/07).
        // Idempotent et peu coûteux : le gate skippe tout draft évalué il y a <4h.
        if (new Date(event.scheduledTime || Date.now()).getUTCMinutes() === 0) {
          try {
            const siteUrl = env.SITE_URL || "https://villamaryllis.com";
            const gateMode = env.EDITORIAL_GATE_MODE || "live";
            const gr = await fetch(`${siteUrl}/api/editorial-gate?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}&mode=${gateMode}`, { method: "POST" });
            const gd = await gr.json().catch(() => ({}));
            if (gd.evaluated) console.log(`[editorial-gate/h] évalués=${gd.evaluated} approuvés=${gd.queued_for_publish} escaladés=${gd.escalated}`);
          } catch (err) { console.error("[editorial-gate/h] error:", err.message); }
        }
        await runEditorialAutoPublish(env);
        // ── Sync Gmail entrant (réponses voyageurs → contact@villamaryllis.com) ─────────────────────
        //    Silencieux si pas encore connecté (connected:false) — pas d'erreur bloquante.
        try {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          const gmRes = await fetch(`${siteUrl}/api/gmail-sync?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const gmData = await gmRes.json().catch(() => ({}));
          if (gmData.connected === false) {
            // pas encore connecté via le bouton "Connecter Gmail" — rien à faire
          } else if ((gmData.imported ?? 0) > 0) {
            console.log(`[gmail-sync] ✓ ${gmData.imported} nouveau(x) message(s) voyageur`);
          }
        } catch (e) {
          console.error("[gmail-sync] Cron error:", e.message);
        }
        // ── Relance panier abandonné (horaire — D1 de-dup dans l'endpoint) ────────────────────────
        try {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          const rpRes = await fetch(`${siteUrl}/api/send-relance-panier?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const rpData = await rpRes.json().catch(() => ({}));
          if ((rpData.sent ?? 0) > 0) console.log(`[send-relance-panier] sent=${rpData.sent}`);
        } catch (e) {
          console.error("[send-relance-panier] Cron error:", e.message);
        }
      })());
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Sécurisation des endpoints déclencheurs par token secret
    // Ajouter WORKER_SECRET via : wrangler secret put WORKER_SECRET
    const SAFE = ["/", "/gap-prices"]; // endpoints publics en lecture seule
    if (!SAFE.includes(url.pathname)) {
      const token = request.headers.get("x-worker-token") || url.searchParams.get("token");
      if (env.WORKER_SECRET && token !== env.WORKER_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
    }

    if (url.pathname === "/sync") {
      const r = await runSync(env); return new Response(JSON.stringify({ ok: true, ...r }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/reminders") {
      const { allEvents } = await runSync(env); await runReminders(env, allEvents, allEvents);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/weekly") {
      const { allEvents } = await runSync(env); await runWeeklyReport(env, allEvents);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/prix-recap") {
      await runPrixRecap(env);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/monthly") {
      const { allEvents } = await runSync(env); await runMonthlyExport(env, allEvents);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/occupancy") {
      const { allAvailEvents } = await runSync(env); await runOccupancyAlerts(env, allAvailEvents);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/occupancy-snapshot") {
      const { allAvailEvents } = await runSync(env); await runOccupancySnapshot(env, allAvailEvents);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/enrich-emails") {
      await runEnrichFromEmails(env);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/monitor") {
      const r = await runMonitor(env); return new Response(JSON.stringify({ ok: true, ...r }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/test-ntfy") {
      await sendWhatsApp(env, "✅ Test ntfy — les notifications ménage sont bien configurées !");
      return new Response(JSON.stringify({ ok: true, topic: env.NTFY_TOPIC || "non configuré" }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/gap-prices") {
      const CORS_H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_H });
      // Recalcul à la demande si pas encore en KV
      let raw = await env.ICAL_STORE.get("gap_prices");
      if (!raw) {
        const { allAvailEvents } = await runSync(env);
        const gaps = await runGapPricing(env, allAvailEvents);
        raw = JSON.stringify(gaps);
      }
      return new Response(raw, { headers: CORS_H });
    }
    if (url.pathname === "/caution-release") {
      const CORS_H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
      const result = await runCautionAutoRelease(env);
      return new Response(JSON.stringify({ ok: true, ...result }), { headers: CORS_H });
    }
    if (url.pathname === "/gap-prices/refresh") {
      const CORS_H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
      const { allAvailEvents } = await runSync(env);
      const gaps = await runGapPricing(env, allAvailEvents);
      return new Response(JSON.stringify({ ok: true, gaps }), { headers: CORS_H });
    }
    if (url.pathname === "/yield") {
      const CORS_H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
      // Retourne les prix yield actuels depuis KV (merge gap_prices)
      const raw = await env.ICAL_STORE.get("gap_prices");
      return new Response(raw || "{}", { headers: CORS_H });
    }
    if (url.pathname === "/yield/refresh") {
      const CORS_H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
      const { allAvailEvents } = await runSync(env);
      const yieldPrices = await runYieldPricing(env, allAvailEvents);
      return new Response(JSON.stringify({ ok: true, yieldPrices }), { headers: CORS_H });
    }
    return new Response(JSON.stringify({
      name: "amaryllis-ical-sync",
      crons: ["0 * * * * (sync)", "0 9 * * * (rappels+alertes+yield)", "0 6 * * 1 (hebdo)", "0 1 1 * * (mensuel)"],
      endpoints: ["/sync", "/reminders", "/weekly", "/monthly", "/occupancy", "/monitor", "/test-ntfy", "/gap-prices", "/gap-prices/refresh", "/yield", "/yield/refresh"],
    }), { headers: { "Content-Type": "application/json" } });
  },
};
