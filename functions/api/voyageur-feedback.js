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
// Nogent retiré : annonce Airbnb supprimée (géré via Beds24/Booking, pas Airbnb).
// Iguana absent : bail long, pas d'annonce active.
const AIRBNB_LISTINGS = {
  amaryllis:  "54269844",
  zandoli:    "792768220924504884",
  geko:       "1263155865459755724",
  mabouya:    "1046596752160926069",
  schoelcher: "24242415",
};

import { verifyBearer } from "./_adminauth.js";
import { callLLM } from "./_llm.js";
import { classifyReview, buildReviewReplyPrompt } from "../../src/utils/reviewClassification.js";
import { buildThemeCodingPrompt, parseThemeCodingResponse } from "../../src/utils/reviewThemes.js";
import { BIENS } from "./_biens.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://villamaryllis.com",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
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
    "hidden INTEGER NOT NULL DEFAULT 0," + // modération : 1 = masqué du site public
    "created_at TEXT DEFAULT (datetime('now'))" +
    ")"
  );
  await db.exec("CREATE INDEX IF NOT EXISTS idx_vf_bien ON voyageur_feedback(bien_id)");
  // Migration : ajoute la colonne hidden si la table existait déjà (sinon no-op).
  try { await db.exec("ALTER TABLE voyageur_feedback ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0"); } catch {}
  // Migration — Projet Délégation Vague 3 (réponses aux avis, dry-run) : classification
  // + brouillon de réponse générés par LLM, jamais auto-publiés (pas d'API d'écriture
  // Google/Airbnb branchée). draft_status : 'none' (pas généré) | 'pending' (à copier) |
  // 'sent' (posté manuellement par Vincent) | 'dismissed' (pas pertinent).
  try { await db.exec("ALTER TABLE voyageur_feedback ADD COLUMN classification TEXT"); } catch {}
  try { await db.exec("ALTER TABLE voyageur_feedback ADD COLUMN draft_reply TEXT"); } catch {}
  try { await db.exec("ALTER TABLE voyageur_feedback ADD COLUMN draft_status TEXT NOT NULL DEFAULT 'none'"); } catch {}
  try { await db.exec("ALTER TABLE voyageur_feedback ADD COLUMN draft_generated_at TEXT"); } catch {}
  // Migration — voyageur-002 : codage thématique (7 thèmes fixes, src/utils/reviewThemes.js).
  // JSON array en texte (ex. '["piscine","reco"]'), NULL tant que pas codé.
  try { await db.exec("ALTER TABLE voyageur_feedback ADD COLUMN themes TEXT"); } catch {}
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
    // stats : public-safe (agrégats, pas de PII). Exclut les avis masqués.
    if (action === "stats") {
      const { results } = await db.prepare(
        "SELECT bien_id, COUNT(*) n, ROUND(AVG(rating),2) avg_rating, MAX(review_date) last_review " +
        "FROM voyageur_feedback WHERE hidden=0 GROUP BY bien_id"
      ).all();
      const total = results.reduce((s, r) => s + r.n, 0);
      return json({ ok: true, total, by_bien: results });
    }

    // public : avis individuels NON masqués pour un bien — SANS auth (RGPD-safe :
    // prénom/note/texte/date/langue seulement). Alimente les fiches du site public.
    if (action === "public") {
      const bien = url.searchParams.get("bien");
      if (!bien) return json({ error: "bien requis" }, 400);
      const limit = Math.min(Number(url.searchParams.get("limit")) || 30, 100);
      const { results } = await db.prepare(
        "SELECT prenom, rating, review_text, review_date, lang FROM voyageur_feedback " +
        "WHERE bien_id=? AND hidden=0 AND review_text IS NOT NULL AND review_text!='' " +
        "ORDER BY review_date DESC LIMIT ?"
      ).bind(bien, limit).all();
      return json({ ok: true, bien, count: results.length, reviews: results });
    }

    // preflight : diagnostic LECTURE SEULE (aucun run, aucun crédit dépensé).
    // Valide le token Apify, résout l'acteur et renvoie les vrais champs d'input
    // attendus (depuis le build de l'acteur). Sert à débugger les 502 d'ingest.
    if (action === "preflight") {
      const secret = url.searchParams.get("secret");
      const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
      const { ok: adminOk } = await verifyBearer(request, env);
      if (!secretOk && !adminOk) return json({ error: "Non autorisé (secret ou token admin requis)" }, 401);

      const diag = { apify_token_present: !!env.APIFY_TOKEN };
      if (!env.APIFY_TOKEN) return json({ ok: false, diag, hint: "APIFY_TOKEN absent côté serveur" });
      const tok = env.APIFY_TOKEN;

      // 1) Validité du token + plan/usage
      try {
        const meRes = await fetch(`https://api.apify.com/v2/users/me?token=${tok}`);
        diag.token_status = meRes.status;
        diag.token_ok = meRes.ok;
        const me = await meRes.json().catch(() => ({}));
        diag.username = me?.data?.username || null;
        diag.plan = me?.data?.plan?.id || null;
        const u = me?.data?.monthlyUsage || me?.data?.usage || null;
        if (u) diag.monthlyUsageUsd = u?.totalUsageCreditsUsd ?? u?.monthlyUsageUsd ?? null;
        diag.isPaying = me?.data?.isPaying ?? null;
      } catch (e) { diag.token_error = String(e && e.message || e); }

      // 2) Résolution de l'acteur + champs d'input réels (depuis le build par défaut)
      const ACTOR = (url.searchParams.get("actor") || "tri_angle~airbnb-reviews-scraper").replace("/", "~");
      diag.actor = ACTOR;
      try {
        const aRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR}?token=${tok}`);
        diag.actor_status = aRes.status;
        diag.actor_ok = aRes.ok;
        const a = await aRes.json().catch(() => ({}));
        diag.actor_id = a?.data?.id || null;
        diag.actor_title = a?.data?.title || null;
        const buildId = a?.data?.taggedBuilds?.latest?.buildId || a?.data?.defaultRunOptions?.build || null;
        diag.buildId = buildId;
        if (buildId) {
          const bRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/builds/${buildId}?token=${tok}`);
          const b = await bRes.json().catch(() => ({}));
          let schema = b?.data?.inputSchema;
          if (typeof schema === "string") { try { schema = JSON.parse(schema); } catch {} }
          if (schema && schema.properties) {
            diag.input_fields = Object.keys(schema.properties);
            diag.input_required = schema.required || [];
            diag.input_url_field = Object.keys(schema.properties).find(k => /url/i.test(k)) || null;
          }
        }
      } catch (e) { diag.actor_error = String(e && e.message || e); }

      return json({ ok: true, diag });
    }

    // runstatus : LECTURE SEULE rapide — statut d'un run + nb d'items du dataset.
    // Un seul appel Apify, pas de stockage. Sert à diagnostiquer un collect lent.
    if (action === "runstatus") {
      const { ok: adminOk } = await verifyBearer(request, env);
      const secret = url.searchParams.get("secret");
      if (!adminOk && !(env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET)) return json({ error: "Non autorisé" }, 401);
      const runId = url.searchParams.get("runId");
      const r = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${env.APIFY_TOKEN}`);
      const meta = await r.json().catch(() => ({}));
      const d = meta?.data || {};
      return json({
        ok: true, status: d.status, startedAt: d.startedAt, finishedAt: d.finishedAt,
        datasetId: d.defaultDatasetId, itemCount: d.stats?.itemCount ?? null,
        statusMessage: d.statusMessage || null,
      });
    }

    // collect : récupère le dataset d'un run Apify terminé et le stocke
    if (action === "collect") {
      const secret = url.searchParams.get("secret");
      const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
      const { ok: adminOk } = await verifyBearer(request, env);
      if (!secretOk && !adminOk) return json({ error: "Non autorisé (secret ou token admin requis)" }, 401);
      const runId = url.searchParams.get("runId");
      if (!runId) return json({ error: "runId requis" }, 400);
      const r = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${env.APIFY_TOKEN}`);
      const meta = await r.json().catch(() => ({}));
      const status = meta?.data?.status;
      if (status !== "SUCCEEDED") return json({
        ok: false, status,
        message: status === "FAILED" ? "Run Apify échoué" : "Run pas encore terminé",
        statusMessage: meta?.data?.statusMessage || null,
        exitCode: meta?.data?.exitCode ?? null,
      });
      const dsId = meta?.data?.defaultDatasetId;
      // fields= : on ne récupère QUE les champs utiles → payload réduit (datasets de
      // plusieurs centaines d'avis sinon trop lourds → dépassement du temps Function).
      const fields = "startUrl,reviewer,rating,text,createdAt,language";
      const items = await (await fetch(
        `https://api.apify.com/v2/datasets/${dsId}/items?token=${env.APIFY_TOKEN}&clean=true&fields=${fields}`
      )).json().catch(() => []);
      const idToBien = Object.fromEntries(Object.entries(AIRBNB_LISTINGS).map(([b, id]) => [String(id), b]));
      const INSERT = "INSERT INTO voyageur_feedback (id,bien_id,source,prenom,rating,review_text,review_date,lang) " +
                     "VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING";
      const stmts = [];
      for (const it of (Array.isArray(items) ? items : [])) {
        // Listing : l'acteur expose startUrl (.../rooms/ID). it.id = ID de l'AVIS (≠ listing).
        const lid = (String(it.startUrl || it.url || "").match(/rooms\/(\d+)/) || [])[1]
          || String(it.listingId || it.roomId || "");
        const bienId = idToBien[lid] || url.searchParams.get("bien") || "inconnu";
        // reviewer = objet { firstName, ... } (RGPD : on ne garde que le prénom).
        const rv = it.reviewer;
        const reviewerName = (rv && typeof rv === "object")
          ? (rv.firstName || rv.hostName)
          : (rv || it.author || it.name || it.reviewerName);
        const prenom = firstNameOnly(reviewerName);
        const rating = Number(it.rating || it.score || 0) || null;
        const text = (it.text || it.comment || it.review || it.reviewText || "").slice(0, 2000);
        const date = (it.createdAt || it.date || it.reviewedAt || "").slice(0, 10) || null;
        const lang = it.language || it.lang || null;
        if (!text && !rating) continue;
        const id = await rowId(bienId, date, prenom, text);
        stmts.push(db.prepare(INSERT).bind(id, bienId, "airbnb", prenom, rating, text, date, lang));
      }
      // Écriture groupée par lots de 50 (db.batch = 1 aller-retour/lot, sinon ~300
      // INSERT séquentiels dépassent la limite de temps de la Function).
      let stored = 0;
      for (let i = 0; i < stmts.length; i += 50) {
        await db.batch(stmts.slice(i, i + 50));
        stored += Math.min(50, stmts.length - i);
      }
      return json({ ok: true, stored, fetched: Array.isArray(items) ? items.length : 0 });
    }

    // liste détaillée : admin uniquement
    // ?from=YYYY-MM-DD & ?to=YYYY-MM-DD : filtre par review_date — sans ça, un
    // rapport "trimestriel" tire silencieusement sur TOUT l'historique disponible
    // (piège vécu 2026-07-04 : un rapport "Q1 2026" s'est avéré porter sur 2018-2026).
    const { ok } = await verifyBearer(request, env);
    if (!ok && (env.ADMIN_PWD || env.ADMIN_PASSWORD)) return json({ error: "Non autorisé" }, 401);
    const bien = url.searchParams.get("bien");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const conds = [];
    const params = [];
    if (bien) { conds.push("bien_id=?"); params.push(bien); }
    if (from) { conds.push("review_date>=?"); params.push(from); }
    if (to) { conds.push("review_date<=?"); params.push(to); }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const q = db.prepare(`SELECT * FROM voyageur_feedback ${where} ORDER BY review_date DESC LIMIT 500`).bind(...params);
    const { results } = await q.all();
    return json({ ok: true, count: results.length, filters: { bien: bien || null, from: from || null, to: to || null }, reviews: results });
  }

  // ── POST ?action=ingest : SCRAPE PAYANT (Apify) ──────────────────────────
  if (request.method === "POST" && action === "ingest") {
    // Autorisé via POSTSTAY_SECRET (cron) OU token admin signé (action manuelle au dashboard).
    const secret = url.searchParams.get("secret");
    const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
    const { ok: adminOk } = await verifyBearer(request, env);
    if (!secretOk && !adminOk) return json({ error: "Non autorisé (secret ou token admin requis)" }, 401);
    if (!env.APIFY_TOKEN) return json({ error: "APIFY_TOKEN absent" }, 500);

    const body = await request.json().catch(() => ({}));
    // Permet de cibler 1 bien (dry-run / test) ou tous
    const targets = body.bien ? { [body.bien]: AIRBNB_LISTINGS[body.bien] } : AIRBNB_LISTINGS;
    if (Object.values(targets).some(v => !v)) return json({ error: "bien inconnu" }, 400);

    // Acteur Apify spécialisé AVIS : tri_angle/airbnb-reviews-scraper (id TVfersbGTpMWGUMwt).
    // (dtrungtin~airbnb-scraper = prix/calendrier, refuse les URLs de fiche.)
    // Schéma d'input réel (vérifié via ?action=preflight) :
    //   startUrls (array de strings, REQUIS), maxReviewsPerListing (int), sortBy, sinceDate, locale.
    const ACTOR = (body.actor || "tri_angle~airbnb-reviews-scraper").replace("/", "~");
    // startUrls = format standard Apify "requestListSources" : array d'objets { url }.
    // (Passer des strings → "Items in input.startUrls do not contain valid URLs".)
    const startUrls = Object.values(targets).map(id => ({ url: `https://www.airbnb.com/rooms/${id}` }));
    const apifyInput = {
      startUrls,
      maxReviewsPerListing: body.maxReviews || 50,
      sortBy: "most-recent",
    };

    // Démarre le run (asynchrone) — on NE bloque pas 3 min ici.
    let runRes, run;
    try {
      runRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${env.APIFY_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apifyInput),
      });
      run = await runRes.json().catch(() => ({}));
    } catch (e) {
      return json({ error: "fetch Apify a levé une exception", detail: String(e && e.message || e) }, 502);
    }
    // Erreur d'input/quota Apify renvoyée en 422 (et non 502) pour ne pas être
    // masquée par la page d'erreur HTML de Cloudflare — le detail reste lisible.
    if (!runRes.ok) return json({ error: "Apify run échoué", status: runRes.status, detail: run?.error || run }, 422);

    return json({
      ok: true,
      message: "Scrape Apify démarré. Récupérer le dataset quand le run est 'SUCCEEDED'.",
      runId: run?.data?.id,
      datasetId: run?.data?.defaultDatasetId,
      poll: `/api/voyageur-feedback?action=collect&runId=${run?.data?.id}&secret=...`,
      targets: Object.keys(targets),
    });
  }

  // ── POST ?action=draft : génère les brouillons de réponse (Vague 3, DRY-RUN) ──
  // Aucune publication réelle (aucune API d'écriture Google/Airbnb branchée) :
  // remplit classification + draft_reply, à copier-coller manuellement par Vincent.
  if (request.method === "POST" && action === "draft") {
    const { ok: adminOk } = await verifyBearer(request, env);
    if (!adminOk) return json({ error: "Non autorisé" }, 401);
    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids.slice(0, 20) : null;

    const q = ids
      ? db.prepare(`SELECT * FROM voyageur_feedback WHERE id IN (${ids.map(() => "?").join(",")}) AND draft_status='none'`).bind(...ids)
      : db.prepare("SELECT * FROM voyageur_feedback WHERE draft_status='none' AND review_text IS NOT NULL AND review_text!='' ORDER BY review_date DESC LIMIT 20");
    const { results } = await q.all();

    const generated = [];
    const failed = [];
    for (const r of results) {
      const classification = classifyReview(r.rating);
      const bienNom = BIENS[r.bien_id]?.nom || r.bien_id;
      const { messages } = buildReviewReplyPrompt({ bienNom, prenom: r.prenom, rating: r.rating, reviewText: r.review_text, classification });
      const llm = await callLLM(env, { tier: "smart", messages, logSource: "review-draft" });
      if (!llm.ok || !llm.text) { failed.push(r.id); continue; }
      await db.prepare(
        "UPDATE voyageur_feedback SET classification=?, draft_reply=?, draft_status='pending', draft_generated_at=datetime('now') WHERE id=?"
      ).bind(classification, llm.text.trim(), r.id).run();
      generated.push(r.id);
    }
    return json({ ok: true, generated: generated.length, failed: failed.length, ids: generated });
  }

  // ── POST ?action=code-themes : codage thématique batché (voyageur-002) ──────
  // Traite les avis pas encore codés (themes IS NULL), par lots de 15 par appel LLM
  // (réduit le nb d'appels vs 1/avis), plafonné à 8 lots (120 avis) par requête HTTP
  // pour rester dans le temps d'exécution d'une Function.
  if (request.method === "POST" && action === "code-themes") {
    const { ok: adminOk } = await verifyBearer(request, env);
    if (!adminOk) return json({ error: "Non autorisé" }, 401);

    const { results } = await db.prepare(
      "SELECT id, bien_id, rating, review_text FROM voyageur_feedback " +
      "WHERE themes IS NULL AND review_text IS NOT NULL AND review_text!='' " +
      "ORDER BY review_date DESC LIMIT 120"
    ).all();

    const BATCH = 15;
    let coded = 0;
    const failedBatches = [];
    for (let i = 0; i < results.length; i += BATCH) {
      const batch = results.slice(i, i + BATCH);
      const reviews = batch.map(r => ({
        id: r.id, bienNom: BIENS[r.bien_id]?.nom || r.bien_id, rating: r.rating, text: r.review_text,
      }));
      const { messages } = buildThemeCodingPrompt(reviews);
      const llm = await callLLM(env, { tier: "smart", messages, logSource: "review-theme-coding" });
      if (!llm.ok || !llm.text) { failedBatches.push(i / BATCH); continue; }
      const parsed = parseThemeCodingResponse(llm.text, batch.map(r => r.id));
      const stmts = parsed.map(p =>
        db.prepare("UPDATE voyageur_feedback SET themes=? WHERE id=?").bind(JSON.stringify(p.themes), p.id)
      );
      if (stmts.length) { await db.batch(stmts); coded += stmts.length; }
    }
    return json({ ok: true, coded, remaining_untouched: results.length - coded, failedBatches });
  }

  // ── PATCH ?action=moderate : masquer/afficher un avis (admin) ─────────────
  if (request.method === "PATCH" && action === "moderate") {
    const { ok: adminOk } = await verifyBearer(request, env);
    if (!adminOk) return json({ error: "Non autorisé" }, 401);
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    if (!id) return json({ error: "id requis" }, 400);
    const hidden = body.hidden ? 1 : 0;
    await db.prepare("UPDATE voyageur_feedback SET hidden=? WHERE id=?").bind(hidden, id).run();
    return json({ ok: true, id, hidden });
  }

  // ── PATCH ?action=draft-status : marquer un brouillon envoyé/ignoré (admin) ──
  if (request.method === "PATCH" && action === "draft-status") {
    const { ok: adminOk } = await verifyBearer(request, env);
    if (!adminOk) return json({ error: "Non autorisé" }, 401);
    const body = await request.json().catch(() => ({}));
    const { id, status } = body;
    if (!id || !["sent", "dismissed", "pending"].includes(status)) {
      return json({ error: "id et status ('sent'|'dismissed'|'pending') requis" }, 400);
    }
    await db.prepare("UPDATE voyageur_feedback SET draft_status=? WHERE id=?").bind(status, id).run();
    return json({ ok: true, id, status });
  }

  return json({ error: "Méthode/action non supportée" }, 405);
}
