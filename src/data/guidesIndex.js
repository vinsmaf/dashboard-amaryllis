// Index de TOUS les guides destination (nouveaux + existants), groupés par zone.
// Sert le maillage interne SEO sur /guide (liens HTML crawlables vers chaque guide).
// Léger (pas d'import lourd) — maintenir à la main si on ajoute un guide.
export const GUIDES_INDEX = [
  {
    zone: "Sud", label: "Sud — Sainte-Luce & alentours",
    items: [
      { emoji: "🏖️", nom: "Les Salines & Sainte-Anne", href: "/guide-sainte-anne" },
      { emoji: "🐢", nom: "Les Anses d'Arlet", href: "/guide-arlet" },
      { emoji: "🗿", nom: "Le Diamant & son Rocher", href: "/guide-le-diamant" },
      { emoji: "🗽", nom: "Mémorial Cap 110", href: "/guide-cap-110-anse-caffard-martinique" },
      { emoji: "🥃", nom: "Distilleries de rhum", href: "/guide-distilleries-martinique" },
      { emoji: "⛵", nom: "Marina du Marin", href: "/guide-marina-du-marin-martinique" },
      { emoji: "⚓", nom: "Les Trois-Îlets", href: "/guide-trois-ilets" },
      { emoji: "🛖", nom: "La Savane des Esclaves", href: "/guide-savane-des-esclaves-martinique" },
      { emoji: "🛥️", nom: "Pointe du Bout & Anse Mitan", href: "/guide-pointe-du-bout-anse-mitan-martinique" },
    ],
  },
  {
    zone: "Centre", label: "Centre — Fort-de-France & côte atlantique",
    items: [
      { emoji: "🌺", nom: "Jardin de Balata", href: "/guide-jardin-de-balata-martinique" },
      { emoji: "🏛️", nom: "Habitation Clément", href: "/guide-habitation-clement-martinique" },
      { emoji: "🤍", nom: "Fonds Blancs (Le François)", href: "/guide-francois-martinique" },
      { emoji: "🏰", nom: "Fort-de-France", href: "/guide-fort-de-france-martinique" },
      { emoji: "🥾", nom: "Presqu'île de la Caravelle", href: "/guide-presquile-caravelle-martinique" },
    ],
  },
  {
    zone: "Nord", label: "Nord — volcan, histoire & nature",
    items: [
      { emoji: "🌋", nom: "Montagne Pelée", href: "/guide-montagne-pelee-martinique" },
      { emoji: "⛪", nom: "Saint-Pierre", href: "/guide-saint-pierre-martinique" },
      { emoji: "🥃", nom: "Distillerie Depaz", href: "/guide-distillerie-depaz-martinique" },
      { emoji: "🏞️", nom: "Gorges de la Falaise", href: "/guide-gorges-de-la-falaise-martinique" },
      { emoji: "🏝️", nom: "Anse Couleuvre", href: "/guide-anse-couleuvre-martinique" },
      { emoji: "🌊", nom: "Grand-Rivière", href: "/guide-grand-riviere-martinique" },
      { emoji: "🎨", nom: "Le Carbet", href: "/guide-le-carbet-martinique" },
    ],
  },
  {
    zone: "Thématiques", label: "Par envie",
    items: [
      { emoji: "🥾", nom: "Randonnées en Martinique", href: "/guide-randonnees-martinique" },
      { emoji: "🤿", nom: "Plongée & snorkeling", href: "/guide-plongee-martinique" },
      { emoji: "🍤", nom: "Gastronomie créole", href: "/guide-gastronomie-martinique" },
    ],
  },
];
