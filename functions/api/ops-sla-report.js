// Cloudflare Pages Function — GET /api/ops-sla-report
// Rapport mensuel SLA Exploitation (maintenance + stock) — log-036.
// Distinct de docs/sla-reponse.md (SLA temps de réponse voyageurs) — domaine différent.
//
// Params : ?month=YYYY-MM (défaut : mois calendaire précédent) · &dry=1 (aperçu, pas d'envoi)
// Auth   : Bearer admin OU ?secret=POSTSTAY_SECRET
// Cron   : accroché au cron Worker mensuel existant (0 1 1 * *), aucun nouveau créneau.
//
// Périmètre : maintenance (7 biens + "tous") + inventory_items/movements (6 biens MQ,
// Nogent exclu — conciergerie externe). Zéro nouvelle table.

import { verifyBearer } from "./_adminauth.js";
import { resendFrom } from "./_email.js";
import { ALL_BIENS } from "../../src/data/biens.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json" },
});

function monthRange(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const from = `${monthStr}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const to = `${monthStr}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

function previousMonthStr(ref = new Date()) {
  const y = ref.getUTCFullYear(), m = ref.getUTCMonth(); // m=0 pour janvier courant → décembre précédent
  const prev = new Date(Date.UTC(y, m - 1, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
}

function avg(arr) {
  const vals = arr.filter((v) => v != null && !Number.isNaN(v));
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function pct(num, den) {
  if (!den) return null;
  return Math.round((num / den) * 1000) / 10;
}

// ── Maintenance ──────────────────────────────────────────────────────────────
function computeMaintenanceStats(closedRows, backlogRows, pipelineRows) {
  const withSchedule = closedRows.filter((r) => r.scheduled_at);
  const onTime = withSchedule.filter((r) => r.done_at <= r.scheduled_at).length;
  const delays = closedRows
    .filter((r) => r.created_at && r.done_at)
    .map((r) => {
      const created = new Date(r.created_at * 1000);
      const done = new Date(r.done_at + "T12:00:00Z");
      return (done - created) / 86400000;
    });

  const byCategory = {};
  const byProvider = {};
  for (const r of closedRows) {
    byCategory[r.category] = byCategory[r.category] || { count: 0, cost: 0 };
    byCategory[r.category].count++;
    byCategory[r.category].cost += r.cost || 0;
    const prov = r.prestataire || "(non renseigné)";
    byProvider[prov] = byProvider[prov] || { count: 0, cost: 0, delays: [] };
    byProvider[prov].count++;
    byProvider[prov].cost += r.cost || 0;
  }

  const top5 = [...closedRows].sort((a, b) => (b.cost || 0) - (a.cost || 0)).slice(0, 5)
    .map((r) => ({ bien_id: r.bien_id, titre: r.titre, category: r.category, cost: r.cost || 0 }));

  return {
    closed: closedRows.length,
    created: pipelineRows.length,
    avg_resolution_days: avg(delays) != null ? Math.round(avg(delays) * 10) / 10 : null,
    on_time_rate: pct(onTime, withSchedule.length),
    on_time_sample: withSchedule.length,
    late_backlog: backlogRows.length,
    cost_done: closedRows.reduce((s, r) => s + (r.cost || 0), 0),
    cost_pipeline: pipelineRows.filter((r) => r.status !== "fait").reduce((s, r) => s + (r.cost || 0), 0),
    by_category: byCategory,
    top5_costly: top5,
    late_items: backlogRows.map((r) => ({
      bien_id: r.bien_id, titre: r.titre, category: r.category,
      scheduled_at: r.scheduled_at, prestataire: r.prestataire,
    })),
  };
}

// ── Inventaire — détection des franchissements de seuil dans le mois ─────────
function computeInventoryStats(items, movementsByItem, from, to) {
  const alertsTriggered = [];
  const alertsResolved = [];

  for (const item of items) {
    const moves = (movementsByItem[item.id] || []).slice().sort((a, b) => a.created_at - b.created_at);
    // Rejoue les mouvements pour reconstituer qty avant/après chaque étape.
    let qty = item.qty_current;
    for (let i = moves.length - 1; i >= 0; i--) qty -= moves[i].delta; // qty au tout début de la séquence connue
    for (const mv of moves) {
      const before = qty;
      const after = qty + mv.delta;
      qty = after;
      const dateStr = new Date(mv.created_at * 1000).toISOString().slice(0, 10);
      if (dateStr < from || dateStr > to) continue;
      if (before >= item.qty_min && after < item.qty_min) {
        alertsTriggered.push({ item_id: item.id, bien_id: item.bien_id, item_name: item.item_name, at: dateStr });
      }
      if (before < item.qty_min && after >= item.qty_min) {
        alertsResolved.push({ item_id: item.id, bien_id: item.bien_id, item_name: item.item_name, at: dateStr });
      }
    }
  }

  const activeNow = items.filter((i) => i.qty_current < i.qty_min)
    .map((i) => ({ item_id: i.id, bien_id: i.bien_id, item_name: i.item_name, qty_current: i.qty_current, qty_min: i.qty_min }));

  return {
    alerts_triggered: alertsTriggered.length,
    alerts_resolved: alertsResolved.length,
    alerts_active_eom: activeNow.length,
    active_items: activeNow,
    log: [...alertsTriggered.map((a) => ({ ...a, type: "déclenchée" })), ...alertsResolved.map((a) => ({ ...a, type: "résolue" }))]
      .sort((a, b) => a.at.localeCompare(b.at)),
  };
}

function buildEmailHtml({ month, portfolio, properties }) {
  const rows = properties.map((p) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e8dcc8;font-weight:600;color:#0e3b3a;">${p.nom}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e8dcc8;color:#555;">${p.maintenance.closed}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e8dcc8;color:#555;">${p.maintenance.on_time_rate == null ? "—" : p.maintenance.on_time_rate + "%"}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e8dcc8;color:#555;">${p.maintenance.late_backlog}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e8dcc8;color:#555;">${p.maintenance.cost_done}€</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e8dcc8;color:#555;">${p.inventory.alerts_active_eom}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf5e9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:680px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#0e3b3a;padding:32px 32px 24px;">
      <p style="color:#c47254;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Rapport mensuel</p>
      <h1 style="color:#faf5e9;font-weight:300;font-size:24px;margin:0;">SLA Exploitation — ${month}</h1>
    </div>
    <div style="padding:28px 32px 8px;">
      <h2 style="color:#0e3b3a;font-size:15px;margin:0 0 12px;">Résumé portefeuille</h2>
      <p style="color:#555;font-size:14px;line-height:1.9;margin:0 0 20px;">
        <strong>${portfolio.maintenance.closed}</strong> interventions closes ·
        délai moyen <strong>${portfolio.maintenance.avg_resolution_days ?? "—"}j</strong> ·
        taux à temps <strong>${portfolio.maintenance.on_time_rate ?? "—"}%</strong> ·
        <strong>${portfolio.maintenance.late_backlog}</strong> en retard actuellement ·
        coût réalisé <strong>${portfolio.maintenance.cost_done}€</strong> (engagé : ${portfolio.maintenance.cost_pipeline}€)<br/>
        Stock : <strong>${portfolio.inventory.alerts_triggered}</strong> alertes déclenchées,
        ${portfolio.inventory.alerts_resolved} résolues,
        <strong>${portfolio.inventory.alerts_active_eom}</strong> encore actives.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e8dcc8;border-radius:8px;overflow:hidden;font-size:13px;">
        <thead><tr style="background:#f5efe0;">
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;">Bien</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;">Closes</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;">À temps</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;">Retard</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;">Coût</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;">Alertes stock</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:24px 32px 32px;">
      <a href="https://villamaryllis.com/admin" style="display:inline-block;background:#0e3b3a;color:#faf5e9;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Ouvrir le dashboard →</a>
    </div>
    <div style="background:#f5efe0;padding:16px 32px;text-align:center;">
      <p style="color:#aaa;font-size:12px;margin:0;">Rapport automatique · aucune action n'est prise pour vous · <a href="https://villamaryllis.com" style="color:#aaa;">villamaryllis.com</a></p>
    </div>
  </div>
</body></html>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const secretOk = !!env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  if (!secretOk) {
    const { ok: adminOk } = await verifyBearer(request, env);
    if (!adminOk) return json({ error: "Non autorisé" }, 401);
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non liée" }, 500);

  const month = url.searchParams.get("month") || previousMonthStr();
  if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: "month invalide (YYYY-MM)" }, 400);
  const dry = url.searchParams.get("dry") === "1";
  const { from, to } = monthRange(month);
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [{ results: closedAll }, { results: pipelineAll }, { results: backlogAll }] = await Promise.all([
      db.prepare("SELECT * FROM maintenance WHERE status='fait' AND done_at BETWEEN ? AND ?").bind(from, to).all(),
      db.prepare("SELECT * FROM maintenance WHERE date(created_at,'unixepoch') BETWEEN ? AND ?").bind(from, to).all(),
      db.prepare("SELECT * FROM maintenance WHERE status IN ('a_planifier','planifie') AND scheduled_at < ?").bind(today).all(),
    ]);

    const { results: items } = await db.prepare("SELECT * FROM inventory_items").all();
    const { results: movements } = await db.prepare(
      `SELECT * FROM inventory_movements WHERE created_at BETWEEN ? AND ?`
    ).bind(Math.floor(new Date(from + "T00:00:00Z").getTime() / 1000), Math.floor(new Date(to + "T23:59:59Z").getTime() / 1000)).all();
    // Mouvements élargis (pas seulement le mois) pour rejouer correctement qty avant/après.
    const { results: allMovements } = await db.prepare("SELECT * FROM inventory_movements").all();
    const movementsByItem = {};
    for (const mv of allMovements || []) {
      (movementsByItem[mv.item_id] = movementsByItem[mv.item_id] || []).push(mv);
    }

    const bienIds = [...new Set([
      ...(closedAll || []).map((r) => r.bien_id),
      ...(pipelineAll || []).map((r) => r.bien_id),
      ...(backlogAll || []).map((r) => r.bien_id),
      ...(items || []).map((i) => i.bien_id),
    ])].filter((id) => id && id !== "tous" && id !== "_general");

    const portfolioMaintenance = computeMaintenanceStats(closedAll || [], backlogAll || [], pipelineAll || []);
    const portfolioInventory = computeInventoryStats(items || [], movementsByItem, from, to);

    const properties = bienIds.map((bienId) => {
      const bien = ALL_BIENS.find((b) => b.id === bienId);
      const bMaint = computeMaintenanceStats(
        (closedAll || []).filter((r) => r.bien_id === bienId),
        (backlogAll || []).filter((r) => r.bien_id === bienId),
        (pipelineAll || []).filter((r) => r.bien_id === bienId),
      );
      const bItems = (items || []).filter((i) => i.bien_id === bienId);
      const bInv = computeInventoryStats(bItems, movementsByItem, from, to);
      return { bien_id: bienId, nom: bien?.nom || bienId, maintenance: bMaint, inventory: bInv };
    }).sort((a, b) => a.nom.localeCompare(b.nom));

    const report = {
      version: "1.0",
      period: { month, from, to },
      generated_at: new Date().toISOString(),
      portfolio: { maintenance: portfolioMaintenance, inventory: portfolioInventory },
      properties,
      meta: {
        note_perimetre: "Inventaire : Nogent exclu (conciergerie externe). Maintenance : les 7 biens.",
        note_cout_reappro: "cost_unit_cents non renseigné sur les items actuels — coût de réapprovisionnement non calculable pour l'instant.",
      },
    };

    if (dry) return json({ ok: true, dry: true, report });

    const resendKey = env.RESEND_API_KEY;
    const toEmail = env.RECAP_EMAIL;
    let emailResult = { skipped: true };
    if (resendKey && toEmail) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: resendFrom(env),
          to: [toEmail],
          subject: `🔧 SLA Exploitation — ${month}`,
          html: buildEmailHtml({ month, portfolio: report.portfolio, properties }),
        }),
      });
      const data = await res.json();
      emailResult = res.ok ? { ok: true, id: data.id } : { ok: false, error: data };
    }

    let ntfyResult = { skipped: true };
    const ntfyTopic = env.NTFY_TOPIC;
    if (ntfyTopic) {
      const body = `${portfolioMaintenance.closed} interventions closes · délai moyen ${portfolioMaintenance.avg_resolution_days ?? "—"}j · ${portfolioMaintenance.late_backlog} en retard · coût ${portfolioMaintenance.cost_done}€\nStock : ${portfolioInventory.alerts_active_eom} alertes actives`;
      const res = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: "POST",
        headers: { Title: `🔧 SLA Exploitation ${month}`, Priority: "3", Tags: "wrench", "Content-Type": "text/plain; charset=utf-8" },
        body,
      });
      ntfyResult = { ok: res.ok, status: res.status };
    }

    return json({ ok: true, month, email: emailResult, ntfy: ntfyResult, report });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
