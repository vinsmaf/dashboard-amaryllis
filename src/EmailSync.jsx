import { useState, useEffect, useCallback } from "react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function findAmount(body, subject) {
  const text = (body + " " + subject).replace(/ /g, " ");
  const patterns = [
    /vous recevrez\D{0,20}([\d\s]+[.,]\d{2})\s*€/i,
    /paiement\D{0,20}([\d\s]+[.,]\d{2})\s*€/i,
    /montant\D{0,20}([\d\s]+[.,]\d{2})\s*€/i,
    /total\D{0,20}([\d\s]+[.,]\d{2})\s*€/i,
    /net\D{0,20}([\d\s]+[.,]\d{2})\s*€/i,
    /gain\D{0,20}([\d\s]+[.,]\d{2})\s*€/i,
    /revenus?\D{0,20}([\d\s]+[.,]\d{2})\s*€/i,
    /([\d\s]+[.,]\d{2})\s*€/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const v = parseFloat(m[1].replace(/\s/g, "").replace(",", "."));
      if (v >= 10 && v <= 30000) return v;
    }
  }
  return null;
}

function detectPlatform(sender, subject) {
  const s = (sender + " " + subject).toLowerCase();
  if (s.includes("airbnb")) return "Airbnb";
  if (s.includes("booking")) return "Booking.com";
  if (s.includes("abritel") || s.includes("vrbo") || s.includes("homeaway")) return "Abritel";
  return "Autre";
}

function fmtDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtEur(v) {
  if (!v && v !== 0) return "—";
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

const PLATFORM_COLOR = {
  "Airbnb": "#FF5A5F",
  "Booking.com": "#003580",
  "Abritel": "#3B7DD8",
  "Autre": "#64748b",
};

const APPS_SCRIPT_CODE = `// Ajoute CE BLOC dans ta fonction doGet(e), après la ligne "const action = ..."

  if (action === 'readEmails') {
    const ss = SpreadsheetApp.openById('1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U');
    const sheet = ss.getSheetByName('Emails');
    if (!sheet) return ContentService
      .createTextOutput(JSON.stringify({ok:false,error:'Onglet Emails introuvable'}))
      .setMimeType(ContentService.MimeType.JSON);
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const rows = data.slice(1)
      .map(row => Object.fromEntries(headers.map((h,i) => [h, String(row[i]||'')])))
      .filter(r => r.Sender || r.Subject);
    return ContentService
      .createTextOutput(JSON.stringify({ok:true,rows}))
      .setMimeType(ContentService.MimeType.JSON);
  }

// ↓ Garde le reste de ta fonction doGet existante tel quel ↓`;

// ─── Component principal ─────────────────────────────────────────────────────

export default function EmailSync({ mob }) {
  const [scriptUrl] = useState(() => localStorage.getItem("sheets_script_url") || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(() => localStorage.getItem("emails_last_sync") || null);
  const [showScript, setShowScript] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState("all");

  useEffect(() => {
    const cached = localStorage.getItem("emails_rows");
    if (cached) { try { setRows(JSON.parse(cached)); } catch {} }
  }, []);

  const fetchEmails = useCallback(async () => {
    if (!scriptUrl) { setError("URL Apps Script non configurée — configure-la dans ⚙ Paramètres du dashboard."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${scriptUrl}?action=readEmails`, { redirect: "follow" });
      const text = await res.text();
      if (text.trimStart().startsWith("<")) throw new Error("Réponse HTML — vérifiez que le déploiement Apps Script a 'Accès : Tout le monde'.");
      const data = JSON.parse(text);
      if (!data.ok) throw new Error(data.error || "Erreur Apps Script");
      const parsed = (data.rows || []).map((r, i) => ({
        id: i,
        date: r.Date || "",
        sender: r.Sender || "",
        subject: r.Subject || "",
        body: r.Body || "",
        platform: detectPlatform(r.Sender || "", r.Subject || ""),
        amount: findAmount(r.Body || "", r.Subject || ""),
      }));
      setRows(parsed);
      const now = new Date().toLocaleString("fr-FR");
      setLastSync(now);
      localStorage.setItem("emails_rows", JSON.stringify(parsed));
      localStorage.setItem("emails_last_sync", now);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [scriptUrl]);

  const filtered = filterPlatform === "all" ? rows : rows.filter(r => r.platform === filterPlatform);
  const withAmount = filtered.filter(r => r.amount !== null);
  const totalAll = withAmount.reduce((s, r) => s + r.amount, 0);
  const byPlatform = {};
  rows.forEach(r => { if (r.amount !== null) byPlatform[r.platform] = (byPlatform[r.platform] || 0) + r.amount; });
  const platforms = [...new Set(rows.map(r => r.platform))];

  const copyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const card = { background: "#1e293b", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.06)" };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#f1f5f9" }}>📧 Revenus Airbnb & Booking</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
            Importés automatiquement depuis Hotmail via Zapier → Google Sheets
            {lastSync && <> · Synchro : {lastSync}</>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowScript(s => !s)}
            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>
            ⚙ Setup Apps Script
          </button>
          <button onClick={fetchEmails} disabled={loading}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: loading ? "#334155" : "#0ea5e9", color: "#fff", cursor: loading ? "default" : "pointer", fontSize: 13, fontWeight: 600 }}>
            {loading ? "⏳ Chargement…" : "🔄 Rafraîchir"}
          </button>
        </div>
      </div>

      {showScript && (
        <div style={{ ...card, marginBottom: 20, borderColor: "#0ea5e9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <strong style={{ color: "#0ea5e9" }}>⚙ Mise à jour Apps Script requise (une seule fois)</strong>
            <button onClick={() => setShowScript(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px" }}>
            Dans la feuille <strong style={{ color: "#f1f5f9" }}>finances</strong> → <strong style={{ color: "#f1f5f9" }}>Extensions &gt; Apps Script</strong> → colle ce code au début de <code style={{ color: "#7dd3fc" }}>doGet(e)</code> :
          </p>
          <pre style={{ background: "#0f172a", borderRadius: 8, padding: 14, fontSize: 11, color: "#7dd3fc", overflowX: "auto", margin: "0 0 12px", whiteSpace: "pre-wrap" }}>
            {APPS_SCRIPT_CODE}
          </pre>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={copyScript}
              style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: copied ? "#10b981" : "#0ea5e9", color: "#fff", cursor: "pointer", fontSize: 12 }}>
              {copied ? "✓ Copié !" : "📋 Copier le code"}
            </button>
            <span style={{ color: "#64748b", fontSize: 11 }}>
              Puis : Déployer &gt; Gérer les déploiements &gt; ✏ &gt; Nouvelle version &gt; Déployer
            </span>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: "#1e1215", border: "1px solid #ef4444", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#fca5a5", fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(Object.keys(byPlatform).length + 1, 4)}, 1fr)`, gap: 12, marginBottom: 20 }}>
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Total détecté</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981" }}>{fmtEur(Object.values(byPlatform).reduce((s, v) => s + v, 0))}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{rows.filter(r => r.amount !== null).length} emails avec montant</div>
          </div>
          {Object.entries(byPlatform).map(([p, v]) => (
            <div key={p} style={{ ...card, textAlign: "center", borderColor: PLATFORM_COLOR[p] + "44" }}>
              <div style={{ fontSize: 11, color: PLATFORM_COLOR[p], marginBottom: 4 }}>{p}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>{fmtEur(v)}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{rows.filter(r => r.platform === p && r.amount !== null).length} réservations</div>
            </div>
          ))}
        </div>
      )}

      {platforms.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {["all", ...platforms].map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)}
              style={{ padding: "5px 12px", borderRadius: 20, border: "none", fontSize: 12, cursor: "pointer",
                background: filterPlatform === p ? (p === "all" ? "#0ea5e9" : PLATFORM_COLOR[p]) : "#1e293b",
                color: filterPlatform === p ? "#fff" : "#94a3b8" }}>
              {p === "all" ? "Tous" : p}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 8 }}>
            {rows.length === 0 ? "Aucun email importé" : "Aucun email pour ce filtre"}
          </div>
          <div style={{ color: "#64748b", fontSize: 12 }}>
            {rows.length === 0
              ? "Zapier copiera automatiquement les prochains emails Airbnb/Booking ici · Clique ⚙ Setup Apps Script pour activer la lecture"
              : "Change de filtre pour voir d'autres emails"}
          </div>
        </div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#0f172a" }}>
                  {["Date", "Plateforme", "Sujet", "Montant"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: h === "Montant" ? "right" : "left", color: "#64748b", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "9px 14px", color: "#94a3b8", whiteSpace: "nowrap" }}>{fmtDate(r.date)}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: (PLATFORM_COLOR[r.platform] || "#64748b") + "22", color: PLATFORM_COLOR[r.platform] || "#64748b" }}>
                        {r.platform}
                      </span>
                    </td>
                    <td style={{ padding: "9px 14px", color: "#cbd5e1", maxWidth: 300 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subject || "—"}</div>
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700,
                      color: r.amount !== null ? "#10b981" : "#475569" }}>
                      {r.amount !== null ? fmtEur(r.amount) : <span style={{ fontSize: 10, fontWeight: 400 }}>non détecté</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: 11 }}>{filtered.length} email{filtered.length > 1 ? "s" : ""}</span>
            {withAmount.length > 0 && <span style={{ color: "#10b981", fontWeight: 700, fontSize: 13 }}>{fmtEur(totalAll)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
