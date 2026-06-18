// Helpers PARTAGÉS du système de caution différée — importés par stripe-webhook.js (pose immédiate
// si arrivée imminente) ET caution-cron.js (pose à J-2 / re-blocage glissant / libération).
// Centralisé ici pour éviter la duplication du DDL et de la création de hold (anti-drift).

// DDL unique de la table d'échéancier des cautions.
export const CAUTION_SCHEDULE_DDL = `CREATE TABLE IF NOT EXISTS caution_schedule (
  booking_pi_id TEXT PRIMARY KEY, bien_id TEXT, bien_nom TEXT, email TEXT, prenom TEXT,
  customer_id TEXT, payment_method_id TEXT, amount INTEGER, currency TEXT DEFAULT 'eur',
  checkin TEXT, checkout TEXT, place_date TEXT,
  status TEXT DEFAULT 'pending', caution_pi_id TEXT, capture_before TEXT,
  attempts INTEGER DEFAULT 0, last_error TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()))`;

export async function ensureCautionTable(db) {
  await db.prepare(CAUTION_SCHEDULE_DDL).run();
}

// Crée une pré-autorisation (hold) off-session sur la carte enregistrée. capture_method=manual →
// les fonds sont bloqués, jamais débités tant qu'on ne capture pas. request_extended_authorization
// = bonus si le compte le supporte (sinon ignoré). expand=latest_charge pour lire capture_before
// (date d'expiration réelle du hold) en une seule requête.
// `row` attend : amount(€), currency, customer_id, payment_method_id, booking_pi_id, bien_id,
// prenom, checkin, checkout, email. `idemKey` (optionnel) = clé d'idempotence Stripe : Stripe lui-même
// déduplique les appels concurrents/retries réseau portant la même clé → jamais 2 holds.
// Renvoie { pi, captureBefore } ou { error }.
export async function createHold(sk, row, idemKey) {
  const headers = { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" };
  if (idemKey) headers["Idempotency-Key"] = idemKey;
  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers,
    body: new URLSearchParams({
      amount: String(Math.round(row.amount * 100)),
      currency: row.currency || "eur",
      customer: row.customer_id,
      payment_method: row.payment_method_id,
      capture_method: "manual",
      off_session: "true",
      confirm: "true",
      "payment_method_options[card][request_extended_authorization]": "if_available",
      "metadata[type]": "deposit",
      "metadata[kind]": "caution-auto",
      "metadata[booking_pi_id]": row.booking_pi_id || "",
      "metadata[bienId]": row.bien_id || "",
      "metadata[voyageur]": row.prenom || "",
      "metadata[checkin]": row.checkin || "",
      "metadata[checkout]": row.checkout || "",
      "metadata[email]": row.email || "",
      "expand[0]": "latest_charge",
    }).toString(),
  });
  const pi = await res.json();
  if (pi.error) return { error: pi.error.message };
  if (pi.status !== "requires_capture") return { error: `statut inattendu: ${pi.status}` };
  const cb = pi.latest_charge?.payment_method_details?.card?.capture_before;
  // Fallback conservateur si capture_before absent : ~6 j (on suppose la fenêtre standard de 7 j).
  // Garantit un capture_before non-null → le re-blocage glissant se déclenchera toujours (jamais
  // d'expiration silencieuse faute de date d'expiration connue).
  const captureBefore = cb
    ? new Date(cb * 1000).toISOString().slice(0, 10)
    : new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10);
  return { pi, captureBefore };
}

// Annule un hold (libère les fonds). Best-effort — un hold déjà expiré renvoie une erreur sans gravité.
export async function cancelHold(sk, piId) {
  if (!piId) return;
  try {
    await fetch(`https://api.stripe.com/v1/payment_intents/${piId}/cancel`, {
      method: "POST", headers: { Authorization: `Bearer ${sk}` },
    });
  } catch { /* fail-silent */ }
}
