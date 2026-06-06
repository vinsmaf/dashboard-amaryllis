import { resendFrom } from "./_email.js";
// Cloudflare Pages Function — GET /api/send-vacancy-alert
// rev-007 : Alerte vacance locative J+14 à J+30
//
// Vérifie le taux de vacance sur les 14-30 prochains jours.
// Si > 10 nuits libres sur cette fenêtre pour l'Appartement Nogent,
// envoie un email d'alerte avec les dates libres et des suggestions.
//
// Auth : ?secret=VACANCY_ALERT_SECRET
// Secrets requis : BEDS24_TOKEN (ou D1), RESEND_API_KEY,
//                  NOTIFICATION_EMAIL, VACANCY_ALERT_SECRET
// Cron-job.org : GET https://villamaryllis.com/api/send-vacancy-alert?secret=<SECRET>
//                chaque lundi à 09h00 UTC

import { getActiveBeds24Token } from "./beds24-refresh.js";

const BEDS24_V2_URL = "https://beds24.com/api/v2/bookings";
const PROP_ID       = "158192"; // Nogent uniquement
const BIEN_NOM      = "Appartement Nogent-sur-Marne";

const VACANCY_THRESHOLD = 10; // nuits libres avant alerte

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function fmt(iso) {
  if (!iso) return "?";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function dayOfWeek(iso) {
  const days = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  return days[new Date(iso + "T12:00:00").getDay()];
}

// Génère toutes les dates entre from et to (inclus)
function dateRange(from, to) {
  const dates = [];
  let cur = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");
  while (cur <= end) {
    dates.push(toISO(cur));
    cur = addDays(cur, 1);
  }
  return dates;
}

// Construit les plages de dates libres consécutives
function buildFreeRanges(freeDates) {
  if (freeDates.length === 0) return [];
  const ranges = [];
  let start = freeDates[0], end = freeDates[0];
  for (let i = 1; i < freeDates.length; i++) {
    const prev = new Date(freeDates[i - 1] + "T12:00:00");
    const cur  = new Date(freeDates[i]      + "T12:00:00");
    const diff = (cur - prev) / 86400000;
    if (diff === 1) {
      end = freeDates[i];
    } else {
      ranges.push({ start, end });
      start = freeDates[i];
      end   = freeDates[i];
    }
  }
  ranges.push({ start, end });
  return ranges;
}

function buildHtml({ freeNights, freeDates, freeRanges, windowFrom, windowTo, revparCible }) {
  const urgencyColor = freeNights >= 20 ? "#ef4444" : freeNights >= 14 ? "#f59e0b" : "#eab308";
  const urgencyLabel = freeNights >= 20 ? "🔴 Vacance élevée" : "🟡 Vacance modérée";
  const estimatedLoss = freeNights * (revparCible || 82);

  const rangesHtml = freeRanges.map(r => {
    const nights = dateRange(r.start, r.end).length;
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#fff;border:1px solid #e8dcc8;border-radius:8px;margin-bottom:6px;">
      <span style="font-size:13px;color:#0e3b3a;">${dayOfWeek(r.start)} ${fmt(r.start)} → ${dayOfWeek(r.end)} ${fmt(r.end)}</span>
      <span style="font-size:12px;font-weight:700;color:#c47254;">${nights} nuit${nights > 1 ? "s" : ""}</span>
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#faf5e9;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09);">

    <div style="background:#0e3b3a;padding:28px 32px 22px;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(250,247,242,0.5);">Revenue Manager · Alerte vacance</p>
      <h1 style="margin:0;font-size:20px;color:#faf5e9;font-weight:300;">${urgencyLabel} — ${BIEN_NOM}</h1>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(250,247,242,0.6);">Fenêtre J+14 → J+30 : ${fmt(windowFrom)} au ${fmt(windowTo)}</p>
    </div>

    <div style="padding:24px 28px;">
      <!-- KPI -->
      <div style="display:flex;gap:12px;margin-bottom:20px;">
        <div style="flex:1;background:#fff;border:1px solid #e8dcc8;border-radius:10px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:28px;font-weight:700;color:${urgencyColor};">${freeNights}</p>
          <p style="margin:0;font-size:12px;color:#7a6b5a;">nuits libres</p>
        </div>
        <div style="flex:1;background:#fff;border:1px solid #e8dcc8;border-radius:10px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#c47254;">~${estimatedLoss}€</p>
          <p style="margin:0;font-size:12px;color:#7a6b5a;">manque à gagner estimé</p>
        </div>
        <div style="flex:1;background:#fff;border:1px solid #e8dcc8;border-radius:10px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#0e3b3a;">${Math.round((1 - freeNights / 17) * 100)}%</p>
          <p style="margin:0;font-size:12px;color:#7a6b5a;">occupation J+14→J+30</p>
        </div>
      </div>

      <!-- Dates libres -->
      <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0e3b3a;">Plages disponibles :</p>
      ${rangesHtml}

      <!-- Suggestions -->
      <div style="margin-top:18px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#166534;">💡 Actions recommandées</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#166534;line-height:1.8;">
          <li>Baisser le prix de 10-15% sur ces dates dans Beds24</li>
          <li>Publier un post "dernières disponibilités" sur Instagram</li>
          <li>Envoyer un email "offre spéciale" aux anciens voyageurs Nogent</li>
          <li>Vérifier la visibilité sur Airbnb (boost listing)</li>
        </ul>
      </div>
    </div>

    <div style="padding:16px 28px 20px;text-align:center;">
      <a href="https://villamaryllis.com/admin" style="display:inline-block;background:#c47254;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;">
        Ouvrir le dashboard →
      </a>
      <p style="margin:12px 0 0;font-size:11px;color:#a09080;">Amaryllis Locations · Alerte automatique · Ne pas répondre</p>
    </div>
  </div>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const { env, request } = context;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const url    = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (env.VACANCY_ALERT_SECRET && secret !== env.VACANCY_ALERT_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }

  const resendKey  = env.RESEND_API_KEY;
  const notifEmail = env.NOTIFICATION_EMAIL || env.RECAP_EMAIL;
  const notifTo    = String(notifEmail || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!resendKey || !notifEmail) {
    return json({ error: "RESEND_API_KEY ou NOTIFICATION_EMAIL requis" }, 500);
  }

  const dryRun = url.searchParams.get("dry") === "1";

  // ── Token Beds24 ──────────────────────────────────────────────────────────
  const token = await getActiveBeds24Token(env, env.revenue_manager);
  if (!token) return json({ error: "BEDS24_TOKEN manquant" }, 500);

  // ── Fenêtre J+14 → J+30 ───────────────────────────────────────────────────
  const today     = new Date();
  const windowFrom = toISO(addDays(today, 14));
  const windowTo   = toISO(addDays(today, 30));
  const allDates   = dateRange(windowFrom, windowTo); // 17 jours

  // ── Fetch réservations Beds24 sur cette fenêtre ────────────────────────────
  let bookedDates = new Set();
  try {
    const qp = new URLSearchParams({
      propId:         PROP_ID,
      arrivalFrom:    windowFrom,
      departureTo:    windowTo,
      numId:          50,
      pageNum:        0,
    });
    const res = await fetch(`${BEDS24_V2_URL}?${qp}`, {
      headers: { token },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Beds24 HTTP ${res.status}`);
    const data = await res.json();
    const raw  = Array.isArray(data) ? data : (data.data || data.bookings || []);

    // Marquer toutes les nuits couvertes par des réservations confirmées
    raw
      .filter(b => b.status === 1 || b.status === "1")
      .forEach(b => {
        if (!b.arrival || !b.departure) return;
        const nights = dateRange(b.arrival, b.departure);
        nights.forEach(d => bookedDates.add(d));
      });
  } catch (err) {
    return json({ error: `Beds24 fetch error: ${err.message}` }, 502);
  }

  // ── Calculer les nuits libres ──────────────────────────────────────────────
  const freeDates = allDates.filter(d => !bookedDates.has(d));
  const freeNights = freeDates.length;
  const freeRanges = buildFreeRanges(freeDates);

  // ── Pas d'alerte nécessaire ────────────────────────────────────────────────
  if (freeNights < VACANCY_THRESHOLD) {
    return json({
      ok: true,
      alert: false,
      freeNights,
      windowFrom,
      windowTo,
      status: `✅ Occupation satisfaisante (${freeNights} nuits libres < seuil ${VACANCY_THRESHOLD})`,
    });
  }

  // ── Construire et envoyer l'email ──────────────────────────────────────────
  const html    = buildHtml({ freeNights, freeDates, freeRanges, windowFrom, windowTo, revparCible: 82 });
  const subject = `🏠 Vacance Nogent : ${freeNights} nuits libres J+14→J+30`;

  if (dryRun) {
    return json({ ok: true, alert: false, dryRun: true, freeNights, freeRanges, windowFrom, windowTo });
  }

  let emailOk = false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:     resendFrom(env, "Amaryllis <notifications@villamaryllis.com>"),
        to:       notifTo,
        subject,
        html,
        reply_to: "contact@villamaryllis.com",
      }),
    });
    emailOk = r.ok;
    if (!r.ok) {
      const errText = await r.text();
      return json({ error: `Resend error: ${errText}` }, 502);
    }
  } catch (err) {
    return json({ error: `Email send failed: ${err.message}` }, 502);
  }

  return json({
    ok:         true,
    alert:      emailOk,
    freeNights,
    freeRanges,
    windowFrom,
    windowTo,
    to:         notifTo,
    status:     `⚠️ Alerte envoyée — ${freeNights} nuits libres`,
  });
}

export async function onRequest(context) {
  return onRequestGet(context);
}
