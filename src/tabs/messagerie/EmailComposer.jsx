// src/tabs/messagerie/EmailComposer.jsx
// Modal compositeur d'email manuel : templates, code promo, aperçu live.
import { useState, useEffect, useMemo } from "react";
import PromoCodeModal from "./PromoCodeModal.jsx";

const TEMPLATES = [
  { id: "",                  label: "Aucun (libre)",   file: null,                       subject: "" },
  { id: "manual-decouverte", label: "Offre découverte", file: "manual-decouverte.html",  subject: "Une offre exclusive pour votre prochain séjour chez {{bien_nom}}" },
  { id: "manual-relance",    label: "Relance",           file: "manual-relance.html",     subject: "On pense encore à vous — {{bien_nom}} vous attend" },
  { id: "manual-question",   label: "Question / Suivi",  file: "manual-question.html",   subject: "Votre séjour chez {{bien_nom}} — une question ?" },
];

function interpolate(html, vars) {
  if (!html) return "";
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
}

export default function EmailComposer({ isOpen, onClose, defaultTo, defaultBookingId, defaultBienId, defaultPrenom, defaultBienNom }) {
  const [to, setTo] = useState(defaultTo || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templateCache, setTemplateCache] = useState({});      // { file: rawHtml }
  const [promoSnippet, setPromoSnippet] = useState("");        // _promo-block.html brut
  const [promoCode, setPromoCode] = useState(null);            // { code, text } | null
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Reset state quand on rouvre le composer
  useEffect(() => {
    if (isOpen) {
      setTo(defaultTo || "");
      setSubject("");
      setBody("");
      setTemplateId("");
      setPromoCode(null);
      setError(null);
      setToast(null);
    }
  }, [isOpen, defaultTo]);

  // Fetch les templates à l'ouverture
  useEffect(() => {
    if (!isOpen) return;
    const files = TEMPLATES.filter(t => t.file).map(t => t.file);
    Promise.all(files.map(f =>
      fetch(`/email-templates/${f}?cb=${Date.now()}`, { cache: "no-store" })
        .then(r => r.ok ? r.text() : "")
        .then(html => ({ file: f, html }))
        .catch(() => ({ file: f, html: "" }))
    )).then(results => {
      const cache = {};
      for (const r of results) cache[r.file] = r.html;
      setTemplateCache(cache);
    });
    fetch(`/email-templates/_promo-block.html?cb=${Date.now()}`, { cache: "no-store" })
      .then(r => r.ok ? r.text() : "")
      .then(setPromoSnippet)
      .catch(() => setPromoSnippet(""));
  }, [isOpen]);

  // Variables pour l'interpolation
  const vars = useMemo(() => ({
    prenom: defaultPrenom || "",
    bien_nom: defaultBienNom || "votre logement",
    bien_url: defaultBienId ? `https://villamaryllis.com/${defaultBienId}` : "https://villamaryllis.com",
    checkin: "",
    checkout: "",
    promo_block: "",
    promo_code: promoCode?.code || "",
    promo_text: promoCode?.text || "",
  }), [defaultPrenom, defaultBienNom, defaultBienId, promoCode]);

  // Quand on choisit un template → remplir le body ET le sujet avec son contenu
  function applyTemplate(tplId) {
    setTemplateId(tplId);
    const tpl = TEMPLATES.find(t => t.id === tplId);
    if (!tpl?.file) { setBody(""); setSubject(""); return; }
    const raw = templateCache[tpl.file] || "";
    setBody(raw); // brut, l'aperçu fera l'interpolation
    // Pré-remplir le sujet en interpolant les variables disponibles
    if (tpl.subject) {
      setSubject(interpolate(tpl.subject, {
        bien_nom: defaultBienNom || "votre logement",
        prenom: defaultPrenom || "",
      }));
    }
  }

  // HTML final pour aperçu + envoi (interpole variables + bloc promo)
  const finalHtml = useMemo(() => {
    let html = body;
    if (promoCode && promoSnippet) {
      const promoHtml = interpolate(promoSnippet, vars);
      // Si le template a {{promo_block}}, on remplace ; sinon on ajoute à la fin
      if (html.includes("{{promo_block}}")) {
        html = html.replace(/\{\{promo_block\}\}/g, promoHtml);
      } else {
        html = html + "\n" + promoHtml;
      }
    } else {
      html = html.replace(/\{\{promo_block\}\}/g, "");
    }
    return interpolate(html, vars);
  }, [body, promoCode, promoSnippet, vars]);

  function handlePromoGenerated(code, text) {
    setPromoCode({ code, text });
  }

  async function send() {
    setSending(true);
    setError(null);
    const token = sessionStorage.getItem("ldb_tok") || localStorage.getItem("admin_token") || "";
    try {
      const r = await fetch("/api/send-custom-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          to,
          subject,
          html: finalHtml,
          bien_id: defaultBienId || null,
          booking_id: defaultBookingId || null,
          template_name: templateId || "manual_custom",
          promo_code: promoCode?.code || null,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setError(data.error || data.details || `HTTP ${r.status}`);
        setSending(false);
        return;
      }
      setToast(`✓ Envoyé à ${to}`);
      window.dispatchEvent(new Event("amaryllis_emails_log_updated"));
      setTimeout(() => { setSending(false); onClose(); }, 1500);
    } catch (e) {
      setError(e.message);
      setSending(false);
    }
  }

  if (!isOpen) return null;

  const canSend = to && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) && subject.trim().length > 0 && body.trim().length > 0 && !sending;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 250, display: "flex", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 1000, background: "#0f172a", color: "#e2e8f0", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 40px)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>✉ Nouveau mail</div>
          <button onClick={onClose} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Fermer ✕</button>
        </div>

        {/* Form + Preview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, flex: 1, overflow: "hidden" }}>

          {/* Form */}
          <div style={{ padding: "18px 24px", overflowY: "auto", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>À</div>
              <input type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="client@example.com"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              {defaultBienId && (
                <div style={{ fontSize: 10, color: "#a5b4fc", marginTop: 4 }}>📍 Bien rattaché : {defaultBienNom || defaultBienId}</div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Template</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => applyTemplate(t.id)}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: templateId === t.id ? 700 : 400,
                      background: templateId === t.id ? "#6366f1" : "rgba(255,255,255,0.06)", color: templateId === t.id ? "#fff" : "#94a3b8" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Sujet</div>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Votre séjour à…" maxLength={200}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Corps HTML</div>
                <span style={{ fontSize: 9, color: "#475569", marginLeft: "auto" }}>{body.length}/30000</span>
              </div>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Écris ou choisis un template…" maxLength={30000}
                style={{ width: "100%", minHeight: 280, padding: "10px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
              <div style={{ fontSize: 9, color: "#475569", marginTop: 4 }}>
                Variables : {"{{prenom}}, {{bien_nom}}, {{bien_url}}, {{checkin}}, {{checkout}}, {{promo_block}}"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              {!promoCode ? (
                <button onClick={() => setShowPromoModal(true)}
                  style={{ padding: "7px 14px", borderRadius: 7, border: "1px dashed #f59e0b", background: "rgba(245,158,11,0.08)", color: "#f59e0b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  + Générer code promo
                </button>
              ) : (
                <>
                  <div style={{ padding: "6px 12px", borderRadius: 7, background: "rgba(16,185,129,0.12)", color: "#10b981", fontSize: 11, fontWeight: 700 }}>
                    🎁 {promoCode.code}
                  </div>
                  <button onClick={() => setPromoCode(null)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", fontSize: 10, cursor: "pointer" }}>
                    Retirer
                  </button>
                </>
              )}
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 7, padding: "8px 12px", fontSize: 11, color: "#f87171", marginBottom: 12 }}>
                ⚠ {error}
              </div>
            )}
            {toast && (
              <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 7, padding: "8px 12px", fontSize: 12, color: "#10b981", marginBottom: 12, fontWeight: 600 }}>
                {toast}
              </div>
            )}
          </div>

          {/* Preview */}
          <div style={{ padding: "18px 20px", overflowY: "auto", background: "#f5ede0" }}>
            <div style={{ fontSize: 10, color: "#7a6b5a", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Aperçu</div>
            <iframe sandbox="" srcDoc={finalHtml || "<div style='padding:20px;color:#999;font-family:sans-serif;'>L'aperçu apparaîtra ici…</div>"}
              style={{ width: "100%", height: "100%", minHeight: 480, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, background: "#fff" }} />
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose} disabled={sending} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={send} disabled={!canSend}
            style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: canSend ? "#10b981" : "#334155", color: "#fff", fontSize: 12, fontWeight: 700, cursor: canSend ? "pointer" : "not-allowed" }}>
            {sending ? "Envoi…" : "✉ Envoyer"}
          </button>
        </div>
      </div>

      <PromoCodeModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        defaultBienId={defaultBienId}
        defaultForEmail={to}
        onGenerated={handlePromoGenerated}
      />
    </div>
  );
}
