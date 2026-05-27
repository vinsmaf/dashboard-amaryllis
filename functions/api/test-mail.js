// Endpoint temporaire de test email — à supprimer après vérification
export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to");
  const secret = url.searchParams.get("secret");
  if (secret !== "amaryllis-test-2026") return new Response("forbidden", { status: 403 });
  if (!to) return new Response("missing ?to", { status: 400 });
  if (!env.RESEND_API_KEY) return new Response("RESEND_API_KEY missing", { status: 500 });

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Amaryllis Test <onboarding@resend.dev>",
      to: [to],
      subject: "✅ Test de boîte mail — Amaryllis",
      html: `<div style="font-family:system-ui;padding:24px"><h2>Test reçu ✅</h2><p>Si tu lis ce mail, c'est que <strong>${to}</strong> est bien fonctionnel.</p><p>Tu peux maintenant tester la récupération de mot de passe Instagram avec cet email.</p><p style="color:#888;font-size:12px;margin-top:24px">Envoyé depuis le dashboard Amaryllis · ${new Date().toLocaleString("fr-FR")}</p></div>`,
    }),
  });
  const d = await r.json();
  return new Response(JSON.stringify({ ok: r.ok, ...d }), { headers: { "Content-Type": "application/json" } });
}
