// Cloudflare Pages Function — /api/airbnb-test
// Test READ-ONLY : authentification Airbnb + lecture des prix actuels
// Aucune modification de prix

const LISTINGS = [
  { nom: "Villa Amaryllis", id: "54269844" },
  { nom: "Zandoli",         id: "792768220924504884" },
  { nom: "Géko",            id: "1263155865459755724" },
  { nom: "Mabouya",         id: "1046596752160926069" },
  { nom: "Bellevue",        id: "24242415" },
];

const AIRBNB_APP_ID = "d306zoyjsyarp7ifhu67rjxn52tv0t3v";
const AIRBNB_API    = "https://api.airbnb.com";

async function getToken(email, password) {
  const res = await fetch(`${AIRBNB_API}/v1/authorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Airbnb/19.50.1 iPhone/17.0",
      "X-Airbnb-API-Key": AIRBNB_APP_ID,
    },
    body: JSON.stringify({
      email,
      password,
      application_id: AIRBNB_APP_ID,
    }),
  });
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = {}; }
  if (!res.ok || !data.access_token) {
    throw new Error(`HTTP ${res.status} — ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function getListingPrices(token, listingId) {
  const today = new Date();
  const start = today.toISOString().split("T")[0];
  const end   = new Date(today.getTime() + 30 * 86400000).toISOString().split("T")[0];

  const res = await fetch(
    `${AIRBNB_API}/v2/calendars/${listingId}?start_date=${start}&end_date=${end}&_format=with_conditions`,
    {
      headers: {
        "X-Airbnb-OAuth-Token": token,
        "User-Agent": "Airbnb/19.50.1 iPhone/17.0",
      },
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_details?.description || `HTTP ${res.status}`);

  // Extraire les prix des 30 prochains jours
  const days = data.calendar?.days || [];
  const prices = days.slice(0, 7).map(d => ({
    date:          d.date,
    price:         d.price?.local_price_formatted || d.price?.native_price,
    available:     d.available,
    min_nights:    d.min_nights,
  }));

  return prices;
}

export async function onRequestGet(context) {
  const secret = new URL(context.request.url).searchParams.get("secret");
  if (secret !== context.env.AIRBNB_TEST_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const email    = context.env.AIRBNB_EMAIL;
  const password = context.env.AIRBNB_PASSWORD;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "AIRBNB_EMAIL et AIRBNB_PASSWORD manquants dans les variables d'environnement Cloudflare" }), { status: 500 });
  }

  const results = [];

  try {
    const token = await getToken(email, password);
    results.push({ step: "auth", status: "ok", token_preview: token.slice(0, 12) + "…" });

    for (const listing of LISTINGS) {
      try {
        const prices = await getListingPrices(token, listing.id);
        results.push({ listing: listing.nom, id: listing.id, status: "ok", prices });
      } catch (e) {
        results.push({ listing: listing.nom, id: listing.id, status: "error", error: e.message });
      }
    }
  } catch (e) {
    results.push({ step: "auth", status: "error", error: e.message });
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
