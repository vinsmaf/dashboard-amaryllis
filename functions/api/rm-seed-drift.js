// functions/api/rm-seed-drift.js — garde-fou permanent (2026-07-18).
// Détecte la dérive entre rm_seasonal_profiles.base_price_override (modèle saisonnier propre
// au Revenue Manager) et le prix RÉELLEMENT calibré par Vincent (SEED_DAILY_PRICES). Ces deux
// couches sont indépendantes — rien ne garantit qu'elles restent synchronisées dans le temps.
// Trouvé une première fois le 2026-07-18 : drift jusqu'à +50% (Jan-Avr) / -45% (Sep-Déc) selon
// le bien, resté invisible car aucun check ne comparait les deux. Cf. CLAUDE.md §1bis.
//
// GET ?secret=POSTSTAY_SECRET → écrit les drifts dans l'inbox client_errors (kind:"rm-seed-drift"),
// push ntfy si au moins un drift. ?dry=1 = aperçu JSON sans écriture. 100% advisory, lecture seule
// côté prix (ne modifie jamais rm_seasonal_profiles ni le seed).

import { ensureClientErrorsTable, clientErrorFingerprint } from "./client-errors.js";
import { SEED_DAILY_PRICES } from "../../src/seedPrices.js";
import { computeSeedDrift } from "../../src/utils/rmSeedDrift.js";
import { getBien } from "../../src/data/biens.js";

const THRESHOLD_PCT = 0.15;

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }
  const dry = url.searchParams.get("dry") === "1";
  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 500);

  const { results: profiles } = await db.prepare(
    `SELECT property_id, name, season_type, date_start, date_end, base_price_override
     FROM rm_seasonal_profiles WHERE is_active = 1`
  ).all();

  const { drifted, noCoverage } = computeSeedDrift(profiles, SEED_DAILY_PRICES, { thresholdPct: THRESHOLD_PCT });

  if (dry) {
    return json({ ok: true, dry: true, checked: profiles.length, drifted: drifted.length, noCoverage: noCoverage.length, items: drifted });
  }

  if (drifted.length === 0) {
    return json({ ok: true, checked: profiles.length, drifted: 0, sent: false });
  }

  try {
    await ensureClientErrorsTable(db);
    for (const d of drifted) {
      const message = `Dérive RM/seed · ${getBien(d.property_id)?.nom || d.property_id} · ${d.name} (${d.date_start}→${d.date_end}) : reco RM ${d.rm_override}€ vs prix réel calibré ${d.seed_avg}€ (${d.diff_pct > 0 ? "+" : ""}${d.diff_pct}%)`;
      const path = `/rm-seed-drift/${d.property_id}/${d.date_start}`;
      const id = await clientErrorFingerprint("rm-seed-drift", message, path);
      const existing = await db.prepare("SELECT id FROM client_errors WHERE id=?").bind(id).first();
      if (existing) {
        await db.prepare(
          "UPDATE client_errors SET count=count+1, last_seen=unixepoch(), status=CASE WHEN status IN ('ignored','fixed') THEN status ELSE 'new' END WHERE id=?"
        ).bind(id).run();
      } else {
        await db.prepare(
          "INSERT INTO client_errors (id, kind, message, path, severity, status) VALUES (?,?,?,?,?, 'new')"
        ).bind(id, "rm-seed-drift", message.slice(0, 600), path, "moyenne").run();
      }
    }
  } catch (e) {
    return json({ ok: false, error: "écriture inbox: " + e.message, drifted: drifted.length });
  }

  if (env.NTFY_TOPIC) {
    try {
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: {
          Title: `📐 Dérive RM/seed — ${drifted.length} profil(s) désynchronisé(s)`,
          Priority: "3",
          Tags: "triangular_ruler",
          Actions: `view, Voir l'inbox Bugs, ${env.SITE_URL || new URL(request.url).origin}/admin, clear=true`,
        },
        body: drifted.slice(0, 5).map((d) => `${getBien(d.property_id)?.nom || d.property_id} · ${d.name} : ${d.rm_override}€ vs ${d.seed_avg}€ (${d.diff_pct > 0 ? "+" : ""}${d.diff_pct}%)`).join("\n"),
      });
    } catch { /* ntfy best-effort */ }
  }

  return json({ ok: true, checked: profiles.length, drifted: drifted.length, noCoverage: noCoverage.length, sent: true });
}
