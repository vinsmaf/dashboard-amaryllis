// Cloudflare Pages Function — GET /api/rag-search?q=...&secret=...
// #2 RAG — test/démo du retrieval : renvoie les passages les plus proches.

import { ragSearch, embed } from "./_rag.js";

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  if (!env.VECTORIZE) return json({ error: "binding VECTORIZE absent" }, 503);
  const q = url.searchParams.get("q");
  if (!q) return json({ error: "param q requis" }, 400);
  const k = Math.min(10, Math.max(1, parseInt(url.searchParams.get("k") || "4", 10)));
  if (url.searchParams.get("debug")) {
    try {
      const [vec] = await embed(env, q);
      const res = await env.VECTORIZE.query(vec, { topK: k, returnMetadata: "all" });
      return json({ debug: true, vecDims: vec?.length, matchCount: (res.matches || []).length, raw: res });
    } catch (e) { return json({ debug: true, error: e.message, stack: String(e.stack).slice(0, 300) }, 500); }
  }
  return json({ ok: true, q, matches: await ragSearch(env, q, k) });
}
