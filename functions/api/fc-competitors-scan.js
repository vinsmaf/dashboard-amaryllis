// GET  /api/fc-competitors-scan?property_id=xxx         → état du dernier scan (admin)
// POST /api/fc-competitors-scan                         → lance un scan Firecrawl (admin)
//   body: { property_id, listing_ids?: [], dry?: true }
//
// Remplace l'acteur Apify pour la veille prix concurrents.
// Utilise l'API REST Firecrawl (secret FIRECRAWL_API_KEY) en proxy stealth.
// Snapshots stockés en D1 rm_competitor_snapshots (source='api').
// Recalcul des signaux marché déclenché en fin de scan.

import { verifyBearer } from "./_adminauth.js";

const FIRECRAWL_SCRAPE = "https://api.firecrawl.dev/v1/scrape";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const PRICE_SCHEMA = {
  type: "object",
  properties: {
    price_per_night: { type: "number", description: "Prix affiché par nuit en euros (hors frais de service Airbnb)" },
    rating:          { type: "number", description: "Note moyenne sur 5 étoiles" },
    reviews_count:   { type: "number", description: "Nombre total d'avis" },
    capacity:        { type: "number", description: "Capacité maximale en personnes" },
    title:           { type: "string", description: "Titre du listing" },
  },
};

async function scrapeListing(apiKey, url) {
  const res = await fetch(FIRECRAWL_SCRAPE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["json"],
      jsonOptions: {
        prompt: "Page de logement Airbnb ou Booking. Extrais : prix par nuit en euros (le prix de base affiché, sans frais de service), note sur 5, nombre d'avis, capacité en personnes, titre. Si le prix n'est pas visible, retourne null.",
        schema: PRICE_SCHEMA,
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
  return data?.data?.json || null;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

// GET — état du scan du jour
export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);

  const url = new URL(request.url);
  const property_id = url.searchParams.get("property_id");
  if (!property_id) return json({ error: "property_id requis" }, 400);

  const [listingsRes, snapsRes] = await Promise.all([
    db.prepare(
      `SELECT id, name, url, platform, review_score, review_count FROM rm_competitor_listings WHERE property_id = ? AND is_active = 1 ORDER BY name`
    ).bind(property_id).all(),
    db.prepare(
      `SELECT listing_id, price_cents, source, created_at FROM rm_competitor_snapshots WHERE snapshot_date = date('now') ORDER BY created_at DESC`
    ).all(),
  ]);

  const snapMap = {};
  for (const s of (snapsRes.results || [])) {
    if (!snapMap[s.listing_id]) snapMap[s.listing_id] = s;
  }

  const listings = (listingsRes.results || []).map(l => ({
    ...l,
    scanned_today: !!snapMap[l.id],
    last_price: snapMap[l.id]?.price_cents ? snapMap[l.id].price_cents / 100 : null,
    last_source: snapMap[l.id]?.source || null,
  }));

  return json({
    property_id,
    date: new Date().toISOString().slice(0, 10),
    total_competitors: listings.length,
    scanned_today: listings.filter(l => l.scanned_today).length,
    listings,
  });
}

// POST — lance le scan
export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);

  const apiKey = env.FIRECRAWL_API_KEY;
  if (!apiKey) return json({ error: "FIRECRAWL_API_KEY absent — ajouter dans Cloudflare Pages env vars" }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const { property_id, listing_ids, dry = false } = body;
  if (!property_id) return json({ error: "property_id requis" }, 400);

  // Récupérer les concurrents actifs avec URL
  let q = `SELECT id, name, url, platform FROM rm_competitor_listings WHERE property_id = ? AND is_active = 1 AND url IS NOT NULL AND url != ''`;
  const params = [property_id];
  if (Array.isArray(listing_ids) && listing_ids.length) {
    q += ` AND id IN (${listing_ids.map(() => "?").join(",")})`;
    params.push(...listing_ids);
  }

  const { results: listings } = await db.prepare(q).bind(...params).all();

  if (!listings?.length) {
    return json({ ok: true, scanned: 0, message: "Aucun concurrent actif avec URL" });
  }

  if (dry) {
    return json({
      ok: true, dry: true,
      would_scan: listings.map(l => ({ id: l.id, name: l.name, url: l.url })),
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  const results = [];

  // Scan séquentiel (Firecrawl stealth → pas de parallelisation agressive)
  for (const listing of listings) {
    try {
      const extracted = await scrapeListing(apiKey, listing.url);
      const price = extracted?.price_per_night;
      const price_cents = price && price > 5 ? Math.round(price * 100) : null;
      const confidence = price_cents ? "medium" : "low";

      await db.prepare(`
        INSERT INTO rm_competitor_snapshots
          (id, listing_id, snapshot_date, observed_at, price_cents, is_available, source, confidence, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'api', ?, ?)
        ON CONFLICT DO NOTHING
      `).bind(
        crypto.randomUUID(), listing.id, today, now,
        price_cents, price_cents ? 1 : null,
        confidence, now
      ).run();

      // Mise à jour de la fiche concurrent si on a récupéré note + avis
      if (extracted?.rating || extracted?.reviews_count) {
        await db.prepare(
          `UPDATE rm_competitor_listings SET review_score = ?, review_count = ?, updated_at = ? WHERE id = ?`
        ).bind(
          extracted.rating ?? null,
          extracted.reviews_count ?? null,
          now, listing.id
        ).run();
      }

      results.push({
        id: listing.id,
        name: listing.name,
        price_per_night: price || null,
        rating: extracted?.rating || null,
        status: "ok",
      });
    } catch (err) {
      results.push({ id: listing.id, name: listing.name, status: "error", error: err.message });
    }
  }

  // Recalcul des signaux marché (non-bloquant)
  context.waitUntil(
    (async () => {
      try {
        const base = new URL(request.url);
        base.pathname = "/api/rm-competitors/recalculate-signals";
        await fetch(base.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": request.headers.get("Authorization") || "",
          },
          body: JSON.stringify({ property_id, horizon_days: 30 }),
        });
      } catch (_) { /* non-bloquant */ }
    })()
  );

  const ok_count = results.filter(r => r.status === "ok").length;
  const err_count = results.filter(r => r.status === "error").length;

  return json({
    ok: true,
    date: today,
    property_id,
    scanned: ok_count,
    errors: err_count,
    results,
  });
}
