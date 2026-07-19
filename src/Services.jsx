// Page publique /services/<bien> — achat de services additionnels par le voyageur.
// Ouverte sur le téléphone via le QR de l'écran TV. Mobile-first, surface "site".
import { useState, useEffect } from "react";
import SEOMeta from "./SEOMeta.jsx";

const NAVY = "#0e3b3a", CORAL = "#c47254", GOLD = "#c9a673", IVORY = "#faf5e9", SAND = "#e0d4bc", TEXT = "#3a3530", MUTED = "#7a6b5a";
const NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya", schoelcher: "Appartement Bellevue", nogent: "Appartement Nogent" };

function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return d && m ? `${d}/${m}` : iso;
}

export default function Services() {
  const bien = window.location.pathname.split("/services/")[1]?.replace(/\/$/, "").toLowerCase() || "amaryllis";
  const params = new URLSearchParams(window.location.search);
  const paid = params.get("paid") === "1";
  // Personnalisation optionnelle (lien envoyé à un voyageur précis, ex. depuis l'admin) —
  // ?nom=Stéphane+Alves&checkin=2026-07-14&checkout=2026-07-20. Sans ces params, la page
  // reste le catalogue générique existant (comportement inchangé).
  const guestNom = params.get("nom") || "";
  const guestCheckin = params.get("checkin") || "";
  const guestCheckout = params.get("checkout") || "";
  const [extras, setExtras] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(`/api/guides?property_id=${bien}`).then(r => r.json())
      .then(d => setExtras(Array.isArray(d?.guide?.extras) ? d.guide.extras : []))
      .catch(() => setExtras([]));
  }, [bien]);

  const buy = async (serviceId) => {
    setErr(null); setBusy(serviceId);
    try {
      const r = await fetch("/api/service-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bien, serviceId }),
      });
      const d = await r.json();
      if (d.ok && d.url) { window.location.assign(d.url); return; }
      setErr(d.error || "Paiement indisponible pour le moment.");
    } catch { setErr("Connexion impossible. Réessayez."); }
    setBusy(null);
  };

  const nom = NAMES[bien] || "votre logement";

  return (
    <div style={{ minHeight: "100vh", background: IVORY, fontFamily: "'Jost', system-ui, sans-serif", color: TEXT }}>
      <SEOMeta title={`Services & extras — ${nom}`} description="Services additionnels pour votre séjour : départ tardif, ménage, planteur maison." canonical={`/services/${bien}`} />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=Cormorant+Garamond:ital@0;1&display=swap');`}</style>

      <header style={{ background: NAVY, color: IVORY, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href={`/${bien}`} style={{ color: IVORY, textDecoration: "none", fontWeight: 300, letterSpacing: ".15em", textTransform: "uppercase", fontSize: 16 }}>Amaryllis</a>
        <span style={{ fontSize: 12, opacity: .7 }}>{nom}</span>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px 60px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".3em", textTransform: "uppercase", color: CORAL, margin: "0 0 8px" }}>Pendant votre séjour</p>
        <h1 style={{ fontWeight: 300, fontSize: 30, color: NAVY, margin: "0 0 6px", lineHeight: 1.1 }}>Services &amp; extras</h1>

        {guestNom ? (
          <div style={{ background: "#fff", border: `1px solid ${SAND}`, borderRadius: 14, padding: "16px 18px", margin: "12px 0 24px" }}>
            <p style={{ margin: 0, fontSize: 15, color: TEXT }}>
              Bonjour <strong>{guestNom}</strong>,
              {guestCheckin && guestCheckout && (
                <> votre séjour du <strong>{fmtDate(guestCheckin)}</strong> au <strong>{fmtDate(guestCheckout)}</strong>.</>
              )}
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 17, color: MUTED, margin: "6px 0 0" }}>
              Offrez-vous un petit plus — réglez en ligne en quelques secondes.
            </p>
          </div>
        ) : (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 19, color: MUTED, margin: "0 0 24px" }}>
            Offrez-vous un petit plus — réglez en ligne en quelques secondes.
          </p>
        )}

        {paid && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", borderRadius: 12, padding: "14px 16px", marginBottom: 20, fontSize: 14 }}>
            ✅ Merci ! Votre demande est confirmée — nous revenons vers vous très vite.
          </div>
        )}
        {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 14 }}>{err}</div>}

        {extras === null ? (
          <div style={{ color: MUTED, fontSize: 14 }}>Chargement…</div>
        ) : extras.length === 0 ? (
          <div style={{ color: MUTED, fontSize: 14 }}>Aucun service disponible pour le moment. Contactez votre hôte.</div>
        ) : extras.map((e) => (
          <div key={e.id} style={{ background: "#fff", border: `1px solid ${SAND}`, borderRadius: 16, padding: "18px 20px", marginBottom: 14, boxShadow: "0 2px 10px rgba(14,59,58,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <h2 style={{ fontWeight: 600, fontSize: 17, color: NAVY, margin: 0 }}>{e.label}</h2>
              <div style={{ fontWeight: 600, fontSize: 22, color: NAVY, whiteSpace: "nowrap" }}>{e.price} €</div>
            </div>
            {e.desc && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: TEXT, margin: "6px 0 14px", lineHeight: 1.4 }}>{e.desc}</p>}
            {e.kind === "sur-demande" && <p style={{ fontSize: 11, color: GOLD, margin: "0 0 12px", letterSpacing: ".04em" }}>★ Selon disponibilité — confirmé par votre hôte après paiement</p>}
            <button onClick={() => buy(e.id)} disabled={!!busy}
              style={{ width: "100%", background: busy === e.id ? "#9c5640" : CORAL, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", cursor: busy ? "default" : "pointer" }}>
              {busy === e.id ? "Redirection vers le paiement…" : `Réserver · ${e.price} €`}
            </button>
          </div>
        ))}

        <p style={{ fontSize: 12, color: MUTED, textAlign: "center", marginTop: 24, lineHeight: 1.5 }}>
          Paiement sécurisé par carte (Stripe). Une question ? <a href={`/${bien}`} style={{ color: CORAL }}>Contactez-nous</a>.
        </p>
      </main>
    </div>
  );
}
