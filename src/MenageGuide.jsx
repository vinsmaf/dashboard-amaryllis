// Guide procédures ménage — Amaryllis Locations
// Composant standalone imprimable pour les prestataires

const styles = {
  page: {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: "13px",
    color: "#111",
    background: "#fff",
    maxWidth: "900px",
    margin: "0 auto",
    padding: "32px 40px",
  },
  header: {
    borderBottom: "3px solid #111",
    paddingBottom: "16px",
    marginBottom: "32px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    margin: "0 0 4px 0",
  },
  subtitle: {
    fontSize: "12px",
    color: "#555",
    margin: 0,
  },
  printBtn: {
    float: "right",
    padding: "8px 18px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    borderBottom: "2px solid #111",
    paddingBottom: "6px",
    marginTop: "40px",
    marginBottom: "20px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  propertyCard: {
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginBottom: "32px",
    pageBreakInside: "avoid",
    breakInside: "avoid",
  },
  cardHeader: {
    background: "#111",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "3px 3px 0 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "700",
    margin: 0,
  },
  cardMeta: {
    fontSize: "12px",
    opacity: 0.8,
  },
  cardBody: {
    padding: "18px",
  },
  phaseTitle: {
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    color: "#333",
    borderLeft: "3px solid #111",
    paddingLeft: "8px",
    margin: "18px 0 8px 0",
  },
  checkList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 4px 0",
  },
  checkItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    padding: "3px 0",
    fontSize: "12.5px",
    lineHeight: "1.5",
  },
  checkbox: {
    width: "14px",
    height: "14px",
    border: "1.5px solid #555",
    borderRadius: "2px",
    flexShrink: 0,
    marginTop: "2px",
    display: "inline-block",
  },
  attention: {
    background: "#fffbe6",
    border: "1px solid #e6c800",
    borderRadius: "3px",
    padding: "10px 14px",
    marginTop: "14px",
    fontSize: "12px",
  },
  attentionTitle: {
    fontWeight: "700",
    marginBottom: "4px",
    fontSize: "12px",
  },
  attentionList: {
    margin: "4px 0 0 14px",
    padding: 0,
    listStyleType: "disc",
  },
  standards: {
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "18px",
    marginBottom: "32px",
  },
  standardsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },
  standardCol: {},
  standardSubtitle: {
    fontWeight: "700",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "6px",
    color: "#333",
  },
  standardList: {
    margin: "0 0 0 14px",
    padding: 0,
    fontSize: "12.5px",
    lineHeight: "1.7",
    listStyleType: "disc",
  },
  footer: {
    borderTop: "1px solid #ccc",
    marginTop: "40px",
    paddingTop: "14px",
    fontSize: "11px",
    color: "#777",
    display: "flex",
    justifyContent: "space-between",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  bold: { fontWeight: "700" },
};

const CHECK_ICON = () => <span style={styles.checkbox} />;

const CheckList = ({ items }) => (
  <ul style={styles.checkList}>
    {items.map((item, i) => (
      <li key={i} style={styles.checkItem}>
        <CHECK_ICON />
        <span dangerouslySetInnerHTML={{ __html: item }} />
      </li>
    ))}
  </ul>
);

const Phase = ({ title, items }) => (
  <div>
    <p style={styles.phaseTitle}>{title}</p>
    <CheckList items={items} />
  </div>
);

const Attention = ({ items }) => (
  <div style={styles.attention}>
    <p style={styles.attentionTitle}>Points d'attention</p>
    <ul style={styles.attentionList}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: "2px" }}>{item}</li>
      ))}
    </ul>
  </div>
);

const PropertyCard = ({ name, location, type, duree, frais, arrivee, menage, finition, attention }) => (
  <div style={styles.propertyCard}>
    <div style={styles.cardHeader}>
      <p style={styles.cardTitle}>{name} — {location}</p>
      <span style={styles.cardMeta}>{type} &nbsp;|&nbsp; Durée estimée : {duree} &nbsp;|&nbsp; Frais : {frais}</span>
    </div>
    <div style={styles.cardBody}>
      <div style={styles.twoCol}>
        <div>
          <Phase title="Phase 1 — Arrivée & vérifications" items={arrivee} />
          <Phase title="Phase 2 — Ménage pièce par pièce" items={menage} />
        </div>
        <div>
          <Phase title="Phase 3 — Finition & mise en place" items={finition} />
          <Attention items={attention} />
        </div>
      </div>
    </div>
  </div>
);

const PROPERTIES = [
  {
    name: "Villa Amaryllis",
    location: "Sainte-Luce",
    type: "T4 — 3 suites — Piscine débordement — Jacuzzi — Terrasse 100m² — Jardin tropical",
    duree: "4h30 à 5h00",
    frais: "180 €",
    arrivee: [
      "Photographier l'état général avant de commencer (entrée, salon, terrasse, piscine)",
      "Vérifier l'inventaire mobilier et signaler toute casse ou absence",
      "Récupérer toutes les clés (jeu principal + télécommandes portail/climatisation)",
      "Relever l'état du jacuzzi et de la piscine (eau, débris, flotteurs)",
      "Vérifier que le carbet est dégagé et que le barbecue est accessible",
      "Contrôler le niveau des produits ménagers et d'accueil — signaler les ruptures",
    ],
    menage: [
      "<strong>Suites (×3) :</strong> changer draps 100% coton, retirer poussières, nettoyer miroirs, vider poubelles, passer aspirateur + serpillière",
      "<strong>Salles de bains (×3) :</strong> désinfecter WC, lavabo, douche/baignoire, nettoyer joints, recharger savon/shampoing/gel douche",
      "<strong>Salon/séjour :</strong> nettoyer tables, canapés (coussinés), vitres, TV, climatisation (filtre à essuyer)",
      "<strong>Cuisine :</strong> dégraisser plan de travail, four, plaques, hotte, nettoyer réfrigérateur intérieur, vider et replacer poubelle",
      "<strong>Terrasse (100m²) :</strong> balayer, nettoyer salon de jardin, essuyer table, vérifier parasol",
      "<strong>Carbet/barbecue :</strong> nettoyer grille et bac du barbecue, essuyer surfaces, balayer sol carbet",
      "<strong>Piscine débordement :</strong> retirer les déchets de surface avec épuisette, signaler tout problème d'eau ou d'équipement",
      "<strong>Jacuzzi :</strong> vidange complète + nettoyage de la coque + rinçage — remplissage nouveau avant départ",
      "<strong>Jardin/abords :</strong> ramasser feuilles mortes sur allées, contrôler éclairage extérieur",
    ],
    finition: [
      "Lit(s) faits impeccablement — plis carrés ou rabats — drap de dessus tendu",
      "Serviettes de bain pliées en éventail ou roulées sur le lit (2 par voyageur + 2 de réserve)",
      "Serviettes piscine disposées sur les transats (1 par transat)",
      "Produits d'accueil rechargés : savon, shampoing, gel douche, café, thé, sucre",
      "Plateau de bienvenue : remettre en place si prévu",
      "Télécommandes, manuels et livret d'accueil repositionnés sur la table du salon",
      "Climatisation réglée à 24°C en mode auto",
      "Toutes les lumières éteintes, volets fermés si absence de voyageur",
      "Photos finales : salon, chaque suite, salle de bain, terrasse, piscine",
      "Transmettre la note de ménage + photos au gestionnaire (WhatsApp ou Drive)",
    ],
    attention: [
      "Jacuzzi : vidange obligatoire entre chaque séjour — ne jamais laisser l'eau du voyageur précédent",
      "Piscine débordement : ne pas utiliser de produits abrasifs sur le liner ou le bac de compensation",
      "Climatisation : essuyer les filtres à chaque rotation — ne pas les laver à l'eau",
      "Jardin tropical : signaler tout arbre penché ou cocotier potentiellement dangereux",
      "Fenêtre ménage 12h–17h — signaler immédiatement si dépassement prévisible",
    ],
  },
  {
    name: "Zandoli",
    location: "Sainte-Luce",
    type: "T2 — Piscine privée — Jardin tropical",
    duree: "2h00 à 2h30",
    frais: "70 €",
    arrivee: [
      "Photos de l'état général dès l'arrivée (salon, chambre, cuisine, extérieur, piscine)",
      "Vérifier l'inventaire mobilier et signaler toute anomalie",
      "Récupérer les clés et éventuelles télécommandes",
      "Contrôler l'état de la piscine (eau, débris, équipement)",
      "Vérifier le niveau des produits d'accueil et ménagers",
    ],
    menage: [
      "<strong>Chambre :</strong> changer draps, dépoussiérer, nettoyer miroir, vider poubelle, aspirer + laver sol",
      "<strong>Salle de bain :</strong> désinfecter WC, lavabo, douche, recharger produits d'accueil",
      "<strong>Salon/cuisine :</strong> nettoyer surfaces, plaques, réfrigérateur intérieur, hotte, vider poubelle",
      "<strong>Terrasse/extérieur :</strong> balayer, essuyer mobilier de jardin, nettoyer table",
      "<strong>Piscine privée :</strong> épuisette surface, contrôle visuel eau, signaler anomalie technicien",
      "<strong>Jardin :</strong> ramasser feuilles sur allées et contour piscine",
    ],
    finition: [
      "Lit fait soigneusement — draps tendus, oreiller carré ou rabattu",
      "Serviettes de bain : 2 par voyageur + 2 réserve, pliées sur le lit",
      "Serviettes piscine disposées sur les transats",
      "Produits d'accueil rechargés : savon, shampoing, café/thé",
      "Livret d'accueil repositionné sur la table salon",
      "Climatisation réglée à 24°C",
      "Photos finales : chambre, salon, salle de bain, extérieur piscine",
      "Transmettre note de ménage + photos au gestionnaire",
    ],
    attention: [
      "Piscine privée : ne pas utiliser de produits non prévus par le technicien piscine",
      "Jardin tropical : vérifier absence de fruits tombés ou nid de guêpes",
      "Signaler toute fuite ou anomalie eau (robinets, douche, piscine)",
    ],
  },
  {
    name: "Géko",
    location: "Sainte-Luce",
    type: "T2 — Piscine privée",
    duree: "2h00 à 2h30",
    frais: "70 €",
    arrivee: [
      "Photos de l'état général dès l'arrivée (chambre, salon, cuisine, piscine)",
      "Vérifier l'inventaire mobilier — signaler anomalie",
      "Récupérer les clés",
      "Contrôler l'état de la piscine privée",
      "Vérifier les stocks de produits d'accueil",
    ],
    menage: [
      "<strong>Chambre :</strong> changer draps, dépoussiérer, nettoyer miroir, aspirer + laver sol",
      "<strong>Salle de bain :</strong> désinfecter WC, lavabo, douche, recharger produits",
      "<strong>Salon/cuisine :</strong> nettoyer surfaces, plaques, réfrigérateur, hotte, vider poubelle",
      "<strong>Extérieur/terrasse :</strong> balayer, essuyer mobilier",
      "<strong>Piscine privée :</strong> épuisette surface, contrôle visuel, signaler anomalie",
    ],
    finition: [
      "Lit fait soigneusement — draps tendus",
      "Serviettes de bain : 2 par voyageur + 2 réserve",
      "Serviettes piscine sur les transats",
      "Produits d'accueil rechargés",
      "Livret d'accueil en place",
      "Climatisation réglée à 24°C",
      "Photos finales : chambre, salon, salle de bain, piscine",
      "Transmettre note + photos au gestionnaire",
    ],
    attention: [
      "Piscine privée : ne pas utiliser de produits abrasifs ou non homologués",
      "Signaler toute anomalie électrique (prises, éclairage extérieur)",
      "Vérifier que la porte/portillon piscine ferme bien (sécurité)",
    ],
  },
  {
    name: "Mabouya",
    location: "Sainte-Luce",
    type: "Studio — Jacuzzi privatif extérieur",
    duree: "1h30 à 2h00",
    frais: "50 €",
    arrivee: [
      "Photos de l'état général (studio, salle de bain, jacuzzi extérieur)",
      "Vérifier l'inventaire — signaler anomalie",
      "Récupérer les clés",
      "Contrôler l'état du jacuzzi (eau, propreté, couvercle)",
      "Vérifier stocks produits d'accueil",
    ],
    menage: [
      "<strong>Studio (pièce principale) :</strong> changer draps, dépoussiérer, aspirer + laver sol, nettoyer miroirs, vider poubelle",
      "<strong>Kitchenette :</strong> nettoyer plan de travail, plaques, réfrigérateur, vider poubelle",
      "<strong>Salle de bain :</strong> désinfecter WC, lavabo, douche, recharger produits d'accueil",
      "<strong>Jacuzzi privatif extérieur :</strong> vidange complète + nettoyage coque intérieure + rinçage — remplissage nouveau",
      "<strong>Extérieur :</strong> balayer la terrasse/abords du jacuzzi, essuyer surfaces",
    ],
    finition: [
      "Lit fait soigneusement",
      "Serviettes de bain : 2 par voyageur + 2 réserve",
      "Serviettes jacuzzi : 2, disposées à proximité",
      "Produits d'accueil rechargés : savon, shampoing, café/thé",
      "Livret d'accueil repositionné",
      "Climatisation réglée à 24°C",
      "Photos finales : studio, salle de bain, jacuzzi extérieur",
      "Transmettre note + photos au gestionnaire",
    ],
    attention: [
      "Jacuzzi : vidange obligatoire entre chaque séjour — ne jamais laisser l'eau du voyageur précédent",
      "Vérifier que le couvercle du jacuzzi ferme correctement après remplissage",
      "Contrôler l'éclairage extérieur du jacuzzi (LED, câbles apparents)",
      "Studio : espace petit — soigner l'organisation et le rangement visible",
    ],
  },
  {
    name: "Schœlcher",
    location: "Schœlcher",
    type: "T2 — Vue mer — Appartement",
    duree: "2h00 à 2h30",
    frais: "70 €",
    arrivee: [
      "Photos de l'état général dès l'arrivée (chambre, salon, cuisine, terrasse vue mer)",
      "Vérifier l'inventaire mobilier — signaler toute anomalie",
      "Récupérer les clés (appartement + boîte aux lettres si applicable)",
      "Vérifier l'état de la terrasse et la propreté générale",
      "Contrôler les stocks de produits d'accueil",
    ],
    menage: [
      "<strong>Chambre :</strong> changer draps, dépoussiérer, nettoyer miroir, aspirer + laver sol, vider poubelle",
      "<strong>Salle de bain :</strong> désinfecter WC, lavabo, douche, nettoyer carrelage, recharger produits d'accueil",
      "<strong>Salon :</strong> nettoyer surfaces, TV, vitres (vue mer — essentiel !), vider poubelle",
      "<strong>Cuisine :</strong> dégraisser plan de travail, four, plaques, hotte, nettoyer réfrigérateur, vider poubelle",
      "<strong>Terrasse vue mer :</strong> balayer, essuyer salon extérieur, nettoyer rambardes et vitres coulissantes",
    ],
    finition: [
      "Lit fait soigneusement",
      "Serviettes : 2 par voyageur + 2 réserve, pliées",
      "Produits d'accueil rechargés : savon, shampoing, café/thé",
      "Livret d'accueil repositionné",
      "Climatisation réglée à 24°C",
      "Portes et fenêtres vérifiées (sécurité appartement)",
      "Photos finales : chambre, salon, terrasse vue mer",
      "Transmettre note + photos au gestionnaire",
    ],
    attention: [
      "Vitres et baies vitrées : priorité absolue — vue mer = critère qualité numéro 1 pour les voyageurs",
      "Appartement en résidence : respecter les parties communes, ne pas laisser chariot ou matériel dans le couloir",
      "Vérifier que la porte d'entrée est bien fermée à clé en partant",
      "Signaler toute anomalie liée à l'humidité (condensation, traces)",
    ],
  },
  {
    name: "Nogent",
    location: "Nogent-sur-Marne",
    type: "T2 — 39m² — Terrasse — Longue durée",
    duree: "1h30 à 2h00",
    frais: "45 €",
    arrivee: [
      "Photos de l'état général dès l'arrivée (chambre, salon, cuisine, terrasse)",
      "Vérifier l'inventaire mobilier — signaler anomalie",
      "Récupérer les clés (appartement + boîte aux lettres + interphone si applicable)",
      "Contrôler l'état de la terrasse",
      "Vérifier les stocks de produits d'accueil (adapté longue durée : quantités moindres)",
    ],
    menage: [
      "<strong>Chambre :</strong> changer draps, dépoussiérer, nettoyer miroir, aspirer + laver sol, vider poubelle",
      "<strong>Salle de bain :</strong> désinfecter WC, lavabo, douche/baignoire, nettoyer joints, recharger produits",
      "<strong>Salon :</strong> nettoyer surfaces, TV, dépoussiérer, aspirer + laver sol",
      "<strong>Cuisine :</strong> dégraisser plan de travail, four, plaques, réfrigérateur intérieur, vider poubelle",
      "<strong>Terrasse :</strong> balayer, essuyer mobilier extérieur si présent",
    ],
    finition: [
      "Lit fait soigneusement",
      "Serviettes : 2 par voyageur + 2 réserve",
      "Produits d'accueil : savon, shampoing, café/thé (dosage adapté longue durée)",
      "Livret d'accueil en place",
      "Chauffage ou climatisation selon saison (hors saison : ne pas laisser éteint en hiver — régler à 16°C mini)",
      "Fermer à clé et vérifier toutes les fenêtres",
      "Photos finales : chambre, salon, cuisine, terrasse",
      "Transmettre note + photos au gestionnaire",
    ],
    attention: [
      "Appartement IDF : procédures légèrement différentes (pas de piscine/jacuzzi — focus propreté intérieure)",
      "Longue durée : un ménage de mi-séjour peut être prévu — confirmer avec le gestionnaire",
      "Hiver : vérifier que le chauffage fonctionne et est réglé correctement",
      "Terrasse : vérifier absence de feuilles accumulées et état du mobilier (conditions hivernales)",
      "Signaler tout signe d'humidité ou de moisissure (appartement urbain)",
    ],
  },
];

const STANDARDS = [
  {
    title: "Linge de lit",
    items: [
      "Draps 100% coton blanc ou ivoire exclusivement",
      "3 sets minimum par chambre en stock",
      "Draps changés à chaque départ voyageur — sans exception",
      "Plis nets : rabat de 20 cm, coussin carré bien orienté",
      "Signaler tout drap taché, déchiré ou jauni pour remplacement",
    ],
  },
  {
    title: "Serviettes",
    items: [
      "2 serviettes de bain par voyageur + 2 de réserve",
      "Serviettes de plage/piscine séparées des serviettes de bain",
      "Pliage soigné : éventail, rouleau ou carré selon préférence de la propriété",
      "Serviettes piscine : 1 par transat, repliées proprement",
      "Serviettes tachées ou râpées : mettre de côté pour signalement",
    ],
  },
  {
    title: "Produits d'accueil",
    items: [
      "Savon liquide mains rechargé à chaque rotation",
      "Shampoing + gel douche : vérifier niveau et compléter si < 30%",
      "Café, thé, sucre : réassort systématique",
      "Papier toilette : minimum 2 rouleaux en place + stock sous le meuble",
      "Ne jamais laisser un produit vide visible par le voyageur",
    ],
  },
  {
    title: "Photos obligatoires",
    items: [
      "Photos avant : dès l'arrivée, avant toute intervention",
      "Photos après : lit fait, salle de bain, cuisine, extérieur",
      "Envoyer via WhatsApp ou Drive dans les 30 min après la fin du ménage",
      "En cas de dégât ou casse : photo immédiate + signalement gestionnaire",
    ],
  },
  {
    title: "Climatisation",
    items: [
      "Filtres essuyés à chaque changement de voyageur (chiffon sec)",
      "Réglage de départ : 24°C, mode auto",
      "Ne jamais laver les filtres à l'eau — endommagement garanti",
      "Signaler tout bruit anormal, mauvaise odeur ou dysfonctionnement",
    ],
  },
  {
    title: "Signalement & communication",
    items: [
      "Toute anomalie (casse, panne, absence d'objet) signalée immédiatement par WhatsApp",
      "Note de ménage transmise dans les 30 min après fin d'intervention",
      "Dépassement de la fenêtre 12h–17h : prévenir le gestionnaire AVANT 14h",
      "En cas d'urgence (fuite, panne électrique) : appeler directement, ne pas attendre",
    ],
  },
];

export default function MenageGuide() {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={styles.page}>
      <style>{`
        @media print {
          button { display: none !important; }
          body { margin: 0; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>

      {/* En-tête */}
      <div style={styles.header}>
        <button style={styles.printBtn} onClick={() => window.print()}>
          Imprimer
        </button>
        <h1 style={styles.title}>Guide procédures ménage — Amaryllis Locations</h1>
        <p style={styles.subtitle}>
          Document interne prestataires &nbsp;·&nbsp; Mise à jour : {today} &nbsp;·&nbsp; Confidentiel
        </p>
      </div>

      {/* Standards généraux — placés en premier pour lecture rapide */}
      <h2 style={styles.sectionTitle}>Standards généraux Amaryllis</h2>
      <div style={styles.standards}>
        <div style={styles.standardsGrid}>
          {STANDARDS.map((s) => (
            <div key={s.title} style={styles.standardCol}>
              <p style={styles.standardSubtitle}>{s.title}</p>
              <ul style={styles.standardList}>
                {s.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Timings */}
      <div style={{
        background: "#f5f5f5",
        border: "1px solid #ddd",
        borderRadius: "4px",
        padding: "12px 18px",
        marginBottom: "32px",
        fontSize: "12.5px",
      }}>
        <strong>Timings standards :</strong>&nbsp;
        Check-out voyageur 12h00 &nbsp;·&nbsp; Fenêtre ménage 12h00 → 17h00 (5h max) &nbsp;·&nbsp; Check-in voyageur 17h00
        &nbsp;·&nbsp; <strong>Dépassement prévisible : prévenir le gestionnaire avant 14h00</strong>
      </div>

      {/* Fiches propriétés */}
      <h2 style={styles.sectionTitle}>Fiches par propriété</h2>
      {PROPERTIES.map((p) => (
        <PropertyCard key={p.name} {...p} />
      ))}

      {/* Pied de page */}
      <div style={styles.footer}>
        <span>Amaryllis Locations — Document interne prestataires — Ne pas diffuser</span>
        <span>Mis à jour le {today}</span>
      </div>
    </div>
  );
}
