// Cloudflare Pages Function — GET /api/rm-price-digest
// Digest hebdo RM : parmi les 2500+ recommandations stockées (~14 mois glissants ×
// 6 biens), n'en surface que les écarts SIGNIFICATIFS vs le prix RÉELLEMENT affiché
// sur le site, sur la fenêtre où corriger a encore un effet (30 prochains jours).
//
// RM reste 100% advisory : ce digest ne modifie AUCUN prix, il évite juste de
// parcourir le dashboard pour trouver les écarts qui comptent. Push ntfy uniquement
// (pas d'email — cohérent avec kpi-sentinel/morning-brief, les canaux que Vincent lit).
//
// Déclenché par le Worker cron hebdo (lundi, séquencé APRÈS rm-auto-update?scan=1
// pour lire des recos fraîchement recalculées — même pattern que send-veille-recap).
// Auth : ?secret=POSTSTAY_SECRET. ?dry=1 = aperçu JSON sans push ntfy.

import { getBien } from "../../src/data/biens.js";
import { computeSignificantGaps, groupGapsByProperty } from "../../src/utils/rmPriceDigest.js";

const MAX_LEAD_DAYS = 30;
const THRESHOLD_PCT = 0.12;

function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

// Prix journaliers des 6 biens Martinique bookables (site-config) + Nogent (beds24-rates).
async function fetchLivePrices(origin) {
  const byBien = {};
  try {
    const r = await fetch(`${origin}/api/site-config?type=prices`);
    const d = await r.json();
    if (d?.ok && d.config) Object.assign(byBien, d.config);
  } catch { /* garde un objet vide, gaps() retombera sur bien.prix */ }
  try {
    const r = await fetch(`${origin}/api/beds24-rates`);
    const d = await r.json();
    if (d?.ok && d.prices) byBien.nogent = d.prices;
  } catch { /* idem */ }
  return byBien;
}

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret") ?? "";
  if (!env.POSTSTAY_SECRET || secret !== env.POSTSTAY_SECRET) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }
  const dry = url.searchParams.get("dry") === "1";

  const db = env.revenue_manager;
  const ntfyTopic = env.NTFY_TOPIC;
  if (!db) return json({ ok: false, error: "D1 binding manquant" }, 503);
  if (!dry && !ntfyTopic) return json({ ok: false, error: "NTFY_TOPIC manquant" }, 503);

  const today = new Date().toISOString().slice(0, 10);
  const horizon = addDays(today, MAX_LEAD_DAYS);

  const { results: recos } = await db.prepare(
    `SELECT property_id, date, recommended_price_cents, lead_time_days, alert_flags,
            vacancy_risk_score, premium_opportunity
     FROM rm_recommendations
     WHERE status = 'pending' AND date >= ? AND date <= ?`
  ).bind(today, horizon).all();

  const siteUrl = env.SITE_URL || new URL(request.url).origin;
  const livePrices = await fetchLivePrices(siteUrl);

  const gaps = computeSignificantGaps(recos, livePrices, { thresholdPct: THRESHOLD_PCT, maxLeadDays: MAX_LEAD_DAYS });
  const grouped = groupGapsByProperty(gaps, 3);

  if (dry) {
    return json({ ok: true, dry: true, scanned: recos.length, significant: gaps.length, grouped });
  }

  if (gaps.length === 0) {
    // Anti-fatigue : rien de significatif → une seule ligne discrète, pas de push.
    return json({ ok: true, scanned: recos.length, significant: 0, sent: false });
  }

  const eur = (n) => `${n > 0 ? "+" : ""}${n}€`;
  const lines = Object.entries(grouped)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([bienId, g]) => {
      const nom = getBien(bienId)?.nom || bienId;
      const detail = g.top.map((r) => `${r.date} : ${r.live_price}€ → ${r.recommended_price}€ (${eur(r.diff_eur)}, ${r.diff_pct}%)`).join(" · ");
      const more = g.total > g.top.length ? ` (+${g.total - g.top.length} autre${g.total - g.top.length > 1 ? "s" : ""})` : "";
      return `${nom} — ${g.total} écart${g.total > 1 ? "s" : ""}${more}\n  ${detail}`;
    });

  const res = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
    method: "POST",
    headers: {
      Title: `💰 Digest prix RM — ${gaps.length} écart${gaps.length > 1 ? "s" : ""} à regarder`,
      Priority: "3",
      Tags: "moneybag",
      Actions: `view, Ouvrir Revenue Manager, ${siteUrl}/admin, clear=true`,
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: lines.join("\n\n"),
  });

  return json({ ok: true, scanned: recos.length, significant: gaps.length, sent: res.ok, ntfyStatus: res.status });
}
