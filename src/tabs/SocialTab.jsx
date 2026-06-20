/**
 * SocialTab — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState, useEffect } from "react";
import { useAppData } from "../AppDataContext.jsx";

export default function SocialTab() {
  const { mob } = useAppData();
  const [status, setStatus]   = useState(null);
  const [posts, setPosts]     = useState({ ig: [], fb: [] });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingPosts, setLoadingPosts]   = useState(true);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [channels, setChannels] = useState(["ig", "fb"]);
  const [publishing, setPublishing] = useState(false);
  const [pubResult, setPubResult] = useState(null);
  const [view, setView] = useState("composer"); // composer | feed

  useEffect(() => {
    fetch("/api/social?action=status")
      .then(r => r.json()).then(setStatus).catch(() => setStatus({ error: true }))
      .finally(() => setLoadingStatus(false));
    fetch("/api/social?action=posts&limit=9")
      .then(r => r.json()).then(setPosts).catch(() => setPosts({ ig: [], fb: [] }))
      .finally(() => setLoadingPosts(false));
  }, []);

  async function publish() {
    if (!caption.trim()) return;
    setPublishing(true); setPubResult(null);
    try {
      const r = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || "") },
        body: JSON.stringify({ action: "publish", caption, imageUrl: imageUrl.trim() || undefined, channels }),
      });
      const d = await r.json();
      setPubResult(d);
      if (d.ok) { setCaption(""); setImageUrl(""); }
    } catch (e) {
      setPubResult({ error: e.message });
    } finally {
      setPublishing(false);
    }
  }

  function toggleChannel(ch) {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  }

  const card = { background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px", marginBottom: 14 };
  const label = { fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 };
  const inp = { width: "100%", background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#e2e8f0", fontSize: 13, padding: "10px 12px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" };

  // ── Status bar ──────────────────────────────────────────────
  function StatusBar() {
    if (loadingStatus) return <div style={{ height: 44, background: "#1e293b", borderRadius: 10, marginBottom: 14, animation: "pulse 1.5s infinite" }} />;
    const s = status || {};
    const daysLeft = s.token?.expiresIn;
    const tokenColor = daysLeft > 14 ? "#10b981" : daysLeft > 5 ? "#f59e0b" : "#ef4444";
    return (
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {/* Facebook */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 14px", flex: 1, minWidth: 160 }}>
          <span style={{ fontSize: 18 }}>📘</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{s.page?.name || "Facebook"}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{s.page?.followers_count?.toLocaleString("fr-FR") || "—"} abonnés</div>
          </div>
          <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: s.page?.id ? "#10b981" : "#ef4444" }} />
        </div>
        {/* Instagram */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 14px", flex: 1, minWidth: 160 }}>
          <span style={{ fontSize: 18 }}>📸</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>
              {s.ig?.username ? `@${s.ig.username}` : "@amaryllislocations"}
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{s.ig?.followers_count?.toLocaleString("fr-FR") || "—"} abonnés</div>
          </div>
          <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: s.ig ? "#10b981" : "#f59e0b" }} />
        </div>
        {/* Token expiry */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e293b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 14px", minWidth: 130 }}>
          <span style={{ fontSize: 16 }}>🔑</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokenColor }}>
              {daysLeft != null ? `${daysLeft}j restants` : "Token"}
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Expire dans</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Sub-tabs ─────────────────────────────────────────────────
  const subTabs = [{ id: "composer", l: "✍️ Composer" }, { id: "feed", l: "📸 Feed" }];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: mob ? "8px 0" : "12px 0" }}>
      <StatusBar />

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
            background: view === t.id ? "rgba(99,102,241,0.2)" : "transparent",
            color: view === t.id ? "#818cf8" : "#64748b",
            outline: view === t.id ? "1px solid rgba(99,102,241,0.3)" : "none",
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── COMPOSER ── */}
      {view === "composer" && (
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 320px", gap: 14, alignItems: "start" }}>
          {/* Left — form */}
          <div>
            <div style={card}>
              <div style={label}>Légende / Caption</div>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Découvrez la vue imprenable depuis Villa Amaryllis… 🌊☀️ #Martinique #LocationLuxe"
                rows={5}
                style={{ ...inp, minHeight: 120 }}
                maxLength={2200}
              />
              <div style={{ textAlign: "right", fontSize: 10, color: caption.length > 2000 ? "#ef4444" : "#475569", marginTop: 4 }}>
                {caption.length}/2200
              </div>
            </div>

            <div style={card}>
              <div style={label}>URL de l'image</div>
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/…  ou  https://villamaryllis.com/…"
                style={{ ...inp, resize: "none" }}
              />
              <div style={{ fontSize: 10, color: "#475569", marginTop: 6 }}>
                💡 L'image doit être accessible publiquement (HTTPS). Instagram l'héberge ensuite sur ses serveurs.
              </div>
            </div>

            <div style={card}>
              <div style={label}>Canaux de publication</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ id: "ig", label: "📸 Instagram", color: "#e1306c" }, { id: "fb", label: "📘 Facebook", color: "#1877f2" }].map(ch => (
                  <button key={ch.id} onClick={() => toggleChannel(ch.id)} style={{
                    padding: "8px 18px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: channels.includes(ch.id) ? `1px solid ${ch.color}` : "1px solid rgba(255,255,255,0.1)",
                    background: channels.includes(ch.id) ? `${ch.color}22` : "transparent",
                    color: channels.includes(ch.id) ? ch.color : "#64748b",
                  }}>{ch.label}</button>
                ))}
              </div>
            </div>

            <button
              onClick={publish}
              disabled={publishing || !caption.trim() || channels.length === 0}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: publishing || !caption.trim() ? "not-allowed" : "pointer",
                border: "none",
                background: publishing || !caption.trim() ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: publishing || !caption.trim() ? "#475569" : "#fff",
                transition: "opacity 0.2s",
              }}
            >
              {publishing ? "Publication en cours…" : "🚀 Publier maintenant"}
            </button>

            {pubResult && (
              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: pubResult.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${pubResult.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                {pubResult.ok
                  ? <div style={{ color: "#10b981", fontWeight: 700 }}>✅ Publié avec succès !</div>
                  : <div style={{ color: "#ef4444", fontWeight: 700 }}>❌ {pubResult.error || "Erreur de publication"}</div>
                }
                {pubResult.results && Object.entries(pubResult.results).map(([ch, r]) => (
                  <div key={ch} style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {ch.toUpperCase()}: {r.ok ? `✅ ID ${r.id}` : `❌ ${r.error}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — preview */}
          <div>
            <div style={{ ...card, position: "sticky", top: 12 }}>
              <div style={label}>Aperçu</div>
              <div style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🌺</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>amaryllislocations</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Martinique · À l'instant</div>
                  </div>
                </div>
                {/* Image */}
                {imageUrl ? (
                  <img src={imageUrl} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
                ) : (
                  <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg,#1e293b,#0f172a)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 36, opacity: 0.3 }}>🏝️</span>
                    <span style={{ fontSize: 11, color: "#334155" }}>Aucune image</span>
                  </div>
                )}
                {/* Caption */}
                <div style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>amaryllislocations </span>
                  <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {caption || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Votre légende…</span>}
                  </span>
                </div>
                {/* Likes */}
                <div style={{ padding: "6px 12px 10px", fontSize: 11, color: "#64748b", display: "flex", gap: 14 }}>
                  <span>❤️ 0 J'aime</span>
                  <span>💬 0 commentaires</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FEED ── */}
      {view === "feed" && (
        <div>
          {loadingPosts ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3 }}>
              {Array(9).fill(0).map((_, i) => (
                <div key={i} style={{ aspectRatio: "1/1", background: "#1e293b", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : posts.ig.length === 0 && posts.fb.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune publication récente</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Les posts Instagram/Facebook apparaîtront ici</div>
            </div>
          ) : (
            <div>
              {posts.ig.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>📸 Instagram récents</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8 }}>
                    {posts.ig.map(p => (
                      <a key={p.id} href={p.permalink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <div style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.2s" }}>
                          {(p.media_url || p.thumbnail_url) && (
                            <img src={p.media_url || p.thumbnail_url} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                          )}
                          <div style={{ padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {p.caption || "—"}
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 10, color: "#475569" }}>
                              <span>❤️ {p.like_count || 0}</span>
                              <span>💬 {p.comments_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {posts.fb.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>📘 Facebook récents</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {posts.fb.map(p => (
                      <div key={p.id} style={card}>
                        {p.full_picture && <img src={p.full_picture} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} />}
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{p.message?.slice(0, 200) || "—"}</div>
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 6 }}>{new Date(p.created_time).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
