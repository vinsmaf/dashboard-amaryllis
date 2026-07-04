import { resendFrom } from "./_email.js";
import { sendEmail as sendEmailHelper } from "./_sendEmail.js";
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

const ALLOWED = new Set(["pre-arrivee", "post-sejour", "post-sejour-relance", "relance-panier", "newsletter-hiver", "solde-debite", "solde-echec", "annulation", "j1-acces", "confirmation", "pre-depart", "verif-arrivee"]);

function fillTemplate(html, vars = {}) {
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
}

export async function sendGuestEmail(env, origin, { template, to, subject, vars = {} }) {
  if (!ALLOWED.has(template)) return { ok: false, error: "template inconnu" };
  if (!to || !String(to).includes("@")) return { ok: false, error: "destinataire invalide" };
  if (!env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY manquante" };

  // Surcharge admin (email-templates-admin.js) prioritaire sur le fichier statique —
  // même pattern que property_guides (D1 d'abord, fallback fichier).
  try {
  let raw = null;
  if (env.revenue_manager) {
    try {
      const row = await env.revenue_manager
        .prepare("SELECT html FROM email_template_overrides WHERE template_id = ?")
        .bind(template).first();
      if (row?.html) raw = row.html;
    } catch { /* table pas encore créée — pas bloquant, fallback fichier */ }
  }

  // Pages fait du "clean URL" (/x.html → /x) ; on cible directement l'URL propre.
  // Cache-bust + bypass cache CF : l'edge peut servir un template figé malgré no-cache
  // → on garantit la dernière version au moment de l'envoi.
  if (raw === null) {
    const tplRes = await fetch(`${origin}/email-templates/${template}?cb=${Date.now()}`, {
      redirect: "follow",
      cache: "no-store",
    });
    if (!tplRes.ok) return { ok: false, error: `template introuvable (${tplRes.status})` };
    raw = await tplRes.text();
  }
  const html = fillTemplate(raw, vars);

  const result = await sendEmailHelper(env, {
    to,
    subject: subject || "Amaryllis Locations",
    html,
    template,
    category: "client",
    bien_id: vars.bien_id || null,
  });
  if (!result.ok) {
    return { ok: false, error: result.error || "Resend failed" };
  }
  return { ok: true, id: result.resendId };
  } catch (e) {
    // Une sous-requête (template / Resend) qui throw ne doit jamais faire planter
    // l'appelant (ex. cron relance-panier qui renvoyait 500 sur 1 seul échec réseau).
    return { ok: false, error: `exception: ${e.message}` };
  }
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
