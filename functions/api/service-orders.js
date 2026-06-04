// GET /api/service-orders → liste des commandes de services (ventes additionnelles, admin)
//
// Les lignes sont écrites par functions/api/stripe-webhook.js quand un voyageur
// paie un service (table D1 `service_orders`).
//
// Binding D1 requis : revenue_manager
// Auth : token de session signé Bearer (verifyBearer) — même pattern que contacts.js

import { verifyBearer } from "./_adminauth.js";

const json = (d, s = 200) => Response.json(d, {
  status: s,
  headers: { "Content-Type": "application/json" },
});

// arch-009 : accepte un token de session signé OU le mot de passe brut (rétro-compat)
async function checkAuth(context) {
  if (!context.env.ADMIN_PASSWORD && !context.env.ADMIN_PWD) return true; // dev
  const { ok } = await verifyBearer(context.request, context.env);
  return ok;
}

export async function onRequestGet(context) {
  if (!(await checkAuth(context))) return json({ error: "Non autorisé" }, 401);

  const db = context.env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  try {
    const { results } = await db
      .prepare("SELECT * FROM service_orders ORDER BY created_at DESC LIMIT 200")
      .all();
    return json({ ok: true, orders: results, total: results.length });
  } catch (err) {
    // Table pas encore créée (aucune vente enregistrée par le webhook)
    if (err.message?.includes("no such table")) {
      return json({ ok: true, orders: [], total: 0, hint: "no_table" });
    }
    console.error("[service-orders] GET error:", err);
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
