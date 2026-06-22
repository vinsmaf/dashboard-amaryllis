/**
 * EditorialVideosTab — sélection des vidéos AUTORISÉES pour la génération de Reels.
 * Vincent coche les vidéos de chaque bien ; seules celles-ci seront utilisées
 * par reel-gen quand on génère un draft reel_post.
 * Catalogue = /videos-manifest.json. Whitelist = D1 via /api/editorial-videos.
 */
import { useState, useEffect } from "react";
import { adminFetch } from "../lib/apiFetch.js";

const BIENS = [
  { id: "amaryllis", label: "Amaryllis" }, { id: "zandoli", label: "Zandoli" },
  { id: "iguana", label: "Iguana" }, { id: "geko", label: "Géko" },
  { id: "mabouya", label: "Mabouya" }, { id: "schoelcher", label: "Bellevue (Schœlcher)" },
  { id: "nogent", label: "Nogent" },
];

export default function EditorialVideosTab() {
  const [manifest, setManifest] = useState({});     // { bien: [{file, label},...] }
  const [selected, setSelected] = useState({});     // { bien: Set("reel-geko.mp4",...) }
  const [bien, setBien] = useState("amaryllis");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [mf, wl] = await Promise.all([
          fetch("/videos-manifest.json").then((r) => r.json()).catch(() => ({})),
          adminFetch("/api/editorial-videos").then((r) => r.json()).catch(() => ({ videos: {} })),
        ]);
        setManifest(mf || {});
        const sel = {};
        for (const b of BIENS) sel[b.id] = new Set((wl.videos?.[b.id]) || []);
        setSelected(sel);
      } catch (e) { setToast({ error: e.message }); }
      finally { setLoading(false); }
    })();
  }, []);

  function toggle(filename) {
    setSelected((prev) => {
      const next = { ...prev };
      const s = new Set(next[bien] || []);
      s.has(filename) ? s.delete(filename) : s.add(filename);
      next[bien] = s;
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const videos = [...(selected[bien] || [])];
      const r = await adminFetch(`/api/editorial-videos?bien=${bien}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videos }),
      });
      const d = await r.json();
      setToast(d.ok ? { ok: true, message: `✅ ${d.count} vidéo(s) autorisée(s) pour ${bien}` } : { error: d.error || "Échec" });
    } catch (e) { setToast({ error: e.message }); }
    finally { setSaving(false); setTimeout(() => setToast(null), 3500); }
  }

  const videos = manifest[bien] || [];
  const sel = selected[bien] || new Set();
  const C = { bg: "#0f172a", card: "#1e293b", txt: "#e2e8f0", mut: "#94a3b8", acc: "#22c55e", brd: "rgba(255,255,255,0.1)" };

  return (
    <div style={{ color: C.txt }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>🎥 Vidéos publiables pour les Reels</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.mut }}>
          Coche les vidéos autorisées par bien. <strong>Seules celles-ci</strong> seront utilisées
          lors de la génération automatique de Reels. Pour ajouter une vidéo : déposer le fichier
          MP4 dans <code>public/videos/</code> et ajouter une entrée dans <code>videos-manifest.json</code>.
        </p>
      </div>

      {/* Sélecteur de bien */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {BIENS.map((b) => {
          const count = (selected[b.id] || new Set()).size;
          return (
            <button key={b.id} onClick={() => setBien(b.id)} style={{
              padding: "6px 14px", borderRadius: 8, border: "1.5px solid",
              borderColor: bien === b.id ? C.acc : C.brd,
              background: bien === b.id ? "rgba(34,197,94,0.12)" : "transparent",
              color: bien === b.id ? C.acc : C.txt, cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {b.label}
              {count > 0 && (
                <span style={{ background: C.acc, color: "#0f172a", borderRadius: 12,
                  padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p style={{ color: C.mut }}>Chargement…</p>
      ) : videos.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 12, padding: 32, textAlign: "center", color: C.mut }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
          <p style={{ margin: 0 }}>Aucune vidéo disponible pour <strong>{bien}</strong>.</p>
          <p style={{ margin: "8px 0 0", fontSize: 12 }}>
            Ajouter un fichier <code>public/videos/reel-{bien}-XX.mp4</code> et une entrée dans <code>videos-manifest.json</code>.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {videos.map(({ file, label }) => {
            const checked = sel.has(file);
            return (
              <div key={file} onClick={() => toggle(file)} style={{
                background: C.card, borderRadius: 12, overflow: "hidden", cursor: "pointer",
                border: `2px solid ${checked ? C.acc : C.brd}`,
                transition: "border-color 0.15s",
              }}>
                {/* Aperçu vidéo */}
                <div style={{ position: "relative", aspectRatio: "9/16", background: "#000", maxHeight: 320 }}>
                  <video
                    src={`/videos/${file}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    muted
                    playsInline
                    preload="metadata"
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                  />
                  {/* Badge coché */}
                  {checked && (
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      background: C.acc, borderRadius: "50%",
                      width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 700, color: "#0f172a",
                    }}>✓</div>
                  )}
                </div>
                {/* Infos */}
                <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" checked={checked} readOnly
                    style={{ width: 16, height: 16, accentColor: C.acc, cursor: "pointer" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 11, color: C.mut }}>{file}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      {videos.length > 0 && (
        <div style={{ marginTop: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={save} disabled={saving} style={{
            padding: "9px 22px", borderRadius: 8, border: "none",
            background: C.acc, color: "#0f172a", fontWeight: 700,
            fontSize: 14, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Sauvegarde…" : `💾 Sauvegarder (${sel.size} vidéo${sel.size > 1 ? "s" : ""})`}
          </button>
          {toast && (
            <span style={{ fontSize: 13, color: toast.ok ? C.acc : "#f87171" }}>
              {toast.ok ? toast.message : `❌ ${toast.error}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
