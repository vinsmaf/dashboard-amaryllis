// ArticlesIndex.jsx — Page publique listant tous les articles SEO (/articles)
import { useState, useEffect } from "react";

const NAVY  = "#0e3b3a";
const CORAL = "#c47254";
const IVORY = "#faf5e9";
const MUTED = "#7a6b5a";

const CATS = [
  { id: "all",        label: "Tous" },
  { id: "logement",   label: "Logement" },
  { id: "activites",  label: "Activités" },
  { id: "itineraires",label: "Itinéraires" },
  { id: "pratique",   label: "Pratique" },
  { id: "nogent",     label: "Nogent" },
  { id: "general",    label: "Guides" },
];

const CAT_ICONS = {
  logement:    "🏠",
  activites:   "🤿",
  itineraires: "🗺️",
  pratique:    "💡",
  nogent:      "🌊",
  general:     "📖",
  budget:      "💶",
};

export default function ArticlesIndex() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cat, setCat]           = useState("all");

  useEffect(() => {
    fetch("/api/articles")
      .then(r => r.json())
      .then(d => { setArticles(d.articles || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = cat === "all" ? articles : articles.filter(a => a.category === cat);

  return (
    <div style={{ background: IVORY, minHeight: "100vh", fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        .art-card { background:#fff; border-radius:14px; padding:22px 20px; border:1px solid #e8e0d0; transition:all .18s; text-decoration:none; display:block; }
        .art-card:hover { transform:translateY(-3px); box-shadow:0 10px 32px rgba(0,0,0,0.09); border-color:#c47254; }
        .filter-btn { border:1.5px solid #d4c9b4; border-radius:24px; padding:7px 18px; font-size:13px; font-weight:600; cursor:pointer; background:#fff; color:${MUTED}; transition:all .15s; font-family:'Jost',sans-serif; }
        .filter-btn.active { background:${NAVY}; color:#fff; border-color:${NAVY}; }
        .filter-btn:hover:not(.active) { border-color:${NAVY}; color:${NAVY}; }
      `}</style>

      {/* Hero */}
      <div style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #1a5554 100%)`, padding: "56px 20px 48px", textAlign: "center" }}>
        <a href="/" style={{ color: "rgba(250,245,233,0.6)", fontSize: 13, textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          ← Accueil Amaryllis Locations
        </a>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 900, color: IVORY, margin: "20px auto 14px", maxWidth: 700, lineHeight: 1.2 }}>
          Guides & Conseils Martinique
        </h1>
        <p style={{ color: "rgba(250,245,233,0.72)", fontSize: 16, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
          Tout ce qu'il faut savoir pour préparer votre séjour en Martinique ou à Nogent-sur-Marne.
        </p>
        <p style={{ color: "rgba(250,245,233,0.45)", fontSize: 13, marginTop: 14 }}>
          {articles.length} articles · Amaryllis Locations
        </p>
      </div>

      {/* Filtres */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px 0" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {CATS.map(c => (
            <button key={c.id} className={`filter-btn${cat === c.id ? " active" : ""}`} onClick={() => setCat(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 60px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ height: 160, background: "#e8e0d0", borderRadius: 14, animation: "pulse 1.4s infinite" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ color: MUTED, textAlign: "center", padding: "60px 0" }}>Aucun article dans cette catégorie.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {filtered.map(a => (
              <a key={a.slug} href={`/article/${a.slug}`} className="art-card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{CAT_ICONS[a.category] || "📖"}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: CORAL, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {CATS.find(c => c.id === a.category)?.label || a.category}
                  </span>
                </div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: NAVY, lineHeight: 1.4, margin: "0 0 10px" }}>
                  {a.title}
                </h2>
                {a.meta_desc && (
                  <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, margin: 0,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {a.meta_desc}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer minimal */}
      <div style={{ borderTop: "1px solid #e0d4bc", padding: "20px", textAlign: "center" }}>
        <a href="/" style={{ color: NAVY, fontSize: 13, textDecoration: "none", fontWeight: 600 }}>villamaryllis.com</a>
        <span style={{ color: MUTED, fontSize: 13, margin: "0 12px" }}>·</span>
        <a href="/explorer" style={{ color: MUTED, fontSize: 13, textDecoration: "none" }}>Explorer la Martinique</a>
      </div>
    </div>
  );
}
