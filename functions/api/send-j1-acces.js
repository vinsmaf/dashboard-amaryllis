// Cloudflare Pages Function — GET /api/send-j1-acces
// Cron J-1 : envoie le code d'accès réel aux voyageurs arrivant demain.
// Lit le guide JSON du bien pour extraire la section "access" (étapes d'entrée).
// Auth : ?secret=<POSTSTAY_SECRET>
// Cron-job.org : GET https://villamaryllis.com/api/send-j1-acces?secret=<SECRET> chaque jour ~11h UTC

import { sendGuestEmail } from "./send-guest-email.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

function dateStrPlusDays(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatAccessSteps(sections) {
  const accessSection = (sections || []).find(s => s.id === "access" || s.title?.toLowerCase().includes("accès"));
  if (!accessSection || !Array.isArray(accessSection.items)) return null;
  return accessSection.items
    .map((item, i) => `${i + 1}. <strong>${item.label}</strong>${item.value ? ` — ${item.value}` : ""}`)
    .join("<br>");
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  const target = dateStrPlusDays(1); // arrivées demain
  try {
    // Ajouter la colonne si elle n'existe pas (idempotent)
    await db.prepare("ALTER TABLE direct_bookings ADD COLUMN j1_acces_sent INTEGER DEFAULT 0").run().catch(() => {});

    const { results } = await db.prepare(
      "SELECT rowid AS rid, * FROM direct_bookings WHERE checkin = ? AND j1_acces_sent = 0 AND email IS NOT NULL AND email != ''"
    ).bind(target).all();

    let sent = 0, failed = 0;
    for (const b of results || []) {
      // Récupérer le guide du bien pour les codes d'accès
      let accessHtml = null;
      try {
        const guideRes = await fetch(`${url.origin}/api/guides?property_id=${b.bien_id || "amaryllis"}`);
        if (guideRes.ok) {
          const guideData = await guideRes.json();
          accessHtml = formatAccessSteps(guideData?.guide?.sections);
        }
      } catch {}

      const r = await sendGuestEmail(env, url.origin, {
        template: "pre-arrivee",
        to: b.email,
        subject: `Votre arrivée demain à ${b.bien_nom || "Amaryllis"} — codes d'accès`,
        vars: {
          prenom: b.prenom || "",
          bien_nom: b.bien_nom || "votre logement",
          checkin: b.checkin, checkout: b.checkout || "",
          code_acces: accessHtml
            ? `Voici vos accès :<br><br>${accessHtml}`
            : "Vos codes d'accès vous seront communiqués directement par votre hôte.",
          adresse: b.adresse || "Martinique",
          wa_hote: "33610880772",
          services_url: `https://villamaryllis.com/guide-sejour/${b.bien_id || "amaryllis"}?utm_source=email&utm_medium=email&utm_campaign=j1-acces`,
        },
      });

      if (r.ok) {
        await db.prepare("UPDATE direct_bookings SET j1_acces_sent = 1 WHERE rowid = ?").bind(b.rid).run();
        sent++;
      } else {
        console.error(`[j1-acces] échec ${b.email}: ${r.error}`);
        failed++;
      }
    }
    return json({ ok: true, target, candidats: (results || []).length, sent, failed });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
