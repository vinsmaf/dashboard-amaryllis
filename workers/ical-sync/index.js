/**
 * Amaryllis — Cloudflare Worker : automatisation complète
 *
 * Crons :
 *   "0 * * * *"   → sync iCal toutes les heures
 *   "0 9 * * *"   → audit + rappels J-7conseils/J-3/J-1/J+1/J+2/J+3/J-7direct + alertes + gap pricing + yield pricing
 *   "0 6 * * 1"   → rapport hebdomadaire (lundi matin)
 *   "0 1 1 * *"   → export comptable mensuel (1er du mois)
 *
 * Fonctions principales :
 *   runSync            — Fetch iCal Airbnb + Booking, détecte nouvelles réservations
 *   runReminders       — Rappels J-7conseils, J-3, J-1 (+ ntfy ménage), J+1, J+2 avis, J+3 Google, J-7 direct
 *   runOccupancyAlerts — Alertes sous-occupation 30j + urgence 0 résa 14j
 *   runGapPricing      — Remises automatiques sur trous de calendrier 1-4 nuits
 *   runYieldPricing    — Yield management : -20%/-15% si occ < 30% sur 14j
 *   runMonitor         — Audit HTTP + alerte expiration token Beds24
 *   runWeeklyReport    — Rapport hebdomadaire (occupation, revenus, arrivées)
 *   runPrixRecap       — Rappel lundi : vérifier/synchroniser les prix Airbnb
 *   runMonthlyExport   — Export CSV comptable mensuel
 *   runCautionAutoRelease — Libération automatique des cautions Stripe J+3
 *
 * Secrets requis :
 *   RESEND_API_KEY        — Resend (email)
 *   APPS_SCRIPT_URL       — Google Apps Script
 *   NTFY_TOPIC            — Topic ntfy.sh pour notifs ménage (ex: menage-amaryllis-2025)
 *   NOTIFICATION_EMAIL    — Email hôte (défaut: contact@villamaryllis.com)
 *   BEDS24_TOKEN          — Token API Beds24 V2 (optionnel, alerte expiration)
 *   STRIPE_SECRET_KEY     — Stripe (caution + auto-release)
 *   WORKER_SECRET         — Token de sécurité pour les endpoints déclencheurs
 */

// ── iCal URLs Airbnb ─────────────────────────────────────────────────────────
// URLs Airbnb — lues depuis les secrets wrangler (ICAL_AIRBNB_*)
// Fallback sur les valeurs hardcodées pour la rétrocompatibilité
// Pour migrer : wrangler secret put ICAL_AIRBNB_AMARYLLIS --name amaryllis-ical-sync
const ICAL_AIRBNB_FALLBACK = {
  amaryllis:  "https://www.airbnb.fr/calendar/ical/54269844.ics?t=681e7d55c76a4845839d24c0bc18ca94",
  schoelcher: "https://www.airbnb.fr/calendar/ical/24242415.ics?t=400f2712fa95485692d5911972f5533d",
  geko:       "https://www.airbnb.fr/calendar/ical/1263155865459755724.ics?t=1c95f057feda4b2fa08519aad1001ca9",
  mabouya:    "https://www.airbnb.fr/calendar/ical/1046596752160926069.ics?t=05c0e5dbdd9542878d58aa760416cf4f",
  zandoli:    "https://www.airbnb.fr/calendar/ical/792768220924504884.ics?t=cfc774d9c7fa40bfbe5f0757ba06b090",
};

function getAirbnbUrls(env) {
  const map = {};
  const keys = { amaryllis: "ICAL_AIRBNB_AMARYLLIS", geko: "ICAL_AIRBNB_GEKO",
                 mabouya: "ICAL_AIRBNB_MABOUYA", schoelcher: "ICAL_AIRBNB_SCHOELCHER",
                 zandoli: "ICAL_AIRBNB_ZANDOLI" };
  for (const [bienId, envKey] of Object.entries(keys)) {
    map[bienId] = env[envKey] || ICAL_AIRBNB_FALLBACK[bienId];
  }
  return map;
}

function getBookingUrls(env) {
  const map = {};
  const keys = { amaryllis: "ICAL_BOOKING_AMARYLLIS", geko: "ICAL_BOOKING_GEKO",
                 mabouya: "ICAL_BOOKING_MABOUYA", schoelcher: "ICAL_BOOKING_SCHOELCHER",
                 zandoli: "ICAL_BOOKING_ZANDOLI" };
  for (const [bienId, envKey] of Object.entries(keys)) {
    if (env[envKey]) map[bienId] = env[envKey];
  }
  return map;
}

const NOMS = {
  amaryllis:  "Villa Amaryllis",
  schoelcher: "Bellevue Schœlcher",
  geko:       "Géko",
  mabouya:    "Mabouya",
  zandoli:    "Zandoli",
  iguana:     "Villa Iguana",
  nogent:     "Appartement Nogent",
};

const GUIDE_URLS = {
  amaryllis:  "https://villamaryllis.com/bienvenue/amaryllis",
  schoelcher: "https://villamaryllis.com/bienvenue/schoelcher",
  geko:       "https://villamaryllis.com/bienvenue/geko",
  mabouya:    "https://villamaryllis.com/bienvenue/mabouya",
  zandoli:    "https://villamaryllis.com/bienvenue/zandoli",
  iguana:     "https://villamaryllis.com/bienvenue/iguana",
  nogent:     "https://villamaryllis.com/bienvenue/nogent",
};

// ── Helpers dates ─────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function diffDays(a, b) {
  return Math.round((new Date(b + "T12:00:00Z") - new Date(a + "T12:00:00Z")) / 86400000);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ── Parser ICS ────────────────────────────────────────────────────────────────
function parseICS(text, bienId) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);
  for (const block of blocks) {
    const get = (key) => {
      const m = block.match(new RegExp(key + "[^:]*:([^\\r\\n]+)"));
      return m ? m[1].trim() : "";
    };
    const cleanDate = (s) => {
      const d = s.replace(/T.*/, "");
      return d.length === 8 ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}` : d;
    };
    const ci  = cleanDate(get("DTSTART"));
    const co  = cleanDate(get("DTEND"));
    const uid = get("UID");
    const sum = get("SUMMARY");
    if (!ci || !co || !uid) continue;
    if (/not available|blocked/i.test(sum)) continue;
    const desc = get("DESCRIPTION").replace(/\\n/g, "\n");
    const descGet = (patterns) => {
      for (const p of patterns) {
        const m = desc.match(new RegExp(p + "\\s*[:\\-]\\s*([^\\n\\r]+)", "i"));
        if (m) return m[1].trim();
      }
      return "";
    };
    const montantRaw = descGet(["Montant total","Total","Amount","Payout"]);
    const montantParsed = montantRaw ? parseFloat(montantRaw.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;
    const montant = (montantParsed > 0 && montantParsed <= 50000) ? montantParsed : 0;
    let voyageur = sum.replace(/^(Réservé|Reserved|Booking)\s*[-–]?\s*/i, "").replace(/\(.*\)/g, "").trim() || "Voyageur";
    events.push({ uid, bienId, nom: NOMS[bienId] || bienId, voyageur, checkin: ci, checkout: co, montant });
  }
  return events;
}

async function fetchICS(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AmaryllisSync/1.0)" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes("VCALENDAR")) throw new Error("Format ICS invalide");
    return text;
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`Timeout (>${timeoutMs}ms) : ${url}`);
    throw err;
  } finally {
    clearTimeout(tid);
  }
}

// ── WhatsApp via CallMeBot ───────────────────────────────────────────────────
async function sendWhatsApp(env, text) {
  const topic = env.NTFY_TOPIC;
  if (!topic) {
    console.log("[ntfy] NTFY_TOPIC absent — ignoré");
    return;
  }
  try {
    const r = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Title": "🏠 Ménage",
        "Priority": "high",
        "Tags": "broom",
      },
      body: text,
    });
    console.log(`[ntfy] ${r.ok ? "✓ envoyé" : "✗ erreur " + r.status}`);
  } catch (e) {
    console.error("[ntfy] Erreur:", e.message);
  }
}

// Adresse expéditeur vérifiée. ⚠️ Une variable RESEND_FROM cassée (domaine manquant,
// ex "Amaryllis <notifications@>") faisait rejeter TOUS les emails par Resend
// ("Domain not verified"). On valide donc la présence d'un domaine FQDN ; sinon on
// retombe sur l'adresse vérifiée en dur. Robuste quelle que soit la valeur d'env.
const VERIFIED_FROM = "Amaryllis <contact@villamaryllis.com>";
function resendFrom(env) {
  const f = env && env.RESEND_FROM;
  return (f && /@[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(f)) ? f : VERIFIED_FROM;
}

// ── Email via Resend ─────────────────────────────────────────────────────────
async function sendEmail(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY) return;
  const dest = to || env.NOTIFICATION_EMAIL || "contact@villamaryllis.com";
  const fromAddr = resendFrom(env);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromAddr,
      to: String(dest).split(",").map(s => s.trim()).filter(Boolean), // multi-destinataires (hotmail + gmail)
      subject,
      html,
    }),
  });
  if (!r.ok) console.error("[resend] Erreur:", await r.text());
  else console.log(`[resend] ✓ "${subject}"`);
}

function emailWrapper(content) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#f4ecdc;border-radius:12px;">${content}<p style="margin-top:24px;font-size:10px;color:#b0a898;text-align:center;">Amaryllis · automatique</p></div>`;
}

// ── Montants caution par bien ─────────────────────────────────────────────────
const CAUTION_AMOUNTS = {
  amaryllis: 1500, schoelcher: 1000, zandoli: 700,
  iguana: 500, geko: 500, mabouya: 500, nogent: 500,
};

// Crée un lien Stripe Checkout (caution) depuis le worker
async function createCautionLink(env, { bienId, voyageur, checkin, checkout }) {
  if (!env.STRIPE_SECRET_KEY) return null;
  const amount    = CAUTION_AMOUNTS[bienId] || 500;
  const bienNom   = NOMS[bienId] || bienId;
  const expiresAt = Math.floor(Date.now() / 1000) + 72 * 3600;

  const payload = new URLSearchParams({
    mode: "payment",
    "payment_intent_data[capture_method]": "manual",
    "payment_intent_data[metadata][type]":     "caution",
    "payment_intent_data[metadata][bienId]":   bienId,
    "payment_intent_data[metadata][checkin]":  checkin || "",
    "payment_intent_data[metadata][checkout]": checkout,
    "payment_intent_data[metadata][voyageur]": voyageur || "",
    "line_items[0][price_data][currency]":     "eur",
    "line_items[0][price_data][unit_amount]":  String(amount * 100),
    "line_items[0][price_data][product_data][name]": `Caution — ${bienNom}`,
    "line_items[0][price_data][product_data][description]":
      `Préautorisation de caution. Votre carte ne sera PAS débitée. Libération automatique 3 jours après votre départ (${checkout}).`,
    "line_items[0][quantity]": "1",
    "success_url":  "https://villamaryllis.com/?caution=ok",
    "cancel_url":   "https://villamaryllis.com/?caution=cancelled",
    "expires_at":   String(expiresAt),
    "locale":       "fr",
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    });
    const data = await res.json();
    return data.url || null;
  } catch { return null; }
}

// ── Nouvelle réservation ─────────────────────────────────────────────────────
async function sendNouvellesResas(env, nouvelles) {
  if (!env.RESEND_API_KEY) return;

  const cards = await Promise.all(nouvelles.map(async e => {
    const nuits = diffDays(e.checkin, e.checkout);
    const guideUrl = GUIDE_URLS[e.bienId] || "";
    // Caution uniquement pour Booking.com et direct (Airbnb gère lui-même)
    const cautionUrl = e.canal !== "airbnb" ? await createCautionLink(env, {
      bienId:   e.bienId,
      voyageur: e.voyageur,
      checkin:  e.checkin,
      checkout: e.checkout,
    }) : null;
    const cautionAmt = CAUTION_AMOUNTS[e.bienId] || 500;
    const canal = e.canal === "airbnb" ? "🏠 Airbnb" : e.canal === "booking" ? "🔵 Booking" : e.canal;

    return `
      <div style="background:#fff;border-radius:12px;padding:20px 22px;margin-bottom:16px;border-left:4px solid #0e3b3a;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
          <div>
            <div style="font-size:16px;font-weight:800;color:#0e3b3a;">${e.nom}</div>
            <div style="font-size:13px;color:#7a6b5a;margin-top:2px;">${e.voyageur || "Voyageur"} · ${canal}</div>
          </div>
          <div style="background:#e0f0e8;color:#1a6e3c;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;">${nuits} nuit${nuits > 1 ? "s" : ""}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;color:#0e3b3a;margin-bottom:14px;">
          <div>📅 <strong>Arrivée :</strong> ${formatDate(e.checkin)}</div>
          <div>🚪 <strong>Départ :</strong> ${formatDate(e.checkout)}</div>
          ${e.montant ? `<div>💶 <strong>Montant :</strong> ${e.montant}€</div>` : ""}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${guideUrl ? `<a href="${guideUrl}" style="background:#0e3b3a;color:#faf5e9;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;">📖 Guide voyageur</a>` : ""}
          ${cautionUrl ? `<a href="${cautionUrl}" style="background:#6366f1;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;">🔒 Lien caution ${cautionAmt}€</a>` : ""}
        </div>
        ${cautionUrl ? `<div style="font-size:10px;color:#b0a898;margin-top:8px;">Lien caution valable 72h · Copier et envoyer au voyageur via Airbnb/Booking</div>` : ""}
        ${(e.canal === "airbnb" || e.canal === "booking") ? `<div style="font-size:11px;color:#92400e;background:rgba(245,158,11,0.12);border-radius:6px;padding:8px 12px;margin-top:10px;">✏️ <strong>À faire dans l'admin :</strong> renseigner le <strong>nom du voyageur</strong> et le <strong>prix</strong> — ${e.canal === "airbnb" ? "Airbnb" : "Booking"} ne les transmet pas (sinon le CA est sous-compté).</div>` : ""}
      </div>
    `;
  }));

  await sendEmail(env, {
    subject: `🔔 ${nouvelles.length} nouvelle${nouvelles.length > 1 ? "s" : ""} réservation${nouvelles.length > 1 ? "s" : ""}`,
    html: emailWrapper(`
      <h2 style="color:#0e3b3a;margin:0 0 6px">🌺 Nouvelle${nouvelles.length > 1 ? "s" : ""} réservation${nouvelles.length > 1 ? "s" : ""}</h2>
      <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${new Date().toLocaleString("fr-FR", { timeZone: "America/Martinique" })} (heure Martinique)</p>
      ${cards.join("")}
      <div style="margin-top:20px;text-align:center;">
        <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px;">Ouvrir le planning →</a>
      </div>
    `),
  });

  // Notification push temps réel (ntfy) — en plus de l'email
  if (env.NTFY_TOPIC) {
    try {
      const lignes = nouvelles.map(e => {
        const n = diffDays(e.checkin, e.checkout);
        const c = e.canal === "airbnb" ? "Airbnb" : e.canal === "booking" ? "Booking" : (e.canal || "Direct");
        return `${e.nom} · ${formatDate(e.checkin)}→${formatDate(e.checkout)} (${n} nuit${n > 1 ? "s" : ""}) · ${c}`;
      }).join("\n");
      // Rappel : les résas OTA (Airbnb/Booking via iCal) arrivent sans nom ni prix → à compléter à la main.
      const otaACompleter = nouvelles.filter(e => e.canal === "airbnb" || e.canal === "booking").length;
      const body = otaACompleter > 0
        ? `${lignes}\n\n✏️ ${otaACompleter} à compléter dans l'admin (nom + prix — non transmis par l'OTA)`
        : lignes;
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Title": `🌺 ${nouvelles.length} nouvelle${nouvelles.length > 1 ? "s" : ""} réservation${nouvelles.length > 1 ? "s" : ""}`,
          "Priority": "high",
          "Tags": "tada,calendar",
          "Click": `${env.SITE_URL || "https://villamaryllis.com"}/admin`,
        },
        body,
      });
      console.log("[ntfy] ✓ notif nouvelle réservation envoyée");
    } catch (e) {
      console.error("[ntfy] notif résa erreur:", e.message);
    }
  }
}

// ── Rappels hôte (J-3 / J-1 / J+1 / J+2 avis / J-7 direct) ─────────────────
// RM-16 (hospitalité) — digest HÔTE des arrivées de demain (J+1) en ntfy, avec flag prioritaire
// sur les biens notés <4,7 (à soigner pour remonter la note). Miroir des notes : src/data/biens.js.
const LOW_RATED = new Set(["zandoli", "mabouya"]); // notes <4,7 — MAJ si les notes évoluent

async function runArrivalsDigest(env, allEvents) {
  if (!env.NTFY_TOPIC) return;
  const tomorrow = addDays(today(), 1);
  const arrivals = (allEvents || []).filter(e => e.checkin === tomorrow);
  if (!arrivals.length) { console.log("[arrivals] aucune arrivée demain"); return; }
  const lines = arrivals.map(e => {
    const who = e.voyageur && e.voyageur !== "?" ? e.voyageur : "voyageur";
    return `• ${e.nom || e.bienId} — ${who}${LOW_RATED.has(e.bienId) ? " ⭐ soigner (note basse)" : ""}`;
  });
  const hasPrio = arrivals.some(e => LOW_RATED.has(e.bienId));
  try {
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
      method: "POST",
      body: `Demain (${formatDate(tomorrow)}) — ${arrivals.length} arrivée(s) :\n${lines.join("\n")}\n\n→ préparer le geste d'accueil (RM-16).`,
      headers: { "Title": "🛬 Arrivées demain", "Priority": hasPrio ? "high" : "default", "Tags": "wave" },
    });
    console.log(`[arrivals] digest poussé (${arrivals.length} arrivées, prio=${hasPrio})`);
  } catch (e) { console.error("[arrivals] ntfy:", e.message); }
}

async function runReminders(env, allEvents, allEventsCtx) {
  const todayStr  = today();
  const eventsCtx = allEventsCtx || allEvents; // contexte complet pour chercher prochaine arrivée

  for (const e of allEvents) {
    const daysToCheckin  = diffDays(todayStr, e.checkin);
    const daysToCheckout = diffDays(todayStr, e.checkout);
    const nom   = e.nom;
    const guest = e.voyageur;
    const guide = GUIDE_URLS[e.bienId] || "https://villamaryllis.com";
    const nights = diffDays(e.checkin, e.checkout);

    // ── J-3 : rappel pré-arrivée ─────────────────────────────────────────────
    if (daysToCheckin === 3) {
      const kvKey = `reminder:j3:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      await sendEmail(env, {
        subject: `📋 J-3 · ${guest} arrive dans 3 jours — ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">📋 Rappel J-3 · Pré-arrivée</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · arrivée le ${formatDate(e.checkin)}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">💬 Message à envoyer via Airbnb/Booking :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

Votre séjour à ${nom} approche — nous avons hâte de vous accueillir !

Voici quelques informations pratiques pour préparer votre arrivée :
📅 Arrivée : ${formatDate(e.checkin)} à partir de 15h00
📅 Départ : ${formatDate(e.checkout)} avant 11h00
📖 Guide complet (WiFi, accès, bons plans) : ${guide}

N'hésitez pas si vous avez des questions. À très bientôt !
— Vincent</div>
          </div>
          ${(e.canal === "airbnb" || e.canal === "booking") ? `
          <div style="margin-top:12px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 14px;font-size:12px;color:#713f12;">
            ⚠️ <strong>${e.canal === "airbnb" ? "Airbnb" : "Booking.com"} envoie déjà ses propres rappels au voyageur.</strong> N'envoie ce message que si tu souhaites ajouter une info spécifique — sinon le voyageur recevrait 2 messages identiques.
          </div>` : ""}
          <div style="margin-top:16px;text-align:center;">
            <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Voir le planning →</a>
          </div>
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      console.log(`[reminders] J-3 envoyé — ${nom} · ${guest}`);
    }

    // ── Mi-séjour : check satisfaction + upsells (J+3 après check-in) ─────────
    // Ne déclenche que si le séjour fait 5+ nuits et que le voyageur est encore là
    if (daysToCheckin === -3 && daysToCheckout >= 1 && nights >= 5) {
      const kvKey = `reminder:midstay:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      const canalNom = e.canal === "airbnb" ? "Airbnb" : e.canal === "booking" ? "Booking.com" : "messagerie directe";
      const bookingLink = `https://villamaryllis.com/${e.bienId}`;

      await sendEmail(env, {
        subject: `🌟 Mi-séjour · ${guest} est chez vous depuis 3 jours — ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">🌟 Mi-séjour · Satisfaction + services</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · arrivée le ${formatDate(e.checkin)} · départ le ${formatDate(e.checkout)} (${daysToCheckout} nuit${daysToCheckout > 1 ? "s" : ""} restante${daysToCheckout > 1 ? "s" : ""})</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">✅ 2 actions à faire maintenant :</p>
            <ul style="margin:0 0 20px;padding-left:20px;font-size:13px;color:#3d2c1e;line-height:2.2;">
              <li>
                💬 <strong>Vérifier la satisfaction</strong> — envoyer ce message via ${canalNom} :<br/>
                <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:12px 16px;font-size:12px;color:#3d2c1e;white-space:pre-line;margin-top:8px;">Bonjour ${guest}, j'espère que votre séjour à ${nom} se déroule pour le mieux ! Tout est à votre convenance ? N'hésitez pas si vous avez besoin de quoi que ce soit. Profitez bien de ces derniers jours 🌴</div>
              </li>
              <li style="margin-top:12px;">
                🎁 <strong>Proposer des services supplémentaires</strong> :<br/>
                <ul style="margin:8px 0 0 0;padding-left:16px;font-size:12px;line-height:2;">
                  <li>🍽️ Chef à domicile (+150€/repas) — à proposer si séjour longue durée</li>
                  <li>🚗 Transfert retour aéroport (+80€)</li>
                  <li>🧹 Ménage intermédiaire (+60€) — si séjour >7 nuits</li>
                </ul>
              </li>
            </ul>
          </div>
          <div style="margin-top:16px;background:#e8f4f3;border-radius:8px;padding:14px 18px;font-size:12px;color:#0e3b3a;">
            📌 Rappel : le départ est prévu le ${formatDate(e.checkout)} avant 11h. L'équipe ménage est planifiée pour après le départ.
          </div>
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 30 });
      console.log(`[reminders] Mi-séjour envoyé — ${nom} · ${guest}`);
    }

    // ── J-1 : rappel pré-départ + WhatsApp ménage ────────────────────────────
    if (daysToCheckout === 1) {
      const kvKey = `reminder:j1:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      // Email hôte
      await sendEmail(env, {
        subject: `🧹 J-1 · ${guest} part demain — ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">🧹 Rappel J-1 · Départ demain</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · départ le ${formatDate(e.checkout)} avant 11h</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">💬 Message à envoyer via Airbnb/Booking :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

Votre séjour touche à sa fin — nous espérons que vous avez passé un excellent moment à ${nom} !

Pour le départ demain (avant 11h) :
✅ Éteindre climatisation et lumières
✅ Fermer fenêtres et volets
✅ Sortir les poubelles
✅ Remettre les clés dans le boîtier
✅ Laisser les draps sur le lit

Si vous avez apprécié votre séjour, un avis sur Airbnb nous aide énormément 🙏

Merci et à bientôt !
— Vincent</div>
          </div>
        `),
      });

      // WhatsApp ménage — checklist détaillée avec prochaine arrivée
      const nextArrival = eventsCtx
        .filter(x => x.bienId === e.bienId && x.checkin > e.checkout)
        .sort((a, b) => a.checkin.localeCompare(b.checkin))[0];
      const nextArrivalLine = nextArrival
        ? `➡️ Prochaine arrivée : ${formatDate(nextArrival.checkin)} (${nextArrival.voyageur})`
        : "➡️ Prochaine arrivée : aucune planifiée";
      const waText = [
        `🏠 MÉNAGE — ${nom}`,
        `👤 Voyageur : ${guest} (${nights} nuit${nights > 1 ? "s" : ""})`,
        `⏰ Départ avant 11h — ${formatDate(e.checkout)}`,
        nextArrivalLine,
        "",
        "📋 Checklist ménage :",
        "□ Retirer et mettre draps/serviettes à laver",
        "□ Vider et sortir les poubelles",
        "□ Nettoyage complet cuisine (plan de travail, four, frigo)",
        "□ Nettoyage WC",
        "□ Nettoyage salle de bain (douche, lavabo, miroir)",
        "□ Vérifier inventaire (vaisselle, linge, équipements)",
        "□ Aérer + remettre climatisation sur mode auto",
      ].join("\n");
      await sendWhatsApp(env, waText);

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      console.log(`[reminders] J-1 + WhatsApp ménage envoyés — ${nom} · ${guest}`);
    }

    // ── J+1 : message post-séjour ────────────────────────────────────────────
    if (daysToCheckout === -1) {
      const kvKey = `reminder:j1plus:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      await sendEmail(env, {
        subject: `⭐ J+1 · Message post-séjour à envoyer — ${guest} · ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">⭐ Rappel J+1 · Post-séjour</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · séjour du ${formatDate(e.checkin)} au ${formatDate(e.checkout)}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">💬 Message à envoyer via Airbnb/Booking :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

J'espère que votre séjour à ${nom} vous a plu ! C'est toujours un plaisir d'accueillir des voyageurs attentionnés.

Si vous souhaitez revenir, sachez que vous pouvez réserver directement sur notre site et économiser 15% par rapport à Airbnb :
🌐 https://villamaryllis.com

Un avis de votre part nous aiderait vraiment — merci d'avance 🙏

À bientôt en Martinique !
— Vincent</div>
          </div>
          ${(e.canal === "airbnb" || e.canal === "booking") ? `
          <div style="margin-top:12px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 14px;font-size:12px;color:#713f12;">
            ⚠️ <strong>${e.canal === "airbnb" ? "Airbnb" : "Booking.com"} envoie déjà un message post-séjour automatique.</strong> N'envoie ce message que si tu veux personnaliser — sinon le voyageur recevrait 2 messages.
          </div>` : ""}
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      console.log(`[reminders] J+1 envoyé — ${nom} · ${guest}`);
    }

    // ── J+2 : demande d'avis ─────────────────────────────────────────────────
    if (daysToCheckout === -2) {
      const kvKey = `reminder:j2review:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      const bookingLink = `https://villamaryllis.com/${e.bienId}`;
      const canalNote = e.canal === "airbnb"
        ? `<p style="margin:12px 0 0;font-size:12px;color:#0f766e;background:#e0f8f4;padding:10px 14px;border-radius:6px;">💡 Rappel : pense à laisser un avis au voyageur aussi sur Airbnb !</p>`
        : "";

      await sendEmail(env, {
        subject: `⭐ Demande d'avis — ${guest} · ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">⭐ Rappel J+2 · Demande d'avis</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · séjour du ${formatDate(e.checkin)} au ${formatDate(e.checkout)}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">💬 Message à copier-coller sur Airbnb/Booking pour demander un avis :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

J'espère que votre retour s'est bien passé 🙂 Votre séjour à ${nom} nous a fait très plaisir !

Si vous avez quelques minutes, un avis de votre part nous aide énormément à accueillir de futurs voyageurs dans les meilleures conditions.

Vous pouvez également retrouver et réserver directement nos logements sur :
🌐 ${bookingLink}

Merci encore, et à bientôt peut-être en Martinique !
— Vincent</div>
          </div>
          ${canalNote}
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 21 });
      console.log(`[reminders] J+2 avis envoyé — ${nom} · ${guest}`);
    }

    // ── J+3 : avis Google + fidélisation ─────────────────────────────────────
    if (daysToCheckout === -3) {
      const kvKey = `reminder:j3google:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      const bookingLink = `https://villamaryllis.com/${e.bienId}`;
      const directLink = `https://villamaryllis.com/reservation-directe-martinique`;
      const googleReviewUrl = env.GOOGLE_REVIEW_URL || "https://search.google.com/local/writereview?placeid=ChIJWbdLR7ghDowRCpp037VX9Jk";
      // Code promo unique par séjour — format mémorable
      const promoCode = `AMARYLLIS-${e.bienId.toUpperCase().slice(0,4)}-DIRECT`;

      await sendEmail(env, {
        subject: `🌟 J+3 · Avis Google + fidélisation — ${guest} · ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">🌟 Rappel J+3 · Avis Google & fidélisation</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · séjour du ${formatDate(e.checkin)} au ${formatDate(e.checkout)}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">📌 2 actions post-séjour à faire :</p>
            <ul style="margin:0 0 20px;padding-left:20px;font-size:13px;color:#3d2c1e;line-height:2.2;">
              <li>
                ⭐ <strong>Demander un avis Google</strong> — envoyer ce lien à ${guest} :<br/>
                <a href="${googleReviewUrl}" style="color:#0e3b3a;word-break:break-all;">${googleReviewUrl}</a>
              </li>
              <li>
                🎁 <strong>Offre fidélité −10%</strong> — réservation directe, sans frais Airbnb :<br/>
                Code : <strong style="font-family:monospace;font-size:14px;color:#c47254;">${promoCode}</strong><br/>
                Page directe : <a href="${directLink}" style="color:#0e3b3a;">${directLink}</a><br/>
                <span style="font-size:12px;color:#7a6b5a;">Mentionner le code lors de la réservation — économie de 12–18% vs Airbnb/Booking</span>
              </li>
            </ul>
            <p style="margin:0 0 12px;font-weight:700;">💬 Message à copier-coller pour ${guest} :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

J'espère que votre retour s'est bien passé et que votre séjour à ${nom} vous a laissé de beaux souvenirs !

Un service comme le vôtre mérite un avis — si vous avez 2 minutes, cela nous aide énormément :
⭐ ${googleReviewUrl}

Et si l'envie de revenir en Martinique vous prend, sachez que vous pouvez réserver directement sur notre site (sans frais Airbnb ni Booking, soit 12–18% d'économie) :
🌐 ${directLink}

Mentionnez le code <strong>${promoCode}</strong> pour bénéficier de -10% supplémentaires sur votre prochain séjour.

À très bientôt peut-être !
— Vincent, Résidence Amaryllis</div>
          </div>
          <div style="margin-top:16px;text-align:center;">
            <a href="${googleReviewUrl}" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;margin-right:8px;">Avis Google →</a>
            <a href="${directLink}" style="background:#c47254;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Page réservation directe →</a>
          </div>
          <p style="font-size:11px;color:#888;margin-top:20px;">💡 La caution de ${CAUTION_AMOUNTS[e.bienId] || 500}€ est libérée automatiquement aujourd'hui (J+3).</p>
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 30 });
      console.log(`[reminders] J+3 Google + fidélisation envoyé — ${nom} · ${guest}`);
    }

    // ── J-7 : réservation directe ────────────────────────────────────────────
    if (daysToCheckin === 7 && e.canal !== "airbnb" && e.canal !== "booking") {
      const kvKey = `reminder:j7direct:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      const cautionAmt = CAUTION_AMOUNTS[e.bienId] || 500;
      const guide = GUIDE_URLS[e.bienId] || "https://villamaryllis.com";

      await sendEmail(env, {
        subject: `🌺 J-7 · Réservation directe — ${guest} arrive bientôt · ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">🌺 Rappel J-7 · Réservation directe</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · arrivée le ${formatDate(e.checkin)}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">✅ Checklist actions hôte — réservation directe :</p>
            <ul style="margin:0;padding-left:20px;font-size:13px;color:#3d2c1e;line-height:2;">
              <li>📖 Envoyer le guide voyageur : <a href="${guide}" style="color:#0e3b3a;">${guide}</a></li>
              <li>📅 Confirmer l'heure d'arrivée et modalités d'accès avec ${guest}</li>
              <li>🔒 Envoyer le lien de caution (${cautionAmt}€) si pas encore fait</li>
              <li>🏠 Vérifier l'état du logement + linge de maison prêt</li>
              <li>📞 Partager un numéro d'urgence joignable le jour J</li>
            </ul>
          </div>
          <div style="margin-top:16px;text-align:center;">
            <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Voir le planning →</a>
          </div>
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      console.log(`[reminders] J-7 direct envoyé — ${nom} · ${guest}`);
    }

    // ── J-7 : conseils locaux (Airbnb / Booking) ──────────────────────────────
    if (daysToCheckin === 7 && (e.canal === "airbnb" || e.canal === "booking")) {
      const kvKey = `reminder:j7conseils:${e.uid}`;
      if (await env.ICAL_STORE.get(kvKey)) continue;

      const guide = GUIDE_URLS[e.bienId] || "https://villamaryllis.com";
      const canalNom = e.canal === "airbnb" ? "Airbnb" : "Booking.com";
      const canalIcon = e.canal === "airbnb" ? "🏠" : "📋";
      const nights = diffDays(e.checkin, e.checkout);

      await sendEmail(env, {
        subject: `🌴 J-7 · Conseils locaux à partager — ${guest} · ${nom}`,
        html: emailWrapper(`
          <h2 style="color:#0e3b3a;margin:0 0 8px">🌴 Rappel J-7 · Conseils locaux à partager</h2>
          <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${nom} · ${guest} · arrivée le ${formatDate(e.checkin)} · ${nights} nuit${nights > 1 ? "s" : ""} · via ${canalNom}</p>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;font-size:14px;color:#0e3b3a;line-height:1.9;">
            <p style="margin:0 0 12px;font-weight:700;">${canalIcon} Message à envoyer via ${canalNom} :</p>
            <div style="background:#f8f4ed;border-left:3px solid #c47254;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#3d2c1e;white-space:pre-line;">Bonjour ${guest},

Nous avons hâte de vous accueillir dans ${nom} dans une semaine !

Voici notre guide voyageur avec nos adresses et bons plans pour votre séjour :
👉 ${guide}

Vous y trouverez :
• Les meilleures plages à proximité
• Nos restaurants préférés (avec les adresses que les guides ne mentionnent pas)
• Les activités incontournables selon la saison
• Les infos pratiques pour votre arrivée

N'hésitez pas à nous contacter si vous avez des questions. À très bientôt !
— Vincent & Amaryllis Locations</div>
          </div>
          <div style="background:#e8f4f3;border-radius:8px;padding:16px 20px;margin-top:16px;font-size:13px;color:#0e3b3a;">
            <p style="margin:0 0 8px;font-weight:700;">✅ Checklist J-7 :</p>
            <ul style="margin:0;padding-left:20px;line-height:2;">
              <li>Copier-coller le message ci-dessus sur ${canalNom}</li>
              <li>Vérifier les horaires d'arrivée avec ${guest}</li>
              <li>Préparer les codes d'accès et plan de la maison</li>
              <li>Linge de maison commandé / confirmé</li>
            </ul>
          </div>
          <div style="margin-top:16px;text-align:center;">
            <a href="${guide}" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Voir le guide voyageur →</a>
          </div>
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      console.log(`[reminders] J-7 conseils locaux envoyé — ${nom} · ${guest}`);
    }
  }
}

// ── Rapport hebdomadaire (lundi) ─────────────────────────────────────────────
// Prix moyens par nuit (estimation pour le rapport — hors saison)
const BASE_PRIX = {
  amaryllis: 300, schoelcher: 130, zandoli: 200,
  iguana: 150, geko: 110, mabouya: 100, nogent: 85,
};

async function runWeeklyReport(env, allEvents) {
  const todayStr = today();
  const in7  = addDays(todayStr, 7);
  const in14 = addDays(todayStr, 14);
  const in30 = addDays(todayStr, 30);

  // ── Arrivées 14j ──
  const upcoming = allEvents
    .filter(e => e.checkin >= todayStr && e.checkin <= in14)
    .sort((a, b) => a.checkin.localeCompare(b.checkin));

  // ── Départs 7j ──
  const departures = allEvents
    .filter(e => e.checkout >= todayStr && e.checkout <= in7)
    .sort((a, b) => a.checkout.localeCompare(b.checkout));

  // ── Occupation + revenu par bien (7j et 30j) ──
  const occ7 = {}, occ30 = {}, rev7 = {}, rev30 = {};
  for (const e of allEvents) {
    for (const [horizon, occMap, revMap, days] of [[in7, occ7, rev7, 7], [in30, occ30, rev30, 30]]) {
      if (e.checkin > horizon || e.checkout < todayStr) continue;
      const start = e.checkin > todayStr ? e.checkin : todayStr;
      const end   = e.checkout < horizon ? e.checkout : horizon;
      const n = diffDays(start, end);
      occMap[e.bienId] = (occMap[e.bienId] || 0) + n;
      revMap[e.bienId] = (revMap[e.bienId] || 0) + n * (BASE_PRIX[e.bienId] || 100);
    }
  }

  const totalRev7  = Object.values(rev7).reduce((s, v) => s + v, 0);
  const totalRev30 = Object.values(rev30).reduce((s, v) => s + v, 0);
  const totalOcc7  = Object.values(occ7).reduce((s, v) => s + v, 0);
  const maxOcc7    = Object.keys(NOMS).length * 7;
  const globalPct7 = Math.round(totalOcc7 / maxOcc7 * 100);

  // ── Trous détectés (gap pricing) ──
  const gapRaw = await env.ICAL_STORE.get("gap_prices").catch(() => null);
  const gaps = gapRaw ? JSON.parse(gapRaw) : {};
  const gapCount = Object.values(gaps).reduce((s, m) => s + Object.keys(m).length, 0);
  const gapBiens = Object.entries(gaps).filter(([, m]) => Object.keys(m).length > 0).map(([id]) => NOMS[id] || id);

  // ── Lignes tableau occupation ──
  const propRows = Object.entries(NOMS).map(([id, nom]) => {
    const o7  = occ7[id]  || 0;
    const o30 = occ30[id] || 0;
    const p7  = Math.round(o7  / 7  * 100);
    const p30 = Math.round(o30 / 30 * 100);
    const bar = "█".repeat(Math.round(p7 / 10)) + "░".repeat(10 - Math.round(p7 / 10));
    const r7  = (rev7[id]  || 0).toLocaleString("fr-FR");
    const hasGap = gaps[id] && Object.keys(gaps[id]).length > 0;
    return `<tr style="border-bottom:1px solid #f0e8d8;">
      <td style="padding:8px 12px;color:#0e3b3a;font-weight:600;">${nom}${hasGap ? ' <span style="font-size:10px;background:#e0f8f4;color:#0f766e;padding:1px 5px;border-radius:8px;">-prix gap</span>' : ""}</td>
      <td style="padding:8px 12px;font-family:monospace;font-size:12px;color:#0e3b3a;">${bar}</td>
      <td style="padding:8px 12px;text-align:right;color:#7a6b5a;">${p7}%</td>
      <td style="padding:8px 12px;text-align:right;color:#7a6b5a;">${p30}%</td>
      <td style="padding:8px 12px;text-align:right;color:#1a6e3c;font-weight:600;">~${r7}€</td>
    </tr>`;
  }).join("");

  const arriveeRows = upcoming.map(e => {
    const canal = e.canal === "airbnb" ? "🏠" : e.canal === "booking" ? "🔵" : "🌐";
    return `<tr style="border-bottom:1px solid #f0e8d8;">
      <td style="padding:6px 12px;color:#0e3b3a;">${formatDate(e.checkin)}</td>
      <td style="padding:6px 12px;font-weight:600;color:#0e3b3a;">${e.nom}</td>
      <td style="padding:6px 12px;color:#7a6b5a;">${e.voyageur || "—"} ${canal}</td>
      <td style="padding:6px 12px;color:#7a6b5a;text-align:right;">${diffDays(e.checkin, e.checkout)} nuits</td>
    </tr>`;
  }).join("") || `<tr><td colspan="4" style="padding:12px;color:#b0a898;text-align:center;font-style:italic;">Aucune arrivée prévue</td></tr>`;

  const departRows = departures.map(e =>
    `<tr style="border-bottom:1px solid #f0e8d8;">
      <td style="padding:6px 12px;color:#0e3b3a;">${formatDate(e.checkout)}</td>
      <td style="padding:6px 12px;font-weight:600;color:#0e3b3a;">${e.nom}</td>
      <td style="padding:6px 12px;color:#7a6b5a;">${e.voyageur || "—"}</td>
    </tr>`
  ).join("") || `<tr><td colspan="3" style="padding:12px;color:#b0a898;text-align:center;font-style:italic;">Aucun départ cette semaine</td></tr>`;

  const weekLabel = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";

  await sendEmail(env, {
    subject: `📊 Rapport semaine — ${globalPct7}% occ. · ~${totalRev7.toLocaleString("fr-FR")}€`,
    html: emailWrapper(`
      <h2 style="color:#0e3b3a;margin:0 0 4px">📊 Rapport hebdomadaire</h2>
      <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">Semaine du ${weekLabel}</p>

      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px;">
        <div style="background:#fff;border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#0e3b3a;">${globalPct7}%</div>
          <div style="font-size:11px;color:#7a6b5a;margin-top:3px;">Occ. 7 jours</div>
        </div>
        <div style="background:#fff;border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#1a6e3c;">~${totalRev7.toLocaleString("fr-FR")}€</div>
          <div style="font-size:11px;color:#7a6b5a;margin-top:3px;">Revenus 7j estimés</div>
        </div>
        <div style="background:#fff;border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#0369a1;">~${totalRev30.toLocaleString("fr-FR")}€</div>
          <div style="font-size:11px;color:#7a6b5a;margin-top:3px;">Revenus 30j estimés</div>
        </div>
      </div>

      ${gapCount > 0 ? `
      <div style="background:#e0f8f4;border-radius:8px;padding:12px 16px;margin-bottom:20px;border-left:3px solid #14b8a6;">
        <strong style="color:#0f766e;">🏷 ${gapCount} date${gapCount > 1 ? "s" : ""} à prix réduit (gap pricing)</strong>
        <span style="color:#0f766e;font-size:13px;"> — ${gapBiens.join(", ")}</span>
      </div>` : ""}

      <h3 style="color:#0e3b3a;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 8px">Occupation par logement</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <thead><tr style="background:#e8e0d0;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Logement</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">7 jours</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#7a6b5a;">Occ. 7j</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#7a6b5a;">Occ. 30j</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#7a6b5a;">Rev. est. 7j</th>
        </tr></thead>
        <tbody>${propRows}</tbody>
      </table>

      <h3 style="color:#0e3b3a;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 8px">Arrivées — 14 prochains jours</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <thead><tr style="background:#e8e0d0;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Date</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Logement</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Voyageur</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#7a6b5a;">Durée</th>
        </tr></thead>
        <tbody>${arriveeRows}</tbody>
      </table>

      <h3 style="color:#0e3b3a;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 8px">Départs — 7 prochains jours</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <thead><tr style="background:#e8e0d0;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Date</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Logement</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#7a6b5a;">Voyageur</th>
        </tr></thead>
        <tbody>${departRows}</tbody>
      </table>

      <div style="text-align:center;">
        <a href="${siteUrl}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:13px;">Ouvrir le dashboard →</a>
      </div>
    `),
  });

  console.log("[weekly] Rapport envoyé");
}

// ── Alertes sous-occupation ──────────────────────────────────────────────────
// Persiste l'occupation forward (30j/90j) par bien dans rm_kpi_snapshots → le RM "voit"
// enfin l'occupation réelle. Mirroir de src/utils/occupancy.js (garder synchro). Advisory only.
async function runOccupancySnapshot(env, allEvents) {
  if (!env.revenue_manager) { console.log("[occupancy] pas de binding D1 — skip"); return; }
  const db = env.revenue_manager;
  const todayStr = today();
  const activeBiens = new Set(Object.keys(getAirbnbUrls(env)));
  Object.keys(NOMS).forEach((id) => activeBiens.add(id)); // inclut nogent (Beds24)

  function nightsBooked(bienId, fromStr, toStr) {
    let n = 0;
    for (const e of allEvents) {
      if (e.bienId !== bienId || !e.checkin || !e.checkout) continue;
      const start = e.checkin > fromStr ? e.checkin : fromStr;
      const end   = e.checkout < toStr ? e.checkout : toStr;
      if (end > start) n += diffDays(start, end);
    }
    return n;
  }

  let written = 0;
  for (const bienId of activeBiens) {
    for (const [period, horizon] of [["30d", 30], ["90d", 90]]) {
      const to   = addDays(todayStr, horizon);
      const sold = Math.min(horizon, nightsBooked(bienId, todayStr, to));
      const rate = horizon > 0 ? sold / horizon : 0;
      const id   = `${bienId}-${todayStr}-${period}`;
      try {
        await db.prepare(
          "INSERT INTO rm_kpi_snapshots (id, property_id, snapshot_date, period_type, occupancy_rate, nights_sold, nights_available, calculated_at) " +
          "VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET occupancy_rate=excluded.occupancy_rate, nights_sold=excluded.nights_sold, nights_available=excluded.nights_available, calculated_at=excluded.calculated_at"
        ).bind(id, bienId, todayStr, period, rate, sold, horizon, Math.floor(Date.now() / 1000)).run();
        written++;
      } catch (e) { console.error(`[occupancy] ${bienId} ${period}: ${e.message}`); }
    }
  }
  console.log(`[occupancy] snapshot écrit (${written} lignes, ${activeBiens.size} biens)`);
}

async function runOccupancyAlerts(env, allEvents) {
  const todayStr = today();
  const in14 = addDays(todayStr, 14);
  const in30 = addDays(todayStr, 30);

  const byProp = {}, byProp14 = {};
  for (const e of allEvents) {
    if (e.checkout < todayStr) continue;

    // Occupation 30j
    if (e.checkin <= in30) {
      const start = e.checkin > todayStr ? e.checkin : todayStr;
      const end   = e.checkout < in30 ? e.checkout : in30;
      byProp[e.bienId] = (byProp[e.bienId] || 0) + diffDays(start, end);
    }

    // Occupation 14j
    if (e.checkin <= in14) {
      const start14 = e.checkin > todayStr ? e.checkin : todayStr;
      const end14   = e.checkout < in14 ? e.checkout : in14;
      byProp14[e.bienId] = (byProp14[e.bienId] || 0) + diffDays(start14, end14);
    }
  }

  // Biens actifs (dans Airbnb ou Booking URLs)
  const activeBiens = new Set(Object.keys(getAirbnbUrls(env)));

  // Alertes 0 résa dans 14j pour biens actifs
  const zeroAlerts = [];
  for (const bienId of activeBiens) {
    if ((byProp14[bienId] || 0) === 0) {
      zeroAlerts.push(bienId);
    }
  }
  const hasUrgent = zeroAlerts.length > 0;

  const alerts = Object.entries(NOMS).filter(([id]) => {
    const pct = ((byProp[id] || 0) / 30) * 100;
    return pct < 40; // seuil 40%
  });

  if (alerts.length === 0 && !hasUrgent) return;

  const urgentBlock = hasUrgent ? `
    <div style="background:#fde8e0;border-radius:8px;padding:14px 18px;margin-bottom:20px;border-left:4px solid #c47254;">
      <strong style="color:#c47254;">🚨 URGENT — 0 réservation dans les 14 prochains jours :</strong>
      <ul style="margin:8px 0 0;padding-left:18px;color:#c47254;font-size:13px;">
        ${zeroAlerts.map(id => `<li>${NOMS[id] || id}</li>`).join("")}
      </ul>
    </div>` : "";

  const subjectPrefix = hasUrgent ? "⚠️ URGENT" : "⚠️";

  const rows = alerts.map(([id, nom]) => {
    const occ   = byProp[id] || 0;
    const pct   = Math.round(occ / 30 * 100);
    const occ14 = byProp14[id] || 0;
    const pct14 = Math.round(occ14 / 14 * 100);
    const isZero14 = occ14 === 0 && activeBiens.has(id);
    return `<tr><td style="padding:8px 14px;font-weight:600;color:#0e3b3a;">${nom}${isZero14 ? ' <span style="font-size:10px;background:#fde8e0;color:#c47254;padding:1px 5px;border-radius:8px;">0 résa 14j</span>' : ""}</td><td style="padding:8px 14px;color:#c47254;font-weight:700;">${pct14}%</td><td style="padding:8px 14px;color:#c47254;font-weight:700;">${pct}%</td><td style="padding:8px 14px;color:#7a6b5a;">${occ} nuits sur 30</td></tr>`;
  }).join("");

  await sendEmail(env, {
    subject: `${subjectPrefix} ${alerts.length} logement${alerts.length > 1 ? "s" : ""} sous-occupé${alerts.length > 1 ? "s" : ""} — 30 prochains jours`,
    html: emailWrapper(`
      <h2 style="color:#c47254;margin:0 0 8px">${hasUrgent ? "🚨 Alerte URGENTE — sous-occupation" : "⚠️ Alerte sous-occupation"}</h2>
      <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">Logements avec moins de 40% d'occupation dans les 30 prochains jours</p>
      ${urgentBlock}
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#fde8e0;">
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Logement</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Occ. 14j</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Occ. 30j</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Détail</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:16px;font-size:13px;color:#7a6b5a;">💡 Pensez à ajuster vos tarifs ou à promouvoir ces dates.</p>
      <div style="margin-top:16px;text-align:center;">
        <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="background:#c47254;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:13px;">Gérer les tarifs →</a>
      </div>
    `),
  });

  console.log(`[occupancy] Alerte envoyée — ${alerts.length} logement(s) sous le seuil${hasUrgent ? `, ${zeroAlerts.length} URGENT(s) 0 résa 14j` : ""}`);
}

// ── Alertes inventaire (cron quotidien 9h UTC) ───────────────────────────────
// Envoie un email récap au propriétaire si des items sont en rupture imminente.
// Implémente log-008 (Option B Phase 5).
async function runInventoryAlerts(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    const r = await fetch(`${siteUrl}/api/inventory?action=alerts`);
    const d = await r.json();
    const items = (d.items || []).filter(i => i.status === "critique" || i.status === "rupture");
    if (items.length === 0) {
      console.log("[inventory-alerts] ✓ Aucun item critique");
      return;
    }

    // Grouper par bien
    const byBien = {};
    for (const it of items) {
      if (!byBien[it.bien_id]) byBien[it.bien_id] = [];
      byBien[it.bien_id].push(it);
    }

    // Construire HTML email
    const sections = Object.entries(byBien).map(([bienId, list]) => {
      const rows = list.map(it => `
        <tr>
          <td style="padding:6px 10px;font-size:12px;color:#0e3b3a">${it.item_name}</td>
          <td style="padding:6px 10px;font-size:11px;color:#94a3b8">${it.category}</td>
          <td style="padding:6px 10px;font-size:13px;color:${it.status === "rupture" ? "#dc2626" : "#ef4444"};font-weight:700;text-align:right;font-family:var(--font-mono)">${it.qty_current} ${it.unit}</td>
          <td style="padding:6px 10px;font-size:11px;color:#64748b;text-align:right;font-family:var(--font-mono)">min ${it.qty_min}</td>
          <td style="padding:6px 10px;font-size:11px;color:${it.eta_rupture_days !== null && it.eta_rupture_days < 7 ? "#ef4444" : "#94a3b8"};text-align:right;font-family:var(--font-mono)">${it.eta_rupture_days !== null ? it.eta_rupture_days + "j" : "—"}</td>
        </tr>
      `).join("");
      return `
        <div style="margin-bottom:18px">
          <h3 style="margin:0 0 8px;color:#0e3b3a;font-size:13px;text-transform:uppercase;letter-spacing:1px">${bienId.toUpperCase()} — ${list.length} item${list.length > 1 ? "s" : ""}</h3>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;overflow:hidden">
            <thead><tr style="background:#f8f4ed"><th style="padding:6px 10px;text-align:left;font-size:10px;color:#64748b">Item</th><th style="padding:6px 10px;text-align:left;font-size:10px;color:#64748b">Cat.</th><th style="padding:6px 10px;text-align:right;font-size:10px;color:#64748b">Stock</th><th style="padding:6px 10px;text-align:right;font-size:10px;color:#64748b">Min</th><th style="padding:6px 10px;text-align:right;font-size:10px;color:#64748b">ETA</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join("");

    await sendEmail(env, {
      subject: `🚨 Inventaire — ${items.length} item${items.length > 1 ? "s" : ""} en rupture imminente`,
      html: emailWrapper(`
        <h2 style="color:#dc2626;margin:0 0 8px">🚨 Alerte stocks bas</h2>
        <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${items.length} item${items.length > 1 ? "s" : ""} en stock bas ou rupture sur ${Object.keys(byBien).length} bien${Object.keys(byBien).length > 1 ? "s" : ""}. Penser à commander.</p>
        ${sections}
        <div style="margin-top:20px;text-align:center">
          <a href="${siteUrl}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:700;font-size:13px;display:inline-block">Voir Inventaire →</a>
        </div>
      `),
    });
    console.log(`[inventory-alerts] Email envoyé — ${items.length} items en rupture`);
  } catch (e) {
    console.error("[inventory-alerts] Erreur:", e.message);
  }
}

// ── Article SEO long-tail mensuel ────────────────────────────────────────────
// Génère un article 600-900 mots via seo-content-writer le 1er du mois.
// L'article apparaît comme draft dans Approbations admin.
async function runMonthlySeoArticle(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const moisLabels = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const now = new Date();
  const moisCourant = moisLabels[now.getMonth()];
  const annee = now.getFullYear();

  // Rotation des sujets long-tail (12 sujets = 1 par mois)
  const SUJETS = [
    { kw: "location villa Sainte-Luce piscine débordement", target: "/amaryllis" },
    { kw: "studio jacuzzi privatif Martinique",              target: "/mabouya" },
    { kw: "villa Martinique 8 personnes vue mer",            target: "/amaryllis" },
    { kw: "meilleure saison Martinique voyage",              target: "/meilleure-saison-martinique" },
    { kw: "plongée Martinique débutant",                     target: "/guide-plongee-martinique" },
    { kw: "distilleries rhum Martinique visite",             target: "/guide-distilleries-martinique" },
    { kw: "randonnée Montagne Pelée Martinique",             target: "/guide-randonnees-martinique" },
    { kw: "Rocher du Diamant Martinique",                    target: "/guide-le-diamant" },
    { kw: "Trois-Îlets Martinique activités",                target: "/guide-trois-ilets" },
    { kw: "Saint-Pierre Martinique histoire",                target: "/guide-saint-pierre-martinique" },
    { kw: "gastronomie créole Martinique",                   target: "/guide-gastronomie-martinique" },
    { kw: "réservation directe villa Martinique",            target: "/reservation-directe-martinique" },
  ];
  const sujet = SUJETS[now.getMonth()];

  const brief = `Article de blog SEO long-tail — ${moisCourant} ${annee}
Mot-clé cible : "${sujet.kw}"
URL cible pour maillage interne : ${sujet.target}

Type : article 600-900 mots, optimisé SEO mais lisible et utile.
Structure : H1 (mot-clé), intro 80 mots, 3-4 H2 thématiques, conclusion + CTA.
Ton : voix Amaryllis (formel, sensoriel, informatif), jamais pub Meta Ads.
Inclure 2 liens internes : 1 vers ${sujet.target}, 1 vers /amaryllis ou un autre bien pertinent.

Données canoniques INTERDITES À ENFREINDRE :
- Villa Amaryllis : piscine débordement eau salée 4×7m, 3 chambres, 8 pers (PAS de jacuzzi)
- Mabouya : jacuzzi privatif (le seul)
- Iguana : piscine eau salée non chlorée
- Zandoli + Géko : chacune sa piscine privative à cascade
- Tous sur les hauteurs, vue mer 180° (PAS bord de mer)

Retourne UN draft type "social_post" avec caption = article complet markdown.`;

  try {
    console.log(`[seo-article] Démarrage génération article : ${sujet.kw}`);
    const r = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: "seo-content-writer", brief }),
    });
    const data = await r.json();
    console.log(`[seo-article] ✓ ${data.draftsCreated || 0} draft(s) créé(s) sur "${sujet.kw}"`);
  } catch (e) {
    console.error("[seo-article] Erreur:", e.message);
  }
}

// ── Export comptable mensuel ─────────────────────────────────────────────────
async function runMonthlyExport(env, allEvents) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7); // "2025-05"
  const label = lastMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const daysInMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();

  const events = allEvents.filter(e => e.checkin.startsWith(lastMonthStr) || e.checkout.startsWith(lastMonthStr));

  if (events.length === 0) {
    console.log("[monthly] Aucune réservation le mois dernier — export ignoré");
    return;
  }

  // ── CSV (inchangé, pour le comptable) ──────────────────────────────────────
  const csvLines = [
    "Logement,Voyageur,Canal,Arrivée,Départ,Nuits,Montant€",
    ...events.map(e => {
      const nights = diffDays(e.checkin, e.checkout);
      return `"${e.nom}","${e.voyageur}","${e.canal || ""}","${e.checkin}","${e.checkout}",${nights},${e.montant || ""}`;
    }),
  ];
  const totalCA = events.reduce((s, e) => s + (e.montant || 0), 0);
  csvLines.push(`,,,,TOTAL,${events.length} réservations,${totalCA}`);
  const csv = csvLines.join("\n");
  const csvB64 = btoa(unescape(encodeURIComponent(csv)));

  // ── KPIs globaux ───────────────────────────────────────────────────────────
  const totalNuits = events.reduce((s, e) => s + diffDays(e.checkin, e.checkout), 0);
  const prixMoyenNuit = totalNuits > 0 ? Math.round(totalCA / totalNuits) : 0;
  const nbBiensActifs = Object.keys(NOMS).length; // 7 logements
  const tauxOcc = Math.round((totalNuits / (daysInMonth * nbBiensActifs)) * 100);

  // ── Stats par logement ─────────────────────────────────────────────────────
  const byBien = {};
  for (const e of events) {
    if (!byBien[e.bienId]) byBien[e.bienId] = { nom: e.nom, ca: 0, nuits: 0, nb: 0, airbnb: 0, booking: 0 };
    const b = byBien[e.bienId];
    const n = diffDays(e.checkin, e.checkout);
    b.ca += (e.montant || 0);
    b.nuits += n;
    b.nb += 1;
    if (e.canal === "airbnb") b.airbnb += 1;
    else if (e.canal === "booking") b.booking += 1;
  }

  // ── Canal mix global ───────────────────────────────────────────────────────
  const nbAirbnb   = events.filter(e => e.canal === "airbnb").length;
  const nbBooking  = events.filter(e => e.canal === "booking").length;
  const nbDirect   = events.length - nbAirbnb - nbBooking;
  const pctAirbnb  = Math.round((nbAirbnb / events.length) * 100);
  const pctBooking = Math.round((nbBooking / events.length) * 100);
  const pctDirect  = 100 - pctAirbnb - pctBooking;

  // ── Couleur de performance ─────────────────────────────────────────────────
  const kpiColor = (val, good, warn) => val >= good ? "#16a34a" : val >= warn ? "#d97706" : "#dc2626";

  // ── HTML riche ─────────────────────────────────────────────────────────────
  const bienRows = Object.values(byBien)
    .sort((a, b) => b.ca - a.ca)
    .map(b => {
      const pMoyNuit = b.nuits > 0 ? Math.round(b.ca / b.nuits) : 0;
      const occPct = Math.round((b.nuits / daysInMonth) * 100);
      const canalTag = b.airbnb > 0 && b.booking === 0 ? "Airbnb" :
                       b.booking > 0 && b.airbnb === 0 ? "Booking" : "Mix";
      return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;font-weight:500;color:#0e3b3a;font-size:13px;">${b.nom}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;text-align:right;font-weight:700;color:#0e3b3a;font-size:14px;">${b.ca.toLocaleString("fr-FR")}€</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;text-align:center;color:#7a6b5a;font-size:13px;">${b.nuits}n</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;text-align:center;font-size:12px;color:${kpiColor(occPct, 60, 40)};">${occPct}%</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;text-align:center;color:#7a6b5a;font-size:13px;">${pMoyNuit}€/n</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8dcc8;text-align:center;font-size:11px;color:#7a6b5a;">${canalTag}</td>
      </tr>`;
    }).join("");

  // Barres canal mix (proportionnelles, 200px de large)
  const barAirbnb  = Math.round(200 * pctAirbnb / 100);
  const barBooking = Math.round(200 * pctBooking / 100);
  const barDirect  = 200 - barAirbnb - barBooking;

  const resa20 = events.slice(0, 20); // max 20 lignes
  const resaRows = resa20.map(e => {
    const n = diffDays(e.checkin, e.checkout);
    const cIcon = e.canal === "airbnb" ? "🏠" : e.canal === "booking" ? "🔵" : "🌐";
    return `
    <tr>
      <td style="padding:7px 10px;border-bottom:1px solid #f0e8d8;font-size:12px;color:#0e3b3a;">${e.nom}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0e8d8;font-size:12px;color:#7a6b5a;">${e.checkin} → ${e.checkout}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0e8d8;font-size:12px;text-align:center;">${n}n</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0e8d8;font-size:12px;text-align:right;font-weight:600;color:#0e3b3a;">${e.montant ? e.montant.toLocaleString("fr-FR") + "€" : "—"}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0e8d8;font-size:12px;text-align:center;">${cIcon}</td>
    </tr>`;
  }).join("");

  const html = `
  <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#f4ecdc;">

    <!-- HEADER -->
    <div style="background:#0e3b3a;padding:32px 28px;border-radius:12px 12px 0 0;text-align:center;">
      <p style="color:#c47254;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Rapport mensuel</p>
      <h1 style="color:#faf5e9;font-size:26px;font-weight:300;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;">${label}</h1>
      <p style="color:rgba(250,245,233,0.6);font-size:13px;margin:0;">${events.length} réservation${events.length > 1 ? "s" : ""} · CSV en pièce jointe</p>
    </div>

    <!-- KPI ROW -->
    <div style="display:flex;gap:0;background:#fff;border-left:1px solid #e8dcc8;border-right:1px solid #e8dcc8;">
      ${[
        { label: "CA Total", value: totalCA.toLocaleString("fr-FR") + "€", color: kpiColor(totalCA, 8000, 4000) },
        { label: "Nuits vendues", value: totalNuits + "n", color: "#0e3b3a" },
        { label: "Taux occ.", value: tauxOcc + "%", color: kpiColor(tauxOcc, 55, 35) },
        { label: "Prix moy./nuit", value: prixMoyenNuit + "€", color: "#0e3b3a" },
      ].map(k => `
        <div style="flex:1;padding:18px 12px;text-align:center;border-right:1px solid #e8dcc8;">
          <div style="font-size:22px;font-weight:700;color:${k.color};margin-bottom:4px;">${k.value}</div>
          <div style="font-size:10px;color:#7a6b5a;letter-spacing:0.08em;text-transform:uppercase;">${k.label}</div>
        </div>`).join("")}
    </div>

    <!-- PAR LOGEMENT -->
    <div style="background:#fff;border:1px solid #e8dcc8;border-top:none;padding:0;">
      <div style="padding:16px 16px 8px;border-bottom:1px solid #f0e8d8;">
        <span style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#c47254;">Par logement</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f4ecdc;">
            <th style="padding:8px 12px;text-align:left;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">Logement</th>
            <th style="padding:8px 12px;text-align:right;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">CA</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">Nuits</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">Occ.</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">Moy./n</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;color:#7a6b5a;letter-spacing:0.08em;font-weight:600;text-transform:uppercase;">Canal</th>
          </tr>
        </thead>
        <tbody>${bienRows}</tbody>
        <tfoot>
          <tr style="background:#f4ecdc;">
            <td style="padding:10px 12px;font-weight:700;color:#0e3b3a;font-size:13px;">TOTAL</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;color:#c47254;font-size:14px;">${totalCA.toLocaleString("fr-FR")}€</td>
            <td style="padding:10px 12px;text-align:center;font-weight:600;color:#0e3b3a;font-size:13px;">${totalNuits}n</td>
            <td style="padding:10px 12px;text-align:center;font-weight:600;font-size:13px;color:${kpiColor(tauxOcc, 55, 35)};">${tauxOcc}%</td>
            <td style="padding:10px 12px;text-align:center;color:#7a6b5a;font-size:13px;">${prixMoyenNuit}€/n</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- CANAL MIX -->
    <div style="background:#fff;border:1px solid #e8dcc8;border-top:none;padding:16px;">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#c47254;display:block;margin-bottom:14px;">Mix canal (nb réservations)</span>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
        ${barAirbnb > 0 ? `<div style="width:${barAirbnb}px;height:18px;background:#ff5a5f;border-radius:4px 0 0 4px;"></div>` : ""}
        ${barBooking > 0 ? `<div style="width:${barBooking}px;height:18px;background:#003580;"></div>` : ""}
        ${barDirect > 0 ? `<div style="width:${barDirect}px;height:18px;background:#16a34a;border-radius:0 4px 4px 0;"></div>` : ""}
      </div>
      <div style="display:flex;gap:16px;font-size:11px;color:#7a6b5a;">
        ${nbAirbnb > 0 ? `<span>🏠 Airbnb ${pctAirbnb}% (${nbAirbnb})</span>` : ""}
        ${nbBooking > 0 ? `<span>🔵 Booking ${pctBooking}% (${nbBooking})</span>` : ""}
        ${nbDirect > 0 ? `<span>🌐 Direct ${pctDirect}% (${nbDirect})</span>` : ""}
      </div>
      ${pctBooking > 70 ? `<p style="margin:10px 0 0;font-size:12px;color:#dc2626;font-weight:600;">⚠️ Booking.com > 70% — forte dépendance à surveiller</p>` : ""}
    </div>

    <!-- DETAIL RÉSERVATIONS -->
    <div style="background:#fff;border:1px solid #e8dcc8;border-top:none;padding:0;">
      <div style="padding:16px 16px 8px;border-bottom:1px solid #f0e8d8;">
        <span style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#c47254;">Détail des réservations</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f4ecdc;">
            <th style="padding:7px 10px;text-align:left;font-size:10px;color:#7a6b5a;font-weight:600;text-transform:uppercase;">Logement</th>
            <th style="padding:7px 10px;text-align:left;font-size:10px;color:#7a6b5a;font-weight:600;text-transform:uppercase;">Dates</th>
            <th style="padding:7px 10px;text-align:center;font-size:10px;color:#7a6b5a;font-weight:600;text-transform:uppercase;">N</th>
            <th style="padding:7px 10px;text-align:right;font-size:10px;color:#7a6b5a;font-weight:600;text-transform:uppercase;">Montant</th>
            <th style="padding:7px 10px;text-align:center;font-size:10px;color:#7a6b5a;font-weight:600;text-transform:uppercase;">Canal</th>
          </tr>
        </thead>
        <tbody>${resaRows}</tbody>
      </table>
      ${events.length > 20 ? `<p style="padding:10px 12px;font-size:11px;color:#7a6b5a;margin:0;">… et ${events.length - 20} autres réservations dans le CSV ci-joint.</p>` : ""}
    </div>

    <!-- CTA -->
    <div style="background:#fff;border:1px solid #e8dcc8;border-top:none;border-radius:0 0 12px 12px;padding:24px;text-align:center;">
      <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="display:inline-block;background:#0e3b3a;color:#faf5e9;text-decoration:none;padding:12px 28px;border-radius:9px;font-size:13px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;margin-right:10px;">Dashboard admin →</a>
      <p style="margin:16px 0 0;font-size:10px;color:#b0a898;">Le fichier CSV joint contient toutes les réservations pour votre comptable · Amaryllis automatique</p>
    </div>

  </div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: resendFrom(env),
      to: String(env.NOTIFICATION_EMAIL || "contact@villamaryllis.com").split(",").map(s => s.trim()).filter(Boolean),
      subject: `📊 Rapport ${label} — ${totalCA.toLocaleString("fr-FR")}€ · ${totalNuits}n · ${tauxOcc}% occ.`,
      html,
      attachments: [{
        filename: `reservations-${lastMonthStr}.csv`,
        content: csvB64,
      }],
    }),
  });

  if (!r.ok) console.error("[monthly] Resend error:", await r.text());
  else console.log(`[monthly] Rapport ${label} envoyé — ${events.length} réservations, ${totalCA}€, ${tauxOcc}% occ.`);
}

// ── direct_bookings D1 → format event (résas Stripe Martinique sans bookingId Beds24) ──
// Sans ça, le cron iCal pousse 0 résa directe vers la Sheet → invisible côté admin/compta/revenus.
// Le Worker hérite du binding D1 `revenue_manager` (cf. wrangler.toml).
async function fetchDirectBookingsAsEvents(env) {
  if (!env.revenue_manager) return [];
  try {
    const rows = await env.revenue_manager.prepare(
      `SELECT payment_intent_id, bien_id, bien_nom, voyageur, total, depot, checkin, checkout
       FROM direct_bookings
       WHERE checkout >= date('now', '-90 days')`
    ).all();
    return (rows?.results || []).filter(r => r.bien_id && r.checkin && r.checkout).map(r => ({
      uid:      "direct-" + r.payment_intent_id,  // pushToSheets utilise e.uid comme id
      bienId:   r.bien_id,
      voyageur: r.voyageur || "—",
      canal:    "Direct",
      checkin:  r.checkin,
      checkout: r.checkout,
      montant:  Math.round(r.total || 0),
    }));
  } catch (e) {
    console.error("[direct-bookings] D1 read error:", e.message);
    return [];
  }
}

// ── Push vers Google Sheets ──────────────────────────────────────────────────
async function pushToSheets(env, allEvents) {
  if (!env.APPS_SCRIPT_URL) return;
  const reservations = allEvents.map(e => ({
    id: e.uid, bienId: e.bienId, voyageur: e.voyageur,
    canal: e.canal, checkin: e.checkin, checkout: e.checkout,
    montant: e.montant, fromIcal: true, notes: "",
  }));
  // ⚠️ Apps Script SUPPRIME le body des POST (bug redirect Google) → on passe par
  //    /api/sheets-proxy qui envoie en GET paginé (forwardChunked). Le POST direct
  //    vers APPS_SCRIPT_URL n'écrivait JAMAIS rien dans le Sheet (body perdu).
  try {
    const siteUrl = env.SITE_URL || "https://villamaryllis.com";
    const r = await fetch(`${siteUrl}/api/sheets-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Script-Url": env.APPS_SCRIPT_URL },
      body: JSON.stringify({ action: "importAllReservations", reservations }),
    });
    const d = await r.json().catch(() => ({}));
    console.log(`[sheets] push via proxy — ok=${d.ok} added=${d.added ?? "?"} updated=${d.updated ?? "?"} (${reservations.length} envoyées)`);
    if (d.errors) console.error("[sheets] erreurs chunks:", JSON.stringify(d.errors));
  } catch (e) {
    console.error("[sheets] Erreur:", e.message);
  }
}

// ── Sync iCal ────────────────────────────────────────────────────────────────
async function syncFeed(env, bienId, url, canal, allEvents, nouvelles) {
  try {
    const text = await fetchICS(url);
    const events = parseICS(text, bienId).map(e => ({ ...e, canal }));
    const kvKey = `uids:${bienId}:${canal}`;
    const stored = await env.ICAL_STORE.get(kvKey, "json") || [];
    const knownUids = new Set(stored);
    const newForFeed = events.filter(e => !knownUids.has(e.uid));
    if (newForFeed.length > 0) nouvelles.push(...newForFeed);
    await env.ICAL_STORE.put(kvKey, JSON.stringify(events.map(e => e.uid)), { expirationTtl: 60 * 60 * 24 * 90 });
    allEvents.push(...events);
    console.log(`[sync] ${bienId}/${canal}: ${events.length} evt, ${newForFeed.length} nouveau(x)`);
  } catch (err) {
    console.error(`[sync] ${bienId}/${canal} erreur:`, err.message);
  }
}

async function runSync(env) {
  console.log(`[amaryllis-sync] Démarrage — ${new Date().toISOString()}`);
  const allEvents = [], nouvelles = [];

  // Fetch tous les feeds en parallèle (5× plus rapide qu'en série)
  const bookingUrls = getBookingUrls(env);
  const airbnbUrls  = getAirbnbUrls(env);
  const airbnbFeeds   = Object.entries(airbnbUrls).map(([id, url]) => syncFeed(env, id, url, "airbnb", allEvents, nouvelles));
  const bookingFeeds  = Object.entries(bookingUrls).map(([id, url]) => syncFeed(env, id, url, "booking", allEvents, nouvelles));
  await Promise.all([...airbnbFeeds, ...bookingFeeds]);

  // ── Ajouter les résas DIRECTES Stripe (D1) à allEvents avant push Sheets ──
  // Auto-sync : toutes les 15 min, les direct_bookings remontent dans
  // « Toutes les Réservations » → Revenus 2026 → admin Planning.
  const directs = await fetchDirectBookingsAsEvents(env);
  if (directs.length > 0) {
    allEvents.push(...directs);
    console.log(`[direct-bookings] ${directs.length} résa(s) directe(s) ajoutée(s) au push Sheets`);
  }

  if (nouvelles.length > 0) await sendNouvellesResas(env, nouvelles);
  if (allEvents.length > 0) await pushToSheets(env, allEvents);

  console.log(`[amaryllis-sync] Terminé — ${allEvents.length} evt (dont ${directs.length} direct), ${nouvelles.length} nouveaux`);
  return { allEvents, total: allEvents.length, nouvelles: nouvelles.length };
}

// ── Monitoring quotidien ─────────────────────────────────────────────────────
const CHECKS = [
  { name: "Home",            url: "https://villamaryllis.com/" },
  { name: "Villa Amaryllis", url: "https://villamaryllis.com/amaryllis" },
  { name: "API reviews",     url: "https://villamaryllis.com/api/google-reviews", expectJson: "ok" },
  { name: "Sitemap",         url: "https://villamaryllis.com/sitemap.xml" },
];

async function runMonitor(env) {
  const errors = [];
  for (const check of CHECKS) {
    try {
      const res = await fetch(check.url, { headers: { "User-Agent": "AmaryllisMonitor/1.0" } });
      let jsonOk = true;
      if (check.expectJson) {
        try { const d = await res.clone().json(); jsonOk = d[check.expectJson] === true; } catch { jsonOk = false; }
      }
      if (res.status !== 200 || !jsonOk) errors.push(`❌ ${check.name} — HTTP ${res.status}`);
    } catch (e) { errors.push(`❌ ${check.name} — ${e.message}`); }
  }
  // ── Alerte expiration token Beds24 ──────────────────────────────────────────
  if (env.BEDS24_TOKEN) {
    try {
      const b24 = await fetch("https://beds24.com/api/v2/authentication/details", { headers: { token: env.BEDS24_TOKEN } });
      const d = await b24.json();
      if (!d.validToken) {
        errors.push("❌ Beds24 — Token invalide !");
      } else {
        const expiresIn = d.token?.expiresIn ?? 0;
        const days = Math.floor(expiresIn / 86400);
        if (days < 7) errors.push(`⚠️ Beds24 — Token expire dans ${days} jour${days !== 1 ? "s" : ""} — renouveler sur beds24.com`);
      }
    } catch (err) { errors.push(`❌ Beds24 — ${err.message}`); }
  }

  if (errors.length > 0) {
    await sendEmail(env, {
      subject: `🚨 ${errors.length} problème(s) — villamaryllis.com`,
      html: emailWrapper(`<h2 style="color:#c47254">🚨 Audit</h2><p>${errors.join("<br>")}</p>`),
    });
  }
  return { errors: errors.length };
}

// ── Annulation des réservations Beds24 non payées (Nogent) ───────────────────
// Toutes les heures : cherche les réservations avec status="new" créées il y a
// plus de 4h et les annule (l'utilisateur n'a pas finalisé le paiement).
// Les réservations confirmées (status="confirmed") sont épargnées.
async function runCancelUnpaidBeds24Bookings(env) {
  const token = env.BEDS24_TOKEN;
  if (!token) return;

  const PROP_ID = "158192";
  const THRESHOLD_HOURS = 4; // délai avant annulation automatique

  try {
    // Chercher les réservations récentes non confirmées
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString().slice(0, 10); // 48h max
    const qp = new URLSearchParams({ propId: PROP_ID, modifiedFrom: since, numId: "100" });
    const res = await fetch(`https://beds24.com/api/v2/bookings?${qp}`, { headers: { token } });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) return;

    const now = Date.now();
    const toCancel = data.data.filter(b => {
      if (b.status !== "new") return false; // garder: confirmed, cancelled, etc.
      // bookingTime format : "2026-05-22 14:35:00" ou ISO
      const created = b.bookingTime ? new Date(b.bookingTime.replace(" ", "T") + "Z").getTime() : 0;
      if (!created) return false;
      const ageHours = (now - created) / 3600000;
      return ageHours >= THRESHOLD_HOURS;
    });

    if (toCancel.length === 0) return;

    console.log(`[beds24-cleanup] ${toCancel.length} réservation(s) non payée(s) à annuler`);

    const payload = toCancel.map(b => ({ id: String(b.id), status: "cancelled" }));
    const putRes = await fetch("https://beds24.com/api/v2/bookings", {
      method: "PUT",
      headers: { token, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const putData = await putRes.json().catch(() => ({}));
    console.log(`[beds24-cleanup] Annulation PUT → ${putRes.status}`, JSON.stringify(putData).slice(0, 200));

  } catch (e) {
    console.error("[beds24-cleanup] Erreur:", e.message);
  }
}

// ── Caution auto-release J+3 ──────────────────────────────────────────────────
// Interroge Stripe pour tous les PaymentIntents de type "caution" en requires_capture
// Si checkout + 3 jours <= today → annule (libère les fonds)
async function runCautionAutoRelease(env) {
  if (!env.STRIPE_SECRET_KEY) { console.log("[caution] STRIPE_SECRET_KEY absent"); return; }
  const todayStr = today();

  // Stripe Search API — tous les PI caution en attente de capture
  // Le site crée les cautions avec type='deposit' (create-deposit-intent.js)
  const query = encodeURIComponent("status:'requires_capture' AND metadata['type']:'deposit'");
  let released = 0;

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/payment_intents/search?query=${query}&limit=100`,
      { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } }
    );
    const data = await res.json();
    if (data.error) { console.error("[caution] Stripe error:", data.error.message); return; }

    for (const pi of (data.data || [])) {
      // Cautions DIFFÉRÉES (résas lointaines) : cycle complet géré par caution-cron
      // (pose / re-pose glissante / libération). Ne pas les libérer ici.
      if (pi.metadata?.kind === "caution-auto") continue;
      const checkoutDate = pi.metadata?.checkout;
      if (!checkoutDate) continue;
      const releaseDate = addDays(checkoutDate, 3);
      if (todayStr < releaseDate) continue; // pas encore J+3

      // Annuler le PaymentIntent → libère le hold sur la CB du voyageur
      const cancelRes = await fetch(
        `https://api.stripe.com/v1/payment_intents/${pi.id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ cancellation_reason: "abandoned" }).toString(),
        }
      );
      const cancelled = await cancelRes.json();
      if (cancelled.status === "canceled") {
        released++;
        const bienId = pi.metadata?.bienId || "?";
        const voyageur = pi.metadata?.voyageur || "voyageur";
        const montant = (pi.amount / 100).toFixed(0);
        console.log(`[caution] ✓ Libéré ${montant}€ pour ${voyageur} (${bienId}) checkout ${checkoutDate}`);

        // Email de confirmation à l'hôte
        await sendEmail(env, {
          subject: `✅ Caution libérée — ${bienId} (${voyageur})`,
          html: emailWrapper(`
            <h2 style="color:#14b8a6">✅ Caution libérée automatiquement</h2>
            <p>La caution de <strong>${montant}€</strong> pour <strong>${voyageur}</strong>
            (${bienId}) a été libérée automatiquement 3 jours après le départ du ${checkoutDate}.</p>
            <p style="color:#7a6b5a;font-size:14px;">La CB du voyageur n'a pas été débitée.</p>
          `),
        });
      } else {
        console.error(`[caution] ✗ Échec libération ${pi.id}:`, cancelled.error?.message);
      }
    }
    console.log(`[caution] ${released} caution(s) libérée(s)`);
  } catch (e) {
    console.error("[caution] Erreur:", e.message);
  }
  return { released };
}

// ── Gap Pricing — remise automatique sur les trous de calendrier ─────────────
// Logique : si 2 réservations sont séparées de 1-4 nuits et que le gap
// commence dans les 21 prochains jours → remise pour combler le trou.
// Discount : 1-2 nuits = -25%, 3-4 nuits = -15%
// RM-01 (last-room-value) : facteur de remise par bien — on PROTÈGE l'amiral (Amaryllis :
// unique, 8p, 4,94, peu de substituts) et on remise PLUS les biens substituables (studios 2p).
// Iguana exclu (bail long, bookable:false). Le plancher price_min reste appliqué en aval. TUNABLE.
const DISCOUNT_FACTOR = { amaryllis: 0.4, zandoli: 0.7, iguana: 0, geko: 1.0, mabouya: 1.2, schoelcher: 1.2, nogent: 1.0 };
const factorBien = (id) => (id in DISCOUNT_FACTOR ? DISCOUNT_FACTOR[id] : 1.0);
// RM-02 (lead-time) : ne pas lâcher la remise trop tôt — faible loin de la date, pleine à l'approche.
const factorLeadTime = (daysUntil) => (daysUntil > 14 ? 0.5 : daysUntil > 7 ? 0.8 : 1.0);
// Remise finale = base × bien × lead-time (arrondie). Le clamp price_min se fait à la consommation.
const adjustDiscountPct = (basePct, bienId, daysUntil) => Math.round(basePct * factorBien(bienId) * factorLeadTime(daysUntil));

// RM-01 (last-room-value) — SENS HAUSSE : forte demande → premium sur les dernières dates libres.
// Facteur INVERSÉ vs remise : l'amiral/bien rare commande le plus gros premium ; les studios
// substituables le plus faible (sinon le voyageur va ailleurs). Iguana exclu. Plafonné price_max
// (clamp autoritaire côté widget, sur le prix réel). Stocké en pct NÉGATIF dans gap_prices. TUNABLE.
const UPLIFT_FACTOR = { amaryllis: 1.4, zandoli: 1.1, iguana: 0, geko: 1.0, mabouya: 0.7, schoelcher: 0.7, nogent: 1.0 };
const factorUpBien = (id) => (id in UPLIFT_FACTOR ? UPLIFT_FACTOR[id] : 1.0);
// Lead-time hausse : date proche + pleine = dernières chambres → premium plus fort.
const factorUpLead = (daysUntil) => (daysUntil <= 2 ? 1.0 : daysUntil <= 4 ? 0.85 : 0.7);
const adjustUpliftPct = (baseUp, bienId, daysUntil) => Math.round(baseUp * factorUpBien(bienId) * factorUpLead(daysUntil));

async function runGapPricing(env, allEvents) {
  const todayStr = today();
  const horizon  = addDays(todayStr, 21);
  const gaps     = {}; // { bienId: { date: discountPct } }

  // Grouper les événements par bien, triés par date de début
  const byBien = {};
  for (const ev of allEvents) {
    if (!byBien[ev.bienId]) byBien[ev.bienId] = [];
    byBien[ev.bienId].push(ev);
  }
  for (const [bienId, evs] of Object.entries(byBien)) {
    const sorted = evs.slice().sort((a, b) => a.checkin.localeCompare(b.checkin));
    for (let i = 0; i < sorted.length - 1; i++) {
      const endA   = sorted[i].checkout;      // départ du séjour A (date libre)
      const startB = sorted[i + 1].checkin;   // arrivée du séjour B
      const gapLen = diffDays(endA, startB);
      if (gapLen < 1 || gapLen > 4) continue;           // pas un trou utile
      if (endA < todayStr || endA > horizon) continue;   // hors fenêtre 21j
      const basePct = gapLen <= 2 ? 25 : 15;
      for (let d = 0; d < gapLen; d++) {
        const date = addDays(endA, d);
        const adj = adjustDiscountPct(basePct, bienId, diffDays(todayStr, date)); // RM-01 + RM-02
        if (adj <= 0) continue;  // bien protégé (amiral/iguana) ou remise nulle
        if (!gaps[bienId]) gaps[bienId] = {};
        gaps[bienId][date] = adj;
      }
    }
  }

  // Sauvegarder dans KV (clé globale, TTL 24h)
  await env.ICAL_STORE.put("gap_prices", JSON.stringify(gaps), { expirationTtl: 86400 });
  const totalDates = Object.values(gaps).reduce((s, m) => s + Object.keys(m).length, 0);
  console.log(`[gap-pricing] ${totalDates} dates remisées sur ${Object.keys(gaps).length} biens`);
  return gaps;
}

// ── Yield Management — ajustement tarifaire automatique sur 14j ─────────────
// Couvre également les "last-minute deals" (feature #3) — pas de fonction séparée :
//   les dates libres à J+0→J+4 obtiennent -20%, J+5→J+13 -15% si occ < 30%.
// Logique :
//   occ < 30% sur 14j  → -20% sur J à J+4 libres, -15% sur J+5 à J+13 libres
//   occ > 80% sur 7j   → log seulement, pas de modification des prix
// Merge dans la clé KV `gap_prices` (prend le max entre gap_pricing et yield)
// Envoie un email récap à l'hôte si des remises ont été appliquées
async function runYieldPricing(env, allEvents) {
  const todayStr = today();
  const in14     = addDays(todayStr, 14);
  const in7      = addDays(todayStr, 7);
  const yieldPrices = {}; // { bienId: { date: pct } }

  // ── Charger les price_min depuis D1 (plancher absolu par bien) ──────────────
  const priceMinMap = {}; // { bienId: { priceMin, basePriceLow } }
  try {
    const db = env.revenue_manager;
    if (db) {
      const { results: props } = await db.prepare(
        "SELECT id, price_min, price_max, base_price_low, base_price_high FROM rm_properties WHERE is_active = 1"
      ).all();
      for (const p of (props || [])) {
        priceMinMap[p.id] = { priceMin: p.price_min || 0, priceMax: p.price_max || 0, basePriceLow: p.base_price_low || 0, basePriceHigh: p.base_price_high || 0 };
      }
    }
  } catch (e) {
    console.log("[yield] Impossible de charger price_min depuis D1:", e.message);
  }

  // Calculer occupation par bien sur 14j et 7j
  const occ14 = {}, occ7 = {};
  for (const e of allEvents) {
    if (e.checkin > in14 || e.checkout <= todayStr) continue;
    const start14 = e.checkin > todayStr ? e.checkin : todayStr;
    const end14   = e.checkout < in14 ? e.checkout : in14;
    const n14 = diffDays(start14, end14);
    occ14[e.bienId] = (occ14[e.bienId] || 0) + n14;

    if (e.checkin < in7 && e.checkout > todayStr) {
      const start7 = e.checkin > todayStr ? e.checkin : todayStr;
      const end7   = e.checkout < in7 ? e.checkout : in7;
      const n7 = diffDays(start7, end7);
      occ7[e.bienId] = (occ7[e.bienId] || 0) + n7;
    }
  }

  // Calculer les dates réservées par bien (pour ne jamais promo une date occupée)
  const reservedDates = {};
  for (const e of allEvents) {
    if (e.checkout <= todayStr || e.checkin > in14) continue;
    if (!reservedDates[e.bienId]) reservedDates[e.bienId] = new Set();
    let cur = e.checkin > todayStr ? e.checkin : todayStr;
    const endR = e.checkout < in14 ? e.checkout : in14;
    while (cur < endR) {
      reservedDates[e.bienId].add(cur);
      cur = addDays(cur, 1);
    }
  }

  const allBienIds = new Set([
    ...Object.keys(getAirbnbUrls(env)),
    ...Object.keys(occ14),
  ]);

  let totalAdjusted = 0;

  for (const bienId of allBienIds) {
    const pct14 = ((occ14[bienId] || 0) / 14) * 100;
    const pct7  = ((occ7[bienId]  || 0) / 7)  * 100;

    // Forte demande sur 7j → PREMIUM auto sur les dernières dates libres (RM-01 last-room-value).
    // Stocké en pct NÉGATIF (uplift) ; le plafond price_max est clampé côté widget (prix réel).
    if (pct7 > 80) {
      if (!yieldPrices[bienId]) yieldPrices[bienId] = {};
      const reserved = reservedDates[bienId] || new Set();
      const pmData = priceMinMap[bienId] || {};
      const priceMaxCents = pmData.priceMax || 0;
      // Cap contre le HAUT normal (base_price_high) → base_high×(1+up%) ≤ price_max garantit le
      // plafond pour TOUT prix réel du jour (≤ base_high), sans dépendre du widget (endpoint 401).
      const capBaseCents = pmData.basePriceHigh || pmData.basePriceLow || 0;
      const baseUp = pct7 >= 95 ? 25 : 15; // quasi-plein = dernières chambres → pousser plus fort
      let nUp = 0;
      for (let d = 0; d < 7; d++) {
        const dateStr = addDays(todayStr, d);
        if (reserved.has(dateStr)) continue; // date déjà vendue
        let up = adjustUpliftPct(baseUp, bienId, d);
        if (up <= 0) continue; // bien exclu (iguana) ou premium nul
        // Plafond price_max garanti (cap contre base_high) :
        if (priceMaxCents > 0 && capBaseCents > 0) {
          const maxUpPct = Math.floor((priceMaxCents / capBaseCents - 1) * 100);
          if (maxUpPct <= 0) continue;
          if (up > maxUpPct) up = maxUpPct;
        }
        yieldPrices[bienId][dateStr] = -up; // négatif = uplift
        nUp++;
      }
      console.log(`[yield] ${bienId} — occ ${Math.round(pct7)}% → premium sur ${nUp} date(s) libre(s)`);
      continue;
    }

    // Sous-occupation sur 14j → appliquer remises (avec respect du price_min)
    if (pct14 < 30) {
      if (!yieldPrices[bienId]) yieldPrices[bienId] = {};
      const reserved = reservedDates[bienId] || new Set();
      const pmData = priceMinMap[bienId] || {};
      const priceMinCents = pmData.priceMin || 0;
      const basePriceCents = pmData.basePriceLow || 0;

      for (let d = 0; d < 14; d++) {
        const dateStr = addDays(todayStr, d);
        if (reserved.has(dateStr)) continue; // date occupée, skip

        const discount = adjustDiscountPct(d <= 4 ? 20 : 15, bienId, d); // RM-01 (bien) + RM-02 (lead-time = d jours)
        if (discount <= 0) continue; // bien protégé (amiral/iguana)

        // Vérifier que le prix après remise respecte le price_min
        if (priceMinCents > 0 && basePriceCents > 0) {
          const discountedCents = Math.round(basePriceCents * (1 - discount / 100));
          if (discountedCents < priceMinCents) {
            // Calculer la remise max qui respecte le plancher
            const maxDiscountPct = Math.floor((1 - priceMinCents / basePriceCents) * 100);
            if (maxDiscountPct <= 0) {
              console.log(`[yield] ${bienId} ${dateStr} — prix après remise (${discountedCents/100}€) < price_min (${priceMinCents/100}€), remise annulée`);
              continue; // Plancher déjà atteint, pas de remise
            }
            // Appliquer une remise réduite qui respecte le plancher
            console.log(`[yield] ${bienId} ${dateStr} — remise plafonnée à ${maxDiscountPct}% (price_min ${priceMinCents/100}€)`);
            yieldPrices[bienId][dateStr] = maxDiscountPct;
            totalAdjusted++;
            continue;
          }
        }

        yieldPrices[bienId][dateStr] = discount;
        totalAdjusted++;
      }
    }
  }

  // Merge dans gap_prices (prend le max entre gap et yield)
  const gapRaw = await env.ICAL_STORE.get("gap_prices").catch(() => null);
  const gapPrices = gapRaw ? JSON.parse(gapRaw) : {};
  for (const [bienId, dates] of Object.entries(yieldPrices)) {
    if (!gapPrices[bienId]) gapPrices[bienId] = {};
    for (const [date, pct] of Object.entries(dates)) {
      // pct < 0 = uplift (forte demande) → set direct ; pct > 0 = remise → max. (un bien est soit
      // en creux soit en forte demande, jamais les deux sur la même date → pas de conflit)
      gapPrices[bienId][date] = pct < 0 ? pct : Math.max(gapPrices[bienId][date] || 0, pct);
    }
  }
  await env.ICAL_STORE.put("gap_prices", JSON.stringify(gapPrices), { expirationTtl: 86400 });

  console.log(`[yield] ${totalAdjusted} dates ajustées`);

  // ── Email récap yield pricing ────────────────────────────────────────────────
  if (Object.keys(yieldPrices).length > 0) {
    const rows = Object.entries(yieldPrices).map(([bienId, dates]) => {
      const nom = NOMS[bienId] || bienId;
      const pct14 = Math.round(((occ14[bienId] || 0) / 14) * 100);
      const datesSorted = Object.keys(dates).sort();
      const first = datesSorted[0], last = datesSorted[datesSorted.length - 1];
      const sample20 = Object.entries(dates).filter(([, p]) => p === 20).length;
      const sample15 = Object.entries(dates).filter(([, p]) => p === 15).length;
      return `<tr>
        <td style="padding:8px 14px;font-weight:600;color:#0e3b3a;">${nom}</td>
        <td style="padding:8px 14px;color:#c47254;font-weight:700;">${pct14}% occ.</td>
        <td style="padding:8px 14px;color:#0e3b3a;">${datesSorted.length} dates<br><span style="font-size:11px;color:#7a6b5a;">${first} → ${last}</span></td>
        <td style="padding:8px 14px;font-size:12px;color:#0e3b3a;">${sample20 > 0 ? `<span style="color:#ef4444;font-weight:700;">-20%</span> × ${sample20}` : ""}${sample20 > 0 && sample15 > 0 ? " · " : ""}${sample15 > 0 ? `<span style="color:#f59e0b;font-weight:700;">-15%</span> × ${sample15}` : ""}</td>
      </tr>`;
    }).join("");

    await sendEmail(env, {
      subject: `📉 Yield pricing appliqué — ${Object.keys(yieldPrices).length} bien(s) remisé(s)`,
      html: emailWrapper(`
        <h2 style="color:#0e3b3a;margin:0 0 8px">📉 Yield Management — Récapitulatif</h2>
        <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · ${totalAdjusted} dates remisées au total</p>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
          <thead><tr style="background:#fde8e0;">
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Logement</th>
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Occupation 14j</th>
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Dates concernées</th>
            <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Remises</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;font-size:12px;color:#7a6b5a;">Les remises sont visibles sur le calendrier public et se désactivent automatiquement une fois les dates réservées.</p>
        <div style="margin-top:12px;text-align:center;">
          <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Voir le planning →</a>
        </div>
      `),
    });
  } else {
    console.log("[yield] Aucune remise appliquée aujourd'hui (tous les biens bien occupés)");
  }

  return yieldPrices;
}

// ── Rappel hebdomadaire : mise à jour des prix Airbnb ────────────────────────
// Envoyé chaque lundi avec le rapport hebdomadaire (cron 0 6 * * 1)
const AIRBNB_LISTINGS = [
  { nom: "Villa Amaryllis", id: "54269844",             base: 280 },
  { nom: "Zandoli",         id: "792768220924504884",   base: 220 },
  { nom: "Géko",            id: "1263155865459755724",  base: 150 },
  { nom: "Mabouya",         id: "1046596752160926069",  base: 110 },
  { nom: "Bellevue",        id: "24242415",             base: 100 },
];

async function runPrixRecap(env) {
  if (!env.RESEND_API_KEY) { console.log("[prix-recap] RESEND_API_KEY manquante — ignoré"); return; }
  const dest = env.RECAP_EMAIL || env.NOTIFICATION_EMAIL || "contact@villamaryllis.com";
  const dateStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const rows = AIRBNB_LISTINGS.map(l => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e8dcc8;font-weight:600;color:#0e3b3a;">${l.nom}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e8dcc8;color:#555;">À partir de <strong>${l.base}€</strong>/nuit</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e8dcc8;">
        <a href="https://www.airbnb.fr/hosting/listings/${l.id}/pricing"
           style="background:#c47254;color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">
          Modifier →
        </a>
      </td>
    </tr>`).join("");

  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf5e9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#0e3b3a;padding:32px 32px 24px;">
      <p style="color:#c47254;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Rappel automatique · Lundi</p>
      <h1 style="color:#faf5e9;font-weight:300;font-size:24px;margin:0;letter-spacing:0.05em;">Synchronisation des prix Airbnb</h1>
      <p style="color:rgba(250,245,233,0.6);font-size:13px;margin:12px 0 0;">${dateStr}</p>
    </div>
    <div style="padding:28px 32px 8px;">
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Pensez à vérifier et synchroniser vos tarifs sur Airbnb pour les 30 prochains jours.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e8dcc8;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f5efe0;">
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Logement</th>
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Prix de base</th>
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Action</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:24px 32px 32px;display:flex;gap:12px;flex-wrap:wrap;">
      <a href="https://www.airbnb.fr/hosting/listings"
         style="display:inline-block;background:#0e3b3a;color:#faf5e9;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.06em;">
        Ouvrir Airbnb Host →
      </a>
      <a href="${siteUrl}/admin"
         style="display:inline-block;background:#c47254;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">
        Dashboard →
      </a>
    </div>
    <div style="background:#f5efe0;padding:16px 32px;text-align:center;">
      <p style="color:#aaa;font-size:12px;margin:0;">Message automatique · <a href="${siteUrl}" style="color:#aaa;">villamaryllis.com</a></p>
    </div>
  </div>
</body>
</html>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: resendFrom(env),
      to: [dest],
      subject: `📅 Rappel prix Airbnb — ${new Date().toLocaleDateString("fr-FR")}`,
      html,
    }),
  });
  if (!r.ok) console.error("[prix-recap] Resend error:", await r.text());
  else console.log(`[prix-recap] ✓ Rappel envoyé à ${dest}`);
}

// ── Editorial Calendar : génération drafts J+2 (cron quotidien 12h UTC) ────
async function runEditorialDraftGen(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    // Cible : entrées planifiées dont scheduled_at est dans 2 jours (±12h)
    const now    = Math.floor(Date.now() / 1000);
    const target = now + 2 * 86400;
    const from   = new Date((target - 12 * 3600) * 1000).toISOString().slice(0, 10);
    const to     = new Date((target + 12 * 3600) * 1000).toISOString().slice(0, 10);

    const r = await fetch(`${siteUrl}/api/editorial-calendar?from=${from}&to=${to}&status=planned`);
    const d = await r.json();
    const entries = d.entries || [];
    if (entries.length === 0) { console.log("[editorial-J-2] Aucune entrée planifiée à J+2"); return; }

    // Whitelist photos (les « plus belles » cochées par Vincent) — la génération ne pioche QUE dedans.
    let allowedPhotos = {};
    try {
      const wr = await fetch(`${siteUrl}/api/editorial-photos?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
      const wd = await wr.json();
      allowedPhotos = wd.photos || {};
    } catch (err) { console.warn("[editorial-J-2] whitelist photos indisponible:", err.message); }

    console.log(`[editorial-J-2] ${entries.length} entrée(s) à générer`);
    for (const e of entries) {
      // Marque "generating"
      await fetch(`${siteUrl}/api/editorial-calendar?id=${e.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "generating" }),
      }).catch(() => {});

      // Photo = une photo autorisée du bien (rotation déterministe). Si rien de coché → photo du calendrier (le gate escaladera).
      const wl = allowedPhotos[e.bien_id] || [];
      const photoUrl = wl.length ? `/photos/${e.bien_id}/${wl[Math.abs(e.id) % wl.length]}.webp` : e.photo_url;

      // Brief enrichi → community-manager
      const brief = `BRIEF CALENDRIER ÉDITORIAL — date=${new Date(e.scheduled_at*1000).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}, bien=${e.bien_id}, thème=${e.theme}, variante=${e.variante}, format=${e.format}, photo=${photoUrl}, CTA="${e.cta}". Génère UN draft social_post selon ce brief précis.`;
      try {
        const runRes = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agents: ["community-manager"], brief, calendar_id: e.id }),
        });
        const runData = await runRes.json();
        const drafts = runData.results?.[0]?.drafts || 0;
        const newStatus = drafts > 0 ? "drafted" : "failed";
        await fetch(`${siteUrl}/api/editorial-calendar?id=${e.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }).catch(() => {});
      } catch (err) {
        console.error(`[editorial-J-2] erreur entry ${e.id}:`, err.message);
        await fetch(`${siteUrl}/api/editorial-calendar?id=${e.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "failed" }),
        }).catch(() => {});
      }
    }

    // Gate de qualité : juge les drafts générés → auto-approuve (live) ou escalade en ntfy (shadow/fail).
    try {
      const gr = await fetch(`${siteUrl}/api/editorial-gate?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, { method: "POST" });
      const gd = await gr.json();
      console.log(`[editorial-gate] mode=${gd.mode} évalués=${gd.evaluated} auto-publiés=${gd.queued_for_publish} shadow=${gd.would_publish} escaladés=${gd.escalated}`);
    } catch (err) { console.error("[editorial-gate] error:", err.message); }
  } catch (e) {
    console.error("[editorial-J-2] error:", e.message);
  }
}

// ── Editorial Calendar : re-seed auto (horizon glissant 30j, zéro clic « Seed »)
// Idempotent : handleSeed30Days skippe les dates déjà planifiées → relancer chaque jour
// ne crée pas de doublon, ajoute juste le nouveau J+30 entrant dans la fenêtre.
async function runEditorialReseed(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    const r = await fetch(`${siteUrl}/api/editorial-calendar?action=seed_30days&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // start_date = aujourd'hui par défaut
    });
    const d = await r.json();
    console.log(`[editorial-reseed] +${d.inserted || 0} jour(s) planifié(s) (${d.skipped || 0} déjà présents)`);
  } catch (e) {
    console.error("[editorial-reseed] error:", e.message);
  }
}

// ── Auto-rédaction guides voyageurs D1 (cron hebdomadaire, lundi) ────────────
// Appelle /api/guide-write en mode live pour chaque bien avec un guide en D1.
// Les champs critiques (wifi/code/horaires) sont INTOUCHABLES ; seule la prose d'accueil est réécrite.
// En cas d'échec fact-check : escalade ntfy « à revoir » sans rien écrire.
async function runGuideWrite(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = encodeURIComponent(env.POSTSTAY_SECRET || "");
  const biens = ["amaryllis", "zandoli", "geko", "mabouya", "schoelcher", "nogent", "iguana"];
  for (const bien of biens) {
    try {
      const r = await fetch(`${siteUrl}/api/guide-write?property_id=${bien}&mode=live&secret=${secret}`);
      const d = await r.json();
      if (d.disabled) { console.log("[guide-write] kill-switch actif, skip"); break; }
      console.log(`[guide-write] ${bien}: action=${d.action || "?"} valid=${d.valid} changed=${(d.changed||[]).join(",")}`);
    } catch (e) {
      console.error(`[guide-write] ${bien} error:`, e.message);
    }
  }
}

// ── Editorial Calendar : publication auto des drafts approuvés (cron horaire)
async function runEditorialAutoPublish(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    // Cible : entrées dont status='approved' ET scheduled_at <= maintenant + 1h
    const now    = Math.floor(Date.now() / 1000);
    const upTo   = now + 3600;
    const fromYMD = new Date((now - 86400) * 1000).toISOString().slice(0, 10);
    const toYMD   = new Date(upTo * 1000).toISOString().slice(0, 10);

    const r = await fetch(`${siteUrl}/api/editorial-calendar?from=${fromYMD}&to=${toYMD}&status=approved`);
    const d = await r.json();
    const dueEntries = (d.entries || []).filter(e => e.scheduled_at <= upTo);
    if (dueEntries.length === 0) { console.log("[editorial-publish] Aucun draft à publier"); return; }

    console.log(`[editorial-publish] ${dueEntries.length} draft(s) à publier`);
    for (const e of dueEntries) {
      if (!e.draft_id) {
        console.warn(`[editorial-publish] entry ${e.id} sans draft_id`);
        continue;
      }
      try {
        const pubRes = await fetch(`${siteUrl}/api/agent-drafts?id=${e.draft_id}&action=publish&secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
          method: "PATCH",
        });
        const pubData = await pubRes.json();
        const newStatus = pubData.ok ? "published" : "failed";
        await fetch(`${siteUrl}/api/editorial-calendar?id=${e.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, result: JSON.stringify(pubData) }),
        }).catch(() => {});
        console.log(`[editorial-publish] entry ${e.id} → ${newStatus}`);
      } catch (err) {
        console.error(`[editorial-publish] erreur entry ${e.id}:`, err.message);
      }
    }
  } catch (e) {
    console.error("[editorial-publish] error:", e.message);
  }
}

// ── arch-018 : rappel rotation des tokens critiques (cadence mensuelle) ────────
// Appelé par le cron mensuel ; agit tous les mois (META_PAGE_TOKEN expire ~60j).
async function runTokenRotationReminder(env) {
  // Mensuel — pas de filtre sur le mois (ancienne cadence trimestrielle supprimée)
  const tokens = [
    "BEDS24_TOKEN (auto-refresh via /api/beds24-refresh — vérifier que le refresh tourne)",
    "STRIPE_SECRET_KEY (Dashboard Stripe → Développeurs → Clés API → Roll)",
    "RESEND_API_KEY (Resend → API Keys → régénérer)",
    "META_PAGE_TOKEN (Graph API → token longue durée Page, ~60j → à régénérer)",
    "GROQ_API_KEY (console Groq)",
    "ANTHROPIC_API_KEY (console Anthropic)",
    "APPS_SCRIPT_URL (rotation seulement si fuite suspectée)",
    "APIFY_TOKEN (console Apify)",
  ];
  const html = `<h2>🔐 Rotation trimestrielle des tokens (arch-018)</h2>
    <p>Rappel automatique tous les 90 jours. À vérifier / faire tourner :</p>
    <ul>${tokens.map((t) => `<li>${t}</li>`).join("")}</ul>
    <p>Après rotation, mettre à jour les secrets dans <strong>Cloudflare Pages → dashboard-amaryllis → Settings → Environment variables</strong> (et <code>wrangler secret put</code> pour le Worker).</p>
    <p style="color:#888;font-size:12px">⚠️ META_PAGE_TOKEN expire ~tous les 60 j — c'est le plus urgent.</p>`;
  try {
    await sendEmail(env, { subject: "🔐 Rotation des tokens — checklist trimestrielle", html });
    console.log("[token-rotation] rappel envoyé");
  } catch (e) {
    console.error("[token-rotation] erreur:", e.message);
  }
}

// ── Exports Cloudflare Worker ────────────────────────────────────────────────
// ── Ingestion RAG hebdomadaire (rafraîchit l'index vectoriel Vectorize) ──────
// C2 — Solde des devis payés en 2 fois : lien de solde à J-30, relances J-25/J-20,
// annulation auto J-15. (Logique dans /api/devis-solde-cron ; ici on le déclenche.)
async function runDevisSoldeCron(env) {
  const secret = env.POSTSTAY_SECRET || env.PRIX_RECAP_SECRET || "";
  if (!secret) { console.log("[devis-solde] secret absent — skip"); return; }
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    const r = await fetch(`${siteUrl}/api/devis-solde-cron?secret=${encodeURIComponent(secret)}`);
    const j = await r.json().catch(() => ({}));
    console.log(`[devis-solde] ${j.ok ? "OK" : "KO"} — scanned=${j.scanned ?? "?"} actions=${(j.actions || []).length}`);
  } catch (e) {
    console.error("[devis-solde] error:", e.message);
  }
}

async function runRagIngest(env) {
  try {
    if (!env.POSTSTAY_SECRET) { console.log("[rag] POSTSTAY_SECRET absent — skip"); return; }
    const siteUrl = env.SITE_URL || "https://villamaryllis.com";
    const r = await fetch(`${siteUrl}/api/rag-ingest?secret=${env.POSTSTAY_SECRET}`);
    const j = await r.json().catch(() => ({}));
    console.log("[rag] ingestion:", JSON.stringify(j).slice(0, 150));
  } catch (e) { console.error("[rag] ingestion échouée:", e.message); }
}

// ── Auto-complétion résas OTA Airbnb depuis les mails (cron horaire) ─────────
// L'iCal Airbnb ne transmet ni nom ni prix. Un Zap (Outlook → onglet « Emails » du
// Sheet) y dépose les mails de confirmation ; cet appel parse ces mails et complète
// le voyageur + le payout net dans « Toutes les Réservations ». Écriture NON destructive
// et idempotente (ne remplit que les cases vides → ré-exécutable sans risque).
async function runEnrichFromEmails(env) {
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[enrich-emails] POSTSTAY_SECRET absent — skip"); return; }
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    const r = await fetch(`${siteUrl}/api/enrich-from-emails?secret=${encodeURIComponent(secret)}`);
    const j = await r.json().catch(() => ({}));
    console.log(`[enrich-emails] ${j.ok ? "OK" : "KO"} — mails=${j.airbnbMails ?? "?"} enrichis=${j.enrichis ?? 0} ignorés=${j.ignores ?? 0}`);
  } catch (e) {
    console.error("[enrich-emails] error:", e.message);
  }
}

// Évaluateur qualité auto (boucle A) : note les sorties d'agents du jour (llm_outputs)
// → llm_evals, et renvoie une consigne corrective aux agents faibles (agent_memory).
// Appelé APRÈS agents-run pour noter les sorties fraîches du run.
async function runAgentsEval(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[agents-eval] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const r = await fetch(`${siteUrl}/api/agents-eval?secret=${encodeURIComponent(secret)}&limit=30`);
    const j = await r.json().catch(() => ({}));
    console.log(`[agents-eval] ✓ ${j.scored ?? 0}/${j.candidats ?? 0} notés · ${j.feedback ?? 0} corrections renvoyées`);
  } catch (e) { console.error("[agents-eval] error:", e.message); }
}

// Agent-mémoire (B2) : distille evals 7j + impacts mesurés + signaux en apprentissages
// durables (agent_memory '_shared/learning:N') injectés dans tous les agents. Hebdo.
async function runMemoryDistill(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[memory-distill] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const r = await fetch(`${siteUrl}/api/memory-distill?secret=${encodeURIComponent(secret)}`);
    const j = await r.json().catch(() => ({}));
    console.log(`[memory-distill] ${j.ok ? "✓" : "✗"} ${j.written ?? 0} apprentissages distillés${j.note ? " — " + j.note : ""}`);
  } catch (e) { console.error("[memory-distill] error:", e.message); }
}

async function runAgentsExecuteAndDigest(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  if (!env.POSTSTAY_SECRET) { console.log("[agents] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const e = await fetch(`${siteUrl}/api/agents-execute?secret=${env.POSTSTAY_SECRET}`);
    console.log("[agents-execute]", JSON.stringify(await e.json().catch(() => ({}))).slice(0, 150));
  } catch (err) { console.error("[agents-execute] échec:", err.message); }
  try {
    const g = await fetch(`${siteUrl}/api/agents-digest?secret=${env.POSTSTAY_SECRET}`);
    console.log("[agents-digest]", JSON.stringify(await g.json().catch(() => ({}))).slice(0, 150));
  } catch (err) { console.error("[agents-digest] échec:", err.message); }
}

// Refresh mensuel des avis voyageurs Airbnb : déclenche le scrape Apify (tous les
// biens actifs) puis stocke en D1. Idempotent (ON CONFLICT DO NOTHING côté endpoint).
async function runReviewRefresh(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[reviews] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const ingest = await fetch(`${siteUrl}/api/voyageur-feedback?action=ingest&secret=${encodeURIComponent(secret)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ maxReviews: 50 }),
    });
    const ij = await ingest.json().catch(() => ({}));
    if (!ij.runId) { console.log("[reviews] ingest sans runId:", JSON.stringify(ij).slice(0, 200)); return; }
    console.log("[reviews] run démarré:", ij.runId);
    // Poll collect jusqu'à SUCCEEDED (~96s max ; le run prend ~1 min).
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 12000));
      const col = await fetch(`${siteUrl}/api/voyageur-feedback?action=collect&runId=${ij.runId}&secret=${encodeURIComponent(secret)}`);
      const cj = await col.json().catch(() => ({}));
      if (cj.ok && typeof cj.stored === "number") { console.log(`[reviews] ✓ ${cj.stored} avis stockés (fetched ${cj.fetched})`); return; }
      if (cj.status === "FAILED") { console.log("[reviews] run FAILED"); return; }
    }
    console.log(`[reviews] run pas encore terminé — collect manuel possible (runId ${ij.runId})`);
  } catch (e) { console.error("[reviews] erreur:", e.message); }
}

// Santé du token Meta (META_PAGE_TOKEN, expire ~60j). Alerte email si invalide ou
// expiration < 7j — comble le trou entre les rappels trimestriels.
async function runTokenHealthCheck(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  try {
    const r = await fetch(`${siteUrl}/api/social?action=status`);
    const j = await r.json().catch(() => ({}));
    const valid = j?.token?.isValid;
    const expiresIn = j?.token?.expiresIn;
    const soon = typeof expiresIn === "number" && expiresIn > 0 && expiresIn < 7 * 86400;
    if (valid === false || soon) {
      await sendEmail(env, {
        to: env.NOTIFICATION_EMAIL || "contact@villamaryllis.com",
        subject: valid === false ? "🚨 Token Meta INVALIDE — publication réseaux cassée" : "⚠️ Token Meta expire sous 7 jours",
        html: `<p>Le token Meta (<code>META_PAGE_TOKEN</code>) ${valid === false ? "est <b>invalide</b> — Facebook/Instagram ne publient plus." : `expire dans ~${Math.round((expiresIn || 0) / 86400)} jours.`}</p>
        <p>Régénérer : Graph API Explorer → token Page longue durée → mettre à jour <code>META_PAGE_TOKEN</code> (Cloudflare Pages <i>et</i> Worker). Détails : <code>docs/runbook-rotation-tokens.md</code>.</p>`,
      });
      console.log(`[token-health] ALERTE envoyée (valid=${valid}, expiresIn=${expiresIn})`);
    } else {
      console.log(`[token-health] OK (valid=${valid})`);
    }
  } catch (e) { console.error("[token-health] erreur:", e.message); }
}

// Rapport SEO hebdomadaire (Search Console) → email. Suit les impressions
// commerciales vs marque + pages actives, pour mesurer la montée en référencement.
async function runSeoReport(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) return;
  try {
    const r = await fetch(`${siteUrl}/api/seo-report?secret=${encodeURIComponent(secret)}`);
    const d = await r.json().catch(() => ({}));
    if (!d.ok) { console.log("[seo-report] indisponible:", JSON.stringify(d).slice(0, 200)); return; }
    const org = d.organique || {};
    const delta = org.deltaPct;
    const arrow = delta == null ? "" : delta > 0 ? `▲ +${delta}%` : delta < 0 ? `▼ ${delta}%` : "= 0%";
    const rows = (d.topPagesOrganique || []).map(p =>
      `<tr${p.commercial ? ' style="background:#eef7ee"' : ''}><td style="padding:3px 8px">${p.page}${p.commercial ? " 💰" : ""}</td><td style="padding:3px 8px;text-align:right">${p.sessions}</td></tr>`).join("");
    await sendEmail(env, {
      to: env.NOTIFICATION_EMAIL || "contact@villamaryllis.com",
      subject: `📈 SEO hebdo — ${org.sessions || 0} sessions organiques ${arrow}`,
      html: `<div style="font-family:system-ui,sans-serif;color:#2c2c2c">
        <h2 style="color:#0e3b3a">Suivi SEO hebdomadaire (trafic organique Google)</h2>
        <ul>
          <li><b>Sessions organiques</b> (7 derniers jours) : ${org.sessions || 0} ${arrow} <span style="color:#888">(vs ${org.sessionsPrec || 0} la semaine d'avant)</span></li>
          <li><b>Sessions organiques sur les landing commerciales</b> (28 j) : ${d.pagesCommercialesOrganique28j || 0} <span style="color:#888">— l'indicateur clé, doit décoller</span></li>
        </ul>
        <h3 style="color:#0e3b3a">Top pages d'atterrissage organiques (28 j)</h3>
        <p style="color:#888;font-size:12px;margin:0 0 8px">💰 = landing commerciale (objectif : les voir monter)</p>
        <table style="border-collapse:collapse;font-size:13px"><tr style="background:#f5efe0"><th style="padding:3px 8px;text-align:left">Page</th><th style="padding:3px 8px">Sessions</th></tr>${rows}</table>
        <p style="color:#888;font-size:12px;margin-top:16px">Source : GA4 (trafic réel). Objectif : voir le trafic organique grimper, surtout sur les pages 💰.</p>
      </div>`,
    });
    console.log(`[seo-report] ✓ envoyé (${org.sessions} sessions org, ${d.pagesCommercialesOrganique28j} commercial 28j)`);
  } catch (e) { console.error("[seo-report] erreur:", e.message); }
}

// 🐞 Triage hebdo des bugs — classe les bugs captés en prod, pousse au backlog, digest.
async function runBugTriage(env) {
  const siteUrl = env.SITE_URL || "https://villamaryllis.com";
  const secret = env.POSTSTAY_SECRET || "";
  if (!secret) { console.log("[bug-triage] POSTSTAY_SECRET absent — skip"); return; }
  try {
    const r = await fetch(`${siteUrl}/api/bug-triage?secret=${encodeURIComponent(secret)}`);
    const d = await r.json().catch(() => ({}));
    if (!d.ok) { console.log("[bug-triage] indisponible:", JSON.stringify(d).slice(0, 200)); return; }
    console.log(`[bug-triage] ✓ ${d.analyzed || 0} analysés, ${d.created || 0} backlog, ${d.ignored || 0} ignorés`);
    // Pas de bruit si rien de neuf
    if (!d.analyzed) return;
    const summaryHtml = (d.summary || "").replace(/\n/g, "<br>");
    const crit = /CRITIQUE/.test(d.summary || "");
    await sendEmail(env, {
      to: env.NOTIFICATION_EMAIL || "contact@villamaryllis.com",
      subject: `🐞 Bugs hebdo — ${d.created || 0} au backlog${crit ? " ⚠️ CRITIQUE" : ""}`,
      html: `<div style="font-family:system-ui,sans-serif;color:#2c2c2c">
        <h2 style="color:#0e3b3a">Triage automatique des bugs (semaine)</h2>
        <p style="font-size:14px;white-space:pre-line">${summaryHtml}</p>
        <p style="color:#888;font-size:12px;margin-top:16px">Détail + captures dans l'admin → onglet 🐞 Bugs. Les bugs ont été classés et poussés au backlog par l'agent QA.</p>
      </div>`,
    });
    // Alerte poussée immédiate si un bug critique a été détecté
    if (crit) await sendWhatsApp(env, `🐞⚠️ Bug CRITIQUE détecté en prod cette semaine.\n${(d.summary || "").slice(0, 300)}\n→ admin / onglet Bugs`);
  } catch (e) { console.error("[bug-triage] erreur:", e.message); }
}

export default {
  async scheduled(event, env, ctx) {
    const cron = event.cron;

    if (cron === "0 6 * * 1") {
      // Lundi 6h UTC — rapport hebdomadaire + rappel prix Airbnb
      const { allEvents } = await runSync(env);
      ctx.waitUntil(Promise.all([
        runWeeklyReport(env, allEvents),
        runPrixRecap(env),
        runRagIngest(env), // #2 RAG — rafraîchit l'index vectoriel chaque lundi
        runAgentsExecuteAndDigest(env), // L4 — agents-execute (auto drafts) puis digest hebdo
        runTokenHealthCheck(env), // alerte si META_PAGE_TOKEN invalide/expire <7j
        runSeoReport(env), // 📈 rapport SEO hebdo (Search Console) par email
        runBugTriage(env), // 🐞 triage hebdo des bugs captés en prod → backlog + digest
        runMemoryDistill(env), // 🧠 B2 — distille l'expérience du réseau en apprentissages durables
        runGuideWrite(env), // 📝 réécriture prose d'accueil guides D1 (welcome_message + tagline)
      ]));

    } else if (cron === "0 1 1 * *") {
      // 1er du mois — export comptable + article SEO long-tail mensuel
      const { allEvents } = await runSync(env);
      ctx.waitUntil(Promise.all([
        runMonthlyExport(env, allEvents),
        runMonthlySeoArticle(env),
        runTokenRotationReminder(env), // arch-018 — mensuel (META_PAGE_TOKEN expire ~60j)
        runReviewRefresh(env), // refresh mensuel des avis Airbnb (scrape + D1)
      ]));

    } else if (cron === "0 12 * * *") {
      // 12h UTC chaque jour (8h Martinique) — re-seed horizon 30j puis génération drafts éditoriaux J+2
      ctx.waitUntil((async () => {
        await runEditorialReseed(env);
        await runEditorialDraftGen(env);
      })());

    } else if (cron === "0 9 * * *") {
      // 9h UTC chaque jour — brief matinal + audit + rappels + alertes + gap pricing + agents autonomes
      const { allEvents } = await runSync(env);
      ctx.waitUntil((async () => {
        // ── Brief matinal locatif (5h Martinique) ─────────────────────────────────────────────────────
        try {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          const briefRes = await fetch(`${siteUrl}/api/morning-brief?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const briefData = await briefRes.json().catch(() => ({}));
          console.log(`[morning-brief] ✓ ntfy=${briefData.ntfyStatus ?? "?"} · ${briefData.title ?? ""}`);
        } catch (e) {
          console.error("[morning-brief] Cron error:", e.message);
        }
        // ── Sentinel KPI (anomalies données — push ntfy si signal détecté) ──────────────────────────
        try {
          const sentinelUrl = env.SITE_URL || "https://villamaryllis.com";
          const sentinelRes = await fetch(`${sentinelUrl}/api/kpi-sentinel?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const sentinelData = await sentinelRes.json().catch(() => ({}));
          console.log(`[kpi-sentinel] ✓ anomalies=${sentinelData.anomalies ?? 0} (🔴${sentinelData.reds ?? 0} 🟡${sentinelData.yellows ?? 0})`);
        } catch (e) {
          console.error("[kpi-sentinel] Cron error:", e.message);
        }
        // ── Refresh modèles LLM (AI-Ops) — en premier pour que les agents utilisent les meilleurs modèles ──
        try {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          const aiOpsRes = await fetch(`${siteUrl}/api/ai-ops?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const aiOpsData = await aiOpsRes.json().catch(() => ({}));
          console.log(`[ai-ops] ✓ ${aiOpsData.okCount ?? "?"}/${aiOpsData.total ?? "?"} providers OK · âge=${aiOpsData.age_h ?? "?"}h`);
        } catch (e) {
          console.error("[ai-ops] Cron error:", e.message);
        }
        await runMonitor(env);
        await runReminders(env, allEvents, allEvents);
        await runArrivalsDigest(env, allEvents); // RM-16 — récap arrivées de demain à l'hôte
        await runOccupancyAlerts(env, allEvents);
        await runOccupancySnapshot(env, allEvents); // persiste l'occupation réelle → rm_kpi_snapshots
        await runGapPricing(env, allEvents);
        await runYieldPricing(env, allEvents);
        await runCautionAutoRelease(env);
        // Caution DIFFÉRÉE (résas lointaines) : pose ~2 j avant l'arrivée, re-bloque avant chaque
        // expiration (couvre tout séjour), libère 3 j après le départ — off-session sur la carte
        // enregistrée. Les résas proches (≤3 j) gardent leur caution prise au paiement (inline).
        try {
          const siteCa = env.SITE_URL || "https://villamaryllis.com";
          const caRes = await fetch(`${siteCa}/api/caution-cron?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const caData = await caRes.json().catch(() => ({}));
          console.log(`[caution-cron] ✓ ${caData.total ?? "?"} suivie(s) · posées=${caData.placed ?? 0} re-posées=${caData.reauthed ?? 0} libérées=${caData.released ?? 0} échecs=${caData.failed ?? 0}`);
        } catch (e) {
          console.error("[caution-cron] Cron error:", e.message);
        }
        await runInventoryAlerts(env);
        await runDevisSoldeCron(env); // C2 — solde devis 2 fois : lien J-30 + relances J-25/J-20 + annulation J-15
        await runEnrichFromEmails(env); // complète nom+payout des résas Airbnb depuis les mails (onglet « Emails ») AVANT le contrôle de cohérence
        // ── Contrôle de cohérence des réservations (chantier 2 Robustesse) ──
        //    Détecte double-bookings / totaux aberrants / bien inconnu → inbox 🐞 Bugs + ntfy si critique.
        try {
          const siteCoh = env.SITE_URL || "https://villamaryllis.com";
          const cohRes = await fetch(`${siteCoh}/api/coherence-check?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`);
          const cohData = await cohRes.json().catch(() => ({}));
          console.log(`[coherence] ✓ ${cohData.checked ?? "?"} résas · ${cohData.findings ?? 0} anomalies (${cohData.critical ?? 0} critiques)`);
        } catch (e) {
          console.error("[coherence] Cron error:", e.message);
        }
        // ── Analyse autonome des 17 agents (GROQ_API_KEY requis dans les secrets CF Pages) ──
        if (env.GROQ_API_KEY) {
          const siteUrl = env.SITE_URL || "https://villamaryllis.com";
          let agentsData = {};
          let orchData   = {};

          try {
            console.log("[agents-run] Démarrage analyse autonome 17 agents...");
            const agentsRes = await fetch(`${siteUrl}/api/agents-run?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agents: "all" }),
            });
            agentsData = await agentsRes.json().catch(() => ({}));
            console.log(`[agents-run] ✓ ${agentsData.ok_count || 0} OK / ${agentsData.error_count || 0} erreurs`);
          } catch (e) {
            console.error("[agents-run] Cron error:", e.message);
          }

          // ── Orchestrateur : synthèse cross-agents ──────────────────────────
          try {
            console.log("[orchestrateur] Démarrage orchestration...");
            const orchRes = await fetch(`${siteUrl}/api/orchestrator`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trigger: "cron-daily", event_data: { cron: "0 9 * * *" } }),
            });
            orchData = await orchRes.json().catch(() => ({}));
            console.log(`[orchestrateur] ✓ Run #${orchData.run?.id || "?"} — ${orchData.run?.summary?.slice(0, 80) || "ok"}`);
          } catch (e) {
            console.error("[orchestrateur] Cron error:", e.message);
          }

          // ── Évaluateur qualité auto (boucle A) — note les sorties du run + feedback aux agents ──
          await runAgentsEval(env);

          // ── Digest email quotidien ─────────────────────────────────────────
          if (env.RESEND_API_KEY && orchData.run) {
            try {
              const run       = orchData.run;
              const today     = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
              const okCount   = agentsData.ok_count    || 0;
              const errCount  = agentsData.error_count || 0;
              const durationS = run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "?";

              // Désérialiser urgences / synergies / decisions
              let urgences  = [];
              let synergies = [];
              let decisions = [];
              try { urgences  = JSON.parse(run.urgences  || "[]"); } catch {}
              try { synergies = JSON.parse(run.synergies || "[]"); } catch {}
              try { decisions = JSON.parse(run.decisions || "[]"); } catch {}

              const urgencesHtml = urgences.length
                ? urgences.map(u => `<li>🔴 <strong>[${u.action_id}]</strong> ${u.raison}</li>`).join("")
                : "<li><em>Aucune urgence détectée</em></li>";

              const synergiesHtml = synergies.length
                ? synergies.map(s => `<li>🔗 <strong>${(s.agents || []).join(" + ")}</strong> — ${s.opportunite}</li>`).join("")
                : "<li><em>Aucune synergie identifiée</em></li>";

              const decisionsHtml = decisions.length
                ? decisions.map(d => `<li>✅ <strong>${d.type}</strong> — ${d.details}</li>`).join("")
                : "<li><em>Aucune décision</em></li>";

              const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#1e293b;border-radius:12px;overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:28px 32px;">
      <div style="font-size:11px;color:#93c5fd;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Amaryllis Locations</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🧠 Digest IA — ${today}</h1>
      <div style="margin-top:8px;color:#bfdbfe;font-size:13px;">${okCount} agents analysés · ${errCount} erreur${errCount > 1 ? "s" : ""} · ${durationS}</div>
    </div>

    <!-- Synthèse -->
    <div style="padding:24px 32px;border-bottom:1px solid #334155;">
      <div style="font-size:11px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Situation globale</div>
      <p style="margin:0;color:#e2e8f0;font-size:15px;line-height:1.6;">${run.summary || "Analyse non disponible."}</p>
    </div>

    <!-- Urgences -->
    <div style="padding:24px 32px;border-bottom:1px solid #334155;">
      <div style="font-size:11px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">⚡ Urgences</div>
      <ul style="margin:0;padding-left:20px;color:#fca5a5;font-size:14px;line-height:1.8;">${urgencesHtml}</ul>
    </div>

    <!-- Synergies -->
    <div style="padding:24px 32px;border-bottom:1px solid #334155;">
      <div style="font-size:11px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">🔗 Synergies détectées</div>
      <ul style="margin:0;padding-left:20px;color:#93c5fd;font-size:14px;line-height:1.8;">${synergiesHtml}</ul>
    </div>

    <!-- Décisions -->
    <div style="padding:24px 32px;border-bottom:1px solid #334155;">
      <div style="font-size:11px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">✅ Décisions d'orchestration</div>
      <ul style="margin:0;padding-left:20px;color:#86efac;font-size:14px;line-height:1.8;">${decisionsHtml}</ul>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;text-align:center;">
      <a href="${siteUrl}/admin" style="display:inline-block;padding:10px 24px;background:#1d4ed8;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Ouvrir le dashboard →</a>
      <p style="margin:16px 0 0;color:#475569;font-size:11px;">Amaryllis Locations · Généré automatiquement chaque matin à 9h UTC</p>
    </div>

  </div>
</body>
</html>`;

              const toEmail = env.NOTIFICATION_EMAIL || "contact@villamaryllis.com";
              const fromAddr = resendFrom(env);

              const r = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ from: fromAddr, to: toEmail, subject: `🧠 Digest IA Amaryllis — ${today}`, html }),
              });
              if (!r.ok) console.error("[digest] Erreur Resend:", await r.text());
              else console.log(`[digest] ✓ Email envoyé à ${toEmail}`);
            } catch (e) {
              console.error("[digest] Erreur:", e.message);
            }
          }
        }
      })());

    } else {
      // Toutes les heures — sync iCal + annulation Beds24 non payées + publication éditoriale due
      ctx.waitUntil((async () => {
        await runSync(env);
        await runCancelUnpaidBeds24Bookings(env);
        await runEditorialAutoPublish(env);
      })());
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Sécurisation des endpoints déclencheurs par token secret
    // Ajouter WORKER_SECRET via : wrangler secret put WORKER_SECRET
    const SAFE = ["/", "/gap-prices"]; // endpoints publics en lecture seule
    if (!SAFE.includes(url.pathname)) {
      const token = request.headers.get("x-worker-token") || url.searchParams.get("token");
      if (env.WORKER_SECRET && token !== env.WORKER_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
    }

    if (url.pathname === "/sync") {
      const r = await runSync(env); return new Response(JSON.stringify({ ok: true, ...r }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/reminders") {
      const { allEvents } = await runSync(env); await runReminders(env, allEvents, allEvents);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/weekly") {
      const { allEvents } = await runSync(env); await runWeeklyReport(env, allEvents);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/prix-recap") {
      await runPrixRecap(env);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/monthly") {
      const { allEvents } = await runSync(env); await runMonthlyExport(env, allEvents);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/occupancy") {
      const { allEvents } = await runSync(env); await runOccupancyAlerts(env, allEvents);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/occupancy-snapshot") {
      const { allEvents } = await runSync(env); await runOccupancySnapshot(env, allEvents);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/enrich-emails") {
      await runEnrichFromEmails(env);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/monitor") {
      const r = await runMonitor(env); return new Response(JSON.stringify({ ok: true, ...r }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/test-ntfy") {
      await sendWhatsApp(env, "✅ Test ntfy — les notifications ménage sont bien configurées !");
      return new Response(JSON.stringify({ ok: true, topic: env.NTFY_TOPIC || "non configuré" }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/gap-prices") {
      const CORS_H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_H });
      // Recalcul à la demande si pas encore en KV
      let raw = await env.ICAL_STORE.get("gap_prices");
      if (!raw) {
        const { allEvents } = await runSync(env);
        const gaps = await runGapPricing(env, allEvents);
        raw = JSON.stringify(gaps);
      }
      return new Response(raw, { headers: CORS_H });
    }
    if (url.pathname === "/caution-release") {
      const CORS_H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
      const result = await runCautionAutoRelease(env);
      return new Response(JSON.stringify({ ok: true, ...result }), { headers: CORS_H });
    }
    if (url.pathname === "/gap-prices/refresh") {
      const CORS_H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
      const { allEvents } = await runSync(env);
      const gaps = await runGapPricing(env, allEvents);
      return new Response(JSON.stringify({ ok: true, gaps }), { headers: CORS_H });
    }
    if (url.pathname === "/yield") {
      const CORS_H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
      // Retourne les prix yield actuels depuis KV (merge gap_prices)
      const raw = await env.ICAL_STORE.get("gap_prices");
      return new Response(raw || "{}", { headers: CORS_H });
    }
    if (url.pathname === "/yield/refresh") {
      const CORS_H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
      const { allEvents } = await runSync(env);
      const yieldPrices = await runYieldPricing(env, allEvents);
      return new Response(JSON.stringify({ ok: true, yieldPrices }), { headers: CORS_H });
    }
    return new Response(JSON.stringify({
      name: "amaryllis-ical-sync",
      crons: ["0 * * * * (sync)", "0 9 * * * (rappels+alertes+yield)", "0 6 * * 1 (hebdo)", "0 1 1 * * (mensuel)"],
      endpoints: ["/sync", "/reminders", "/weekly", "/monthly", "/occupancy", "/monitor", "/test-ntfy", "/gap-prices", "/gap-prices/refresh", "/yield", "/yield/refresh"],
    }), { headers: { "Content-Type": "application/json" } });
  },
};
