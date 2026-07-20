import { resendFrom } from "./_email.js";
import { rateLimit } from "./_ratelimit.js";
// Cloudflare Pages Function — POST /api/sign-contract (cpw-101, phase C3)
// Signature électronique « maison » du contrat de location : on stocke la
// signature manuscrite (PNG dataURL), le nom, l'acceptation, + horodatage et IP
// (valeur probante simple). Pas de signature qualifiée eIDAS.
//
// Body : { bienId, bienNom, checkin, checkout, voyageur, email, total, nom, signature(dataURL), accepted, type?, remarques? }
// type: "contract" (défaut, signature manuscrite requise) | "etat_lieux_entree" |
//       "etat_lieux_sortie" (sc-023, 2026-07-16 — photos requises au lieu de la
//       signature ; même table, réutilisée plutôt qu'un nouvel endpoint séparé) |
//       "etat_lieux_menage" (2026-07-20 — outil dédié personnel de ménage Nogent,
//       lien fixe sans token de résa, photos OU remarques requis, pas les deux).
// photos: [dataURL, ...] — requis pour etat_lieux_entree/sortie, max 8, 400Ko/photo.
// remarques: string — libre, uniquement etat_lieux_menage, 2000 caractères max.
// Réponse : { ok, id, signed_at }

const ETAT_LIEUX_TYPES = new Set(["etat_lieux_entree", "etat_lieux_sortie", "etat_lieux_menage"]);
const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 400_000;
const MAX_REMARQUES = 2000;

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://villamaryllis.com",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const { bienId = "", bienNom = "", checkin = "", checkout = "", voyageur = "", email = "",
          total = 0, nom = "", signature = "", accepted = false, type = "contract", photos = [],
          remarques = "" } = body;

  const isEtatLieux = ETAT_LIEUX_TYPES.has(type);
  const isMenage = type === "etat_lieux_menage";

  if (isEtatLieux) {
    if (!nom || nom.trim().length < 2) return json({ error: "Nom complet requis" }, 400);
    if (!Array.isArray(photos)) return json({ error: "Format photo invalide" }, 400);
    // Ménage : photos OU remarques (un simple mot suffit) ; entrée/sortie voyageur : photo obligatoire.
    if (isMenage) {
      if (photos.length < 1 && !remarques.trim()) return json({ error: "Ajoutez au moins une photo ou une remarque" }, 400);
      if (remarques.length > MAX_REMARQUES) return json({ error: `Remarque limitée à ${MAX_REMARQUES} caractères` }, 400);
    } else if (photos.length < 1) {
      return json({ error: "Au moins une photo requise" }, 400);
    }
    if (photos.length > MAX_PHOTOS) return json({ error: `Maximum ${MAX_PHOTOS} photos` }, 400);
    if (photos.some(p => typeof p !== "string" || !p.startsWith("data:image/"))) return json({ error: "Format photo invalide" }, 400);
    if (photos.some(p => p.length > MAX_PHOTO_BYTES)) return json({ error: "Une photo dépasse la taille maximale" }, 413);
  } else {
    if (!accepted)  return json({ error: "Vous devez accepter le contrat" }, 400);
    if (!nom || nom.trim().length < 2) return json({ error: "Nom complet requis" }, 400);
    if (!signature || !signature.startsWith("data:image/")) return json({ error: "Signature manuscrite requise" }, 400);
    if (signature.length > 300000) return json({ error: "Signature trop lourde" }, 413);
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 500);

  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "";

  const rl = await rateLimit(db, { key: `sign:${ip}`, limit: 5, windowSec: 3600 });
  if (!rl.ok) return json({ error: "Trop de tentatives, réessayez dans une heure" }, 429);
  const ua = request.headers.get("User-Agent") || "";

  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS contracts_signed (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bien_id TEXT, bien_nom TEXT, voyageur TEXT, email TEXT, nom_signature TEXT,
      checkin TEXT, checkout TEXT, total INTEGER,
      signature_png TEXT, ip TEXT, user_agent TEXT,
      signed_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`).run();
    await db.prepare(`ALTER TABLE contracts_signed ADD COLUMN type TEXT DEFAULT 'contract'`).run().catch(() => {});
    await db.prepare(`ALTER TABLE contracts_signed ADD COLUMN photos TEXT`).run().catch(() => {});
    await db.prepare(`ALTER TABLE contracts_signed ADD COLUMN remarques TEXT`).run().catch(() => {});

    const res = await db.prepare(`INSERT INTO contracts_signed
      (bien_id, bien_nom, voyageur, email, nom_signature, checkin, checkout, total, signature_png, ip, user_agent, type, photos, remarques)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(bienId, bienNom, voyageur, email, nom.trim(), checkin, checkout, Math.round(total) || 0,
      signature || null, ip, ua, type, isEtatLieux ? JSON.stringify(photos) : null,
      isMenage ? (remarques.trim() || null) : null).run();

    // Alerte hôte (best-effort)
    if (env.RESEND_API_KEY) {
      const etapeLabel = type === "etat_lieux_entree" ? "État des lieux d'ENTRÉE"
        : type === "etat_lieux_sortie" ? "État des lieux de SORTIE"
        : isMenage ? "État des lieux MÉNAGE" : null;
      const subject = etapeLabel
        ? `${isMenage ? "🧹" : "📸"} ${etapeLabel} — ${bienNom || bienId} (${nom.trim()})`
        : `✍️ Contrat signé — ${bienNom || bienId} (${nom.trim()})`;
      const photosHtml = isEtatLieux && photos.length > 0
        ? `<p><strong>${photos.length} photo${photos.length > 1 ? "s" : ""}</strong></p>` +
          photos.map(p => `<img src="${p}" style="max-width:280px;border-radius:8px;margin:4px;">`).join("")
        : "";
      // Remarques mises en avant EN HAUT (avant les photos) — c'est le cœur de ce que
      // Nesrine/le personnel de ménage veut signaler, ne doit pas être noyé sous les photos.
      const remarquesHtml = isMenage && remarques.trim()
        ? `<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:12px 0;border-radius:4px;"><strong>Remarque :</strong><br>${remarques.trim().replace(/\n/g, "<br>")}</div>`
        : "";
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: resendFrom(env),
          to: [(env.NOTIFICATION_EMAIL || "contact@villamaryllis.com").split(",")[0].trim()],
          subject,
          html: `<div style="font-family:sans-serif"><h3>${etapeLabel || "Contrat de location signé"}</h3><p><strong>${bienNom || bienId}</strong><br>Signataire : ${nom.trim()}${voyageur || email ? `<br>Voyageur : ${voyageur || "—"} · ${email || "—"}` : ""}${checkin && checkout ? `<br>Séjour : ${checkin} → ${checkout}` : ""}<br>IP : ${ip}</p>${remarquesHtml}${photosHtml}</div>`,
        }),
      }).catch(() => {});
    }

    return json({ ok: true, id: res.meta?.last_row_id, signed_at: Math.floor(Date.now() / 1000) });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return onRequestOptions();
  if (context.request.method === "POST")    return onRequestPost(context);
  return json({ error: "Method not allowed" }, 405);
}
