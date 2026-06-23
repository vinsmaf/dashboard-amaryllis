// ArticlePage.jsx — Template article SEO servi depuis D1 (/article/:slug)
import { useState, useEffect } from "react";
import NewsletterForm from "./NewsletterForm.jsx";
import EncartActivite from "./components/EncartActivite.jsx";
import LienAffilie from "./components/LienAffilie.jsx";
import { ACTIVITES } from "./data/activites.js";

const NAVY  = "#0e3b3a";
const CORAL = "#c47254";
const IVORY = "#faf5e9";
const MUTED = "#7a6b5a";

const CAT_LABELS = {
  logement:   "Logement",
  itineraires:"Itinéraires",
  activites:  "Activités",
  budget:     "Budget",
  pratique:   "Pratique",
  nogent:     "Nogent",
  general:    "Guide",
};

// Mapping slug/catégorie → biens recommandés
const BIENS = {
  amaryllis: { id: "amaryllis", nom: "Villa Amaryllis",    prix: 280, cap: "8 pers.", tag: "Piscine débordement vue mer",  photo: "/photos/amaryllis/01.webp" },
  zandoli:   { id: "zandoli",   nom: "Zandoli",            prix: 110, cap: "5 pers.", tag: "Terrasse vue mer",             photo: "/photos/zandoli/01.webp" },
  geko:      { id: "geko",      nom: "Géko",               prix: 110, cap: "4 pers.", tag: "Piscine privée",               photo: "/photos/geko/01.webp" },
  mabouya:   { id: "mabouya",   nom: "Mabouya",            prix:  70, cap: "2 pers.", tag: "Studio jacuzzi privatif",      photo: "/photos/mabouya/01.webp" },
  schoelcher:{ id: "schoelcher",nom: "Schœlcher",          prix:  90, cap: "—",       tag: "Vue mer Caraïbes",             photo: "/photos/schoelcher/01.webp" },
  nogent:    { id: "nogent",    nom: "Nogent-sur-Marne",   prix:  90, cap: "—",       tag: "Bord de Marne, Paris -15 min", photo: "/photos/nogent/01.webp" },
};

// Par slug → liste de biens à afficher
const SLUG_TO_BIENS = {
  "location-villa-martinique":          ["amaryllis", "zandoli", "geko"],
  "location-villa-sainte-luce":         ["amaryllis", "zandoli", "geko", "mabouya"],
  "villa-martinique-vue-mer":           ["amaryllis", "mabouya"],
  "location-vacances-martinique":       ["amaryllis", "zandoli", "geko", "mabouya"],
  "villa-martinique-8-personnes":       ["amaryllis"],
  "villa-martinique-piscine-debordement":["amaryllis"],
  "studio-jacuzzi-martinique":          ["mabouya"],
  "villa-sainte-luce-piscine":          ["amaryllis", "zandoli", "geko"],
  "reservation-directe-villa-martinique":["amaryllis","zandoli","geko","mabouya"],
  "location-villa-luxe-martinique":     ["amaryllis"],
  "villa-martinique-animaux-acceptes":  ["amaryllis", "zandoli"],
  "martinique-voyage-noces":            ["mabouya", "amaryllis"],
  "martinique-en-famille":              ["amaryllis", "zandoli"],
  "seminaire-martinique-entreprise":    ["amaryllis"],
  "location-appartement-nogent-sur-marne": ["nogent"],
  "appartement-bord-de-marne":          ["nogent"],
};

// Par catégorie → fallback si slug pas dans la map
const CAT_TO_BIENS = {
  logement:    ["amaryllis", "zandoli", "geko", "mabouya"],
  activites:   ["amaryllis", "zandoli"],
  itineraires: ["amaryllis", "zandoli"],
  pratique:    ["amaryllis", "mabouya"],
  nogent:      ["nogent"],
  general:     ["amaryllis", "zandoli"],
  budget:      ["mabouya", "geko"],
};

// ── Monétisation : encarts activités affiliées (Viator/GetYourGuide) ──────────
// Mapping slug spécifique → 2 activités pertinentes. Fallback par catégorie.
// Les articles Nogent (métropole) n'affichent AUCUNE activité Martinique.
const SLUG_TO_ACTIVITES = {
  "location-villa-martinique":          ["catamaran", "tortues"],
  "location-villa-sainte-luce":         ["snorkeling", "diamant-bateau"],
  "villa-martinique-vue-mer":           ["catamaran", "dauphins"],
  "location-vacances-martinique":       ["catamaran", "tortues"],
  "studio-jacuzzi-martinique":          ["tortues", "snorkeling"],
  "martinique-voyage-noces":            ["catamaran", "fonds-blancs"],
  "martinique-en-famille":              ["petit-train-banane", "tortues"],
  "location-villa-luxe-martinique":     ["plongee-cata-prive", "catamaran"],
  "seminaire-martinique-entreprise":    ["tour-prive-groupe", "catamaran"],
};
const CAT_TO_ACTIVITES = {
  logement:    ["catamaran", "snorkeling"],
  activites:   ["catamaran", "tortues"],
  itineraires: ["catamaran", "diamant-bateau"],
  general:     ["tortues", "snorkeling"],
  budget:      ["snorkeling", "petit-train-banane"],
  pratique:    ["catamaran", "tortues"],
};

// Articles à forte intention "location voiture" → encart affilié DiscoverCars.
const CAR_RENTAL_TERMS = ["voiture", "transport", "deplacer", "itineraire", "road"];

function activitesFor(slug, category) {
  if (category === "nogent") return [];
  const keys = SLUG_TO_ACTIVITES[slug] || CAT_TO_ACTIVITES[category] || [];
  return keys.map(k => ACTIVITES[k]).filter(Boolean);
}

function showsCarRental(slug, category) {
  if (category === "nogent") return false;
  return category === "pratique" || category === "itineraires"
    || CAR_RENTAL_TERMS.some(term => slug.includes(term));
}

function track(event, params) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try { window.gtag("event", event, params); } catch { /* */ }
  }
}

function BienCards({ slug, category }) {
  const ids = SLUG_TO_BIENS[slug] || CAT_TO_BIENS[category] || ["amaryllis", "zandoli"];
  const list = ids.map(id => BIENS[id]).filter(Boolean).slice(0, 3);
  if (!list.length) return null;
  return (
    <div style={{ maxWidth: 780, margin: "0 auto 48px", padding: "0 20px" }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, marginBottom: 6 }}>
        Réservez directement — sans frais de service
      </h2>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
        Jusqu'à 20% moins cher qu'Airbnb. Paiement sécurisé, contact direct avec l'hôte.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(list.length, 3)}, 1fr)`, gap: 14 }}>
        {list.map(b => (
          <a key={b.id} href={`/${b.id}`} style={{ textDecoration: "none" }}
            onClick={() => track("article_bien_click", { article_slug: slug, bien_id: b.id })}>
            <div style={{
              background: "#fff", borderRadius: 14, overflow: "hidden",
              border: "1px solid #e8e0d0", transition: "all .18s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.borderColor = CORAL; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = "#e8e0d0"; }}
            >
              <div style={{ height: 110, background: `url(${b.photo}) center/cover no-repeat, #d4c9b4` }} />
              <div style={{ padding: "14px 14px 16px" }}>
                <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>{b.tag}</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: "0 0 6px" }}>{b.nom}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: MUTED }}>{b.cap}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>{b.prix}€<span style={{ fontSize: 11, fontWeight: 400, color: MUTED }}>/nuit</span></span>
                </div>
                <div style={{
                  marginTop: 12, padding: "8px 0", background: CORAL, borderRadius: 8,
                  textAlign: "center", color: "#fff", fontSize: 12, fontWeight: 700,
                }}>
                  RÉSERVER →
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Encart affilié location voiture (DiscoverCars a_aid=vinsmaf)
function CarRentalBloc({ slug }) {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto 48px", padding: "0 20px" }}>
      <div style={{
        background: "linear-gradient(135deg,#0a2e2d 0%,#0e3b3a 60%,#163f3e 100%)",
        border: "1px solid rgba(196,114,84,0.3)", borderRadius: 18, padding: "26px 24px",
      }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: CORAL, margin: "0 0 10px", fontWeight: 600 }}>
          🚗 Se déplacer en Martinique
        </p>
        <h3 style={{ fontSize: 19, fontWeight: 800, color: IVORY, margin: "0 0 8px" }}>
          Louez votre voiture au meilleur prix
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(250,245,233,0.75)", margin: "0 0 16px" }}>
          La voiture est indispensable dans le Sud. Comparez tous les loueurs de l'aéroport
          Aimé Césaire en une recherche — réserver à l'avance coûte 20–30 % moins cher que sur place.
        </p>
        <LienAffilie partenaire="discoverCars" utmContent={`article-${slug}`} />
      </div>
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px" }}>
      {[80, 40, 100, 60, 100, 80, 60].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 36 : 16,
          width: `${w}%`,
          background: "#e8e0d0",
          borderRadius: 8,
          marginBottom: i === 0 ? 20 : 12,
          animation: "pulse 1.4s ease-in-out infinite",
        }} />
      ))}
    </div>
  );
}

export default function ArticlePage() {
  const slug = window.location.pathname.replace(/^\/article\//, "").replace(/\/$/, "");
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    fetch(`/api/articles?slug=${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setArticle(data || null);
        setLoading(false);
        if (data?.status === "published") {
          track("article_view", { article_slug: slug, article_category: data.category || "general" });
        }
        if (data?.category) {
          fetch(`/api/articles?category=${data.category}`)
            .then(r => r.json())
            .then(d => setRelated((d.articles || []).filter(a => a.slug !== slug).slice(0, 4)))
            .catch(() => {});
        }
      })
      .catch(() => { setLoading(false); });
  }, [slug]);

  if (loading) return (
    <div style={{ background: IVORY, minHeight: "100vh" }}>
      <ArticleSkeleton />
    </div>
  );

  if (!article || article.status !== "published") return (
    <div style={{ background: IVORY, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🌴</div>
        <h1 style={{ fontSize: 24, color: NAVY, marginBottom: 12 }}>Article introuvable</h1>
        <p style={{ color: MUTED, marginBottom: 24 }}>Ce contenu n'est pas disponible.</p>
        <a href="/explorer" style={{ color: CORAL, fontWeight: 700, textDecoration: "none" }}>← Voir tous les guides</a>
      </div>
    </div>
  );

  const cat = CAT_LABELS[article.category] || "Guide";
  const readTime = Math.max(1, Math.ceil((article.content_html || "").replace(/<[^>]+>/g, "").split(/\s+/).length / 200));
  const activites = activitesFor(slug, article.category);
  const carRental = showsCarRental(slug, article.category);

  return (
    <div style={{ background: IVORY, minHeight: "100vh", fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .article-content h2 { font-size: 22px; font-weight: 800; color: ${NAVY}; margin: 36px 0 14px; }
        .article-content h3 { font-size: 18px; font-weight: 700; color: ${NAVY}; margin: 28px 0 10px; }
        .article-content p  { font-size: 16px; line-height: 1.8; color: #3a2e22; margin: 0 0 18px; }
        .article-content ul, .article-content ol { padding-left: 22px; margin: 0 0 18px; }
        .article-content li { font-size: 16px; line-height: 1.7; color: #3a2e22; margin-bottom: 6px; }
        .article-content a  { color: ${CORAL}; text-decoration: underline; }
        .article-content strong { font-weight: 700; }
        .article-content blockquote { border-left: 3px solid ${CORAL}; margin: 24px 0; padding: 12px 20px; background: #f4ece0; border-radius: 0 8px 8px 0; font-style: italic; color: ${MUTED}; }
        .article-content img { max-width: 100%; border-radius: 12px; margin: 24px 0; }
        .related-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.10); }
      `}</style>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(160deg, ${NAVY} 0%, #1a5554 100%)`,
        padding: "56px 20px 48px",
        textAlign: "center",
      }}>
        <a href="/articles" style={{ color: "rgba(250,245,233,0.6)", fontSize: 13, textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          ← Tous les articles
        </a>
        <div style={{ marginTop: 20, marginBottom: 14 }}>
          <span style={{
            background: CORAL, color: "#fff", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 20,
          }}>{cat}</span>
        </div>
        <h1 style={{ fontSize: "clamp(24px, 5vw, 38px)", fontWeight: 900, color: IVORY, lineHeight: 1.2, maxWidth: 720, margin: "0 auto 16px" }}>
          {article.title}
        </h1>
        {article.meta_desc && (
          <p style={{ color: "rgba(250,245,233,0.75)", fontSize: 16, maxWidth: 600, margin: "0 auto 20px", lineHeight: 1.6 }}>
            {article.meta_desc}
          </p>
        )}
        <p style={{ color: "rgba(250,245,233,0.45)", fontSize: 12, letterSpacing: "0.05em" }}>
          {readTime} min de lecture · Amaryllis Locations
        </p>
      </div>

      {/* Image hero */}
      {article.image_url && (
        <div style={{ maxWidth: 900, margin: "-24px auto 0", padding: "0 20px" }}>
          <img src={article.image_url} alt={article.title}
            style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }} />
        </div>
      )}

      {/* Contenu */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px 20px" }}>
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.content_html }}
        />
      </div>

      {/* Cartes biens — maillage interne vers réservation */}
      <BienCards slug={slug} category={article.category} />

      {/* Encart activités affiliées (Viator/GetYourGuide) — monétisation trafic SEO */}
      {activites.length > 0 && (
        <div style={{ maxWidth: 780, margin: "0 auto 48px", padding: "0 20px" }}>
          <EncartActivite activites={activites} platform="viator" variant="navy" />
        </div>
      )}

      {/* Encart location voiture (DiscoverCars) — articles transport/itinéraire */}
      {carRental && <CarRentalBloc slug={slug} />}

      {/* Articles liés */}
      {related.length > 0 && (
        <div style={{ maxWidth: 900, margin: "0 auto 48px", padding: "0 20px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20 }}>À lire aussi</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
            {related.map(r => (
              <a key={r.slug} href={`/article/${r.slug}`} style={{ textDecoration: "none" }}>
                <div className="related-card" style={{
                  background: "#fff", borderRadius: 12, padding: "18px 16px",
                  transition: "all 0.2s", border: "1px solid #e8e0d0",
                }}>
                  <span style={{ fontSize: 10, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {CAT_LABELS[r.category] || r.category}
                  </span>
                  <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginTop: 6, lineHeight: 1.4 }}>{r.title}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter */}
      <div style={{ maxWidth: 780, margin: "0 auto 60px", padding: "0 20px" }}>
        <NewsletterForm source={`article-${slug}`} />
      </div>

      {/* Footer minimal */}
      <div style={{ borderTop: "1px solid #e0d4bc", padding: "20px", textAlign: "center" }}>
        <a href="/" style={{ color: NAVY, fontSize: 13, textDecoration: "none", fontWeight: 600 }}>villamaryllis.com</a>
        <span style={{ color: MUTED, fontSize: 13, margin: "0 12px" }}>·</span>
        <a href="/articles" style={{ color: MUTED, fontSize: 13, textDecoration: "none" }}>Tous les articles</a>
        <span style={{ color: MUTED, fontSize: 13, margin: "0 12px" }}>·</span>
        <a href="/explorer" style={{ color: MUTED, fontSize: 13, textDecoration: "none" }}>Explorer la Martinique</a>
      </div>
    </div>
  );
}
