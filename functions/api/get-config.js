// Cloudflare Pages Function — GET /api/get-config
// Retourne la configuration publique de l'admin (URLs non-secrètes).
// APPS_SCRIPT_URL est stocké comme secret Cloudflare Pages → jamais perdu.

export async function onRequestGet(context) {
  const { env } = context;
  const data = {
    ok: true,
    scriptUrl: env.APPS_SCRIPT_URL || "",
  };
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
