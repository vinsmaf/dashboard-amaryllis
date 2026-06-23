// GET /api/crm-lifecycle?secret=POSTSTAY_SECRET&segment=winback|fidelite[&dry=1]
// Phase 1 CRM — réactivation des clients passés (table crm_clients).
//   - winback  : dormants/perdus (dernier_sejour 6–36 mois) → « votre villa vous attend »
//   - fidelite : accès prioritaire haute saison à TOUS les anciens (nb_sejours ≥ 1)
// ?dry=1 (DÉFAUT IMPLICITE conseillé) : liste la cible sans envoyer.
// Anti-doublon : table crm_campaigns (un client n'est pas recontacté 2× pour la même campagne).
// RM advisory : AUCUNE remise chiffrée codée en dur — l'argument = le direct sans frais d'agence
// (factuel). Tout barème fidélité reste appliqué manuellement par Vincent.

import { resendFrom } from "./_email.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json" },
});

const SITE = "https://villamaryllis.com";

const SEGMENTS = {
  winback: {
    // dormants + perdus : dernier séjour entre 6 et 36 mois
    // Iguana exclu (bookable:false, locataire à l'année — RM-19).
    where: "c.nb_sejours >= 1 AND c.email IS NOT NULL AND c.email != '' " +
           "AND (c.biens IS NULL OR c.biens NOT LIKE '%iguana%') " +
           "AND c.dernier_sejour IS NOT NULL " +
           "AND julianday('now') - julianday(c.dernier_sejour) BETWEEN 180 AND 1095",
    subject: (p) => `${p}, votre villa en Martinique vous attend`,
    utm: "utm_source=email&utm_medium=crm&utm_campaign=winback",
    intro: (p, bien) =>
      `<p style="font-size:16px;margin:0 0 16px;">Bonjour ${p},</p>
       <p>Cela fait un moment que vous avez séjourné ${bien} — nous espérons que vous en gardez un beau souvenir.</p>
       <p>La Martinique vous manque ? <strong>En tant qu'ancien hôte, réservez en direct</strong> : pas de frais d'agence, contact direct avec nous, et la priorité sur les dates.</p>`,
    cta: "Revoir nos villas",
  },
  fidelite: {
    // accès prioritaire saisonnier : tous les anciens contactables (Iguana exclu — RM-19)
    where: "c.nb_sejours >= 1 AND c.email IS NOT NULL AND c.email != '' " +
           "AND (c.biens IS NULL OR c.biens NOT LIKE '%iguana%')",
    subject: (p) => `${p}, votre accès prioritaire — Amaryllis Locations`,
    utm: "utm_source=email&utm_medium=crm&utm_campaign=fidelite-saison",
    intro: (p, bien) =>
      `<p style="font-size:16px;margin:0 0 16px;">Bonjour ${p},</p>
       <p>La haute saison approche et les meilleures dates partent vite. Parce que vous avez déjà séjourné ${bien}, nous vous offrons un <strong>accès prioritaire</strong> avant l'ouverture publique des réservations.</p>
       <p>Réservez en direct, sans frais d'agence — répondez simplement à cet email et nous bloquons vos dates.</p>`,
    cta: "Choisir mes dates",
  },
};

const BIEN_LABELS = {
  amaryllis: "à la Villa Amaryllis", zandoli: "à Zandoli", geko: "au Géko",
  mabouya: "au studio Mabouya", schoelcher: "à l'appartement Schœlcher", nogent: "à Nogent",
};

function bienPhrase(biensRaw) {
  // crm_clients.biens = liste sérialisée (JSON ou CSV) → 1ʳᵉ valeur connue, sinon générique
  if (!biensRaw) return "avec nous";
  let first = "";
  try { const arr = JSON.parse(biensRaw); first = Array.isArray(arr) ? arr[0] : ""; }
  catch { first = String(biensRaw).split(/[;,]/)[0]; }
  const key = (first || "").trim().toLowerCase();
  return BIEN_LABELS[key] || "avec nous";
}

function buildHtml(client, seg) {
  const prenom = (client.prenom || (client.nom || "").split(" ")[0] || "cher voyageur").trim();
  const bien = bienPhrase(client.biens);
  return `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fdfaf3;border-radius:16px;overflow:hidden;border:1px solid #e8e0d0">
  <div style="background:#0e3b3a;padding:24px;text-align:center;">
    <div style="color:#fdfaf3;font-size:18px;font-weight:600;letter-spacing:1px;">AMARYLLIS</div>
    <div style="color:#c47254;font-size:11px;margin-top:4px;letter-spacing:2px;">LOCATIONS</div>
  </div>
  <div style="padding:32px 28px;color:#0e3b3a;line-height:1.6;">
    ${seg.intro(prenom, bien)}
    <div style="margin:24px 0;text-align:center;">
      <a href="${SITE}?${seg.utm}" style="display:inline-block;padding:14px 32px;background:#c47254;color:#fdfaf3;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${seg.cta}</a>
    </div>
    <p style="margin-top:24px;">À très bientôt en Martinique,<br><strong>Vincent</strong><br><span style="color:#7a6b5a;font-size:13px;">Amaryllis Locations · +33 6 10 88 07 72</span></p>
  </div>
  <div style="background:#f5ede0;padding:14px;text-align:center;font-size:11px;color:#7a6b5a;">
    Amaryllis Locations · contact@villamaryllis.com · villamaryllis.com<br>
    <a href="${SITE}/politique-confidentialite" style="color:#7a6b5a;">Se désabonner</a>
  </div>
</div>`;
}

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS crm_campaigns (
      client_id TEXT NOT NULL,
      campaign  TEXT NOT NULL,
      sent_at   INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (client_id, campaign)
    )
  `).run().catch(() => {});
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Fail-closed : secret absent = refus (cf. CROSS-LEARNINGS 2026-06-19).
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }

  const segKey = url.searchParams.get("segment") || "";
  const seg = SEGMENTS[segKey];
  if (!seg) return json({ error: "segment invalide", attendus: Object.keys(SEGMENTS) }, 400);

  const dry = url.searchParams.get("dry") === "1";
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);
  await ensureTable(db);

  // Cible = clients du segment PAS encore contactés pour cette campagne.
  const { results: cibles } = await db.prepare(
    `SELECT c.id, c.prenom, c.nom, c.email, c.biens, c.dernier_sejour, c.nb_sejours
     FROM crm_clients c
     LEFT JOIN crm_campaigns k ON k.client_id = c.id AND k.campaign = ?
     WHERE ${seg.where} AND k.client_id IS NULL
     ORDER BY c.ltv_total DESC`
  ).bind(segKey).all();

  if (dry) {
    return json({
      dry: true, segment: segKey, total: cibles.length,
      cibles: cibles.map(c => ({ id: c.id, nom: `${c.prenom || ""} ${c.nom || ""}`.trim(), email: c.email, dernier_sejour: c.dernier_sejour, nb_sejours: c.nb_sejours })),
    });
  }

  if (!env.RESEND_API_KEY) return json({ error: "RESEND_API_KEY absent" }, 503);

  const sent = [], failed = [];
  for (const c of cibles) {
    try {
      const prenom = (c.prenom || (c.nom || "").split(" ")[0] || "cher voyageur").trim();
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: resendFrom(env), to: [c.email], subject: seg.subject(prenom), html: buildHtml(c, seg) }),
      });
      if (res.ok) {
        await db.prepare(`INSERT OR IGNORE INTO crm_campaigns (client_id, campaign) VALUES (?, ?)`).bind(c.id, segKey).run();
        sent.push({ id: c.id, email: c.email });
      } else {
        failed.push({ id: c.id, email: c.email, error: (await res.text()).slice(0, 100) });
      }
    } catch (e) {
      failed.push({ id: c.id, email: c.email, error: e.message });
    }
  }

  return json({ ok: true, segment: segKey, sent: sent.length, failed: failed.length, sent_list: sent, failed_list: failed });
}
