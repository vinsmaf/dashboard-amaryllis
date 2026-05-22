// Cloudflare Pages Function — POST /api/beds24-create
// Crée une réservation Beds24 V2 directement via API (remplace l'iframe).
// Retourne : bookingId + prix (local si Beds24 ne le fournit pas).

const BEDS24_V2_BOOKINGS = "https://beds24.com/api/v2/bookings";
const DEFAULT_PROP_ID    = "158192";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const token = env.BEDS24_TOKEN;
  if (!token) return json({ error: "BEDS24_TOKEN manquant" }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const {
    propId     = DEFAULT_PROP_ID,
    checkin,
    checkout,
    firstName,
    lastName,
    email,
    phone      = "",
    numAdult   = 1,
    numChild   = 0,
    localAmount,      // montant calculé côté front (fallback si Beds24 ne renvoie pas de prix)
    notes      = "",
  } = body;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!checkin || !checkout)
    return json({ error: "checkin et checkout requis" }, 400);
  if (!firstName || !lastName || !email)
    return json({ error: "firstName, lastName et email requis" }, 400);
  if (!email.includes("@"))
    return json({ error: "email invalide" }, 400);

  const arrivalDate   = new Date(checkin  + "T12:00:00Z");
  const departureDate = new Date(checkout + "T12:00:00Z");
  if (isNaN(arrivalDate) || isNaN(departureDate))
    return json({ error: "Dates invalides" }, 400);
  if (departureDate <= arrivalDate)
    return json({ error: "La date de départ doit être après l'arrivée" }, 400);

  // ── Création de la réservation ────────────────────────────────────────────
  const bookingPayload = [{
    propId:    String(propId),
    arrival:   checkin,
    departure: checkout,
    firstName: firstName.trim(),
    lastName:  lastName.trim(),
    email:     email.trim().toLowerCase(),
    phone:     phone.trim(),
    numAdult:  Math.max(1, parseInt(numAdult) || 1),
    numChild:  Math.max(0, parseInt(numChild) || 0),
    status:    "new",         // → "confirmed" après paiement Stripe réussi
    referer:   "direct",
    comments:  notes.trim(),
  }];

  try {
    const createRes = await fetch(BEDS24_V2_BOOKINGS, {
      method:  "POST",
      headers: { token, "Content-Type": "application/json" },
      body:    JSON.stringify(bookingPayload),
    });

    let createData;
    try   { createData = await createRes.json(); }
    catch { return json({ error: "Réponse non-JSON de Beds24" }, 502); }

    if (!createRes.ok || !createData.success) {
      return json({ error: "Création Beds24 échouée", raw: createData }, 502);
    }

    const created   = createData.data?.[0];
    const bookingId = created?.id;
    if (!bookingId) return json({ error: "bookingId absent dans la réponse Beds24", raw: createData }, 502);

    // ── Récupérer le prix depuis Beds24 (GET immédiat) ────────────────────
    let price = 0;
    try {
      const since = new Date(Date.now() - 60 * 1000).toISOString().slice(0, 10);
      const getRes = await fetch(
        `${BEDS24_V2_BOOKINGS}?propId=${propId}&arrivalFrom=${checkin}&arrivalTo=${checkin}&modifiedFrom=${since}&numId=20`,
        { headers: { token } }
      );
      const getData = await getRes.json();
      const match = (getData.data || []).find(b => String(b.id) === String(bookingId));
      if (match) {
        // Essayer les champs prix dans l'ordre de fiabilité
        price = parseFloat(match.totalPrice ?? match.invoiceAmount ?? match.price) || 0;
        console.log("[beds24-create] prix récupéré:", price, JSON.stringify({
          id:           match.id,
          totalPrice:   match.totalPrice,
          invoiceAmount:match.invoiceAmount,
          price:        match.price,
        }));
      }
    } catch (fetchErr) {
      console.warn("[beds24-create] GET prix échoué:", fetchErr.message);
    }

    // Fallback : prix calculé côté front (notre formule tarifaire)
    if (!price && localAmount) {
      price = parseFloat(localAmount) || 0;
      console.log("[beds24-create] prix fallback local:", price);
    }

    return json({
      ok:        true,
      bookingId,
      price,                  // 0 si Beds24 ne répond pas ET pas de localAmount
      arrival:   checkin,
      departure: checkout,
    });

  } catch (e) {
    return json({ error: e.message }, 502);
  }
}
