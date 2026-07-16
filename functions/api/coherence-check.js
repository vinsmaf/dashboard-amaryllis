// functions/api/coherence-check.js — contrôle de cohérence des réservations (cron).
// GET ?secret=POSTSTAY_SECRET   → exécute, écrit les findings dans l'inbox client_errors,
//                                 push ntfy si finding critique. ?dry=1 = simulation (rien écrit).
import { ensureClientErrorsTable, clientErrorFingerprint } from "./client-errors.js";
import { BIENS as CANON } from "../../src/data/biens.js";
import { checkReservations } from "../../src/utils/coherenceRules.js";

// ids canoniques + alias d'affichage (Bellevue = schoelcher)
const VALID_BIENS = [...Object.keys(CANON), "bellevue"];

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

// ── Helpers Check 4 : cross-canal ────────────────────────────────────────────

/** Construit la map des URLs iCal Airbnb + Booking depuis les secrets d'env (même naming que get-availability.js et le Worker). */
function getIcalUrls(env) {
  const biens = ["amaryllis", "schoelcher", "geko", "mabouya", "zandoli", "iguana", "nogent"];
  const result = {};
  for (const id of biens) {
    const upper = id.toUpperCase();
    const airbnb  = env[`ICAL_AIRBNB_${upper}`] || env[`ICAL_${upper}`] || null;
    const booking = env[`ICAL_BOOKING_${upper}`] || null;
    if (airbnb || booking) result[id] = { airbnb, booking };
  }
  return result;
}

/** Fetch une URL iCal avec timeout de 10s. Retourne le texte brut ou null si erreur. */
async function fetchIcalText(url) {
  if (!url) return null;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AmaryllisCoherence/1.0)" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.includes("VCALENDAR") ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
  }
}

/**
 * Parse un texte iCal et retourne un tableau d'objets { uid, checkin, checkout, summary }.
 * Ignore les événements "not available / blocked" (blocages internes Airbnb).
 */
function parseIcalEvents(text) {
  if (!text) return [];
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
    events.push({ uid, checkin: ci, checkout: co, summary: sum });
  }
  return events;
}

/** Vérifie si deux intervalles de dates [a_ci, a_co[ et [b_ci, b_co[ se chevauchent. */
function overlaps(aCi, aCo, bCi, bCo) {
  return aCi < bCo && bCi < aCo;
}

/**
 * Check 4 : détecte les double-bookings entre résas directes D1 et événements iCal.
 * Retourne un tableau de findings avec { message, severity, rule, source }.
 */
async function checkCrossCanal(env, directBookings) {
  const crossFindings = [];
  const icalUrls = getIcalUrls(env);

  if (Object.keys(icalUrls).length === 0) {
    console.warn("[coherence/cross-canal] Aucune URL iCal configurée dans l'env — check sauté");
    return { findings: crossFindings, warning: "no-ical-urls" };
  }

  // Filtrer les résas directes actives (checkin >= aujourd'hui)
  const today = new Date().toISOString().slice(0, 10);
  const activeDirects = directBookings.filter((r) => r.checkin && r.checkout && r.checkin >= today);

  if (activeDirects.length === 0) {
    return { findings: crossFindings, biensChecked: 0, icalEventsParsed: 0 };
  }

  // Grouper les résas directes par bien_id canonique. Décompose les résas groupées (offre
  // résidence, bien_id="groupe") en un enregistrement par bien du groupe (group_biens = CSV
  // "zandoli,geko") — sans ça, une résa groupée n'apparaissait jamais dans directsByBien sous
  // une clé qui matche icalUrls (bien_id="groupe" ne correspond à aucun bien réel), la rendant
  // invisible à ce check anti-double-booking cross-canal. Même logique déjà en prod côté
  // ical-export.js (flux sortant qui bloque ces dates chez les OTA).
  const directsByBien = {};
  for (const r of activeDirects) {
    const bienIds = r.bien_id === "groupe"
      ? String(r.group_biens || "").split(",").map((s) => s.trim()).filter(Boolean)
      : [String(r.bien_id || "").toLowerCase().trim()];
    for (const bienId of bienIds) {
      if (!bienId) continue;
      if (!directsByBien[bienId]) directsByBien[bienId] = [];
      directsByBien[bienId].push(r);
    }
  }

  // Fetch tous les iCal en parallèle pour les biens qui ont des résas directes actives
  const biensToCheck = Object.keys(directsByBien).filter((id) => icalUrls[id]);

  if (biensToCheck.length === 0) {
    return { findings: crossFindings, biensChecked: 0, icalEventsParsed: 0 };
  }

  const fetchPromises = biensToCheck.map(async (bienId) => {
    const urls = icalUrls[bienId];
    const [airbnbText, bookingText] = await Promise.all([
      fetchIcalText(urls.airbnb),
      fetchIcalText(urls.booking),
    ]);
    return { bienId, airbnb: parseIcalEvents(airbnbText), booking: parseIcalEvents(bookingText) };
  });

  const icalResults = await Promise.all(fetchPromises);
  const icalEventsParsed = icalResults.reduce((sum, r) => sum + r.airbnb.length + r.booking.length, 0);

  // Comparer les résas directes vs les événements iCal par bien
  for (const { bienId, airbnb, booking } of icalResults) {
    const directs = directsByBien[bienId] || [];
    const icalEvents = [
      ...airbnb.map((e) => ({ ...e, canal: "airbnb" })),
      ...booking.map((e) => ({ ...e, canal: "booking" })),
    ];

    for (const direct of directs) {
      for (const ical of icalEvents) {
        if (!overlaps(direct.checkin, direct.checkout, ical.checkin, ical.checkout)) continue;

        const msg =
          `Double-booking cross-canal · ${bienId} · Direct (${direct.voyageur || direct.id}) ` +
          `${direct.checkin}→${direct.checkout} chevauche ${ical.canal} ` +
          `"${ical.summary || ical.uid}" ${ical.checkin}→${ical.checkout}`;

        crossFindings.push({
          rule:     "cross-canal-overlap",
          severity: "critique",
          message:  msg,
          source:   "cross-canal",
          bienId,
          direct:   { id: direct.id, checkin: direct.checkin, checkout: direct.checkout, voyageur: direct.voyageur },
          ical:     { uid: ical.uid, canal: ical.canal, checkin: ical.checkin, checkout: ical.checkout, summary: ical.summary },
        });
      }
    }
  }

  return { findings: crossFindings, biensChecked: biensToCheck.length, icalEventsParsed };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }
  const dry = url.searchParams.get("dry") === "1";
  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 500);

  let reservations = [];
  try {
    // Migration idempotente — cf. cancel-booking.js. Exclut les résas annulées : une
    // annulation ne doit plus déclencher de faux positif double-booking.
    try { await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN status TEXT DEFAULT 'confirmed'`).run(); } catch { /* déjà présente */ }
    const { results } = await db.prepare(
      "SELECT payment_intent_id AS id, bien_nom AS bien, bien_id, group_biens, voyageur, total, depot, checkin, checkout, canal FROM direct_bookings WHERE status IS NULL OR status != 'cancelled'"
    ).all();
    reservations = results || [];
  } catch (e) {
    return json({ ok: false, error: "lecture direct_bookings: " + e.message });
  }

  const findings = checkReservations(reservations, { validBiens: VALID_BIENS });

  // ── Check 4 : double-booking cross-canaux (D1 directes vs iCal) ──
  let crossCanalResult = { findings: [], warning: null, biensChecked: 0, icalEventsParsed: 0 };
  try {
    crossCanalResult = await checkCrossCanal(env, reservations);
    findings.push(...crossCanalResult.findings);
  } catch (e) {
    console.warn("[coherence/cross-canal] Erreur non bloquante:", e.message);
    crossCanalResult = { findings: [], warning: "error: " + e.message, biensChecked: 0, icalEventsParsed: 0 };
  }

  const critical = findings.filter((f) => f.severity === "critique");

  if (!dry && findings.length) {
    try {
      await ensureClientErrorsTable(db);
      for (const f of findings) {
        const path = "/coherence/" + (f.rule || "");
        const id = await clientErrorFingerprint("coherence", f.message, path);
        const existing = await db.prepare("SELECT id FROM client_errors WHERE id=?").bind(id).first();
        if (existing) {
          await db.prepare(
            "UPDATE client_errors SET count=count+1, last_seen=unixepoch(), severity=?, " +
            "status=CASE WHEN status IN ('ignored','fixed') THEN status ELSE 'new' END WHERE id=?"
          ).bind(f.severity, id).run();
        } else {
          await db.prepare(
            "INSERT INTO client_errors (id, kind, message, path, severity, status) VALUES (?,?,?,?,?, 'new')"
          ).bind(id, "coherence", String(f.message).slice(0, 600), path, f.severity).run();
        }
      }
    } catch (e) {
      return json({ ok: false, error: "écriture inbox: " + e.message, findings: findings.length });
    }
    if (critical.length && env.NTFY_TOPIC) {
      try {
        await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
          method: "POST",
          headers: { Title: `⚠️ Cohérence : ${critical.length} alerte(s) critique(s)`, Priority: "high", Tags: "warning,rotating_light" },
          body: critical.map((c) => c.message).join("\n").slice(0, 800),
        });
      } catch { /* ntfy best-effort */ }
    }
  }

  // biensChecked/icalEventsParsed permettent de distinguer "rien trouvé" (check actif, 0
  // chevauchement) de "le check n'a rien pu comparer" (secrets ICAL_* absents/cassés, aucune
  // résa directe active) — avant ce fix, `checked` était toujours mathématiquement égal à
  // `overlaps`, rendant les deux cas indiscernables (trouvé en vérification live 2026-07-16).
  const cross_canal = {
    biensChecked: crossCanalResult.biensChecked ?? 0,
    icalEventsParsed: crossCanalResult.icalEventsParsed ?? 0,
    overlaps: crossCanalResult.findings.length,
    ...(crossCanalResult.warning ? { warning: crossCanalResult.warning } : {}),
    ...(dry ? { items: crossCanalResult.findings } : {}),
  };

  return json({
    ok: true,
    checked: reservations.length,
    findings: findings.length,
    critical: critical.length,
    cross_canal,
    ...(dry ? { items: findings } : {}),
  });
}
