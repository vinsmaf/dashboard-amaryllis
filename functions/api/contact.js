export async function onRequestPost(context) {
  try {
    const { nom, email, message } = await context.request.json();

    if (!nom || !email || !message) {
      return Response.json({ ok: false, error: "Champs requis manquants" }, { status: 400 });
    }

    const apiKey = context.env.RESEND_API_KEY;
    if (!apiKey) {
      return Response.json({ ok: false, error: "Service email non configuré" }, { status: 503 });
    }

    // "from" must be a Resend-verified domain — use shared onboarding@resend.dev
    // The guest's email is set as reply_to so replies go directly to them
    const toEmail = context.env.CONTACT_TO_EMAIL || "vinsmaf@hotmail.com";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Amaryllis <onboarding@resend.dev>",
        to: toEmail,
        reply_to: email,
        subject: `[Amaryllis] Message de ${nom}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#0e3b3a">Nouveau message — Amaryllis</h2>
            <p><strong>Nom :</strong> ${nom}</p>
            <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
            <p style="white-space:pre-wrap">${message}</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("Resend error:", body);
      return Response.json({ ok: false }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Contact error:", err);
    return Response.json({ ok: false }, { status: 500 });
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
