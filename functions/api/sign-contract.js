import { resendFrom } from "./_email.js";
// Cloudflare Pages Function — POST /api/sign-contract (cpw-101, phase C3)
// Signature électronique « maison » du contrat de location : on stocke la
// signature manuscrite (PNG dataURL), le nom, l'acceptation, + horodatage et IP
// (valeur probante simple). Pas de signature qualifiée eIDAS.
//
// Body : { bienId, bienNom, checkin, checkout, voyageur, email, total, nom, signature(dataURL), accepted }
// Réponse : { ok, id, signed_at }

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://villamaryllis.com",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const { bienId = "", bienNom = "", checkin = "", checkout = "", voyageur = "", email = "",
          total = 0, nom = "", signature = "", accepted = false } = body;

  if (!accepted)  return json({ error: "Vous devez accepter le contrat" }, 400);
  if (!nom || nom.trim().length < 2) return json({ error: "Nom complet requis" }, 400);
  if (!signature || !signature.startsWith("data:image/")) return json({ error: "Signature manuscrite requise" }, 400);
  if (signature.length > 300000) return json({ error: "Signature trop lourde" }, 413);

  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 500);

  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "";
  const ua = request.headers.get("User-Agent") || "";

  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS contracts_signed (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bien_id TEXT, bien_nom TEXT, voyageur TEXT, email TEXT, nom_signature TEXT,
      checkin TEXT, checkout TEXT, total INTEGER,
      signature_png TEXT, ip TEXT, user_agent TEXT,
      signed_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`).run();

    const res = await db.prepare(`INSERT INTO contracts_signed
      (bien_id, bien_nom, voyageur, email, nom_signature, checkin, checkout, total, signature_png, ip, user_agent)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(bienId, bienNom, voyageur, email, nom.trim(), checkin, checkout, Math.round(total) || 0, signature, ip, ua).run();

    // Alerte hôte (best-effort)
    if (env.RESEND_API_KEY) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: resendFrom(env),
          to: [(env.NOTIFICATION_EMAIL || "contact@villamaryllis.com").split(",")[0].trim()],
          subject: `✍️ Contrat signé — ${bienNom || bienId} (${nom.trim()})`,
          html: `<div style="font-family:sans-serif"><h3>Contrat de location signé</h3><p><strong>${bienNom || bienId}</strong><br>Signataire : ${nom.trim()}<br>Voyageur : ${voyageur || "—"} · ${email || "—"}<br>Séjour : ${checkin} → ${checkout}<br>IP : ${ip}</p></div>`,
        }),
      }).catch(() => {});
    }

    return json({ ok: true, id: res.meta?.last_row_id, signed_at: Math.floor(Date.now() / 1000) });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return onRequestOptions();
  if (context.request.method === "POST")    return onRequestPost(context);
  return json({ error: "Method not allowed" }, 405);
}
