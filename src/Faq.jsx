/**
 * Amaryllis — Page FAQ
 * Design ref: faq-v2.html (Amaryllis Design System)
 *
 * - Hero avec recherche live
 * - Nav catégories sticky avec scroll-spy
 * - 7 catégories, accordéons React-controlled
 * - Panneau "Pas trouvé ?"
 * - CTA final
 */
import { useState, useEffect, useRef, useCallback } from "react";
import SEOMeta from "./SEOMeta.jsx";

/* ─── DATA ───────────────────────────────────────────────────────────── */

const CATEGORIES = [
  {
    id: "reservation",
    label: "Réservation & paiement",
    num: "01",
    pre: "Catégorie 1 · 7 questions",
    title: ["Réservation & ", "paiement"],
    items: [
      {
        q: "Comment réserver sans passer par Airbnb ou Booking ?",
        a: <>
          <p>Directement sur ce site. Sélectionnez votre villa, choisissez vos dates et payez par carte (Stripe sécurisé). <strong>Vous économisez les frais de service</strong> — jusqu'à 14% du prix — et vous avez un contact direct avec votre hôte avant, pendant et après le séjour.</p>
          <p>Si vous préférez parler à quelqu'un, on prend les réservations <em>aussi par WhatsApp</em> — réponse en moins d'une heure.</p>
        </>,
      },
      {
        q: "Le paiement est-il sécurisé ?",
        a: <>
          <p>Oui, intégralement. Notre processeur est <strong>Stripe</strong>, le même que celui qui sécurise des millions de réservations par jour dans le monde. Cryptage 256-bit, aucune donnée bancaire stockée chez nous.</p>
        </>,
      },
      {
        q: "Faut-il payer la totalité au moment de la réservation ?",
        a: <>
          <p>Oui. Le séjour est débité immédiatement par carte, et la <em>caution est seulement pré-autorisée</em> — c'est-à-dire bloquée sur votre carte mais jamais réellement débitée. Elle est libérée automatiquement 3 jours après votre départ si tout est en ordre.</p>
        </>,
      },
      {
        q: "Existe-t-il un code promo ?",
        a: <>
          <p>Plusieurs réductions sont automatiques :</p>
          <p><strong>−5%</strong> à partir de 7 nuits. <strong>−10%</strong> à partir de 14 nuits. <strong>−15%</strong> à partir de 28 nuits.</p>
          <p>En plus, si vous nous suivez sur Instagram et nous taguez à votre arrivée, on offre <em>une bouteille de rhum vieux</em> à la maison — petit geste de bienvenue.</p>
        </>,
      },
      {
        q: "Quel est le prix d'une villa avec piscine ?",
        a: <>
          <p>Nos villas avec piscine vont <strong>de 110€/nuit</strong> (Géko, T2 avec piscine privée) <strong>jusqu'à 280€/nuit</strong> pour la Villa Amaryllis (piscine à débordement + vue mer + 3 chambres).</p>
          <p>Le studio Mabouya avec jacuzzi privé démarre à 70€/nuit — la meilleure entrée romantique du catalogue.</p>
        </>,
      },
      {
        q: "Le ménage est-il inclus ?",
        a: <>
          <p>Non, c'est un forfait séparé qui apparaît clairement au moment de la réservation. <strong>120 à 200€</strong> selon la villa, à payer une fois pour tout le séjour (peu importe sa durée).</p>
          <p>En contrepartie, à votre arrivée la villa est <em>nickel-chrome</em> — draps repassés, frigo nettoyé, terrasse balayée. Pas une location de plus, vraiment.</p>
        </>,
      },
      {
        q: "Quel est le montant de la caution ?",
        a: <>
          <p>Entre <strong>500€ et 1 500€</strong> selon la villa. Pré-autorisée sur votre carte au moment de la réservation, jamais débitée si vous nous rendez la villa dans l'état où vous l'avez trouvée — et libérée automatiquement 3 jours après votre départ.</p>
        </>,
      },
    ],
  },
  {
    id: "avant",
    label: "Avant l'arrivée",
    num: "02",
    pre: "Catégorie 2 · 5 questions",
    title: ["Avant ", "l'arrivée"],
    items: [
      {
        q: "Vais-je recevoir des informations avant mon arrivée ?",
        a: <>
          <p>Oui, automatiquement. <strong>48h avant votre arrivée</strong>, vous recevez un mail détaillé : adresse exacte, code de la villa, recommandations de courses, numéro WhatsApp d'urgence.</p>
          <p>Et puis, surtout, <em>notre guide d'arrivée personnalisé du Sud Martinique</em> — adresses des restaurants, horaires des marchés, plages secrètes par humeur. Du vrai contenu, pas du PDF copié-collé.</p>
        </>,
      },
      {
        q: "Comment se passe la remise des clés ?",
        a: <>
          <p>En personne, <strong>toujours</strong>. Pas de boîte à clés, pas de QR code à scanner. À votre arrivée, l'un d'entre nous (ou un membre de notre équipe locale) vous accueille à la villa, vous fait le tour, vous explique les particularités et reste pour répondre à toutes vos questions.</p>
        </>,
      },
      {
        q: "À quelle heure puis-je arriver ?",
        a: <>
          <p>Check-in <strong>à partir de 17h</strong>, check-out <strong>avant 12h</strong>. Pour les vols qui arrivent en fin de matinée ou tôt l'après-midi, on essaie toujours d'arranger un <em>early check-in</em> selon disponibilité — il suffit de demander 48h avant.</p>
        </>,
      },
      {
        q: "Faut-il louer une voiture ?",
        a: <>
          <p>En Martinique, <strong>oui</strong>. Les transports en commun sont quasi-inexistants. On vous recommande des loueurs locaux fiables (pas Hertz à l'aéroport) — on a deux contacts qui livrent à la villa pour 280€/semaine.</p>
          <p>Pour Nogent (94), pas de voiture nécessaire : <em>le RER A est à 10 minutes à pied</em>.</p>
        </>,
      },
      {
        q: "Que dois-je apporter ?",
        a: <>
          <p>Vraiment, juste vos vêtements. Toutes nos villas sont entièrement équipées : linge de maison, serviettes, produits d'accueil, cuisine complète, sèche-cheveux, fer à repasser.</p>
          <p>Si vous voulez vraiment cuisiner local, <em>le marché de Sainte-Luce</em> tous les samedis matin — fruits, légumes, poissons, épices.</p>
        </>,
      },
    ],
  },
  {
    id: "sejour",
    label: "Pendant le séjour",
    num: "03",
    pre: "Catégorie 3 · 6 questions",
    title: ["Pendant le ", "séjour"],
    items: [
      {
        q: "Comment vous joindre en cas de problème ?",
        a: <>
          <p>Notre numéro WhatsApp est <strong>+33 6 10 88 07 72</strong> — il est dans le mail d'arrivée, sur le frigo, et sur le guide d'accueil. Réponse moyenne : <em>7 minutes en journée</em>, 20 minutes le soir.</p>
          <p>En cas d'urgence vraiment urgente (fuite, panne électrique, etc.), notre équipe locale est à 7 minutes de la villa.</p>
        </>,
      },
      {
        q: "Le WiFi est-il inclus et fiable ?",
        a: <>
          <p>Oui, dans toutes nos villas. <strong>Wifi Starlink haut débit</strong> dans les villas Sainte-Luce, fibre dans les pieds-à-terre IDF et Schœlcher. Connexion stable même dans les hauteurs de Sainte-Luce (qu'on ne peut pas en dire autant pour la 4G).</p>
          <p>Si vous télétravaillez, <em>Iguana est notre meilleur spot</em> — bureau dédié, Starlink, ergonomie.</p>
        </>,
      },
      {
        q: "Les villas ont-elles la climatisation ?",
        a: <>
          <p>Oui, dans toutes les chambres. Mais honnêtement, en Martinique, <em>vous ne l'allumerez quasi jamais</em> — les villas sont conçues pour la ventilation naturelle (alizés constants, baies coulissantes traversantes). C'est plus agréable que la clim de toute façon.</p>
        </>,
      },
      {
        q: "Y a-t-il un service de ménage pendant le séjour ?",
        a: <>
          <p>Sur demande, pour les séjours de <strong>7 nuits et plus</strong>. Ménage de mi-séjour à 60€ (villas Sainte-Luce) ou 80€ (Amaryllis). On vous prévient à votre arrivée.</p>
        </>,
      },
      {
        q: "Peut-on faire venir un chef à domicile ?",
        a: <>
          <p>Oui ! Nous avons <em>deux chefs locaux de confiance</em> qui se déplacent — cuisine créole authentique, marché du matin, vaisselle faite. Comptez 60€/personne pour un menu 3 plats. On vous met en contact 48h avant si vous le souhaitez.</p>
        </>,
      },
      {
        q: "Que faire en cas de pluie ?",
        a: <>
          <p>D'abord, savoir qu'à <strong>Sainte-Luce, il pleut peu</strong> : c'est le sud de l'île, microclimat sec. Quand il pleut, c'est souvent 20 minutes et c'est passé.</p>
          <p>Sinon, on a une liste d'options "pluie" testées : <em>les distilleries de rhum (climatisées et excellentes)</em>, le musée de la Pagerie, ou simplement profiter du carbet de la villa avec un bon livre.</p>
        </>,
      },
    ],
  },
  {
    id: "villas",
    label: "Les villas",
    num: "04",
    pre: "Catégorie 4 · 6 questions",
    title: ["Les ", "villas"],
    items: [
      {
        q: "Quelle est la différence entre vos sept villas ?",
        a: <>
          <p>Chaque adresse a un caractère :</p>
          <p><strong>Amaryllis</strong> est notre flagship — 3 suites, piscine à débordement eau salée, terrasse 100 m², vue mer 180°. <strong>Mabouya</strong> est romantique — studio avec jacuzzi privatif et vue mer. <strong>Zandoli</strong> est familial — 2 chambres, mezzanine, piscine privative à cascade, jardin tropical. <strong>Géko</strong> est cosy — piscine privative à cascade, jardin. <strong>Iguana</strong> a la piscine eau salée unique (non chlorée) et vue Rocher du Diamant. <strong>Bellevue (Schœlcher)</strong> a la vue baie de Fort-de-France la plus dégagée. <strong>Nogent</strong> est notre pied-à-terre IDF avec jardin et terrasse.</p>
          <p>Pour choisir, le plus simple : nous dire qui vous êtes (combien, quoi, pour quoi) — on vous oriente en 3 lignes sur WhatsApp.</p>
        </>,
      },
      {
        q: "Peut-on louer une villa avec jacuzzi privatif ?",
        a: <>
          <p>Oui. Le studio <strong>Mabouya</strong> est entièrement dédié au romantisme avec jacuzzi privatif en terrasse et vue mer à partir de 110€/nuit. C'est le seul logement de la résidence à proposer un jacuzzi privé — l'expérience couple idéale.</p>
        </>,
      },
      {
        q: "Les villas sont-elles équipées pour les enfants ?",
        a: <>
          <p>Lit bébé et chaise haute disponibles à la demande dans toutes les villas (gratuit, à signaler 48h avant l'arrivée). Amaryllis et Zandoli ont des piscines avec <em>plage immergée</em> idéale pour les tout-petits — l'eau monte progressivement.</p>
        </>,
      },
      {
        q: "Les animaux sont-ils acceptés ?",
        a: <>
          <p>Oui, <strong>jusqu'à 2 animaux maximum</strong>, avec un supplément de 40€ par séjour. Toutes les villas sauf Nogent acceptent les animaux. Merci de nous le signaler au moment de la réservation.</p>
        </>,
      },
      {
        q: "Combien de personnes peut accueillir chaque villa ?",
        a: <>
          <p>Amaryllis : 6 voyageurs (3 chambres). Zandoli : 4. Géko : 2. Mabouya : 2. Iguana : 2. Bellevue : 3. Nogent : 4. <em>Les chiffres sont stricts</em> — pour des raisons d'assurance et de confort.</p>
        </>,
      },
      {
        q: "Peut-on visiter avant de réserver ?",
        a: <>
          <p>Les villas sont occupées 80% du temps, donc difficile de visiter sans dates. Par contre, on peut organiser <em>un FaceTime de 10 minutes</em> avec notre équipe sur place — c'est ce qu'on fait pour beaucoup de réservations de longue durée. Demandez sur WhatsApp.</p>
        </>,
      },
    ],
  },
  {
    id: "services",
    label: "Services & extras",
    num: "05",
    pre: "Catégorie 5 · 4 questions",
    title: ["Services & ", "extras"],
    items: [
      {
        q: "Proposez-vous une navette aéroport ?",
        a: <>
          <p>Oui, sur demande : <strong>80€</strong> de l'aéroport Aimé Césaire à n'importe laquelle de nos villas Sainte-Luce. Mais franchement, à ce tarif-là, autant prendre une voiture de location — vous gagnerez en autonomie pour tout le séjour.</p>
        </>,
      },
      {
        q: "Peut-on faire faire les courses avant l'arrivée ?",
        a: <>
          <p>Oui ! Envoyez-nous votre liste sur WhatsApp 24h avant votre arrivée. <em>Frigo plein à la première porte d'entrée</em> — petit-déjeuner, fruits, viandes, vin. On facture le ticket de caisse + 15€ de service. Beaucoup de voyageurs nous le demandent et c'est notre service le plus apprécié.</p>
        </>,
      },
      {
        q: "Y a-t-il des excursions organisées ?",
        a: <>
          <p>On ne les organise pas nous-mêmes, mais on a des <em>partenaires de confiance</em> : tortues d'Arlet en bateau, plongée au Rocher du Diamant, catamaran journée Sainte-Anne, randonnée à la Montagne Pelée. On vous fournit les numéros — souvent avec une réduction "ami de l'Amaryllis".</p>
        </>,
      },
      {
        q: "Peut-on organiser un événement (anniversaire, demande en mariage) ?",
        a: <>
          <p>Oui — c'est presque devenu une spécialité. <em>Décoration florale (bougainvilliers locaux), table dressée face à la mer, chef privé, photographe</em>. On a un partenaire pour chaque détail. Donnez-nous une semaine d'avance et on fait le miracle.</p>
        </>,
      },
    ],
  },
  {
    id: "annulation",
    label: "Annulation",
    num: "06",
    pre: "Catégorie 6 · 3 questions",
    title: ["Annulation & ", "assurance"],
    items: [
      {
        q: "Quelle est votre politique d'annulation ?",
        a: <>
          <p><strong>Annulation gratuite jusqu'à 7 jours avant l'arrivée</strong>, remboursement intégral sans question.</p>
          <p>Entre J-7 et J-2 : 50% remboursé. Moins de 48h : pas de remboursement, mais on essaie toujours <em>de reporter le séjour</em> à des dates équivalentes.</p>
        </>,
      },
      {
        q: "Que se passe-t-il en cas d'ouragan ou de cyclone ?",
        a: <>
          <p>Si la météo nationale annonce une <em>vigilance orange ou rouge</em> sur la Martinique pendant vos dates, on rembourse à 100% — sans question. C'est arrivé deux fois en 7 ans. La saison cyclonique va d'août à octobre, principalement.</p>
        </>,
      },
      {
        q: "Faut-il prendre une assurance voyage ?",
        a: <>
          <p>On le recommande chaudement, surtout pour les vols depuis l'Hexagone. Beaucoup de cartes bancaires premium (Visa Premier, Mastercard Gold, Amex) incluent une assurance annulation automatique — <em>vérifiez vos conditions avant d'en payer une nouvelle</em>.</p>
        </>,
      },
    ],
  },
  {
    id: "pratique",
    label: "Pratique sur place",
    num: "07",
    pre: "Catégorie 7 · 5 questions",
    title: ["Pratique ", "sur place"],
    items: [
      {
        q: "Quand partir en Martinique ?",
        a: <>
          <p><strong>Décembre à avril</strong> : saison sèche, c'est la haute saison. Ensoleillement maximal, peu de pluie, mer chaude.</p>
          <p><strong>Mai et juin</strong> : excellents mois, moins de monde, tarifs réduits. Notre période préférée.</p>
          <p><strong>Juillet à novembre</strong> : saison humide, possibilité de cyclones d'août à octobre. La nature est plus verte, les couchers de soleil plus dramatiques — mais prévoyez de la flexibilité.</p>
        </>,
      },
      {
        q: "Faut-il un passeport ou un visa ?",
        a: <>
          <p>La Martinique est <em>territoire français</em>. Pour les citoyens français et européens : carte d'identité ou passeport en cours de validité. Pas de visa. Pour les autres nationalités, mêmes règles que pour entrer en France métropolitaine.</p>
        </>,
      },
      {
        q: "Y a-t-il des moustiques ? Le risque de dengue ?",
        a: <>
          <p>Oui, comme partout dans les Caraïbes. On vous fournit <em>du répulsif local à votre arrivée</em>, et toutes les chambres sont équipées de moustiquaires aux fenêtres. La dengue circule par cycles — vérifiez les recommandations de l'ARS au moment de votre départ.</p>
        </>,
      },
      {
        q: "Quelle est la monnaie locale ?",
        a: <>
          <p>L'<strong>euro</strong> — la Martinique est française. Cartes acceptées partout (sauf parfois au marché). Quelques DAB autour de Sainte-Luce. Pas besoin de change.</p>
        </>,
      },
      {
        q: "Parlez-vous anglais ?",
        a: <>
          <p>Notre équipe locale parle français et créole. Vincent et Céline (les hôtes) parlent <em>français, anglais et un peu d'espagnol</em>. Pour les voyageurs internationaux, on est joignables dans les trois langues sur WhatsApp.</p>
        </>,
      },
    ],
  },
];

/* ─── ACCORDION ITEM ─────────────────────────────────────────────────── */

function QAItem({ question, answer, open, onToggle, searchQuery }) {
  const answerRef = useRef(null);

  // Extract plain text from JSX for search matching
  const questionLower = question.toLowerCase();
  const isMatch = searchQuery.length >= 3
    ? questionLower.includes(searchQuery) || (answerRef.current?.textContent?.toLowerCase() || "").includes(searchQuery)
    : true;

  if (!isMatch) return null;

  return (
    <div style={{
      borderTop: "1px solid var(--c-sand)",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          cursor: "pointer",
          background: "none",
          border: "none",
          padding: "22px 0",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          fontFamily: "'Jost', sans-serif",
          fontWeight: 500,
          fontSize: 16,
          color: open ? "var(--c-coral)" : "var(--c-navy)",
          letterSpacing: "0.01em",
          lineHeight: 1.4,
          textAlign: "left",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.color = "var(--c-coral)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = "var(--c-navy)"; }}
      >
        <span>{question}</span>
        <span style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          marginTop: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.3s cubic-bezier(0.23,1,0.32,1)",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-coral)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </span>
      </button>
      <div style={{
        overflow: "hidden",
        maxHeight: open ? 600 : 0,
        opacity: open ? 1 : 0,
        transition: "max-height 0.35s cubic-bezier(0.23,1,0.32,1), opacity 0.25s ease",
      }}>
        <div
          ref={answerRef}
          style={{ padding: "0 36px 26px 0" }}
          className="faq-answer"
        >
          {answer}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────── */

export default function Faq() {
  const [query, setQuery] = useState("");
  const [openItems, setOpenItems] = useState({}); // "catId-idx" → bool
  const [activecat, setActivecat] = useState("reservation");
  const sectionRefs = useRef({});
  const navRef = useRef(null);

  const searchQ = query.trim().toLowerCase();

  // Toggle a single accordion item
  const toggle = useCallback((catId, idx) => {
    const key = `${catId}-${idx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // When searching: open all matching items
  useEffect(() => {
    if (searchQ.length >= 3) {
      const next = {};
      CATEGORIES.forEach(cat => {
        cat.items.forEach((item, idx) => {
          const match = item.q.toLowerCase().includes(searchQ);
          next[`${cat.id}-${idx}`] = match;
        });
      });
      setOpenItems(next);
    } else if (searchQ.length === 0) {
      setOpenItems({});
    }
  }, [searchQ]);

  // Scroll-spy
  useEffect(() => {
    function onScroll() {
      let activeIdx = 0;
      const offset = 200;
      CATEGORIES.forEach((cat, i) => {
        const el = sectionRefs.current[cat.id];
        if (el && el.getBoundingClientRect().top <= offset) activeIdx = i;
      });
      setActivecat(CATEGORIES[activeIdx].id);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Smooth scroll to category when nav chip clicked
  function scrollTocat(catId, e) {
    e.preventDefault();
    const el = sectionRefs.current[catId];
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setActivecat(catId);
  }

  // Filtered categories for no-results state
  const hasResults = CATEGORIES.some(cat =>
    cat.items.some(item => searchQ.length < 3 || item.q.toLowerCase().includes(searchQ))
  );

  return (
    <>
      <SEOMeta
        title="FAQ — Réservation villas Martinique | Amaryllis"
        description="Toutes les réponses sur la réservation directe, les piscines privées, les annulations, la caution et les services de nos villas en Martinique. Réponse en moins d'une heure sur WhatsApp."
        canonical="/faq"
      />
      {/* seo-004 : FAQPage JSON-LD — rich snippets Google */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Comment réserver une villa en Martinique sans passer par Airbnb ?", "acceptedAnswer": { "@type": "Answer", "text": "Directement sur villamaryllis.com. Sélectionnez votre villa, choisissez vos dates et payez par carte (Stripe sécurisé). Vous économisez les frais de service jusqu'à 14% et bénéficiez d'un contact direct avec l'hôte. Réservation aussi possible par WhatsApp au +33 6 10 88 07 72." } },
          { "@type": "Question", "name": "Quel est le prix d'une villa avec piscine en Martinique ?", "acceptedAnswer": { "@type": "Answer", "text": "Nos villas avec piscine vont de 110€/nuit (Géko, piscine privative à cascade) jusqu'à 280€/nuit pour la Villa Amaryllis (piscine à débordement eau salée, vue mer 180°, 3 chambres). Zandoli (110€) a aussi sa propre piscine privative à cascade. Iguana (180€) propose la seule piscine eau salée non chlorée de la résidence. Le studio Mabouya avec jacuzzi privatif démarre à 70€/nuit." } },
          { "@type": "Question", "name": "Quelle est la politique d'annulation ?", "acceptedAnswer": { "@type": "Answer", "text": "Annulation gratuite jusqu'à 7 jours avant l'arrivée, remboursement intégral. Entre J-7 et J-2 : 50% remboursé. Moins de 48h : pas de remboursement, mais report possible. En cas de vigilance cyclonique orange ou rouge : remboursement 100%." } },
          { "@type": "Question", "name": "Faut-il louer une voiture pour séjourner en Martinique ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, en Martinique les transports en commun sont quasi-inexistants. Nous recommandons des loueurs locaux fiables qui livrent à la villa pour environ 280€/semaine. Pour notre appartement à Nogent-sur-Marne, le RER A est à 10 minutes à pied." } },
          { "@type": "Question", "name": "Quel est le montant de la caution pour une villa ?", "acceptedAnswer": { "@type": "Answer", "text": "Entre 500€ et 1 500€ selon la villa. La caution est uniquement pré-autorisée sur votre carte (jamais débitée) et libérée automatiquement 3 jours après votre départ si la villa est rendue en bon état." } },
          { "@type": "Question", "name": "Quelle est la meilleure période pour aller en Martinique ?", "acceptedAnswer": { "@type": "Answer", "text": "Décembre à avril : saison sèche, ensoleillement maximal, haute saison. Mai et juin : excellents mois, moins de monde, tarifs réduits — notre période préférée. Juillet à novembre : saison humide avec risque de cyclones d'août à octobre." } },
          { "@type": "Question", "name": "Les animaux de compagnie sont-ils acceptés dans les villas ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, jusqu'à 2 animaux maximum avec un supplément de 40€ par séjour. Toutes les villas en Martinique acceptent les animaux (sauf l'appartement Nogent). À signaler au moment de la réservation." } },
          { "@type": "Question", "name": "Le WiFi est-il inclus dans les villas Amaryllis ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, dans toutes nos villas. Les villas de Sainte-Luce sont équipées du Starlink haut débit. Les appartements de Schœlcher et Nogent-sur-Marne disposent de la fibre optique." } },
        ],
      })}} />
      <style>{`
        .faq-answer p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          line-height: 1.75;
          color: var(--c-text, #3a2e22);
          margin: 0 0 12px;
        }
        .faq-answer p:last-child { margin-bottom: 0; }
        .faq-answer p em { color: var(--c-coral); font-style: italic; }
        .faq-answer strong {
          font-family: 'Jost', sans-serif;
          font-weight: 600;
          color: var(--c-navy);
        }
        .faq-nav-row::-webkit-scrollbar { display: none; }
        .faq-nav-row { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 700px) {
          .faq-topbar-em { display: none; }
          .faq-hero { padding: 56px 0 24px !important; }
          .faq-cat-num { font-size: 40px !important; width: 44px !important; }
          .faq-help-panel { grid-template-columns: 1fr !important; padding: 32px 24px !important; gap: 20px !important; }
          .faq-qa-btn { font-size: 15px !important; }
        }
      `}</style>

      {/* ── TOPBAR ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 60,
        background: "var(--c-navy)",
        color: "var(--c-ivory)",
        height: 60, padding: "0 24px",
        display: "flex", alignItems: "center", gap: 22,
        borderBottom: "1px solid rgba(250,245,233,0.10)",
      }}>
        <a href="/" style={{
          color: "rgba(250,245,233,0.65)",
          textDecoration: "none",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 300, fontSize: 12, letterSpacing: "0.1em",
        }}>← Accueil</a>

        <h1 style={{
          flex: 1, textAlign: "center",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 200, fontSize: 13,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "var(--c-ivory)", margin: 0,
        }}>
          Questions{" "}
          <em className="faq-topbar-em" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic", fontWeight: 400,
            color: "var(--c-gold)", letterSpacing: "0.02em",
            textTransform: "none", marginLeft: 6,
          }}>fréquentes</em>
        </h1>

        <a
          href="https://wa.me/33610880772"
          target="_blank" rel="noopener noreferrer"
          style={{
            background: "#25D366", color: "#fff",
            textDecoration: "none",
            padding: "8px 14px", borderRadius: 6,
            fontFamily: "'Jost', sans-serif",
            fontWeight: 600, fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >WhatsApp</a>
      </header>

      {/* ── HERO ── */}
      <section className="faq-hero" style={{
        padding: "88px 0 36px",
        textAlign: "center",
        background: "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(196,114,84,0.06), transparent 65%), var(--c-ivory)",
      }}>
        <div style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11,
          letterSpacing: "0.55em", textTransform: "uppercase",
          color: "var(--c-coral)", marginBottom: 22,
        }}>— Tout ce qu'il faut savoir</div>

        <h2 style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 200,
          fontSize: "clamp(38px, 6vw, 72px)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--c-navy)",
          margin: "0 0 22px", lineHeight: 1.0,
        }}>
          Toutes vos{" "}
          <em style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic", fontWeight: 400,
            color: "var(--c-coral)", letterSpacing: 0,
            textTransform: "none",
          }}>questions</em>
        </h2>

        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic", fontSize: 19,
          lineHeight: 1.55, color: "var(--c-muted)",
          maxWidth: 560, margin: "0 auto",
        }}>
          Réservation, séjour, services — la plupart des réponses sont ici. Sinon, on est joignables en moins d'une heure sur WhatsApp.
        </p>

        {/* Search */}
        <div style={{ maxWidth: 620, margin: "36px auto 0", padding: "0 28px" }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher une question…"
            autoComplete="off"
            style={{
              width: "100%", boxSizing: "border-box",
              background: "var(--c-ivory)",
              colorScheme: "dark light",
              border: `1px solid ${query ? "var(--c-coral)" : "var(--c-sand)"}`,
              borderRadius: 999,
              padding: "16px 24px 16px 56px",
              fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 14,
              color: "var(--c-navy)",
              boxShadow: query
                ? "0 0 0 3px rgba(196,114,84,0.10), 0 2px 14px rgba(14,59,58,0.06)"
                : "0 2px 14px rgba(14,59,58,0.06)",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a6b5a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cpath d='M16 16l4 4'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "22px center",
              backgroundSize: 18,
              outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          />
          <div style={{
            textAlign: "center", marginTop: 12,
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic", fontSize: 13,
            color: "var(--c-muted)",
          }}>36 réponses indexées · tapez 3 lettres minimum</div>
        </div>
      </section>

      {/* ── CATEGORY NAV ── */}
      <nav ref={navRef} style={{
        position: "sticky", top: 60, zIndex: 40,
        background: "rgba(250,245,233,0.92)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--c-sand)",
        borderBottom: "1px solid var(--c-sand)",
        padding: "14px 0",
        marginTop: 36,
      }}>
        <div className="faq-nav-row" style={{
          display: "flex", gap: 6,
          overflowX: "auto",
          padding: "0 28px",
        }}>
          {CATEGORIES.map(cat => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              onClick={e => scrollTocat(cat.id, e)}
              style={{
                flexShrink: 0,
                padding: "8px 16px", borderRadius: 999,
                background: activecat === cat.id ? "var(--c-navy)" : "#fff",
                border: `1px solid ${activecat === cat.id ? "var(--c-navy)" : "var(--c-sand)"}`,
                color: activecat === cat.id ? "var(--c-ivory)" : "var(--c-muted)",
                textDecoration: "none",
                fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 12,
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >{cat.label}</a>
          ))}
        </div>
      </nav>

      {/* ── NO RESULTS ── */}
      {searchQ.length >= 3 && !hasResults && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 200,
            fontSize: 56, color: "var(--c-sand)",
          }}>∅</div>
          <h4 style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 200,
            fontSize: 26, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--c-navy)",
            margin: "16px 0 8px",
          }}>Pas de résultat</h4>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic", color: "var(--c-muted)",
            fontSize: 17, margin: 0,
          }}>Essayez un autre mot — ou demandez-nous directement sur WhatsApp.</p>
        </div>
      )}

      {/* ── QUESTIONS ── */}
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "0 28px", boxSizing: "border-box" }}>

        {CATEGORIES.map(cat => {
          // Check if cat has any visible items
          const visibleItems = cat.items.filter(item =>
            searchQ.length < 3 || item.q.toLowerCase().includes(searchQ)
          );
          if (searchQ.length >= 3 && visibleItems.length === 0) return null;

          return (
            <section
              key={cat.id}
              id={cat.id}
              ref={el => { sectionRefs.current[cat.id] = el; }}
              style={{ padding: "60px 0 28px", scrollMarginTop: 140 }}
            >
              {/* Category head */}
              <div style={{ marginBottom: 24, display: "flex", alignItems: "baseline", gap: 18 }}>
                <span className="faq-cat-num" style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  color: "var(--c-gold)", fontSize: 56,
                  lineHeight: 0.9, opacity: 0.55,
                  width: 60,
                }}>{cat.num}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10,
                    letterSpacing: "0.42em", textTransform: "uppercase",
                    color: "var(--c-coral)", marginBottom: 10,
                  }}>{cat.pre}</div>
                  <h3 style={{
                    fontFamily: "'Jost', sans-serif", fontWeight: 200,
                    fontSize: "clamp(26px, 3.4vw, 36px)",
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    color: "var(--c-navy)", margin: 0, lineHeight: 1.05,
                  }}>
                    {cat.title[0]}
                    <em style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic", fontWeight: 400,
                      color: "var(--c-coral)", letterSpacing: 0,
                      textTransform: "none",
                    }}>{cat.title[1]}</em>
                  </h3>
                </div>
              </div>

              {/* Q&A items */}
              <div style={{ borderBottom: "1px solid var(--c-sand)" }}>
                {cat.items.map((item, idx) => (
                  <QAItem
                    key={idx}
                    question={item.q}
                    answer={item.a}
                    open={!!openItems[`${cat.id}-${idx}`]}
                    onToggle={() => toggle(cat.id, idx)}
                    searchQuery={searchQ}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* ── HELP PANEL ── */}
        <section className="faq-help-panel" style={{
          margin: "80px auto 0",
          background: "var(--c-cream)",
          border: "1px solid var(--c-sand)",
          borderRadius: 18, padding: 44,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 32, alignItems: "center",
          marginBottom: 0,
        }}>
          <div>
            <div style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11,
              letterSpacing: "0.42em", textTransform: "uppercase",
              color: "var(--c-coral)", marginBottom: 14,
            }}>— Pas trouvé votre réponse ?</div>
            <h4 style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 200,
              fontSize: 28, letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--c-navy)", margin: "0 0 12px", lineHeight: 1.1,
            }}>
              Posez-la{" "}
              <em style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic", fontWeight: 400,
                color: "var(--c-coral)", letterSpacing: 0,
                textTransform: "none",
              }}>directement</em>
            </h4>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 17, lineHeight: 1.6,
              color: "var(--c-text, #3a2e22)", margin: 0,
            }}>
              Notre équipe répond en moyenne en moins d'une heure. Et si c'est compliqué, on prend le temps qu'il faut — <em style={{ color: "var(--c-coral)" }}>jamais de réponse-type</em>.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a
              href="https://wa.me/33610880772"
              target="_blank" rel="noopener noreferrer"
              style={{
                background: "#25D366", color: "#fff",
                padding: "14px 26px", borderRadius: 6,
                fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12,
                letterSpacing: "0.14em", textTransform: "uppercase",
                textDecoration: "none", textAlign: "center", whiteSpace: "nowrap",
                boxShadow: "0 4px 18px rgba(37,211,102,0.30)",
              }}
            >WhatsApp ↗</a>
            <a
              href="mailto:contact@villamaryllis.com"
              style={{
                background: "var(--c-coral)", color: "#fff",
                padding: "14px 26px", borderRadius: 6,
                fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12,
                letterSpacing: "0.14em", textTransform: "uppercase",
                textDecoration: "none", textAlign: "center", whiteSpace: "nowrap",
                boxShadow: "0 4px 20px rgba(196,114,84,0.35)",
              }}
            >Nous écrire</a>
          </div>
        </section>

      </main>

      {/* ── FINAL CTA ── */}
      <section style={{
        background: "var(--c-navy)", color: "var(--c-ivory)",
        padding: "96px 0", textAlign: "center",
        marginTop: 80,
        position: "relative", overflow: "hidden",
      }}>
        {/* Blurred photo background */}
        <div style={{
          position: "absolute", inset: -40,
          backgroundImage: "url('/photos/amaryllis/05.webp')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          opacity: 0.18,
          filter: "blur(2px)",
        }} />

        <div style={{
          position: "relative", zIndex: 2,
          maxWidth: 1080, margin: "0 auto", padding: "0 28px",
        }}>
          <div style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 11,
            letterSpacing: "0.6em", textTransform: "uppercase",
            color: "var(--c-gold)", marginBottom: 22,
          }}>Maintenant que vous savez tout</div>

          <h3 style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 200,
            fontSize: "clamp(34px, 5vw, 52px)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--c-ivory)", margin: "0 0 16px", lineHeight: 1.05,
          }}>
            Réservez votre{" "}
            <em style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic", fontWeight: 400,
              color: "var(--c-coral)", letterSpacing: 0, textTransform: "none",
            }}>séjour</em>
          </h3>

          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic", fontSize: 19,
            color: "rgba(250,245,233,0.85)",
            maxWidth: 540, margin: "0 auto 36px", lineHeight: 1.55,
          }}>
            Sept villas. Une équipe locale. Pas de frais cachés. Le reste, c'est à vous d'en faire un voyage.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/" style={{
              background: "var(--c-coral)", color: "#fff",
              padding: "14px 28px", borderRadius: 6,
              fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12,
              letterSpacing: "0.14em", textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(196,114,84,0.45)",
            }}>Voir les villas →</a>
            <a
              href="https://wa.me/33610880772"
              target="_blank" rel="noopener noreferrer"
              style={{
                background: "#25D366", color: "#fff",
                padding: "14px 28px", borderRadius: 6,
                fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12,
                letterSpacing: "0.14em", textTransform: "uppercase",
                textDecoration: "none",
                boxShadow: "0 4px 18px rgba(37,211,102,0.30)",
              }}
            >WhatsApp — on en parle</a>
          </div>
        </div>
      </section>
    </>
  );
}
