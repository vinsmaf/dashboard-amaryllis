/**
 * /depart-tardif?bien=amaryllis — page publique autonome (Pages Function, PAS le
 * routing React) pour vendre un départ tardif à un voyageur en cours de séjour.
 *
 * Pourquoi une Function et pas la page /services/<bien> : le routing SPA de /services/
 * est cassé en prod (affiche l'accueil). Ici la page est rendue côté serveur, aucune
 * dépendance au bundle React → marche à coup sûr, immédiat.
 *
 * Le bouton paie via /api/service-checkout (serviceId "late-early") : le prix est
 * revalidé serveur depuis le catalogue du livret (source unique), jamais codé en dur.
 */

const NAMES = {
  amaryllis: "Villa Amaryllis",
  zandoli: "Zandoli",
  iguana: "Villa Iguana",
  geko: "Géko",
  mabouya: "Studio Mabouya",
  schoelcher: "Bellevue Schœlcher",
  nogent: "Appartement Nogent",
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const bien = (url.searchParams.get("bien") || "amaryllis").toLowerCase();
  const nom = NAMES[bien] || "votre logement";

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Départ tardif — ${esc(nom)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=Cormorant+Garamond:ital@0;1&display=swap');
  :root{--navy:#0e3b3a;--coral:#c47254;--gold:#c9a673;--ivory:#faf5e9;--sand:#e0d4bc;--text:#3a3530;--muted:#7a6b5a}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--ivory);color:var(--text);font-family:'Jost',system-ui,sans-serif;min-height:100vh}
  header{background:var(--navy);color:var(--ivory);padding:18px 22px;display:flex;align-items:center;justify-content:space-between}
  header .logo{letter-spacing:.15em;text-transform:uppercase;font-size:16px;font-weight:300;color:var(--ivory);text-decoration:none}
  header .nom{font-size:12px;opacity:.7}
  main{max-width:520px;margin:0 auto;padding:32px 20px 60px}
  .eyebrow{font-size:11px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--coral);margin-bottom:10px}
  h1{font-weight:300;font-size:30px;color:var(--navy);line-height:1.15;margin-bottom:18px}
  .card{background:#fff;border:1px solid var(--sand);border-radius:16px;padding:22px 22px;box-shadow:0 2px 12px rgba(14,59,58,.05);margin-bottom:22px}
  .row{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:10px}
  .row h2{font-weight:600;font-size:18px;color:var(--navy)}
  .price{font-weight:600;font-size:26px;color:var(--navy);white-space:nowrap}
  .desc{font-family:'Cormorant Garamond',serif;font-size:17px;line-height:1.45;color:var(--text);margin-top:4px}
  button{width:100%;background:var(--coral);color:#fff;border:none;border-radius:12px;padding:16px;font-size:15px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;font-family:inherit;margin-top:18px}
  button:disabled{background:#9c5640;cursor:default}
  .err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:14px;display:none}
  .foot{font-size:12px;color:var(--muted);text-align:center;margin-top:24px;line-height:1.5}
</style>
</head>
<body>
<header>
  <a class="logo" href="/${esc(bien)}">Amaryllis</a>
  <span class="nom">${esc(nom)}</span>
</header>
<main>
  <p class="eyebrow">Pendant votre séjour</p>
  <h1>Départ tardif</h1>
  <div id="err" class="err"></div>
  <div class="card">
    <div class="row">
      <h2>Libérez la villa jusqu'à 19h</h2>
      <div class="price">80&nbsp;€</div>
    </div>
    <p class="desc">Profitez de votre dernière journée sans contrainte : au lieu du départ en matinée, gardez le logement jusqu'à 19h. Idéal quand votre vol est en soirée.</p>
    <button id="pay" type="button">Payer 80&nbsp;€</button>
  </div>
  <p class="foot">Paiement sécurisé par carte (Stripe). Une question&nbsp;? <a href="/${esc(bien)}" style="color:var(--coral)">Contactez-nous</a>.</p>
</main>
<script>
  var bien = ${JSON.stringify(bien)};
  var btn = document.getElementById('pay');
  var err = document.getElementById('err');
  btn.addEventListener('click', function () {
    err.style.display = 'none';
    btn.disabled = true; btn.textContent = 'Redirection vers le paiement…';
    fetch('/api/service-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bien: bien, serviceId: 'late-early' })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok && d.url) { window.location.assign(d.url); return; }
      throw new Error(d && d.error ? d.error : 'Paiement indisponible');
    }).catch(function (e) {
      err.textContent = e.message || 'Connexion impossible. Réessayez.';
      err.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Payer 80\\u00A0€';
    });
  });
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
  });
}
