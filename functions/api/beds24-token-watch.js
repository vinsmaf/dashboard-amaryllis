import { resendFrom } from "./_email.js";
// Cloudflare Pages Function — GET /api/beds24-token-watch
// web-009 : Surveillance quotidienne du token Beds24 V2
//
// Vérifie l'expiration du token actif. Si expiresIn < 7 jours,
// envoie un email d'alerte via Resend pour éviter une panne silencieuse.
//
// Auth : ?secret=TOKEN_WATCH_SECRET
// Secrets requis : BEDS24_TOKEN (ou D1 via beds24-refresh), RESEND_API_KEY,
//                  NOTIFICATION_EMAIL, TOKEN_WATCH_SECRET
// Cron-job.org : GET https://villamaryllis.com/api/beds24-token-watch?secret=<SECRET>
//                chaque jour à 07h00 UTC (avant le refresh à 09h00)

import { getActiveBeds24Token } from "./beds24-refresh.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

// Seuil en HEURES, pas en jours (changé le 2026-07-24). Le token Beds24 issu d'un échange
// invite-code ne vit que 24h et est renouvelé chaque matin par le cron 9h : un seuil de 7
// JOURS aurait déclenché un email TOUS les jours sur un token pourtant parfaitement sain —
// et une alerte quotidienne qui crie au loup finit ignorée, donc pire que pas d'alerte.
// 12h = « la rotation n'a pas réussi depuis au moins un cycle » : c'est le seul vrai signal
// de panne. Reste correct si un token longue durée revient un jour (1440h ≫ 12h, jamais
// d'alerte tant qu'il est sain).
const ALERT_THRESHOLD_HOURS = 12;

function buildAlertHtml({ expiresInDays, expiresAt, tokenPreview }) {
  const urgency = expiresInDays <= 2 ? "🔴 URGENT" : expiresInDays <= 4 ? "🟠 IMPORTANT" : "🟡 Avertissement";
  const color   = expiresInDays <= 2 ? "#ef4444" : expiresInDays <= 4 ? "#f59e0b" : "#eab308";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#faf5e9;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09);">
    <div style="background:#0e3b3a;padding:28px 32px 22px;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(250,247,242,0.5);">Amaryllis — Monitoring</p>
      <h1 style="margin:0;font-size:20px;color:#faf5e9;font-weight:300;">${urgency} — Token Beds24 bientôt expiré</h1>
    </div>
    <div style="padding:28px 32px;">
      <div style="background:#fff;border:2px solid ${color};border-radius:10px;padding:20px 24px;margin-bottom:20px;text-align:center;">
        <p style="margin:0 0 6px;font-size:36px;font-weight:700;color:${color};">${expiresInDays}j</p>
        <p style="margin:0;font-size:14px;color:#555;">avant expiration du token Beds24</p>
        <p style="margin:6px 0 0;font-size:12px;color:#999;">Expire le ${expiresAt}</p>
      </div>
      <p style="margin:0 0 14px;font-size:14px;color:#0e3b3a;line-height:1.7;">
        Le token Beds24 V2 utilisé par <strong>villamaryllis.com</strong> expire dans <strong>${expiresInDays} jours</strong>.
        Sans renouvellement, toutes les fonctions Beds24 cesseront de fonctionner (réservations, disponibilités, ménage alerts).
      </p>
      <div style="background:#fef9c3;border:1px solid #fbbf24;border-radius:8px;padding:14px 18px;margin-bottom:18px;">
        <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">
          <strong>Action requise :</strong> Aller dans Beds24 → Settings → API → Regenerate token,
          puis mettre à jour le secret <code>BEDS24_TOKEN</code> dans Cloudflare Pages dashboard.
        </p>
      </div>
      <p style="margin:0;font-size:12px;color:#aaa;">Token actuel : ${tokenPreview}</p>
    </div>
    <div style="padding:14px 32px;background:#e8dcc8;text-align:center;">
      <p style="margin:0;font-size:11px;color:#7a6b5a;">Amaryllis Locations · villamaryllis.com · Alerte automatique</p>
    </div>
  </div>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const { env, request } = context;

  // ── Auth ──────────────────────────────────────────────────────────────────
  // Accepte TOKEN_WATCH_SECRET (clé dédiée) OU POSTSTAY_SECRET (idiome serveur-à-serveur
  // du Worker). Ajouté le 2026-07-24 en rebranchant ce watch dans le cron Worker 9h : il
  // n'avait plus AUCUN planificateur depuis la mort des jobs cron-job.org du 07-12.
  const secret = new URL(request.url).searchParams.get("secret");
  const accepted = [env.TOKEN_WATCH_SECRET, env.POSTSTAY_SECRET].filter(Boolean);
  if (accepted.length && !accepted.includes(secret)) {
    return json({ error: "Non autorisé" }, 401);
  }

  const resendKey = env.RESEND_API_KEY;
  const notifEmail = env.NOTIFICATION_EMAIL || env.RECAP_EMAIL;
  const notifTo = String(notifEmail || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!resendKey || !notifEmail) {
    return json({ error: "RESEND_API_KEY ou NOTIFICATION_EMAIL manquant" }, 500);
  }

  // ── Token Beds24 ──────────────────────────────────────────────────────────
  const token = await getActiveBeds24Token(env, env.revenue_manager);
  if (!token) return json({ error: "BEDS24_TOKEN manquant" }, 500);

  // ── Vérifier l'expiration via l'API Beds24 ────────────────────────────────
  let details;
  try {
    const res = await fetch("https://beds24.com/api/v2/authentication/details", {
      headers: { token },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Beds24 HTTP ${res.status}`);
    details = await res.json();
  } catch (err) {
    return json({ error: `Beds24 auth check failed: ${err.message}` }, 502);
  }

  if (!details.validToken) {
    // Token déjà invalide — alerte critique immédiate
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: resendFrom(env),
          to: notifTo,
          subject: "🔴 URGENT — Token Beds24 invalide ou expiré",
          html: buildAlertHtml({ expiresInDays: 0, expiresAt: "DÉJÀ EXPIRÉ", tokenPreview: token.slice(0, 8) + "…" }),
        }),
      });
    } catch (_) {}
    return json({ ok: false, alert: true, error: "Token invalide", details });
  }

  // ── Calculer le temps restant ─────────────────────────────────────────────
  // ⚠️ Beds24 renvoie `token.expiresIn` (secondes), PAS `expiryDate` — vérifié en direct le
  // 2026-07-24 : `{"token":{"ownerId":46819,"expiresIn":85726,…}}`. Ce watch cherchait
  // uniquement expiryDate/expiresAt/expire, sortait donc systématiquement sur
  // « expiryDate absent » et n'a JAMAIS pu alerter avant expiration (seul le cas
  // `!validToken` ci-dessus fonctionnait, c.-à-d. quand il est déjà trop tard).
  const expiresInSec = Number(details.token?.expiresIn ?? details.expiresIn ?? NaN);
  const legacyExpiry = details.expiryDate || details.expiresAt || details.expire;

  let expiresMs;
  if (Number.isFinite(expiresInSec)) {
    expiresMs = Date.now() + expiresInSec * 1000;
  } else if (legacyExpiry) {
    expiresMs = typeof legacyExpiry === "number" ? legacyExpiry * 1000 : new Date(legacyExpiry).getTime();
  }
  if (!Number.isFinite(expiresMs)) {
    return json({ ok: true, alert: false, warning: "Expiration absente de la réponse Beds24", details });
  }

  const nowMs         = Date.now();
  const expiresInMs   = expiresMs - nowMs;
  const expiresInHours = Math.floor(expiresInMs / (1000 * 60 * 60));
  const expiresInDays  = Math.floor(expiresInMs / (1000 * 60 * 60 * 24));
  const expiresAt     = new Date(expiresMs).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const tokenPreview  = token.slice(0, 8) + "…";

  // ── Envoyer alerte si < seuil ─────────────────────────────────────────────
  let alertSent = false;
  if (expiresInHours < ALERT_THRESHOLD_HOURS) {
    try {
      const urgencyLabel = expiresInHours <= 4 ? "🔴 URGENT" : "🟠";
      const reste = expiresInHours >= 24 ? `${expiresInDays}j` : `${Math.max(0, expiresInHours)}h`;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: resendFrom(env),
          to: notifTo,
          subject: `${urgencyLabel} Token Beds24 expire dans ${reste} — la rotation quotidienne a échoué`,
          html: buildAlertHtml({ expiresInDays, expiresAt, tokenPreview }),
        }),
      });
      alertSent = r.ok;
    } catch (err) {
      return json({ ok: true, alert: false, error: `Email failed: ${err.message}`, expiresInHours });
    }
  }

  return json({
    ok: true,
    alert: alertSent,
    expiresInHours,
    expiresInDays,
    expiresAt,
    thresholdHours: ALERT_THRESHOLD_HOURS,
    status: expiresInHours < ALERT_THRESHOLD_HOURS
      ? `⚠️ Expire dans ${expiresInHours}h — alerte ${alertSent ? "envoyée" : "échouée"}`
      : `✅ Token valide (${expiresInHours}h restantes)`,
  });
}

export async function onRequest(context) {
  return onRequestGet(context);
}
