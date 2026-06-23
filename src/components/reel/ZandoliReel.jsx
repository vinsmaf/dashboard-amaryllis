import ReelPlayer from "./ReelPlayer.jsx";

const SHOTS = [
  { src:"/photos/zandoli/03.webp", start:0.0,  end:8.0,  fromScale:1.00, toScale:1.14, fromX:-1.0, toX: 1.5, fromY: 0.0, toY:-0.8, dim:0.35 },
  { src:"/photos/zandoli/07.webp", start:7.5,  end:16.0, fromScale:1.16, toScale:1.00, fromX: 2.0, toX:-2.0, fromY: 0.5, toY: 0.0, dim:0.22 },
  { src:"/photos/zandoli/10.webp", start:15.5, end:23.5, fromScale:1.00, toScale:1.12, fromX: 0.0, toX: 0.0, fromY: 1.0, toY:-1.5, dim:0.20 },
  { src:"/photos/zandoli/01.webp", start:23.0, end:30.5, fromScale:1.12, toScale:1.00, fromX: 1.5, toX:-1.5, fromY: 0.0, toY: 1.0, dim:0.22 },
  { src:"/photos/zandoli/13.webp", start:30.0, end:37.0, fromScale:1.00, toScale:1.14, fromX:-1.5, toX: 2.0, fromY: 0.0, toY:-0.5, dim:0.25 },
  { src:"/photos/zandoli/05.webp", start:36.5, end:42.0, fromScale:1.00, toScale:1.08, fromX: 0.0, toX: 0.0, fromY: 0.0, toY:-1.0, dim:0.32 },
];

const FEATURES = [
  { icon:"🏊", label:"Piscine",    val:"Cascade privée" },
  { icon:"🌿", label:"Mezzanine",  val:"Espace détente" },
  { icon:"🏡", label:"Jardin",     val:"Tropical" },
  { icon:"🛏",  label:"2 chambres", val:"+ séjour" },
  { icon:"🚗", label:"Parking",    val:"Privé" },
  { icon:"✓",  label:"Direct",     val:"−15% Airbnb" },
];

export default function ZandoliReel(props) {
  return (
    <ReelPlayer
      shots={SHOTS}
      price="110"
      voyageurs="5"
      eyebrow="MARTINIQUE · SAINTE-LUCE"
      hookTitle="ZANDOLI"
      hookTitleSize={155}
      hookSubtitle="Piscine cascade · Mezzanine · Sainte-Luce"
      ltSupra="Logement · Sainte-Luce, Martinique"
      ltTitle="ZANDOLI"
      ltSub="Piscine privée · 5 voyageurs"
      rating="4,5"
      ratingCount="16 avis"
      features={FEATURES}
      reviewText="La piscine à cascade dans le jardin tropical, on n'a pas voulu partir. Parfait pour notre groupe de 5, l'hôte est ultra disponible."
      reviewAuthor="Sophie & famille 🇫🇷 · 4 nuits · Août 2024"
      ariaLabel="Reel Zandoli"
      {...props}
    />
  );
}
