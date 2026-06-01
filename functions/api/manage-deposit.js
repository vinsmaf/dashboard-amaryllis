// Cloudflare Pages Function — POST /api/manage-deposit
// action: "capture" | "cancel" | "list"

export async function onRequestPost(context) {
  const { request, env } = context;
  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) return json({ error: "STRIPE_SECRET_KEY manquante" }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const { action, paymentIntentId, amount } = body;

  if (action === "list") {
    // List all pre-authorized deposits (requires_capture)
    try {
      const res = await fetch(
        "https://api.stripe.com/v1/payment_intents/search?query=status%3A%27requires_capture%27%20AND%20metadata%5B%27type%27%5D%3A%27deposit%27&limit=50",
        { headers: { Authorization: `Bearer ${sk}` } }
      );
      const parsed = await res.json();
      if (parsed.error) return json({ error: parsed.error.message }, 400);
      return json({ ok: true, data: parsed.data || [] });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // action: "history" — toutes les cautions (tous statuts), filtrable par bienId.
  // Lecture seule, sert à vérifier qu'une caution a bien été libérée (canceled).
  if (action === "history") {
    try {
      let q = "metadata%5B%27type%27%5D%3A%27deposit%27";
      if (body.bienId) q += `%20AND%20metadata%5B%27bienId%27%5D%3A%27${encodeURIComponent(body.bienId)}%27`;
      const res = await fetch(
        `https://api.stripe.com/v1/payment_intents/search?query=${q}&limit=50`,
        { headers: { Authorization: `Bearer ${sk}` } }
      );
      const parsed = await res.json();
      if (parsed.error) return json({ error: parsed.error.message }, 400);
      const data = (parsed.data || []).map(pi => ({
        id: pi.id, status: pi.status, amount: pi.amount, created: pi.created,
        canceled_at: pi.canceled_at, capture_method: pi.capture_method,
        bienId: pi.metadata?.bienId, voyageur: pi.metadata?.voyageur,
        checkin: pi.metadata?.checkin, checkout: pi.metadata?.checkout,
      }));
      return json({ ok: true, data });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  if (!paymentIntentId) return json({ error: "paymentIntentId requis" }, 400);

  let url;
  if (action === "capture") {
    url = `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/capture`;
  } else if (action === "cancel") {
    url = `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/cancel`;
  } else {
    return json({ error: "Action invalide (capture | cancel | list)" }, 400);
  }

  const capturePayload = action === "capture" && amount
    ? new URLSearchParams({ amount_to_capture: String(Math.round(amount * 100)) }).toString()
    : "";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: capturePayload,
    });
    const parsed = await res.json();
    if (parsed.error) return json({ error: parsed.error.message }, 400);
    return json({ ok: true, status: parsed.status });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
