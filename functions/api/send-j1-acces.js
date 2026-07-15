// Cloudflare Pages Function — GET /api/send-j1-acces
// Cron J-1 : envoie le code d'accès réel aux voyageurs arrivant demain.
// Lit le guide JSON du bien pour extraire la section "access" (étapes d'entrée).
// Auth : ?secret=<POSTSTAY_SECRET>
// Cron-job.org : GET https://villamaryllis.com/api/send-j1-acces?secret=<SECRET> chaque jour ~11h UTC

import { sendGuestEmail } from "./send-guest-email.js";
import { getBien } from "../../src/data/biens.js";
import { redactEmail } from "./_log.js";

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

// Villa Amaryllis/Zandoli/Géko/Mabouya partagent le même complexe (Sainte-Luce) —
// on donne toujours "Résidence Amaryllis" comme point d'arrivée, pas le nom du
// logement spécifique (le voyageur est orienté sur place vers son unité).
const RESIDENCE_BIENS = new Set(["amaryllis", "zandoli", "geko", "mabouya"]);

function lieuInfo(bienId, bien) {
  const lieuNom = RESIDENCE_BIENS.has(bienId) ? "Résidence Amaryllis" : (bien?.nom || "votre logement");
  const mapsUrl = bien?.coords
    ? `https://www.google.com/maps/search/?api=1&query=${bien.coords.lat},${bien.coords.lng}`
    : null;
  return { lieuNom, mapsUrl };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  // ?date=YYYY-MM-DD permet de déclencher manuellement pour une date donnée
  const dateParam = url.searchParams.get("date");
  const target = dateParam || dateStrPlusDays(1); // arrivées demain par défaut
  try {
    // Ajouter la colonne si elle n'existe pas (idempotent)
    await db.prepare("ALTER TABLE direct_bookings ADD COLUMN j1_acces_sent INTEGER DEFAULT 0").run().catch(() => {});
    await db.prepare(`ALTER TABLE direct_bookings ADD COLUMN status TEXT DEFAULT 'confirmed'`).run().catch(() => {});

    // Exclut les résas annulées (cf. cancel-booking.js).
    const { results } = await db.prepare(
      "SELECT rowid AS rid, * FROM direct_bookings WHERE checkin = ? AND j1_acces_sent = 0 AND email IS NOT NULL AND email != '' AND (status IS NULL OR status != 'cancelled')"
    ).bind(target).all();

    let sent = 0, failed = 0;
    for (const b of results || []) {
      // Récupérer le guide du bien pour les codes d'accès — lecture D1 directe
      // (PAS via GET /api/guides : cet endpoint masque volontairement la section
      // "access" pour les appels non-admin, ce qui empêchait ce cron de jamais
      // voir les vrais codes — bug trouvé le 2026-07-04).
      let accessHtml = null;
      try {
        const row = await db.prepare(
          "SELECT content_json FROM property_guides WHERE property_id = ?"
        ).bind(b.bien_id || "amaryllis").first();
        if (row?.content_json) {
          const guideData = JSON.parse(row.content_json);
          accessHtml = formatAccessSteps(guideData?.sections);
        }
      } catch {}

      const bien = getBien(b.bien_id || "amaryllis");
      const photoPath = bien?.photos?.[0];
      const { lieuNom, mapsUrl } = lieuInfo(b.bien_id, bien);

      const r = await sendGuestEmail(env, url.origin, {
        template: "j1-acces",
        to: b.email,
        subject: `Votre arrivée demain à ${b.bien_nom || "Amaryllis"} — codes d'accès`,
        vars: {
          prenom: b.prenom || "",
          bien_nom: b.bien_nom || "votre logement",
          checkin: b.checkin,
          checkin_heure: "17h",
          photo_url: photoPath ? `${url.origin}${photoPath}` : `${url.origin}/photos/amaryllis/01.webp`,
          lieu_nom: lieuNom,
          maps_url: mapsUrl || "https://villamaryllis.com",
          code_acces: accessHtml
            ? `Voici vos accès :<br><br>${accessHtml}`
            : "Vos codes d'accès vous seront communiqués directement par votre hôte.",
          guide_url: `https://villamaryllis.com/guide-sejour/${b.bien_id || "amaryllis"}?utm_source=email&utm_medium=email&utm_campaign=j1-acces`,
          wa_hote: "33610880772",
        },
      });

      if (r.ok) {
        await db.prepare("UPDATE direct_bookings SET j1_acces_sent = 1 WHERE rowid = ?").bind(b.rid).run();
        sent++;
      } else {
        console.error(`[j1-acces] échec ${redactEmail(b.email)}: ${r.error}`);
        failed++;
      }
    }
    return json({ ok: true, target, candidats: (results || []).length, sent, failed });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
