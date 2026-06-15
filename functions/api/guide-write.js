// Cloudflare Pages Function — /api/guide-write
// Auto-rédaction des guides voyageurs : l'IA réécrit UNIQUEMENT la prose d'accueil
// (welcome_message, tagline) d'un livret, grounded sur les faits du bien, fact-checkée,
// puis appliquée en D1 — les champs critiques (wifi/code/horaires/contacts) sont INTOUCHABLES.
//
//   mode=live   : applique la réécriture validée dans property_guides (D1).
//   mode=shadow : n'écrit rien — ntfy « réécriture prête » (phase de confiance).
//   fail        : escalade ntfy « à revoir ».
//
// GET/POST ?property_id=xxx [&dry=1] [&mode=shadow|live]
// Auth : admin (Bearer) OU ?secret=POSTSTAY_SECRET. Kill-switch : GUIDE_WRITE_DISABLED=1.

import { verifyBearer } from "./_adminauth.js";
import { loadLearnedLessons } from "./_factcheck.js";
import { validateGuideEdit, mergeGuide, EDITABLE_FIELDS, repairLlmJson } from "./_guideWriter.js";
import { callLLM } from "./_llm.js";
import { getBien } from "../../src/data/biens.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

async function notify(env, title, body, priority = "default") {
  const topic = env.NTFY_TOPIC;
  if (!topic) return;
  try {
    await fetch(`https://ntfy.sh/${topic}`, { method: "POST", headers: { Title: title, Priority: priority, Tags: "memo" }, body });
  } catch { /* best-effort */ }
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  try {
  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé" }, 401);

  if (env.GUIDE_WRITE_DISABLED === "1" || env.GUIDE_WRITE_DISABLED === "true") {
    return json({ ok: true, disabled: true, message: "Auto-rédaction guides désactivée (kill-switch)" });
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 introuvable" }, 503);

  const propertyId = url.searchParams.get("property_id");
  const bien = propertyId ? getBien(propertyId) : null;
  if (!bien) return json({ error: "property_id invalide" }, 400);

  const dry = url.searchParams.get("dry") === "1";
  const mode = (url.searchParams.get("mode") || env.GUIDE_WRITE_MODE || "shadow").toLowerCase();

  // 1. Charger le guide actuel — D1 direct (prioritaire) puis fallback fichier statique.
  // (Pas de fetch interne Function→Function : fragile/timeout → 502.)
  let guide = null;
  try {
    await db.prepare("CREATE TABLE IF NOT EXISTS property_guides (property_id TEXT PRIMARY KEY, content_json TEXT NOT NULL, updated_at INTEGER NOT NULL)").run().catch(() => {});
    const row = await db.prepare("SELECT content_json FROM property_guides WHERE property_id=?").bind(propertyId).first();
    if (row?.content_json) guide = JSON.parse(row.content_json);
  } catch { /* ignore */ }
  if (!guide) {
    try {
      const r = await fetch(new URL(`/guides/${propertyId}.json`, url.origin));
      if (r.ok) guide = await r.json();
    } catch { /* ignore */ }
  }
  if (!guide || typeof guide !== "object") return json({ error: "guide introuvable" }, 404);

  // 2. Génération : réécriture des champs éditables uniquement, grounded sur les faits du bien.
  const faits = `Faits VRAIS (ne JAMAIS contredire) : nom=${bien.nom} · type=${bien.type} · ${bien.capacite} personnes · ${bien.chambres} chambres · ${bien.lieu}.`;
  const prompt = `Tu es l'hôte d'Amaryllis Locations. Voici le livret d'accueil du bien « ${bien.nom} ».
${faits}

MESSAGE D'ACCUEIL ACTUEL :
"""${guide.welcome_message || ""}"""

ACCROCHE ACTUELLE (tagline) :
"""${guide.tagline || ""}"""

Réécris ces DEUX textes pour qu'ils soient plus chaleureux, fluides et accueillants, en gardant un ton « vous » professionnel et la même longueur approximative.
RÈGLES STRICTES : n'invente AUCUN fait (équipement, distance, capacité, prix). Ne mentionne pas le wifi, le code d'accès, les horaires (ils sont ailleurs dans le guide). Reste fidèle aux faits ci-dessus.
Retourne UNIQUEMENT un JSON : {"welcome_message": "...", "tagline": "..."}`;

  let improved = null, llmRaw = "", llmErr = null, llmProvider = null;
  try {
    const res = await callLLM(env, { provider: "mistral", tier: "smart", max_tokens: 700, temperature: 0.5, messages: [{ role: "user", content: prompt }] });
    llmProvider = res.provider;
    if (res.ok) {
      // Nettoie les fences markdown (```json … ```) avant d'isoler le JSON.
      llmRaw = String(res.text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
      const m = llmRaw.match(/\{[\s\S]*\}/);
      if (m) { try { improved = JSON.parse(repairLlmJson(m[0])); } catch (e) { llmErr = "parse: " + e.message; } }
      else llmErr = "aucun JSON dans la réponse";
    } else { llmErr = "callLLM: " + (res.errors?.map(e => e.error).join(", ") || "échec"); }
  } catch (e) { llmErr = "exception: " + (e?.message || e); }
  // Statut 200 (et NON 502 — Cloudflare habille les 502 et masque le body).
  if (!improved) return json({ ok: false, error: "génération LLM échouée", llmErr, provider: llmProvider, raw: llmRaw.slice(0, 400) }, 200);

  // 3. Validation : champs critiques intacts + fact-check bien-aware des champs réécrits.
  const learned = await loadLearnedLessons(db).catch(() => []);
  const verdict = validateGuideEdit(guide, improved, propertyId, learned);

  const result = { ok: true, property_id: propertyId, mode, dry, valid: verdict.ok, changed: verdict.changed, fails: verdict.fails };
  if (dry) { result.preview = { welcome_message: improved.welcome_message, tagline: improved.tagline }; return json(result); }

  if (!verdict.ok) {
    await notify(env, `📝 Guide ${propertyId} — réécriture à revoir`, `Non appliquée :\n${verdict.fails.join("\n")}`, "default");
    result.action = "escalated";
    return json(result);
  }

  if (mode === "live") {
    const merged = mergeGuide(guide, improved, verdict.changed);
    const now = Math.floor(Date.now() / 1000);
    await db.prepare("INSERT OR REPLACE INTO property_guides (property_id, content_json, updated_at) VALUES (?,?,?)")
      .bind(propertyId, JSON.stringify(merged), now).run();
    await notify(env, `✅ Guide ${propertyId} amélioré`, `Champs réécrits : ${verdict.changed.join(", ")}`, "low");
    result.action = "applied";
  } else {
    await notify(env, `👁 SHADOW — guide ${propertyId} réécrit`, `Aurait appliqué : ${verdict.changed.join(", ")}\n\n${improved.welcome_message?.slice(0, 200)}…`, "low");
    result.action = "would_apply";
    result.preview = { welcome_message: improved.welcome_message, tagline: improved.tagline };
  }
  return json(result);
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e), where: "guide-write" }, 500);
  }
}
