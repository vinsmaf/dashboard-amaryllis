// Page publique /reclamation — formulaire voyageur pour signaler un problème.
// Accessible via lien dans l'email post-séjour : /reclamation?bien=amaryllis&booking=xxx

import { useState } from "react";

const BIENS = [
  { id: "amaryllis", label: "Villa Amaryllis" },
  { id: "zandoli",   label: "Zandoli" },
  { id: "geko",      label: "Géko" },
  { id: "mabouya",   label: "Mabouya" },
  { id: "schoelcher",label: "Schœlcher" },
  { id: "nogent",    label: "Nogent-sur-Marne" },
  { id: "iguana",    label: "Villa Iguana" },
];

const OBJETS = [
  "Propreté / ménage",
  "Équipements défectueux",
  "Nuisances / bruit",
  "Problème de sécurité",
  "Literie / linge",
  "Wi-Fi / TV",
  "Piscine / jardin",
  "Accueil / communication",
  "Autre",
];

export default function ReclamationForm() {
  const params = new URLSearchParams(window.location.search);
  const bienParam    = params.get("bien") || "";
  const bookingParam = params.get("booking") || "";

  const [form, setForm] = useState({
    voyageur_nom:   "",
    voyageur_email: "",
    bien_id:        bienParam,
    booking_id:     bookingParam,
    objet:          "",
    description:    "",
    priorite:       "normale",
  });
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.objet || !form.description.trim()) {
      setError("Merci de renseigner l'objet et la description.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reclamations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, canal: "poststay" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      setSent(true);
    } catch (err) {
      setError(err.message || "Une erreur est survenue, veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  const s = {
    page:  { minHeight: "100vh", background: "#f8f5ef", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", fontFamily: "'Jost', sans-serif" },
    card:  { background: "#fff", borderRadius: 16, maxWidth: 560, width: "100%", padding: "40px 36px", boxShadow: "0 4px 32px rgba(14,59,58,.08)" },
    logo:  { fontSize: 13, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#0e3b3a", marginBottom: 28 },
    h1:    { fontSize: 22, fontWeight: 800, color: "#0e3b3a", marginBottom: 8 },
    sub:   { fontSize: 14, color: "#7a6a5a", marginBottom: 28, lineHeight: 1.6 },
    label: { display: "block", fontSize: 13, fontWeight: 600, color: "#3a2a1a", marginBottom: 6 },
    input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #d4c8b8", fontSize: 14, color: "#1a0a00", background: "#faf8f5", outline: "none", boxSizing: "border-box" },
    sel:   { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #d4c8b8", fontSize: 14, color: "#1a0a00", background: "#faf8f5", outline: "none", boxSizing: "border-box" },
    ta:    { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #d4c8b8", fontSize: 14, color: "#1a0a00", background: "#faf8f5", outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 100 },
    row:   { marginBottom: 18 },
    btn:   { width: "100%", padding: "13px 0", background: "#0e3b3a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 },
    err:   { background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 16 },
    ok:    { textAlign: "center", padding: "16px 0" },
  };

  if (sent) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={s.h1}>Réclamation reçue</h1>
          <p style={{ ...s.sub, marginBottom: 0 }}>
            Merci pour votre retour. Nous prenons votre signalement en compte et vous répondons sous 24h.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>Amaryllis Locations</div>
        <h1 style={s.h1}>Signaler un problème</h1>
        <p style={s.sub}>
          Votre séjour ne s'est pas passé comme prévu ? Décrivez-nous le problème et nous vous répondons sous 24h.
        </p>

        {error && <div style={s.err}>{error}</div>}

        <form onSubmit={submit} noValidate>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div>
              <label style={s.label}>Prénom / Nom</label>
              <input style={s.input} value={form.voyageur_nom} onChange={e => set("voyageur_nom", e.target.value)} placeholder="Marie Dupont" />
            </div>
            <div>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" value={form.voyageur_email} onChange={e => set("voyageur_email", e.target.value)} placeholder="marie@email.com" />
            </div>
          </div>

          <div style={s.row}>
            <label style={s.label}>Logement concerné</label>
            <select style={s.sel} value={form.bien_id} onChange={e => set("bien_id", e.target.value)}>
              <option value="">— Sélectionnez —</option>
              {BIENS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>

          <div style={s.row}>
            <label style={s.label}>Objet de la réclamation <span style={{ color: "#e84a4a" }}>*</span></label>
            <select style={s.sel} value={form.objet} onChange={e => set("objet", e.target.value)} required>
              <option value="">— Sélectionnez —</option>
              {OBJETS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div style={s.row}>
            <label style={s.label}>Description <span style={{ color: "#e84a4a" }}>*</span></label>
            <textarea style={s.ta} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Décrivez le problème en détail : quand c'est arrivé, ce que vous avez observé…" required />
          </div>

          <div style={s.row}>
            <label style={s.label}>Niveau d'urgence</label>
            <select style={s.sel} value={form.priorite} onChange={e => set("priorite", e.target.value)}>
              <option value="basse">Basse — problème mineur</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute — a gâché le séjour</option>
              <option value="urgente">Urgente — problème de sécurité</option>
            </select>
          </div>

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? "Envoi en cours…" : "Envoyer ma réclamation"}
          </button>
        </form>
      </div>
    </div>
  );
}
