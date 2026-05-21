// Page /avis — Tous les avis clients, organisés par villa

const NAVY  = "#07122a";
const CORAL = "#c8553d";
const IVORY = "#faf5e9";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6e5f";
const GOLD  = "#f5a623";

const BIENS_AVIS = [
  {
    id: "amaryllis",
    nom: "Villa Amaryllis",
    lieu: "Sainte-Luce, Martinique",
    rating: 4.95,
    reviews: 33,
    photo: "/photos/amaryllis/01.webp",
    amenities: ["Piscine à débordement", "Jacuzzi privé", "Vue océan"],
    avis: [
      { nom: "Sophie M.",      pays: "🇫🇷", note: 5, texte: "Vue extraordinaire, piscine à débordement parfaite et hôte très réactif. Un endroit hors du temps face aux Caraïbes. On reviendra sans hésiter !", date: "Avr. 2025" },
      { nom: "James K.",       pays: "🇬🇧", note: 5, texte: "Stunning villa with incredible Caribbean views. The salt water infinity pool and private jacuzzi are exceptional. Best Airbnb we've ever stayed in — period.", date: "Mars 2025" },
      { nom: "Marie-Claire D.",pays: "🇫🇷", note: 5, texte: "Séjour magique en famille. La terrasse de 100m² face à la mer est un rêve éveillé. Tout était impeccable, de l'accueil aux moindres détails de décoration.", date: "Fév. 2025" },
    ],
  },
  {
    id: "zandoli",
    nom: "Zandoli",
    lieu: "Sainte-Luce, Martinique",
    rating: 4.90,
    reviews: 16,
    photo: "/photos/zandoli/01.webp",
    amenities: ["Piscine privée", "Vue mer", "Jardin tropical"],
    avis: [
      { nom: "Lucie B.",      pays: "🇫🇷", note: 5, texte: "Cocon parfait ! La mezzanine est charmante, la piscine délicieuse, et la vue sur la mer au réveil est inoubliable. Hôte très disponible.", date: "Avr. 2025" },
      { nom: "Thomas & Ana",  pays: "🇩🇪", note: 5, texte: "Wunderbar! Tropical garden, private pool, sea view — everything we dreamed of. Very clean and well-equipped. We'll be back next winter.", date: "Janv. 2025" },
      { nom: "Camille R.",    pays: "🇫🇷", note: 4, texte: "Très bel appartement, bien équipé et bien situé. La mezzanine est idéale pour les enfants. Netflix et lave-linge ont été très appréciés.", date: "Déc. 2024" },
    ],
  },
  {
    id: "iguana",
    nom: "Villa Iguana",
    lieu: "Sainte-Luce, Martinique",
    rating: 4.88,
    reviews: 4,
    photo: "/photos/iguana/01.webp",
    amenities: ["Piscine eau salée", "Vue Diamant", "Vue océan"],
    avis: [
      { nom: "Pierre & Claire",pays: "🇫🇷", note: 5, texte: "Vue imprenable sur le rocher du Diamant ! La piscine d'eau salée est un vrai plus. Villa propre, bien équipée, accueil aux petits soins.", date: "Avr. 2025" },
      { nom: "Rachel T.",      pays: "🇬🇧", note: 5, texte: "What a view! Waking up to see the Diamond Rock every morning was magical. The saltwater pool felt like swimming in the sea itself. Perfect.", date: "Mars 2025" },
      { nom: "Laurent D.",     pays: "🇫🇷", note: 5, texte: "Superbe villa avec une vue panoramique exceptionnelle. Très calme, très propre. La terrasse est parfaite pour les levers de soleil. Je recommande vivement.", date: "Fév. 2025" },
    ],
  },
  {
    id: "geko",
    nom: "Géko",
    lieu: "Sainte-Luce, Martinique",
    rating: 4.92,
    reviews: 23,
    photo: "/photos/geko/01.webp",
    amenities: ["Piscine privée", "Jardin tropical"],
    avis: [
      { nom: "Sandrine L.", pays: "🇫🇷", note: 5, texte: "Un vrai cocon dans un jardin tropical magnifique. La piscine est bien entretenue et la brise des alizés rend la clim presque superflue. On adore !", date: "Mai 2025" },
      { nom: "Marco F.",    pays: "🇮🇹", note: 5, texte: "Piccolo paradiso caraibico! Il giardino tropicale è stupendo, la piscina fresca e pulita. Posizione tranquilla a pochi minuti dalla spiaggia. Torneremo!", date: "Avr. 2025" },
      { nom: "Nathalie C.", pays: "🇫🇷", note: 5, texte: "Refuge parfait pour se ressourcer. Jardin luxuriant, piscine fraîche, tout était propre et bien équipé. L'hôte répond très rapidement. Parfait !", date: "Mars 2025" },
    ],
  },
  {
    id: "mabouya",
    nom: "Studio Mabouya",
    lieu: "Sainte-Luce, Martinique",
    rating: 4.85,
    reviews: 11,
    photo: "/photos/mabouya/01.webp",
    amenities: ["Jacuzzi privatif", "Vue mer", "Jardin fleuri"],
    avis: [
      { nom: "Élise & Romain",pays: "🇫🇷", note: 5, texte: "Weekend romantique parfait ! Le jacuzzi privatif sous les étoiles avec vue mer est juste magique. Jardin fleuri superbe, endroit très paisible.", date: "Avr. 2025" },
      { nom: "Sarah W.",      pays: "🇺🇸", note: 5, texte: "Hidden gem! The private jacuzzi with ocean views made every evening unforgettable. The flowering garden is gorgeous. Perfect romantic escape.", date: "Mars 2025" },
      { nom: "Jean-Paul M.",  pays: "🇫🇷", note: 4, texte: "Très beau logement avec un jacuzzi privatif et une vue mer agréable. Jardin entretenu, hôte sympathique. Idéal pour un séjour en couple.", date: "Fév. 2025" },
    ],
  },
  {
    id: "schoelcher",
    nom: "Bellevue",
    lieu: "Schœlcher, Martinique",
    rating: 4.93,
    reviews: 30,
    photo: "/photos/schoelcher/01.webp",
    amenities: ["Vue baie", "Terrasse", "Dernière étage"],
    avis: [
      { nom: "Isabelle T.", pays: "🇫🇷", note: 5, texte: "Appartement très bien situé avec une vue splendide sur la baie de Fort-de-France. Calme, propre, bien équipé. Idéal pour explorer le nord de la Martinique.", date: "Avr. 2025" },
      { nom: "Dirk H.",     pays: "🇳🇱", note: 5, texte: "Amazing view over the bay! The apartment is quiet, clean and has everything you need. Great location to explore the north of Martinique. Highly recommended.", date: "Mars 2025" },
      { nom: "Monique R.",  pays: "🇫🇷", note: 5, texte: "Logement de standing avec une vue exceptionnelle. Hôte très accueillant et réactif. La terrasse face à la baie est un vrai bonheur le matin.", date: "Fév. 2025" },
    ],
  },
  {
    id: "nogent",
    nom: "Nogent-sur-Marne",
    lieu: "Nogent-sur-Marne, Île-de-France",
    rating: 4.95,
    reviews: null,
    photo: "/photos/nogent/01.webp",
    amenities: ["Bord Marne", "Jardin", "RER A"],
    avis: [
      { nom: "Aurélie F.", pays: "🇫🇷", note: 5, texte: "Appartement lumineux et très bien décoré au bord de la Marne. Calme absolu tout en étant à 20 min de Paris. Le jardin est charmant. Parfait pour se ressourcer.", date: "Avr. 2025" },
      { nom: "Oliver M.",  pays: "🇬🇧", note: 5, texte: "Lovely flat with a garden right by the river. Peaceful, well-decorated and only 20 minutes from central Paris. The host was very welcoming and helpful.", date: "Mars 2025" },
    ],
  },
];

function Stars({ note, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= note ? GOLD : "#ddd", lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

export default function Avis() {
  const totalAvis = BIENS_AVIS.reduce((s, b) => s + (b.reviews || b.avis.length), 0);
  const avgRating = (BIENS_AVIS.reduce((s, b) => s + b.rating, 0) / BIENS_AVIS.length).toFixed(1);

  return (
    <div style={{ minHeight: "100vh", background: IVORY, color: NAVY, fontFamily: "'Jost', system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: NAVY, borderBottom: "1px solid rgba(250,245,233,0.07)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <img src="/favicon.svg" alt="Amaryllis" style={{ width: 32, height: 32 }} />
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 15, letterSpacing: "0.2em", textTransform: "uppercase", color: IVORY }}>
              Amaryllis
            </span>
          </a>
          <a href="/" style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12,
            color: "rgba(250,245,233,0.6)", textDecoration: "none",
            border: "1px solid rgba(250,245,233,0.15)", borderRadius: 20, padding: "6px 16px",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = IVORY; e.currentTarget.style.borderColor = "rgba(250,245,233,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(250,245,233,0.6)"; e.currentTarget.style.borderColor = "rgba(250,245,233,0.15)"; }}
          >
            ← Nos logements
          </a>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px 80px" }}>

        {/* ── HERO ── */}
        <div style={{ marginBottom: 64, textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 16 }}>
            Avis vérifiés Airbnb &amp; Booking.com
          </div>
          <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 5vw, 48px)", letterSpacing: "0.14em", textTransform: "uppercase", color: NAVY, margin: "0 0 24px" }}>
            Ce que disent nos hôtes
          </h1>

          {/* Global score */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 20, background: CREAM, border: `1px solid ${SAND}`, borderRadius: 16, padding: "20px 32px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 48, color: NAVY, lineHeight: 1 }}>{avgRating}</div>
              <Stars note={5} size={16} />
              <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>Note moyenne</div>
            </div>
            <div style={{ width: 1, height: 56, background: SAND }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 48, color: NAVY, lineHeight: 1 }}>{totalAvis}+</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>Avis vérifiés</div>
            </div>
            <div style={{ width: 1, height: 56, background: SAND }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 48, color: NAVY, lineHeight: 1 }}>7</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>Logements</div>
            </div>
          </div>
        </div>

        {/* ── PAR VILLA ── */}
        {BIENS_AVIS.map(bien => (
          <section key={bien.id} style={{ marginBottom: 72 }}>
            {/* Villa header */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
              <img
                src={bien.photo}
                alt={bien.nom}
                loading="lazy"
                style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", border: `1px solid ${SAND}`, flexShrink: 0 }}
                onError={e => { e.currentTarget.style.display = "none"; }}
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, marginBottom: 4 }}>
                  {bien.nom}
                </div>
                <div style={{ fontSize: 12, color: CORAL, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6 }}>
                  {bien.lieu}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Stars note={Math.round(bien.rating)} size={13} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{bien.rating}</span>
                  {bien.reviews && <span style={{ fontSize: 12, color: MUTED }}>· {bien.reviews} avis</span>}
                  <span style={{ fontSize: 11, color: MUTED }}>·</span>
                  {bien.amenities.map(a => (
                    <span key={a} style={{ fontSize: 11, color: MUTED, background: CREAM, border: `1px solid ${SAND}`, borderRadius: 5, padding: "2px 7px" }}>{a}</span>
                  ))}
                </div>
              </div>
              <a href={`/${bien.id}`} style={{
                fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 600,
                color: CORAL, textDecoration: "none",
                border: `1px solid ${CORAL}`, borderRadius: 20, padding: "8px 18px",
                transition: "background 0.2s, color 0.2s", flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = CORAL; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = CORAL; }}
              >
                Voir le logement →
              </a>
            </div>

            {/* Avis grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {bien.avis.map((r, i) => (
                <div key={i} style={{
                  background: "#fff", border: `1px solid ${SAND}`,
                  borderRadius: 14, padding: "22px 22px 20px",
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: NAVY, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: IVORY, fontSize: 16, fontWeight: 600 }}>{r.nom[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>
                        {r.pays} {r.nom}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <Stars note={r.note} size={11} />
                        <span style={{ fontSize: 11, color: MUTED }}>{r.date}</span>
                      </div>
                    </div>
                  </div>
                  {/* Quote */}
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                    fontSize: 14, color: MUTED, lineHeight: 1.65, margin: 0, flex: 1,
                  }}>
                    &ldquo;{r.texte}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* ── CTA ── */}
        <div style={{ textAlign: "center", paddingTop: 20, borderTop: `1px solid ${SAND}` }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 16, color: MUTED, marginBottom: 24 }}>
            Rejoignez nos hôtes satisfaits et réservez directement — sans frais de service Airbnb.
          </p>
          <a href="/" style={{
            display: "inline-block",
            background: CORAL, color: "#fff",
            fontFamily: "'Jost', sans-serif", fontWeight: 700, fontSize: 13,
            letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none",
            padding: "14px 36px", borderRadius: 30,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Voir nos logements
          </a>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: NAVY, padding: "24px 24px", textAlign: "center" }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: "rgba(250,245,233,0.4)", letterSpacing: "0.05em" }}>
          © 2025 Amaryllis · villamaryllis.com · Tous droits réservés
        </span>
      </div>
    </div>
  );
}
