// Page publique /etat-des-lieux-menage — outil dédié au personnel de ménage de
// l'Appartement Nogent (Nesrine / La Fine Conciergerie). Contrairement à
// /etat-des-lieux (voyageur, lien personnalisé par résa envoyé par email), celle-ci
// est un lien FIXE à mettre en favori — pas de token de résa, utilisable à tout
// moment (avant/après chaque ménage). Mêmes photos que côté voyageur + un champ
// Remarques libre (fuite, casse, oubli voyageur, matériel manquant...).
import { useState, useRef } from "react";
import { compressImage } from "./utils/compressImage.js";

const MAX_PHOTOS = 8;
const MAX_REMARQUES = 2000;

export default function EtatDesLieuxMenage() {
  const [nom, setNom] = useState("");
  const [remarques, setRemarques] = useState("");
  const [photos, setPhotos] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { setError(`Maximum ${MAX_PHOTOS} photos.`); return; }
    setProcessing(true);
    setError("");
    try {
      const compressed = await Promise.all(files.slice(0, room).map(compressImage));
      setPhotos(p => [...p, ...compressed]);
    } catch (err) {
      setError(err.message || "Erreur lors du traitement d'une photo.");
    } finally {
      setProcessing(false);
    }
  }

  function removePhoto(i) {
    setPhotos(p => p.filter((_, idx) => idx !== i));
  }

  async function submit(e) {
    e.preventDefault();
    if (nom.trim().length < 2) { setError("Merci d'indiquer votre nom."); return; }
    if (photos.length < 1 && !remarques.trim()) {
      setError("Ajoutez au moins une photo ou une remarque.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bienId: "nogent", bienNom: "Appartement Nogent",
          nom: nom.trim(), type: "etat_lieux_menage", photos,
          remarques: remarques.trim().slice(0, MAX_REMARQUES),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Erreur serveur");
      setSent(true);
    } catch (err) {
      setError(err.message || "Une erreur est survenue, veuillez réessayer.");
    } finally {
      setSubmitting(false);
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
    textarea: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #d4c8b8", fontSize: 14, color: "#1a0a00", background: "#faf8f5", outline: "none", boxSizing: "border-box", minHeight: 110, resize: "vertical", fontFamily: "inherit" },
    row:   { marginBottom: 18 },
    btn:   { width: "100%", padding: "13px 0", background: "#0e3b3a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 },
    btnSecondary: { width: "100%", padding: "13px 0", background: "#fff", color: "#0e3b3a", border: "1.5px solid #0e3b3a", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
    err:   { background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 16 },
    grid:  { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 },
    thumb: { position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: "1px solid #e0d4bc" },
    thumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
    thumbRemove: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", fontSize: 13, lineHeight: 1, cursor: "pointer" },
  };

  if (sent) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={s.h1}>État des lieux envoyé</h1>
          <p style={{ ...s.sub, marginBottom: 0 }}>
            Merci {nom.trim().split(" ")[0]}, c'est bien transmis à Vincent.
          </p>
          <button
            type="button"
            style={{ ...s.btnSecondary, marginTop: 20 }}
            onClick={() => { setSent(false); setNom(nom); setRemarques(""); setPhotos([]); setError(""); }}
          >
            Faire un nouvel état des lieux
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>Amaryllis Locations</div>
        <h1 style={s.h1}>État des lieux — Ménage</h1>
        <p style={s.sub}>
          Appartement Nogent<br />
          Photographiez ce que vous constatez (dégât, oubli, matériel manquant…) et ajoutez une remarque si besoin. Vincent reçoit tout immédiatement.
        </p>

        {error && <div style={s.err}>{error}</div>}

        <form onSubmit={submit} noValidate>
          <div style={s.row}>
            <label style={s.label}>Votre nom <span style={{ color: "#e84a4a" }}>*</span></label>
            <input style={s.input} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nesrine" />
          </div>

          <div style={s.row}>
            <label style={s.label}>Photos ({photos.length}/{MAX_PHOTOS})</label>
            {photos.length > 0 && (
              <div style={s.grid}>
                {photos.map((p, i) => (
                  <div key={i} style={s.thumb}>
                    <img src={p} alt={`Photo ${i + 1}`} style={s.thumbImg} />
                    <button type="button" onClick={() => removePhoto(i)} style={s.thumbRemove} aria-label="Retirer cette photo">✕</button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < MAX_PHOTOS && (
              <>
                <input
                  ref={fileRef} type="file" accept="image/*" capture="environment" multiple
                  onChange={handleFiles} style={{ display: "none" }}
                />
                <button
                  type="button" onClick={() => fileRef.current?.click()}
                  style={s.btnSecondary} disabled={processing}
                >
                  {processing ? "Traitement…" : "📷 Ajouter des photos"}
                </button>
              </>
            )}
          </div>

          <div style={s.row}>
            <label style={s.label}>Remarques</label>
            <textarea
              style={s.textarea} value={remarques} maxLength={MAX_REMARQUES}
              onChange={e => setRemarques(e.target.value)}
              placeholder="Ex : robinet salle de bain qui fuit, télécommande clim manquante, tache sur le canapé…"
            />
          </div>

          <button style={s.btn} type="submit" disabled={submitting || processing}>
            {submitting ? "Envoi en cours…" : "Envoyer l'état des lieux"}
          </button>
        </form>
      </div>
    </div>
  );
}
