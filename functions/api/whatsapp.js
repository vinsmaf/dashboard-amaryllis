// Cloudflare Pages Function — /api/whatsapp
// Bot WhatsApp Business (Meta Cloud API) pour les voyageurs Amaryllis.
//
// GET  /api/whatsapp?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
//      → Vérification du webhook Meta (à faire une seule fois lors de la configuration)
//
// POST /api/whatsapp
//      → Reçoit les messages entrants, répond avec le LLM (Groq via _llm.js)
//      → Le contexte injecté = guide du bien détecté (selon mots-clés dans le message)
//
// Secrets requis (Cloudflare Pages → Settings → Environment Variables) :
//   WHATSAPP_TOKEN      — access token permanent Meta
//   WHATSAPP_PHONE_ID   — Phone Number ID (depuis Meta Business → WhatsApp)
//   WHATSAPP_VERIFY_TOKEN — chaîne secrète choisie lors de la config webhook Meta
//
// Comportement :
//   1. Détecte le bien mentionné (amaryllis / zandoli / geko / mabouya / schoelcher / nogent)
//   2. Charge le guide JSON depuis D1 (fallback public/)
//   3. Construit un prompt system contextuel + répond en <120 mots (mobile-friendly)
//   4. Loggue chaque échange en D1 (table whatsapp_conversations)

import { callLLM } from "./_llm.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json" },
});

// ─── 1. Détection du bien ────────────────────────────────────────────────────

const BIENS_KEYWORDS = {
  amaryllis: ["amaryllis", "villa", "piscine amaryllis", "sainte-luce"],
  zandoli:   ["zandoli"],
  geko:      ["géko", "geko"],
  mabouya:   ["mabouya", "studio"],
  schoelcher:["schœlcher", "schoelcher", "bellevue", "schœl"],
  iguana:    ["iguana", "iguane"],
  nogent:    ["nogent", "paris", "île-de-france"],
};

function detectBien(text) {
  const lower = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [bien, keywords] of Object.entries(BIENS_KEYWORDS)) {
    for (const kw of keywords) {
      const kwNorm = kw.normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (lower.includes(kwNorm)) return bien;
    }
  }
  return "amaryllis"; // défaut
}

// ─── 2. Chargement du guide ──────────────────────────────────────────────────

async function fetchGuide(env, propertyId, origin) {
  // Essai D1
  try {
    const db = env.revenue_manager;
    if (db) {
      const row = await db.prepare(
        "SELECT content_json FROM property_guides WHERE property_id = ?"
      ).bind(propertyId).first();
      if (row?.content_json) return JSON.parse(row.content_json);
    }
  } catch {}

  // Fallback fichier statique
  try {
    const r = await fetch(`${origin}/guides/${propertyId}.json`);
    if (r.ok) return await r.json();
  } catch {}

  return null;
}

// ─── 3. Construction du prompt système ──────────────────────────────────────

function buildSystemPrompt(guide, propertyId) {
  const propertyName = guide?.property_name || propertyId;
  const lines = [
    `Tu es l'assistant virtuel WhatsApp d'Amaryllis Locations pour ${propertyName}.`,
    `Réponds en FRANÇAIS, en moins de 120 mots, de façon chaleureuse mais directe.`,
    `Tu aides les voyageurs pendant leur séjour : accès, wifi, équipements, départ, extras.`,
    `Ne fournis jamais d'informations que tu n'as pas. Si tu ne sais pas, dis "je vais demander à l'hôte".`,
    "",
  ];

  if (!guide) {
    lines.push("(Guide non disponible — réponds de façon générale et propose de contacter l'hôte.)");
    return lines.join("\n");
  }

  lines.push("═══ INFORMATIONS DU LOGEMENT ═══");
  if (guide.checkin_time)   lines.push(`Check-in : à partir de ${guide.checkin_time}`);
  if (guide.checkout_time)  lines.push(`Check-out : avant ${guide.checkout_time}`);
  if (guide.wifi_ssid)      lines.push(`Wifi réseau : ${guide.wifi_ssid}`);
  if (guide.wifi_password)  lines.push(`Wifi mot de passe : ${guide.wifi_password}`);
  if (guide.address)        lines.push(`Adresse : ${guide.address}`);

  // Sections clés
  if (Array.isArray(guide.sections)) {
    for (const s of guide.sections.slice(0, 6)) {
      lines.push(`\n── ${s.title} ──`);
      if (s.type === "steps" && Array.isArray(s.items)) {
        s.items.forEach((it, i) => lines.push(`${i + 1}. ${it.label}${it.value ? ` : ${it.value}` : ""}`));
      } else if ((s.type === "info" || s.type === "list") && Array.isArray(s.items)) {
        s.items.forEach(it => lines.push(`• ${it.label}${it.value ? ` : ${it.value}` : ""}`));
      } else if (s.type === "text" && s.content) {
        lines.push(s.content.slice(0, 300));
      } else if (s.type === "checklist" && Array.isArray(s.items)) {
        s.items.forEach(it => lines.push(`☐ ${typeof it === "string" ? it : it.label || ""}`));
      }
    }
  }

  // FAQ
  if (Array.isArray(guide.faq) && guide.faq.length) {
    lines.push("\n── FAQ ──");
    guide.faq.slice(0, 8).forEach(f => lines.push(`Q: ${f.q}\nR: ${f.a}`));
  }

  // Extras disponibles
  if (Array.isArray(guide.extras) && guide.extras.length) {
    lines.push("\n── EXTRAS DISPONIBLES ──");
    guide.extras.forEach(e => lines.push(`• ${e.name} — ${e.price_display || e.price + "€"}`));
    lines.push(`Pour commander : https://villamaryllis.com/services/${propertyId}`);
  }

  return lines.join("\n");
}

// ─── 4. Envoi du message WhatsApp ────────────────────────────────────────────

async function sendWhatsAppMessage(env, to, text) {
  const phoneId = env.WHATSAPP_PHONE_ID;
  const token   = env.WHATSAPP_TOKEN;
  if (!phoneId || !token) return { ok: false, error: "secrets manquants" };

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

// ─── 5. Logging D1 ───────────────────────────────────────────────────────────

async function logConversation(env, { from, bien, userMessage, botReply, provider, ok }) {
  const db = env.revenue_manager;
  if (!db) return;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS whatsapp_conversations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      from_wa    TEXT NOT NULL,
      bien       TEXT,
      user_msg   TEXT,
      bot_reply  TEXT,
      provider   TEXT,
      ok         INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`).run();
    await db.prepare(
      "INSERT INTO whatsapp_conversations (from_wa, bien, user_msg, bot_reply, provider, ok) VALUES (?,?,?,?,?,?)"
    ).bind(from, bien || null, userMessage?.slice(0, 2000), botReply?.slice(0, 2000), provider || null, ok ? 1 : 0).run();
  } catch (e) {
    console.error("[whatsapp-log]", e.message);
  }
}

// ─── 6. Handlers HTTP ────────────────────────────────────────────────────────

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Vérification webhook Meta
  const mode      = url.searchParams.get("hub.mode");
  const token     = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return json({ error: "vérification échouée" }, 403);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); }
  catch { return json({ ok: false, error: "body invalide" }, 400); }

  // Extraction du message entrant (structure Meta Cloud API)
  const entry    = body?.entry?.[0];
  const change   = entry?.changes?.[0];
  const value    = change?.value;
  const msg      = value?.messages?.[0];

  // Ignorer les statuts (delivered, read…)
  if (!msg) return json({ ok: true, note: "aucun message à traiter" });

  const from        = msg.from;           // numéro WhatsApp de l'expéditeur
  const userMessage = msg.text?.body || "";

  if (!userMessage.trim()) return json({ ok: true, note: "message vide" });

  // Détection du bien
  const bien  = detectBien(userMessage);
  const guide = await fetchGuide(env, bien, new URL(request.url).origin);

  // Appel LLM
  const llmResult = await callLLM(env, {
    tier: "fast",
    logSource: "whatsapp",
    messages: [
      { role: "system", content: buildSystemPrompt(guide, bien) },
      { role: "user",   content: userMessage },
    ],
    max_tokens: 300,
    temperature: 0.4,
  });

  const reply = llmResult.ok
    ? llmResult.text.trim()
    : "Désolé, je rencontre un problème technique. Contactez directement l'hôte au +33 6 10 88 07 72 🙏";

  // Envoi de la réponse
  const sendResult = await sendWhatsAppMessage(env, from, reply);

  // Log
  await logConversation(env, {
    from, bien,
    userMessage,
    botReply: reply,
    provider: llmResult.provider,
    ok: sendResult.ok,
  });

  return json({ ok: true, bien, provider: llmResult.provider, sent: sendResult.ok });
}
