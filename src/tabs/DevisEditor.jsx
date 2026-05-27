/**
 * DevisEditor — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState } from "react";

export default function DevisEditor() {
  const [form, setForm] = useState({
    bienId: "amaryllis",
    checkin: "",
    checkout: "",
    voyageur: "",
    email: "",
    phone: "",
    montantSejour: "",
    fraisMenage: "",
    avecDepot: true,
    depotCustom: "",
  });
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  // ebiz-005 : Stripe Payment Link
  const [stripeLink, setStripeLink]       = useState("");
  const [stripeCopied, setStripeCopied]   = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError]     = useState("");

  const bien = BIENS_DEVIS.find(b => b.id === form.bienId);
  const montant = parseFloat(form.montantSejour) || 0;
  const menage  = parseFloat(form.fraisMenage)   || 0;
  const total   = montant + menage;
  const depot   = form.avecDepot
    ? (parseFloat(form.depotCustom) || bien?.depot || 0)
    : 0;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generate = () => {
    if (!total) return;
    const data = {
      bienId: form.bienId,
      bienNom: bien?.nom || form.bienId,
      checkin: form.checkin,
      checkout: form.checkout,
      voyageur: form.voyageur,
      email: form.email,
      montantSejour: montant,
      fraisMenage: menage,
      total,
      depot,
    };
    const encoded = btoa(JSON.stringify(data));
    setLink(`${window.location.origin}/devis?d=${encoded}`);
  };

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ebiz-005 : génère un vrai Stripe Payment Link
  const generateStripeLink = async () => {
    if (!total || !form.checkin || !form.checkout) return;
    setStripeLoading(true);
    setStripeError("");
    setStripeLink("");
    try {
      const nights = form.checkin && form.checkout
        ? Math.round((new Date(form.checkout) - new Date(form.checkin)) / 86400000)
        : null;
      const res = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || ""),
        },
        body: JSON.stringify({
          amount:    Math.round(total * 100), // centimes
          bienId:    form.bienId,
          bienNom:   bien?.nom || form.bienId,
          checkin:   form.checkin,
          checkout:  form.checkout,
          voyageur:  form.voyageur,
          email:     form.email,
          nights,
          type:      "total",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Erreur Stripe");
      setStripeLink(data.url);
    } catch (err) {
      setStripeError(err.message);
    } finally {
      setStripeLoading(false);
    }
  };

  const copyStripe = () => {
    navigator.clipboard.writeText(stripeLink);
    setStripeCopied(true);
    setTimeout(() => setStripeCopied(false), 2000);
  };

  // Partage WhatsApp avec le lien Stripe
  const shareWA = () => {
    if (!stripeLink) return;
    const fmtDate = (iso) => {
      if (!iso) return "?";
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    };
    const nights = form.checkin && form.checkout
      ? Math.round((new Date(form.checkout) - new Date(form.checkin)) / 86400000)
      : null;
    const msg = [
      `Bonjour ${form.voyageur ? form.voyageur.split(" ")[0] : ""},`,
      ``,
      `Voici votre lien de paiement sécurisé pour votre séjour à ${bien?.nom || form.bienId} :`,
      `📅 ${fmtDate(form.checkin)} → ${fmtDate(form.checkout)}${nights ? ` (${nights} nuit${nights > 1 ? "s" : ""})` : ""}`,
      `💶 Total : ${total.toLocaleString("fr-FR")} €`,
      ``,
      `🔒 Paiement sécurisé Stripe :`,
      stripeLink,
      ``,
      `En cas de question, n'hésitez pas à me contacter.`,
      `Amaryllis Locations`,
    ].join("\n");
    const phone = form.phone.replace(/[^0-9+]/g, "");
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  const card = { background: "#1e293b", borderRadius: 12, padding: "20px 24px", border: "1px solid rgba(255,255,255,0.06)" };
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box" };
  const label = { fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5, display: "block" };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#f1f5f9" }}>📋 Créer un devis personnalisé</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Génère un lien de paiement sur mesure à envoyer à ton voyageur</p>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={label}>Villa / Appartement</label>
            <select value={form.bienId} onChange={e => set("bienId", e.target.value)} style={inp}>
              {BIENS_DEVIS.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Check-in</label>
            <input type="date" value={form.checkin} onChange={e => set("checkin", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>Check-out</label>
            <input type="date" value={form.checkout} onChange={e => set("checkout", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>Nom du voyageur</label>
            <input type="text" placeholder="Jean Dupont" value={form.voyageur} onChange={e => set("voyageur", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>Email</label>
            <input type="email" placeholder="jean@email.com" value={form.email} onChange={e => set("email", e.target.value)} style={inp} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={label}>WhatsApp voyageur (optionnel)</label>
            <input type="tel" placeholder="+596 696 00 00 00" value={form.phone} onChange={e => set("phone", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>Montant séjour (€)</label>
            <input type="number" placeholder="ex: 800" value={form.montantSejour} onChange={e => set("montantSejour", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>Frais de ménage (€)</label>
            <input type="number" placeholder="ex: 80" value={form.fraisMenage} onChange={e => set("fraisMenage", e.target.value)} style={inp} />
          </div>
        </div>

        <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(245,158,11,0.06)", borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: form.avecDepot ? 10 : 0 }}>
            <input type="checkbox" id="avecDepot" checked={form.avecDepot} onChange={e => set("avecDepot", e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
            <label htmlFor="avecDepot" style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, cursor: "pointer" }}>
              🔒 Inclure un dépôt de garantie (pré-autorisation)
            </label>
          </div>
          {form.avecDepot && (
            <div>
              <label style={{ ...label, color: "#92400e" }}>Montant du dépôt (€) — défaut : {bien?.depot} €</label>
              <input type="number" placeholder={`${bien?.depot}`} value={form.depotCustom} onChange={e => set("depotCustom", e.target.value)} style={{ ...inp, width: 160 }} />
            </div>
          )}
        </div>
      </div>

      {total > 0 && (
        <div style={{ ...card, marginBottom: 16, borderColor: "rgba(14,165,233,0.3)" }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Récapitulatif du devis</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {montant > 0 && <div><span style={{ fontSize: 11, color: "#64748b" }}>Séjour</span><br /><span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{montant.toLocaleString("fr-FR")} €</span></div>}
            {menage > 0 && <div><span style={{ fontSize: 11, color: "#64748b" }}>Ménage</span><br /><span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{menage.toLocaleString("fr-FR")} €</span></div>}
            <div><span style={{ fontSize: 11, color: "#0ea5e9" }}>Total à payer</span><br /><span style={{ fontSize: 20, fontWeight: 700, color: "#0ea5e9" }}>{total.toLocaleString("fr-FR")} €</span></div>
            {depot > 0 && <div><span style={{ fontSize: 11, color: "#f59e0b" }}>Dépôt (bloqué)</span><br /><span style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>{depot.toLocaleString("fr-FR")} €</span></div>}
          </div>
        </div>
      )}

      {/* Boutons de génération */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={generate} disabled={!total}
          style={{ padding: "12px 22px", borderRadius: 10, border: "none", background: total ? "#0ea5e9" : "#334155", color: "#fff", fontSize: 13, fontWeight: 700, cursor: total ? "pointer" : "default" }}>
          🔗 Lien devis interne
        </button>

        {/* ebiz-005 : Stripe Payment Link */}
        <button
          onClick={generateStripeLink}
          disabled={!total || !form.checkin || !form.checkout || stripeLoading}
          style={{
            padding: "12px 22px", borderRadius: 10, border: "none",
            background: (!total || !form.checkin || !form.checkout) ? "#334155" : stripeLoading ? "#334155" : "#7c3aed",
            color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: (!total || !form.checkin || !form.checkout || stripeLoading) ? "default" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {stripeLoading ? "⏳ Création…" : "💳 Lien paiement Stripe"}
        </button>
      </div>

      {/* Devis interne */}
      {link && (
        <div style={{ ...card, borderColor: "#10b981", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginBottom: 8 }}>✓ Devis interne (page Amaryllis)</div>
          <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#7dd3fc", wordBreak: "break-all", marginBottom: 10 }}>{link}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copy} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: copied ? "#10b981" : "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {copied ? "✓ Copié !" : "📋 Copier"}
            </button>
            <a href={link} target="_blank" rel="noopener noreferrer"
              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              🔗 Ouvrir
            </a>
          </div>
        </div>
      )}

      {/* ebiz-005 : Stripe Payment Link */}
      {stripeError && (
        <div style={{ ...card, borderColor: "#ef4444", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>⚠️ Erreur Stripe</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{stripeError}</div>
        </div>
      )}
      {stripeLink && (
        <div style={{ ...card, borderColor: "#7c3aed", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600, marginBottom: 8 }}>💳 Lien Stripe prêt — paiement direct en {(total).toLocaleString("fr-FR")} €</div>
          <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#c4b5fd", wordBreak: "break-all", marginBottom: 10 }}>{stripeLink}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={copyStripe} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: stripeCopied ? "#10b981" : "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {stripeCopied ? "✓ Copié !" : "📋 Copier"}
            </button>
            <button onClick={shareWA} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#25d366", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <span>📱</span> Envoyer via WhatsApp
            </button>
            <a href={stripeLink} target="_blank" rel="noopener noreferrer"
              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              🔗 Tester
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
