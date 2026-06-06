import { resendFrom } from "./_email.js";
// Cloudflare Pages Function — GET /api/devis-solde-cron (cpw-100, phase C2)
// Cron quotidien (cron-job.org) : gère le SOLDE des devis payés en 2 fois.
//   • J-30 (ou après) : crée le lien Stripe du solde + l'envoie par email au voyageur.
//   • J-25 puis J-20  : relance si le solde n'est pas payé.
//   • J-15            : annulation auto + alerte hôte.
// Auth : ?secret=POSTSTAY_SECRET. Aperçu sans écrire : &dry=1.
//
// Statuts devis_paiements : acompte_attente → acompte_paye → solde_attente → solde_paye | annule
// (acompte_paye/solde_paye posés par stripe-webhook.js sur paiement réel.)

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

const fmtDate = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || "?";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};
const eur = (cents) => `${Math.round((cents || 0) / 100).toLocaleString("fr-FR")} €`;

function daysUntil(checkin) {
  if (!checkin) return null;
  const ci = new Date(checkin.slice(0, 10) + "T12:00:00Z");
  if (isNaN(ci)) return null;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
  return Math.round((ci - today) / 86400000);
}

async function stripeForm(env, path, params) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  return r.json();
}

async function createSoldeLink(env, row) {
  const product = await stripeForm(env, "products", {
    name: `Solde séjour — ${row.bien_id}`,
    description: `Solde restant — ${fmtDate(row.checkin)} → ${fmtDate(row.checkout)}${row.voyageur ? ` · ${row.voyageur}` : ""}`,
  });
  if (!product.id) throw new Error("stripe product: " + JSON.stringify(product));
  const price = await stripeForm(env, "prices", { product: product.id, unit_amount: String(row.solde), currency: "eur" });
  if (!price.id) throw new Error("stripe price: " + JSON.stringify(price));
  const link = await stripeForm(env, "payment_links", {
    "line_items[0][price]": price.id, "line_items[0][quantity]": "1", "payment_method_types[0]": "card",
    "after_completion[type]": "redirect", "after_completion[redirect][url]": "https://villamaryllis.com/merci?solde=1",
    "metadata[type]": "solde", "metadata[devisId]": row.id, "metadata[bienId]": row.bien_id,
    "metadata[checkin]": row.checkin, "metadata[checkout]": row.checkout, "metadata[voyageur]": row.voyageur || "",
  });
  if (!link.url) throw new Error("stripe link: " + JSON.stringify(link));
  return link.url;
}

async function sendMail(env, to, subject, html) {
  if (!env.RESEND_API_KEY || !to) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: resendFrom(env), to: [to], subject, html }),
    });
    return r.ok;
  } catch { return false; }
}

const soldeEmailHtml = (row, link, relance) => `
  <div style="font-family:Georgia,serif;color:#2b2b2b;line-height:1.7;max-width:560px;margin:0 auto">
    <h2 style="color:#0e3b3a">${relance ? "Rappel — solde de votre séjour" : "Solde de votre séjour à régler"}</h2>
    <p>Bonjour ${row.voyageur ? row.voyageur.split(" ")[0] : ""},</p>
    <p>Votre séjour approche (${fmtDate(row.checkin)} → ${fmtDate(row.checkout)}). Il reste à régler le <strong>solde de ${eur(row.solde)}</strong> pour finaliser votre réservation.</p>
    <p style="text-align:center;margin:28px 0">
      <a href="${link}" style="background:#c47254;color:#fff;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:700">Régler le solde (${eur(row.solde)})</a>
    </p>
    <p style="font-size:13px;color:#7a6b5a">Paiement sécurisé Stripe. Sans règlement du solde, la réservation pourra être annulée à J-15.</p>
    <p style="font-size:13px;color:#7a6b5a">— Amaryllis Locations</p>
  </div>`;

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const secret = env.POSTSTAY_SECRET || env.PRIX_RECAP_SECRET;
  if (!secret || url.searchParams.get("secret") !== secret) return json({ error: "Non autorisé" }, 401);
  const dry = url.searchParams.get("dry") === "1";

  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 500);

  // Table créée à la volée si aucun acompte n'a encore été généré (DB fraîche)
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS devis_paiements (
      id TEXT PRIMARY KEY, bien_id TEXT, voyageur TEXT, email TEXT,
      checkin TEXT, checkout TEXT, total INTEGER, acompte INTEGER, solde INTEGER,
      type TEXT, status TEXT, solde_link TEXT, solde_link_sent_at INTEGER,
      beds24_id TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`).run();
  } catch { /* ignore */ }

  // Colonnes de suivi des relances (ajoutées si absentes)
  for (const col of ["relance_count INTEGER DEFAULT 0", "last_relance_at INTEGER"]) {
    try { await db.prepare(`ALTER TABLE devis_paiements ADD COLUMN ${col}`).run(); } catch { /* existe déjà */ }
  }

  let rows = [];
  try {
    const r = await db.prepare(
      "SELECT * FROM devis_paiements WHERE status IN ('acompte_paye','solde_attente') AND solde > 0"
    ).all();
    rows = r.results || [];
  } catch (e) { return json({ error: "lecture: " + e.message }, 500); }

  const actions = [];
  const hostEmail = (env.NOTIFICATION_EMAIL || "contact@villamaryllis.com").split(",")[0].trim();

  for (const row of rows) {
    const d = daysUntil(row.checkin);
    if (d === null) continue;

    // ── J-30 : envoyer le lien de solde ──
    if (row.status === "acompte_paye" && d <= 30) {
      if (dry) { actions.push({ id: row.id, action: "envoyer_solde", days: d, montant: row.solde }); continue; }
      try {
        const link = await createSoldeLink(env, row);
        await sendMail(env, row.email, `Solde de votre séjour — ${fmtDate(row.checkin)}`, soldeEmailHtml(row, link, false));
        await db.prepare("UPDATE devis_paiements SET status='solde_attente', solde_link=?, solde_link_sent_at=unixepoch(), relance_count=0 WHERE id=?")
          .bind(link, row.id).run();
        actions.push({ id: row.id, action: "solde_envoye", days: d });
      } catch (e) { actions.push({ id: row.id, action: "erreur_solde", error: e.message }); }
      continue;
    }

    // ── Relances J-25 (relance #1) puis J-20 (relance #2) ──
    if (row.status === "solde_attente" && row.solde_link && d > 15) {
      const rc = row.relance_count || 0;
      const due = (rc === 0 && d <= 25) || (rc === 1 && d <= 20);
      if (due) {
        if (dry) { actions.push({ id: row.id, action: `relance_${rc + 1}`, days: d }); continue; }
        await sendMail(env, row.email, `Rappel — solde de votre séjour (${fmtDate(row.checkin)})`, soldeEmailHtml(row, row.solde_link, true));
        await db.prepare("UPDATE devis_paiements SET relance_count=?, last_relance_at=unixepoch() WHERE id=?").bind(rc + 1, row.id).run();
        actions.push({ id: row.id, action: `relance_${rc + 1}_envoyee`, days: d });
      }
      continue;
    }

    // ── J-15 : annulation auto + alerte hôte ──
    if (row.status === "solde_attente" && d <= 15) {
      if (dry) { actions.push({ id: row.id, action: "annuler", days: d }); continue; }
      await db.prepare("UPDATE devis_paiements SET status='annule' WHERE id=?").bind(row.id).run();
      await sendMail(env, hostEmail, `⚠️ Devis annulé (solde impayé) — ${row.bien_id} ${fmtDate(row.checkin)}`,
        `<div style="font-family:sans-serif"><h3>Devis annulé — solde non réglé à J-15</h3><p>${row.bien_id} · ${row.voyageur || "?"} · ${fmtDate(row.checkin)} → ${fmtDate(row.checkout)}<br>Solde impayé : ${eur(row.solde)}.<br>👉 Pense à rouvrir les dates à la vente (Airbnb/Booking/Beds24).</p></div>`);
      actions.push({ id: row.id, action: "annule", days: d });
      continue;
    }
  }

  return json({ ok: true, dry, scanned: rows.length, actions });
}
