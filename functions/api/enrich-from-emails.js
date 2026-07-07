// GET /api/enrich-from-emails?secret=POSTSTAY_SECRET[&dry=1]
//
// Orchestre l'auto-complétion des résas OTA Airbnb : lit l'onglet « Emails » du Sheet (rempli
// par Zapier : Hotmail → Sheet), parse chaque mail de confirmation Airbnb (parseAirbnbMail),
// et enrichit la résa iCal correspondante dans « Toutes les Réservations » via l'action GAS
// enrichReservation (matching bien+nuits+check-in±1j, écriture NON destructive : ne remplit
// que les cases nom/prix vides). L'iCal Airbnb ne transmet ni nom ni prix → le mail les apporte.
//
// `?dry=1` : prévisualise (parse) sans rien écrire. Déclencheur prévu : cron horaire/quotidien.
import { parseAirbnbMail } from "../../src/utils/parseAirbnbMail.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (env.POSTSTAY_SECRET && url.searchParams.get("secret") !== env.POSTSTAY_SECRET) return json({ error: "Non autorisé" }, 401);
  const dry = url.searchParams.get("dry") === "1";
  const origin = url.origin;

  const proxy = (body) => fetch(`${origin}/api/sheets-proxy?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }).then(r => r.json()).catch(e => ({ ok: false, error: String(e?.message || e) }));

  // 1. Lire les emails (onglet Emails, 80 derniers)
  const emailsRes = await proxy({ action: "readEmails", n: 80 });
  if (!emailsRes?.ok) return json({ error: "Lecture onglet Emails échouée", detail: emailsRes }, 502);
  const rows = emailsRes.rows || [];
  const airbnb = rows.filter(r => /airbnb/i.test(`${r.Sender || ""} ${r.Subject || ""}`));

  // 2. Parser + enrichir
  let enrichis = 0, ignores = 0;
  const results = [];
  for (const m of airbnb) {
    const p = parseAirbnbMail({ subject: m.Subject || "", body: m.Body || "" });
    if (!p.bienId || !p.checkin || !p.checkout || !p.guestName) {
      ignores++; results.push({ subject: (m.Subject || "").slice(0, 60), skip: "parse incomplet", parsed: p }); continue;
    }
    const entry = { bienId: p.bienId, checkin: p.checkin, checkout: p.checkout, voyageur: p.guestName, montant: p.montantPayout };
    if (dry) { results.push({ ...entry, dry: true }); continue; }
    const er = await proxy({ action: "enrichReservation", ...entry });
    if (er?.matched && Object.keys(er.wrote || {}).length) enrichis++;
    results.push({ ...entry, matched: !!er?.matched, wrote: er?.wrote || {}, ambigu: er?.ambigu });
  }

  return json({ ok: true, dry, emails: rows.length, airbnbMails: airbnb.length, enrichis, ignores, results });
}
