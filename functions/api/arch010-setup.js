// Cloudflare Pages Function — TEMPORAIRE arch-010
// Ajoute villamaryllis.com à Resend et retourne les DNS records à créer.
// À supprimer après utilisation.

export async function onRequestGet(context) {
  const { env } = context;
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return json({ error: "RESEND_API_KEY manquant" }, 503);

  const domain = "villamaryllis.com";

  // 1. Lister les domaines existants
  const listRes = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const listData = await listRes.json();
  const existing = listData.data?.find(d => d.name === domain);
  if (existing) {
    // 2a. Domaine déjà présent — retourner les records existants
    const detailRes = await fetch(`https://api.resend.com/domains/${existing.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const detail = await detailRes.json();
    return json({ action: "existing", domain: detail });
  }

  // 2b. Créer le domaine
  const createRes = await fetch("https://api.resend.com/domains", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: domain, region: "eu-west-1" }),
  });
  const createData = await createRes.json();
  return json({ action: "created", domain: createData, status: createRes.status });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
