// functions/api/rapport-business.js — V4 du projet Délégation : rapport business AUTONOME.
// Data-analyst : lecture seule (D1 direct_bookings) → synthèse Mistral FR → push ntfy à Vincent.
// GET /api/rapport-business?token=RAPPORT_TOKEN
// Garde-fous : 100% lecture seule · aucune action outward sauf le ntfy à l'hôte lui-même.

import { callLLM } from "./_llm.js";
import { BIENS } from "./_biens.js";

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.RAPPORT_TOKEN || url.searchParams.get("token") !== env.RAPPORT_TOKEN) {
    return json({ error: "Non autorisé" }, 401);
  }
  const db = env.revenue_manager;
  const today = new Date().toISOString().slice(0, 10);

  // ── Signaux business (lecture seule, fail-soft) ──
  // Exclut les résas annulées partout (invariant du projet, cf. ADR-CANCEL-BOOKING-001) et
  // groupe par bien_id (pas bien_nom : l'historique a "Geko"/"Géko" selon la résa → 2 lignes
  // pour le même bien avec un GROUP BY texte).
  const stats = { resas: 0, ca: 0, parBien: [], arrivees7j: 0 };
  try {
    const NOT_CANCELLED = "(status IS NULL OR status != 'cancelled')";
    const agg = await db.prepare(
      `SELECT COUNT(*) n, COALESCE(SUM(total),0) ca FROM direct_bookings WHERE ${NOT_CANCELLED}`
    ).first();
    stats.resas = agg?.n || 0; stats.ca = Math.round(agg?.ca || 0);
    const byBien = await db.prepare(
      `SELECT bien_id, COUNT(*) n, COALESCE(SUM(total),0) ca FROM direct_bookings WHERE ${NOT_CANCELLED} GROUP BY bien_id ORDER BY ca DESC LIMIT 7`
    ).all();
    stats.parBien = (byBien?.results || []).map(r => `${BIENS[r.bien_id]?.nom || r.bien_id || "?"}: ${r.n} résa / ${Math.round(r.ca)}€`);
    const arr = await db.prepare(
      `SELECT COUNT(*) n FROM direct_bookings WHERE ${NOT_CANCELLED} AND checkin >= ? AND checkin <= date(?, '+7 day')`
    ).bind(today, today).first();
    stats.arrivees7j = arr?.n || 0;
  } catch (e) { stats.error = String(e.message || e); }

  // ── Synthèse LLM (FR, Mistral en tête) ──
  const dataTxt = `Réservations directes cumulées : ${stats.resas} (CA ${stats.ca} €). `
    + `Par bien : ${stats.parBien.join(" · ") || "—"}. `
    + `Arrivées directes dans les 7 prochains jours : ${stats.arrivees7j}.`;
  const r = await callLLM(env, {
    provider: "mistral", tier: "medium", cascade: ["mistral", "groq", "cloudflare"],
    max_tokens: 320, temperature: 0.4, timeoutMs: 15000,
    messages: [
      { role: "system", content: "Tu es l'analyste business d'Amaryllis Locations (conciergerie, 7 biens, Martinique + Nogent). Écris un brief court (4-5 lignes), factuel, en français, orienté décision. Pas de préambule. Termine par UNE action recommandée concrète." },
      { role: "user", content: `Brief du ${today} — données réservation directe :\n${dataTxt}\n\nRédige le brief.` },
    ],
  });
  const report = r.ok ? r.text.trim() : `Brief auto indisponible (LLM KO). Données : ${dataTxt}`;

  // ── Push ntfy à Vincent (Title ASCII obligatoire — leçon escalade chat) ──
  let notified = false;
  const topic = env.NTFY_TOPIC || "amaryllis-alertes-7r4k9";
  if (topic) {
    try {
      const res = await fetch(`https://ntfy.sh/${topic}`, {
        method: "POST",
        headers: { "Title": "Rapport business Amaryllis", "Priority": "default", "Tags": "bar_chart" },
        body: report,
      });
      notified = res.ok;
    } catch { notified = false; }
  }

  return json({ ok: true, today, report, notified, provider: r.provider, stats });
}
