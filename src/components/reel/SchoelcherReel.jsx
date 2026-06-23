import ReelPlayer from "./ReelPlayer.jsx";

const SHOTS = [
  { src:"/photos/schoelcher/16.webp", start:0.0,  end:8.0,  fromScale:1.00, toScale:1.14, fromX:-1.0, toX: 1.5, fromY: 0.0, toY:-0.8, dim:0.35 },
  { src:"/photos/schoelcher/05.webp", start:7.5,  end:16.0, fromScale:1.16, toScale:1.00, fromX: 2.0, toX:-2.0, fromY: 0.5, toY: 0.0, dim:0.22 },
  { src:"/photos/schoelcher/17.webp", start:15.5, end:23.5, fromScale:1.00, toScale:1.12, fromX: 0.0, toX: 0.0, fromY: 1.0, toY:-1.5, dim:0.20 },
  { src:"/photos/schoelcher/03.webp", start:23.0, end:30.5, fromScale:1.12, toScale:1.00, fromX: 1.5, toX:-1.5, fromY: 0.0, toY: 1.0, dim:0.22 },
  { src:"/photos/schoelcher/19.webp", start:30.0, end:37.0, fromScale:1.00, toScale:1.14, fromX:-1.5, toX: 2.0, fromY: 0.0, toY:-0.5, dim:0.25 },
  { src:"/photos/schoelcher/08.webp", start:36.5, end:42.0, fromScale:1.00, toScale:1.08, fromX: 0.0, toX: 0.0, fromY: 0.0, toY:-1.0, dim:0.32 },
];

const FEATURES = [
  { icon:"🌊", label:"Vue baie",     val:"Flamands" },
  { icon:"🏙", label:"Fort-de-France", val:"10 min" },
  { icon:"✨", label:"Standing",     val:"Appartement" },
  { icon:"🛏",  label:"Chambre",      val:"Lit double" },
  { icon:"🚗", label:"Parking",      val:"Privé" },
  { icon:"✓",  label:"Direct",       val:"−15% Airbnb" },
];

export default function SchoelcherReel(props) {
  return (
    <ReelPlayer
      shots={SHOTS}
      price="90"
      voyageurs="2"
      eyebrow="MARTINIQUE · SCHŒLCHER"
      hookTitle="BELLEVUE"
      hookTitleSize={140}
      hookSubtitle="Vue Baie des Flamands · Standing · Schœlcher"
      ltSupra="Appartement · Schœlcher, Martinique"
      ltTitle="BELLEVUE"
      ltSub="Vue panoramique · 2 voyageurs"
      rating="4,8"
      ratingCount="30 avis"
      features={FEATURES}
      reviewText="Appartement impeccable, vue Baie des Flamands depuis le lit. À deux pas de Fort-de-France sans le bruit. On revient."
      reviewAuthor="Nathalie & Pierre 🇫🇷 · 6 nuits · Décembre 2024"
      ariaLabel="Reel Bellevue Schœlcher"
      {...props}
    />
  );
}
