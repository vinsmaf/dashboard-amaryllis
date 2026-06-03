// functions/api/coherence-check.js — contrôle de cohérence des réservations (cron).
// GET ?secret=POSTSTAY_SECRET   → exécute, écrit les findings dans l'inbox client_errors,
//                                 push ntfy si finding critique. ?dry=1 = simulation (rien écrit).
import { ensureClientErrorsTable, clientErrorFingerprint } from "./client-errors.js";
import { BIENS as CANON } from "../../src/data/biens.js";
import { checkReservations } from "../../src/utils/coherenceRules.js";

// ids canoniques + alias d'affichage (Bellevue = schoelcher)
const VALID_BIENS = [...Object.keys(CANON), "bellevue"];

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }
  const dry = url.searchParams.get("dry") === "1";
  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 500);

  let reservations = [];
  try {
    const { results } = await db.prepare(
      "SELECT payment_intent_id AS id, bien_nom AS bien, voyageur, total, depot, checkin, checkout FROM direct_bookings"
    ).all();
    reservations = results || [];
  } catch (e) {
    return json({ ok: false, error: "lecture direct_bookings: " + e.message });
  }

  const findings = checkReservations(reservations, { validBiens: VALID_BIENS });
  const critical = findings.filter((f) => f.severity === "critique");

  if (!dry && findings.length) {
    try {
      await ensureClientErrorsTable(db);
      for (const f of findings) {
        const path = "/coherence/" + (f.rule || "");
        const id = await clientErrorFingerprint("coherence", f.message, path);
        const existing = await db.prepare("SELECT id FROM client_errors WHERE id=?").bind(id).first();
        if (existing) {
          await db.prepare(
            "UPDATE client_errors SET count=count+1, last_seen=unixepoch(), severity=?, " +
            "status=CASE WHEN status IN ('ignored','fixed') THEN status ELSE 'new' END WHERE id=?"
          ).bind(f.severity, id).run();
        } else {
          await db.prepare(
            "INSERT INTO client_errors (id, kind, message, path, severity, status) VALUES (?,?,?,?,?, 'new')"
          ).bind(id, "coherence", String(f.message).slice(0, 600), path, f.severity).run();
        }
      }
    } catch (e) {
      return json({ ok: false, error: "écriture inbox: " + e.message, findings: findings.length });
    }
    if (critical.length && env.NTFY_TOPIC) {
      try {
        await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
          method: "POST",
          headers: { Title: `⚠️ Cohérence : ${critical.length} alerte(s) critique(s)`, Priority: "high", Tags: "warning,rotating_light" },
          body: critical.map((c) => c.message).join("\n").slice(0, 800),
        });
      } catch { /* ntfy best-effort */ }
    }
  }

  return json({ ok: true, checked: reservations.length, findings: findings.length, critical: critical.length, ...(dry ? { items: findings } : {}) });
}
