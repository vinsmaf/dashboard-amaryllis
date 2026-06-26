import { useState, useEffect, useCallback, useMemo, useRef, Component } from 'react';
import { useAppData } from './AppDataContext.jsx';
import { loadDailyPrices } from './seedPrices.js';

// ─── Error Boundary ──────────────────────────────────────────────────────────
class RMErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e, info) { console.error('[RevenueManager] render error:', e, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, color: '#ef4444', fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠️ Erreur Revenue Manager</div>
          <div style={{ color: '#94a3b8' }}>{this.state.error?.message}</div>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: '6px 14px', background: '#0ea5e9', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>Réessayer</button>
        </div>
      );
    }
    return this.props.children;
  }
}

import {
  ComposedChart, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (cents) => cents != null ? `${Math.round(cents / 100)}€` : '—';
const fmtDate = (ds) => {
  if (!ds) return '—';
  const d = new Date(ds + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};
const confidenceColor = (s) => s >= 75 ? '#10b981' : s >= 55 ? '#f59e0b' : '#ef4444';
const seasonColor = (t) => ({ peak: '#ef444420', high: '#f59e0b18', mid: '#0ea5e918', low: '#10b98118' })[t] || 'transparent';
const seasonBorder = (t) => ({ peak: '#ef444440', high: '#f59e0b40', mid: '#0ea5e940', low: '#10b98140' })[t] || 'rgba(255,255,255,0.07)';
const statusColor = (s) => ({ pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', overridden: '#a855f7', published: '#0ea5e9' })[s] || '#475569';
const statusLabel = (s) => ({ pending: 'En attente', approved: 'Validé', rejected: 'Refusé', overridden: 'Ajusté', published: 'Publié' })[s] || s;
const alertIcon = (flag) => ({ vacancy_danger: '🔴', vacancy_warning: '🟡', premium_opportunity: '💰', gap_detected: '🔵', manual_override_active: '🟣' })[flag] || '⚪';
const addDaysStr = (ds, n) => {
  const d = new Date(ds + 'T12:00:00Z');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const simColor = (s) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
const logColor = (t) => ({ error: '#ef4444', success: '#10b981', warn: '#f59e0b' })[t] || '#64748b';

// ─── Sub-components ───────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, color = '#e2e8f0', onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.15s',
    }}
  >
    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{children}</div>
);

const Btn = ({ onClick, children, style = {}, disabled = false, title }) => (
  <button onClick={onClick} disabled={disabled} title={title} style={{
    background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8,
    padding: '8px 16px', cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600, fontSize: 12, opacity: disabled ? 0.5 : 1, ...style,
  }}>{children}</button>
);

const BtnSec = ({ onClick, children, style = {}, disabled = false, title }) => (
  <button onClick={onClick} disabled={disabled} title={title} style={{
    background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    padding: '8px 14px', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12, opacity: disabled ? 0.5 : 1, ...style,
  }}>{children}</button>
);

const Badge = ({ children, color = '#64748b', bg }) => (
  <span style={{
    background: bg || `${color}22`, color, border: `1px solid ${color}44`,
    borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
  }}>{children}</span>
);

const ProgressBar = ({ value, max = 100, color = '#0ea5e9', label, showPct = true }) => (
  <div>
    {label && <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>{label}</div>}
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
    </div>
    {showPct && <div style={{ fontSize: 9, color, marginTop: 2 }}>{Math.round((value / max) * 100)}%</div>}
  </div>
);

const LoadingPlaceholder = ({ height = 80 }) => (
  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, height, opacity: 0.5, marginBottom: 8 }} />
);

const StepBadge = ({ n }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 20, height: 20, borderRadius: '50%', background: '#0ea5e9',
    color: '#fff', fontSize: 11, fontWeight: 700, marginRight: 6, flexShrink: 0,
  }}>{n}</span>
);

// ─── Main Component ───────────────────────────────────────────────────────────
function RevenueManagerPro() {
  const { biens = [], reservations = [], mob = false } = useAppData();
  const [tab, setTab] = useState('dashboard');
  const [selProp, setSelProp] = useState('amaryllis');
  const [recos, setRecos] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [signals, setSignals] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calcStatus, setCalcStatus] = useState('idle');
  const [selectedDate, setSelectedDate] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [adjustPrice, setAdjustPrice] = useState('');
  const [adjustMinStay, setAdjustMinStay] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [logs, setLogs] = useState([]);
  const [dbInitStatus, setDbInitStatus] = useState('unknown');
  const [approveAllStatus, setApproveAllStatus] = useState('idle');
  const [initLoading, setInitLoading] = useState(false);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [signalsLoading, setSignalsLoading] = useState(false);
  // Sub-tab for competitors
  const [compSubTab, setCompSubTab] = useState('list');
  // CSV editor
  const [csvContent, setCsvContent] = useState('');
  const [csvEditMode, setCsvEditMode] = useState(false);
  const [csvSaving, setCsvSaving] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  // Logs panel
  const [logsExpanded, setLogsExpanded] = useState(false);

  const shortTermBiens = useMemo(() =>
    biens.filter(b => b.type !== 'long'), [biens]);

  // Prix CalendrierTarifs pour le bien sélectionné — plancher des recos RM
  const calendrierPrices = useMemo(() => {
    const all = loadDailyPrices();
    return (all && all[selProp]) || {};
  }, [selProp]);

  // Prix effectif = max(reco RM, prix CalendrierTarifs)
  const effectiveCents = useCallback((reco) => {
    if (!reco) return 0;
    const rmCents = reco.recommended_price_cents || 0;
    const calFloor = (calendrierPrices[reco.date] || 0) * 100;
    return Math.max(rmCents, calFloor);
  }, [calendrierPrices]);

  const isCalFloor = useCallback((reco) => {
    if (!reco) return false;
    const rmCents = reco.recommended_price_cents || 0;
    const calFloor = (calendrierPrices[reco.date] || 0) * 100;
    return calFloor > 0 && calFloor > rmCents;
  }, [calendrierPrices]);

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [{ ts: new Date().toISOString(), msg, type }, ...prev].slice(0, 30));
    if (type === 'error' || type === 'success') setLogsExpanded(true);
  }, []);

  const apiCall = useCallback(async (url, options = {}) => {
    try {
      const tok = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('ldb_tok') : null;
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(tok ? { Authorization: 'Bearer ' + tok } : {}),
          ...(options.headers || {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      addLog(`Erreur : ${e.message}`, 'error');
      return null;
    }
  }, [addLog]);

  // Data loaders
  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    const from = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const data = await apiCall(`/api/rm-recommendations?property_id=${selProp}&from=${from}&to=${addDaysStr(from, 90)}`);
    if (data?.recommendations) setRecos(data.recommendations);
    setLoading(false);
  }, [selProp, calMonth, calYear, apiCall]);

  const loadOccupancy = useCallback(async () => {
    const data = await apiCall(`/api/rm-dashboard?property_id=${selProp}`);
    setOccupancy(data?.occupancy || null);
  }, [selProp, apiCall]);

  const loadSignals = useCallback(async () => {
    setSignalsLoading(true);
    const from = new Date().toISOString().slice(0, 10);
    const data = await apiCall(`/api/rm-competitors/signals?property_id=${selProp}&from=${from}&to=${addDaysStr(from, 90)}`);
    if (data?.signals) setSignals(data.signals);
    setSignalsLoading(false);
  }, [selProp, apiCall]);

  const loadCompetitors = useCallback(async () => {
    const data = await apiCall(`/api/rm-competitors?property_id=${selProp}`);
    if (data?.competitors) setCompetitors(data.competitors);
  }, [selProp, apiCall]);

  const loadOverrides = useCallback(async () => {
    const from = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const to = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${lastDay}`;
    const data = await apiCall(`/api/rm-overrides?property_id=${selProp}&from=${from}&to=${to}`);
    if (data?.overrides) setOverrides(data.overrides);
  }, [selProp, calMonth, calYear, apiCall]);

  const loadRules = useCallback(async () => {
    const data = await apiCall(`/api/rm-rules?property_id=${selProp}`);
    if (data?.rules) setRules(data.rules);
  }, [selProp, apiCall]);

  useEffect(() => {
    if (tab === 'calendar' || tab === 'dashboard') loadRecommendations();
    if (tab === 'dashboard') loadOccupancy();
    if (tab === 'competitors') { loadCompetitors(); if (compSubTab === 'market') loadSignals(); }
    if (tab === 'rules') loadRules();
    if (tab === 'calendar') loadOverrides();
  }, [selProp, tab, calMonth, calYear]);

  useEffect(() => {
    if (tab === 'competitors' && compSubTab === 'market') loadSignals();
  }, [compSubTab]);

  // Calendar days
  const calDays = useMemo(() => {
    const days = [];
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const lastDate = new Date(calYear, calMonth + 1, 0).getDate();
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
    for (let d = 1; d <= lastDate; d++) {
      const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: ds, day: d, reco: recos.find(r => r.date === ds) });
    }
    return days;
  }, [calYear, calMonth, recos]);

  // KPIs
  const kpis = useMemo(() => {
    const pending = recos.filter(r => r.status === 'pending');
    const alerts = recos.filter(r => { try { const f = typeof r.alert_flags === 'string' ? JSON.parse(r.alert_flags) : r.alert_flags; return Array.isArray(f) && f.length > 0; } catch { return false; } });
    const opps = recos.filter(r => r.premium_opportunity > 60);
    const avgPrice = recos.length ? Math.round(recos.reduce((a, r) => a + (r.recommended_price_cents || 0), 0) / recos.length / 100) : null;
    return { pending, alerts, opps, avgPrice };
  }, [recos]);

  const topOpps = useMemo(() =>
    [...recos].filter(r => r.premium_opportunity > 0).sort((a, b) => (b.premium_opportunity || 0) - (a.premium_opportunity || 0)).slice(0, 5),
    [recos]);
  const topRisks = useMemo(() =>
    [...recos].filter(r => r.vacancy_risk_score > 0).sort((a, b) => (b.vacancy_risk_score || 0) - (a.vacancy_risk_score || 0)).slice(0, 5),
    [recos]);

  // Handlers
  const handleCalculate = useCallback(async () => {
    setCalcStatus('loading');
    addLog(`Calcul des prix pour ${selProp}…`);
    const res = await apiCall('/api/rm-recommendations/calculate', { method: 'POST', body: JSON.stringify({ property_id: selProp }) });
    if (res?.ok) {
      setCalcStatus('ok');
      addLog(`✓ ${res.count || '?'} prix calculés`, 'success');
      loadRecommendations();
    } else { setCalcStatus('error'); }
    setTimeout(() => setCalcStatus('idle'), 3000);
  }, [selProp, apiCall, addLog, loadRecommendations]);

  const handleApproveAll = useCallback(async () => {
    setApproveAllStatus('loading');
    const pending = recos.filter(r => r.status === 'pending');
    addLog(`Validation de ${pending.length} dates…`);
    let ok = 0;
    for (const r of pending) {
      const res = await apiCall('/api/rm-recommendations/approve', { method: 'POST', body: JSON.stringify({ property_id: selProp, date: r.date }) });
      if (res?.ok) ok++;
    }
    addLog(`✓ ${ok}/${pending.length} dates validées`, 'success');
    setApproveAllStatus('ok');
    loadRecommendations();
    setTimeout(() => setApproveAllStatus('idle'), 3000);
  }, [recos, selProp, apiCall, addLog, loadRecommendations]);

  const handleApproveDate = useCallback(async (date, priceOverride, minStayOverride, reason) => {
    const body = { property_id: selProp, date };
    if (priceOverride) body.price_override = Math.round(parseFloat(priceOverride) * 100);
    if (minStayOverride) body.min_stay_override = parseInt(minStayOverride);
    if (reason) body.reason = reason;
    const res = await apiCall('/api/rm-recommendations/approve', { method: 'POST', body: JSON.stringify(body) });
    if (res?.ok) {
      addLog(`✓ ${date} validé${priceOverride ? ` à ${priceOverride}€` : ''}`, 'success');
      loadRecommendations();
      setSelectedDate(null);
    }
  }, [selProp, apiCall, addLog, loadRecommendations]);

  const handleRejectDate = useCallback(async (date) => {
    const res = await apiCall('/api/rm-recommendations/reject', { method: 'POST', body: JSON.stringify({ property_id: selProp, date, reason: adjustReason }) });
    if (res?.ok) {
      addLog(`${date} refusé`, 'warn');
      loadRecommendations();
      setSelectedDate(null);
    }
  }, [selProp, apiCall, addLog, loadRecommendations, adjustReason]);

  const handleDeleteOverride = useCallback(async (id) => {
    const res = await apiCall(`/api/rm-overrides?id=${id}`, { method: 'DELETE' });
    if (res?.ok) { addLog('Ajustement supprimé', 'info'); loadOverrides(); }
  }, [apiCall, addLog, loadOverrides]);

  const handleDbInit = useCallback(async () => {
    setInitLoading(true);
    addLog('Initialisation de la base de données…');
    const res = await apiCall('/api/rm-init', { method: 'POST' });
    if (res?.ok) { setDbInitStatus('ok'); addLog('✓ Base initialisée', 'success'); }
    else { setDbInitStatus('error'); }
    setInitLoading(false);
  }, [apiCall, addLog]);

  const handleScrape = useCallback(async () => {
    if (!selProp) { addLog('Sélectionnez un bien', 'error'); return; }
    setScrapeLoading(true);
    addLog('Lancement du scraping Apify…');
    try {
      const _tok = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('ldb_tok') : null;
      const raw = await fetch('/api/rm-scrape', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(_tok ? { Authorization: 'Bearer ' + _tok } : {}) }, body: JSON.stringify({ property_id: selProp }) });
      const res = await raw.json().catch(() => ({}));
      if (raw.ok && res?.ok) {
        addLog(`✓ Scraping lancé (${res.configs_triggered || 0} concurrents)`, 'success');
      } else {
        const msg = res?.error || res?.message || `HTTP ${raw.status}`;
        if (msg.includes('APIFY_TOKEN')) addLog('APIFY_TOKEN non configuré dans Cloudflare', 'error');
        else if (msg.includes('No active scraping')) addLog('Importez d\'abord les concurrents via CSV', 'error');
        else addLog(`Erreur : ${msg}`, 'error');
      }
    } catch (e) { addLog(`Erreur : ${e.message}`, 'error'); }
    setScrapeLoading(false);
  }, [selProp, addLog]);

  const handleRecalcSignals = useCallback(async () => {
    addLog('Recalcul des signaux marché…');
    const res = await apiCall('/api/rm-competitors/recalculate-signals', { method: 'POST', body: JSON.stringify({ property_id: selProp }) });
    if (res?.ok) { addLog('✓ Signaux recalculés', 'success'); loadSignals(); }
  }, [selProp, apiCall, addLog, loadSignals]);

  const handleRecalcAllBiens = useCallback(async () => {
    addLog(`Recalcul pour ${shortTermBiens.length} biens…`);
    for (const b of shortTermBiens) {
      const res = await apiCall('/api/rm-recommendations/calculate', { method: 'POST', body: JSON.stringify({ property_id: b.id || b.slug || b.nom || b.name }) });
      addLog(res?.ok ? `✓ ${b.nom || b.name || b.id}` : `✗ ${b.nom || b.name || b.id}`, res?.ok ? 'success' : 'error');
    }
    addLog('Recalcul global terminé', 'success');
  }, [shortTermBiens, apiCall, addLog]);

  const loadCSVFromFile = useCallback(async (propId) => {
    setCsvLoading(true);
    try {
      const res = await fetch(`/competitors/${propId || selProp}.csv`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCsvContent(await res.text());
      addLog(`CSV chargé`, 'info');
    } catch (e) { addLog(`Erreur chargement CSV : ${e.message}`, 'error'); }
    finally { setCsvLoading(false); }
  }, [selProp, addLog]);

  const handleSaveCSV = useCallback(async () => {
    if (!csvContent.trim()) return;
    setCsvSaving(true);
    const res = await apiCall('/api/rm-competitors/import-listings', { method: 'POST', body: JSON.stringify({ property_id: selProp, csv_content: csvContent }) });
    if (res?.ok) { addLog(`✓ ${res.imported} concurrent${res.imported !== 1 ? 's' : ''} importés`, 'success'); loadCompetitors(); }
    else { addLog(`Erreur import : ${res?.error || 'inconnue'}`, 'error'); }
    setCsvSaving(false);
  }, [selProp, csvContent, apiCall, addLog, loadCompetitors]);

  const handleDownloadCSV = useCallback(async () => {
    const res = await fetch(`/api/rm-competitors/export?property_id=${selProp}`);
    if (!res.ok) { addLog('Erreur export CSV', 'error'); return; }
    const blob = new Blob([await res.text()], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selProp}-competitors.csv`;
    a.click();
    addLog(`CSV exporté`, 'success');
  }, [selProp, addLog]);

  // Calendar nav
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const selectedReco = recos.find(r => r.date === selectedDate);

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '7px 12px', color: '#e2e8f0', fontSize: 12,
    width: '100%', outline: 'none', boxSizing: 'border-box',
  };

  const tabs = [
    { id: 'dashboard', label: mob ? '📊' : '📊 Tableau de bord' },
    { id: 'calendar',  label: mob ? '📅' : '📅 Calendrier' },
    { id: 'competitors', label: mob ? '🏢' : '🏢 Concurrents' },
    { id: 'rules',     label: mob ? '⚙️' : '⚙️ Règles & Admin' },
  ];

  // Logs: last entry for the mini bar
  const lastLog = logs[0];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Property selector ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {(shortTermBiens.length === 0 ? ['amaryllis', 'zandoli', 'geko', 'mabouya', 'schoelcher', 'nogent'] : shortTermBiens).map(b => {
          const pid = typeof b === 'string' ? b : (b.id || b.slug || b.nom || b.name);
          const label = typeof b === 'string' ? b : (b.nom || b.name || pid);
          return (
            <button key={pid} onClick={() => setSelProp(pid)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: selProp === pid ? '#0ea5e9' : 'rgba(255,255,255,0.06)',
              color: selProp === pid ? '#fff' : '#94a3b8',
              border: selProp === pid ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}>{label}</button>
          );
        })}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: mob ? 11 : 12, fontWeight: 600, cursor: 'pointer',
            background: tab === t.id ? '#0ea5e9' : 'transparent',
            color: tab === t.id ? '#fff' : '#64748b',
            border: 'none', transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── DASHBOARD ──────────────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div>
          {/* Workflow steps */}
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {/* Step 1 */}
            <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <StepBadge n={1} />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>Calculer les prix</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Le moteur analyse la saison, les règles et le marché pour proposer un prix par jour.
              </div>
              <Btn onClick={handleCalculate} disabled={calcStatus === 'loading'} title="Lance le moteur de prix pour les 90 prochains jours">
                {calcStatus === 'loading' ? '⏳ Calcul…' : calcStatus === 'ok' ? '✓ Calculé !' : '🔄 Calculer les prix'}
              </Btn>
            </div>

            {/* Step 2 */}
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <StepBadge n={2} />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>Vérifier le calendrier</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                {kpis.pending.length > 0
                  ? <><span style={{ color: '#f59e0b', fontWeight: 700 }}>{kpis.pending.length} dates</span> attendent votre validation.</>
                  : 'Aucune date en attente.'
                }
                {kpis.opps.length > 0 && <> <span style={{ color: '#10b981', fontWeight: 700 }}>{kpis.opps.length} opportunités</span> de hausse.</>}
              </div>
              <Btn onClick={() => setTab('calendar')} style={{ background: '#475569' }}>📅 Voir le calendrier</Btn>
            </div>

            {/* Step 3 */}
            <div style={{ background: 'rgba(16,185,129,0.06)', border: `1px solid ${kpis.pending.length > 0 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <StepBadge n={3} />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>Valider</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Approuve en masse tous les prix calculés, ou ajuste-les un par un dans le calendrier.
              </div>
              <Btn
                onClick={handleApproveAll}
                disabled={approveAllStatus === 'loading' || kpis.pending.length === 0}
                style={{ background: '#10b981' }}
                title="Valide tous les prix en attente d'un clic"
              >
                {approveAllStatus === 'loading' ? '⏳ Validation…' : kpis.pending.length > 0 ? `✓ Tout valider (${kpis.pending.length})` : '✓ Tout est validé'}
              </Btn>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {loading ? <><LoadingPlaceholder height={80} /><LoadingPlaceholder height={80} /><LoadingPlaceholder height={80} /><LoadingPlaceholder height={80} /></> : (
              <>
                <KPICard label="Prix moyen" value={kpis.avgPrice ? `${kpis.avgPrice}€` : '—'} sub="30 prochains jours" color="#0ea5e9" />
                <KPICard label="À valider" value={kpis.pending.length} sub="dates en attente" color="#f59e0b" onClick={kpis.pending.length > 0 ? () => setTab('calendar') : undefined} />
                <KPICard label="Alertes" value={kpis.alerts.length} sub="dates avec signaux" color="#ef4444" onClick={kpis.alerts.length > 0 ? () => setTab('calendar') : undefined} />
                <KPICard label="Opportunités" value={kpis.opps.length} sub="hausses possibles" color="#10b981" onClick={kpis.opps.length > 0 ? () => setTab('calendar') : undefined} />
              </>
            )}
          </div>

          {/* Occupation réelle (dernier snapshot Worker) */}
          {occupancy?.d30 && (
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: -8, marginBottom: 20 }}>
              Occupation réelle — 30j : <b style={{ color: '#e2e8f0' }}>{Math.round((occupancy.d30.occupancy_rate || 0) * 100)}%</b>
              {occupancy.d90 && <> · 90j : <b style={{ color: '#e2e8f0' }}>{Math.round((occupancy.d90.occupancy_rate || 0) * 100)}%</b></>}
            </div>
          )}

          {/* Opportunities & Risks */}
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
              <SectionHeader>💰 Top opportunités de hausse</SectionHeader>
              {loading ? <LoadingPlaceholder height={120} /> : topOpps.length === 0
                ? <div style={{ color: '#64748b', fontSize: 12 }}>Aucune opportunité — lancez un recalcul</div>
                : topOpps.map(r => (
                  <div key={r.date} onClick={() => { setTab('calendar'); setSelectedDate(r.date); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{fmtDate(r.date)}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{r.season_type || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                        {fmt(effectiveCents(r))}{isCalFloor(r) && <span title="Plancher CalendrierTarifs" style={{ fontSize: 9, marginLeft: 3 }}>📅</span>}
                      </div>
                      <Badge color="#10b981">+{Math.round(r.premium_opportunity)}%</Badge>
                    </div>
                  </div>
                ))
              }
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
              <SectionHeader>⚠️ Top risques de vacance</SectionHeader>
              {loading ? <LoadingPlaceholder height={120} /> : topRisks.length === 0
                ? <div style={{ color: '#64748b', fontSize: 12 }}>Aucun risque détecté</div>
                : topRisks.map(r => (
                  <div key={r.date} onClick={() => { setTab('calendar'); setSelectedDate(r.date); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{fmtDate(r.date)}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{r.season_type || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>
                        {fmt(effectiveCents(r))}{isCalFloor(r) && <span title="Plancher CalendrierTarifs" style={{ fontSize: 9, marginLeft: 3 }}>📅</span>}
                      </div>
                      <Badge color="#ef4444">Risque {Math.round(r.vacancy_risk_score)}%</Badge>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── CALENDAR ───────────────────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedDate && !mob ? '1fr 320px' : '1fr', gap: 16 }}>
          <div>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <button onClick={prevMonth} aria-label="Mois précédent" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>‹</button>
              <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#e2e8f0', textTransform: 'capitalize' }}>{monthLabel}</div>
              <button onClick={nextMonth} aria-label="Mois suivant" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>›</button>
              {kpis.pending.length > 0 && (
                <Btn onClick={handleApproveAll} disabled={approveAllStatus === 'loading'} style={{ background: '#10b981', padding: '6px 12px', fontSize: 11 }}>
                  {approveAllStatus === 'loading' ? '⏳' : `✓ Tout valider (${kpis.pending.length})`}
                </Btn>
              )}
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#64748b', fontWeight: 700, padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {loading ? <LoadingPlaceholder height={300} /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {calDays.map((cell, i) => {
                  if (!cell) return <div key={`e-${i}`} />;
                  const { date, day, reco } = cell;
                  const isSelected = selectedDate === date;
                  let flags = [];
                  try { if (reco?.alert_flags) { const p = typeof reco.alert_flags === 'string' ? JSON.parse(reco.alert_flags) : reco.alert_flags; flags = Array.isArray(p) ? p : []; } } catch {}
                  return (
                    <div key={date} onClick={() => { setSelectedDate(isSelected ? null : date); setAdjustPrice(''); setAdjustMinStay(''); setAdjustReason(''); }}
                      style={{
                        background: isSelected ? '#0ea5e920' : (reco ? seasonColor(reco.season_type) : 'rgba(255,255,255,0.02)'),
                        border: isSelected ? '2px solid #0ea5e9' : `1px solid ${reco ? seasonBorder(reco.season_type) : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 8, padding: '6px 4px', cursor: 'pointer', minHeight: 64,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all 0.15s',
                      }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{day}</div>
                      {reco && (
                        <>
                          <div style={{ fontSize: mob ? 9 : 11, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>
                            {fmt(effectiveCents(reco))}{isCalFloor(reco) && <span title="Plancher CalendrierTarifs" style={{ fontSize: 8 }}>📅</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(reco.status), display: 'inline-block' }} title={statusLabel(reco.status)} />
                            {flags.map(f => <span key={f} style={{ fontSize: 9 }} title={f}>{alertIcon(f)}</span>)}
                          </div>
                          {reco.recommended_min_stay > 1 && <div style={{ fontSize: 8, color: '#64748b' }}>{reco.recommended_min_stay}n min</div>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
              {[['peak', 'Haute saison', '#ef4444'], ['high', 'Haute', '#f59e0b'], ['mid', 'Moyenne', '#0ea5e9'], ['low', 'Basse', '#10b981']].map(([type, label, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748b' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: seasonColor(type), border: `1px solid ${seasonBorder(type)}` }} />
                  {label}
                </div>
              ))}
              {[['pending', '#f59e0b', 'En attente'], ['approved', '#10b981', 'Validé'], ['overridden', '#a855f7', 'Ajusté']].map(([s, c, l]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748b' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Side panel */}
          {selectedDate && selectedReco && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{fmtDate(selectedDate)}</div>
                <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>×</button>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Prix recommandé</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#0ea5e9', fontFamily: 'monospace' }}>
                  {fmt(effectiveCents(selectedReco))}
                  {isCalFloor(selectedReco) && <span title="Plancher CalendrierTarifs" style={{ fontSize: 14, marginLeft: 6 }}>📅</span>}
                </div>
                {isCalFloor(selectedReco) && (
                  <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 3 }}>
                    Plancher CalendrierTarifs ({calendrierPrices[selectedDate]}€) — RM proposait {fmt(selectedReco.recommended_price_cents)}
                  </div>
                )}
                {selectedReco.base_price_cents && <div style={{ fontSize: 11, color: '#64748b' }}>Base : {fmt(selectedReco.base_price_cents)}</div>}
                <div style={{ marginTop: 6 }}>
                  <Badge color={statusColor(selectedReco.status)}>{statusLabel(selectedReco.status)}</Badge>
                </div>
              </div>

              {/* Scores */}
              <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ProgressBar value={selectedReco.confidence_score || 0} color={confidenceColor(selectedReco.confidence_score || 0)} label="Confiance" />
                <ProgressBar value={selectedReco.vacancy_risk_score || 0} color="#ef4444" label="Risque vacance" />
                <ProgressBar value={selectedReco.premium_opportunity || 0} color="#10b981" label="Opportunité" />
              </div>

              {/* Alerts */}
              {(() => {
                let flags = [];
                try { if (selectedReco.alert_flags) { const p = typeof selectedReco.alert_flags === 'string' ? JSON.parse(selectedReco.alert_flags) : selectedReco.alert_flags; flags = Array.isArray(p) ? p : []; } } catch {}
                return flags.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>ALERTES</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {flags.map(f => <Badge key={f} color="#f59e0b">{alertIcon(f)} {f.replace(/_/g, ' ')}</Badge>)}
                    </div>
                  </div>
                );
              })()}

              {/* Min stay */}
              {selectedReco.recommended_min_stay > 1 && (
                <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(14,165,233,0.08)', borderRadius: 8, border: '1px solid rgba(14,165,233,0.2)' }}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Séjour minimum recommandé</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0ea5e9' }}>{selectedReco.recommended_min_stay} nuits</div>
                </div>
              )}

              {/* Factors */}
              {selectedReco.factors_json && (() => {
                try {
                  const factors = typeof selectedReco.factors_json === 'string' ? JSON.parse(selectedReco.factors_json) : selectedReco.factors_json;
                  const list = Array.isArray(factors) ? factors : Object.entries(factors).map(([rule, adj]) => ({ rule, adj }));
                  if (!list.length) return null;
                  return (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>FACTEURS DE PRIX</div>
                      {list.map((f, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ color: '#94a3b8' }}>{(f.rule || f.type || '—').replace(/_/g, ' ')}</span>
                          <span style={{ color: f.adj > 0 ? '#10b981' : f.adj < 0 ? '#ef4444' : '#e2e8f0', fontFamily: 'monospace' }}>
                            {typeof f.adj === 'number' ? `${f.adj > 0 ? '+' : ''}${Math.round(f.adj / 100)}€` : String(f.adj ?? '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                } catch { return null; }
              })()}

              {/* Adjust */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>AJUSTER (optionnel)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input style={inputStyle} placeholder="Prix personnalisé (€)" value={adjustPrice} onChange={e => setAdjustPrice(e.target.value)} type="number" min="0" />
                  <input style={inputStyle} placeholder="Séjour min (nuits)" value={adjustMinStay} onChange={e => setAdjustMinStay(e.target.value)} type="number" min="1" />
                  <input style={inputStyle} placeholder="Raison (optionnel)" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Btn onClick={() => handleApproveDate(selectedDate, adjustPrice, adjustMinStay, adjustReason)} style={{ background: '#10b981' }}>
                  ✓ {adjustPrice ? `Valider à ${adjustPrice}€` : 'Valider le prix'}
                </Btn>
                <BtnSec onClick={() => handleRejectDate(selectedDate)}>✗ Refuser</BtnSec>
              </div>
            </div>
          )}
          {selectedDate && !selectedReco && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, color: '#64748b', fontSize: 12 }}>
              Pas de prix calculé pour ce jour.
              <div style={{ marginTop: 8 }}>
                <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontSize: 12 }}>Fermer</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── COMPETITORS ────────────────────────────────────────────────────── */}
      {tab === 'competitors' && (
        <div>
          {/* Sub-tab toggle */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
            {[['list', '🏢 Mes concurrents'], ['market', '📈 Signaux marché']].map(([id, label]) => (
              <button key={id} onClick={() => setCompSubTab(id)} style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: compSubTab === id ? '#0ea5e9' : 'transparent',
                color: compSubTab === id ? '#fff' : '#64748b', border: 'none',
              }}>{label}</button>
            ))}
          </div>

          {/* ── Sub: Competitors list ── */}
          {compSubTab === 'list' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <Btn onClick={() => { setCsvEditMode(true); loadCSVFromFile(selProp); }} disabled={csvLoading} title="Ouvre l'éditeur de la liste des concurrents">
                  {csvLoading ? '⏳ Chargement…' : '📋 Éditer les concurrents'}
                </Btn>
                <BtnSec onClick={handleDownloadCSV} title="Télécharger en CSV">⬇️ Exporter CSV</BtnSec>
                <BtnSec onClick={handleScrape} disabled={scrapeLoading} title="Lance Apify pour récupérer les prix actuels sur Airbnb">
                  {scrapeLoading ? '⏳ En cours…' : '🕷️ Rafraîchir les prix'}
                </BtnSec>
              </div>

              {/* CSV Editor */}
              {csvEditMode && (
                <div style={{ marginBottom: 20, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 13 }}>✏️ Concurrents — {selProp}</span>
                      <span style={{ marginLeft: 10, fontSize: 10, color: '#64748b' }}>Une ligne par concurrent. Les lignes # sont des commentaires.</span>
                    </div>
                    <button onClick={() => setCsvEditMode(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                  <textarea value={csvContent} onChange={e => setCsvContent(e.target.value)} spellCheck={false} style={{
                    width: '100%', height: 280, fontFamily: 'monospace', fontSize: 11,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#e2e8f0', padding: 12, resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box',
                  }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                    <Btn onClick={handleSaveCSV} disabled={csvSaving}>
                      {csvSaving ? '⏳ Enregistrement…' : '💾 Enregistrer'}
                    </Btn>
                    <BtnSec onClick={() => loadCSVFromFile(selProp)} disabled={csvLoading}>↺ Recharger</BtnSec>
                    <span style={{ fontSize: 10, color: '#475569', marginLeft: 'auto' }}>
                      listing_id, name, platform, capacity, bedrooms, bathrooms, has_pool, has_sea_view, area_km, standing, notes, similarity_score, priority
                    </span>
                  </div>
                </div>
              )}

              {competitors.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
                  <div style={{ marginBottom: 8 }}>Aucun concurrent chargé pour <strong style={{ color: '#e2e8f0' }}>{selProp}</strong></div>
                  <div style={{ fontSize: 11 }}>Cliquez sur <em>"Éditer les concurrents"</em> puis <em>"Enregistrer"</em></div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                    {competitors.length} concurrent{competitors.length > 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {competitors.map((c, i) => (
                      <div key={c.listing_id || i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || `Concurrent ${c.listing_id}`}</div>
                            <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>ID {c.listing_id}</div>
                          </div>
                          <Badge color={simColor(c.similarity_score || 0)}>{c.similarity_score || '?'}%</Badge>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                          {c.capacity > 0 && <Badge color="#94a3b8">👥 {c.capacity}</Badge>}
                          {c.bedrooms > 0 && <Badge color="#64748b">🛏 {c.bedrooms}</Badge>}
                          {c.has_pool === 1 && <Badge color="#0ea5e9">🏊</Badge>}
                          {c.has_sea_view === 1 && <Badge color="#06b6d4">🌊</Badge>}
                          {c.standing && <Badge color={c.standing === 'premium' ? '#f59e0b' : '#64748b'}>{c.standing}</Badge>}
                        </div>
                        {c.avg_price_eur != null && (
                          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                            Prix moyen : <span style={{ color: '#e2e8f0', fontWeight: 700, fontFamily: 'monospace' }}>{Math.round(c.avg_price_eur)}€</span>
                          </div>
                        )}
                        {c.area_km > 0 && <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>📍 {c.area_km} km</div>}
                        {c.notes && <div style={{ fontSize: 10, color: '#475569', fontStyle: 'italic', marginBottom: 6 }}>{c.notes}</div>}
                        <a href={c.url || `https://www.airbnb.com/rooms/${c.listing_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#0ea5e9', textDecoration: 'none' }}>Voir l'annonce →</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Sub: Market signals ── */}
          {compSubTab === 'market' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Btn onClick={handleRecalcSignals} title="Recalcule les indicateurs marché à partir des snapshots concurrents">🔄 Recalculer</Btn>
              </div>
              {signalsLoading ? <><LoadingPlaceholder height={200} /><LoadingPlaceholder height={140} /></> :
                signals.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📈</div>
                    Aucun signal disponible.<br /><span style={{ fontSize: 11 }}>Rafraîchissez les prix concurrents via l'onglet "Mes concurrents" puis recalculez.</span>
                  </div>
                ) : (
                  <>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                      <SectionHeader>Notre prix vs Médiane marché (90 jours)</SectionHeader>
                      <ResponsiveContainer width="100%" height={220}>
                        <ComposedChart data={signals.slice(0, 90)} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={d => d?.slice(5)} />
                          <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => `${v}€`} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v, n) => [`${Math.round(v)}€`, n === 'our_recommended_price_eur' ? 'Notre prix' : 'Marché médian']} />
                          <Legend wrapperStyle={{ fontSize: 10, color: '#64748b' }} />
                          <Bar dataKey="our_recommended_price_eur" name="Notre prix" fill="#0ea5e9" opacity={0.8} radius={[2, 2, 0, 0]} />
                          <Line dataKey="market_median_price_eur" name="Marché médian" stroke="#f59e0b" strokeWidth={2} dot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                      <SectionHeader>Pression du marché</SectionHeader>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={signals.slice(0, 90)} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={d => d?.slice(5)} />
                          <YAxis tick={{ fontSize: 9, fill: '#64748b' }} domain={[0, 100]} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v) => [`${Math.round(v)}%`, 'Pression']} />
                          <Line dataKey="market_pressure_score" stroke="#a855f7" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
                      <SectionHeader>Détail — 30 prochains jours</SectionHeader>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr style={{ color: '#64748b', textAlign: 'left' }}>
                              {['Date', 'Notre prix', 'Marché médian', 'Position', 'Dispo marché', 'Confiance'].map(h => (
                                <th key={h} style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontWeight: 600, fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {signals.slice(0, 30).map((s, i) => {
                              const posColor = s.our_positioning === 'above' ? '#ef4444' : s.our_positioning === 'below' ? '#10b981' : '#f59e0b';
                              return (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#94a3b8' }}>
                                  <td style={{ padding: '6px 8px', color: '#e2e8f0', whiteSpace: 'nowrap' }}>{fmtDate(s.date)}</td>
                                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: '#0ea5e9' }}>{s.our_recommended_price_eur ? `${s.our_recommended_price_eur}€` : '—'}</td>
                                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: '#f59e0b' }}>{s.market_median_price_eur ? `${Math.round(s.market_median_price_eur)}€` : '—'}</td>
                                  <td style={{ padding: '6px 8px' }}>{s.our_positioning && <Badge color={posColor}>{s.our_positioning}</Badge>}</td>
                                  <td style={{ padding: '6px 8px' }}>
                                    {s.availability_rate != null && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                          <div style={{ width: `${s.availability_rate * 100}%`, height: '100%', background: '#0ea5e9' }} />
                                        </div>
                                        <span style={{ fontSize: 10 }}>{Math.round(s.availability_rate * 100)}%</span>
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '6px 8px' }}>
                                    {s.data_confidence != null && <span style={{ color: confidenceColor(s.data_confidence * 100) }}>{Math.round(s.data_confidence * 100)}%</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )
              }
            </div>
          )}
        </div>
      )}

      {/* ── RULES & ADMIN ──────────────────────────────────────────────────── */}
      {tab === 'rules' && (
        <div>
          {/* Admin actions */}
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>🗄️ BASE DE DONNÉES</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                Crée les tables si elles n'existent pas.
                {dbInitStatus === 'ok' && <span style={{ color: '#10b981', marginLeft: 6 }}>✓ OK</span>}
              </div>
              <BtnSec onClick={handleDbInit} disabled={initLoading} style={{ fontSize: 11, padding: '6px 12px' }}>
                {initLoading ? '⏳ En cours…' : '🔧 Initialiser'}
              </BtnSec>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>🔄 RECALCUL GLOBAL</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>Recalcule tous les biens court terme ({shortTermBiens.length}).</div>
              <BtnSec onClick={handleRecalcAllBiens} style={{ fontSize: 11, padding: '6px 12px' }}>♻️ Tous les biens</BtnSec>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>📅 APRÈS CHANGEMENTS</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>Recalcule les prix après avoir modifié des règles.</div>
              <BtnSec onClick={handleCalculate} disabled={calcStatus === 'loading'} style={{ fontSize: 11, padding: '6px 12px' }}>
                {calcStatus === 'loading' ? '⏳ Calcul…' : '🔄 Recalculer'}
              </BtnSec>
            </div>
          </div>

          {/* Rules */}
          <SectionHeader>Règles de prix actives</SectionHeader>
          {rules.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 24, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
              Aucune règle configurée. Initialisez la base pour créer les règles par défaut.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rules.map((rule, i) => (
                <div key={rule.id || i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>{rule.name || rule.rule_name || `Règle ${i + 1}`}</span>
                      {rule.rule_type && <Badge color="#8b5cf6">{rule.rule_type}</Badge>}
                      <Badge color={rule.is_active ? '#10b981' : '#ef4444'}>{rule.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    {rule.description && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{rule.description}</div>}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {rule.adjustment_type && (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          Ajustement: <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>
                            {rule.adjustment_type === 'percentage' ? `${rule.adjustment_value > 0 ? '+' : ''}${rule.adjustment_value}%` : `${rule.adjustment_value}€`}
                          </span>
                        </span>
                      )}
                      {rule.priority && <span style={{ fontSize: 11, color: '#64748b' }}>Priorité {rule.priority}</span>}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const res = await apiCall(`/api/rm-rules/${rule.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !rule.is_active }) });
                      if (res?.ok) { addLog(`Règle "${rule.name}" ${rule.is_active ? 'désactivée' : 'activée'}`, 'info'); loadRules(); }
                    }}
                    title={rule.is_active ? 'Désactiver cette règle' : 'Activer cette règle'}
                    style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: rule.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      color: rule.is_active ? '#ef4444' : '#10b981',
                      border: `1px solid ${rule.is_active ? '#ef444440' : '#10b98140'}`,
                      marginLeft: 12, flexShrink: 0,
                    }}
                  >{rule.is_active ? 'Désactiver' : 'Activer'}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LOGS BAR (always visible at bottom) ───────────────────────────── */}
      {logs.length > 0 && (
        <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          <div
            onClick={() => setLogsExpanded(e => !e)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Journal</span>
              {lastLog && (
                <span style={{ fontSize: 11, color: logColor(lastLog.type) }}>{lastLog.msg}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!logsExpanded && <span style={{ fontSize: 10, color: '#475569' }}>{logs.length} entrée{logs.length > 1 ? 's' : ''}</span>}
              <span style={{ fontSize: 12, color: '#475569' }}>{logsExpanded ? '▾' : '▸'}</span>
              {logsExpanded && (
                <button onClick={e => { e.stopPropagation(); setLogs([]); }} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>Effacer</button>
              )}
            </div>
          </div>
          {logsExpanded && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px', maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, fontFamily: 'monospace', fontSize: 11 }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', borderLeft: `3px solid ${logColor(log.type)}`, paddingLeft: 8 }}>
                  <span style={{ color: '#475569', whiteSpace: 'nowrap', fontSize: 10 }}>{new Date(log.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  <span style={{ color: logColor(log.type) }}>{log.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const RevenueManagerProWithBoundary = (props) => (
  <RMErrorBoundary><RevenueManagerPro {...props} /></RMErrorBoundary>
);
export default RevenueManagerProWithBoundary;
