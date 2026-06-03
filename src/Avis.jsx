// Page /avis — Avis clients · Design system Amaryllis
import { useState, useEffect } from "react";
import { Eyebrow, Display, Editorial, Button, RatingBadge } from "./primitives.jsx";
import SEOMeta from "./SEOMeta.jsx";

/* ── Données ─────────────────────────────────────────────────────── */
const BIENS_AVIS = [
  {
    id: "amaryllis",
    nom: "Villa Amaryllis",
    lieu: "Sainte-Luce, Martinique",
    rating: "4,94",
    reviews: 33,
    photo: "/photos/amaryllis/01.webp",
    amenities: ["Piscine à débordement", "Terrasse 100 m²", "Vue océan"],
    avis: [
      { nom: "Sophie M.",       pays: "🇫🇷", note: 5, texte: "Vue extraordinaire, piscine à débordement parfaite et hôte très réactif. Un endroit hors du temps face aux Caraïbes. On reviendra sans hésiter !", date: "Avr. 2025" },
      { nom: "James K.",        pays: "🇬🇧", note: 5, texte: "Stunning villa with incredible Caribbean views. The salt water infinity pool is exceptional. Best Airbnb we've ever stayed in — period.", date: "Mars 2025" },
      { nom: "Marie-Claire D.", pays: "🇫🇷", note: 5, texte: "Séjour magique en famille. La terrasse de 100m² face à la mer est un rêve éveillé. Tout était impeccable, de l'accueil aux moindres détails de décoration.", date: "Fév. 2025" },
      { nom: "Céline & Marc",   pays: "🇫🇷", note: 5, texte: "Nous sommes restés 10 nuits et chaque matin au réveil, la vue sur la Caraïbe nous émerveillait. Le carbet, le barbecue, la piscine lagon… tout était parfait.", date: "Jan. 2025" },
      { nom: "Nina S.",         pays: "🇩🇪", note: 5, texte: "Absolut traumhaft! Die Villa übertrifft alle Erwartungen — Infinity-Pool, atemberaubender Meerblick, perfekte Ausstattung. Der Gastgeber war stets erreichbar.", date: "Déc. 2024" },
      { nom: "Fabrice L.",      pays: "🇫🇷", note: 5, texte: "La villa est encore plus belle qu'en photos. Accueil chaleureux, logement impeccable, et cette piscine à débordement… On a passé les meilleures vacances de notre vie.", date: "Nov. 2024" },
    ],
  },
  {
    id: "zandoli",
    nom: "Zandoli",
    lieu: "Sainte-Luce, Martinique",
    rating: "4,5",
    reviews: 16,
    photo: "/photos/zandoli/01.webp",
    amenities: ["Piscine privée", "Vue mer", "Jardin tropical"],
    avis: [
      { nom: "Lucie B.",       pays: "🇫🇷", note: 5, texte: "Cocon parfait ! La mezzanine est charmante, la piscine délicieuse, et la vue sur la mer au réveil est inoubliable. Hôte très disponible.", date: "Avr. 2025" },
      { nom: "Thomas & Ana",   pays: "🇩🇪", note: 5, texte: "Wunderbar! Tropical garden, private pool, sea view — everything we dreamed of. Very clean and well-equipped. We'll be back next winter.", date: "Janv. 2025" },
      { nom: "Camille R.",     pays: "🇫🇷", note: 4, texte: "Très bel appartement, bien équipé et bien situé. La mezzanine est idéale pour les enfants. Netflix et lave-linge ont été très appréciés.", date: "Déc. 2024" },
      { nom: "David & Julie",  pays: "🇫🇷", note: 5, texte: "Un logement original et très bien pensé. Le jardin tropical est magnifique, la piscine très agréable. Idéal pour un séjour en famille ou en couple.", date: "Nov. 2024" },
      { nom: "Sven O.",        pays: "🇸🇪", note: 5, texte: "Beautiful place with a lush tropical garden and a private pool. The sea view from the terrace is breathtaking. Great value for money. Highly recommended!", date: "Oct. 2024" },
      { nom: "Martine G.",     pays: "🇫🇷", note: 4, texte: "Logement charmant avec une belle vue mer. Quelques détails à peaufiner mais rien de rédhibitoire. Hôte très réactif. On reviendrait volontiers.", date: "Sept. 2024" },
    ],
  },
  {
    id: "iguana",
    nom: "Villa Iguana",
    lieu: "Sainte-Luce, Martinique",
    rating: "4,75",
    reviews: 4,
    photo: "/photos/iguana/01.webp",
    amenities: ["Piscine eau salée", "Vue Diamant", "Vue océan"],
    avis: [
      { nom: "Pierre & Claire", pays: "🇫🇷", note: 5, texte: "Vue imprenable sur le rocher du Diamant ! La piscine d'eau salée est un vrai plus. Villa propre, bien équipée, accueil aux petits soins.", date: "Avr. 2025" },
      { nom: "Rachel T.",       pays: "🇬🇧", note: 5, texte: "What a view! Waking up to see the Diamond Rock every morning was magical. The saltwater pool felt like swimming in the sea itself. Perfect.", date: "Mars 2025" },
      { nom: "Laurent D.",      pays: "🇫🇷", note: 5, texte: "Superbe villa avec une vue panoramique exceptionnelle. Très calme, très propre. La terrasse est parfaite pour les levers de soleil. Je recommande vivement.", date: "Fév. 2025" },
      { nom: "Amelia C.",       pays: "🇧🇪", note: 4, texte: "Villa très agréable, bien équipée. La piscine à eau salée est originale et rafraîchissante. Le rocher du Diamant en toile de fond — magnifique.", date: "Jan. 2025" },
    ],
  },
  {
    id: "geko",
    nom: "Géko",
    lieu: "Sainte-Luce, Martinique",
    rating: "4,83",
    reviews: 24,
    photo: "/photos/geko/01.webp",
    amenities: ["Piscine privée", "Jardin tropical"],
    avis: [
      { nom: "Sandrine L.",    pays: "🇫🇷", note: 5, texte: "Un vrai cocon dans un jardin tropical magnifique. La piscine est bien entretenue et la brise des alizés rend la clim presque superflue. On adore !", date: "Mai 2025" },
      { nom: "Marco F.",       pays: "🇮🇹", note: 5, texte: "Piccolo paradiso caraibico! Il giardino tropicale è stupendo, la piscina fresca e pulita. Posizione tranquilla a pochi minuti dalla spiaggia. Torneremo!", date: "Avr. 2025" },
      { nom: "Nathalie C.",    pays: "🇫🇷", note: 5, texte: "Refuge parfait pour se ressourcer. Jardin luxuriant, piscine fraîche, tout était propre et bien équipé. L'hôte répond très rapidement. Parfait !", date: "Mars 2025" },
      { nom: "Kevin & Laura",  pays: "🇫🇷", note: 5, texte: "Logement zen et bien pensé. Le jardin tropical crée une vraie bulle de tranquillité. La piscine privée est un luxe appréciable. Super séjour !", date: "Fév. 2025" },
      { nom: "Petra K.",       pays: "🇳🇱", note: 5, texte: "Lovely tropical retreat. The private pool surrounded by lush vegetation is simply stunning. Very clean, well-equipped, and peaceful. We loved it!", date: "Janv. 2025" },
      { nom: "Bernard T.",     pays: "🇫🇷", note: 4, texte: "Beau logement dans un cadre verdoyant. Piscine appréciable, jardin entretenu. Quelques petites améliorations à prévoir mais hôte réactif et bienveillant.", date: "Déc. 2024" },
    ],
  },
  {
    id: "mabouya",
    nom: "Studio Mabouya",
    lieu: "Sainte-Luce, Martinique",
    rating: "4,55",
    reviews: 11,
    photo: "/photos/mabouya/01.webp",
    amenities: ["Jacuzzi privatif", "Vue mer", "Jardin fleuri"],
    avis: [
      { nom: "Élise & Romain", pays: "🇫🇷", note: 5, texte: "Weekend romantique parfait ! Le jacuzzi privatif sous les étoiles avec vue mer est juste magique. Jardin fleuri superbe, endroit très paisible.", date: "Avr. 2025" },
      { nom: "Sarah W.",       pays: "🇺🇸", note: 5, texte: "Hidden gem! The private jacuzzi with ocean views made every evening unforgettable. The flowering garden is gorgeous. Perfect romantic escape.", date: "Mars 2025" },
      { nom: "Jean-Paul M.",   pays: "🇫🇷", note: 4, texte: "Très beau logement avec un jacuzzi privatif et une vue mer agréable. Jardin entretenu, hôte sympathique. Idéal pour un séjour en couple.", date: "Fév. 2025" },
      { nom: "Charlotte P.",   pays: "🇫🇷", note: 5, texte: "Un petit paradis ! Le jacuzzi en terrasse avec vue sur la mer au coucher du soleil, c'est juste inoubliable. Studio bien équipé et très propre.", date: "Jan. 2025" },
      { nom: "Alejandro V.",   pays: "🇪🇸", note: 5, texte: "Estudio precioso con jacuzzi privado y vistas al mar. El jardín florido es encantador. Un lugar tranquilo y romántico. Volveremos sin duda.", date: "Déc. 2024" },
    ],
  },
  {
    id: "schoelcher",
    nom: "Bellevue",
    lieu: "Schœlcher, Martinique",
    rating: "4,8",
    reviews: 30,
    photo: "/photos/schoelcher/01.webp",
    amenities: ["Vue baie", "Terrasse", "Dernier étage"],
    avis: [
      { nom: "Isabelle T.",   pays: "🇫🇷", note: 5, texte: "Appartement très bien situé avec une vue splendide sur la baie de Fort-de-France. Calme, propre, bien équipé. Idéal pour explorer le nord de la Martinique.", date: "Avr. 2025" },
      { nom: "Dirk H.",       pays: "🇳🇱", note: 5, texte: "Amazing view over the bay! The apartment is quiet, clean and has everything you need. Great location to explore the north of Martinique. Highly recommended.", date: "Mars 2025" },
      { nom: "Monique R.",    pays: "🇫🇷", note: 5, texte: "Logement de standing avec une vue exceptionnelle. Hôte très accueillant et réactif. La terrasse face à la baie est un vrai bonheur le matin.", date: "Fév. 2025" },
      { nom: "Patrick & Sylvie", pays: "🇫🇷", note: 5, texte: "Appartement lumineux au dernier étage, vue panoramique sur la baie. Tout était nickel à l'arrivée. Situation idéale pour rayonner en Martinique.", date: "Jan. 2025" },
      { nom: "Ingrid M.",     pays: "🇸🇪", note: 4, texte: "Beautiful apartment with a stunning bay view. The terrace is perfect for sunset watching. Well-equipped and clean. A few small things could be improved but overall excellent.", date: "Déc. 2024" },
      { nom: "Thierry B.",    pays: "🇫🇷", note: 5, texte: "Coup de cœur pour cet appartement ! La vue sur la baie depuis la terrasse est à couper le souffle. Hôte très disponible et accueillant. À recommander sans hésiter.", date: "Nov. 2024" },
    ],
  },
  {
    id: "nogent",
    nom: "Nogent-sur-Marne",
    lieu: "Nogent-sur-Marne, Île-de-France",
    rating: "4,95",
    reviews: null,
    photo: "/photos/nogent/01.webp",
    amenities: ["Bord de Marne", "Jardin", "RER A"],
    avis: [
      { nom: "Aurélie F.",    pays: "🇫🇷", note: 5, texte: "Appartement lumineux et très bien décoré au bord de la Marne. Calme absolu tout en étant à 20 min de Paris. Le jardin est charmant. Parfait pour se ressourcer.", date: "Avr. 2025" },
      { nom: "Oliver M.",     pays: "🇬🇧", note: 5, texte: "Lovely flat with a garden right by the river. Peaceful, well-decorated and only 20 minutes from central Paris. The host was very welcoming and helpful.", date: "Mars 2025" },
      { nom: "Nora & Pierre", pays: "🇫🇷", note: 5, texte: "Un appartement de standing dans un cadre verdoyant au bord de la Marne. Très calme, magnifiquement décoré. On se croirait en vacances tout en étant proche de Paris.", date: "Fév. 2025" },
      { nom: "Hans G.",       pays: "🇩🇪", note: 5, texte: "Wunderschöne Wohnung direkt an der Marne mit traumhaftem Garten. Sehr ruhig und dennoch gut erreichbar. Perfekter Aufenthalt — absolut empfehlenswert!", date: "Jan. 2025" },
    ],
  },
];

/* Citation phare — la plus forte, en grand format éditorial */
const FEATURED = {
  texte: "Best Airbnb we've ever stayed in — period.",
  nom: "James K.",
  pays: "🇬🇧",
  bien: "Villa Amaryllis",
  date: "Mars 2025",
};

/* ── Composants ──────────────────────────────────────────────────── */
function Stars({ note, size = 13 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2, lineHeight: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= note ? "var(--c-gold)" : "var(--c-sand)" }}>★</span>
      ))}
    </span>
  );
}

// Accepte format Airbnb {nom, pays, note, texte, date} ou Google {author, avatar, rating, text, time}
function ReviewCard({ r }) {
  const name   = r.nom   ?? r.author ?? "?";
  const note   = r.note  ?? r.rating ?? 5;
  const texte  = r.texte ?? r.text   ?? "";
  const date   = r.date  ?? r.time   ?? "";
  const pays   = r.pays  ?? "";
  const source = r.source ?? (r.author ? "google" : "airbnb");

  return (
    <div style={{
      background: "#fff", border: "1px solid var(--c-sand)",
      borderRadius: 14, padding: "22px 22px 20px",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {r.avatar
          ? <img loading="lazy" decoding="async" src={r.avatar} alt={name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} onError={e => e.currentTarget.style.display = "none"} />
          : <div style={{
              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
              background: "var(--c-navy)", color: "var(--c-ivory)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 15,
            }}>{name[0]}</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, color: "var(--c-navy)" }}>
            {pays} {name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <Stars note={note} />
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: "var(--c-muted)" }}>{date}</span>
          </div>
        </div>
        {/* Badge source */}
        {source === "google" ? (
          <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.65 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        ) : (
          <span style={{ fontSize: 9, fontWeight: 700, color: "#ff5a5f", fontFamily: "'Jost', sans-serif", letterSpacing: "0.04em", flexShrink: 0, opacity: 0.75 }}>Airbnb</span>
        )}
      </div>
      <Editorial size="sm" style={{ fontSize: 14, color: "var(--c-muted)", lineHeight: 1.65 }}>
        &ldquo;{texte.length > 300 ? texte.slice(0, 300) + "…" : texte}&rdquo;
      </Editorial>
    </div>
  );
}

/* ── JSON-LD schema ── */
function AvisJsonLd({ biens, avgRating, totalAvis }) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://villamaryllis.com/avis",
        "url": "https://villamaryllis.com/avis",
        "name": "Avis clients — Amaryllis Locations Martinique",
        "description": `${totalAvis}+ avis vérifiés. Note moyenne ${avgRating}/5 sur nos villas en Martinique.`,
        "isPartOf": { "@id": "https://villamaryllis.com/#website" },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://villamaryllis.com/" },
            { "@type": "ListItem", "position": 2, "name": "Avis clients", "item": "https://villamaryllis.com/avis" },
          ],
        },
      },
      ...biens.filter(b => b.rating).map(b => ({
        "@type": "VacationRental",
        "@id": `https://villamaryllis.com/${b.id}`,
        "name": b.nom,
        "url": `https://villamaryllis.com/${b.id}`,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": String(b.rating).replace(",", "."),
          "reviewCount": b.reviews || b.avis.length,
          "bestRating": "5",
          "worstRating": "1",
        },
        "review": b.avis.map(r => ({
          "@type": "Review",
          "author": { "@type": "Person", "name": r.nom },
          "reviewRating": { "@type": "Rating", "ratingValue": r.note, "bestRating": "5" },
          "reviewBody": r.texte,
          "datePublished": "2025",
        })),
      })),
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ── Page principale ─────────────────────────────────────────────── */
const STATIC_GOOGLE = [
  { author: "Sophie M.",     avatar: null, rating: 5, text: "Vue extraordinaire, piscine à débordement parfaite. Un endroit hors du temps face aux Caraïbes. On reviendra sans hésiter !", time: "il y a 2 mois", source: "google" },
  { author: "Thomas L.",     avatar: null, rating: 5, text: "Villa magnifique, très bien équipée. L'accueil était parfait et la piscine à débordement est tout simplement incroyable. Nous recommandons vivement !", time: "il y a 3 mois", source: "google" },
  { author: "Marie & Pierre",avatar: null, rating: 5, text: "Séjour parfait ! La vue est époustouflante, la villa très confortable. Les propriétaires sont très réactifs et aux petits soins. À refaire sans hésitation.", time: "il y a 4 mois", source: "google" },
  { author: "Emma R.",       avatar: null, rating: 5, text: "Logement de rêve ! Tout était parfait, de la propreté à l'équipement. La piscine est magnifique et la vue sur la mer est à couper le souffle.", time: "il y a 5 mois", source: "google" },
  { author: "Jean-Paul B.",  avatar: null, rating: 4, text: "Très belle villa avec une vue imprenable. Quelques petits détails à améliorer mais globalement un excellent séjour. La piscine est top !", time: "il y a 6 mois", source: "google" },
];

const STATIC_GOOGLE_RESIDENCE = [
  { author: "Valérie M.",    avatar: null, rating: 5, text: "Des propriétés magnifiques avec une vue imprenable sur la mer. L'accueil est chaleureux et les logements impeccables. La résidence Amaryllis, c'est le top en Martinique !", time: "il y a 1 mois", source: "google" },
  { author: "Christophe R.", avatar: null, rating: 5, text: "Séjour exceptionnel dans cette résidence. Cadre idyllique, piscine superbe, hôte aux petits soins. On recommande les yeux fermés !", time: "il y a 2 mois", source: "google" },
  { author: "Isabelle F.",   avatar: null, rating: 5, text: "Tout était parfait — de la réservation au départ. Les logements sont bien équipés, très propres et la vue sur la Caraïbe est à couper le souffle.", time: "il y a 3 mois", source: "google" },
  { author: "Marcus W.",     avatar: null, rating: 5, text: "Wonderful stay in Martinique. The properties are beautifully maintained, the views are spectacular and the hosts are incredibly helpful. Will definitely return!", time: "il y a 4 mois", source: "google" },
  { author: "Patricia D.",   avatar: null, rating: 4, text: "Belle résidence avec des logements de qualité et une situation privilégiée. Hôte réactif et attentionné. Un séjour très agréable en Martinique.", time: "il y a 5 mois", source: "google" },
];

export default function Avis() {
  const [filtre, setFiltre] = useState(() => {
    const param = new URLSearchParams(window.location.search).get("bien");
    return param && BIENS_AVIS.some(b => b.id === param) ? param : "all";
  });
  const [googleRevs, setGoogleRevs] = useState(STATIC_GOOGLE);         // Villa Amaryllis
  const [googleRevs2, setGoogleRevs2] = useState(STATIC_GOOGLE_RESIDENCE); // Résidence Amaryllis
  const [voyageurByBien, setVoyageurByBien] = useState({});            // vrais avis Airbnb (D1) par bien

  useEffect(() => {
    fetch("/api/google-reviews?place=amaryllis")
      .then(r => r.json())
      .then(d => { if (d.ok && d.reviews?.length) setGoogleRevs(d.reviews.map(r => ({ ...r, source: "google" }))); })
      .catch(() => {});
    fetch("/api/google-reviews?place=residence")
      .then(r => r.json())
      .then(d => { if (d.ok && d.reviews?.length) setGoogleRevs2(d.reviews.map(r => ({ ...r, source: "google" }))); })
      .catch(() => {});
    // Vrais avis voyageurs Airbnb (D1, non masqués) pour chaque bien.
    const stripHtml = (t) => String(t || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
    const frDate = (iso) => { const m = /^(\d{4})-(\d{2})/.exec(iso || ""); return m ? `${MOIS[+m[2] - 1]} ${m[1]}` : (iso || ""); };
    BIENS_AVIS.forEach(b => {
      fetch(`/api/voyageur-feedback?action=public&bien=${encodeURIComponent(b.id)}&limit=12`)
        .then(r => r.json())
        .then(d => {
          if (!d.ok || !d.reviews?.length) return;
          const cards = d.reviews.map(rv => ({ nom: rv.prenom || "Voyageur", note: rv.rating, texte: stripHtml(rv.review_text), date: frDate(rv.review_date), source: "airbnb" }));
          setVoyageurByBien(prev => ({ ...prev, [b.id]: cards }));
        })
        .catch(() => {});
    });
  }, []);

  const totalAvis = BIENS_AVIS.reduce((s, b) => s + (b.reviews || b.avis.length), 0);
  // Moyenne pondérée : chaque logement pèse selon son nombre d'avis
  const avgRating = (() => {
    const { sumW, sumN } = BIENS_AVIS.reduce((acc, b) => {
      const n = b.reviews || b.avis.length;
      const r = parseFloat(String(b.rating).replace(",", "."));
      return { sumW: acc.sumW + r * n, sumN: acc.sumN + n };
    }, { sumW: 0, sumN: 0 });
    return (sumW / sumN).toFixed(2).replace(".", ",");
  })();

  const biensFiltrés = filtre === "all" ? BIENS_AVIS : BIENS_AVIS.filter(b => b.id === filtre);

  // Citation phare : un VRAI avis Amaryllis 5★ concis si chargé, sinon repli statique.
  const featured = (() => {
    const am = voyageurByBien["amaryllis"] || [];
    const pick = am.find(r => r.note === 5 && r.texte && r.texte.length >= 90 && r.texte.length <= 210);
    return pick ? { texte: pick.texte, nom: pick.nom, pays: "", bien: "Villa Amaryllis", date: pick.date } : FEATURED;
  })();

  return (
    <div style={{ minHeight: "100vh", background: "var(--c-ivory)", color: "var(--c-navy)" }}>
      <SEOMeta
        title={`Avis voyageurs — ${avgRating}★ · ${totalAvis} avis vérifiés | Amaryllis Locations`}
        description={`${totalAvis} avis authentiques sur nos 7 villas et appartements en Martinique et Île-de-France. Note moyenne ${avgRating}/5. Réservation directe propriétaire sans frais de service.`}
        canonical="/avis"
        image="https://villamaryllis.com/photos/amaryllis/01.webp"
      />
      <AvisJsonLd biens={BIENS_AVIS} avgRating={avgRating} totalAvis={totalAvis} />

      {/* ── Nav ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--c-navy)",
        borderBottom: "1px solid rgba(250,245,233,0.07)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
        }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
            <svg width="30" height="30" viewBox="0 0 92 92">
              <g transform="translate(46 46)" stroke="var(--c-cream)" strokeWidth="1" fill="none">
                {[0, 60, 120, 180, 240, 300].map((rot, i) => (
                  <g key={i} transform={`rotate(${rot})`}>
                    <path d="M 0 0 L 0 -38 L 8 -20 Z" fill="var(--c-cream)" />
                    <path d="M 0 0 L 0 -38 L -8 -20 Z" fill="none" stroke="var(--c-cream)" strokeWidth="0.8" />
                  </g>
                ))}
                <circle r="3" fill="var(--c-gold)" />
              </g>
            </svg>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 15, letterSpacing: "0.55em", color: "var(--c-ivory)", textTransform: "uppercase" }}>AMARYLLIS</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 9, color: "rgba(250,245,233,0.4)", letterSpacing: "0.35em", textTransform: "uppercase", marginTop: 2 }}>LOCATIONS D'EXCEPTION</div>
            </div>
          </a>
          <Button variant="onDark" size="sm" href="/">← Nos logements</Button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 96px" }}>

        {/* ── Hero ── */}
        <div style={{ marginBottom: 72, textAlign: "center" }}>
          <Eyebrow tracking="0.45em" style={{ marginBottom: 20, justifyContent: "center" }}>
            Avis vérifiés Airbnb &amp; Booking.com
          </Eyebrow>
          <Display size="xl" style={{ marginBottom: 32 }}>Ce que disent<br />nos hôtes</Display>

          {/* Stats triplette */}
          <div style={{
            display: "inline-flex", alignItems: "stretch", gap: 0,
            background: "var(--c-cream)", border: "1px solid var(--c-sand)",
            borderRadius: 16, overflow: "hidden",
          }}>
            {[
              { value: avgRating, label: "Note moyenne", sub: "★★★★★" },
              { value: `${totalAvis}+`, label: "Avis vérifiés", sub: "Airbnb · Booking" },
              { value: "7", label: "Logements", sub: "Martinique · Paris" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "24px 36px", textAlign: "center",
                borderLeft: i > 0 ? "1px solid var(--c-sand)" : "none",
              }}>
                <div style={{
                  fontFamily: "'Jost', sans-serif", fontWeight: 200,
                  fontSize: 44, color: "var(--c-navy)", lineHeight: 1, marginBottom: 4,
                }}>{s.value}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--c-coral)", marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: "var(--c-muted)" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Citation grand format façon presse ── */}
        <div style={{
          background: "var(--c-navy)", borderRadius: 16,
          padding: "52px 48px", marginBottom: 72, position: "relative", overflow: "hidden",
        }}>
          {/* guillemet décoratif */}
          <div style={{
            position: "absolute", top: 16, left: 36,
            fontFamily: "'Cormorant Garamond', serif", fontSize: 160, lineHeight: 1,
            color: "var(--c-coral)", opacity: 0.12, userSelect: "none", pointerEvents: "none",
          }}>&ldquo;</div>
          <div style={{ position: "relative", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic", fontWeight: 400,
              fontSize: "clamp(22px, 4vw, 36px)",
              lineHeight: 1.45,
              color: "var(--c-ivory)",
              margin: "0 0 28px",
            }}>
              &ldquo;{featured.texte}&rdquo;
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--c-coral)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14,
              }}>{featured.nom[0]}</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: "var(--c-ivory)" }}>
                  {featured.pays} {featured.nom}
                </div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "var(--c-coral)", letterSpacing: "0.06em" }}>
                  {featured.bien} · {featured.date}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filtres par villa ── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 48 }}>
          <button
            onClick={() => setFiltre("all")}
            style={{
              fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: filtre === "all" ? 600 : 400,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "7px 16px", borderRadius: 999,
              background: filtre === "all" ? "var(--c-navy)" : "var(--c-cream)",
              color: filtre === "all" ? "var(--c-ivory)" : "var(--c-muted)",
              border: `1px solid ${filtre === "all" ? "var(--c-navy)" : "var(--c-sand)"}`,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >Tous</button>
          {BIENS_AVIS.map(b => (
            <button
              key={b.id}
              onClick={() => setFiltre(filtre === b.id ? "all" : b.id)}
              style={{
                fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: filtre === b.id ? 600 : 400,
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "7px 16px", borderRadius: 999,
                background: filtre === b.id ? "var(--c-coral)" : "var(--c-cream)",
                color: filtre === b.id ? "#fff" : "var(--c-muted)",
                border: `1px solid ${filtre === b.id ? "var(--c-coral)" : "var(--c-sand)"}`,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >{b.nom.replace("Studio ", "").replace("Villa ", "")}</button>
          ))}
        </div>

        {/* ── Grille par villa ── */}
        {biensFiltrés.map(bien => (
          <section key={bien.id} style={{ marginBottom: 72 }}>
            {/* En-tête villa */}
            <div style={{
              display: "flex", alignItems: "center", gap: 20,
              marginBottom: 28, flexWrap: "wrap",
              paddingBottom: 20, borderBottom: "1px solid var(--c-sand)",
            }}>
              <img
                src={bien.photo}
                alt={bien.nom}
                loading="lazy"
                width={72} height={72}
                style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", border: "1px solid var(--c-sand)", flexShrink: 0 }}
                onError={e => { e.currentTarget.style.display = "none"; }}
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 18, color: "var(--c-navy)", marginBottom: 4 }}>
                  {bien.nom}
                </div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-coral)", marginBottom: 8 }}>
                  {bien.lieu}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <RatingBadge rating={bien.rating} count={bien.reviews ?? bien.avis.length} />
                  {bien.amenities.map(a => (
                    <span key={a} style={{
                      fontFamily: "'Jost', sans-serif", fontSize: 10,
                      color: "var(--c-muted)", background: "var(--c-cream)",
                      border: "1px solid var(--c-sand)", borderRadius: 4, padding: "3px 8px",
                    }}>{a}</span>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" href={`/${bien.id}`}>
                Voir le logement →
              </Button>
            </div>

            {/* Grille avis — Airbnb + Google (Amaryllis) */}
            {(() => {
              // Vrais avis (D1) si chargés, sinon repli sur les avis statiques.
              const airbnbCards = (voyageurByBien[bien.id]?.length
                ? voyageurByBien[bien.id]
                : bien.avis.map(r => ({ ...r, source: "airbnb" })));
              const RESIDENCE_IDS = ["zandoli", "iguana", "geko", "mabouya"];
              const gCards = bien.id === "amaryllis"             ? googleRevs
                           : RESIDENCE_IDS.includes(bien.id)    ? googleRevs2
                           : [];
              const allCards = [...airbnbCards, ...gCards];
              const totalVerified = bien.reviews ?? null;
              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
                    {allCards.map((r, i) => <ReviewCard key={i} r={r} />)}
                  </div>
                  {totalVerified && totalVerified > allCards.length && (
                    <p style={{ marginTop: 18, fontFamily: "'Jost', sans-serif", fontSize: 12, color: "var(--c-muted)", fontWeight: 300 }}>
                      Sélection parmi {totalVerified} avis vérifiés Airbnb
                    </p>
                  )}
                </>
              );
            })()}
          </section>
        ))}

        {/* ── CTA final ── */}
        <div style={{
          textAlign: "center", paddingTop: 48,
          borderTop: "1px solid var(--c-sand)",
        }}>
          <Eyebrow style={{ marginBottom: 16, justifyContent: "center" }}>Réservation directe</Eyebrow>
          <Display size="md" style={{ marginBottom: 16 }}>Sans frais de service</Display>
          <Editorial color="var(--c-muted)" style={{ marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
            Rejoignez nos hôtes satisfaits et économisez jusqu'à 20% en réservant directement — sans commission Airbnb.
          </Editorial>
          <Button variant="primary" size="lg" href="/">Voir nos logements</Button>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        background: "var(--c-navy)", padding: "24px",
        textAlign: "center",
        borderTop: "1px solid rgba(250,245,233,0.06)",
      }}>
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11,
          color: "rgba(250,245,233,0.35)", letterSpacing: "0.05em",
        }}>
          © 2025 Amaryllis · villamaryllis.com · Tous droits réservés
        </span>
      </footer>
    </div>
  );
}
