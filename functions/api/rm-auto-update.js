// GET /api/rm-auto-update?secret=POSTSTAY_SECRET[&scan=1]
// Orchestre le recalcul quotidien des recommandations RM pour tous les biens.
// Si &scan=1 : déclenche aussi le scan Firecrawl (hebdo, lundi seulement).
// Appelé par le Worker iCal-sync (cron 0 9 * * * et 0 6 * * 1).

const BIENS_RM = ["amaryllis", "zandoli", "geko", "mabouya", "schoelcher", "nogent"];
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!secret || secret !== (env.POSTSTAY_SECRET || "")) {
    return json({ error: "Accès refusé" }, 401);
  }

  const withScan = url.searchParams.get("scan") === "1";
  const base = `${url.protocol}//${url.host}`;
  const adminBearer = `Bearer ${env.ADMIN_PASSWORD || env.ADMIN_PWD || ""}`;

  const today = new Date().toISOString().slice(0, 10);
  const to30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const recalcResults = [];
  const scanResults = [];

  // 1. Recalcul des recommandations pour tous les biens (séquentiel pour éviter surcharge D1)
  for (const property_id of BIENS_RM) {
    try {
      const res = await fetch(`${base}/api/rm-recommendations/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id, from: today, to: to30 }),
      });
      const data = await res.json().catch(() => ({}));
      recalcResults.push({ property_id, ok: res.ok, dates: data.dates_calculated ?? 0 });
    } catch (e) {
      recalcResults.push({ property_id, ok: false, error: e.message });
    }
  }

  // 2. Scan Firecrawl (hebdo seulement, si &scan=1 et clé présente)
  if (withScan && env.FIRECRAWL_API_KEY) {
    for (const property_id of BIENS_RM) {
      try {
        const res = await fetch(`${base}/api/fc-competitors-scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": adminBearer },
          body: JSON.stringify({ property_id }),
        });
        const data = await res.json().catch(() => ({}));
        scanResults.push({ property_id, ok: data.ok ?? false, scanned: data.scanned ?? 0, errors: data.errors ?? 0 });
      } catch (e) {
        scanResults.push({ property_id, ok: false, error: e.message });
      }
    }
  }

  // 3. Notification ntfy
  const okCount = recalcResults.filter(r => r.ok).length;
  const totalDates = recalcResults.reduce((s, r) => s + (r.dates ?? 0), 0);
  const scannedTotal = scanResults.reduce((s, r) => s + (r.scanned ?? 0), 0);

  if (env.NTFY_TOPIC && okCount > 0) {
    const parts = [`📊 RM recalculé : ${okCount}/${BIENS_RM.length} biens · ${totalDates} dates`];
    if (withScan && scannedTotal > 0) parts.push(`🔍 Veille : ${scannedTotal} concurrents scannés`);
    parts.push("→ Ouvrir Revenue Manager pour approuver");
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
      method: "POST",
      headers: { "Title": `📊 RM — recos ${today} prêtes`, "Tags": "moneybag", "Priority": "low" },
      body: parts.join("\n"),
    }).catch(() => {});
  }

  console.log(`[rm-auto-update] ${okCount}/${BIENS_RM.length} OK · ${totalDates} dates${withScan ? ` · scan ${scannedTotal}` : ""}`);

  return json({ ok: true, recalc: recalcResults, scan: scanResults, totalDates });
}
