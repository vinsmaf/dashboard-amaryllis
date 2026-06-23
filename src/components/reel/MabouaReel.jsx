import ReelPlayer from "./ReelPlayer.jsx";

const SHOTS = [
  { src:"/photos/mabouya/13.webp", start:0.0,  end:8.0,  fromScale:1.00, toScale:1.14, fromX:-1.0, toX: 1.5, fromY: 0.0, toY:-0.8, dim:0.35 },
  { src:"/photos/mabouya/02.webp", start:7.5,  end:16.0, fromScale:1.16, toScale:1.00, fromX: 2.0, toX:-2.0, fromY: 0.5, toY: 0.0, dim:0.22 },
  { src:"/photos/mabouya/14.webp", start:15.5, end:23.5, fromScale:1.00, toScale:1.12, fromX: 0.0, toX: 0.0, fromY: 1.0, toY:-1.5, dim:0.20 },
  { src:"/photos/mabouya/09.webp", start:23.0, end:30.5, fromScale:1.12, toScale:1.00, fromX: 1.5, toX:-1.5, fromY: 0.0, toY: 1.0, dim:0.22 },
  { src:"/photos/mabouya/17.webp", start:30.0, end:37.0, fromScale:1.00, toScale:1.14, fromX:-1.5, toX: 2.0, fromY: 0.0, toY:-0.5, dim:0.25 },
  { src:"/photos/mabouya/05.webp", start:36.5, end:42.0, fromScale:1.00, toScale:1.08, fromX: 0.0, toX: 0.0, fromY: 0.0, toY:-1.0, dim:0.32 },
];

const FEATURES = [
  { icon:"🛁", label:"Jacuzzi",   val:"Privatif" },
  { icon:"🌿", label:"Terrasse",  val:"Jardin tropical" },
  { icon:"🌅", label:"Lumière",   val:"Studio cosy" },
  { icon:"🛏",  label:"Chambre",   val:"Lit double" },
  { icon:"🚗", label:"Parking",   val:"Privé" },
  { icon:"✓",  label:"Direct",    val:"−15% Airbnb" },
];

export default function MabouaReel(props) {
  return (
    <ReelPlayer
      shots={SHOTS}
      price="70"
      voyageurs="2"
      eyebrow="MARTINIQUE · SAINTE-LUCE"
      hookTitle="MABOUYA"
      hookTitleSize={145}
      hookSubtitle="Jacuzzi privatif · Studio cosy · Sainte-Luce"
      ltSupra="Studio · Sainte-Luce, Martinique"
      ltTitle="MABOUYA"
      ltSub="Jacuzzi privatif · 2 voyageurs"
      rating="4,5"
      ratingCount="11 avis"
      features={FEATURES}
      reviewText="Le jacuzzi privé sous les étoiles, on n'avait pas envie d'en sortir. Studio cosy, tout équipé, parfait pour une escapade à deux. Imbattable à ce prix."
      reviewAuthor="Marc & Julie 🇫🇷 · 5 nuits · Février 2025"
      ariaLabel="Reel Mabouya"
      {...props}
    />
  );
}
