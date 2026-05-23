import { useState, useEffect } from "react";

const STRIPE_PK = "pk_live_51QAsyQDstT3IRAj26eVHpBuMZI8UllaKGCCJUNAW5O9BfC3NqzVJwhrgfF0VndNMWPph0vijKomm24OwrTXCG58N00Co6GOWh1";

const IVORY  = "var(--c-ivory)";
const CREAM  = "var(--c-cream)";
const NAVY   = "var(--c-navy)";
const CORAL  = "var(--c-coral)";
const SAND   = "var(--c-sand)";
const MUTED  = "var(--c-muted)";

const btnPrimary = {
  border: "none", borderRadius: 6,
  padding: "13px 26px",
  fontWeight: 700, fontSize: 14,
  cursor: "pointer",
  transition: "opacity 0.2s, transform 0.1s",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  letterSpacing: 1, textTransform: "uppercase",
};

const errStyle = {
  color: CORAL, marginTop: 14, fontSize: 13,
  background: "rgba(200,85,61,0.06)",
  border: `1px solid rgba(200,85,61,0.2)`,
  borderRadius: 8, padding: "10px 14px",
};

export default function MerciPage() {
  const params = new URLSearchParams(window.location.search);
  const depositDone = params.get("deposit") === "1";
  const paymentRedirected = !!params.get("payment_intent");
  const depositCs = sessionStorage.getItem("deposit_cs");
  const depositAmt = Number(sessionStorage.getItem("deposit_amt") || 0);
  const depositBien = sessionStorage.getItem("deposit_bien") || "";

  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  // Payment redirected via 3DS + deposit pending → mount deposit form
  const showDepositForm = paymentRedirected && depositCs && !depositDone;

  useEffect(() => {
    if (window.Stripe) setStripe(window.Stripe(STRIPE_PK));
  }, []);

  useEffect(() => {
    if (!showDepositForm || !stripe || !depositCs) return;
    const appearance = { theme: "stripe", variables: { colorPrimary: CORAL, borderRadius: "8px", colorBackground: CREAM, colorText: NAVY } };
    const el = stripe.elements({ clientSecret: depositCs, appearance });
    el.create("payment").mount("#spe-merci-deposit");
    setElements(el);
  }, [showDepositForm, stripe, depositCs]);

  async function handleDepositMerci() {
    if (!stripe || !elements) return;
    setPaying(true); setError("");
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/merci?deposit=1" },
      redirect: "if_required",
    });
    if (err) setError(err.message);
    setPaying(false);
  }

  // Deposit completed → clear sessionStorage
  useEffect(() => {
    if (depositDone) {
      sessionStorage.removeItem("deposit_cs");
      sessionStorage.removeItem("deposit_amt");
      sessionStorage.removeItem("deposit_bien");
      sessionStorage.removeItem("deposit_checkin");
      sessionStorage.removeItem("deposit_checkout");
    }
  }, [depositDone]);

  // Purchase event pour les paiements 3DS redirigés vers /merci
  useEffect(() => {
    if (paymentRedirected && !depositDone && window.gtag) {
      const pi = params.get("payment_intent");
      // Récupère le montant stocké dans sessionStorage avant la redirection 3DS
      const storedAmt = Number(sessionStorage.getItem("deposit_amt") || 0);
      window.gtag("event", "purchase", {
        transaction_id: pi,
        currency: "EUR",
        value: storedAmt || 0,
      });
    }
  }, []);

  if (showDepositForm) {
    return (
      <div style={{ minHeight: "100vh", background: IVORY, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(200,85,61,0.1)", border: `2px solid ${CORAL}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 20px" }}>✓</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: NAVY, marginBottom: 8 }}>Paiement confirmé !</h1>
            <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>Une dernière étape : le dépôt de garantie pour <strong>{depositBien}</strong>.</p>
          </div>
          <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: "#92400e", fontSize: 14, marginBottom: 6 }}>🔒 Dépôt de garantie — {depositAmt.toLocaleString("fr-FR")} €</div>
            <div style={{ color: "#78350f", fontSize: 13, lineHeight: 1.6 }}>
              Montant <strong>bloqué</strong> mais <strong>non débité</strong>. Libéré automatiquement après votre départ sans dommages.
            </div>
          </div>
          <div id="spe-merci-deposit" style={{ marginBottom: 24 }} />
          <button
            onClick={handleDepositMerci}
            disabled={paying}
            style={{ ...btnPrimary, width: "100%", background: paying ? SAND : "#d97706", color: "#fff", opacity: paying ? 0.6 : 1 }}
          >
            {paying ? "Traitement…" : `🔒 Valider le blocage — ${depositAmt.toLocaleString("fr-FR")} €`}
          </button>
          {error && <div style={{ ...errStyle, marginTop: 12 }}>⚠ {error}</div>}
          <div style={{ marginTop: 16, textAlign: "center", color: MUTED, fontSize: 12 }}>🔒 Pré-autorisation sécurisée · Aucun débit sans dommage constaté</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: IVORY, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, textAlign: "center", padding: 32 }}>
      <div>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `rgba(200,85,61,0.1)`, border: `2px solid ${CORAL}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 28px" }}>✓</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12, color: NAVY }}>Réservation confirmée !</h1>
        <p style={{ color: MUTED, fontSize: 16, maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Merci pour votre réservation. Un email de confirmation vous sera envoyé dans quelques minutes.
        </p>
        {depositDone && (
          <p style={{ color: "#92400e", fontSize: 14, maxWidth: 380, margin: "-20px auto 28px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 16px" }}>
            🔒 Dépôt de garantie bloqué · Libéré automatiquement après votre séjour
          </p>
        )}
        <a href="/" style={{ ...btnPrimary, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, background: CORAL, color: "#fff" }}>← Retour à l'accueil</a>
      </div>
    </div>
  );
}
