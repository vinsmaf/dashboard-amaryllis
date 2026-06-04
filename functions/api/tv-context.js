// Cloudflare Pages Function — GET /api/tv-context?p=<bien>
// Renvoie le contexte de séjour EN COURS pour l'écran d'accueil TV : { guest?, du?, au? }.
// Priorité :
//   1. table D1 `direct_bookings` (résas directes Stripe → a le PRÉNOM + dates) → { guest, du, au }.
//   2. sinon réservations Airbnb/Booking (iCal, via /api/get-availability) → { du, au } SANS prénom
//      (les OTA n'exposent pas le prénom).
//   3. sinon {} (l'écran reste en accueil générique).
// Tolérant : toute erreur / aucune résa → {} (ne JAMAIS planter).

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

// Biens connus par /api/get-availability (mêmes clés que PID_KEYWORDS).
const OTA_BIENS = new Set(["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"]);

// "YYYY-MM-DD" → +1 jour ("YYYY-MM-DD"). Renvoie null si invalide.
function nextDay(iso) {
  const d = new Date((iso || "") + "T12:00:00Z");
  if (isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// "YYYY-MM-DD" → -1 jour. Renvoie null si invalide.
function prevDay(iso) {
  const d = new Date((iso || "") + "T12:00:00Z");
  if (isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Cherche dans les réservations OTA (Airbnb/Booking via /api/get-availability) le séjour
// qui englobe `today`, et renvoie { checkin, checkout } (checkout = nuit après la dernière
// nuit bloquée, convention iCal DTEND exclusif). Renvoie null si rien / erreur.
// best-effort : utilise uniquement les URLs iCal configurées côté serveur (env vars),
// pas de bookingUrl dynamique (non disponible côté serveur ici).
async function findOtaStay(origin, pid, today) {
  try {
    if (!OTA_BIENS.has(pid)) return null;

    const res = await fetch(new URL(`/api/get-availability?bienId=${encodeURIComponent(pid)}`, origin));
    if (!res.ok) return null;
    const data = await res.json();

    const blocked = new Set(Array.isArray(data && data.blockedDates) ? data.blockedDates : []);
    if (!blocked.has(today)) return null;

    // Remonter au premier jour contigu bloqué (checkin = nuit d'arrivée).
    let checkin = today;
    for (let p = prevDay(checkin); p && blocked.has(p); p = prevDay(checkin)) {
      checkin = p;
    }

    // Descendre jusqu'à la dernière nuit contiguë bloquée.
    let lastNight = today;
    for (let n = nextDay(lastNight); n && blocked.has(n); n = nextDay(lastNight)) {
      lastNight = n;
    }

    // checkout = lendemain de la dernière nuit (DTEND iCal, départ exclu).
    const checkout = nextDay(lastNight);
    if (!checkin || !checkout) return null;
    return { checkin, checkout };
  } catch {
    return null;
  }
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
    if (stay) {
      return json({
        guest: firstName(stay.voyageur),
        du: frDate(stay.checkin),
        au: frDate(stay.checkout),
        source: "direct",
      });
    }

    // Pas de résa directe → repli sur les réservations OTA (dates seules, sans prénom).
    const ota = await findOtaStay(url.origin, pid, today);
    if (ota) {
      return json({
        du: frDate(ota.checkin),
        au: frDate(ota.checkout),
        source: "ota",
      });
    }

    return json({});
  } catch {
    return json({});
  }
}
