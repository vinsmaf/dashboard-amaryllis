// Cloudflare Pages Function — /api/voyageur-feedback
// voyageur-001 : extraction + stockage des avis Airbnb des biens en D1.
//
// Conçu en 2 temps pour respecter les contraintes de Vincent :
//   • GET  /api/voyageur-feedback                → liste les avis stockés (admin auth)
//   • GET  /api/voyageur-feedback?action=stats   → agrégats (note moy, nb par bien)
//   • POST /api/voyageur-feedback?action=ingest&secret=POSTSTAY_SECRET
//          → DÉCLENCHE le scrape Apify (DÉPENSE DE CRÉDITS) puis stocke les avis.
//            Réservé : nécessite le secret. Ne tourne JAMAIS tout seul (pas de cron).
//
// RGPD (minimisation, registre des traitements) : on ne stocke QUE
//   prénom (tronqué), note, texte, date, langue, bien. Aucun nom complet,
//   aucun identifiant Airbnb du voyageur, aucune photo de profil.
//
// Listing IDs Airbnb (publics, présents dans l'URL d'annonce). Iguana = bail
// long, pas d'annonce active → absent.
// IDs réels extraits des URLs iCal Airbnb (/api/get-config). Iguana = bail long → exclu.
const AIRBNB_LISTINGS = {
  amaryllis:  "54269844",
  zandoli:    "792768220924504884",
  geko:       "1263155865459755724",
  mabouya:    "1046596752160926069",
  schoelcher: "24242415",
  nogent:     "22600160",
};

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://villamaryllis.com",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

async function ensureTable(db) {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS voyageur_feedback (" +
    "id TEXT PRIMARY KEY," +              // hash stable : bien_id + date + prénom (anti-doublon)
    "bien_id TEXT NOT NULL," +
    "source TEXT NOT NULL DEFAULT 'airbnb'," +
    "prenom TEXT," +                      // prénom seul (RGPD)
    "rating INTEGER," +                   // 1..5
    "review_text TEXT," +
    "review_date TEXT," +                 // YYYY-MM ou YYYY-MM-DD
    "lang TEXT," +
    "created_at TEXT DEFAULT (datetime('now'))" +
    ")"
  );
  await db.exec("CREATE INDEX IF NOT EXISTS idx_vf_bien ON voyageur_feedback(bien_id)");
}

// Hash déterministe court (anti-doublon sans dépendance crypto lourde)
async function rowId(bienId, date, prenom, text) {
  const data = `${bienId}|${date}|${prenom}|${(text || "").slice(0, 40)}`;
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(data));
  return [...new Uint8Array(buf)].slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
}

function firstNameOnly(name) {
  if (!name) return null;
  // "Marie D." / "Jean-Pierre" → garde le 1er token, retire initiales de nom
  return String(name).trim().split(/\s+/)[0].slice(0, 40);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return onRequestOptions();
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 500);
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "";

  await ensureTable(db);

  // ── GET : lecture (admin) ────────────────────────────────────────────────
  if (request.method === "GET") {
    // stats : public-safe (agrégats, pas de PII)
    if (action === "stats") {
      const { results } = await db.prepare(
        "SELECT bien_id, COUNT(*) n, ROUND(AVG(rating),2) avg_rating, MAX(review_date) last_review " +
        "FROM voyageur_feedback GROUP BY bien_id"
      ).all();
      const total = results.reduce((s, r) => s + r.n, 0);
      return json({ ok: true, total, by_bien: results });
    }
    // liste détaillée : admin uniquement
    const { ok } = await verifyBearer(request, env);
    if (!ok && (env.ADMIN_PWD || env.ADMIN_PASSWORD)) return json({ error: "Non autorisé" }, 401);
    const bien = url.searchParams.get("bien");
    const q = bien
      ? db.prepare("SELECT * FROM voyageur_feedback WHERE bien_id=? ORDER BY review_date DESC LIMIT 500").bind(bien)
      : db.prepare("SELECT * FROM voyageur_feedback ORDER BY review_date DESC LIMIT 500");
    const { results } = await q.all();
    return json({ ok: true, count: results.length, reviews: results });
  }

  // ── POST ?action=ingest : SCRAPE PAYANT (Apify) ──────────────────────────
  if (request.method === "POST" && action === "ingest") {
    const secret = url.searchParams.get("secret");
    if (!env.POSTSTAY_SECRET || secret !== env.POSTSTAY_SECRET) return json({ error: "secret invalide" }, 401);
    if (!env.APIFY_TOKEN) return json({ error: "APIFY_TOKEN absent" }, 500);

    const body = await request.json().catch(() => ({}));
    // Permet de cibler 1 bien (dry-run / test) ou tous
    const targets = body.bien ? { [body.bien]: AIRBNB_LISTINGS[body.bien] } : AIRBNB_LISTINGS;
    if (Object.values(targets).some(v => !v)) return json({ error: "bien inconnu" }, 400);

    // Acteur Apify avis Airbnb (tri/dataset selon l'acteur configuré côté compte)
    const ACTOR = body.actor || "tri_angle~airbnb-reviews-scraper";
    const startUrls = Object.values(targets).map(id => ({ url: `https://www.airbnb.com/rooms/${id}` }));

    // Démarre le run (asynchrone) — on NE bloque pas 3 min ici.
    const runRes = await fetch(`https://api.apify.com/v2/acts/${encodeURIComponent(ACTOR)}/runs?token=${env.APIFY_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startUrls, maxReviews: body.maxReviews || 50 }),
    });
    const run = await runRes.json().catch(() => ({}));
    if (!runRes.ok) return json({ error: "Apify run échoué", detail: run }, 502);

    return json({
      ok: true,
      message: "Scrape Apify démarré. Récupérer le dataset quand le run est 'SUCCEEDED'.",
      runId: run?.data?.id,
      datasetId: run?.data?.defaultDatasetId,
      poll: `/api/voyageur-feedback?action=collect&runId=${run?.data?.id}&secret=...`,
      targets: Object.keys(targets),
    });
  }

  // ── GET ?action=collect&runId= : récupère le dataset d'un run terminé et stocke
  if (request.method === "GET" && action === "collect") {
    const secret = url.searchParams.get("secret");
    if (!env.POSTSTAY_SECRET || secret !== env.POSTSTAY_SECRET) return json({ error: "secret invalide" }, 401);
    const runId = url.searchParams.get("runId");
    if (!runId) return json({ error: "runId requis" }, 400);
    const r = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${env.APIFY_TOKEN}`);
    const meta = await r.json().catch(() => ({}));
    const status = meta?.data?.status;
    if (status !== "SUCCEEDED") return json({ ok: false, status, message: "Run pas encore terminé" });
    const dsId = meta?.data?.defaultDatasetId;
    const items = await (await fetch(`https://api.apify.com/v2/datasets/${dsId}/items?token=${env.APIFY_TOKEN}&clean=true`)).json().catch(() => []);

    // Mapping listingId → bienId
    const idToBien = Object.fromEntries(Object.entries(AIRBNB_LISTINGS).map(([b, id]) => [String(id), b]));
    let stored = 0;
    for (const it of (Array.isArray(items) ? items : [])) {
      const lid = String(it.listingId || it.roomId || "");
      const bienId = idToBien[lid] || url.searchParams.get("bien") || "inconnu";
      const prenom = firstNameOnly(it.reviewer || it.author || it.name);
      const rating = Number(it.rating || it.score || 0) || null;
      const text = (it.text || it.comment || it.review || "").slice(0, 2000);
      const date = (it.createdAt || it.date || "").slice(0, 10) || null;
      const lang = it.language || it.lang || null;
      if (!text && !rating) continue;
      const id = await rowId(bienId, date, prenom, text);
      await db.prepare(
        "INSERT INTO voyageur_feedback (id,bien_id,source,prenom,rating,review_text,review_date,lang) " +
        "VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING"
      ).bind(id, bienId, "airbnb", prenom, rating, text, date, lang).run();
      stored++;
    }
    return json({ ok: true, stored, fetched: Array.isArray(items) ? items.length : 0 });
  }

  return json({ error: "Méthode/action non supportée" }, 405);
}
