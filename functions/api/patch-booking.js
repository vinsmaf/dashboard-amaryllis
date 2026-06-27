// POST /api/patch-booking
// Met à jour une réservation iCal (nom manquant + montant) en un seul appel.
// Orchestre : 1) addReservation (dedup → update) + 2) rebuild revenus du bon mois.
// Auth : Authorization: Bearer <ldb_tok HMAC>

import { verifyBearer } from "./_adminauth.js";

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  const auth = await verifyBearer(request, env);
  if (!auth.ok) return json({ error: "Accès refusé" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const { bienId, checkin, checkout, voyageur, montant, nb_guests, canal } = body;
  if (!bienId || !checkin || !checkout || !voyageur || !montant) {
    return json({ error: "Champs requis : bienId, checkin, checkout, voyageur, montant" }, 400);
  }

  const base = `${url.protocol}//${url.host}`;

  // Étape 1 : mettre à jour la résa dans "Toutes les Réservations"
  const addRes = await fetch(`${base}/api/sheets-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "addReservation",
      bienId,
      checkin,
      checkout,
      voyageur,
      montant: parseFloat(montant),
      canal: canal || "booking",
      voyageurs: parseInt(nb_guests || 1, 10),
      status: "Confirmé",
    }),
  });
  const addData = await addRes.json().catch(() => ({}));

  // Étape 2 : rebuild revenus du mois du checkin (ignoreMemo = re-traite même si déjà vu)
  const checkinMonth = new Date(checkin + "T12:00:00Z").getMonth() + 1;
  const revRes = await fetch(`${base}/api/sheets-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "revenus2026FromMonth", month: checkinMonth, apply: true, ignoreMemo: true }),
  });
  const revData = await revRes.json().catch(() => ({}));

  return json({
    ok: addData.ok ?? false,
    resa: addData,
    revenus: { month: checkinMonth, count: revData.count ?? 0, ok: revData.ok ?? false },
  });
}
