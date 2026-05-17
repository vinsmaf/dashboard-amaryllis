import { useState, useEffect } from "react";

// ── PKCE utilities ────────────────────────────────────────────────
function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function makeVerifier() {
  const a = new Uint8Array(32); crypto.getRandomValues(a); return b64url(a);
}
async function makeChallenge(v) {
  return b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)));
}

// ── Token storage ─────────────────────────────────────────────────
const K = { AT: "ms_at", RT: "ms_rt", EXP: "ms_exp", CID: "ms_cid", VER: "ms_ver" };

function saveTok({ access_token, refresh_token, expires_in }) {
  localStorage.setItem(K.AT, access_token);
  if (refresh_token) localStorage.setItem(K.RT, refresh_token);
  localStorage.setItem(K.EXP, String(Date.now() + (Number(expires_in) - 60) * 1000));
}

async function tokenReq(body) {
  const r = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  return r.json();
}

async function getAT() {
  const exp = Number(localStorage.getItem(K.EXP) || 0);
  if (Date.now() < exp) return localStorage.getItem(K.AT);
  const rt = localStorage.getItem(K.RT);
  if (!rt) return null;
  const d = await tokenReq({ client_id: localStorage.getItem(K.CID), grant_type: "refresh_token", refresh_token: rt, scope: "Mail.Read offline_access User.Read" });
  if (d.access_token) { saveTok(d); return d.access_token; }
  return null;
}

// ── Microsoft Graph ───────────────────────────────────────────────
async function graph(at, path) {
  const r = await fetch(`https://graph.microsoft.com/v1.0${path}`, { headers: { Authorization: `Bearer ${at}` } });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${r.status}`); }
  return r.json();
}

async function fetchMails(at, search, top = 80) {
  try {
    const q = encodeURIComponent(`"${search}"`);
    const d = await graph(at, `/me/messages?$search=${q}&$select=subject,receivedDateTime,bodyPreview,body,from&$top=${top}`);
    return d.value || [];
  } catch { return []; }
}

// ── Parsers ───────────────────────────────────────────────────────
const PROPS = ["Amaryllis", "Zandoli", "Iguana", "Géko", "Geko", "Mabouya", "Bellevue", "Nogent", "Marne", "Schœlcher", "Schoelcher", "Portes de Paris"];

function findProp(text) {
  return PROPS.find(p => text.includes(p)) || null;
}

function findAmount(text) {
  // Strip HTML
  const clean = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&euro;/g, "€");

  // Find amounts between 50€ and 20 000€, avoid prices per night (followed by /nuit)
  const pat = /(\d[\d\s]{0,6}[,\.]?\d{0,2})\s*€(?!\s*\/\s*(?:nuit|noche|night|j|jour))/g;
  const found = [];
  let m;
  while ((m = pat.exec(clean)) !== null) {
    const raw = m[1].trim().replace(/\s/g, "").replace(",", ".");
    const v = parseFloat(raw);
    if (v >= 50 && v <= 20000) found.push(v);
  }
  if (!found.length) return null;
  // Prefer the largest amount (likely the total payout)
  return Math.max(...found);
}

function findDates(text) {
  const clean = text.replace(/<[^>]+>/g, " ");
  const dates = [];
  // ISO dates
  const iso = /\b(\d{4}-\d{2}-\d{2})\b/g;
  let m;
  while ((m = iso.exec(clean)) !== null) dates.push(m[1]);
  // European dates dd/mm/yyyy
  const eu = /\b(\d{2})\/(\d{2})\/(\d{4})\b/g;
  while ((m = eu.exec(clean)) !== null) dates.push(`${m[3]}-${m[2]}-${m[1]}`);
  // Dedupe and sort
  const uniq = [...new Set(dates)].sort();
  // Return first two future or recent dates
  const today = new Date().toISOString().slice(0, 10);
  const relevant = uniq.filter(d => d >= new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10));
  return relevant.slice(0, 2);
}

function findGuest(text) {
  const clean = text.replace(/<[^>]+>/g, " ");
  const m = clean.match(/(?:voyageur|guest|hôte|réservé par|client|nom du client|billet au nom de)\s*[:\-]?\s*([A-ZÀ-Ü][a-zà-ü\-]+(?:\s+[A-ZÀ-Ü][a-zà-ü\-]+){0,2})/i);
  return m?.[1]?.trim() || null;
}

function parseEmail(email) {
  const from = email.from?.emailAddress?.address?.toLowerCase() || "";
  const subject = email.subject || "";
  const body = email.body?.content || email.bodyPreview || "";
  const fullText = subject + " " + body;

  const isAirbnb = from.includes("airbnb");
  const isBooking = from.includes("booking");
  if (!isAirbnb && !isBooking) return null;

  // Filter: only reservation / payout emails
  const keywords = /réservation|reservation|booking|confirmé|confirmed|paiement|virement|versement|revenus|gains|new booking|nouvelle/i;
  if (!keywords.test(subject)) return null;

  const amount = findAmount(body);
  const dates = findDates(body);
  const guest = findGuest(body);
  const property = findProp(fullText);
  const platform = isAirbnb ? "Airbnb" : "Booking.com";

  return {
    id: email.id,
    platform,
    subject: subject.slice(0, 90),
    date: email.receivedDateTime,
    amount,
    checkin: dates[0] || null,
    checkout: dates[1] || null,
    guest,
    property,
  };
}

// ── Styles ────────────────────────────────────────────────────────
const card = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "20px 22px", marginBottom: 14 };
const label = { fontSize: 10, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 };
const badge = (color) => ({ display: "inline-flex", alignItems: "center", padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: color + "22", color, border: `1px solid ${color}44` });

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtAmt(v) {
  if (!v) return null;
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

// ── Setup instructions card ───────────────────────────────────────
function SetupGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...card, borderColor: "rgba(14,165,233,0.2)", background: "rgba(14,165,233,0.05)", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0ea5e9", marginBottom: 2 }}>Configuration requise — Azure App (5 min)</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Créer une app Azure pour autoriser la lecture des emails</div>
        </div>
        <span style={{ color: "#0ea5e9", fontSize: 16 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <ol style={{ margin: "16px 0 0", padding: "0 0 0 18px", fontSize: 11, color: "#94a3b8", lineHeight: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <li>Va sur <strong style={{ color: "#e2e8f0" }}>portal.azure.com</strong> → "Microsoft Entra ID" → "App registrations" → <strong style={{ color: "#e2e8f0" }}>New registration</strong></li>
          <li>Nom : <strong style={{ color: "#e2e8f0" }}>Amaryllis Dashboard</strong> — Type de compte : <strong style={{ color: "#e2e8f0" }}>Personal Microsoft accounts only</strong></li>
          <li>Redirect URI : type <strong style={{ color: "#e2e8f0" }}>Single-page application (SPA)</strong> → <strong style={{ color: "#e2e8f0" }}>https://dashboard-amaryllis.pages.dev/admin</strong></li>
          <li>Copie l'<strong style={{ color: "#e2e8f0" }}>Application (client) ID</strong> et colle-le ci-dessous</li>
          <li>Va dans "API permissions" → Add → Microsoft Graph → Delegated → ajoute <strong style={{ color: "#e2e8f0" }}>Mail.Read</strong> et <strong style={{ color: "#e2e8f0" }}>User.Read</strong></li>
        </ol>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function EmailSync({ mob }) {
  const [clientId, setClientId] = useState(localStorage.getItem(K.CID) || "");
  const [editCid, setEditCid] = useState(!localStorage.getItem(K.CID));
  const [connected, setConnected] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ms_email_results") || "[]"); } catch { return []; }
  });
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState("all");
  const [lastSync, setLastSync] = useState(localStorage.getItem("ms_last_sync") || null);

  // On mount: handle OAuth callback or check stored tokens
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const cid = localStorage.getItem(K.CID);

    if (code && cid) {
      window.history.replaceState({}, "", window.location.pathname);
      setLoading(true);
      tokenReq({
        client_id: cid,
        grant_type: "authorization_code",
        code,
        redirect_uri: window.location.origin + window.location.pathname,
        code_verifier: localStorage.getItem(K.VER) || "",
        scope: "Mail.Read offline_access User.Read",
      }).then(d => {
        if (d.access_token) {
          saveTok(d);
          setConnected(true);
          loadUserInfo(d.access_token);
        } else {
          setErr("Échec auth : " + (d.error_description || d.error || "erreur inconnue"));
        }
        setLoading(false);
      });
      return;
    }

    if (cid && localStorage.getItem(K.RT)) {
      setConnected(true);
      getAT().then(at => { if (at) loadUserInfo(at); });
    }
  }, []);

  async function loadUserInfo(at) {
    try {
      const d = await graph(at, "/me?$select=mail,userPrincipalName");
      setUserEmail(d.mail || d.userPrincipalName);
    } catch {}
  }

  async function connect() {
    if (!clientId.trim()) return;
    localStorage.setItem(K.CID, clientId.trim());
    const verifier = makeVerifier();
    const challenge = await makeChallenge(verifier);
    localStorage.setItem(K.VER, verifier);
    const params = new URLSearchParams({
      client_id: clientId.trim(),
      response_type: "code",
      redirect_uri: window.location.origin + window.location.pathname,
      scope: "Mail.Read offline_access User.Read",
      code_challenge: challenge,
      code_challenge_method: "S256",
      response_mode: "query",
      prompt: "select_account",
    });
    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
  }

  function disconnect() {
    [K.AT, K.RT, K.EXP, K.VER, "ms_email_results", "ms_last_sync"].forEach(k => localStorage.removeItem(k));
    setConnected(false);
    setUserEmail(null);
    setResults([]);
    setLastSync(null);
  }

  async function sync() {
    const cid = localStorage.getItem(K.CID);
    if (!cid) return;
    setLoading(true);
    setErr(null);
    try {
      const at = await getAT();
      if (!at) { setErr("Session expirée — reconnecte-toi."); setConnected(false); setLoading(false); return; }

      const [airbnbMails, bookingMails] = await Promise.all([
        fetchMails(at, "from:airbnb.com"),
        fetchMails(at, "from:booking.com"),
      ]);

      const parsed = [...airbnbMails, ...bookingMails]
        .map(parseEmail)
        .filter(Boolean)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setResults(parsed);
      localStorage.setItem("ms_email_results", JSON.stringify(parsed));
      const now = new Date().toLocaleString("fr-FR");
      setLastSync(now);
      localStorage.setItem("ms_last_sync", now);

      if (!parsed.length) setErr("Aucun email de réservation détecté. Vérifie que ton compte Hotmail reçoit bien les confirmations Airbnb/Booking.com.");
    } catch (e) {
      setErr("Erreur : " + e.message);
    }
    setLoading(false);
  }

  const filtered = filter === "all" ? results : results.filter(r => r.platform.toLowerCase().startsWith(filter));
  const totalParsed = results.filter(r => r.amount).reduce((s, r) => s + r.amount, 0);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Revenus par emails</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Lecture automatique des confirmations Airbnb & Booking.com dans ton Hotmail</div>
      </div>

      <SetupGuide />

      {/* Connection card */}
      <div style={card}>
        <div style={label}>Connexion Microsoft</div>
        {!connected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {editCid ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  placeholder="Azure Application (client) ID — ex: a1b2c3d4-..."
                  style={{ flex: 1, minWidth: 260, background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "8px 12px", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace" }}
                />
                <button
                  onClick={connect}
                  disabled={!clientId.trim()}
                  style={{ padding: "8px 18px", background: "#0ea5e9", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, cursor: clientId.trim() ? "pointer" : "default", opacity: clientId.trim() ? 1 : 0.5 }}
                >
                  Connecter Hotmail →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={connect} style={{ padding: "8px 18px", background: "#0ea5e9", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Connecter Hotmail →
                </button>
                <button onClick={() => setEditCid(true)} style={{ padding: "6px 10px", background: "none", border: "1px solid #334155", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" }}>Changer client ID</button>
              </div>
            )}
            {loading && <div style={{ fontSize: 11, color: "#64748b" }}>Authentification en cours…</div>}
            {err && <div style={{ fontSize: 11, color: "#f87171", background: "rgba(248,113,113,0.1)", padding: "8px 12px", borderRadius: 6 }}>{err}</div>}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...badge("#10b981") }}>● Connecté</span>
                {userEmail && <span style={{ fontSize: 12, color: "#94a3b8" }}>{userEmail}</span>}
              </div>
              {lastSync && <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Dernière sync : {lastSync}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={sync}
                disabled={loading}
                style={{ padding: "8px 18px", background: loading ? "#1e293b" : "#0ea5e9", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, cursor: loading ? "default" : "pointer" }}
              >
                {loading ? "⟳ Lecture emails…" : "⟳ Synchroniser"}
              </button>
              <button onClick={disconnect} style={{ padding: "6px 10px", background: "none", border: "1px solid #334155", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" }}>Déconnecter</button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {err && connected && (
        <div style={{ ...card, borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.05)", fontSize: 12, color: "#f87171" }}>
          {err}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Summary */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "Emails parsés", val: results.length, color: "#0ea5e9" },
              { label: "Avec montant", val: results.filter(r => r.amount).length, color: "#10b981" },
              { label: "Total détecté", val: fmtAmt(totalParsed), color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{ ...card, flex: "1 1 140px", margin: 0, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[["all", "Tous"], ["airbnb", "Airbnb"], ["booking", "Booking.com"]].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + (filter === k ? "#0ea5e9" : "#334155"), background: filter === k ? "rgba(14,165,233,0.15)" : "none", color: filter === k ? "#0ea5e9" : "#64748b", fontSize: 11, cursor: "pointer" }}>{l}</button>
            ))}
          </div>

          {/* Table */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Date", "Plateforme", "Sujet", "Bien", "Voyageur", "Arrivée", "Départ", "Montant"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600, fontSize: 10, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td style={{ padding: "9px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{fmtDate(r.date)}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={badge(r.platform === "Airbnb" ? "#f97316" : "#0ea5e9")}>{r.platform}</span>
                    </td>
                    <td style={{ padding: "9px 12px", color: "#94a3b8", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.subject}>{r.subject}</td>
                    <td style={{ padding: "9px 12px", color: r.property ? "#e2e8f0" : "#334155" }}>{r.property || "—"}</td>
                    <td style={{ padding: "9px 12px", color: r.guest ? "#e2e8f0" : "#334155" }}>{r.guest || "—"}</td>
                    <td style={{ padding: "9px 12px", color: "#94a3b8", whiteSpace: "nowrap" }}>{r.checkin ? r.checkin.slice(0, 10) : "—"}</td>
                    <td style={{ padding: "9px 12px", color: "#94a3b8", whiteSpace: "nowrap" }}>{r.checkout ? r.checkout.slice(0, 10) : "—"}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: r.amount ? "#10b981" : "#334155", whiteSpace: "nowrap" }}>
                      {r.amount ? fmtAmt(r.amount) : "Non détecté"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 10, color: "#334155", marginTop: 8 }}>
            ⚠ Les montants sont extraits automatiquement depuis le texte des emails. Vérifie les chiffres avant de les reporter dans le Cockpit.
          </div>
        </>
      )}
    </div>
  );
}
