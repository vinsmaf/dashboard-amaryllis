// Cloudflare Pages Function — GET /api/geo
// Retourne le pays et la ville du visiteur via les headers Cloudflare.
// Utilisé côté client pour auto-détecter la langue et personnaliser l'affichage.

// Pays francophones — on garde FR par défaut
const FRANCOPHONE = new Set([
  "FR","BE","CH","CA","LU","MC","MA","TN","DZ","SN","CI","CM","MQ","GP",
  "GY","BL","MF","RE","PM","WF","PF","NC","YT","MU","SC","DJ","KM","BJ",
  "BF","CD","CG","CF","GA","GN","GQ","HT","ML","MR","NE","RW","TD","TG",
]);

// Pays caribéens proches — contenu spécial "voisin"
const CARIBBEAN = new Set(["MQ","GP","GY","BL","MF","LC","BB","DM","VC","AG","KN","TT"]);

export async function onRequestGet(context) {
  const { request } = context;
  const h = request.headers;

  const country = h.get("CF-IPCountry") || "XX";
  const city    = h.get("CF-IPCity")    || null;
  const region  = h.get("CF-IPRegion")  || null;

  // Langue suggérée selon pays
  const suggestedLang = FRANCOPHONE.has(country) ? "fr" : "en";

  // Contexte géo pour personnalisation
  const isCaribbean     = CARIBBEAN.has(country);
  const isFranceMainland = country === "FR";
  // Île-de-France: régions Cloudflare non fiables — on heuristique sur la ville
  const IDF_CITIES = ["Paris","Versailles","Boulogne","Vincennes","Créteil","Bobigny",
    "Nanterre","Évry","Cergy","Saint-Denis","Montreuil","Argenteuil","Vitry",
    "Colombes","Asnières","Courbevoie","Nanterre","Levallois","Nogent","Roissy"];
  const isIDF = isFranceMainland && city && IDF_CITIES.some(c => city.includes(c));

  return new Response(JSON.stringify({
    country, city, region,
    suggestedLang,
    isCaribbean,
    isFranceMainland,
    isIDF,
  }), {
    headers: {
      "Content-Type":                "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control":               "no-store", // personnalisé par IP, ne jamais cacher
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
