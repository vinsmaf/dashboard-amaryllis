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
  const [bienId, setBienId] = useState("");

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

  // Purchase : GA4 est envoyé UNIQUEMENT côté serveur par stripe-webhook.js (source unique et
  // fiable — se déclenche même si ce navigateur ferme l'onglet avant d'arriver ici). Avant
  // 2026-07-20, ce useEffect envoyait AUSSI un gtag('purchase') côté client → chaque résa était
  // comptée 2× dans GA4/Google Ads (GA4 n'a pas de dédup client/serveur par transaction_id,
  // contrairement à Meta qui déduplique pixel+CAPI via eventID). cf. ADR-GA4-DEDUP-001.
  // Ce useEffect ne fait donc plus que le Meta Pixel client + le tracking A/B, guardés 1×/pi.
  // Couvre DEUX cas : 1) paiement 3DS → redirect Stripe avec ?payment_intent=pi_xxx,
  // 2) paiement non-3DS → navigation directe, pending_purchase contient le pi.
  useEffect(() => {
    if (depositDone) return;

    const pi = params.get("payment_intent");
    const status = params.get("redirect_status");
    if (paymentRedirected && status && status !== "succeeded") return; // 3DS échoué

    let ctx = {};
    try { ctx = JSON.parse(ssGet("pending_purchase", "{}") || "{}"); } catch { /* */ }

    const effectivePi = pi || ctx.pi;
    if (!effectivePi) return; // pas de paiement à tracker

    if (ctx.bien_id) setBienId(ctx.bien_id);
    const guardKey = `client_purchase_fired_${effectivePi}`;
    if (ssGet(guardKey)) { ssRemove("pending_purchase"); return; } // déjà firé
    ssSet(guardKey, "1");

    const value = Number(ctx.value || ctx.amount || ssGet("deposit_amt") || 0);

    // event_id = payment_intent_id → déduplication avec la CAPI serveur (stripe-webhook.js)
    try { mpTrack("Purchase", { value, currency: "EUR", eventID: effectivePi, ...(ctx.bien_id ? { content_ids: [ctx.bien_id], content_type: "product" } : {}) }); } catch { /* */ }
    // RM-15 : conversion FINALE (résa confirmée = métrique primaire du playbook) attribuée
    // aux tests A/B où l'user est RÉELLEMENT exposé (cookie présent → pas de fausse attribution).
    try {
      const variants = listActiveVariants();
      Object.keys(variants).forEach(testName =>
        trackConversion(testName, { step: "purchase", transaction_id: effectivePi, value })
      );
    } catch { /* */ }
    ssRemove("pending_purchase");
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

  const REVIEW_LINKS = {
    amaryllis:  "https://search.google.com/local/writereview?placeid=ChIJWbeKdLghQIwRCppz2lJ39Jk",
    zandoli:    "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
    geko:       "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
    mabouya:    "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
    iguana:     "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs",
  };
  const reviewUrl = REVIEW_LINKS[bienId] || "https://search.google.com/local/writereview?placeid=ChIJWbeKdLghQIwRCppz2lJ39Jk";
  const waShareText = encodeURIComponent("Je viens de réserver un logement via villamaryllis.com 🌴 — si tu cherches un hébergement en Martinique, je te le recommande !");
  const waShareUrl = `https://wa.me/?text=${waShareText}`;

  return (
    <div style={{ minHeight: "100vh", background: IVORY, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, textAlign: "center", padding: 32 }}>
      <div style={{ maxWidth: 480, width: "100%" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `rgba(200,85,61,0.1)`, border: `2px solid ${CORAL}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 28px" }}>✓</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12, color: NAVY }}>Réservation confirmée !</h1>
        <p style={{ color: MUTED, fontSize: 16, maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.6 }}>
          Merci pour votre réservation. Un email de confirmation vous sera envoyé dans quelques minutes.
        </p>
        {depositDone && (
          <p style={{ color: "#92400e", fontSize: 14, margin: "0 auto 24px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 16px" }}>
            🔒 Dépôt de garantie bloqué · Libéré automatiquement après votre séjour
          </p>
        )}

        {/* Avis Google */}
        <div style={{ background: "rgba(200,85,61,0.04)", border: "1px solid rgba(200,85,61,0.15)", borderRadius: 12, padding: "20px 24px", marginBottom: 16, textAlign: "left" }}>
          <div style={{ fontWeight: 700, color: NAVY, fontSize: 15, marginBottom: 6 }}>⭐ Un avis, ça compte beaucoup</div>
          <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, margin: "0 0 14px" }}>
            Après votre séjour, un avis Google aide d'autres voyageurs à nous trouver et nous aide à nous améliorer.
          </p>
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...btnPrimary, textDecoration: "none", background: CORAL, color: "#fff", fontSize: 12, padding: "10px 20px" }}
          >
            Laisser un avis Google →
          </a>
        </div>

        {/* Partage WhatsApp */}
        <div style={{ background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 12, padding: "16px 24px", marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontWeight: 700, color: NAVY, fontSize: 14, marginBottom: 4 }}>📲 Partagez avec vos proches</div>
          <p style={{ color: MUTED, fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>Vous connaissez quelqu'un qui cherche un logement en Martinique ?</p>
          <a
            href={waShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...btnPrimary, textDecoration: "none", background: "#25d366", color: "#fff", fontSize: 12, padding: "10px 20px" }}
          >
            Partager sur WhatsApp
          </a>
        </div>

        <a href="/" style={{ ...btnPrimary, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: MUTED, border: `1px solid var(--c-sand)`, fontSize: 12 }}>← Retour à l'accueil</a>
      </div>
    </div>
  );
}
