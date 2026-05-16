// Cloudflare Pages Function — POST /api/create-payment-intent

export async function onRequestPost(context) {
  const { request, env } = context;

  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) return json({ error: "STRIPE_SECRET_KEY manquante" }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const { amount, currency = "eur", metadata = {} } = body;
  if (!amount || amount < 50) return json({ error: "Montant invalide" }, 400);

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
    if (parsed.error) return json({ error: parsed.error.message }, 400);
    return json({ clientSecret: parsed.client_secret });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
