// Cloudflare Pages Function — GET /api/agents-triggers
// #6 DÉCLENCHEURS RÉACTIFS (event-driven) : compare l'état courant à un état mémorisé
// (D1 agent_triggers) et RÉVEILLE le bon agent quand une condition se déclenche.
//   - nouveaux avis Google      → voyageur-research
//   - note moyenne < 4.6        → responsable-service-client
//   - nouvelle(s) résa directe(s) → crm-manager
// Baseline au 1er run (pas de faux positif). Idempotent (l'état évite de re-déclencher).
//
// Auth : ?secret=POSTSTAY_SECRET · Cron conseillé : 1×/jour.

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

async function getState(db) {
  const out = {};
  try { const r = await db.prepare("SELECT k, v FROM agent_triggers").all(); for (const row of r.results || []) out[row.k] = row.v; } catch {}
  return out;
}
async function setState(db, k, v) {
  await db.prepare("INSERT INTO agent_triggers (k,v,updated_at) VALUES (?,?,unixepoch()) ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=excluded.updated_at")
    .bind(k, String(v)).run();
}
async function reviews(origin, place) {
  try { const r = await fetch(`${origin}/api/google-reviews?place=${place}`); return await r.json(); } catch { return {}; }
}
async function wakeAgent(origin, agentId, brief, secret) {
  try {
    const r = await fetch(`${origin}/api/agents-run${secret ? `?secret=${encodeURIComponent(secret)}` : ""}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agents: [agentId], brief }),
    });
    const j = await r.json();
    const res = (j.results || j)[0] || j;
    return { agent: agentId, ok: res.ok ?? true, actions: res.actions, model: res.model, error: res.error };
  } catch (e) { return { agent: agentId, ok: false, error: e.message }; }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);
  await db.prepare("CREATE TABLE IF NOT EXISTS agent_triggers (k TEXT PRIMARY KEY, v TEXT, updated_at INTEGER)").run();

  const origin = url.origin;
  const state = await getState(db);
  const wakeups = [];          // agents à réveiller : {agent, brief}
  const signals = [];          // observations sans déclenchement
  const baseline = [];

  // ── Mesures courantes ──────────────────────────────────────────────────
  const [revA, revR, bookingRow] = await Promise.all([
    reviews(origin, "amaryllis"),
    reviews(origin, "residence"),
    db.prepare("SELECT COUNT(*) n FROM direct_bookings").first().catch(() => ({ n: 0 })),
  ]);
  const reviewsTotal = (revA.userRatingsTotal || 0) + (revR.userRatingsTotal || 0);
  const minRating = Math.min(revA.rating || 5, revR.rating || 5);
  const bookings = bookingRow?.n || 0;

  // ── R1 : nouveaux avis Google → voyageur-research ────────────────────────
  if (state.reviews_total == null) { baseline.push(`reviews_total=${reviewsTotal}`); }
  else if (reviewsTotal > +state.reviews_total) {
    wakeups.push({ agent: "voyageur-research", brief: `De nouveaux avis Google sont arrivés (${state.reviews_total}→${reviewsTotal}). Analyse les tendances et propose des actions.` });
  } else signals.push(`avis stables (${reviewsTotal})`);
  await setState(db, "reviews_total", reviewsTotal);

  // ── R2 : note moyenne basse → responsable-service-client ─────────────────
  if (minRating < 4.6) {
    if (state.rating_alerted !== String(minRating)) {
      wakeups.push({ agent: "responsable-service-client", brief: `Alerte : la note Google moyenne est tombée à ${minRating}. Analyse les avis négatifs et propose un plan de redressement NPS.` });
      await setState(db, "rating_alerted", minRating);
    } else signals.push(`note basse déjà alertée (${minRating})`);
  } else { signals.push(`note OK (${minRating})`); if (state.rating_alerted) await setState(db, "rating_alerted", ""); }

  // ── R3 : nouvelle(s) résa directe(s) → crm-manager ───────────────────────
  if (state.bookings_count == null) { baseline.push(`bookings=${bookings}`); }
  else if (bookings > +state.bookings_count) {
    wakeups.push({ agent: "crm-manager", brief: `${bookings - (+state.bookings_count)} nouvelle(s) réservation(s) directe(s). Vérifie la séquence d'accueil voyageur et propose des optimisations de fidélisation.` });
  } else signals.push(`résas directes stables (${bookings})`);
  await setState(db, "bookings_count", bookings);

  // ── Réveil des agents déclenchés (parallèle, dédupliqué) ─────────────────
  const seen = new Set();
  const toWake = wakeups.filter(w => !seen.has(w.agent) && seen.add(w.agent));
  const fired = await Promise.all(toWake.map(w => wakeAgent(origin, w.agent, w.brief, env.POSTSTAY_SECRET)));

  return json({ ok: true, mesures: { reviewsTotal, minRating, bookings }, baseline, declenches: toWake.map(w => w.agent), fired, signals });
}

export const onRequestPost = onRequestGet;
