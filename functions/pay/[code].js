// Cloudflare Pages Function — GET /pay/{code}
// Lien court mémorisable (ex : villamaryllis.com/pay/cambier) pour partager un paiement de
// COMPLÉMENT par WhatsApp/SMS. À chaque visite, génère un lien Stripe Checkout FRAIS (les liens
// Stripe expirent en 24h) puis redirige (302). L'URL courte, elle, ne périme jamais.
//
// Données de chaque lien : table D1 pay_links (code, bien_id, amount, voyageur, email, checkin,
// checkout, label). Créées par l'admin / la console (pas d'endpoint public d'écriture).

const DDL = `CREATE TABLE IF NOT EXISTS pay_links (
  code      TEXT PRIMARY KEY,
  bien_id   TEXT NOT NULL,
  amount    INTEGER NOT NULL,
  voyageur  TEXT,
  email     TEXT,
  checkin   TEXT,
  checkout  TEXT,
  label     TEXT,
  active    INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);`;

const page = (title, msg) => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
   <title>${title}</title>
   <div style="font-family:system-ui,sans-serif;max-width:420px;margin:18vh auto;text-align:center;color:#0e3b3a;padding:24px">
     <div style="font-size:48px;margin-bottom:16px">⚠️</div>
     <h1 style="font-size:20px">${title}</h1>
     <p style="color:#5a4a3a;line-height:1.6">${msg}</p>
   </div>`,
  { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
);

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const code = String(params.code || "").toLowerCase();
  const db = env.revenue_manager;
  if (!db) return page("Indisponible", "Base de données injoignable. Réessayez plus tard.");

  await db.prepare(DDL).run();
  const row = await db.prepare(
    "SELECT * FROM pay_links WHERE code = ? AND active = 1"
  ).bind(code).first();
  if (!row) return page("Lien introuvable", "Ce lien de paiement n'existe pas ou a été désactivé.");

  // Génère un lien Stripe Checkout frais via l'endpoint complément (capture immédiate +
  // setup_future_usage → carte enregistrée pour la caution différée J-2).
  const origin = new URL(request.url).origin;
  try {
    const res = await fetch(`${origin}/api/complement-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bienId:   row.bien_id,
        amount:   row.amount,
        voyageur: row.voyageur || "",
        email:    row.email || "",
        checkin:  row.checkin || "",
        checkout: row.checkout || "",
        label:    row.label || "",
      }),
    });
    const d = await res.json();
    if (!d.url) return page("Erreur", "Impossible de générer le lien de paiement. Contactez Amaryllis.");
    return Response.redirect(d.url, 302);
  } catch {
    return page("Erreur", "Une erreur est survenue. Contactez Amaryllis.");
  }
}
