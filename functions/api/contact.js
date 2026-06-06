import { resendFrom } from "./_email.js";
import { rateLimit } from './_ratelimit.js';

const ALLOWED_ORIGINS = ["https://villamaryllis.com", "https://www.villamaryllis.com", "https://dashboard-amaryllis.pages.dev"];
function corsHeaders(request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith(".dashboard-amaryllis.pages.dev"));
  return {
    "Access-Control-Allow-Origin":  allowed ? origin : "https://villamaryllis.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

// Initialise la table contacts dans D1 (idempotent)
async function ensureContactsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS contacts (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nom       TEXT NOT NULL,
      email     TEXT NOT NULL,
      message   TEXT NOT NULL,
      source    TEXT NOT NULL DEFAULT 'formulaire',
      bien      TEXT,
      status    TEXT NOT NULL DEFAULT 'nouveau' CHECK(status IN ('nouveau','répondu','archivé')),
      notes     TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `).run();
}

// web-007 : ntfy push — alerte hôte si Resend échoue silencieusement
async function sendNtfyLead(env, { nom, email, bien, reason = "Resend KO" }) {
  const topic = env.NTFY_TOPIC;
  if (!topic) return;
  const bienStr = bien ? ` — ${bien}` : "";
  await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Title": `📩 Lead Amaryllis${bienStr}`,
      "Priority": "high",
      "Tags": "email,warning",
    },
    body: `${nom} (${email})${bienStr}\n⚠️ ${reason} — lead sauvé en D1`,
  });
}

export async function onRequestPost(context) {
  try {
    // ── Rate limiting : 3 soumissions / IP / heure ───────────────────────────
    const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
    const rl = await rateLimit(context.env.revenue_manager, {
      key: `contact:${ip}`,
      limit: 3,
      windowSec: 3600,
    });
    if (!rl.ok) {
      return Response.json({ ok: false, error: "Trop de messages envoyés. Réessayez dans une heure." }, { status: 429 });
    }

    const body = await context.request.json();
    const { nom, email, message, bien, source } = body;

    if (!nom || !email || !message) {
      return Response.json({ ok: false, error: "Champs requis manquants" }, { status: 400 });
    }

    const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

    // ── 1. Persistance D1 ────────────────────────────────────────────────────
    const db = context.env.revenue_manager;
    if (db) {
      try {
        await ensureContactsTable(db);
        await db.prepare(
          "INSERT INTO contacts (nom, email, message, source, bien) VALUES (?, ?, ?, ?, ?)"
        ).bind(nom, email, message, source || "formulaire", bien || null).run();
        console.log(`[contact] Lead persisté en D1: ${email}`);
      } catch (dbErr) {
        // Ne pas bloquer l'envoi d'email si D1 échoue
        console.error("[contact] D1 erreur:", dbErr.message);
      }
    }

    // ── 2. Envoi email Resend ────────────────────────────────────────────────
    const apiKey = context.env.RESEND_API_KEY;
    if (!apiKey) {
      // D1 OK mais pas d'email — on retourne quand même ok si D1 a fonctionné
      console.error("[contact] RESEND_API_KEY absent — email non envoyé");
      return Response.json({ ok: !!db, warning: "Email non envoyé (config manquante)" });
    }

    const toEmail = context.env.CONTACT_TO_EMAIL || "vinsmaf@hotmail.com";
    const bienLabel = bien ? ` — ${bien}` : "";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom(context.env),
        to: toEmail,
        reply_to: email,
        subject: `[Amaryllis] Message de ${nom}${bienLabel}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#0e3b3a">Nouveau message — Amaryllis</h2>
            <p><strong>Nom :</strong> ${esc(nom)}</p>
            <p><strong>Email :</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
            ${bien ? `<p><strong>Propriété :</strong> ${esc(bien)}</p>` : ""}
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
            <p style="white-space:pre-wrap">${esc(message)}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
            <p style="font-size:11px;color:#888">Ce message a été sauvegardé automatiquement dans le CRM → Admin → Leads</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error("Resend error:", errBody);
      // web-007 : ntfy push quand Resend échoue — le lead est sauvé en D1
      await sendNtfyLead(context.env, { nom, email, bien, reason: "Resend KO" }).catch(() => {});
      // D1 a fonctionné, email échoué — pas de 500 pour l'UX (lead sauvé)
      return Response.json({ ok: true, warning: "Email non envoyé" });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Contact error:", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}

export function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}
