// Cloudflare Pages Function — GET /api/rag-ingest
// #2 RAG — alimente l'index vectoriel avec les VRAIES données : faits biens,
// avis Google, contenus/drafts passés. Idempotent (ids stables). Cron hebdo conseillé.
//
// Auth : ?secret=POSTSTAY_SECRET

import { ragUpsert } from "./_rag.js";
import { BIENS } from "./_biens.js";
import { DOCS_DIGEST } from "./_docsDigest.js";

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

async function fetchJSON(u) { try { const r = await fetch(u); return await r.json(); } catch { return {}; } }

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  if (!env.VECTORIZE) return json({ error: "binding VECTORIZE absent — redéployer après ajout du binding" }, 503);

  const items = [];
  const by = { facts: 0, avis: 0, drafts: 0, docs: 0, snapshots: 0 };

  // 1) Faits canoniques des 7 biens
  for (const [id, b] of Object.entries(BIENS)) {
    items.push({
      id: `fact-${id}`,
      text: `${b.nom} (${b.type}, ${b.lieu || "Sainte-Luce"}). Équipement : ${b.equip}. À ne pas dépasser : ${b.interdit}. ${b.capacite ? `Capacité ${b.capacite} pers. ` : ""}Dès ${b.prix}€/nuit.`,
      metadata: { source: "facts", bien: id },
    });
    by.facts++;
  }

  // 2) Avis Google (Amaryllis + Résidence)
  for (const place of ["amaryllis", "residence"]) {
    const d = await fetchJSON(`${url.origin}/api/google-reviews?place=${place}`);
    for (const [i, r] of (d.reviews || []).entries()) {
      const txt = (r.text || r.comment || "").trim();
      if (txt.length < 20) continue;
      items.push({ id: `avis-${place}-${i}`, text: `Avis (${r.rating || "?"}/5) : ${txt}`, metadata: { source: "avis", bien: place } });
      by.avis++;
    }
  }

  // 3) Drafts/contenus passés (captions sociales) depuis D1
  if (env.revenue_manager) {
    try {
      const { results } = await env.revenue_manager.prepare(
        "SELECT id, payload FROM agent_drafts ORDER BY created_at DESC LIMIT 60"
      ).all();
      for (const row of results || []) {
        try {
          const p = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
          const cap = (p.caption || "").trim();
          if (cap.length < 30) continue;
          items.push({ id: `draft-${row.id}`, text: cap, metadata: { source: "draft" } });
          by.drafts++;
        } catch {}
      }
    } catch {}
  }

  // 4) Docs stratégiques (marketing/strategie/revenue-manager/crm/service-client/seo/legal)
  // — snapshot statique généré par scripts/generate-docs-digest.mjs (pas d'accès
  // filesystem possible en prod Cloudflare, donc ne peut pas lire docs/ au runtime).
  items.push(...DOCS_DIGEST);
  by.docs = DOCS_DIGEST.length;

  // 5) Snapshots quotidiens (docs FACTUELS ré-dérivés — trafic SEO, signaux marché)
  // — écrits par /api/docs-refresh (cron quotidien), PAS les docs légaux/stratégie
  // qui restent des snapshots statiques figés (cf. #4). Toujours plus récent que
  // le digest statique pour ces 2 sujets — l'agent voit la date du jour.
  if (env.revenue_manager) {
    try {
      const { results } = await env.revenue_manager.prepare(
        "SELECT key, content, generated_at FROM docs_snapshots"
      ).all();
      for (const row of results || []) {
        const date = new Date(row.generated_at * 1000).toISOString().slice(0, 10);
        items.push({
          id: `snapshot-${row.key}`,
          text: `[snapshot du jour — ${date} — ${row.key}] ${row.content}`,
          metadata: { source: "doc-live", doc: row.key, date },
        });
        by.snapshots++;
      }
    } catch {}
  }

  try {
    const ingested = await ragUpsert(env, items);
    return json({ ok: true, ingested, by });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export const onRequestPost = onRequestGet;
