// ─────────────────────────────────────────────────────────────────────────────
// RAG (#2) — embeddings + recherche vectorielle (Cloudflare Vectorize + Workers AI)
// Embeddings : @cf/baai/bge-m3 (multilingue FR, 1024 dims) via API REST (CF_AI_TOKEN).
// Index : binding env.VECTORIZE (amaryllis-knowledge). Fail-open partout.
// ─────────────────────────────────────────────────────────────────────────────

const EMBED_MODEL = "@cf/baai/bge-m3";

export async function embed(env, texts) {
  const arr = Array.isArray(texts) ? texts : [texts];
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/run/${EMBED_MODEL}`,
    { method: "POST", headers: { Authorization: `Bearer ${env.CF_AI_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ text: arr }) }
  );
  const d = await r.json();
  if (!d.success) throw new Error("embed: " + JSON.stringify(d.errors).slice(0, 150));
  return d.result.data; // [[...1024 floats...], ...]
}

// items : [{ id, text, metadata? }]
export async function ragUpsert(env, items) {
  if (!env.VECTORIZE || !items?.length) return 0;
  let n = 0;
  // batch de 50 (limites embeddings + Vectorize)
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50);
    const vectors = await embed(env, batch.map(b => b.text));
    const rows = batch.map((b, k) => ({
      id: b.id,
      values: vectors[k],
      metadata: { ...(b.metadata || {}), text: String(b.text).slice(0, 800) },
    }));
    await env.VECTORIZE.upsert(rows);
    n += rows.length;
  }
  return n;
}

export async function ragSearch(env, query, k = 4) {
  if (!env.VECTORIZE || !query) return [];
  try {
    const [vec] = await embed(env, query);
    const res = await env.VECTORIZE.query(vec, { topK: k, returnMetadata: "all" });
    return (res.matches || [])
      .filter(m => m.score >= 0.4)
      .map(m => ({ score: Math.round(m.score * 100) / 100, text: m.metadata?.text, source: m.metadata?.source, bien: m.metadata?.bien }));
  } catch { return []; }
}

// Bloc « données réelles » injectable dans un prompt d'agent (vide si rien trouvé).
export async function ragBlock(env, query, k = 4) {
  const hits = await ragSearch(env, query, k);
  if (!hits.length) return "";
  return `\n📚 DONNÉES RÉELLES (extraits de tes avis/guides/contenus — appuie-toi dessus, ne les invente pas) :\n${hits.map(h => `  • [${h.source || "?"}${h.bien ? "/" + h.bien : ""}] ${String(h.text).slice(0, 220)}`).join("\n")}\n`;
}
