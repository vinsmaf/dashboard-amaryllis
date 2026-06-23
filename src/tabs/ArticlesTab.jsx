// ArticlesTab.jsx — Onglet admin gestion articles SEO
import { useState, useEffect } from "react";

const NAVY  = "#0e3b3a";
const CORAL = "#c47254";
const IVORY = "#faf5e9";

const CATEGORIES = [
  { value: "logement",    label: "Logement" },
  { value: "itineraires", label: "Itinéraires" },
  { value: "activites",   label: "Activités" },
  { value: "budget",      label: "Budget" },
  { value: "pratique",    label: "Pratique" },
  { value: "nogent",      label: "Nogent" },
  { value: "general",     label: "Général" },
];

const STATUS_COLORS = {
  published: "#10b981",
  draft:     "#f59e0b",
};

function slugify(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ArticlesTab({ token }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null); // article en cours d'édition
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ slug:"", title:"", meta_title:"", meta_desc:"", category:"general", content_html:"", keywords:"", status:"draft", image_url:"" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/articles?admin=1", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setArticles(d.articles || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = filter === "all" ? articles : articles.filter(a => a.status === filter);

  const openCreate = () => {
    setForm({ slug:"", title:"", meta_title:"", meta_desc:"", category:"general", content_html:"", keywords:"", status:"draft", image_url:"" });
    setEditing(null);
    setCreating(true);
    setMsg("");
  };

  const openEdit = (a) => {
    setForm({ ...a });
    setEditing(a.slug);
    setCreating(false);
    setMsg("");
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const isNew = !editing;
      const url = isNew ? "/api/articles" : `/api/articles?slug=${encodeURIComponent(editing)}`;
      const method = isNew ? "POST" : "PATCH";
      const payload = isNew ? form : { ...form };
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.ok || d.slug) { setMsg("✅ Sauvegardé"); load(); setCreating(false); setEditing(null); }
      else setMsg("❌ " + (d.error || "Erreur"));
    } catch (e) { setMsg("❌ " + e.message); }
    setSaving(false);
  };

  const publish = async (slug) => {
    await fetch(`/api/articles?slug=${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "published" }),
    });
    load();
  };

  const unpublish = async (slug) => {
    await fetch(`/api/articles?slug=${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "draft" }),
    });
    load();
  };

  const isFormOpen = creating || editing;

  return (
    <div style={{ padding: "24px 20px", fontFamily: "'Jost', sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>Articles SEO</h2>
          <p style={{ color: "#7a6b5a", fontSize: 13, margin: "4px 0 0" }}>
            {articles.length} articles · {articles.filter(a => a.status === "published").length} publiés
          </p>
        </div>
        <button onClick={openCreate} style={{
          background: CORAL, color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>+ Nouvel article</button>
      </div>

      {/* Filtres statut */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "published", "draft"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
            fontWeight: 600, fontSize: 13,
            background: filter === s ? NAVY : "#e8e0d0",
            color: filter === s ? IVORY : "#5a4a3a",
          }}>
            {s === "all" ? "Tous" : s === "published" ? "Publiés" : "Drafts"}
          </button>
        ))}
      </div>

      {/* Formulaire création/édition */}
      {isFormOpen && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, border: "1px solid #e0d4bc" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 20 }}>
            {editing ? `Éditer : ${editing}` : "Nouvel article"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#7a6b5a", display: "block", marginBottom: 4 }}>TITRE *</label>
              <input value={form.title} onChange={e => setForm(f => ({
                ...f, title: e.target.value,
                slug: f.slug || slugify(e.target.value),
                meta_title: f.meta_title || e.target.value.slice(0, 60),
              }))} placeholder="Titre de l'article"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d0c8b8", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#7a6b5a", display: "block", marginBottom: 4 }}>SLUG *</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="slug-de-l-article"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d0c8b8", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#7a6b5a", display: "block", marginBottom: 4 }}>META TITLE (≤60c)</label>
              <input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                placeholder="Titre SEO (60 chars max)"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d0c8b8", fontSize: 14, boxSizing: "border-box" }} />
              <span style={{ fontSize: 11, color: form.meta_title?.length > 60 ? "#ef4444" : "#7a6b5a" }}>
                {form.meta_title?.length || 0}/60
              </span>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#7a6b5a", display: "block", marginBottom: 4 }}>CATÉGORIE</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d0c8b8", fontSize: 14 }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#7a6b5a", display: "block", marginBottom: 4 }}>META DESCRIPTION (≤158c)</label>
              <input value={form.meta_desc} onChange={e => setForm(f => ({ ...f, meta_desc: e.target.value }))}
                placeholder="Description SEO (158 chars max)"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d0c8b8", fontSize: 14, boxSizing: "border-box" }} />
              <span style={{ fontSize: 11, color: form.meta_desc?.length > 158 ? "#ef4444" : "#7a6b5a" }}>
                {form.meta_desc?.length || 0}/158
              </span>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#7a6b5a", display: "block", marginBottom: 4 }}>MOTS-CLÉS</label>
              <input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                placeholder="mot-clé1, mot-clé2, ..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d0c8b8", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#7a6b5a", display: "block", marginBottom: 4 }}>IMAGE URL</label>
              <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d0c8b8", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#7a6b5a", display: "block", marginBottom: 4 }}>
                CONTENU HTML <span style={{ fontWeight: 400 }}>(coller du HTML ou du texte)</span>
              </label>
              <textarea value={form.content_html} onChange={e => setForm(f => ({ ...f, content_html: e.target.value }))}
                rows={12} placeholder="<h2>Section</h2><p>Contenu...</p>"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d0c8b8", fontSize: 13, fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#7a6b5a", display: "block", marginBottom: 4 }}>STATUT</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d0c8b8", fontSize: 14 }}>
                <option value="draft">Draft</option>
                <option value="published">Publié</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20, alignItems: "center" }}>
            <button onClick={save} disabled={saving} style={{
              background: CORAL, color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}>{saving ? "Sauvegarde..." : "Sauvegarder"}</button>
            <button onClick={() => { setCreating(false); setEditing(null); }} style={{
              background: "#e8e0d0", color: "#5a4a3a", border: "none", borderRadius: 8,
              padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}>Annuler</button>
            {msg && <span style={{ fontSize: 13, color: msg.startsWith("✅") ? "#10b981" : "#ef4444" }}>{msg}</span>}
          </div>
        </div>
      )}

      {/* Liste articles */}
      {loading ? (
        <p style={{ color: "#7a6b5a", textAlign: "center", padding: 40 }}>Chargement...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#7a6b5a" }}>
          <p style={{ fontSize: 16 }}>Aucun article {filter !== "all" ? `(${filter})` : ""}.</p>
          <button onClick={openCreate} style={{ marginTop: 16, background: CORAL, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>
            Créer le premier
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(a => (
            <div key={a.slug} style={{
              background: "#fff", borderRadius: 10, padding: "14px 18px",
              border: "1px solid #e0d4bc", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                    color: "#fff", background: STATUS_COLORS[a.status] || "#999",
                    padding: "2px 8px", borderRadius: 10,
                  }}>{a.status}</span>
                  <span style={{ fontSize: 10, color: "#7a6b5a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {CATEGORIES.find(c => c.value === a.category)?.label || a.category}
                  </span>
                </div>
                <p style={{ fontWeight: 700, color: NAVY, fontSize: 15, margin: "0 0 2px" }}>{a.title}</p>
                <p style={{ color: "#7a6b5a", fontSize: 12, margin: 0 }}>
                  /article/{a.slug} · {a.views} vues
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {a.status === "draft" ? (
                  <button onClick={() => publish(a.slug)} style={{
                    background: "#10b981", color: "#fff", border: "none", borderRadius: 6,
                    padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>Publier</button>
                ) : (
                  <button onClick={() => unpublish(a.slug)} style={{
                    background: "#e8e0d0", color: "#5a4a3a", border: "none", borderRadius: 6,
                    padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>Dépublier</button>
                )}
                <button onClick={() => openEdit(a)} style={{
                  background: "#e8e0d0", color: "#5a4a3a", border: "none", borderRadius: 6,
                  padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>Éditer</button>
                {a.status === "published" && (
                  <a href={`/article/${a.slug}`} target="_blank" rel="noopener noreferrer" style={{
                    background: NAVY, color: IVORY, borderRadius: 6,
                    padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none",
                  }}>Voir →</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
