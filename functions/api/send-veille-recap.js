import { resendFrom } from "./_email.js";
import { ALL_BIENS } from "../../src/data/biens.js";
// Cloudflare Pages Function — GET /api/send-veille-recap
// Rapport hebdo de veille concurrentielle (veille-003) : médian/p25/p75 marché par bien
// (rm_market_signals, déjà recalculés par rm-auto-update?scan=1 juste avant dans le cron
// Worker) + nouveaux listings détectés (agent_actions veille-zone-*) + top 3 actions.
// Auth : ?secret=POSTSTAY_SECRET. Appelé par le Worker chaque lundi (cron 0 6 * * 1),
// APRÈS rm-auto-update?scan=1 + veille-zone-scan pour lire des signaux frais.

function eur(cents) {
  return cents == null ? "—" : `${Math.round(cents / 100)}€`;
}

function ecart(nousCents, medianCents) {
  if (nousCents == null || medianCents == null || medianCents === 0) return null;
  return Math.round(((nousCents - medianCents) / medianCents) * 100);
}

const MARKET_LABEL_FR = { strong: "🔥 tendu", weak: "🟢 détendu", balanced: "⚪ équilibré" };

async function fetchSignals(db, propertyId) {
  return db
    .prepare(
      `SELECT * FROM rm_market_signals WHERE property_id = ? ORDER BY signal_date DESC LIMIT 1`
    )
    .bind(propertyId)
    .first();
}

async function fetchTopActions(db) {
  const { results } = await db
    .prepare(
      `SELECT action, priority, created_at FROM agent_actions
       WHERE agent = 'veille-concurrentielle' AND id LIKE 'veille-zone-%'
       ORDER BY created_at DESC LIMIT 3`
    )
    .all();
  return results || [];
}

function buildHtml({ rows, actions, today }) {
  const trs = rows.map((r) => {
    const e = ecart(r.nousCents, r.medianCents);
    const eColor = e == null ? "#888" : e > 5 ? "#c47254" : e < -5 ? "#2f7a5c" : "#555";
    const eTxt = e == null ? "—" : `${e > 0 ? "+" : ""}${e}%`;
    return `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #e8dcc8;font-weight:600;color:#0e3b3a;">${r.nom}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #e8dcc8;color:#555;">${eur(r.nousCents)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #e8dcc8;color:#555;">${eur(r.medianCents)} <span style="color:#999;font-size:12px;">(${eur(r.p25Cents)}–${eur(r.p75Cents)})</span></td>
      <td style="padding:12px 14px;border-bottom:1px solid #e8dcc8;font-weight:600;color:${eColor};">${eTxt}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #e8dcc8;color:#555;">${r.marketLabel ? (MARKET_LABEL_FR[r.marketLabel] || r.marketLabel) : "—"}</td>
    </tr>`;
  }).join("");

  const actionsHtml = actions.length
    ? `<ul style="margin:8px 0 0;padding-left:20px;color:#555;font-size:14px;line-height:1.7;">
        ${actions.map((a) => `<li>${a.action}</li>`).join("")}
      </ul>`
    : `<p style="color:#999;font-size:13px;margin:8px 0 0;">Aucun nouveau signal cette semaine.</p>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf5e9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:640px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#0e3b3a;padding:32px 32px 24px;">
      <p style="color:#c47254;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Rapport hebdomadaire</p>
      <h1 style="color:#faf5e9;font-weight:300;font-size:24px;margin:0;letter-spacing:0.05em;">Veille concurrentielle</h1>
      <p style="color:rgba(250,245,233,0.6);font-size:13px;margin:12px 0 0;">${today}</p>
    </div>
    <div style="padding:28px 32px 8px;">
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Notre prix vs prix médian marché (concurrents scannés cette semaine, Airbnb + Booking).
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e8dcc8;border-radius:8px;overflow:hidden;font-size:13px;">
        <thead>
          <tr style="background:#f5efe0;">
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Bien</th>
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Nous</th>
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Marché (médian, p25–p75)</th>
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Écart</th>
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Marché</th>
          </tr>
        </thead>
        <tbody>${trs}</tbody>
      </table>
      <h2 style="color:#0e3b3a;font-size:15px;margin:24px 0 0;">Top signaux de la semaine</h2>
      ${actionsHtml}
    </div>
    <div style="padding:24px 32px 32px;">
      <a href="https://villamaryllis.com/admin"
         style="display:inline-block;background:#0e3b3a;color:#faf5e9;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.06em;">
        Ouvrir le dashboard →
      </a>
    </div>
    <div style="background:#f5efe0;padding:16px 32px;text-align:center;">
      <p style="color:#aaa;font-size:12px;margin:0;">Rapport automatique advisory only — aucun prix n'est modifié · <a href="https://villamaryllis.com" style="color:#aaa;">villamaryllis.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!env.POSTSTAY_SECRET || secret !== env.POSTSTAY_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const resendKey = env.RESEND_API_KEY;
  const toEmail = env.RECAP_EMAIL;
  if (!resendKey || !toEmail) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY et RECAP_EMAIL manquants" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  try {
    const db = env.revenue_manager;
    // Iguana exclue : bail long terme, pas de marché court-séjour comparable.
    const biens = ALL_BIENS.filter((b) => b.bookable !== false && b.id !== "iguana");

    const rows = [];
    for (const b of biens) {
      const sig = await fetchSignals(db, b.id).catch(() => null);
      rows.push({
        nom: b.nom,
        nousCents: Math.round(b.prix * 100),
        medianCents: sig?.price_median_cents ?? null,
        p25Cents: sig?.price_p25_cents ?? null,
        p75Cents: sig?.price_p75_cents ?? null,
        marketLabel: sig?.market_label ?? null,
      });
    }

    const actions = await fetchTopActions(db).catch(() => []);
    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: resendFrom(env),
        to: [toEmail],
        subject: `🔭 Veille concurrentielle — ${new Date().toLocaleDateString("fr-FR")}`,
        html: buildHtml({ rows, actions, today }),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Resend error", details: data }), { status: 502, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, sent_at: new Date().toISOString(), id: data.id, biens: rows.length, signaux: actions.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
