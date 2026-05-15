import { useState, useEffect, useRef, useCallback } from "react";

// ── Color palette ────────────────────────────────────────────────
const IVORY  = "#FAF7F2";  // main background
const CREAM  = "#F0E8DC";  // card/modal background
const NAVY   = "#1B2856";  // header bg, primary text
const CORAL  = "#C8553D";  // accent - CTAs, active states, highlights
const SAND   = "#E8DDD0";  // borders, dividers
const TEXT   = "#1B2856";  // same as navy for body text
const MUTED  = "#7A6B5A";  // warm brown for secondary text
const GOLD   = "#C4922A";  // star ratings

// ── CSS Animations ────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("__site_styles")) {
  const s = document.createElement("style");
  s.id = "__site_styles";
  s.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes floatLeaf { 0%,100% { transform:translateY(0) rotate(-3deg); } 50% { transform:translateY(-12px) rotate(3deg); } }
    @keyframes bloomIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
    ::selection { background:rgba(200,85,61,0.2); color:#1B2856; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:#FAF7F2; }
    ::-webkit-scrollbar-thumb { background:rgba(200,85,61,0.3); border-radius:2px; }
  `;
  document.head.appendChild(s);
}

const STRIPE_PK = "pk_test_51N1fVbAM2ySp09YCENcn4NcGi4xM7BzNCra9HU3ildZKLAHPzCOsY6ItlpxrttT1owXCUSKQrfPrIXsZSWPLrQsd00SDmMsWvX";

const AB = "https://a0.muscache.com/im/pictures/";

const BIENS = [
  {
    id: "amaryllis",
    nom: "Villa Amaryllis",
    airbnbTitle: "Villa Amaryllis - Luxe & sérénité Vue Mer, Piscine",
    lieu: "Sainte-Luce, Martinique",
    tag: "⭐ Coup de cœur Airbnb",
    desc: "Perchée sur les hauteurs de Sainte-Luce, bercée par les alizés, la Villa Amaryllis vous invite à un séjour d'exception. Piscine à débordement d'eau salée, jacuzzi privatif, terrasse 100m² face à la mer des Caraïbes et à l'île Sainte-Lucie. Les plages de sable blanc à 5 min.",
    prix: 280,
    capacite: 8,
    chambres: 3,
    lits: 3,
    sdb: "3,5",
    rating: "4,94",
    reviews: 33,
    couleur: "#e91e8c",
    photos: [
      AB+"miso/Hosting-54269844/original/735d43eb-5738-440a-965a-795113b942b0.jpeg",
      AB+"hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6NTQyNjk4NDQ=/original/f09065db-ef09-440c-9631-fffa796042eb.jpeg",
      AB+"hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6NTQyNjk4NDQ=/original/ed612b06-7abf-49d8-97b3-344bfa556264.jpeg",
      AB+"miso/Hosting-54269844/original/9bbddd9d-0b65-4705-a51a-dda4c1c9e439.jpeg",
      AB+"hosting/Hosting-54269844/original/7ddc5186-f42b-4706-98c1-9163aab4dc6d.jpeg",
    ],
    amenities: ["Piscine débordement", "Jacuzzi privé", "Vue océan", "Wifi 127 Mb/s", "Parking", "Animaux OK"],
  },
  {
    id: "zandoli",
    nom: "Zandoli",
    airbnbTitle: "Zandoli : détente tropicale, piscine, jardin, vue mer",
    lieu: "Sainte-Luce, Martinique",
    tag: null,
    desc: "Cocon tropical niché à Sainte-Luce avec 2 chambres dont une mezzanine au charme unique. Piscine privée, terrasse ensoleillée, vue mer. Netflix, Disney+, lave-linge inclus. Plages et distilleries à proximité.",
    prix: 220,
    capacite: 5,
    chambres: 2,
    lits: 3,
    sdb: "1",
    rating: "4,5",
    reviews: 16,
    couleur: "#06b6d4",
    photos: [
      AB+"hosting/Hosting-792768220924504884/original/87d71613-6f4b-4730-8101-c15f88d34221.jpeg",
      AB+"hosting/Hosting-792768220924504884/original/417079fe-ae00-458f-b589-4b61487788d5.jpeg",
      AB+"hosting/Hosting-792768220924504884/original/f3de185b-36ac-4bc7-8a28-ddf2aab2dd68.jpeg",
      AB+"hosting/Hosting-792768220924504884/original/6c090336-0211-4c51-8f66-6e760a37fee9.jpeg",
      AB+"hosting/Hosting-792768220924504884/original/64c63a70-79ad-4626-92d4-d20c5916349b.jpeg",
    ],
    amenities: ["Piscine privée", "Vue mer", "Jardin", "Netflix/Disney+", "Lave-linge", "Wifi 123 Mb/s"],
  },
  {
    id: "iguana",
    nom: "Villa Iguana",
    airbnbTitle: "Villa Iguana, vue mer et rocher du Diamant, piscine",
    lieu: "Sainte-Luce, Martinique",
    tag: null,
    desc: "Villa avec piscine d'eau salée et vue imprenable sur la baie et le rocher du Diamant. 2 chambres, terrasse panoramique. Wifi 126 Mb/s, parking inclus, animaux acceptés.",
    prix: 180,
    capacite: 6,
    chambres: 2,
    lits: 3,
    sdb: "1",
    rating: "4,75",
    reviews: 4,
    couleur: "#22c55e",
    photos: [
      AB+"afdbde92-b993-4561-b150-114f36bfe545.jpg",
      AB+"dc251801-0050-4edc-8bec-d347c4ffa7bf.jpg",
      AB+"miso/Hosting-661013712794640840/original/f2c846ce-3c86-4e8a-8c21-7d1c0190ad63.jpeg",
      AB+"hosting/Hosting-661013712794640840/original/47f479ea-6667-492b-929d-616ed86b0791.jpeg",
      AB+"hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6NjYxMDEzNzEyNzk0NjQwODQw/original/f343b178-6e0f-4b41-8944-33da5ae3ba36.jpeg",
    ],
    amenities: ["Piscine eau salée", "Vue Diamant", "Vue océan", "Wifi 126 Mb/s", "Parking", "Animaux OK"],
  },
  {
    id: "geko",
    nom: "Géko",
    airbnbTitle: "Géko, détente, zen, piscine & jardin tropical",
    lieu: "Sainte-Luce, Martinique",
    tag: null,
    desc: "Refuge paisible au sein de la résidence Amaryllis. Jardin tropical luxuriant, piscine rafraîchissante, brise des alizés. À 7 min des plages de sable blanc. Clim, TV, lave-linge inclus.",
    prix: 150,
    capacite: 4,
    chambres: 1,
    lits: 2,
    sdb: "1",
    rating: "4,83",
    reviews: 23,
    couleur: "#f59e0b",
    photos: [
      AB+"hosting/Hosting-1263155865459755724/original/62cb1f91-7147-483b-b4c7-0cba1b717f28.jpeg",
      AB+"hosting/Hosting-1263155865459755724/original/ec05d0b0-3284-4844-8cac-c4800d4f6b0b.jpeg",
      AB+"hosting/Hosting-1263155865459755724/original/60c58f78-a59b-4da2-aa05-576b65cf9ab9.jpeg",
      AB+"hosting/Hosting-1263155865459755724/original/b501ee9a-e617-495e-9ee9-6552c83160a2.jpeg",
      AB+"hosting/Hosting-1263155865459755724/original/44a86db1-fb7e-49f0-bd8f-5760fabe76ed.jpeg",
    ],
    amenities: ["Piscine", "Jardin tropical", "Climatisation", "Lave-linge", "TV", "Wifi 128 Mb/s"],
  },
  {
    id: "mabouya",
    nom: "Mabouya",
    airbnbTitle: "Mabouya | Jacuzzi privatif, Jardin fleuri, vue mer",
    lieu: "Sainte-Luce, Martinique",
    tag: null,
    desc: "Havre de paix à flanc de colline avec jacuzzi privatif, jardin fleuri et vue mer enchanteresse. Idéal pour une escapade romantique ou ressourçante. Plages et distilleries à quelques minutes.",
    prix: 110,
    capacite: 2,
    chambres: 1,
    lits: 1,
    sdb: "1",
    rating: "4,55",
    reviews: 11,
    couleur: "#84cc16",
    photos: [
      AB+"miso/Hosting-1046596752160926069/original/61cd5a5f-0a20-4043-ba57-9b35d7dd276a.jpeg",
      AB+"miso/Hosting-1046596752160926069/original/267544c9-a0f4-497b-9506-1c617f9dd304.jpeg",
      AB+"miso/Hosting-1046596752160926069/original/bd7afe4d-5863-4bb3-898e-79377737c5e3.jpeg",
      AB+"miso/Hosting-1046596752160926069/original/5414f301-4647-49af-b4f3-2ad10985eb29.jpeg",
      AB+"miso/Hosting-1046596752160926069/original/f68c6704-d68b-4001-b671-f3c2eb009ebd.jpeg",
    ],
    amenities: ["Jacuzzi privatif", "Vue mer", "Jardin fleuri", "Wifi 81 Mb/s", "Parking", "Animaux OK"],
  },
  {
    id: "schoelcher",
    nom: "T2 Schœlcher",
    airbnbTitle: "Appartement de standing calme, splendide vue mer",
    lieu: "Schœlcher, Martinique",
    tag: null,
    desc: "Appartement de standing calme avec splendide vue sur la baie, proche de Fort-de-France. Terrasse, parking, TV HD. Idéal pour découvrir le nord de la Martinique.",
    prix: 100,
    capacite: 2,
    chambres: 1,
    lits: 1,
    sdb: "1",
    rating: "4,8",
    reviews: 30,
    couleur: "#8b5cf6",
    photos: [
      AB+"miso/Hosting-24242415/original/8fa46b75-28f0-4b0c-bfc7-24a4ccd323fd.jpeg",
      AB+"67d28a00-2b86-48c8-ad24-101fe136aa8a.jpg",
      AB+"miso/Hosting-24242415/original/271329a6-0166-4654-a6df-cabafa456deb.jpeg",
      AB+"hosting/Hosting-24242415/original/c2d6324a-715f-4567-acf8-5722ea54e2e2.jpeg",
      AB+"miso/Hosting-24242415/original/d05cb282-f261-4f54-9211-90766aaa2684.jpeg",
    ],
    amenities: ["Vue baie", "Terrasse", "TV HD", "Wifi", "Parking", "Animaux OK"],
  },
  {
    id: "nogent",
    nom: "T2 Nogent-sur-Marne",
    airbnbTitle: "Appartement de standing avec jardin, proche Paris",
    lieu: "Nogent-sur-Marne, Île-de-France",
    tag: null,
    desc: "Bel appartement T2 lumineux avec jardin au bord de la Marne. Décoré avec soin, calme et verdure à 20 min de Paris par le RER A.",
    prix: 85,
    capacite: 3,
    chambres: 1,
    lits: 1,
    sdb: "1",
    rating: null,
    reviews: null,
    couleur: "#64748b",
    photos: [
      AB+"35de3bd4-d391-4b8b-9b8d-7b2d07fdb0b7.jpg",
    ],
    amenities: ["Bord Marne", "Jardin", "RER A (20 min Paris)", "Parking", "Wifi"],
  },
];

// ── Utilities ────────────────────────────────────────────────────
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(ds, n) {
  const d = new Date(ds + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function dateDiff(a, b) {
  return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
}
function formatDateLong(ds) {
  if (!ds) return "";
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}
function formatDateShort(ds) {
  if (!ds) return "";
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ── Calendar ─────────────────────────────────────────────────────
const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function CalendarMonth({ year, month, checkin, checkout, hovered, blockedDates, onSelect, onHover }) {
  const todayStr = today();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDow = (firstDay.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  function getState(ds) {
    if (!ds) return "empty";
    if (ds < todayStr) return "past";
    if (blockedDates.includes(ds)) return "blocked";
    if (ds === checkin) return "checkin";
    if (ds === checkout) return "checkout";
    const end = checkout || hovered;
    if (checkin && end && ds > checkin && ds < end) return "range";
    return "free";
  }

  return (
    <div style={{ flex: "1 1 240px" }}>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, marginBottom: 12, color: NAVY }}>
        {MONTHS_FR[month]} {year}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, color: MUTED, padding: "4px 0", fontWeight: 600 }}>{w}</div>
        ))}
        {cells.map((ds, i) => {
          const state = getState(ds);
          const isCI = state === "checkin";
          const isCO = state === "checkout";
          const inRange = state === "range";
          const blocked = state === "blocked";
          const past = state === "past";
          const disabled = blocked || past || !ds;

          let bg = "transparent";
          let color = "#94a3b8";
          let borderRadius = "8px";
          let fontWeight = 400;

          if (isCI || isCO) { bg = CORAL; color = "#fff"; fontWeight = 700; }
          else if (inRange) { bg = `rgba(200,85,61,0.10)`; color = "#7A3020"; borderRadius = "0"; }
          if (isCI) borderRadius = "8px 0 0 8px";
          if (isCO) borderRadius = "0 8px 8px 0";

          return (
            <div
              key={i}
              onMouseEnter={() => !disabled && checkin && !checkout && onHover(ds)}
              onClick={() => !disabled && onSelect(ds)}
              style={{
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                cursor: disabled ? "default" : "pointer",
                background: bg,
                color: blocked ? "#D4C8BC" : past ? "#D4C8BC" : color,
                borderRadius,
                fontWeight,
                textDecoration: blocked ? "line-through" : "none",
                opacity: past ? 0.4 : 1,
                position: "relative",
                transition: "background 0.1s",
                userSelect: "none",
              }}
            >
              {ds ? parseInt(ds.split("-")[2]) : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateRangePicker({ checkin, checkout, blockedDates = [], onChange }) {
  const todayStr = today();
  const initY = new Date().getFullYear();
  const initM = new Date().getMonth();
  const [offset, setOffset] = useState(0);
  const [hovered, setHovered] = useState(null);

  const m1 = (initM + offset) % 12;
  const y1 = initY + Math.floor((initM + offset) / 12);
  const m2 = (initM + offset + 1) % 12;
  const y2 = initY + Math.floor((initM + offset + 1) / 12);

  function handleSelect(ds) {
    if (!checkin || (checkin && checkout)) {
      onChange(ds, null);
    } else if (ds <= checkin) {
      onChange(ds, null);
    } else {
      // Check no blocked date strictly between checkin and ds
      let cur = addDays(checkin, 1);
      let hasBlocked = false;
      while (cur < ds) {
        if (blockedDates.includes(cur)) { hasBlocked = true; break; }
        cur = addDays(cur, 1);
      }
      if (hasBlocked) onChange(ds, null);
      else onChange(checkin, ds);
    }
    setHovered(null);
  }

  const canPrev = offset > 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => canPrev && setOffset(o => o - 1)} style={{ ...iconBtn, opacity: canPrev ? 1 : 0.2 }}>‹</button>
        <div style={{ fontSize: 13, color: MUTED }}>
          {!checkin ? "Choisir la date d'arrivée" : !checkout ? "Choisir la date de départ" : `${formatDateShort(checkin)} → ${formatDateShort(checkout)}`}
        </div>
        <button onClick={() => setOffset(o => o + 1)} style={iconBtn}>›</button>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <CalendarMonth year={y1} month={m1} checkin={checkin} checkout={checkout} hovered={hovered} blockedDates={blockedDates} onSelect={handleSelect} onHover={setHovered} />
        <CalendarMonth year={y2} month={m2} checkin={checkin} checkout={checkout} hovered={hovered} blockedDates={blockedDates} onSelect={handleSelect} onHover={setHovered} />
      </div>
      {checkin && checkout && (
        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button onClick={() => { onChange(null, null); setHovered(null); }} style={{ fontSize: 12, color: MUTED, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Effacer les dates
          </button>
        </div>
      )}
    </div>
  );
}

const iconBtn = {
  background: "none",
  border: `1px solid ${SAND}`,
  color: MUTED,
  width: 32, height: 32, borderRadius: 8, cursor: "pointer",
  fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
};

// ── Booking Modal ────────────────────────────────────────────────
function BookingModal({ bien, blockedDates, loadingAvail, onClose }) {
  const [step, setStep] = useState(1);
  const [checkin, setCheckin] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", tel: "", message: "" });
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const elRef = useRef(null);

  const nights = checkin && checkout ? dateDiff(checkin, checkout) : 0;
  const total = nights * bien.prix;
  const formOk = form.prenom && form.nom && form.email && form.email.includes("@");

  useEffect(() => {
    if (window.Stripe) setStripe(window.Stripe(STRIPE_PK));
  }, []);

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function goToPayment() {
    setPaying(true); setPayError("");
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total * 100, currency: "eur", metadata: { bienId: bien.id, checkin, checkout, voyageur: `${form.prenom} ${form.nom}` } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const el = stripe.elements({ clientSecret: data.clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: CORAL, borderRadius: "8px", colorBackground: CREAM, colorText: NAVY } } });
      const pe = el.create("payment");
      setElements(el);
      setStep(3);
      setTimeout(() => pe.mount("#spe"), 100);
    } catch (e) { setPayError(e.message); }
    setPaying(false);
  }

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true); setPayError("");
    const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: window.location.origin + "/merci" } });
    if (error) setPayError(error.message);
    setPaying(false);
  }

  const steps = ["Dates", "Coordonnées", "Paiement"];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(27,40,86,0.7)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{
        background: CREAM,
        border: `1px solid ${SAND}`,
        borderRadius: 20,
        padding: "32px",
        maxWidth: 680, width: "100%",
        maxHeight: "92vh", overflowY: "auto",
        position: "relative",
        boxShadow: `0 24px 64px rgba(27,40,86,0.15)`,
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: CORAL, fontWeight: 700, letterSpacing: 3, marginBottom: 6, textTransform: "uppercase" }}>RÉSERVATION DIRECTE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>{bien.nom}</div>
            <div style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>📍 {bien.lieu}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: SAND, border: `1px solid ${SAND}`,
              color: MUTED, width: 36, height: 36, borderRadius: 10,
              cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32, alignItems: "center" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flex: i < steps.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: step > i + 1 ? CORAL : step === i + 1 ? CORAL : "rgba(27,40,86,0.06)",
                  border: `1px solid ${step >= i + 1 ? CORAL : SAND}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: step > i + 1 ? "#fff" : step === i + 1 ? "#fff" : MUTED,
                  transition: "background 0.3s",
                }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? NAVY : MUTED }}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > i + 1 ? CORAL : SAND, transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 — Dates */}
        {step === 1 && (
          <>
            {loadingAvail && (
              <div style={{ textAlign: "center", padding: "8px 0 4px", color: MUTED, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 12, height: 12, border: `2px solid ${CORAL}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Chargement des disponibilités Airbnb…
              </div>
            )}
            <DateRangePicker checkin={checkin} checkout={checkout} blockedDates={blockedDates} onChange={(ci, co) => { setCheckin(ci); setCheckout(co); }} />

            {nights > 0 ? (
              <div style={{
                marginTop: 24,
                background: "rgba(200,85,61,0.04)",
                border: `1px solid ${SAND}`,
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
              }}>
                <div>
                  <div style={{ color: MUTED, fontSize: 13 }}>{formatDateLong(checkin)} → {formatDateLong(checkout)}</div>
                  <div style={{ fontSize: 14, color: MUTED, marginTop: 4 }}>{nights} nuit{nights > 1 ? "s" : ""} × {bien.prix}€ / nuit</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginTop: 4 }}>{total}€</div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    ...btnPrimary,
                    background: CORAL,
                    color: "#fff",
                  }}
                >
                  Continuer →
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 24, textAlign: "center", color: MUTED, fontSize: 14, padding: "20px 0" }}>
                Sélectionnez vos dates d'arrivée et de départ
              </div>
            )}
          </>
        )}

        {/* STEP 2 — Form */}
        {step === 2 && (
          <>
            <div style={{
              background: "rgba(200,85,61,0.04)",
              border: `1px solid ${SAND}`,
              borderRadius: 12, padding: "14px 18px", marginBottom: 24,
              fontSize: 14, color: MUTED,
              display: "flex", justifyContent: "space-between",
            }}>
              <span>{formatDateLong(checkin)} → {formatDateLong(checkout)}</span>
              <span style={{ fontWeight: 700, color: NAVY }}>{nights} nuits · {total}€</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FormField label="Prénom *" value={form.prenom} onChange={v => setForm(f => ({ ...f, prenom: v }))} />
              <FormField label="Nom *" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} />
              <FormField label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" style={{ gridColumn: "1/-1" }} />
              <FormField label="Téléphone" value={form.tel} onChange={v => setForm(f => ({ ...f, tel: v }))} type="tel" style={{ gridColumn: "1/-1" }} />
              <FormField label="Message (optionnel)" value={form.message} onChange={v => setForm(f => ({ ...f, message: v }))} multiline style={{ gridColumn: "1/-1" }} />
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "space-between" }}>
              <button onClick={() => setStep(1)} style={btnBack}>← Retour</button>
              <button
                onClick={goToPayment}
                disabled={!formOk || paying || !stripe}
                style={{
                  ...btnPrimary,
                  background: formOk && !paying && stripe ? CORAL : SAND,
                  color: "#fff",
                  opacity: formOk && !paying && stripe ? 1 : 0.5,
                  cursor: formOk && !paying && stripe ? "pointer" : "not-allowed",
                }}
              >
                {paying ? "Chargement…" : `Payer ${total}€ →`}
              </button>
            </div>
            {payError && <div style={errStyle}>⚠ {payError}</div>}
          </>
        )}

        {/* STEP 3 — Payment */}
        {step === 3 && (
          <>
            <div style={{
              background: "rgba(200,85,61,0.04)",
              border: `1px solid ${SAND}`,
              borderRadius: 12, padding: "14px 18px", marginBottom: 24,
              fontSize: 14, color: MUTED,
              display: "flex", justifyContent: "space-between",
            }}>
              <span>{form.prenom} {form.nom} · {formatDateLong(checkin)} → {formatDateLong(checkout)}</span>
              <span style={{ fontWeight: 700, color: NAVY }}>{total}€</span>
            </div>
            <div id="spe" style={{ marginBottom: 24 }} />
            <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
              <button onClick={() => setStep(2)} style={btnBack}>← Retour</button>
              <button
                onClick={handlePay}
                disabled={paying}
                style={{
                  ...btnPrimary,
                  background: paying ? SAND : CORAL,
                  color: "#fff",
                  opacity: paying ? 0.6 : 1,
                }}
              >
                {paying ? "Traitement…" : `✓ Confirmer et payer ${total}€`}
              </button>
            </div>
            {payError && <div style={errStyle}>⚠ {payError}</div>}
            <div style={{ marginTop: 16, textAlign: "center", color: MUTED, fontSize: 12 }}>🔒 Paiement sécurisé par Stripe</div>
          </>
        )}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", multiline, style }) {
  const [focused, setFocused] = useState(false);
  const s = {
    background: IVORY,
    border: `1px solid ${focused ? CORAL + "88" : SAND}`,
    borderRadius: 10,
    color: TEXT,
    padding: "11px 14px",
    width: "100%",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {multiline
        ? <textarea rows={3} style={s} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        : <input type={type} style={s} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />}
    </div>
  );
}

// ── Property Card ────────────────────────────────────────────────
function BienCard({ bien, onBook }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const photos = bien.photos || [];
  const currentPhoto = photos[photoIdx] || "";

  function prev(e) { e.stopPropagation(); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); }
  function next(e) { e.stopPropagation(); setPhotoIdx(i => (i + 1) % photos.length); }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${SAND}`,
        transition: "all 0.4s cubic-bezier(0.23,1,0.32,1)",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered
          ? "0 20px 48px rgba(27,40,86,0.12)"
          : "0 2px 16px rgba(27,40,86,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Photo section */}
      <div style={{ position: "relative", height: 260, overflow: "hidden", background: CREAM }}>

        {currentPhoto ? (
          <img
            key={photoIdx}
            src={currentPhoto}
            alt={bien.nom}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transition: "transform 0.6s cubic-bezier(0.23,1,0.32,1), opacity 0.3s",
              transform: hovered ? "scale(1.06)" : "scale(1)",
            }}
          />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🏡</div>
        )}

        {/* 2px coral line on hover */}
        {hovered && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: CORAL, zIndex: 2 }} />
        )}

        {/* Dark overlay gradient bottom */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(27,40,86,0.7) 0%, transparent 60%)" }} />

        {/* Carousel nav — visible on hover */}
        {photos.length > 1 && hovered && (
          <>
            <button onClick={prev} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "none", color: NAVY, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>‹</button>
            <button onClick={next} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "none", color: NAVY, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>›</button>
          </>
        )}

        {/* Dots */}
        {photos.length > 1 && (
          <div style={{ position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4, zIndex: 2 }}>
            {photos.map((_, i) => (
              <div
                key={i}
                onClick={e => { e.stopPropagation(); setPhotoIdx(i); }}
                style={{
                  width: i === photoIdx ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === photoIdx ? CORAL : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        )}

        {/* Tag badge */}
        {bien.tag && (
          <div style={{
            position: "absolute", top: 16, right: 14, zIndex: 3,
            background: "rgba(200,85,61,0.9)",
            color: "#fff", fontSize: 10, fontWeight: 700,
            padding: "4px 10px", borderRadius: 20, letterSpacing: 0.5,
            textTransform: "uppercase",
          }}>
            {bien.tag}
          </div>
        )}

        {/* Price badge */}
        <div style={{
          position: "absolute", bottom: 14, right: 14, zIndex: 2,
          background: "rgba(27,40,86,0.85)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "8px 14px", textAlign: "right",
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{bien.prix}€</div>
          <div style={{ fontSize: 11, color: "rgba(250,247,242,0.6)" }}>/ nuit</div>
        </div>
      </div>

      {/* Info section */}
      <div style={{ padding: "20px 22px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Location */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: CORAL, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
          {bien.lieu}
        </div>

        {/* Name */}
        <div style={{ fontWeight: 800, fontSize: 21, color: NAVY, marginBottom: 10 }}>{bien.nom}</div>

        {/* Rating row */}
        {bien.rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: MUTED }}>
            <span style={{ color: GOLD }}>★ {bien.rating}</span>
            <span>·</span>
            {bien.reviews && <span>{bien.reviews} avis</span>}
            <span>·</span>
            <span>{bien.capacite} pers.</span>
            <span>·</span>
            <span>{bien.lits} lit{bien.lits > 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Description */}
        <p style={{
          color: MUTED, fontSize: 13, lineHeight: 1.65,
          margin: "0 0 14px",
          flex: 1,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>{bien.desc}</p>

        {/* Amenities */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {bien.amenities.map(a => (
            <span key={a} style={{
              background: CREAM,
              border: `1px solid ${SAND}`,
              borderRadius: 5, fontSize: 11, color: MUTED, padding: "3px 8px",
            }}>{a}</span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => onBook(bien)}
          style={{
            width: "100%",
            background: CORAL,
            border: "none",
            color: "#fff",
            borderRadius: 6,
            padding: "13px 20px",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 1,
            cursor: "pointer",
            transition: "opacity 0.2s",
            textTransform: "uppercase",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          Voir les disponibilités →
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, fontSize: 13 }}>
      <span>{icon}</span> {label}
    </div>
  );
}

// ── Thank you page ───────────────────────────────────────────────
function MerciPage() {
  return (
    <div style={{ minHeight: "100vh", background: IVORY, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, textAlign: "center", padding: 32 }}>
      <div>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `rgba(200,85,61,0.1)`, border: `2px solid ${CORAL}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 28px" }}>✓</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12, color: NAVY }}>Réservation confirmée !</h1>
        <p style={{ color: MUTED, fontSize: 16, maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Merci pour votre réservation. Un email de confirmation vous sera envoyé dans quelques minutes.
        </p>
        <a href="/" style={{ ...btnPrimary, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, background: CORAL, color: "#fff" }}>← Retour à l'accueil</a>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function PublicSite() {
  const [selectedBien, setSelectedBien] = useState(null);
  const [filterLieu, setFilterLieu] = useState("all");
  const [scrolled, setScrolled] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loadingAvail, setLoadingAvail] = useState(false);

  async function openBien(bien) {
    setSelectedBien(bien);
    setBlockedDates([]);
    setLoadingAvail(true);
    try {
      const r = await fetch(`/api/get-availability?bienId=${bien.id}`);
      if (r.ok) {
        const d = await r.json();
        setBlockedDates(d.blockedDates || []);
      }
    } catch (_) {}
    setLoadingAvail(false);
  }

  const path = window.location.pathname;
  if (path === "/merci") return <MerciPage />;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const lieux = [
    { key: "all", label: "Tous" },
    { key: "Martinique", label: "Martinique" },
    { key: "Île-de-France", label: "Île-de-France" },
  ];

  const filtered = filterLieu === "all" ? BIENS : BIENS.filter(b => b.lieu.includes(filterLieu));

  return (
    <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ── NAVIGATION ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 200,
        height: 64,
        background: NAVY,
        padding: "0 32px",
        display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Hibiscus SVG logo mark */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <ellipse cx="14" cy="8" rx="4" ry="7" fill="none" stroke="#C8553D" strokeWidth="1.5" transform="rotate(0 14 14)"/>
              <ellipse cx="14" cy="8" rx="4" ry="7" fill="none" stroke="#C8553D" strokeWidth="1.5" transform="rotate(72 14 14)"/>
              <ellipse cx="14" cy="8" rx="4" ry="7" fill="none" stroke="#C8553D" strokeWidth="1.5" transform="rotate(144 14 14)"/>
              <ellipse cx="14" cy="8" rx="4" ry="7" fill="none" stroke="#C8553D" strokeWidth="1.5" transform="rotate(216 14 14)"/>
              <ellipse cx="14" cy="8" rx="4" ry="7" fill="none" stroke="#C8553D" strokeWidth="1.5" transform="rotate(288 14 14)"/>
              <circle cx="14" cy="14" r="3" fill="#C8553D"/>
            </svg>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: 3, color: "#FAF7F2", textTransform: "uppercase" }}>AMARYLLIS</div>
              <div style={{ fontSize: 10, color: "rgba(250,247,242,0.5)", letterSpacing: 1 }}>Martinique · Paris</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ fontSize: 12, color: "rgba(250,247,242,0.6)" }}>Réservation directe · sans commission</div>
            <a href="/admin" style={{ fontSize: 11, color: "rgba(250,247,242,0.4)", textDecoration: "none", letterSpacing: 1 }}>Admin</a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{ position: "relative", minHeight: "92vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: IVORY }}>

        {/* Warm radial glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 70% 60% at 20% 50%, rgba(200,85,61,0.06) 0%, transparent 65%),
                       radial-gradient(ellipse 50% 60% at 80% 40%, rgba(196,146,42,0.05) 0%, transparent 65%)`,
        }} />

        {/* Botanical — large hibiscus outline top-right */}
        <svg style={{ position:"absolute", top: -40, right: -60, opacity: 0.08, pointerEvents:"none", animation:"floatLeaf 8s ease-in-out infinite" }}
          width="480" height="480" viewBox="0 0 480 480" fill="none">
          <ellipse cx="240" cy="100" rx="60" ry="130" fill="#C8553D" transform="rotate(0 240 240)"/>
          <ellipse cx="240" cy="100" rx="60" ry="130" fill="#C8553D" transform="rotate(72 240 240)"/>
          <ellipse cx="240" cy="100" rx="60" ry="130" fill="#C8553D" transform="rotate(144 240 240)"/>
          <ellipse cx="240" cy="100" rx="60" ry="130" fill="#C8553D" transform="rotate(216 240 240)"/>
          <ellipse cx="240" cy="100" rx="60" ry="130" fill="#C8553D" transform="rotate(288 240 240)"/>
          <circle cx="240" cy="240" r="40" fill="#C8553D"/>
        </svg>

        {/* Botanical — palm frond bottom-left */}
        <svg style={{ position:"absolute", bottom: -20, left: -40, opacity: 0.07, pointerEvents:"none", animation:"floatLeaf 10s ease-in-out infinite reverse" }}
          width="360" height="360" viewBox="0 0 360 360" fill="none">
          <path d="M60 360 Q80 200 200 100 Q120 160 160 280 Q100 200 140 340 Q80 240 120 360" fill="#1B2856"/>
          <path d="M60 360 Q200 280 300 160 Q200 220 220 300 Q180 240 200 340" fill="#1B2856"/>
        </svg>

        {/* Hero content */}
        <div style={{ position:"relative", zIndex:2, maxWidth:760, margin:"0 auto", padding:"0 32px", textAlign:"center" }}>

          <div style={{ animation:"fadeUp 0.5s ease forwards", opacity:0, animationDelay:"0.1s", marginBottom:20 }}>
            <span style={{ fontSize:11, color:CORAL, letterSpacing:4, textTransform:"uppercase", fontWeight:600 }}>
              Locations de vacances directes
            </span>
          </div>

          <div style={{ animation:"fadeUp 0.6s ease forwards", opacity:0, animationDelay:"0.25s" }}>
            <h1 style={{
              fontSize:"clamp(56px, 10vw, 110px)", fontWeight:900, lineHeight:1,
              color: NAVY, margin:"0 0 16px",
              letterSpacing: "-2px",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}>Amaryllis</h1>
          </div>

          <div style={{ animation:"fadeUp 0.6s ease forwards", opacity:0, animationDelay:"0.4s", marginBottom:40 }}>
            <p style={{ fontSize:18, fontWeight:300, color:MUTED, fontStyle:"italic", margin:0, lineHeight:1.6 }}>
              Martinique · Paris — Réservez sans intermédiaire
            </p>
          </div>

          <div style={{ animation:"fadeUp 0.6s ease forwards", opacity:0, animationDelay:"0.55s", display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:44 }}>
            {[["7", "propriétés"], ["⭐ 4.8", "note moyenne"], ["0%", "commission"]].map(([v, l]) => (
              <div key={l} style={{ background:"#fff", border:`1px solid ${SAND}`, borderRadius:8, padding:"10px 18px", textAlign:"center" }}>
                <div style={{ fontWeight:800, fontSize:18, color:NAVY }}>{v}</div>
                <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ animation:"fadeUp 0.6s ease forwards", opacity:0, animationDelay:"0.7s" }}>
            <a href="#properties" style={{
              display:"inline-flex", alignItems:"center", gap:8,
              background:CORAL, color:"#fff",
              padding:"15px 36px", borderRadius:6,
              fontWeight:700, fontSize:14,
              letterSpacing:1, textTransform:"uppercase",
              textDecoration:"none",
              boxShadow:"0 8px 24px rgba(200,85,61,0.3)",
              transition:"all 0.2s",
            }}>
              Découvrir les villas →
            </a>
          </div>

          <div style={{ animation:"fadeUp 0.6s ease forwards", opacity:0, animationDelay:"1s", marginTop:56, color:SAND, fontSize:12, letterSpacing:3 }}>↓</div>
        </div>
      </div>

      {/* ── PROPERTIES SECTION ── */}
      <div id="properties" style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px", background: IVORY }}>

        {/* Section header + filters */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: NAVY, margin: "0 0 24px" }}>Nos propriétés</h2>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {lieux.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterLieu(key)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 20,
                  border: `1px solid ${filterLieu === key ? CORAL + "88" : SAND}`,
                  background: filterLieu === key ? `rgba(200,85,61,0.08)` : "transparent",
                  color: filterLieu === key ? CORAL : MUTED,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: filterLieu === key ? 700 : 400,
                  transition: "all 0.2s",
                  letterSpacing: 0.5,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: SAND }} />
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24 }}>
          {filtered.map(b => (
            <BienCard key={b.id} bien={b} onBook={openBien} />
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: NAVY, padding: "40px 32px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:14, letterSpacing:3, color:"#FAF7F2", textTransform:"uppercase", marginBottom:6 }}>
              AMARYLLIS
            </div>
            <div style={{ color:"rgba(250,247,242,0.5)", fontSize:12 }}>Locations de vacances directes — sans commission</div>
          </div>
          <div style={{ textAlign:"right", display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ fontSize:12, color:"rgba(250,247,242,0.5)" }}>🔒 Paiement sécurisé Stripe</div>
            <a href="/admin" style={{ fontSize:11, color:"rgba(250,247,242,0.3)", textDecoration:"none", letterSpacing:1 }}>Admin →</a>
          </div>
        </div>
      </footer>

      {/* ── MODAL ── */}
      {selectedBien && (
        <BookingModal bien={selectedBien} blockedDates={blockedDates} loadingAvail={loadingAvail} onClose={() => setSelectedBien(null)} />
      )}
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────
const btnPrimary = {
  border: "none", borderRadius: 6,
  padding: "13px 26px",
  fontWeight: 700, fontSize: 14,
  cursor: "pointer",
  transition: "opacity 0.2s, transform 0.1s",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  letterSpacing: 1, textTransform: "uppercase",
};
const btnBack = {
  background: "transparent",
  border: `1px solid ${SAND}`,
  color: MUTED, borderRadius: 6,
  padding: "13px 20px",
  fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const errStyle = {
  color: CORAL, marginTop: 14, fontSize: 13,
  background: "rgba(200,85,61,0.06)",
  border: `1px solid rgba(200,85,61,0.2)`,
  borderRadius: 8, padding: "10px 14px",
};
