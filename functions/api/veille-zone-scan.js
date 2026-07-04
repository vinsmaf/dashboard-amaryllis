// Cloudflare Pages Function — GET/POST /api/veille-zone-scan
// veille-005 : détecte les NOUVEAUX listings apparus dans la zone (diff snapshot
// S vs S-1) — distinct de fc-competitors-scan.js qui ne fait que RE-SCANNER le
// prix des 56 concurrents déjà identifiés (veille-001). Ici on scrape une page
// de RECHERCHE Airbnb par zone (pas une fiche connue) pour découvrir des
// annonces qu'on ne suit pas encore. Logique de diff pure testée dans
// src/utils/zoneListingsDiff.js.
//
// Auth : ?secret=POSTSTAY_SECRET (cron) ou Bearer admin.
// GET  : liste le dernier scan par zone (lecture seule).
// POST : lance un scan pour toutes les zones — stocke le snapshot du jour, diffe
//        contre le snapshot précédent, écrit une action agent_actions par
//        nouveau listing (jamais au 1er scan d'une zone : pas de baseline à diffuser).
//        body: { dry: true } pour scraper sans persister.

import { verifyBearer } from "./_adminauth.js";
import { diffNewListings } from "../../src/utils/zoneListingsDiff.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json" },
});

// Zones = celles identifiées par veille-001 (concurrents directs MQ). Nogent
// délibérément exclu du v1 (dynamique de marché différente, RM-22) — ajoutable
// plus tard en étendant ce tableau, sans changer la logique.
const ZONES = [
  { key: "sainte-luce", platform: "airbnb", url: "https://www.airbnb.fr/s/Sainte-Luce--Martinique/homes" },
  { key: "trois-ilets", platform: "airbnb", url: "https://www.airbnb.fr/s/Trois-Ilets--Martinique/homes" },
];

async function ensureTable(db) {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS rm_zone_snapshots (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
    "zone TEXT NOT NULL," +
    "platform TEXT NOT NULL," +
    "listing_id TEXT NOT NULL," +
    "title TEXT," +
    "price_cents INTEGER," +
    "rating REAL," +
    "reviews_count INTEGER," +
    "snapshot_date TEXT NOT NULL," +
    "created_at INTEGER NOT NULL," +
    "UNIQUE(zone, listing_id, snapshot_date)" +
    ")"
  );
  await db.exec("CREATE INDEX IF NOT EXISTS idx_zone_snap_date ON rm_zone_snapshots(zone, snapshot_date)");
}

async function scrapeZone(apiKey, zone) {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      url: zone.url,
      formats: ["json"],
      jsonOptions: {
        prompt: "Extrait la liste des logements affichés sur cette page de résultats de recherche Airbnb. Pour chaque logement : titre, prix par nuit affiché, note, nombre d'avis, identifiant numérique du logement (visible dans un lien /rooms/XXXXXXXX).",
        schema: {
          type: "object",
          properties: {
            listings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  price_per_night: { type: "number" },
                  rating: { type: "number" },
                  reviews_count: { type: "number" },
                  listing_id: { type: "string" },
                },
              },
            },
          },
        },
      },
      proxy: "stealth",
      waitFor: 6000,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firecrawl ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const listings = data?.data?.json?.listings || [];
  // Défensif : un listing sans id exploitable ne peut pas être diffé d'une semaine à l'autre.
  return listings.filter(l => l && l.listing_id);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);
  await ensureTable(db);

  const out = {};
  for (const z of ZONES) {
    const { results } = await db.prepare(
      "SELECT DISTINCT snapshot_date FROM rm_zone_snapshots WHERE zone=? ORDER BY snapshot_date DESC LIMIT 2"
    ).bind(z.key).all();
    out[z.key] = { dates: (results || []).map(r => r.snapshot_date) };
  }
  return json({ ok: true, zones: out });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);
  if (!env.FIRECRAWL_API_KEY) return json({ error: "FIRECRAWL_API_KEY absente" }, 500);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);
  await ensureTable(db);

  const body = await request.json().catch(() => ({}));
  const dry = !!body.dry;
  const today = new Date().toISOString().slice(0, 10);

  const results = {};
  for (const z of ZONES) {
    try {
      const listings = await scrapeZone(env.FIRECRAWL_API_KEY, z);

      // Snapshot précédent (avant aujourd'hui) pour diff — s'il n'y en a aucun,
      // c'est le 1er scan de cette zone : on établit juste la baseline, aucune
      // alerte (tout serait "nouveau" à tort, ce n'est pas un signal réel).
      const { results: prevDates } = await db.prepare(
        "SELECT DISTINCT snapshot_date FROM rm_zone_snapshots WHERE zone=? AND snapshot_date < ? ORDER BY snapshot_date DESC LIMIT 1"
      ).bind(z.key, today).all();
      const prevDate = prevDates?.[0]?.snapshot_date || null;

      let prevIds = new Set();
      if (prevDate) {
        const { results: prevRows } = await db.prepare(
          "SELECT listing_id FROM rm_zone_snapshots WHERE zone=? AND snapshot_date=?"
        ).bind(z.key, prevDate).all();
        prevIds = new Set((prevRows || []).map(r => r.listing_id));
      }

      const newListings = diffNewListings(listings, prevDate ? prevIds : null);

      if (!dry) {
        const stmts = listings.map(l => db.prepare(
          "INSERT INTO rm_zone_snapshots (zone, platform, listing_id, title, price_cents, rating, reviews_count, snapshot_date, created_at) " +
          "VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(zone, listing_id, snapshot_date) DO NOTHING"
        ).bind(z.key, z.platform, l.listing_id, l.title || "", Math.round((l.price_per_night || 0) * 100), l.rating || null, l.reviews_count || null, today, Date.now()));
        if (stmts.length) await db.batch(stmts);

        // Une action agent_actions par nouveau listing — visible dans le backlog
        // existant que Vincent consulte déjà, pas un nouveau canal à surveiller.
        for (const l of newListings) {
          const priceTxt = l.price_per_night ? `${Math.round(l.price_per_night)}€/nuit` : "prix non affiché";
          await db.prepare(
            "INSERT INTO agent_actions (id, agent, agent_label, agent_emoji, category, action, priority, effort, status, notes, last_analyzed, created_at, updated_at, risk) " +
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
          ).bind(
            `veille-zone-${z.key}-${l.listing_id}`.slice(0, 64),
            "veille-concurrentielle", "Veille Conc.", "🔭", "veille",
            `Nouveau listing détecté zone ${z.key} : "${l.title}" (${priceTxt}, ${l.rating || "?"}★/${l.reviews_count || 0} avis) — airbnb.fr/rooms/${l.listing_id}`,
            "moyenne", "15min", "backlog", null, Date.now(), Date.now(), Date.now(), "review"
          ).run().catch(() => {}); // ON CONFLICT silencieux si déjà inséré (id stable = anti-doublon)
        }
      }

      results[z.key] = { scanned: listings.length, isBaseline: !prevDate, newFound: newListings.length, new: newListings.map(l => ({ title: l.title, listing_id: l.listing_id, price_per_night: l.price_per_night })) };
    } catch (e) {
      results[z.key] = { error: e.message };
    }
  }

  return json({ ok: true, dry, date: today, zones: results });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
