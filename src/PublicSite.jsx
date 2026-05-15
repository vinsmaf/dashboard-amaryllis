import { useState, useEffect, useCallback } from "react";

const STRIPE_PK = "pk_test_51N1fVbAM2ySp09YCENcn4NcGi4xM7BzNCra9HU3ildZKLAHPzCOsY6ItlpxrttT1owXCUSKQrfPrIXsZSWPLrQsd00SDmMsWvX";

const BIENS = [
  {
    id: "amaryllis",
    nom: "Villa Amaryllis",
    lieu: "Le Vauclin, Martinique",
    desc: "Villa d'exception face à la mer des Caraïbes, piscine privée, 4 chambres, vue panoramique sur l'océan.",
    prix: 280,
    capacite: 8,
    chambres: 4,
    emoji: "🌺",
    couleur: "#e91e8c",
    photos: [],
  },
  {
    id: "zandoli",
    nom: "Villa Zandoli",
    lieu: "Le Vauclin, Martinique",
    desc: "Villa tropicale avec jardin arboré, piscine et terrasse couverte. Idéale pour familles.",
    prix: 220,
    capacite: 6,
    chambres: 3,
    emoji: "🦎",
    couleur: "#00bcd4",
    photos: [],
  },
  {
    id: "iguana",
    nom: "Villa Iguana",
    lieu: "Le Vauclin, Martinique",
    desc: "Villa moderne avec piscine à débordement, 3 chambres climatisées, vue sur la baie.",
    prix: 180,
    capacite: 6,
    chambres: 3,
    emoji: "🌴",
    couleur: "#4caf50",
    photos: [],
  },
  {
    id: "geko",
    nom: "Villa Geko",
    lieu: "Le Vauclin, Martinique",
    desc: "Charmante villa avec piscine, 2 chambres, terrasse avec barbecue et jardin tropical.",
    prix: 150,
    capacite: 4,
    chambres: 2,
    emoji: "🏡",
    couleur: "#ff9800",
    photos: [],
  },
  {
    id: "mabouya",
    nom: "Villa Mabouya",
    lieu: "Le Vauclin, Martinique",
    desc: "Villa cosy au cœur de la végétation tropicale, piscine, 2 chambres, ambiance authentique.",
    prix: 110,
    capacite: 4,
    chambres: 2,
    emoji: "🌿",
    couleur: "#8bc34a",
    photos: [],
  },
  {
    id: "schoelcher",
    nom: "T2 Schœlcher",
    lieu: "Schœlcher, Martinique",
    desc: "Appartement moderne près de Fort-de-France, terrasse, vue mer, accès plage à 5 min.",
    prix: 100,
    capacite: 4,
    chambres: 1,
    emoji: "🏖️",
    couleur: "#9c27b0",
    photos: [],
  },
  {
    id: "nogent",
    nom: "T2 Nogent-sur-Marne",
    lieu: "Nogent-sur-Marne, Île-de-France",
    desc: "Bel appartement T2 au bord de la Marne, lumineux, décoré avec soin, proche Paris (RER A).",
    prix: 85,
    capacite: 3,
    chambres: 1,
    emoji: "🗼",
    couleur: "#607d8b",
    photos: [],
  },
];

function dateDiff(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function toLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = toLocalDate(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Mini calendar ────────────────────────────────────────────────
function MiniCalendar({ bienId, blockedDates = [], checkin, checkout, onSelect }) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const todayStr = today();

  function isBlocked(dateStr) {
    return blockedDates.includes(dateStr);
  }

  function isInRange(dateStr) {
    if (!checkin || !checkout) return false;
    return dateStr > checkin && dateStr < checkout;
  }

  function renderMonth(year, month) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDow = (first.getDay() + 6) % 7; // Mon=0
    const days = [];

    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push(ds);
    }

    const monthName = first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    return (
      <div style={{ flex: 1, minWidth: 260 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button onClick={() => {
            if (month === 0) { setViewYear(y => y - 1); setViewMonth(11); }
            else setViewMonth(m => m - 1);
          }} style={calNavBtn}>‹</button>
          <span style={{ fontWeight: 600, textTransform: "capitalize", fontSize: 14 }}>{monthName}</span>
          <button onClick={() => {
            if (month === 11) { setViewYear(y => y + 1); setViewMonth(0); }
            else setViewMonth(m => m + 1);
          }} style={calNavBtn}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
          {["L","M","M","J","V","S","D"].map((d, i) => (
            <div key={i} style={{ fontSize: 11, color: "#888", padding: "4px 0" }}>{d}</div>
          ))}
          {days.map((ds, i) => {
            if (!ds) return <div key={i} />;
            const blocked = isBlocked(ds);
            const past = ds < todayStr;
            const isCI = ds === checkin;
            const isCO = ds === checkout;
            const inRange = isInRange(ds);
            const disabled = blocked || past;

            return (
              <div key={ds} onClick={() => !disabled && onSelect(ds)}
                style={{
                  padding: "6px 2px",
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: disabled ? "not-allowed" : "pointer",
                  background: isCI || isCO ? "#22c55e" : inRange ? "rgba(34,197,94,0.15)" : "transparent",
                  color: disabled ? "#444" : isCI || isCO ? "#000" : "#eee",
                  textDecoration: blocked ? "line-through" : "none",
                  opacity: past ? 0.35 : 1,
                  fontWeight: isCI || isCO ? 700 : 400,
                  transition: "background 0.1s",
                }}
              >{parseInt(ds.split("-")[2])}</div>
            );
          })}
        </div>
      </div>
    );
  }

  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", background: "#111", borderRadius: 12, padding: 20, marginTop: 12 }}>
      {renderMonth(viewYear, viewMonth)}
      {renderMonth(nextYear, nextMonth)}
    </div>
  );
}

const calNavBtn = {
  background: "none", border: "none", color: "#eee", fontSize: 20, cursor: "pointer", padding: "0 8px", lineHeight: 1,
};

// ── Booking Modal ────────────────────────────────────────────────
function BookingModal({ bien, blockedDates, onClose }) {
  const [step, setStep] = useState(1); // 1=dates 2=form 3=payment 4=confirm
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [selectingWhat, setSelectingWhat] = useState("checkin");
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", tel: "", message: "" });
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const nights = checkin && checkout ? dateDiff(checkin, checkout) : 0;
  const total = nights * bien.prix;

  // Load Stripe
  useEffect(() => {
    if (!window.Stripe) return;
    setStripe(window.Stripe(STRIPE_PK));
  }, []);

  function handleDateSelect(ds) {
    if (selectingWhat === "checkin" || !checkin || ds <= checkin) {
      setCheckin(ds);
      setCheckout("");
      setSelectingWhat("checkout");
    } else {
      // Check no blocked date in range
      let hasBlocked = false;
      let cur = checkin;
      while (cur < ds) {
        const d = new Date(cur);
        d.setDate(d.getDate() + 1);
        cur = d.toISOString().slice(0, 10);
        if (blockedDates.includes(cur) && cur < ds) { hasBlocked = true; break; }
      }
      if (hasBlocked) {
        setCheckin(ds);
        setCheckout("");
        setSelectingWhat("checkout");
      } else {
        setCheckout(ds);
        setSelectingWhat("checkin");
      }
    }
  }

  async function goToPayment() {
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/.netlify/functions/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total * 100,
          currency: "eur",
          metadata: {
            bienId: bien.id,
            checkin,
            checkout,
            voyageur: `${form.prenom} ${form.nom}`,
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClientSecret(data.clientSecret);

      const el = stripe.elements({ clientSecret: data.clientSecret, appearance: { theme: "night" } });
      const pe = el.create("payment");
      pe.mount("#stripe-payment-element");
      setElements(el);
      setStep(3);
    } catch (e) {
      setPayError(e.message);
    }
    setPaying(false);
  }

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true);
    setPayError("");
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/merci" },
    });
    if (error) setPayError(error.message);
    setPaying(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#0f1629", borderRadius: 20, padding: 32, maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#888", fontSize: 24, cursor: "pointer" }}>✕</button>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Réservation</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{bien.emoji} {bien.nom}</div>
          <div style={{ color: "#888", fontSize: 14 }}>{bien.lieu}</div>
        </div>

        {/* Steps indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {["Dates", "Coordonnées", "Paiement"].map((s, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: step > i ? "#22c55e" : "#1e293b" }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <DateBox label="Arrivée" value={checkin} active={selectingWhat === "checkin"} onClick={() => setSelectingWhat("checkin")} />
              <DateBox label="Départ" value={checkout} active={selectingWhat === "checkout"} onClick={() => setSelectingWhat("checkout")} />
            </div>
            <MiniCalendar bienId={bien.id} blockedDates={blockedDates} checkin={checkin} checkout={checkout} onSelect={handleDateSelect} />
            {nights > 0 && (
              <div style={{ marginTop: 20, padding: "16px 20px", background: "#1a2744", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#888", fontSize: 13 }}>{nights} nuit{nights > 1 ? "s" : ""} × {bien.prix}€</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{total}€ <span style={{ fontSize: 14, color: "#888" }}>total</span></div>
                </div>
                <button onClick={() => setStep(2)} style={btnPrimary}>Continuer →</button>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Prénom" value={form.prenom} onChange={v => setForm(f => ({ ...f, prenom: v }))} />
              <Field label="Nom" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} />
              <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" style={{ gridColumn: "1/-1" }} />
              <Field label="Téléphone" value={form.tel} onChange={v => setForm(f => ({ ...f, tel: v }))} type="tel" style={{ gridColumn: "1/-1" }} />
              <Field label="Message (optionnel)" value={form.message} onChange={v => setForm(f => ({ ...f, message: v }))} multiline style={{ gridColumn: "1/-1" }} />
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setStep(1)} style={btnSecondary}>← Retour</button>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>{formatDate(checkin)} → {formatDate(checkout)} · {nights} nuit{nights > 1 ? "s" : ""}</div>
                <button
                  onClick={goToPayment}
                  disabled={!form.prenom || !form.nom || !form.email || paying || !stripe}
                  style={{ ...btnPrimary, opacity: (!form.prenom || !form.nom || !form.email || paying || !stripe) ? 0.5 : 1 }}
                >
                  {paying ? "Chargement…" : `Payer ${total}€ →`}
                </button>
              </div>
            </div>
            {payError && <div style={{ color: "#f87171", marginTop: 12, fontSize: 14 }}>⚠ {payError}</div>}
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ marginBottom: 20, padding: "12px 16px", background: "#1a2744", borderRadius: 10, fontSize: 14, color: "#94a3b8" }}>
              {formatDate(checkin)} → {formatDate(checkout)} · {nights} nuit{nights > 1 ? "s" : ""} · <strong style={{ color: "#fff" }}>{total}€</strong>
            </div>
            <div id="stripe-payment-element" style={{ marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
              <button onClick={() => setStep(2)} style={btnSecondary}>← Retour</button>
              <button onClick={handlePay} disabled={paying} style={{ ...btnPrimary, opacity: paying ? 0.5 : 1 }}>
                {paying ? "Traitement…" : `Confirmer et payer ${total}€`}
              </button>
            </div>
            {payError && <div style={{ color: "#f87171", marginTop: 12, fontSize: 14 }}>⚠ {payError}</div>}
          </>
        )}
      </div>
    </div>
  );
}

function DateBox({ label, value, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, minWidth: 140, padding: "12px 16px", borderRadius: 10,
      border: `2px solid ${active ? "#22c55e" : "#1e293b"}`,
      cursor: "pointer", background: active ? "rgba(34,197,94,0.05)" : "#111",
    }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600, color: value ? "#fff" : "#444" }}>{value ? formatDate(value) : "Choisir"}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", multiline, style }) {
  const s = { background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", padding: "10px 14px", width: "100%", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical" };
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6 }}>{label}</label>
      {multiline
        ? <textarea rows={3} style={s} value={value} onChange={e => onChange(e.target.value)} />
        : <input type={type} style={s} value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  );
}

// ── Property Card ────────────────────────────────────────────────
function BienCard({ bien, onBook }) {
  return (
    <div style={{
      background: "#0f1629",
      borderRadius: 20,
      overflow: "hidden",
      border: "1px solid #1e293b",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.4)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Photo placeholder */}
      <div style={{ height: 200, background: `linear-gradient(135deg, ${bien.couleur}22, ${bien.couleur}44)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 64 }}>{bien.emoji}</span>
      </div>

      <div style={{ padding: "20px 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{bien.nom}</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>📍 {bien.lieu}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: bien.couleur }}>{bien.prix}€</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>/ nuit</div>
          </div>
        </div>

        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: "12px 0 16px" }}>{bien.desc}</p>

        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <Pill icon="👤" label={`${bien.capacite} pers.`} />
          <Pill icon="🛏️" label={`${bien.chambres} ch.`} />
        </div>

        <button
          onClick={() => onBook(bien)}
          style={{ ...btnPrimary, width: "100%", background: `linear-gradient(135deg, ${bien.couleur}, ${bien.couleur}cc)` }}
        >
          Réserver
        </button>
      </div>
    </div>
  );
}

function Pill({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1e293b", borderRadius: 20, padding: "4px 12px", fontSize: 13, color: "#94a3b8" }}>
      <span>{icon}</span> {label}
    </div>
  );
}

// ── Thank you page ───────────────────────────────────────────────
function MerciPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textAlign: "center", padding: 32 }}>
      <div>
        <div style={{ fontSize: 72, marginBottom: 24 }}>✅</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Réservation confirmée !</h1>
        <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 400, margin: "0 auto 32px" }}>
          Merci pour votre réservation. Vous recevrez une confirmation par email sous peu.
        </p>
        <a href="/" style={{ ...btnPrimary, textDecoration: "none", display: "inline-block" }}>Retour à l'accueil</a>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function PublicSite() {
  const [selectedBien, setSelectedBien] = useState(null);
  const [blockedDates, setBlockedDates] = useState({});
  const [filterLieu, setFilterLieu] = useState("all");

  const path = window.location.pathname;
  if (path === "/merci") return <MerciPage />;

  // Load availability from Apps Script (alertes_sync)
  useEffect(() => {
    // Could fetch from Sheets to get booked dates per bien — optional
  }, []);

  const lieux = ["all", "Martinique", "Île-de-France"];
  const filtered = filterLieu === "all"
    ? BIENS
    : BIENS.filter(b => b.lieu.includes(filterLieu));

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1e293b", padding: "0 24px", position: "sticky", top: 0, background: "rgba(10,15,30,0.95)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>
            🌺 <span style={{ color: "#22c55e" }}>Amaryllis</span> <span style={{ color: "#64748b", fontSize: 14, fontWeight: 400 }}>Locations</span>
          </div>
          <a href="/admin" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>Admin →</a>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: "linear-gradient(160deg, #0f1629 0%, #0a0f1e 60%)", borderBottom: "1px solid #1e293b", padding: "64px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 600, letterSpacing: 2, marginBottom: 16 }}>LOCATION SAISONNIÈRE DIRECTE</div>
          <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
            Villas & Appartements<br />
            <span style={{ color: "#22c55e" }}>Martinique</span> · <span style={{ color: "#64748b" }}>Paris</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 18, lineHeight: 1.6 }}>
            Réservez directement — sans frais de service.<br />7 propriétés d'exception pour vos vacances.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {lieux.map(l => (
            <button key={l} onClick={() => setFilterLieu(l)} style={{
              padding: "8px 18px", borderRadius: 20, border: "1px solid",
              borderColor: filterLieu === l ? "#22c55e" : "#1e293b",
              background: filterLieu === l ? "rgba(34,197,94,0.1)" : "transparent",
              color: filterLieu === l ? "#22c55e" : "#64748b",
              cursor: "pointer", fontSize: 14, fontWeight: filterLieu === l ? 600 : 400,
            }}>
              {l === "all" ? "Tous les biens" : l}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24, paddingBottom: 80 }}>
          {filtered.map(b => (
            <BienCard key={b.id} bien={b} onBook={setSelectedBien} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1e293b", padding: "32px 24px", textAlign: "center", color: "#475569", fontSize: 13 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#64748b", marginBottom: 8 }}>🌺 Amaryllis Locations</div>
          <div>7 propriétés · France & Martinique · Réservation directe sans frais</div>
          <div style={{ marginTop: 16, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/admin" style={{ color: "#475569", textDecoration: "none" }}>Espace propriétaire</a>
          </div>
        </div>
      </footer>

      {/* Booking modal */}
      {selectedBien && (
        <BookingModal
          bien={selectedBien}
          blockedDates={blockedDates[selectedBien.id] || []}
          onClose={() => setSelectedBien(null)}
        />
      )}
    </div>
  );
}

// Styles
const btnPrimary = {
  background: "#22c55e",
  color: "#000",
  border: "none",
  borderRadius: 10,
  padding: "12px 24px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const btnSecondary = {
  background: "transparent",
  color: "#94a3b8",
  border: "1px solid #1e293b",
  borderRadius: 10,
  padding: "12px 20px",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};
