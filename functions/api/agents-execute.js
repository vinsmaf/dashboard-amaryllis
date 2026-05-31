// functions/api/agents-execute.js
// L3 — Prépare les actions risk=auto en BROUILLONS (agent_drafts, statut 'drafted').
// JAMAIS de publication. Cron hebdo OU appel manuel.
// Auth : ?secret=POSTSTAY_SECRET OU token admin (Bearer).
import { verifyBearer } from "./_adminauth.js";

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://villamaryllis.com" };
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });
const BIENS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return onRequestOptions();
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 500);

  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ error: "Non autorisé (secret ou token admin requis)" }, 401);

  // Actions auto non encore préparées (idempotence via note marqueur)
  const { results } = await db.prepare(
    "SELECT * FROM agent_actions WHERE risk='auto' AND status IN ('backlog','a-planifier') " +
    "AND (notes IS NULL OR notes NOT LIKE '%[auto-préparé]%') LIMIT 10"
  ).all();

  const now = Math.floor(Date.now() / 1000);
  let prepared = 0, downgraded = 0;
  const out = [];

  for (const a of (results || [])) {
    const cat = (a.category || "").toLowerCase();
    const text = (a.action || "").toLowerCase();
    const bien = BIENS.find(b => text.includes(b) || (b === "schoelcher" && text.includes("schœlcher")));

    // Niveau prudent : on ne prépare AUTO que les meta-SEO ciblant un bien identifiable.
    if (cat === "seo" && bien) {
      let res;
      try {
        res = await fetch(`${url.origin}/api/agents-deliver?secret=${env.POSTSTAY_SECRET}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "meta-seo", bien }),
        }).then(r => r.json());
      } catch (e) {
        out.push({ id: a.id, error: "deliver fetch a échoué: " + String(e && e.message || e) });
        continue;
      }
      const liv = res && res.livrable;
      if (!liv || !liv.valid) {
        // Garde-fou : livrable invalide (fact-check/longueur) → repasse en review, pas de draft
        await db.prepare("UPDATE agent_actions SET risk='review', updated_at=? WHERE id=?").bind(now, a.id).run();
        downgraded++;
        out.push({ id: a.id, action: "fact-check KO → review" });
        continue;
      }
      await db.prepare(
        "INSERT INTO agent_drafts (agent, agent_label, agent_emoji, type, payload, rationale, preview, status, created_at, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, 'drafted', ?, ?)"
      ).bind(
        a.agent, a.agent_label, a.agent_emoji, "meta-seo",
        JSON.stringify(liv), `Auto-préparé depuis l'action ${a.id}`,
        `${liv.title} — ${liv.description}`.slice(0, 200), now, now
      ).run();
      await db.prepare(
        "UPDATE agent_actions SET notes = COALESCE(notes,'') || ' [auto-préparé]', updated_at=? WHERE id=?"
      ).bind(now, a.id).run();
      prepared++;
      out.push({ id: a.id, prepared: true, bien, title: liv.title });
    } else {
      // Pas de cible auto claire → review (le niveau prudent ne prépare que meta-SEO ciblées)
      await db.prepare("UPDATE agent_actions SET risk='review', updated_at=? WHERE id=?").bind(now, a.id).run();
      downgraded++;
      out.push({ id: a.id, action: "pas de cible auto → review" });
    }
  }

  return json({ ok: true, prepared, downgraded, processed: (results || []).length, details: out });
}
