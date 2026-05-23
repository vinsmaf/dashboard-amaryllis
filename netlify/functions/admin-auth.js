// Netlify Function — POST /api/admin-auth
// Vérifie le mot de passe admin côté serveur (jamais exposé dans le bundle JS).
// Retourne { ok: true, role: "admin" | "menage" } ou { ok: false } (401).

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function resp(data, statusCode = 200) {
  return { statusCode, headers: CORS, body: JSON.stringify(data) };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS };
  }
  if (event.httpMethod !== "POST") {
    return resp({ error: "Méthode non autorisée" }, 405);
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return resp({ error: "JSON invalide" }, 400); }

  const { password } = body;
  if (!password || typeof password !== "string") {
    return resp({ ok: false }, 401);
  }

  const adminPwd  = process.env.ADMIN_PWD;
  const menagePwd = process.env.ADMIN_PWD_MENAGE;

  if (!adminPwd) {
    return resp({ error: "ADMIN_PWD non configuré" }, 500);
  }

  if (password === adminPwd) {
    return resp({ ok: true, role: "admin" });
  }
  if (menagePwd && password === menagePwd) {
    return resp({ ok: true, role: "menage" });
  }

  return resp({ ok: false }, 401);
};
