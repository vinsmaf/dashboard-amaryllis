// ENDPOINT TEMPORAIRE — à supprimer après usage
// POST /api/apple-pay-register?secret=POSTSTAY_SECRET
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET)
    return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });

  const sk = env.STRIPE_SECRET_KEY;
  if (!sk) return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY manquante" }), { status: 500 });

  const res = await fetch("https://api.stripe.com/v1/apple_pay/domains", {
    method: "POST",
    headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "domain_name=villamaryllis.com",
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}
