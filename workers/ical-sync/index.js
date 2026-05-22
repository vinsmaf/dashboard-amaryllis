/**
 * Amaryllis — Cloudflare Worker : automatisation complète
 *
 * Crons :
 *   "0 * * * *"   → sync iCal toutes les heures
 *   "0 9 * * *"   → audit + rappels J-3/J-1/J+1 + alertes occupation
 *   "0 6 * * 1"   → rapport hebdomadaire (lundi matin)
 *   "0 1 1 * *"   → export comptable mensuel (1er du mois)
 *
 * Secrets requis :
 *   RESEND_API_KEY        — Resend (email)
 *   APPS_SCRIPT_URL       — Google Apps Script
 *   NTFY_TOPIC            — Topic ntfy.sh pour notifs ménage (ex: menage-amaryllis-2025)
 *   NOTIFICATION_EMAIL    — Email hôte (défaut: contact@villamaryllis.com)
 */

// ── iCal URLs Airbnb ─────────────────────────────────────────────────────────
const ICAL_AIRBNB = {
  amaryllis:  "https://www.airbnb.fr/calendar/ical/54269844.ics?t=681e7d55c76a4845839d24c0bc18ca94",
  schoelcher: "https://www.airbnb.fr/calendar/ical/24242415.ics?t=400f2712fa95485692d5911972f5533d",
  geko:       "https://www.airbnb.fr/calendar/ical/1263155865459755724.ics?t=1c95f057feda4b2fa08519aad1001ca9",
  mabouya:    "https://www.airbnb.fr/calendar/ical/1046596752160926069.ics?t=05c0e5dbdd9542878d58aa760416cf4f",
  zandoli:    "https://www.airbnb.fr/calendar/ical/792768220924504884.ics?t=cfc774d9c7fa40bfbe5f0757ba06b090",
};

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
    const montant = montantRaw ? parseFloat(montantRaw.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;
    let voyageur = sum.replace(/^(Réservé|Reserved|Booking)\s*[-–]?\s*/i, "").replace(/\(.*\)/g, "").trim() || "Voyageur";
    events.push({ uid, bienId, nom: NOMS[bienId] || bienId, voyageur, checkin: ci, checkout: co, montant });
  }
  return events;
}

async function fetchICS(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AmaryllisSync/1.0)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text.includes("VCALENDAR")) throw new Error("Format ICS invalide");
  return text;
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

// ── Email via Resend ─────────────────────────────────────────────────────────
async function sendEmail(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY) return;
  const dest = to || env.NOTIFICATION_EMAIL || "contact@villamaryllis.com";
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Amaryllis Sync <sync@villamaryllis.com>",
      to: [dest],
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
}

// ── Rappels hôte (J-3 / J-1 / J+1) ─────────────────────────────────────────
async function runReminders(env, allEvents) {
  const todayStr = today();

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
          <div style="margin-top:16px;text-align:center;">
            <a href="${env.SITE_URL || "https://villamaryllis.com"}/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Voir le planning →</a>
          </div>
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      console.log(`[reminders] J-3 envoyé — ${nom} · ${guest}`);
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

      // WhatsApp ménage
      const waText = `🏠 Ménage demain\n${nom}\n⏰ Départ avant 11h — ${formatDate(e.checkout)}\nVoyageur : ${guest} (${nights} nuits)\nProchaine arrivée : vérifier planning`;
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
        `),
      });

      await env.ICAL_STORE.put(kvKey, "sent", { expirationTtl: 60 * 60 * 24 * 14 });
      console.log(`[reminders] J+1 envoyé — ${nom} · ${guest}`);
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
async function runOccupancyAlerts(env, allEvents) {
  const todayStr = today();
  const in30 = addDays(todayStr, 30);

  const byProp = {};
  for (const e of allEvents) {
    if (e.checkin > in30 || e.checkout < todayStr) continue;
    const start = e.checkin > todayStr ? e.checkin : todayStr;
    const end   = e.checkout < in30 ? e.checkout : in30;
    byProp[e.bienId] = (byProp[e.bienId] || 0) + diffDays(start, end);
  }

  const alerts = Object.entries(NOMS).filter(([id]) => {
    const pct = ((byProp[id] || 0) / 30) * 100;
    return pct < 40; // seuil 40%
  });

  if (alerts.length === 0) return;

  const rows = alerts.map(([id, nom]) => {
    const occ = byProp[id] || 0;
    const pct = Math.round(occ / 30 * 100);
    return `<tr><td style="padding:8px 14px;font-weight:600;color:#0e3b3a;">${nom}</td><td style="padding:8px 14px;color:#c47254;font-weight:700;">${pct}%</td><td style="padding:8px 14px;color:#7a6b5a;">${occ} nuits sur 30</td></tr>`;
  }).join("");

  await sendEmail(env, {
    subject: `⚠️ ${alerts.length} logement${alerts.length > 1 ? "s" : ""} sous-occupé${alerts.length > 1 ? "s" : ""} — 30 prochains jours`,
    html: emailWrapper(`
      <h2 style="color:#c47254;margin:0 0 8px">⚠️ Alerte sous-occupation</h2>
      <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">Logements avec moins de 40% d'occupation dans les 30 prochains jours</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#fde8e0;">
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Logement</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;color:#7a6b5a;">Occupation</th>
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

  console.log(`[occupancy] Alerte envoyée — ${alerts.length} logement(s) sous le seuil`);
}

// ── Export comptable mensuel ─────────────────────────────────────────────────
async function runMonthlyExport(env, allEvents) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7); // "2025-05"
  const label = lastMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const events = allEvents.filter(e => e.checkin.startsWith(lastMonthStr) || e.checkout.startsWith(lastMonthStr));

  if (events.length === 0) {
    console.log("[monthly] Aucune réservation le mois dernier — export ignoré");
    return;
  }

  // CSV
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

  // Email avec CSV en pièce jointe (base64)
  const csvB64 = btoa(unescape(encodeURIComponent(csv)));

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Amaryllis Sync <sync@villamaryllis.com>",
      to: [env.NOTIFICATION_EMAIL || "contact@villamaryllis.com"],
      subject: `📊 Export comptable — ${label}`,
      html: emailWrapper(`
        <h2 style="color:#0e3b3a;margin:0 0 8px">📊 Export comptable</h2>
        <p style="color:#7a6b5a;font-size:13px;margin:0 0 20px">${label} · ${events.length} réservation${events.length > 1 ? "s" : ""} · ${totalCA.toLocaleString("fr-FR")}€ CA</p>
        <p style="font-size:13px;color:#0e3b3a;">Le fichier CSV ci-joint contient toutes les réservations du mois pour transmission à votre comptable.</p>
      `),
      attachments: [{
        filename: `reservations-${lastMonthStr}.csv`,
        content: csvB64,
      }],
    }),
  });

  if (!r.ok) console.error("[monthly] Resend error:", await r.text());
  else console.log(`[monthly] Export ${label} envoyé — ${events.length} réservations, ${totalCA}€`);
}

// ── Push vers Google Sheets ──────────────────────────────────────────────────
async function pushToSheets(env, allEvents) {
  if (!env.APPS_SCRIPT_URL) return;
  const reservations = allEvents.map(e => ({
    id: e.uid, bienId: e.bienId, voyageur: e.voyageur,
    canal: e.canal, checkin: e.checkin, checkout: e.checkout,
    montant: e.montant, fromIcal: true, notes: "",
  }));
  try {
    await fetch(env.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "importAllReservations", reservations }),
    });
    console.log(`[sheets] ${reservations.length} réservations pushées`);
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
  const airbnbFeeds   = Object.entries(ICAL_AIRBNB).map(([id, url]) => syncFeed(env, id, url, "airbnb", allEvents, nouvelles));
  const bookingFeeds  = Object.entries(bookingUrls).map(([id, url]) => syncFeed(env, id, url, "booking", allEvents, nouvelles));
  await Promise.all([...airbnbFeeds, ...bookingFeeds]);

  if (nouvelles.length > 0) await sendNouvellesResas(env, nouvelles);
  if (allEvents.length > 0) await pushToSheets(env, allEvents);

  console.log(`[amaryllis-sync] Terminé — ${allEvents.length} evt, ${nouvelles.length} nouveaux`);
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
  if (errors.length > 0) {
    await sendEmail(env, {
      subject: `🚨 ${errors.length} problème(s) — villamaryllis.com`,
      html: emailWrapper(`<h2 style="color:#c47254">🚨 Audit</h2><p>${errors.join("<br>")}</p>`),
    });
  }
  return { errors: errors.length };
}

// ── Caution auto-release J+3 ──────────────────────────────────────────────────
// Interroge Stripe pour tous les PaymentIntents de type "caution" en requires_capture
// Si checkout + 3 jours <= today → annule (libère les fonds)
async function runCautionAutoRelease(env) {
  if (!env.STRIPE_SECRET_KEY) { console.log("[caution] STRIPE_SECRET_KEY absent"); return; }
  const todayStr = today();

  // Stripe Search API — tous les PI caution en attente de capture
  const query = encodeURIComponent("status:'requires_capture' AND metadata['type']:'caution'");
  let released = 0;

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/payment_intents/search?query=${query}&limit=100`,
      { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } }
    );
    const data = await res.json();
    if (data.error) { console.error("[caution] Stripe error:", data.error.message); return; }

    for (const pi of (data.data || [])) {
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
      const pct = gapLen <= 2 ? 25 : 15;
      if (!gaps[bienId]) gaps[bienId] = {};
      for (let d = 0; d < gapLen; d++) {
        gaps[bienId][addDays(endA, d)] = pct;
      }
    }
  }

  // Sauvegarder dans KV (clé globale, TTL 24h)
  await env.ICAL_STORE.put("gap_prices", JSON.stringify(gaps), { expirationTtl: 86400 });
  const totalDates = Object.values(gaps).reduce((s, m) => s + Object.keys(m).length, 0);
  console.log(`[gap-pricing] ${totalDates} dates remisées sur ${Object.keys(gaps).length} biens`);
  return gaps;
}

// ── Exports Cloudflare Worker ────────────────────────────────────────────────
export default {
  async scheduled(event, env, ctx) {
    const cron = event.cron;

    if (cron === "0 6 * * 1") {
      // Lundi 6h UTC — rapport hebdomadaire
      const { allEvents } = await runSync(env);
      ctx.waitUntil(runWeeklyReport(env, allEvents));

    } else if (cron === "0 1 1 * *") {
      // 1er du mois — export comptable
      const { allEvents } = await runSync(env);
      ctx.waitUntil(runMonthlyExport(env, allEvents));

    } else if (cron === "0 9 * * *") {
      // 9h UTC chaque jour — audit + rappels + alertes + gap pricing
      const { allEvents } = await runSync(env);
      ctx.waitUntil((async () => {
        await runMonitor(env);
        await runReminders(env, allEvents);
        await runOccupancyAlerts(env, allEvents);
        await runGapPricing(env, allEvents);
        await runCautionAutoRelease(env);
      })());

    } else {
      // Toutes les heures — sync iCal uniquement
      ctx.waitUntil(runSync(env));
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
      const { allEvents } = await runSync(env); await runReminders(env, allEvents);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/weekly") {
      const { allEvents } = await runSync(env); await runWeeklyReport(env, allEvents);
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
    return new Response(JSON.stringify({
      name: "amaryllis-ical-sync",
      crons: ["0 * * * * (sync)", "0 9 * * * (rappels+alertes)", "0 6 * * 1 (hebdo)", "0 1 1 * * (mensuel)"],
      endpoints: ["/sync", "/reminders", "/weekly", "/monthly", "/occupancy", "/monitor", "/test-ntfy", "/gap-prices", "/gap-prices/refresh"],
    }), { headers: { "Content-Type": "application/json" } });
  },
};
