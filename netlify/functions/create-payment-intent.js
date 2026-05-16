// No imports needed — uses native fetch (Node 18+, available on Netlify)

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) {
    return { statusCode: 500, body: JSON.stringify({ error: "STRIPE_SECRET_KEY manquante" }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "JSON invalide" }) }; }

  const { amount, currency = "eur", metadata = {} } = body;
  if (!amount || amount < 50) {
    return { statusCode: 400, body: JSON.stringify({ error: "Montant invalide" }) };
  }

  const payload = new URLSearchParams({
    amount: String(Math.round(amount)),
    currency,
    "automatic_payment_methods[enabled]": "true",
    "metadata[bienId]":   metadata.bienId   || "",
    "metadata[checkin]":  metadata.checkin  || "",
    "metadata[checkout]": metadata.checkout || "",
    "metadata[voyageur]": metadata.voyageur || "",
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sk}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });
    const parsed = await res.json();
    if (parsed.error) {
      return { statusCode: 400, body: JSON.stringify({ error: parsed.error.message }) };
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientSecret: parsed.client_secret }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
