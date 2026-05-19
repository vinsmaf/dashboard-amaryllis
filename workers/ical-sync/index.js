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

// ── iCal URLs par logement ──────────────────────────────────────────────────
const ICAL_URLS = {
  amaryllis:  "https://www.airbnb.fr/calendar/ical/54269844.ics?t=681e7d55c76a4845839d24c0bc18ca94",
  schoelcher: "https://www.airbnb.fr/calendar/ical/24242415.ics?t=400f2712fa95485692d5911972f5533d",
  geko:       "https://www.airbnb.fr/calendar/ical/1263155865459755724.ics?t=1c95f057feda4b2fa08519aad1001ca9",
  mabouya:    "https://www.airbnb.fr/calendar/ical/1046596752160926069.ics?t=05c0e5dbdd9542878d58aa760416cf4f",
  zandoli:    "https://www.airbnb.fr/calendar/ical/792768220924504884.ics?t=cfc774d9c7fa40bfbe5f0757ba06b090",
};

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
    let voyageur = sum.replace(/^(Réservé|Reserved|Booking)\s*[-–]?\s*/i, "").replace(/\(.*\)/g, "").trim() || "Voyageur Airbnb";
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
    `• <strong>${e.nom}</strong> — ${e.voyageur}<br>
     &nbsp;&nbsp;📅 ${e.checkin} → ${e.checkout}${e.montant ? ` · ${e.montant}€` : ""}`
  ).join("<br><br>");

  const body = {
    from: "Amaryllis Sync <sync@villamaryllis.com>",
    to:   [env.NOTIFICATION_EMAIL || "contact@villamaryllis.com"],
    subject: `🔔 ${nouvelles.length} nouvelle${nouvelles.length > 1 ? "s" : ""} réservation${nouvelles.length > 1 ? "s" : ""} Airbnb`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f4ecdc;border-radius:12px;">
        <h2 style="color:#0e3b3a;margin:0 0 16px">🌺 Nouvelles réservations Airbnb</h2>
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
    canal: "airbnb",
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

// ── Handler principal (cron) ─────────────────────────────────────────────────
async function runSync(env) {
  console.log(`[amaryllis-sync] Démarrage sync — ${new Date().toISOString()}`);
  const allEvents = [];
  const nouvelles = [];

  for (const [bienId, url] of Object.entries(ICAL_URLS)) {
    try {
      const text = await fetchICS(url);
      const events = parseICS(text, bienId);

      // Charger les UIDs connus depuis KV
      const kvKey = `uids:${bienId}`;
      const stored = await env.ICAL_STORE.get(kvKey, "json") || [];
      const knownUids = new Set(stored);

      // Détecter les nouvelles réservations
      const newForBien = events.filter(e => !knownUids.has(e.uid));
      if (newForBien.length > 0) {
        console.log(`[amaryllis-sync] ${bienId}: ${newForBien.length} nouvelle(s) réservation(s)`);
        nouvelles.push(...newForBien);
      }

      // Mettre à jour KV avec les UIDs actuels (TTL 90 jours)
      const currentUids = events.map(e => e.uid);
      await env.ICAL_STORE.put(kvKey, JSON.stringify(currentUids), { expirationTtl: 60 * 60 * 24 * 90 });

      allEvents.push(...events);
      console.log(`[amaryllis-sync] ${bienId}: ${events.length} événements, ${newForBien.length} nouveaux`);
    } catch (err) {
      console.error(`[amaryllis-sync] ${bienId} erreur:`, err.message);
    }
  }

  // Notifications email si nouvelles réservations
  if (nouvelles.length > 0) {
    await sendEmail(env, nouvelles);
  }

  // Push tout vers Google Sheets (même si rien de nouveau — garde les données à jour)
  if (allEvents.length > 0) {
    await pushToSheets(env, allEvents);
  }

  console.log(`[amaryllis-sync] Terminé — ${allEvents.length} événements total, ${nouvelles.length} nouveaux`);
  return { total: allEvents.length, nouvelles: nouvelles.length };
}

// ── Exports Cloudflare Worker ────────────────────────────────────────────────
export default {
  // Cron trigger (toutes les heures)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runSync(env));
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
    return new Response(JSON.stringify({
      name: "amaryllis-ical-sync",
      cron: "0 * * * *",
      properties: Object.keys(ICAL_URLS),
      endpoints: { manual: "/sync" },
    }), { headers: { "Content-Type": "application/json" } });
  },
};
