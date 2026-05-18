// Cloudflare Pages Function — /api/send-prix-recap
// Envoie un récap email hebdomadaire des prix + liens Airbnb via Resend
// Appel protégé par ?secret=PRIX_RECAP_SECRET
// Prévu pour être appelé par cron-job.org chaque lundi matin

const LISTINGS = [
  { nom: "Villa Amaryllis", id: "54269844",           base: 280 },
  { nom: "Zandoli",         id: "792768220924504884",  base: 220 },
  { nom: "Géko",            id: "1263155865459755724", base: 150 },
  { nom: "Mabouya",         id: "1046596752160926069", base: 110 },
  { nom: "Bellevue",        id: "24242415",            base: 100 },
];

function formatDate(d) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function buildHtml() {
  const today = new Date();

  const rows = LISTINGS.map(l => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #e8dcc8;font-weight:600;color:#0e3b3a;">${l.nom}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #e8dcc8;color:#555;">À partir de <strong>${l.base}€</strong>/nuit</td>
      <td style="padding:14px 16px;border-bottom:1px solid #e8dcc8;">
        <a href="https://www.airbnb.fr/hosting/listings/${l.id}/pricing"
           style="background:#c47254;color:#fff;padding:7px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">
          Modifier les prix →
        </a>
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf5e9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#0e3b3a;padding:32px 32px 24px;">
      <p style="color:#c47254;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Rappel automatique</p>
      <h1 style="color:#faf5e9;font-weight:300;font-size:24px;margin:0;letter-spacing:0.05em;">Synchronisation des prix Airbnb</h1>
      <p style="color:rgba(250,245,233,0.6);font-size:13px;margin:12px 0 0;">${formatDate(today)}</p>
    </div>
    <div style="padding:28px 32px 8px;">
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Pensez à vérifier et synchroniser vos tarifs sur Airbnb pour les 30 prochains jours.
        Cliquez sur chaque logement pour accéder directement à la page de tarification.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e8dcc8;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f5efe0;">
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Logement</th>
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Prix de base</th>
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Action</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:24px 32px 32px;">
      <a href="https://www.airbnb.fr/hosting/listings"
         style="display:inline-block;background:#0e3b3a;color:#faf5e9;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.06em;">
        Ouvrir Airbnb Host →
      </a>
    </div>
    <div style="background:#f5efe0;padding:16px 32px;text-align:center;">
      <p style="color:#aaa;font-size:12px;margin:0;">Message automatique · <a href="https://villamaryllis.com" style="color:#aaa;">villamaryllis.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const url    = new URL(context.request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== context.env.PRIX_RECAP_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resendKey = context.env.RESEND_API_KEY;
  const toEmail   = context.env.RECAP_EMAIL;

  if (!resendKey || !toEmail) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY et RECAP_EMAIL manquants" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Amaryllis <onboarding@resend.dev>",
        to: [toEmail],
        subject: `📅 Rappel prix Airbnb — ${new Date().toLocaleDateString("fr-FR")}`,
        html: buildHtml(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Resend error", details: data }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, sent_at: new Date().toISOString(), id: data.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
