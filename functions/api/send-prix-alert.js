import { resendFrom } from "./_email.js";
// Cloudflare Pages Function — POST /api/send-prix-alert
// Envoie un email + push ntfy quand des prix sont sous le seuil minimum
// Appelé depuis CalendrierTarifs (App.jsx) via useEffect

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const BIEN_LABELS = {
  amaryllis:  "Villa Amaryllis",
  schoelcher: "Bellevue Schœlcher",
  geko:       "Géko",
  mabouya:    "Mabouya",
  zandoli:    "Zandoli",
  iguana:     "Villa Iguana",
  nogent:     "Appartement Nogent",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400); }

  const { bienId, dates = [], minPrice, year } = body;
  if (!bienId || dates.length === 0 || !minPrice) {
    return json({ error: "bienId, dates, minPrice requis" }, 400);
  }

  const bienNom = BIEN_LABELS[bienId] || bienId;
  const dateList = dates
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, price }) => {
      const [, m, d] = date.split("-");
      return { date, price, label: `${d}/${m}` };
    });

  // ── Email via Resend ────────────────────────────────────────────────────────
  const emailSent = await sendEmail(env, bienNom, dateList, minPrice, year);

  // ── Push via ntfy ───────────────────────────────────────────────────────────
  const ntfySent = await sendNtfy(env, bienNom, dateList, minPrice);

  return json({ ok: true, emailSent, ntfySent, count: dateList.length });
}

async function sendEmail(env, bienNom, dates, minPrice, year) {
  if (!env.RESEND_API_KEY) return false;
  const dest = env.NOTIFICATION_EMAIL || "contact@villamaryllis.com";

  const rows = dates.slice(0, 30).map(({ label, price }) => `
    <tr>
      <td style="padding:6px 14px;color:#0e3b3a;font-weight:600;">${label}</td>
      <td style="padding:6px 14px;color:#ef4444;font-weight:700;">${price}€</td>
      <td style="padding:6px 14px;color:#f59e0b;font-size:12px;">seuil ${minPrice}€ — manque ${minPrice - price}€</td>
    </tr>`).join("");

  const extra = dates.length > 30
    ? `<p style="margin:8px 0;font-size:12px;color:#7a6b5a;">… et ${dates.length - 30} autres dates</p>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <body style="margin:0;padding:0;background:#f0ebe3;font-family:Georgia,serif;">
      <div style="max-width:560px;margin:32px auto;background:#fffdf9;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:#b04530;padding:24px 28px;">
          <h1 style="margin:0;font-size:22px;color:#fff;font-weight:700;">⚠️ Alerte prix</h1>
          <p style="margin:6px 0 0;color:#fde8e0;font-size:13px;">${bienNom}${year ? ` — ${year}` : ""}</p>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 16px;font-size:14px;color:#0e3b3a;">
            <strong>${dates.length} date${dates.length > 1 ? "s" : ""}</strong> en dessous du prix minimum autorisé (<strong>${minPrice}€</strong>) pour <strong>${bienNom}</strong>.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#fde8e0;">
                <th style="padding:6px 14px;text-align:left;color:#7a6b5a;font-size:11px;">Date</th>
                <th style="padding:6px 14px;text-align:left;color:#7a6b5a;font-size:11px;">Prix</th>
                <th style="padding:6px 14px;text-align:left;color:#7a6b5a;font-size:11px;">Écart</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          ${extra}
          <div style="margin-top:20px;text-align:center;">
            <a href="https://villamaryllis.com/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Corriger dans le dashboard →</a>
          </div>
        </div>
        <div style="padding:14px 28px;background:#fde8e0;text-align:center;font-size:11px;color:#7a6b5a;">Amaryllis Dashboard · Alerte automatique</div>
      </div>
    </body>
    </html>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom(context.env, "Amaryllis <notifications@villamaryllis.com>"),
        to: dest.split(",").map(s => s.trim()).filter(Boolean),
        subject: `⚠️ ${dates.length} prix sous seuil — ${bienNom}`,
        html,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function sendNtfy(env, bienNom, dates, minPrice) {
  const topic = env.NTFY_TOPIC;
  if (!topic) return false;
  const sample = dates.slice(0, 5).map(({ label, price }) => `${label}(${price}€)`).join(", ");
  const body = `${dates.length} date${dates.length > 1 ? "s" : ""} sous ${minPrice}€ · ${sample}${dates.length > 5 ? " …" : ""}`;
  try {
    const r = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Title": `⚠️ Prix sous seuil — ${bienNom}`,
        "Priority": "high",
        "Tags": "warning,moneybag",
      },
      body,
    });
    return r.ok;
  } catch {
    return false;
  }
}
