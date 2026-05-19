/**
 * Amaryllis — Cloudflare Worker : sync iCal toutes les heures
 *
 * Déclenché par cron (wrangler.toml : "0 * * * *")
 * 1. Récupère les flux iCal Airbnb de chaque logement
 * 2. Parse les VEVENT
 * 3. Compare avec les UIDs stockés en KV → détecte les nouvelles réservations
 * 4. Si nouvelles réservations → envoie email via Resend + push Google Sheets
 * 5. Met à jour le KV avec les UIDs courants
 *
 * Secrets requis (wrangler secret put) :
 *   APPS_SCRIPT_URL  — URL de déploiement Google Apps Script
 *   RESEND_API_KEY   — Clé API Resend (resend.com, gratuit jusqu'à 3000 emails/mois)
 */

// ── iCal URLs Airbnb (hardcodées) ───────────────────────────────────────────
const ICAL_AIRBNB = {
  amaryllis:  "https://www.airbnb.fr/calendar/ical/54269844.ics?t=681e7d55c76a4845839d24c0bc18ca94",
  schoelcher: "https://www.airbnb.fr/calendar/ical/24242415.ics?t=400f2712fa95485692d5911972f5533d",
  geko:       "https://www.airbnb.fr/calendar/ical/1263155865459755724.ics?t=1c95f057feda4b2fa08519aad1001ca9",
  mabouya:    "https://www.airbnb.fr/calendar/ical/1046596752160926069.ics?t=05c0e5dbdd9542878d58aa760416cf4f",
  zandoli:    "https://www.airbnb.fr/calendar/ical/792768220924504884.ics?t=cfc774d9c7fa40bfbe5f0757ba06b090",
};

// ── iCal URLs Booking.com (depuis secrets Cloudflare) ───────────────────────
// Variables : ICAL_BOOKING_AMARYLLIS, ICAL_BOOKING_GEKO, ICAL_BOOKING_MABOUYA,
//             ICAL_BOOKING_SCHOELCHER, ICAL_BOOKING_ZANDOLI
function getBookingUrls(env) {
  const map = {};
  const keys = { amaryllis: "ICAL_BOOKING_AMARYLLIS", geko: "ICAL_BOOKING_GEKO",
                 mabouya: "ICAL_BOOKING_MABOUYA", schoelcher: "ICAL_BOOKING_SCHOELCHER",
                 zandoli: "ICAL_BOOKING_ZANDOLI" };
  for (const [bienId, envKey] of Object.entries(keys)) {
    if (env[envKey]) map[bienId] = env[envKey];
  }
  return map;
}

const NOMS = {
  amaryllis:  "Villa Amaryllis",
  schoelcher: "Bellevue Schœlcher",
  geko:       "Géko",
  mabouya:    "Mabouya",
  zandoli:    "Zandoli",
};

// ── Parser ICS minimal ───────────────────────────────────────────────────────
function parseICS(text, bienId) {
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
    if (/not available|blocked/i.test(sum)) continue;
    // Extract voyageur name
    const desc = get("DESCRIPTION").replace(/\\n/g, "\n");
    const descGet = (patterns) => {
      for (const p of patterns) {
        const m = desc.match(new RegExp(p + "\\s*[:\\-]\\s*([^\\n\\r]+)", "i"));
        if (m) return m[1].trim();
      }
      return "";
    };
    const montantRaw = descGet(["Montant total","Total","Amount","Payout"]);
    const montant = montantRaw ? parseFloat(montantRaw.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;
    let voyageur = sum.replace(/^(Réservé|Reserved|Booking)\s*[-–]?\s*/i, "").replace(/\(.*\)/g, "").trim() || "Voyageur";
    events.push({ uid, bienId, nom: NOMS[bienId] || bienId, voyageur, checkin: ci, checkout: co, montant });
  }
  return events;
}

// ── Fetch iCal avec fallback ─────────────────────────────────────────────────
async function fetchICS(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AmaryllisSync/1.0)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text.includes("VCALENDAR")) throw new Error("Format ICS invalide");
  return text;
}

// ── Email via Resend ─────────────────────────────────────────────────────────
async function sendEmail(env, nouvelles) {
  if (!env.RESEND_API_KEY) {
    console.log("[amaryllis-sync] RESEND_API_KEY absent — notification email ignorée");
    return;
  }
  const lignes = nouvelles.map(e =>
    `• <strong>${e.nom}</strong> — ${e.voyageur} <span style="background:#e0f0e8;color:#2e7d32;padding:1px 6px;border-radius:10px;font-size:11px;">${e.canal}</span><br>
     &nbsp;&nbsp;📅 ${e.checkin} → ${e.checkout}${e.montant ? ` · ${e.montant}€` : ""}`
  ).join("<br><br>");

  const body = {
    from: "Amaryllis Sync <sync@villamaryllis.com>",
    to:   [env.NOTIFICATION_EMAIL || "contact@villamaryllis.com"],
    subject: `🔔 ${nouvelles.length} nouvelle${nouvelles.length > 1 ? "s" : ""} réservation${nouvelles.length > 1 ? "s" : ""}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f4ecdc;border-radius:12px;">
        <h2 style="color:#0e3b3a;margin:0 0 16px">🌺 Nouvelles réservations</h2>
        <p style="color:#7a6b5a;font-size:14px;margin:0 0 20px">
          ${nouvelles.length} nouvelle${nouvelles.length > 1 ? "s" : ""} réservation${nouvelles.length > 1 ? "s" : ""} détectée${nouvelles.length > 1 ? "s" : ""} — ${new Date().toLocaleString("fr-FR", { timeZone: "America/Martinique" })} (heure Martinique)
        </p>
        <div style="background:#fff;border-radius:8px;padding:16px 20px;font-size:14px;color:#0e3b3a;line-height:1.8;">
          ${lignes}
        </div>
        <div style="margin-top:20px;text-align:center;">
          <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin"
             style="background:#0e3b3a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px;">
            Ouvrir le planning →
          </a>
        </div>
        <p style="margin-top:20px;font-size:10px;color:#b0a898;text-align:center;">
          Amaryllis Sync · envoyé automatiquement toutes les heures
        </p>
      </div>
    `,
  };

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.text();
    console.error("[amaryllis-sync] Resend error:", err);
  } else {
    console.log(`[amaryllis-sync] Email envoyé pour ${nouvelles.length} réservation(s)`);
  }
}

// ── Push vers Google Sheets (Apps Script) ────────────────────────────────────
async function pushToSheets(env, allEvents) {
  if (!env.APPS_SCRIPT_URL) return;
  const reservations = allEvents.map(e => ({
    id: e.uid,
    bienId: e.bienId,
    voyageur: e.voyageur,
    canal: e.canal,
    checkin: e.checkin,
    checkout: e.checkout,
    montant: e.montant,
    fromIcal: true,
    notes: "",
  }));
  try {
    await fetch(env.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "importAllReservations", reservations }),
    });
    console.log(`[amaryllis-sync] ${reservations.length} réservations pushées vers Sheets`);
  } catch (e) {
    console.error("[amaryllis-sync] Sheets push error:", e.message);
  }
}

// ── Sync un flux iCal (Airbnb ou Booking) ───────────────────────────────────
async function syncFeed(env, bienId, url, canal, allEvents, nouvelles) {
  try {
    const text = await fetchICS(url);
    const events = parseICS(text, bienId).map(e => ({ ...e, canal }));

    const kvKey = `uids:${bienId}:${canal}`;
    const stored = await env.ICAL_STORE.get(kvKey, "json") || [];
    const knownUids = new Set(stored);

    const newForFeed = events.filter(e => !knownUids.has(e.uid));
    if (newForFeed.length > 0) {
      console.log(`[amaryllis-sync] ${bienId}/${canal}: ${newForFeed.length} nouvelle(s)`);
      nouvelles.push(...newForFeed);
    }

    const currentUids = events.map(e => e.uid);
    await env.ICAL_STORE.put(kvKey, JSON.stringify(currentUids), { expirationTtl: 60 * 60 * 24 * 90 });

    allEvents.push(...events);
    console.log(`[amaryllis-sync] ${bienId}/${canal}: ${events.length} événements`);
  } catch (err) {
    console.error(`[amaryllis-sync] ${bienId}/${canal} erreur:`, err.message);
  }
}

// ── Handler principal (cron) ─────────────────────────────────────────────────
async function runSync(env) {
  console.log(`[amaryllis-sync] Démarrage sync — ${new Date().toISOString()}`);
  const allEvents = [];
  const nouvelles = [];

  // Airbnb
  for (const [bienId, url] of Object.entries(ICAL_AIRBNB)) {
    await syncFeed(env, bienId, url, "airbnb", allEvents, nouvelles);
  }

  // Booking.com (depuis secrets Cloudflare)
  const bookingUrls = getBookingUrls(env);
  for (const [bienId, url] of Object.entries(bookingUrls)) {
    await syncFeed(env, bienId, url, "booking", allEvents, nouvelles);
  }

  // Notifications email si nouvelles réservations
  if (nouvelles.length > 0) {
    await sendEmail(env, nouvelles);
  }

  // Push tout vers Google Sheets
  if (allEvents.length > 0) {
    await pushToSheets(env, allEvents);
  }

  console.log(`[amaryllis-sync] Terminé — ${allEvents.length} événements total, ${nouvelles.length} nouveaux`);
  return { total: allEvents.length, nouvelles: nouvelles.length, booking: Object.keys(bookingUrls).length };
}

// ── Monitoring quotidien ─────────────────────────────────────────────────────
const CHECKS = [
  { name: "Home",            url: "https://villamaryllis.com/",                  expect: 200 },
  { name: "Villa Amaryllis", url: "https://villamaryllis.com/amaryllis",          expect: 200 },
  { name: "API reviews",     url: "https://villamaryllis.com/api/google-reviews", expect: 200, expectJson: "ok" },
  { name: "API ical-config", url: "https://villamaryllis.com/api/ical-config",    expect: 200, expectJson: "ok" },
  { name: "Sitemap",         url: "https://villamaryllis.com/sitemap.xml",        expect: 200 },
];

async function runMonitor(env) {
  console.log("[amaryllis-monitor] Démarrage audit —", new Date().toISOString());
  const errors = [];
  const results = [];

  for (const check of CHECKS) {
    try {
      const res = await fetch(check.url, { headers: { "User-Agent": "AmaryllisMonitor/1.0" } });
      const ok = res.status === check.expect;
      let jsonOk = true;

      if (check.expectJson) {
        try {
          const data = await res.clone().json();
          jsonOk = data[check.expectJson] === true;
        } catch { jsonOk = false; }
      }

      const pass = ok && jsonOk;
      results.push({ name: check.name, status: res.status, pass });
      if (!pass) errors.push(`❌ ${check.name} — HTTP ${res.status}${!jsonOk ? " (réponse JSON invalide)" : ""}`);
      else console.log(`[monitor] ✓ ${check.name} — ${res.status}`);
    } catch (e) {
      results.push({ name: check.name, status: 0, pass: false });
      errors.push(`❌ ${check.name} — Erreur réseau: ${e.message}`);
    }
  }

  if (errors.length > 0 && env.RESEND_API_KEY) {
    const lignes = errors.join("<br>") + "<br><br>" + results.filter(r => r.pass).map(r => `✅ ${r.name} — OK`).join("<br>");
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Amaryllis Monitor <sync@villamaryllis.com>",
        to: [env.NOTIFICATION_EMAIL || "contact@villamaryllis.com"],
        subject: `🚨 ${errors.length} problème${errors.length > 1 ? "s" : ""} détecté${errors.length > 1 ? "s" : ""} — villamaryllis.com`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f4ecdc;border-radius:12px;">
            <h2 style="color:#c47254;margin:0 0 16px">🚨 Audit villamaryllis.com</h2>
            <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${new Date().toLocaleString("fr-FR", { timeZone: "America/Martinique" })} · Martinique</p>
            <div style="background:#fff;border-radius:8px;padding:16px 20px;font-size:13px;color:#0e3b3a;line-height:2;">
              ${lignes}
            </div>
            <div style="margin-top:20px;text-align:center;">
              <a href="https://villamaryllis.com" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px;">
                Vérifier le site →
              </a>
            </div>
          </div>
        `,
      }),
    });
    console.log(`[monitor] Email d'alerte envoyé — ${errors.length} erreur(s)`);
  } else if (errors.length === 0) {
    console.log("[monitor] Tout est OK — aucune alerte envoyée");
  }

  return { checked: CHECKS.length, errors: errors.length, results };
}

// ── Exports Cloudflare Worker ────────────────────────────────────────────────
export default {
  // Cron triggers
  async scheduled(event, env, ctx) {
    if (event.cron === "0 9 * * *") {
      // Audit quotidien à 9h
      ctx.waitUntil(runMonitor(env));
    } else {
      // Sync iCal toutes les heures
      ctx.waitUntil(runSync(env));
    }
  },

  // HTTP trigger manuel (GET /sync depuis le navigateur pour tester)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/sync") {
      const result = await runSync(env);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
    if (url.pathname === "/monitor") {
      const result = await runMonitor(env);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
    return new Response(JSON.stringify({
      name: "amaryllis-ical-sync",
      crons: ["0 * * * * (sync iCal)", "0 9 * * * (audit monitoring)"],
      properties: Object.keys(ICAL_AIRBNB),
      endpoints: { sync: "/sync", monitor: "/monitor" },
    }), { headers: { "Content-Type": "application/json" } });
  },
};
