import { useState, useEffect, useRef, useCallback } from "react";

// Inject spinner keyframe once
if (typeof document !== "undefined" && !document.getElementById("__spin_style")) {
  const s = document.createElement("style");
  s.id = "__spin_style";
  s.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
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
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#e2e8f0" }}>
        {MONTHS_FR[month]} {year}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, color: "#475569", padding: "4px 0", fontWeight: 600 }}>{w}</div>
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

          if (isCI || isCO) { bg = "#22c55e"; color = "#000"; fontWeight = 700; }
          else if (inRange) { bg = "rgba(34,197,94,0.12)"; color = "#dcfce7"; borderRadius = "0"; }
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
                color: blocked ? "#374151" : past ? "#374151" : color,
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
        <div style={{ fontSize: 13, color: "#64748b" }}>
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
          <button onClick={() => { onChange(null, null); setHovered(null); }} style={{ fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Effacer les dates
          </button>
        </div>
      )}
    </div>
  );
}

const iconBtn = { background: "none", border: "1px solid #1e293b", color: "#94a3b8", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" };

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
      const res = await fetch("/.netlify/functions/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total * 100, currency: "eur", metadata: { bienId: bien.id, checkin, checkout, voyageur: `${form.prenom} ${form.nom}` } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const el = stripe.elements({ clientSecret: data.clientSecret, appearance: { theme: "night", variables: { colorPrimary: "#22c55e", borderRadius: "8px" } } });
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
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#0d1526", border: "1px solid #1e293b", borderRadius: 24, padding: "32px", maxWidth: 680, width: "100%", maxHeight: "92vh", overflowY: "auto", position: "relative", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 12, color: bien.couleur, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>RÉSERVATION DIRECTE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>{bien.nom}</div>
            <div style={{ color: "#475569", fontSize: 13, marginTop: 2 }}>📍 {bien.lieu}</div>
          </div>
          <button onClick={onClose} style={{ background: "#1e293b", border: "none", color: "#94a3b8", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32, alignItems: "center" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flex: i < steps.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: step > i + 1 ? "#22c55e" : step === i + 1 ? bien.couleur : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: step > i + 1 ? "#000" : "#fff", transition: "background 0.3s" }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? "#f1f5f9" : "#475569" }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? "#22c55e" : "#1e293b", transition: "background 0.3s" }} />}
            </div>
          ))}
        </div>

        {/* STEP 1 — Dates */}
        {step === 1 && (
          <>
            {loadingAvail && (
              <div style={{ textAlign: "center", padding: "8px 0 4px", color: "#475569", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #22c55e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Chargement des disponibilités Airbnb…
              </div>
            )}
            <DateRangePicker checkin={checkin} checkout={checkout} blockedDates={blockedDates} onChange={(ci, co) => { setCheckin(ci); setCheckout(co); }} />

            {nights > 0 ? (
              <div style={{ marginTop: 24, background: "#111d35", border: "1px solid #1e3a5f", borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{formatDateLong(checkin)} → {formatDateLong(checkout)}</div>
                  <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>{nights} nuit{nights > 1 ? "s" : ""} × {bien.prix}€ / nuit</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", marginTop: 4 }}>{total}€</div>
                </div>
                <button onClick={() => setStep(2)} style={{ ...btnPrimary, background: bien.couleur, color: bien.couleur === "#f59e0b" || bien.couleur === "#84cc16" ? "#000" : "#fff" }}>
                  Continuer →
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 24, textAlign: "center", color: "#475569", fontSize: 14, padding: "20px 0" }}>
                Sélectionnez vos dates d'arrivée et de départ
              </div>
            )}
          </>
        )}

        {/* STEP 2 — Form */}
        {step === 2 && (
          <>
            <div style={{ background: "#111d35", borderRadius: 12, padding: "14px 18px", marginBottom: 24, fontSize: 14, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
              <span>{formatDateLong(checkin)} → {formatDateLong(checkout)}</span>
              <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{nights} nuits · {total}€</span>
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
              <button onClick={goToPayment} disabled={!formOk || paying || !stripe} style={{ ...btnPrimary, background: formOk && !paying && stripe ? bien.couleur : "#1e293b", color: bien.couleur === "#f59e0b" || bien.couleur === "#84cc16" ? "#000" : "#fff", opacity: formOk && !paying && stripe ? 1 : 0.6, cursor: formOk && !paying && stripe ? "pointer" : "not-allowed" }}>
                {paying ? "Chargement…" : `Payer ${total}€ →`}
              </button>
            </div>
            {payError && <div style={errStyle}>⚠ {payError}</div>}
          </>
        )}

        {/* STEP 3 — Payment */}
        {step === 3 && (
          <>
            <div style={{ background: "#111d35", borderRadius: 12, padding: "14px 18px", marginBottom: 24, fontSize: 14, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
              <span>{form.prenom} {form.nom} · {formatDateLong(checkin)} → {formatDateLong(checkout)}</span>
              <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{total}€</span>
            </div>
            <div id="spe" style={{ marginBottom: 24 }} />
            <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
              <button onClick={() => setStep(2)} style={btnBack}>← Retour</button>
              <button onClick={handlePay} disabled={paying} style={{ ...btnPrimary, background: paying ? "#1e293b" : "#22c55e", color: "#000", opacity: paying ? 0.6 : 1 }}>
                {paying ? "Traitement…" : `✓ Confirmer et payer ${total}€`}
              </button>
            </div>
            {payError && <div style={errStyle}>⚠ {payError}</div>}
            <div style={{ marginTop: 16, textAlign: "center", color: "#374151", fontSize: 12 }}>🔒 Paiement sécurisé par Stripe</div>
          </>
        )}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", multiline, style }) {
  const [focused, setFocused] = useState(false);
  const s = {
    background: "#0a0f1e", border: `1px solid ${focused ? "#22c55e" : "#1e293b"}`, borderRadius: 10,
    color: "#f1f5f9", padding: "11px 14px", width: "100%", fontSize: 14, outline: "none",
    fontFamily: "inherit", resize: "vertical", transition: "border-color 0.2s", boxSizing: "border-box",
  };
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>{label}</label>
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
      style={{ background: "#0d1526", borderRadius: 20, overflow: "hidden", border: `1px solid ${hovered ? bien.couleur + "44" : "#1e293b"}`, transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease", transform: hovered ? "translateY(-6px)" : "none", boxShadow: hovered ? `0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px ${bien.couleur}22` : "0 4px 16px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" }}
    >
      {/* Photo carousel */}
      <div style={{ position: "relative", height: 220, overflow: "hidden", background: `linear-gradient(135deg, ${bien.couleur}22, ${bien.couleur}44)` }}>
        {currentPhoto ? (
          <img
            key={photoIdx}
            src={currentPhoto}
            alt={bien.nom}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease, opacity 0.3s", transform: hovered ? "scale(1.04)" : "scale(1)" }}
          />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🏡</div>
        )}

        {/* Overlay gradient */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,21,38,0.7) 0%, transparent 50%)" }} />

        {/* Carousel nav — visible on hover */}
        {photos.length > 1 && hovered && (
          <>
            <button onClick={prev} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>‹</button>
            <button onClick={next} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>›</button>
          </>
        )}

        {/* Dots */}
        {photos.length > 1 && (
          <div style={{ position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            {photos.map((_, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); setPhotoIdx(i); }} style={{ width: i === photoIdx ? 16 : 6, height: 6, borderRadius: 3, background: i === photoIdx ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.2s" }} />
            ))}
          </div>
        )}

        {/* Tag */}
        {bien.tag && (
          <div style={{ position: "absolute", top: 14, left: 14, background: bien.couleur, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, letterSpacing: 0.5 }}>
            ✦ {bien.tag}
          </div>
        )}

        {/* Price badge */}
        <div style={{ position: "absolute", bottom: 14, right: 14, background: "rgba(10,15,30,0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "8px 14px", textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: bien.couleur, lineHeight: 1 }}>{bien.prix}€</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>/ nuit</div>
        </div>
      </div>

      <div style={{ padding: "20px 22px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#f1f5f9", marginBottom: 4 }}>{bien.nom}</div>
          <div style={{ color: "#475569", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
            <span>📍</span> {bien.lieu}
          </div>
        </div>

        <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.65, margin: "10px 0 16px", flex: 1 }}>{bien.desc}</p>

        {/* Rating badge */}
        {bien.rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ background: "#1e293b", border: "1px solid #2d3f5e", borderRadius: 8, padding: "4px 10px", fontSize: 13, color: "#f1f5f9", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              ⭐ {bien.rating}
            </span>
            {bien.reviews && <span style={{ color: "#475569", fontSize: 12 }}>{bien.reviews} avis</span>}
          </div>
        )}

        {/* Capacité */}
        <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
          <Stat icon="👤" label={`${bien.capacite} pers.`} />
          <Stat icon="🛏️" label={`${bien.lits} lit${bien.lits > 1 ? "s" : ""}`} />
          <Stat icon="🚿" label={`${bien.sdb} sdb`} />
        </div>

        {/* Amenities */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {bien.amenities.map(a => (
            <span key={a} style={{ background: "#111d35", border: "1px solid #1e293b", borderRadius: 6, fontSize: 11, color: "#64748b", padding: "3px 8px" }}>{a}</span>
          ))}
        </div>

        <button onClick={() => onBook(bien)} style={{ ...btnPrimary, width: "100%", background: `linear-gradient(135deg, ${bien.couleur} 0%, ${bien.couleur}bb 100%)`, color: bien.couleur === "#f59e0b" || bien.couleur === "#84cc16" ? "#000" : "#fff", fontSize: 15 }}>
          Voir les disponibilités
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: 13 }}>
      <span>{icon}</span> {label}
    </div>
  );
}

// ── Thank you page ───────────────────────────────────────────────
function MerciPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textAlign: "center", padding: 32 }}>
      <div>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 28px" }}>✓</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12, color: "#f1f5f9" }}>Réservation confirmée !</h1>
        <p style={{ color: "#64748b", fontSize: 16, maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Merci pour votre réservation. Un email de confirmation vous sera envoyé dans quelques minutes.
        </p>
        <a href="/" style={{ ...btnPrimary, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "#22c55e", color: "#000" }}>← Retour à l'accueil</a>
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
    { key: "all", label: "Tous les biens (7)" },
    { key: "Martinique", label: "🌴 Martinique (6)" },
    { key: "Île-de-France", label: "🗼 Île-de-France (1)" },
  ];

  const filtered = filterLieu === "all" ? BIENS : BIENS.filter(b => b.lieu.includes(filterLieu));

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#fff", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 200, borderBottom: scrolled ? "1px solid #1e293b" : "1px solid transparent", background: scrolled ? "rgba(10,15,30,0.96)" : "transparent", backdropFilter: scrolled ? "blur(16px)" : "none", transition: "all 0.3s ease", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #22c55e, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌺</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1 }}>Amaryllis <span style={{ color: "#22c55e" }}>Locations</span></div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>France · Martinique</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "#64748b" }}>📞 Réservation directe — sans frais</div>
            <a href="/admin" style={{ fontSize: 12, color: "#374151", textDecoration: "none", background: "#1e293b", padding: "6px 14px", borderRadius: 8 }}>Admin</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ padding: "80px 24px 72px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 20, padding: "6px 16px", fontSize: 12, color: "#22c55e", fontWeight: 600, letterSpacing: 1, marginBottom: 24 }}>
            ✦ LOCATION DIRECTE · SANS COMMISSION
          </div>
          <h1 style={{ fontSize: "clamp(36px, 7vw, 64px)", fontWeight: 900, lineHeight: 1.08, marginBottom: 20, background: "linear-gradient(160deg, #f1f5f9 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Villas & Appartements<br />d'Exception
          </h1>
          <p style={{ color: "#64748b", fontSize: 18, lineHeight: 1.65, maxWidth: 540, margin: "0 auto 36px" }}>
            7 propriétés sélectionnées en <strong style={{ color: "#94a3b8" }}>Martinique</strong> et <strong style={{ color: "#94a3b8" }}>Île-de-France</strong>. Réservez directement auprès du propriétaire.
          </p>
          {/* Stats */}
          <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {[["7", "Propriétés"], ["0%", "Frais de service"], ["⭐ 4.9", "Note moyenne"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9" }}>{v}</div>
                <div style={{ fontSize: 12, color: "#475569" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 36, flexWrap: "wrap" }}>
          {lieux.map(({ key, label }) => (
            <button key={key} onClick={() => setFilterLieu(key)} style={{ padding: "9px 20px", borderRadius: 24, border: `1px solid ${filterLieu === key ? "#22c55e" : "#1e293b"}`, background: filterLieu === key ? "rgba(34,197,94,0.1)" : "transparent", color: filterLieu === key ? "#22c55e" : "#475569", cursor: "pointer", fontSize: 14, fontWeight: filterLieu === key ? 700 : 400, transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 28 }}>
          {filtered.map(b => (
            <BienCard key={b.id} bien={b} onBook={openBien} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #111d35", padding: "48px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>🌺 Amaryllis <span style={{ color: "#22c55e" }}>Locations</span></div>
            <div style={{ color: "#374151", fontSize: 13 }}>7 propriétés · Réservation directe sans intermédiaire</div>
          </div>
          <div style={{ color: "#374151", fontSize: 13, textAlign: "right" }}>
            <div>Paiement sécurisé par Stripe 🔒</div>
            <a href="/admin" style={{ color: "#374151", textDecoration: "none", marginTop: 4, display: "block" }}>Espace propriétaire →</a>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {selectedBien && (
        <BookingModal bien={selectedBien} blockedDates={blockedDates} loadingAvail={loadingAvail} onClose={() => setSelectedBien(null)} />
      )}
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────
const btnPrimary = {
  border: "none", borderRadius: 12, padding: "13px 26px", fontWeight: 700, fontSize: 14,
  cursor: "pointer", transition: "opacity 0.2s, transform 0.1s", display: "inline-flex", alignItems: "center", justifyContent: "center",
};
const btnBack = {
  background: "transparent", border: "1px solid #1e293b", color: "#64748b", borderRadius: 12,
  padding: "13px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const errStyle = { color: "#f87171", marginTop: 14, fontSize: 13, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px" };
