// LivretEditor.jsx — Éditeur admin des livrets d'accueil
// Charge depuis /api/guides?property_id=xxx, sauvegarde via POST /api/guides

import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "./lib/apiFetch.js";

/* ─── Styles ───────────────────────────────────────────────── */
const S = {
  label:  { fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4, display: "block" },
  input:  { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", outline: "none" },
  textarea: { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", outline: "none", minHeight: 80 },
  field:  { marginBottom: 14 },
  card:   { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 },
  btn:    (color = "#0ea5e9") => ({ padding: "7px 14px", borderRadius: 8, border: "none", background: color + "22", color, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background .15s" }),
  btnSolid: (color = "#10b981") => ({ padding: "9px 20px", borderRadius: 8, border: "none", background: color, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }),
  row:    { display: "flex", gap: 10, alignItems: "flex-start" },
  grid2:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
};

/* ─── Propriétés ─────────────────────────────────────────── */
const PROPERTIES = [
  { id: "amaryllis",  nom: "Villa Amaryllis", emoji: "🌺", color: "#10b981" },
  { id: "zandoli",   nom: "Zandoli",          emoji: "🌿", color: "#0ea5e9" },
  { id: "geko",      nom: "Géko",             emoji: "🦎", color: "#f59e0b" },
  { id: "mabouya",   nom: "Mabouya",          emoji: "🌴", color: "#ec4899" },
  { id: "iguana",    nom: "Iguana",           emoji: "🌊", color: "#6366f1" },
  { id: "schoelcher",nom: "Bellevue",         emoji: "🏙️", color: "#8b5cf6" },
  { id: "nogent",    nom: "Nogent",           emoji: "🗼", color: "#f97316" },
];

const SECTION_TYPES = [
  { value: "steps",     label: "Étapes numérotées" },
  { value: "info",      label: "Tableau clé / valeur" },
  { value: "list",      label: "Liste à puces" },
  { value: "checklist", label: "Checklist interactive" },
  { value: "picks",     label: "Adresses coups de cœur" },
  { value: "text",      label: "Texte libre" },
];

/* ─── Composants atomiques ──────────────────────────────── */
function Field({ label, children }) {
  return <div style={S.field}><span style={S.label}>{label}</span>{children}</div>;
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return <input type={type} style={S.input} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""} />;
}

function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return <textarea style={{ ...S.textarea, minHeight: rows * 22 }} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""} />;
}

/* ─── Éditeur de section ────────────────────────────────── */
function SectionEditor({ section, onChange, onDelete, onUp, onDown }) {
  const upd = (key, val) => onChange({ ...section, [key]: val });
  const updItem = (i, item) => upd("items", section.items.map((x, j) => j === i ? item : x));
  const addItem = () => {
    const type = section.type;
    const blank = (type === "info" || type === "steps") ? { label: "", value: "" }
      : (type === "picks") ? { icon: "📍", name: "", distance: "", note: "" }
      : "";
    upd("items", [...(section.items || []), blank]);
  };
  const delItem = (i) => upd("items", section.items.filter((_, j) => j !== i));

  const renderItemEditor = (item, i) => {
    switch (section.type) {
      case "info":
      case "steps":
        return (
          <div key={i} style={{ ...S.row, marginBottom: 8 }}>
            <input style={{ ...S.input, flex: 1 }} placeholder="Label" value={item.label || ""} onChange={e => updItem(i, { ...item, label: e.target.value })} />
            <input style={{ ...S.input, flex: 2 }} placeholder="Valeur" value={item.value || ""} onChange={e => updItem(i, { ...item, value: e.target.value })} />
            <button style={S.btn("#ef4444")} onClick={() => delItem(i)}>✕</button>
          </div>
        );
      case "picks":
        return (
          <div key={i} style={{ ...S.card, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ ...S.grid2, marginBottom: 8 }}>
              <input style={S.input} placeholder="Icône (emoji)" value={item.icon || ""} onChange={e => updItem(i, { ...item, icon: e.target.value })} />
              <input style={S.input} placeholder="Nom" value={item.name || ""} onChange={e => updItem(i, { ...item, name: e.target.value })} />
            </div>
            <div style={{ ...S.grid2, marginBottom: 8 }}>
              <input style={S.input} placeholder="Distance (ex: 5 min)" value={item.distance || ""} onChange={e => updItem(i, { ...item, distance: e.target.value })} />
              <input style={S.input} placeholder="Note" value={item.note || ""} onChange={e => updItem(i, { ...item, note: e.target.value })} />
            </div>
            <button style={S.btn("#ef4444")} onClick={() => delItem(i)}>Supprimer</button>
          </div>
        );
      case "list":
      case "checklist":
      default:
        return (
          <div key={i} style={{ ...S.row, marginBottom: 6 }}>
            <input style={{ ...S.input, flex: 1 }} placeholder="Élément" value={item || ""} onChange={e => updItem(i, e.target.value)} />
            <button style={S.btn("#ef4444")} onClick={() => delItem(i)}>✕</button>
          </div>
        );
    }
  };

  return (
    <div style={{ ...S.card, border: "1px solid rgba(255,255,255,0.10)" }}>
      {/* Header section */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <input style={{ ...S.input, width: 52, textAlign: "center", fontSize: 18 }} value={section.icon || ""} onChange={e => upd("icon", e.target.value)} placeholder="🏠" />
        <input style={{ ...S.input, flex: 1 }} placeholder="Titre de la section" value={section.title || ""} onChange={e => upd("title", e.target.value)} />
        <select
          style={{ ...S.input, width: "auto" }}
          value={section.type || "text"}
          onChange={e => upd("type", e.target.value)}
        >
          {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button style={S.btn("#64748b")} onClick={onUp} title="Monter">↑</button>
        <button style={S.btn("#64748b")} onClick={onDown} title="Descendre">↓</button>
        <button style={S.btn("#ef4444")} onClick={onDelete}>✕</button>
      </div>

      {/* Contenu texte libre */}
      {section.type === "text" && (
        <textarea style={S.textarea} placeholder="Contenu..." value={section.content || ""} onChange={e => upd("content", e.target.value)} />
      )}

      {/* Items */}
      {section.type !== "text" && (
        <div>
          {(section.items || []).map((item, i) => renderItemEditor(item, i))}
          <button style={{ ...S.btn("#0ea5e9"), marginTop: 6 }} onClick={addItem}>+ Ajouter un élément</button>
        </div>
      )}
    </div>
  );
}

/* ─── Éditeur de services additionnels (extras) ─────────── */
const EXTRA_KINDS = [
  { value: "sur-demande", label: "Sur demande" },
  { value: "immediat",    label: "Immédiat" },
];

function ExtrasEditor({ extras, onChange }) {
  const upd = (i, extra) => onChange(extras.map((e, j) => j === i ? extra : e));
  const del = (i) => onChange(extras.filter((_, j) => j !== i));
  const add = () => onChange([...extras, { id: `svc-${Date.now()}`, label: "", price: 0, desc: "", kind: "sur-demande" }]);

  return (
    <div>
      {extras.map((e, i) => (
        <div key={e.id || i} style={{ ...S.card, padding: "10px 12px", marginBottom: 8 }}>
          <div style={{ ...S.grid2, marginBottom: 8 }}>
            <input style={S.input} placeholder="Label (ex: Ménage supplémentaire)" value={e.label || ""} onChange={ev => upd(i, { ...e, label: ev.target.value })} />
            <input type="number" style={S.input} placeholder="Prix (€)" value={e.price ?? ""} onChange={ev => upd(i, { ...e, price: ev.target.value === "" ? 0 : Number(ev.target.value) })} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea style={{ ...S.textarea, minHeight: 60 }} placeholder="Description courte" value={e.desc || ""} onChange={ev => upd(i, { ...e, desc: ev.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
            <select style={{ ...S.input, width: "auto" }} value={e.kind || "sur-demande"} onChange={ev => upd(i, { ...e, kind: ev.target.value })}>
              {EXTRA_KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
            <button style={S.btn("#ef4444")} onClick={() => del(i)}>Supprimer</button>
          </div>
        </div>
      ))}
      <button style={S.btn("#0ea5e9")} onClick={add}>+ Ajouter un service</button>
    </div>
  );
}

/* ─── Éditeur de contacts ───────────────────────────────── */
function ContactEditor({ contacts, onChange }) {
  const upd = (i, contact) => onChange(contacts.map((c, j) => j === i ? contact : c));
  const del = (i) => onChange(contacts.filter((_, j) => j !== i));
  const add = () => onChange([...contacts, { label: "", phone: "", icon: "👤", note: "" }]);

  return (
    <div>
      {contacts.map((c, i) => (
        <div key={i} style={{ ...S.card, padding: "10px 12px", marginBottom: 8 }}>
          <div style={{ ...S.grid2, marginBottom: 8 }}>
            <input style={{ ...S.input, width: 52 }} placeholder="🙂" value={c.icon || ""} onChange={e => upd(i, { ...c, icon: e.target.value })} />
            <input style={S.input} placeholder="Nom / Rôle" value={c.label || ""} onChange={e => upd(i, { ...c, label: e.target.value })} />
          </div>
          <div style={{ ...S.grid2, marginBottom: 8 }}>
            <input style={S.input} placeholder="Téléphone (+33...)" value={c.phone || ""} onChange={e => upd(i, { ...c, phone: e.target.value })} />
            <input style={S.input} placeholder="Note (optionnel)" value={c.note || ""} onChange={e => upd(i, { ...c, note: e.target.value })} />
          </div>
          <button style={S.btn("#ef4444")} onClick={() => del(i)}>Supprimer</button>
        </div>
      ))}
      <button style={S.btn("#0ea5e9")} onClick={add}>+ Ajouter un contact</button>
    </div>
  );
}

/* ─── Composant principal ───────────────────────────────── */
export default function LivretEditor() {
  const [propId, setPropId] = useState("amaryllis");
  const [guide, setGuide]   = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | saving | saved | error
  const [dirty, setDirty]   = useState(false);
  const [activeTab, setActiveTab] = useState("infos");

  // ── Générateur d'URL écran TV (prénom + dates optionnels) ──
  const [tvGuest, setTvGuest] = useState("");
  const [tvDu, setTvDu]       = useState("");
  const [tvAu, setTvAu]       = useState("");
  const [tvCopied, setTvCopied] = useState(false);
  const tvUrl = (() => {
    const q = new URLSearchParams({ tv: "1" });
    if (tvGuest.trim()) q.set("guest", tvGuest.trim());
    if (tvDu.trim())    q.set("du", tvDu.trim());
    if (tvAu.trim())    q.set("au", tvAu.trim());
    return `https://villamaryllis.com/bienvenue/${propId}?${q}`;
  })();

  const prop = PROPERTIES.find(p => p.id === propId) || PROPERTIES[0];

  /* ── Chargement ── */
  const load = useCallback(async (id) => {
    setStatus("loading"); setGuide(null); setDirty(false);
    try {
      const r = await fetch(`/api/guides?property_id=${id}`);
      const d = await r.json();
      if (d.guide) { setGuide(d.guide); setStatus("idle"); }
      else { setStatus("error"); }
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(propId); }, [propId, load]);

  /* ── Mise à jour champ ── */
  const upd = (key, val) => { setGuide(g => ({ ...g, [key]: val })); setDirty(true); };

  /* ── Sections ── */
  const updSection = (i, s) => { setGuide(g => ({ ...g, sections: g.sections.map((x, j) => j === i ? s : x) })); setDirty(true); };
  const delSection = (i) => { setGuide(g => ({ ...g, sections: g.sections.filter((_, j) => j !== i) })); setDirty(true); };
  const moveSection = (i, dir) => {
    setGuide(g => {
      const arr = [...g.sections];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return g;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...g, sections: arr };
    });
    setDirty(true);
  };
  const addSection = () => {
    setGuide(g => ({
      ...g,
      sections: [...(g.sections || []), { id: `sec_${Date.now()}`, icon: "📌", title: "Nouvelle section", type: "text", content: "" }],
    }));
    setDirty(true);
  };

  /* ── Sauvegarde ── */
  const save = async () => {
    setStatus("saving");
    try {
      const r = await adminFetch("/api/guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propId, guide }),
      });
      const d = await r.json();
      if (d.ok) { setStatus("saved"); setDirty(false); setTimeout(() => setStatus("idle"), 2500); }
      else { setStatus("error"); }
    } catch {
      setStatus("error");
    }
  };

  /* ── UI status ── */
  const statusEl = status === "saving" ? <span style={{ color: "#f59e0b", fontSize: 12 }}>⏳ Enregistrement...</span>
    : status === "saved"   ? <span style={{ color: "#10b981", fontSize: 12 }}>✓ Enregistré !</span>
    : status === "error"   ? <span style={{ color: "#ef4444", fontSize: 12 }}>✗ Erreur</span>
    : dirty                ? <span style={{ color: "#f59e0b", fontSize: 12 }}>● Modifié</span>
    : null;

  const TABS = [
    { id: "infos",    label: "Infos & accueil" },
    { id: "sections", label: `Sections (${guide?.sections?.length ?? 0})` },
    { id: "services", label: `Services (${guide?.extras?.length ?? 0})` },
    { id: "contacts", label: "Contacts" },
    { id: "qr",       label: "QR Code" },
  ];

  return (
    <div>
      {/* ── Sélecteur propriété ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {PROPERTIES.map(p => (
          <button
            key={p.id}
            onClick={() => { setPropId(p.id); setActiveTab("infos"); }}
            style={{
              padding: "6px 14px", borderRadius: 8, border: `1px solid ${propId === p.id ? p.color : "rgba(255,255,255,0.08)"}`,
              background: propId === p.id ? p.color + "22" : "transparent",
              color: propId === p.id ? p.color : "#64748b",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            {p.emoji} {p.nom}
          </button>
        ))}
      </div>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
            📋 Livret d'accueil — {prop.nom}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            Affiché sur <code style={{ color: "#0ea5e9" }}>villamaryllis.com/bienvenue/{propId}</code>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {statusEl}
          <a
            href={`/bienvenue/${propId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...S.btn("#64748b"), textDecoration: "none", display: "inline-block" }}
          >
            👁 Prévisualiser
          </a>
          <button
            onClick={save}
            disabled={!dirty || status === "saving"}
            style={{
              ...S.btnSolid("#10b981"),
              opacity: (!dirty || status === "saving") ? 0.5 : 1,
              cursor: (!dirty || status === "saving") ? "not-allowed" : "pointer",
            }}
          >
            💾 Enregistrer
          </button>
        </div>
      </div>

      {/* ── État chargement / erreur ── */}
      {status === "loading" && (
        <div style={{ textAlign: "center", padding: 40, color: "#475569", fontSize: 14 }}>Chargement du livret…</div>
      )}
      {status === "error" && !guide && (
        <div style={{ textAlign: "center", padding: 40, color: "#ef4444", fontSize: 14 }}>
          Impossible de charger le guide. <button style={S.btn()} onClick={() => load(propId)}>Réessayer</button>
        </div>
      )}

      {guide && (
        <>
          {/* ── Onglets éditeur ── */}
          <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 0 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "8px 16px", border: "none", borderBottom: `2px solid ${activeTab === t.id ? "#0ea5e9" : "transparent"}`,
                  background: "none", color: activeTab === t.id ? "#0ea5e9" : "#64748b",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB : Infos & accueil ── */}
          {activeTab === "infos" && (
            <div>
              <div style={S.grid2}>
                <Field label="Emoji">
                  <Input value={guide.emoji} onChange={v => upd("emoji", v)} placeholder="🌺" />
                </Field>
                <Field label="Nom de la propriété">
                  <Input value={guide.property_name} onChange={v => upd("property_name", v)} />
                </Field>
              </div>
              <Field label="Tagline (sous le nom)">
                <Input value={guide.tagline} onChange={v => upd("tagline", v)} placeholder="Villa avec piscine · Sainte-Luce" />
              </Field>
              <div style={S.grid2}>
                <Field label="Heure d'arrivée">
                  <Input value={guide.checkin_time} onChange={v => upd("checkin_time", v)} placeholder="15h00" />
                </Field>
                <Field label="Heure de départ">
                  <Input value={guide.checkout_time} onChange={v => upd("checkout_time", v)} placeholder="10h00" />
                </Field>
              </div>

              <div style={{ marginTop: 8, marginBottom: 16, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Mot d'accueil</div>
                <Field label="Message d'accueil">
                  <Textarea value={guide.welcome_message} onChange={v => upd("welcome_message", v)} placeholder="Bienvenue dans ma villa…" rows={6} />
                </Field>
                <Field label="Signature de l'hôte">
                  <Input value={guide.host_signature} onChange={v => upd("host_signature", v)} placeholder="Vincent" />
                </Field>
              </div>

              <div style={{ marginBottom: 16, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>WiFi</div>
                <div style={S.grid2}>
                  <Field label="Nom du réseau (SSID)">
                    <Input value={guide.wifi_ssid} onChange={v => upd("wifi_ssid", v)} placeholder="MonReseau" />
                  </Field>
                  <Field label="Mot de passe WiFi">
                    <Input value={guide.wifi_password} onChange={v => upd("wifi_password", v)} placeholder="••••••••" />
                  </Field>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Localisation</div>
                <Field label="Adresse postale">
                  <Input value={guide.address} onChange={v => upd("address", v)} placeholder="1 rue de la Villa, 97228 Sainte-Luce" />
                </Field>
                <Field label="Lien Google Maps (optionnel)">
                  <Input value={guide.maps_url} onChange={v => upd("maps_url", v)} placeholder="https://maps.google.com/..." />
                </Field>
              </div>
            </div>
          )}

          {/* ── TAB : Sections ── */}
          {activeTab === "sections" && (
            <div>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 14 }}>
                Les sections apparaissent dans cet ordre sur le livret. Utilisez ↑↓ pour réordonner.
              </div>
              {(guide.sections || []).map((s, i) => (
                <SectionEditor
                  key={s.id || i}
                  section={s}
                  onChange={ns => updSection(i, ns)}
                  onDelete={() => delSection(i)}
                  onUp={() => moveSection(i, -1)}
                  onDown={() => moveSection(i, 1)}
                />
              ))}
              <button
                style={{ ...S.btn("#10b981"), padding: "10px 18px", marginTop: 8, display: "block" }}
                onClick={addSection}
              >
                + Ajouter une section
              </button>
            </div>
          )}

          {/* ── TAB : Services ── */}
          {activeTab === "services" && (
            <div>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 14, lineHeight: 1.5 }}>
                Ces services apparaissent sur l'écran TV et la page de paiement <code style={{ color: "#0ea5e9" }}>/services</code>. Prix en € TTC.<br />
                ‹sur-demande› = confirmé par l'hôte après paiement (late check-out, ménage) ; ‹immediat› = livrable tout de suite (planteur).
              </div>
              <ExtrasEditor
                extras={guide.extras || []}
                onChange={extras => upd("extras", extras)}
              />
            </div>
          )}

          {/* ── TAB : Contacts ── */}
          {activeTab === "contacts" && (
            <div>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 14 }}>
                Les numéros 15, 17, 18, 112 et 196 sont automatiquement affichés dans le bloc "Urgences".
              </div>
              <ContactEditor
                contacts={guide.contacts || []}
                onChange={contacts => { setGuide(g => ({ ...g, contacts })); setDirty(true); }}
              />
            </div>
          )}

          {/* ── TAB : QR Code ── */}
          {activeTab === "qr" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                À imprimer et déposer dans le logement. Le voyageur scanne → accède au livret directement.
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`https://villamaryllis.com/bienvenue/${propId}`)}&color=e2e8f0&bgcolor=0f172a&margin=14`}
                alt={`QR livret ${prop.nom}`}
                style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}
              />
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#475569", marginBottom: 14 }}>
                villamaryllis.com/bienvenue/{propId}
              </div>
              <a
                href={`https://villamaryllis.com/bienvenue/${propId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...S.btn("#0ea5e9"), textDecoration: "none", display: "inline-block", marginRight: 8 }}
              >
                Ouvrir le livret →
              </a>
              <button onClick={() => window.print()} style={S.btn("#64748b")}>🖨 Imprimer le QR</button>

              {/* ── Générateur d'URL écran TV ── */}
              <div style={{ ...S.card, marginTop: 24, textAlign: "left", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
                  📺 Générer l'URL écran TV
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
                  Ouvrez cette URL dans le navigateur de la TV. Laissez les champs vides pour un accueil générique.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <Field label="Prénom (optionnel)">
                    <Input value={tvGuest} onChange={setTvGuest} placeholder="Vincent" />
                  </Field>
                  <Field label="Du (optionnel)">
                    <Input value={tvDu} onChange={setTvDu} placeholder="05-06" />
                  </Field>
                  <Field label="Au (optionnel)">
                    <Input value={tvAu} onChange={setTvAu} placeholder="12-06" />
                  </Field>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    style={{ ...S.input, flex: 1, fontFamily: "monospace", fontSize: 12 }}
                    value={tvUrl}
                    readOnly
                    onFocus={e => e.target.select()}
                  />
                  <button
                    style={S.btn("#0ea5e9")}
                    onClick={() => {
                      navigator.clipboard.writeText(tvUrl);
                      setTvCopied(true);
                      setTimeout(() => setTvCopied(false), 1800);
                    }}
                  >
                    {tvCopied ? "✓ Copié" : "📋 Copier"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
