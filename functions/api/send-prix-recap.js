// Cloudflare Pages Function — /api/send-prix-recap
// Envoie un récap WhatsApp hebdomadaire des prix + liens Airbnb
// Appel protégé par ?secret=PRIX_RECAP_SECRET
// Prévu pour être appelé par cron-job.org chaque lundi matin

const LISTINGS = [
  {
    nom: "Villa Amaryllis",
    id: "54269844",
    base: 280,
  },
  {
    nom: "Zandoli",
    id: "792768220924504884",
    base: 220,
  },
  {
    nom: "Géko",
    id: "1263155865459755724",
    base: 150,
  },
  {
    nom: "Mabouya",
    id: "1046596752160926069",
    base: 110,
  },
  {
    nom: "Bellevue",
    id: "24242415",
    base: 100,
  },
];

function formatDate(d) {
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function buildMessage() {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 86400000);

  const lines = [
    `📅 *Rappel prix Airbnb — semaine du ${formatDate(today)}*`,
    ``,
    `Vérifiez et synchronisez vos tarifs sur Airbnb pour les 30 prochains jours :`,
    ``,
  ];

  for (const l of LISTINGS) {
    lines.push(`*${l.nom}* — base ${l.base}€/nuit`);
    lines.push(`👉 https://www.airbnb.fr/hosting/listings/${l.id}/pricing`);
    lines.push(``);
  }

  lines.push(`_Message automatique — villamaryllis.com_`);

  return lines.join("\n");
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

  const phone  = context.env.CALLMEBOT_PHONE;
  const apikey = context.env.CALLMEBOT_APIKEY;

  if (!phone || !apikey) {
    return new Response(
      JSON.stringify({ error: "CALLMEBOT_PHONE et CALLMEBOT_APIKEY manquants" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const message = buildMessage();
  const encoded = encodeURIComponent(message);
  const waUrl   = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apikey}`;

  try {
    const res  = await fetch(waUrl);
    const body = await res.text();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "CallMeBot error", status: res.status, body }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, sent_at: new Date().toISOString(), preview: message.slice(0, 80) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
