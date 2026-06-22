// NewsletterTab — gestion abonnés newsletter + broadcast
// Admin uniquement — auth via POSTSTAY_SECRET (passé par le hook useAdminFetch de l'app)

import { useState, useEffect, useCallback } from "react";

const TEMPLATES = [
  { id: "newsletter-hiver",   label: "Newsletter hiver (guide haute saison)" },
  { id: "newsletter-offer",   label: "Offre abonné DIRECT10 (early check-in)" },
  { id: "newsletter-welcome", label: "Bienvenue + guides Martinique" },
];

function fmt(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ row }) {
  if (row.unsubscribed_at) return <span style={badge("#ef4444","#2a0d0d")}>Désabonné</span>;
  if (!row.confirmed_at)    return <span style={badge("#f59e0b","#2a1f00")}>En attente</span>;
  if (row.sequence_step >= 1) return <span style={badge("#10b981","#0a1f16")}>Confirmé · offre envoyée</span>;
  return <span style={badge("#60a5fa","#0d1829")}>Confirmé</span>;
}

function badge(color, bg) {
  return { display:"inline-block", fontSize:10, fontWeight:700, letterSpacing:"0.08em",
    textTransform:"uppercase", color, background:bg, border:`1px solid ${color}33`,
    borderRadius:4, padding:"2px 7px" };
}

function sourceLabel(src) {
  if (!src) return "—";
  return src.replace(/guide-/, "").replace(/-/g, " ");
}

export default function NewsletterTab() {
  const [stats, setStats]           = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [pagination, setPagination] = useState({ page:1, total:0, pages:1 });
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage]             = useState(1);

  const [broadcastOpen, setBroadcastOpen]   = useState(false);
  const [bTemplate, setBTemplate]           = useState(TEMPLATES[0].id);
  const [bSubject, setBSubject]             = useState("");
  const [bSending, setBSending]             = useState(false);
  const [bResult, setBResult]               = useState(null);

  const secret = window.__ADMIN_SECRET__ || "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ secret, page, filter });
      if (search) params.set("search", search);
      const r = await fetch(`/api/newsletter-admin?${params}`);
      const d = await r.json().catch(() => ({}));
      if (d.stats)       setStats(d.stats);
      if (d.subscribers) setSubscribers(d.subscribers);
      if (d.pagination)  setPagination(d.pagination);
    } catch (e) {
      console.error("NewsletterTab load error:", e);
    } finally {
      setLoading(false);
    }
  }, [secret, page, filter, search]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    if (!confirm("Supprimer cet abonné définitivement ?")) return;
    await fetch("/api/newsletter-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id, secret }),
    });
    load();
  }

  async function handleResendConfirm(id) {
    const r = await fetch("/api/newsletter-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend_confirm", id, secret }),
    });
    const d = await r.json().catch(() => ({}));
    alert(d.ok ? "Email de confirmation renvoyé ✓" : `Erreur : ${d.error}`);
  }

  async function handleBroadcast(e) {
    e.preventDefault();
    if (!bSubject.trim()) return;
    setBSending(true);
    setBResult(null);
    try {
      const r = await fetch("/api/newsletter-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "broadcast", template: bTemplate, subject: bSubject, secret }),
      });
      const d = await r.json().catch(() => ({}));
      setBResult(d);
    } catch (e) {
      setBResult({ ok: false, error: e.message });
    } finally {
      setBSending(false);
    }
  }

  const cs = { color:"#94a3b8" };
  const S = {
    wrap: { padding:"24px", minHeight:"100vh", background:"#0f172a", fontFamily:"'Jost',sans-serif, sans-serif" },
    h1:   { margin:"0 0 24px", fontSize:20, fontWeight:600, color:"#f1f5f9" },
    card: { background:"#1e293b", borderRadius:10, padding:"16px 20px", border:"1px solid #334155" },
    statVal: { fontSize:28, fontWeight:700, color:"#f1f5f9", lineHeight:1 },
    statLbl: { fontSize:11, color:"#64748b", letterSpacing:"0.06em", textTransform:"uppercase", marginTop:4 },
    btn:  { border:"none", borderRadius:7, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer" },
    input: { background:"#0f172a", border:"1px solid #334155", borderRadius:7, padding:"8px 12px",
             color:"#f1f5f9", fontSize:13, outline:"none", fontFamily:"inherit" },
    th:   { padding:"10px 14px", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em",
            color:"#64748b", textAlign:"left", borderBottom:"1px solid #1e293b" },
    td:   { padding:"12px 14px", fontSize:13, color:"#cbd5e1", borderBottom:"1px solid #1e293b" },
  };

  return (
    <div style={S.wrap}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <h1 style={S.h1}>Newsletter</h1>
        <button
          style={{ ...S.btn, background:"#c47254", color:"#fff" }}
          onClick={() => { setBroadcastOpen(true); setBResult(null); }}
        >
          ✉️ Envoyer une newsletter
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px,1fr))", gap:12, marginBottom:24 }}>
          {[
            { val: stats.total,       lbl: "Total inscrits" },
            { val: stats.confirmed,   lbl: "Confirmés actifs" },
            { val: stats.pending,     lbl: "En attente" },
            { val: stats.unsubscribed,lbl: "Désabonnés" },
            { val: stats.had_offer,   lbl: "Offre J+7 envoyée" },
          ].map(s => (
            <div key={s.lbl} style={S.card}>
              <div style={S.statVal}>{s.val ?? "—"}</div>
              <div style={S.statLbl}>{s.lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres + Search */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
        {["all","confirmed","pending","unsubscribed"].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            style={{ ...S.btn,
              background: filter===f ? "#3b82f6" : "#1e293b",
              color: filter===f ? "#fff" : "#94a3b8",
              border: `1px solid ${filter===f ? "#3b82f6" : "#334155"}`,
            }}>
            {{ all:"Tous", confirmed:"Confirmés", pending:"En attente", unsubscribed:"Désabonnés" }[f]}
          </button>
        ))}
        <form style={{ marginLeft:"auto", display:"flex", gap:8 }}
          onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }}>
          <input style={{ ...S.input, width:200 }} placeholder="Rechercher email / prénom…"
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          <button type="submit" style={{ ...S.btn, background:"#334155", color:"#f1f5f9" }}>🔍</button>
          {search && <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            style={{ ...S.btn, background:"#334155", color:"#94a3b8" }}>✕</button>}
        </form>
      </div>

      {/* Table abonnés */}
      <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:40, textAlign:"center", color:"#64748b" }}>Chargement…</div>
        ) : subscribers.length === 0 ? (
          <div style={{ padding:40, textAlign:"center", color:"#64748b" }}>Aucun abonné trouvé</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead style={{ background:"#0f172a" }}>
                <tr>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>Prénom</th>
                  <th style={S.th}>Source</th>
                  <th style={S.th}>Inscrit le</th>
                  <th style={S.th}>Statut</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(row => (
                  <tr key={row.id} style={{ background:"#1e293b" }}>
                    <td style={S.td}>{row.email}</td>
                    <td style={{ ...S.td, color:"#f1f5f9" }}>{row.first_name || <span style={cs}>—</span>}</td>
                    <td style={{ ...S.td, color:"#64748b", fontSize:11, fontStyle:"italic" }}>{sourceLabel(row.source)}</td>
                    <td style={{ ...S.td, color:"#64748b" }}>{fmt(row.created_at)}</td>
                    <td style={S.td}><StatusBadge row={row} /></td>
                    <td style={S.td}>
                      <div style={{ display:"flex", gap:6 }}>
                        {!row.confirmed_at && (
                          <button onClick={() => handleResendConfirm(row.id)}
                            style={{ ...S.btn, padding:"4px 10px", fontSize:11, background:"#1e3a5f", color:"#93c5fd", border:"1px solid #1d4ed8" }}>
                            Renvoyer confirm.
                          </button>
                        )}
                        <button onClick={() => handleDelete(row.id)}
                          style={{ ...S.btn, padding:"4px 10px", fontSize:11, background:"#2a1215", color:"#f87171", border:"1px solid #7f1d1d" }}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:16, alignItems:"center" }}>
          <button disabled={page<=1} onClick={() => setPage(p=>p-1)}
            style={{ ...S.btn, background:"#1e293b", color:"#94a3b8", opacity:page<=1?0.4:1 }}>← Précédent</button>
          <span style={{ fontSize:13, color:"#64748b" }}>Page {page} / {pagination.pages}</span>
          <button disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)}
            style={{ ...S.btn, background:"#1e293b", color:"#94a3b8", opacity:page>=pagination.pages?0.4:1 }}>Suivant →</button>
        </div>
      )}

      {/* Modal broadcast */}
      {broadcastOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={e => { if (e.target===e.currentTarget) setBroadcastOpen(false); }}>
          <div style={{ background:"#1e293b", borderRadius:12, border:"1px solid #334155", padding:28, width:480, maxWidth:"90vw" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:18, color:"#f1f5f9" }}>Envoyer une newsletter</h2>
              <button onClick={() => setBroadcastOpen(false)}
                style={{ background:"none", border:"none", color:"#64748b", fontSize:20, cursor:"pointer" }}>✕</button>
            </div>

            {bResult ? (
              <div>
                {bResult.ok ? (
                  <div style={{ background:"#0a1f16", border:"1px solid #10b981", borderRadius:8, padding:16 }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>✅</div>
                    <div style={{ color:"#10b981", fontWeight:700, fontSize:16 }}>{bResult.sent} emails envoyés</div>
                    {bResult.failed > 0 && <div style={{ color:"#f87171", fontSize:13, marginTop:4 }}>{bResult.failed} échecs</div>}
                  </div>
                ) : (
                  <div style={{ color:"#f87171", background:"#2a0d0d", border:"1px solid #7f1d1d", borderRadius:8, padding:16 }}>
                    Erreur : {bResult.error}
                  </div>
                )}
                <button onClick={() => { setBroadcastOpen(false); setBResult(null); }}
                  style={{ ...S.btn, background:"#334155", color:"#f1f5f9", width:"100%", marginTop:16 }}>Fermer</button>
              </div>
            ) : (
              <form onSubmit={handleBroadcast}>
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:12, color:"#94a3b8", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Template</label>
                  <select value={bTemplate} onChange={e => setBTemplate(e.target.value)}
                    style={{ ...S.input, width:"100%" }}>
                    {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:"block", fontSize:12, color:"#94a3b8", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Objet de l'email</label>
                  <input required value={bSubject} onChange={e => setBSubject(e.target.value)}
                    placeholder="Ex : Martinique cet hiver — les meilleures semaines sont là"
                    style={{ ...S.input, width:"100%", boxSizing:"border-box" }} />
                </div>
                <div style={{ background:"#0f172a", borderRadius:8, padding:"12px 14px", marginBottom:20, fontSize:12, color:"#64748b" }}>
                  📬 Sera envoyé à <strong style={{ color:"#f1f5f9" }}>{stats?.confirmed ?? "?"} abonnés confirmés actifs</strong>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button type="button" onClick={() => setBroadcastOpen(false)}
                    style={{ ...S.btn, background:"#334155", color:"#94a3b8", flex:1 }}>Annuler</button>
                  <button type="submit" disabled={bSending || !bSubject.trim()}
                    style={{ ...S.btn, background: bSending ? "#6b7280" : "#c47254", color:"#fff", flex:2,
                             opacity: (!bSubject.trim() || bSending) ? 0.6 : 1 }}>
                    {bSending ? "Envoi en cours…" : `Envoyer à ${stats?.confirmed ?? "?"} abonnés`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
