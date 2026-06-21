// src/tabs/messagerie/BulkEmailModal.jsx
// Modal envoi groupé / segmenté — Messagerie admin.
import { useState, useEffect } from "react";

const SEGMENTS = [
  { id: "hot_carts", label: "🔥 Paniers chauds", desc: "Abandonnés avec dates futures, non convertis" },
  { id: "all_carts", label: "📋 Tous les paniers", desc: "Tous les abandonnés non convertis (dates passées incluses)" },
  { id: "past_guests", label: "🏡 Anciens voyageurs", desc: "Clients ayant déjà séjourné en direct (base repeat, RM-10/19)" },
  { id: "repeaters",   label: "⭐ Voyageurs fidèles", desc: "Revenus en direct ≥ 2 fois — segment le plus rentable (RM-19)" },
  { id: "custom",    label: "✏️ Emails personnalisés", desc: "Saisir des adresses email manuellement" },
];

const BIENS = [
  { id: "", label: "Tous les biens" },
  { id: "amaryllis", label: "Villa Amaryllis" },
  { id: "zandoli",   label: "Zandoli" },
  { id: "geko",      label: "Géko" },
  { id: "mabouya",   label: "Mabouya" },
  { id: "schoelcher", label: "Schœlcher" },
  { id: "nogent",    label: "Nogent" },
];

const TEMPLATES = [
  { id: "manual-relance",    label: "Relance",          subject: "Votre séjour chez {{bien_nom}} vous attend encore" },
  { id: "manual-decouverte", label: "Offre découverte",  subject: "Une offre exclusive pour votre prochain séjour" },
  { id: "manual-question",   label: "Question / Suivi",  subject: "Votre projet de séjour — une question ?" },
];

export default function BulkEmailModal({ isOpen, onClose }) {
  const [segment,      setSegment]      = useState("hot_carts");
  const [bienId,       setBienId]       = useState("");
  const [customEmails, setCustomEmails] = useState("");
  const [templateId,   setTemplateId]   = useState("manual-relance");
  const [subject,      setSubject]      = useState(TEMPLATES[0].subject);
  const [body,         setBody]         = useState("");
  const [promoCode,    setPromoCode]    = useState("");
  const [preview,      setPreview]      = useState([]);  // liste destinataires estimés
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending,      setSending]      = useState(false);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);

  // Fetch preview destinataires quand le segment/bien change
  useEffect(() => {
    if (!isOpen || segment === "custom") { setPreview([]); return; }
    setPreviewLoading(true);
    const token = sessionStorage.getItem("ldb_tok") || localStorage.getItem("admin_token") || "";
    // dry_run=true : compte les destinataires sans envoyer
    fetch(`/api/send-bulk-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        segment, bien_id: bienId || undefined,
        template_name: templateId,
        subject: "preview",
        html: "preview",
        dry_run: true,   // mode preview : compte les destinataires sans envoyer
      }),
    })
      .then(r => r.json())
      .then(d => setPreview(d.recipients || []))
      .catch(() => setPreview([]))
      .finally(() => setPreviewLoading(false));
  }, [isOpen, segment, bienId]);

  // Fetch template HTML quand le template change
  useEffect(() => {
    if (!templateId) return;
    fetch(`/email-templates/${templateId}.html?cb=${Date.now()}`, { cache: "no-store" })
      .then(r => r.ok ? r.text() : "")
      .then(setBody)
      .catch(() => setBody(""));
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (tpl) setSubject(tpl.subject);
  }, [templateId]);

  async function send() {
    setSending(true); setError(null); setResult(null);
    const token = sessionStorage.getItem("ldb_tok") || localStorage.getItem("admin_token") || "";
    const customList = customEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes("@"));
    try {
      const r = await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          segment,
          bien_id: bienId || undefined,
          custom_emails: segment === "custom" ? customList : undefined,
          template_name: templateId,
          subject,
          html: body,
          promo_code: promoCode.trim().toUpperCase() || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || `HTTP ${r.status}`); }
      else { setResult(d); window.dispatchEvent(new Event("amaryllis_emails_log_updated")); }
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  }

  if (!isOpen) return null;

  const customList = customEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes("@"));
  const estimatedCount = segment === "custom" ? customList.length : preview.length;
  const canSend = subject.trim() && body.trim() && templateId && !sending &&
    (segment === "custom" ? customList.length > 0 : true);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 260, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 20, overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 680, background: "#0f172a", color: "#e2e8f0", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", marginTop: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>📤 Envoi groupé</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Envoie un email à un segment de contacts en une fois</div>
          </div>
          <button onClick={onClose} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Fermer ✕</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Segment */}
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Segment</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SEGMENTS.map(s => (
                <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: 8, border: `1px solid ${segment === s.id ? "#6366f1" : "rgba(255,255,255,0.08)"}`, background: segment === s.id ? "rgba(99,102,241,0.12)" : "transparent" }}>
                  <input type="radio" name="segment" value={s.id} checked={segment === s.id} onChange={() => setSegment(s.id)} style={{ accentColor: "#6366f1" }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Filtre bien */}
          {segment !== "custom" && (
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Filtre bien (optionnel)</div>
              <select value={bienId} onChange={e => setBienId(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13 }}>
                {BIENS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
          )}

          {/* Custom emails */}
          {segment === "custom" && (
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Adresses email (séparées par virgule ou retour à la ligne)</div>
              <textarea value={customEmails} onChange={e => setCustomEmails(e.target.value)}
                placeholder="email1@exemple.com&#10;email2@exemple.com"
                style={{ width: "100%", minHeight: 80, padding: "10px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
              {customList.length > 0 && <div style={{ fontSize: 10, color: "#10b981", marginTop: 4 }}>✓ {customList.length} adresse{customList.length > 1 ? "s" : ""} détectée{customList.length > 1 ? "s" : ""}</div>}
            </div>
          )}

          {/* Preview destinataires */}
          {segment !== "custom" && (
            <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
              {previewLoading
                ? <span style={{ color: "#64748b" }}>Calcul des destinataires…</span>
                : <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{estimatedCount} destinataire{estimatedCount !== 1 ? "s" : ""} dans ce segment</span>
              }
            </div>
          )}

          {/* Template */}
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Template</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplateId(t.id)}
                  style={{ padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: templateId === t.id ? 700 : 400, background: templateId === t.id ? "#6366f1" : "rgba(255,255,255,0.06)", color: templateId === t.id ? "#fff" : "#94a3b8" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sujet */}
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sujet</div>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} maxLength={200}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Code promo optionnel */}
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Code promo (optionnel — pour traçabilité uniquement)</div>
            <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="ex: HAROLD-X7K2" maxLength={20}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box", letterSpacing: "0.05em" }} />
            <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Le code est loggué dans emails_log mais pas automatiquement inséré dans l'email — ajoute-le dans le corps si tu veux qu'il soit visible.</div>
          </div>

          {/* Corps */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Corps HTML</div>
              <span style={{ fontSize: 9, color: "#475569" }}>{body.length}/30000</span>
            </div>
            <textarea value={body} onChange={e => setBody(e.target.value)} maxLength={30000}
              style={{ width: "100%", minHeight: 160, padding: "10px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
          </div>

          {/* Erreur / résultat */}
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 7, padding: "10px 14px", fontSize: 12, color: "#f87171" }}>⚠ {error}</div>
          )}
          {result && (
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 7, padding: "12px 16px", fontSize: 12, color: "#10b981" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>✓ Envoi terminé</div>
              <div>Total : {result.total} · Envoyés : {result.sent} · Échecs : {result.failed}</div>
              {result.errors?.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 10, color: "#f87171" }}>
                  {result.errors.map((e, i) => <div key={i}>{e.email} — {e.error}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={onClose} disabled={sending} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Annuler</button>
            <button onClick={send} disabled={!canSend}
              style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: canSend ? "#6366f1" : "#334155", color: "#fff", fontSize: 12, fontWeight: 700, cursor: canSend ? "pointer" : "not-allowed" }}>
              {sending ? "Envoi en cours…" : `📤 Envoyer à ${estimatedCount || "?"} destinataire${estimatedCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
