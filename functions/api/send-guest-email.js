// Cloudflare Pages Function — POST /api/send-guest-email
// crm-010/016 — Envoi générique d'un email voyageur depuis un template HTML.
//
// Body : { template, to, subject, vars, preheader? }
//   template : "pre-arrivee" | "post-sejour" | "relance-panier" | "newsletter-hiver"
//   to       : email destinataire
//   vars     : { prenom, bien_nom, checkin, checkout, code_acces, adresse, wa_hote, lien_avis_google, lien_avis_airbnb, ... }
//
// Auth : header "X-Send-Secret: <POSTSTAY_SECRET>" OU ?secret=<POSTSTAY_SECRET>
// Les templates sont servis comme assets : /email-templates/<template>.html
//
// ⚠️ Réservé aux RÉSERVATIONS DIRECTES (Airbnb/Booking gèrent leurs propres comms).

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const ALLOWED = new Set(["pre-arrivee", "post-sejour", "relance-panier", "newsletter-hiver"]);

function fillTemplate(html, vars = {}) {
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
}

export async function sendGuestEmail(env, origin, { template, to, subject, vars = {} }) {
  if (!ALLOWED.has(template)) return { ok: false, error: "template inconnu" };
  if (!to || !String(to).includes("@")) return { ok: false, error: "destinataire invalide" };
  if (!env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY manquante" };

  // Pages fait du "clean URL" (/x.html → /x) ; on cible directement l'URL propre.
  // Cache-bust + bypass cache CF : l'edge peut servir un template figé malgré no-cache
  // → on garantit la dernière version au moment de l'envoi.
  const tplRes = await fetch(`${origin}/email-templates/${template}?cb=${Date.now()}`, {
    redirect: "follow",
    cache: "no-store",
    cf: { cacheTtl: 0, cacheEverything: false },
  });
  if (!tplRes.ok) return { ok: false, error: `template introuvable (${tplRes.status})` };
  const raw = await tplRes.text();
  const html = fillTemplate(raw, vars);

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM || "Amaryllis <notifications@mail.villamaryllis.com>",
      to: [to],
      subject: subject || "Amaryllis Locations",
      html,
    }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    return { ok: false, error: `Resend ${r.status}: ${err.slice(0, 120)}` };
  }
  return { ok: true };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const secret = request.headers.get("X-Send-Secret") || url.searchParams.get("secret") || "";
  if (!env.POSTSTAY_SECRET || secret !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }
  const result = await sendGuestEmail(env, url.origin, body);
  return json(result, result.ok ? 200 : 400);
}

export function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Send-Secret",
    },
  });
}
