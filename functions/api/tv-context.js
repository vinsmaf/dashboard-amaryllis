// Cloudflare Pages Function — GET /api/tv-context?p=<bien>
// Renvoie le contexte de séjour EN COURS pour l'écran d'accueil TV : { guest?, du?, au? }.
// Source v1 : table D1 `direct_bookings` (résas directes Stripe → a le PRÉNOM + dates).
// Les résas Airbnb/Booking (iCal) n'exposent pas le prénom → non couvertes ici (dates only = extension future).
// Tolérant : toute erreur / aucune résa → {} (l'écran reste en accueil générique).

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// Mots-clés pour relier un property_id au champ libre `bien_nom` des résas directes.
const PID_KEYWORDS = {
  amaryllis:  ["amaryllis"],
  zandoli:    ["zandoli"],
  geko:       ["geko", "géko"],
  mabouya:    ["mabouya"],
  schoelcher: ["schoel", "schœl", "bellevue"],
  nogent:     ["nogent"],
  iguana:     ["iguana"],
};

function firstName(full) {
  const s = (full || "").trim();
  if (!s) return null;
  const part = s.split(/[\s,]+/)[0];
  if (!part) return null;
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

// "YYYY-MM-DD" → "5 juin" (FR). Renvoie null si invalide.
function frDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return null;
  const day = parseInt(m[3], 10);
  const month = MONTHS[parseInt(m[2], 10) - 1];
  if (!month || !day) return null;
  return `${day} ${month}`;
}

function matchesPid(bienNom, pid) {
  const kws = PID_KEYWORDS[pid] || [pid];
  const hay = (bienNom || "").toLowerCase();
  return kws.some((k) => hay.includes(k));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const pid = (url.searchParams.get("p") || "").trim().toLowerCase();
    if (!pid) return json({});

    const db = env.revenue_manager;
    if (!db) return json({});

    // "Aujourd'hui" en heure Martinique (UTC-4).
    const today = new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);

    // Résas directes dont le séjour englobe aujourd'hui (checkin <= today <= checkout).
    let rows = [];
    try {
      const res = await db
        .prepare("SELECT bien_nom, voyageur, checkin, checkout FROM direct_bookings WHERE checkin <= ? AND checkout >= ? ORDER BY checkin DESC")
        .bind(today, today)
        .all();
      rows = (res && res.results) || [];
    } catch { rows = []; }

    const stay = rows.find((r) => matchesPid(r.bien_nom, pid));
    if (!stay) return json({});

    return json({
      guest: firstName(stay.voyageur),
      du: frDate(stay.checkin),
      au: frDate(stay.checkout),
      source: "direct",
    });
  } catch {
    return json({});
  }
}
