// Cloudflare Pages Function — /api/email-templates-admin
// Éditeur admin des templates email AUTOMATIQUES (pas les templates manuels
// de MessageTemplates.jsx, ni les 3 templates marketing d'EmailComposer.jsx —
// ceux-là restent des fichiers statiques simples).
//
// Ces 4 templates sont envoyés par le cron quotidien (send-guest-email.js) :
// une surcharge en D1 (email_template_overrides) prend le pas sur le fichier
// statique public/email-templates/<id>.html — même pattern que property_guides.
//
// GET  (sans param)   : liste des 4 templates éditables + statut (custom/défaut)
// GET  ?id=X          : contenu actuel (surcharge D1 si présente, sinon fichier statique)
// POST {id, html}     : enregistre une surcharge
// DELETE ?id=X        : supprime la surcharge (retour au fichier statique)
//
// Auth : Bearer admin (verifyBearer)

import { verifyBearer } from "./_adminauth.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

// Les 4 templates envoyés automatiquement par le cron (voir CLAUDE.md) —
// liste volontairement fermée : pas les templates manuels/marketing.
const EDITABLE = {
  "confirmation":  { label: "Nouvelle réservation",       desc: "Envoyé juste après le paiement (notify-booking.js)" },
  "verif-arrivee": { label: "Vérification après arrivée",  desc: "J+1 après le check-in, pour tous les séjours" },
  "j1-acces":      { label: "Codes d'accès (J-1)",         desc: "La veille de l'arrivée" },
  "pre-depart":    { label: "Veille du départ",            desc: "La veille du départ — late check-out, fidélité, avis" },
};

async function ensureTable(db) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS email_template_overrides (template_id TEXT PRIMARY KEY, html TEXT NOT NULL, updated_at INTEGER NOT NULL)"
  ).run();
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);
  await ensureTable(db);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (request.method === "GET" && !id) {
    const { results } = await db.prepare("SELECT template_id, updated_at FROM email_template_overrides").all();
    const overrides = new Map((results || []).map(r => [r.template_id, r.updated_at]));
    return json({
      ok: true,
      templates: Object.entries(EDITABLE).map(([templateId, meta]) => ({
        id: templateId,
        label: meta.label,
        desc: meta.desc,
        custom: overrides.has(templateId),
        updatedAt: overrides.get(templateId) || null,
      })),
    });
  }

  if (request.method === "GET" && id) {
    if (!EDITABLE[id]) return json({ error: "Template inconnu" }, 404);
    const row = await db.prepare("SELECT html, updated_at FROM email_template_overrides WHERE template_id = ?").bind(id).first();
    if (row?.html) return json({ ok: true, id, html: row.html, source: "custom", updatedAt: row.updated_at });

    const staticRes = await fetch(new URL(`/email-templates/${id}.html`, url.origin), { cache: "no-store" });
    if (!staticRes.ok) return json({ error: "Fichier par défaut introuvable" }, 404);
    return json({ ok: true, id, html: await staticRes.text(), source: "default", updatedAt: null });
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (!EDITABLE[body.id]) return json({ error: "Template inconnu" }, 404);
    if (!body.html || typeof body.html !== "string") return json({ error: "html requis" }, 400);
    const now = Date.now();
    await db.prepare(
      `INSERT INTO email_template_overrides (template_id, html, updated_at) VALUES (?,?,?)
       ON CONFLICT(template_id) DO UPDATE SET html = excluded.html, updated_at = excluded.updated_at`
    ).bind(body.id, body.html, now).run();
    return json({ ok: true, id: body.id, updatedAt: now });
  }

  if (request.method === "DELETE") {
    if (!id || !EDITABLE[id]) return json({ error: "Template inconnu" }, 404);
    await db.prepare("DELETE FROM email_template_overrides WHERE template_id = ?").bind(id).run();
    return json({ ok: true, id });
  }

  return json({ error: "Method not allowed" }, 405);
}
