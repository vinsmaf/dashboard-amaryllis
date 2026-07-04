// src/tabs/messagerie/EmailTemplatesModal.jsx
// Éditeur des 4 templates email AUTOMATIQUES (confirmation, vérif-arrivée,
// j1-acces, pré-départ) — surcharge stockée en D1 (email_template_overrides),
// prioritaire sur le fichier statique. "Réinitialiser" revient au défaut.
import { useState, useEffect, useCallback } from "react";

function adminToken() {
  return sessionStorage.getItem("ldb_tok") || localStorage.getItem("admin_token") || "";
}

// Variables d'exemple pour l'aperçu — mêmes noms que ceux réellement utilisés
// par les fonctions d'envoi (notify-booking.js, send-j1-acces.js, etc.)
const SAMPLE_VARS = {
  prenom: "Francois",
  bien_nom: "Zandoli",
  checkin: "2026-07-05",
  checkout: "2026-07-20",
  nb_guests: "4",
  total: "1500",
  photo_url: "/photos/zandoli/01.webp",
  lieu_nom: "Résidence Amaryllis",
  maps_url: "#",
  code_acces: "Voici vos accès :<br><br>1. <strong>Parking</strong> — 1 place disponible<br>2. <strong>Wifi</strong> — Réseau « zandoli »",
  lien_avis_google: "#",
  wa_hote: "33610880772",
};

function fillTemplate(html, vars) {
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
}

export default function EmailTemplatesModal({ isOpen, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [html, setHtml] = useState("");
  const [source, setSource] = useState(null); // "custom" | "default"
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadList = useCallback(() => {
    fetch("/api/email-templates-admin", { headers: { Authorization: `Bearer ${adminToken()}` } })
      .then(r => r.json())
      .then(d => setTemplates(d.templates || []))
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadList();
  }, [isOpen, loadList]);

  const openTemplate = (id) => {
    setSelected(id);
    setLoading(true);
    setMsg(null);
    fetch(`/api/email-templates-admin?id=${id}`, { headers: { Authorization: `Bearer ${adminToken()}` } })
      .then(r => r.json())
      .then(d => {
        setHtml(d.html || "");
        setSource(d.source || "default");
      })
      .catch(() => setMsg({ type: "error", text: "Erreur de chargement" }))
      .finally(() => setLoading(false));
  };

  const save = () => {
    setSaving(true);
    setMsg(null);
    fetch("/api/email-templates-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken()}` },
      body: JSON.stringify({ id: selected, html }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setSource("custom");
          setMsg({ type: "ok", text: "Enregistré — utilisé dès le prochain envoi" });
          loadList();
        } else {
          setMsg({ type: "error", text: d.error || "Erreur" });
        }
      })
      .catch(() => setMsg({ type: "error", text: "Erreur réseau" }))
      .finally(() => setSaving(false));
  };

  const resetToDefault = () => {
    if (!confirm("Revenir à la version par défaut ? Tes modifications seront perdues.")) return;
    setSaving(true);
    setMsg(null);
    fetch(`/api/email-templates-admin?id=${selected}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken()}` },
    })
      .then(r => r.json())
      .then(() => { openTemplate(selected); loadList(); })
      .catch(() => setMsg({ type: "error", text: "Erreur réseau" }))
      .finally(() => setSaving(false));
  };

  if (!isOpen) return null;

  const previewSrcDoc = html ? fillTemplate(html, SAMPLE_VARS) : "";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 260, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 20, overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 1100, background: "#0f172a", color: "#e2e8f0", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", marginTop: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>🖋️ Modèles email automatiques</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Les 4 emails envoyés automatiquement par le cron — modifie le texte, l'aperçu se met à jour en direct</div>
          </div>
          <button onClick={onClose} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Fermer ✕</button>
        </div>

        <div style={{ display: "flex", minHeight: 520 }}>

          {/* Liste des templates */}
          <div style={{ width: 220, borderRight: "1px solid rgba(255,255,255,0.07)", padding: 16, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => openTemplate(t.id)}
                style={{
                  textAlign: "left", padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${selected === t.id ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                  background: selected === t.id ? "rgba(99,102,241,0.12)" : "transparent",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 6 }}>
                  {t.label}
                  {t.custom && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "rgba(16,185,129,0.15)", color: "#6ee7b7", fontWeight: 700 }}>PERSONNALISÉ</span>}
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3, lineHeight: 1.4 }}>{t.desc}</div>
              </button>
            ))}
          </div>

          {/* Éditeur + aperçu */}
          <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            {!selected && (
              <div style={{ margin: "auto", color: "#64748b", fontSize: 13 }}>← Choisis un template à gauche</div>
            )}

            {selected && loading && (
              <div style={{ margin: "auto", color: "#64748b", fontSize: 13 }}>Chargement…</div>
            )}

            {selected && !loading && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: source === "custom" ? "#6ee7b7" : "#94a3b8" }}>
                    {source === "custom" ? "✓ Version personnalisée active" : "Version par défaut (fichier du code)"}
                  </span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    {source === "custom" && (
                      <button onClick={resetToDefault} disabled={saving} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#fca5a5", fontSize: 12, fontWeight: 700, cursor: saving ? "default" : "pointer" }}>
                        ↺ Réinitialiser
                      </button>
                    )}
                    <button onClick={save} disabled={saving || !html.trim()} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, cursor: saving ? "default" : "pointer" }}>
                      {saving ? "Enregistrement…" : "💾 Enregistrer"}
                    </button>
                  </div>
                </div>

                {msg && (
                  <div style={{ fontSize: 12, padding: "8px 12px", borderRadius: 8, background: msg.type === "ok" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "#6ee7b7" : "#fca5a5" }}>
                    {msg.text}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
                  <textarea
                    value={html}
                    onChange={e => setHtml(e.target.value)}
                    spellCheck={false}
                    style={{
                      flex: 1, minHeight: 420, padding: 12, borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.12)", background: "#020617", color: "#e2e8f0",
                      fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 11, lineHeight: 1.5, resize: "vertical",
                    }}
                  />
                  <div style={{ flex: 1, minHeight: 420, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", background: "#fff" }}>
                    <iframe
                      title="Aperçu"
                      srcDoc={previewSrcDoc}
                      style={{ width: "100%", height: "100%", border: "none" }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#475569" }}>
                  Aperçu avec des données d'exemple (Zandoli, Francois) — les <code>{"{{variables}}"}</code> entre accolades sont remplacées automatiquement au vrai envoi. Ne pas en supprimer.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
