// GET /api/enrich-from-emails?secret=POSTSTAY_SECRET[&dry=1]
//
// Orchestre l'auto-complétion des résas OTA Airbnb : lit l'onglet « Emails » du Sheet (rempli
// par Zapier : Hotmail → Sheet), parse chaque mail de confirmation Airbnb (parseAirbnbMail),
// et enrichit la résa iCal correspondante dans « Toutes les Réservations » via l'action GAS
// enrichReservation (matching bien+nuits+check-in±1j, écriture NON destructive : ne remplit
// que les cases nom/prix/voyageurs vides). L'iCal Airbnb ne transmet ni nom ni prix → le mail
// les apporte. Le montant écrit n'était jusqu'ici JAMAIS répercuté dans « revenus locatif 2026»
// (enrichReservation ne fait que poser des cellules, sans rebuild) → on déclenche ici le rebuild
// du bon bien/mois quand un montant vient d'être écrit (trouvé + corrigé le 2026-07-14).
//
// Notifs ntfy (trouvé + ajouté le 2026-07-14, suite à un bug de parsing resté invisible des
// semaines faute de signal) : (1) succès — une résa vient d'être enrichie ; (2) alerte — un mail
// reçu depuis plus de 6h n'a toujours pas produit d'enrichissement (parse cassé ou aucune résa
// iCal correspondante) → détecte une panne Zapier/parsing sans attendre que Vincent le remarque
// en ouvrant le dashboard.
//
// `?dry=1` : prévisualise (parse, sans écrire ni notifier). Déclencheur : cron horaire (Worker).
import { parseAirbnbMail } from "../../src/utils/parseAirbnbMail.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });
const STALE_MS = 6 * 3600 * 1000;

async function ntfy(env, { title, priority = "3", tags = "", body }) {
  if (!env.NTFY_TOPIC) return;
  try {
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
      method: "POST",
      headers: { Title: title, Priority: priority, Tags: tags, "Content-Type": "text/plain; charset=utf-8" },
      body,
    });
  } catch { /* notif best-effort, ne bloque jamais le run */ }
}

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
  const newlyEnriched = [];   // succès de ce run → notif ✅
  const staleUnenriched = []; // mail >6h, toujours pas de résa complète → notif ⚠️
  const now = Date.now();

  for (const m of airbnb) {
    const p = parseAirbnbMail({ subject: m.Subject || "", body: m.Body || "" });
    const emailAgeMs = (() => { const t = Date.parse(m.Date || ""); return Number.isFinite(t) ? now - t : null; })();
    const isStale = emailAgeMs !== null && emailAgeMs > STALE_MS;

    if (!p.bienId || !p.checkin || !p.checkout || !p.guestName) {
      ignores++; results.push({ subject: (m.Subject || "").slice(0, 60), skip: "parse incomplet", parsed: p });
      if (!dry && isStale) staleUnenriched.push({ subject: (m.Subject || "").slice(0, 60), reason: "parse incomplet", ageH: Math.round(emailAgeMs / 3600000) });
      continue;
    }
    const entry = { bienId: p.bienId, checkin: p.checkin, checkout: p.checkout, voyageur: p.guestName, montant: p.montantPayout, nbGuests: p.nbGuests };
    if (dry) { results.push({ ...entry, dry: true }); continue; }
    const er = await proxy({ action: "enrichReservation", ...entry });
    const wrote = er?.wrote || {};
    if (er?.matched && Object.keys(wrote).length) {
      enrichis++;
      newlyEnriched.push({ ...entry });
      // Le montant vient d'apparaître pour la 1ère fois → sans rebuild, il reste à 0 dans
      // « revenus locatif 2026 » indéfiniment (la sync initiale iCal l'avait déjà compté à 0€).
      if (wrote.montant) {
        const month = parseInt(String(p.checkin).slice(5, 7), 10);
        await proxy({ action: "revenus2026RebuildBienApply", fromMonth: month, bien: p.bienId });
      }
    } else if (!er?.matched && isStale) {
      staleUnenriched.push({ subject: (m.Subject || "").slice(0, 60), reason: "aucune résa iCal correspondante", ageH: Math.round(emailAgeMs / 3600000) });
    }
    results.push({ ...entry, matched: !!er?.matched, wrote, ambigu: er?.ambigu });
  }

  // 3. Notifs (jamais en dry-run)
  if (!dry && newlyEnriched.length > 0) {
    const lines = newlyEnriched.map(e => `• ${e.voyageur} — ${e.bienId} — ${e.checkin}→${e.checkout}${e.montant ? ` — ${e.montant}€` : ""}`);
    await ntfy(env, {
      title: `✅ ${newlyEnriched.length} résa${newlyEnriched.length > 1 ? "s" : ""} Airbnb enrichie${newlyEnriched.length > 1 ? "s" : ""}`,
      priority: "3", tags: "white_check_mark",
      body: lines.join("\n"),
    });
  }
  if (!dry && staleUnenriched.length > 0) {
    const lines = staleUnenriched.map(e => `• ${e.subject} — ${e.reason} (reçu il y a ${e.ageH}h)`);
    await ntfy(env, {
      title: `⚠️ ${staleUnenriched.length} résa${staleUnenriched.length > 1 ? "s" : ""} Airbnb jamais enrichie${staleUnenriched.length > 1 ? "s" : ""}`,
      priority: "4", tags: "warning",
      body: `${lines.join("\n")}\n\nVérifier le parseur (Airbnb a peut-être changé son format) ou Zapier (mail jamais transmis).`,
    });
  }

  return json({ ok: true, dry, emails: rows.length, airbnbMails: airbnb.length, enrichis, ignores, results });
}
