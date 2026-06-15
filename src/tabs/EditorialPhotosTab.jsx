/**
 * EditorialPhotosTab — sélection des photos AUTORISÉES à la publication réseaux.
 * Vincent coche « les plus belles » par bien ; seules celles-ci peuvent être
 * auto-publiées par le gate (cf. functions/api/editorial-gate.js + _editorialGate.js).
 * Photos disponibles = manifeste statique /photos-manifest.json. Whitelist = D1 via /api/editorial-photos.
 */
import { useState, useEffect } from "react";
import { adminFetch } from "../lib/apiFetch.js";

const BIENS = [
  { id: "amaryllis", label: "Amaryllis" }, { id: "zandoli", label: "Zandoli" },
  { id: "iguana", label: "Iguana" }, { id: "geko", label: "Géko" },
  { id: "mabouya", label: "Mabouya" }, { id: "schoelcher", label: "Bellevue (Schœlcher)" },
  { id: "nogent", label: "Nogent" },
];

export default function EditorialPhotosTab() {
  const [manifest, setManifest] = useState({});       // { bien: ["01","02",...] }
  const [selected, setSelected] = useState({});       // { bien: Set("01",...) }
  const [bien, setBien] = useState("amaryllis");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [mf, wl] = await Promise.all([
          fetch("/photos-manifest.json").then((r) => r.json()).catch(() => ({})),
          adminFetch("/api/editorial-photos").then((r) => r.json()).catch(() => ({ photos: {} })),
        ]);
        setManifest(mf || {});
        const sel = {};
        for (const b of BIENS) sel[b.id] = new Set((wl.photos?.[b.id]) || []);
        setSelected(sel);
      } catch (e) { setToast({ error: e.message }); }
      finally { setLoading(false); }
    })();
  }, []);

  function toggle(nn) {
    setSelected((prev) => {
      const next = { ...prev };
      const s = new Set(next[bien] || []);
      s.has(nn) ? s.delete(nn) : s.add(nn);
      next[bien] = s;
      return next;
    });
  }

  function setAll(on) {
    setSelected((prev) => ({ ...prev, [bien]: on ? new Set(manifest[bien] || []) : new Set() }));
  }

  async function save() {
    setSaving(true);
    try {
      const photos = [...(selected[bien] || [])];
      const r = await adminFetch(`/api/editorial-photos?bien=${bien}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos }),
      });
      const d = await r.json();
      setToast(d.ok ? { ok: true, message: `✅ ${d.count} photo(s) autorisée(s) pour ${bien}` } : { error: d.error || "Échec" });
    } catch (e) { setToast({ error: e.message }); }
    finally { setSaving(false); setTimeout(() => setToast(null), 3500); }
  }

  const photos = manifest[bien] || [];
  const sel = selected[bien] || new Set();
  const C = { bg: "#0f172a", card: "#1e293b", txt: "#e2e8f0", mut: "#94a3b8", acc: "#22c55e", brd: "rgba(255,255,255,0.1)" };

  return (
    <div style={{ color: C.txt }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>📷 Photos publiables sur les réseaux</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.mut }}>
          Coche les plus belles photos de chaque bien. <strong>Seules celles-ci</strong> pourront être publiées
          automatiquement sur Facebook/Instagram — le reste est bloqué.
        </p>
      </div>

      {/* Sélecteur de bien */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {BIENS.map((b) => {
          const n = (selected[b.id] || new Set()).size;
          const active = b.id === bien;
          return (
            <button key={b.id} onClick={() => setBien(b.id)}
              style={{
                padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${active ? C.acc : C.brd}`,
                background: active ? "rgba(34,197,94,0.15)" : C.card, color: active ? C.acc : C.txt,
              }}>
              {b.label} {n > 0 && <span style={{ opacity: 0.8 }}>· {n}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p style={{ color: C.mut }}>Chargement…</p>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{sel.size}/{photos.length} sélectionnées</span>
            <button onClick={() => setAll(true)} style={miniBtn(C)}>Tout cocher</button>
            <button onClick={() => setAll(false)} style={miniBtn(C)}>Tout décocher</button>
            <button onClick={save} disabled={saving}
              style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: "none", cursor: saving ? "default" : "pointer", background: C.acc, color: "#06210f", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Enregistrement…" : "💾 Enregistrer"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
            {photos.map((nn) => {
              const on = sel.has(nn);
              return (
                <div key={nn} onClick={() => toggle(nn)}
                  style={{ position: "relative", cursor: "pointer", borderRadius: 10, overflow: "hidden",
                    border: on ? `3px solid ${C.acc}` : "3px solid transparent", aspectRatio: "4/3", background: C.card }}>
                  <img
                    src={`/photos/${bien}/${nn}-800w.webp`}
                    onError={(e) => { e.target.src = `/photos/${bien}/${nn}.webp`; }}
                    alt={`${bien} ${nn}`} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: on ? 1 : 0.78 }}
                  />
                  <span style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%",
                    background: on ? C.acc : "rgba(0,0,0,0.55)", color: on ? "#06210f" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900 }}>
                    {on ? "✓" : ""}
                  </span>
                  <span style={{ position: "absolute", bottom: 4, left: 6, fontSize: 11, fontWeight: 700,
                    color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{nn}</span>
                </div>
              );
            })}
          </div>
          {!photos.length && <p style={{ color: C.mut }}>Aucune photo trouvée pour ce bien.</p>}
        </>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: 20, padding: "12px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          background: toast.error ? "#7f1d1d" : "#14532d", color: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 1000 }}>
          {toast.error ? `⚠️ ${toast.error}` : toast.message}
        </div>
      )}
    </div>
  );
}

const miniBtn = (C) => ({
  padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer",
  border: `1px solid ${C.brd}`, background: C.card, color: C.txt,
});
