// Cloudflare Pages Function — /api/email-templates-admin
// Éditeur admin des paragraphes ÉDITABLES (texte simple) des 4 templates email
// automatiques — voir _emailTemplateFields.js pour le manifeste des champs.
// Vincent édite du texte brut, jamais de HTML — la structure/mise en page des
// emails reste fixe dans les fichiers public/email-templates/*.html.
//
// GET  (sans param) : liste des 4 templates + leurs champs + valeurs actuelles
// POST {id, fields}  : enregistre les valeurs des champs (fields = {key: value})
// DELETE ?id=X       : réinitialise tous les champs d'un template aux valeurs par défaut
//
// Auth : Bearer admin (verifyBearer)

import { verifyBearer } from "./_adminauth.js";
import { TEMPLATE_FIELDS, ensureFieldOverridesTable } from "./_emailTemplateFields.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const LABELS = {
  confirmation:  { label: "Nouvelle réservation",       desc: "Envoyé juste après le paiement (notify-booking.js)" },
  "verif-arrivee": { label: "Vérification après arrivée",  desc: "J+1 après le check-in, pour tous les séjours" },
  "j1-acces":    { label: "Codes d'accès (J-1)",         desc: "La veille de l'arrivée" },
  "pre-depart":  { label: "Veille du départ",            desc: "La veille du départ — late check-out, fidélité, avis" },
};

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
  await ensureFieldOverridesTable(db);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (request.method === "GET") {
    const { results } = await db.prepare("SELECT template_id, field_key, value, updated_at FROM email_field_overrides").all();
    const overrides = {}; // { templateId: { fieldKey: {value, updatedAt} } }
    for (const row of results || []) {
      overrides[row.template_id] ??= {};
      overrides[row.template_id][row.field_key] = { value: row.value, updatedAt: row.updated_at };
    }

    const templates = Object.entries(TEMPLATE_FIELDS)
      .filter(([templateId]) => !id || templateId === id)
      .map(([templateId, fields]) => {
        const tplOverrides = overrides[templateId] || {};
        return {
          id: templateId,
          label: LABELS[templateId]?.label || templateId,
          desc: LABELS[templateId]?.desc || "",
          custom: Object.keys(tplOverrides).length > 0,
          fields: fields.map(f => ({
            key: f.key,
            label: f.label,
            value: tplOverrides[f.key]?.value ?? f.default,
            isCustom: f.key in tplOverrides,
          })),
        };
      });

    if (id) {
      if (!templates.length) return json({ error: "Template inconnu" }, 404);
      return json({ ok: true, template: templates[0] });
    }
    return json({ ok: true, templates });
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const fieldDefs = TEMPLATE_FIELDS[body.id];
    if (!fieldDefs) return json({ error: "Template inconnu" }, 404);
    if (!body.fields || typeof body.fields !== "object") return json({ error: "fields requis" }, 400);

    const validKeys = new Set(fieldDefs.map(f => f.key));
    const now = Date.now();
    const stmts = [];
    for (const [key, value] of Object.entries(body.fields)) {
      if (!validKeys.has(key)) continue; // ignore les clés inconnues, ne bloque pas l'écriture des valides
      stmts.push(db.prepare(
        `INSERT INTO email_field_overrides (template_id, field_key, value, updated_at) VALUES (?,?,?,?)
         ON CONFLICT(template_id, field_key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      ).bind(body.id, key, String(value), now));
    }
    if (stmts.length) await db.batch(stmts);
    return json({ ok: true, id: body.id, updatedAt: now });
  }

  if (request.method === "DELETE") {
    if (!id || !TEMPLATE_FIELDS[id]) return json({ error: "Template inconnu" }, 404);
    await db.prepare("DELETE FROM email_field_overrides WHERE template_id = ?").bind(id).run();
    return json({ ok: true, id });
  }

  return json({ error: "Method not allowed" }, 405);
}
