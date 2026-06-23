import ReelPlayer from "./ReelPlayer.jsx";

const SHOTS = [
  { src:"/photos/nogent/09.webp", start:0.0,  end:8.0,  fromScale:1.00, toScale:1.14, fromX:-1.0, toX: 1.5, fromY: 0.0, toY:-0.8, dim:0.35 },
  { src:"/photos/nogent/03.webp", start:7.5,  end:16.0, fromScale:1.16, toScale:1.00, fromX: 2.0, toX:-2.0, fromY: 0.5, toY: 0.0, dim:0.22 },
  { src:"/photos/nogent/10.webp", start:15.5, end:23.5, fromScale:1.00, toScale:1.12, fromX: 0.0, toX: 0.0, fromY: 1.0, toY:-1.5, dim:0.20 },
  { src:"/photos/nogent/05.webp", start:23.0, end:30.5, fromScale:1.12, toScale:1.00, fromX: 1.5, toX:-1.5, fromY: 0.0, toY: 1.0, dim:0.22 },
  { src:"/photos/nogent/08.webp", start:30.0, end:37.0, fromScale:1.00, toScale:1.14, fromX:-1.5, toX: 2.0, fromY: 0.0, toY:-0.5, dim:0.25 },
  { src:"/photos/nogent/06.webp", start:36.5, end:42.0, fromScale:1.00, toScale:1.08, fromX: 0.0, toX: 0.0, fromY: 0.0, toY:-1.0, dim:0.32 },
];

const FEATURES = [
  { icon:"🚇", label:"RER A",       val:"Paris 15 min" },
  { icon:"🌿", label:"Bord Marne",  val:"Calme & verdure" },
  { icon:"✨", label:"Élégant",     val:"Tout équipé" },
  { icon:"🛏",  label:"Chambre",     val:"Lit double" },
  { icon:"🚗", label:"Parking",     val:"Privé" },
  { icon:"✓",  label:"Direct",      val:"−15% Airbnb" },
];

export default function NogentReel(props) {
  return (
    <ReelPlayer
      shots={SHOTS}
      price="90"
      voyageurs="2"
      eyebrow="ÎLE-DE-FRANCE · NOGENT-SUR-MARNE"
      hookTitle="NOGENT"
      hookTitleSize={155}
      hookSubtitle="Bord de Marne · Paris 15 min · Calme"
      ltSupra="Appartement · Nogent-sur-Marne"
      ltTitle="NOGENT"
      ltSub="Bord de Marne · 2 voyageurs"
      rating="4,8"
      ratingCount="18 avis"
      features={FEATURES}
      reviewText="Appartement calme et élégant, à 15 min de Paris en RER. Tout était parfait pour notre week-end. Hôte très réactif."
      reviewAuthor="Clémence & Antoine 🇫🇷 · 3 nuits · Mars 2025"
      ariaLabel="Reel Nogent-sur-Marne"
      {...props}
    />
  );
}
