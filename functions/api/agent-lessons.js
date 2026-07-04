// Cloudflare Pages Function — /api/agent-lessons
// Stockage des "leçons apprises" / mots-expressions interdits par les agents IA.
// Chaque leçon = un mot/expression interdit (term lisible) + un pattern regex dérivé + sa raison.
// Les leçons sont :
//   1) injectées EN AMONT dans le prompt de génération (agents-run.js → renderBannedSection)
//      → les agents évitent ces termes dès la rédaction ;
//   2) utilisées en fact-check APRÈS génération (loadLearnedLessons → factCheckCaption).
//
// GET    → liste les leçons (admin OU ?secret=)
// POST   { term, reason?, bien_id? }  → ajoute (term littéral converti en regex sûre) [admin]
//        (rétro-compat : { pattern, reason } accepté tel quel)
// DELETE ?id=N → supprime [admin]

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://villamaryllis.com",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const DDL = `
CREATE TABLE IF NOT EXISTS agent_lessons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern     TEXT NOT NULL,
  reason      TEXT NOT NULL,
  bien_id     TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_lessons_bien ON agent_lessons(bien_id);
`;

async function ensureTable(db) {
  try { for (const s of DDL.split(";").filter(s => s.trim())) await db.prepare(s).run(); } catch {}
  // Migration : colonne `term` (mot/expression lisible saisi par l'admin) — ignore si déjà présente.
  try { await db.prepare("ALTER TABLE agent_lessons ADD COLUMN term TEXT").run(); } catch {}
  // Migration : colonne `scope` — distingue les clichés de captions ('caption', défaut historique)
  // des outils/frameworks hallucinés ('tool', vérifiables sans ambiguïté hors contexte créatif).
  // Nécessaire car agents-triage.js (blocage AUTOMATIQUE du backlog) ne doit jamais utiliser les
  // clichés de captions — un item qui PROPOSE de créer un contenu sur un thème n'est pas le
  // contenu final, contrairement à une caption générée qui, elle, ne doit jamais contenir le cliché.
  try { await db.prepare("ALTER TABLE agent_lessons ADD COLUMN scope TEXT DEFAULT 'caption'").run(); } catch {}
}

// Échappe un mot/expression littéral pour en faire une regex sûre (anti-injection regex).
function escapeRegex(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);
  await ensureTable(db);

  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  const authed = secretOk || adminOk;

  // ── GET — liste des leçons (réservée admin/secret) ────────────────────
  if (request.method === "GET") {
    if (!authed) return json({ error: "Non autorisé" }, 401);
    try {
      const { results } = await db.prepare(
        "SELECT id, pattern, reason, bien_id, term, scope, created_at FROM agent_lessons ORDER BY created_at DESC LIMIT 200"
      ).all();
      return json({ lessons: results || [], total: (results || []).length });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── POST — ajouter un mot/expression interdit (admin) ─────────────────
  if (request.method === "POST") {
    if (!authed) return json({ error: "Non autorisé" }, 401);
    const body = await request.json().catch(() => ({}));
    let { term, pattern, reason, bien_id, scope } = body;

    term = (term || "").trim();
    pattern = (pattern || "").trim();
    scope = scope === "tool" ? "tool" : "caption"; // défaut historique : cliché de caption
    // Mode simple (recommandé) : un terme littéral → regex échappée.
    if (term && !pattern) pattern = escapeRegex(term);
    if (!pattern) return json({ error: "term (mot/expression) requis" }, 400);
    if (!reason || !String(reason).trim()) reason = term ? `Mot interdit : « ${term} »` : "Interdit (saisi manuellement)";

    // Validation : la regex finale doit être compilable.
    try { new RegExp(pattern, "i"); }
    catch (e) { return json({ error: `motif invalide: ${e.message}` }, 400); }

    try {
      const r = await db.prepare(
        "INSERT INTO agent_lessons (pattern, reason, bien_id, term, scope) VALUES (?, ?, ?, ?, ?)"
      ).bind(pattern, String(reason).trim(), bien_id || null, term || null, scope).run();
      return json({ ok: true, id: r.meta?.last_row_id });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── DELETE (admin) ────────────────────────────────────────────────────
  if (request.method === "DELETE") {
    if (!authed) return json({ error: "Non autorisé" }, 401);
    const id = parseInt(url.searchParams.get("id"));
    if (!id) return json({ error: "id requis" }, 400);
    try {
      await db.prepare("DELETE FROM agent_lessons WHERE id = ?").bind(id).run();
      return json({ ok: true });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  return json({ error: "Method not allowed" }, 405);
}
