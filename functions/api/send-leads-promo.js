// GET /api/send-leads-promo?secret=POSTSTAY_SECRET[&dry=1]
// data-056 — Envoie offre -10% aux leads "nouveau" (non encore répondus).
// Marque les leads envoyés en 'répondu' pour éviter le double envoi.
// ?dry=1 : simulation (liste sans envoi).

import { resendFrom } from "./_email.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json" },
});

const PROMO_CODE   = "DIRECT10";
const PROMO_TEXT   = "-10 % sur votre réservation directe (valable 30 jours)";
const SITE         = "https://villamaryllis.com";
const EXPIRE_DAYS  = 30;
const UTM          = "utm_source=email&utm_medium=lead-promo&utm_campaign=direct10";

const BIEN_LABELS = {
  amaryllis: "Villa Amaryllis", iguana: "Villa Iguana", zandoli: "Zandoli",
  geko: "Géko", mabouya: "Mabouya", schoelcher: "Appartement Bellevue",
  nogent: "Appartement Nogent",
};

function bienUrl(bien) {
  const id = bien && BIEN_LABELS[bien?.toLowerCase()] ? bien.toLowerCase() : null;
  return id ? `${SITE}/${id}?${UTM}&promo=${PROMO_CODE}` : `${SITE}?${UTM}&promo=${PROMO_CODE}`;
}

function expireDate() {
  const d = new Date();
  d.setDate(d.getDate() + EXPIRE_DAYS);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function buildHtml(lead) {
  const prenom = (lead.nom || "").split(" ")[0] || "cher visiteur";
  const bienNom = lead.bien ? (BIEN_LABELS[lead.bien.toLowerCase()] || lead.bien) : "nos logements";
  const url = bienUrl(lead.bien);
  const expire = expireDate();

  const promoBlock = `
    <div style="background:#fef3c7;border:2px dashed #f59e0b;padding:18px;margin:20px 0;text-align:center;border-radius:10px;">
      <div style="font-size:11px;color:#92400e;font-weight:600;letter-spacing:1px;">VOTRE CODE EXCLUSIF</div>
      <div style="font-size:26px;font-weight:800;color:#0e3b3a;letter-spacing:2px;margin:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;">${PROMO_CODE}</div>
      <div style="font-size:13px;color:#92400e;">${PROMO_TEXT}</div>
      <div style="font-size:11px;color:#92400e;margin-top:6px;opacity:.8;">Valable jusqu'au ${expire} — réservation directe uniquement</div>
    </div>`;

  return `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fdfaf3;border-radius:16px;overflow:hidden;border:1px solid #e8e0d0">
  <div style="background:#0e3b3a;padding:24px;text-align:center;">
    <div style="color:#fdfaf3;font-size:18px;font-weight:600;letter-spacing:1px;">AMARYLLIS</div>
    <div style="color:#c47254;font-size:11px;margin-top:4px;letter-spacing:2px;">LOCATIONS</div>
  </div>
  <div style="padding:32px 28px;color:#0e3b3a;line-height:1.6;">
    <p style="font-size:16px;margin:0 0 16px;">Bonjour ${prenom},</p>
    <p>Vous nous avez contactés au sujet de <strong>${bienNom}</strong>. Nous espérons avoir bien répondu à toutes vos questions.</p>
    <p>Pour vous remercier de votre intérêt, nous vous offrons une remise exclusive de <strong>10 % sur votre prochain séjour</strong> si vous réservez directement — sans frais d'agence, en contact direct avec nous.</p>
    ${promoBlock}
    <p style="font-size:13px;color:#7a6b5a;margin:0 0 20px;">Pour en bénéficier, mentionnez simplement le code <strong>${PROMO_CODE}</strong> lors de votre message ou réservez via le lien ci-dessous — nous appliquerons la remise manuellement avant de valider.</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;background:#c47254;color:#fdfaf3;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Voir les disponibilités</a>
    </div>
    <p style="margin-top:24px;">À bientôt en Martinique,<br><strong>Vincent</strong><br><span style="color:#7a6b5a;font-size:13px;">Amaryllis Locations · +33 6 10 88 07 72</span></p>
  </div>
  <div style="background:#f5ede0;padding:14px;text-align:center;font-size:11px;color:#7a6b5a;">
    Amaryllis Locations · contact@villamaryllis.com · villamaryllis.com<br>
    <a href="${SITE}/politique-confidentialite" style="color:#7a6b5a;">Se désabonner</a>
  </div>
</div>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  const dry = url.searchParams.get("dry") === "1";
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  const { results: leads } = await db.prepare(
    `SELECT id, nom, email, bien, created_at FROM contacts WHERE status = 'nouveau' AND email IS NOT NULL AND email != '' ORDER BY created_at ASC`
  ).all();

  if (dry) return json({ dry: true, total: leads.length, leads: leads.map(l => ({ id: l.id, nom: l.nom, email: l.email, bien: l.bien })) });

  if (!env.RESEND_API_KEY) return json({ error: "RESEND_API_KEY absent" }, 503);

  const sent = [];
  const failed = [];

  for (const lead of leads) {
    try {
      const html = buildHtml(lead);
      const prenom = (lead.nom || "").split(" ")[0] || "cher visiteur";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: resendFrom(env),
          to: [lead.email],
          subject: `${prenom}, votre offre exclusive -10 % — Amaryllis Locations`,
          html,
        }),
      });
      if (res.ok) {
        await db.prepare(`UPDATE contacts SET status = 'répondu', notes = ? WHERE id = ?`)
          .bind(`Promo DIRECT10 envoyée le ${new Date().toISOString().slice(0,10)}`, lead.id).run();
        sent.push({ id: lead.id, email: lead.email });
      } else {
        const err = await res.text();
        failed.push({ id: lead.id, email: lead.email, error: err.slice(0, 100) });
      }
    } catch (e) {
      failed.push({ id: lead.id, email: lead.email, error: e.message });
    }
  }

  return json({ ok: true, sent: sent.length, failed: failed.length, sent_list: sent, failed_list: failed });
}
