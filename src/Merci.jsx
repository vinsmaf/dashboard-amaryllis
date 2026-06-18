import { useState, useEffect } from "react";
import { mpTrack } from "./lib/metaPixel.js";
import { ssGet, ssSet, ssRemove } from "./lib/safeStorage.js";
import { trackConversion, listActiveVariants } from "./utils/abTest.js";

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


export default function MerciPage() {
  const params = new URLSearchParams(window.location.search);
  const depositDone = params.get("deposit") === "1";
  const paymentRedirected = !!params.get("payment_intent");
  const depositCs = ssGet("deposit_cs");
  const depositAmt = Number(ssGet("deposit_amt") || 0);
  const depositBien = ssGet("deposit_bien", "") || "";

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
    // Le séjour est déjà payé (on est sur /merci après redirection) : un échec de
    // caution ne doit ni bloquer ni inquiéter → message rassurant + on laisse finir.
    if (err) setError("__CAUTION_SOFT_FAIL__");
    setPaying(false);
  }

  // Deposit completed → clear sessionStorage
  useEffect(() => {
    if (depositDone) {
      ssRemove("deposit_cs");
      ssRemove("deposit_amt");
      ssRemove("deposit_bien");
      ssRemove("deposit_checkin");
      ssRemove("deposit_checkout");
    }
  }, [depositDone]);

  // Purchase event : couvre DEUX cas :
  //   1. Paiement 3DS → Stripe redirige vers /merci?payment_intent=pi_xxx (paymentRedirected=true)
  //   2. Paiement non-3DS → navigation directe à /merci, pending_purchase contient le pi
  // ⚠️ gtag est chargé de façon ASYNCHRONE → on attend qu'il soit prêt (retry max ~10s).
  // Guard key (sessionStorage) évite le double-fire si l'inline handler a déjà réussi.
  useEffect(() => {
    if (depositDone) return;

    const pi = params.get("payment_intent");
    const status = params.get("redirect_status");
    if (paymentRedirected && status && status !== "succeeded") return; // 3DS échoué

    // Contexte stocké avant la redirection (montant RÉEL + bien + items + pi non-3DS)
    let ctx = {};
    try { ctx = JSON.parse(ssGet("pending_purchase", "{}") || "{}"); } catch { /* */ }

    // PI disponible : depuis l'URL (3DS) ou depuis le contexte stocké (non-3DS)
    const effectivePi = pi || ctx.pi;
    if (!effectivePi) return; // pas de paiement à tracker

    const guardKey = `ga_purchase_fired_${effectivePi}`;
    if (ssGet(guardKey)) { ssRemove("pending_purchase"); return; } // déjà firé inline

    const value = Number(ctx.value || ctx.amount || ssGet("deposit_amt") || 0);

    let tries = 0;
    const fire = () => {
      if (!window.gtag) { if (tries++ < 25) { setTimeout(fire, 400); } return; } // attend gtag (max ~10s)
      ssSet(guardKey, "1");
      const payload = { transaction_id: effectivePi, currency: "EUR", value };
      if (ctx.bien_id) payload.bien_id = ctx.bien_id;
      if (ctx.niveau_tarifaire) payload.niveau_tarifaire = ctx.niveau_tarifaire;
      if (Array.isArray(ctx.items)) payload.items = ctx.items;
      try { window.gtag("event", "purchase", payload); } catch { /* */ }
      // event_id = payment_intent_id → déduplication avec la CAPI serveur (stripe-webhook.js)
      try { mpTrack("Purchase", { value, currency: "EUR", eventID: effectivePi, ...(ctx.bien_id ? { content_ids: [ctx.bien_id], content_type: "product" } : {}) }); } catch { /* */ }
      // RM-15 : conversion FINALE (résa confirmée = métrique primaire du playbook) attribuée
      // aux tests A/B où l'user est RÉELLEMENT exposé (cookie présent → pas de fausse attribution).
      // step:"purchase" distingue ces conversions des events clic/scroll. Guardé par guardKey → 1×/pi.
      try {
        const variants = listActiveVariants();
        Object.keys(variants).forEach(testName =>
          trackConversion(testName, { step: "purchase", transaction_id: effectivePi, value })
        );
      } catch { /* */ }
      ssRemove("pending_purchase");
    };
    fire();
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
          {error && (
            <div style={{ marginTop: 14, background: "rgba(16,122,120,0.06)", border: "1px solid rgba(16,122,120,0.25)", borderRadius: 10, padding: "16px 18px", textAlign: "left" }}>
              <div style={{ fontWeight: 700, color: NAVY, fontSize: 14, marginBottom: 6 }}>✓ Votre réservation est confirmée</div>
              <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                Votre paiement est validé. Le blocage de la caution n'a pas pu aboutir cette fois
                (refus ponctuel de votre banque) — ce n'est rien : nous vous enverrons un lien
                pour la déposer en quelques secondes.
              </div>
              <button
                onClick={() => {
                  // Alerte hôte best-effort : caution non déposée → Vincent envoie un lien séparé.
                  const voyageur = ssGet("deposit_voyageur", "") || "Voyageur";
                  const email = ssGet("deposit_email", "") || "non communiqué";
                  fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      nom: voyageur,
                      email,
                      bien: depositBien,
                      source: "caution-skipped",
                      message: `⚠️ CAUTION NON DÉPOSÉE — séjour payé, blocage de caution échoué côté client.\nÀ relancer via l'onglet Cautions → « Générer lien Stripe ».\n\nVoyageur : ${voyageur}\nBien : ${depositBien}\nDates : ${ssGet("deposit_checkin", "") || "?"} → ${ssGet("deposit_checkout", "") || "?"}\nCaution : ${depositAmt}€`,
                    }),
                  }).catch(() => {});
                  window.location.href = "/merci?deposit=skipped";
                }}
                style={{ ...btnPrimary, width: "100%", background: CORAL, color: "#fff" }}
              >
                Finaliser ma réservation →
              </button>
            </div>
          )}
          {!error && <div style={{ marginTop: 16, textAlign: "center", color: MUTED, fontSize: 12 }}>🔒 Pré-autorisation sécurisée · Aucun débit sans dommage constaté</div>}
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
