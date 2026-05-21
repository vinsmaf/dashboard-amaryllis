import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ComposedChart, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from 'recharts';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (cents) => cents != null ? `${Math.round(cents / 100)}€` : '—';
const fmtDate = (ds) => {
  if (!ds) return '—';
  const d = new Date(ds + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};
const confidenceColor = (s) => s >= 75 ? '#10b981' : s >= 55 ? '#f59e0b' : '#ef4444';
const seasonColor = (t) => ({ peak: '#ef444420', high: '#f59e0b18', mid: '#0ea5e918', low: '#10b98118' })[t] || 'transparent';
const seasonBorder = (t) => ({ peak: '#ef444440', high: '#f59e0b40', mid: '#0ea5e940', low: '#10b98140' })[t] || 'rgba(255,255,255,0.07)';
const statusDot = (s) => ({ pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', overridden: '#a855f7', published: '#0ea5e9' })[s] || '#475569';
const alertIcon = (flag) => ({ vacancy_danger: '🔴', vacancy_warning: '🟡', premium_opportunity: '💰', gap_detected: '🔵', manual_override_active: '🟣' })[flag] || '⚪';
const addDaysStr = (ds, n) => {
  const d = new Date(ds + 'T12:00:00Z');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const simColor = (s) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
const logColor = (t) => ({ error: '#ef4444', success: '#10b981', warn: '#f59e0b' })[t] || '#94a3b8';

// ─── Sub-components ──────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, color = '#e2e8f0' }) => (
  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{sub}</div>
  </div>
);

const SectionHeader = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{children}</div>
);

const Btn = ({ onClick, children, style = {}, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8,
      padding: '8px 16px', cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 600, fontSize: 12, opacity: disabled ? 0.5 : 1, ...style,
    }}
  >{children}</button>
);

const BtnSec = ({ onClick, children, style = {}, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
      padding: '8px 14px', cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 12, opacity: disabled ? 0.5 : 1, ...style,
    }}
  >{children}</button>
);

const Badge = ({ children, color = '#64748b', bg }) => (
  <span style={{
    background: bg || `${color}22`,
    color,
    border: `1px solid ${color}44`,
    borderRadius: 6,
    padding: '2px 7px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.5,
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

// ─── Main Component ──────────────────────────────────────────────────────────
function RevenueManagerPro({ biens = [], reservations = [], mob = false }) {
  // State
  const [tab, setTab] = useState('overview');
  const [selProp, setSelProp] = useState('amaryllis');
  const [recos, setRecos] = useState([]);
  const [signals, setSignals] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calcStatus, setCalcStatus] = useState('idle');
  const [selectedDate, setSelectedDate] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [overrideInput, setOverrideInput] = useState('');
  const [overrideMinStay, setOverrideMinStay] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [logs, setLogs] = useState([]);
  const [dbInitStatus, setDbInitStatus] = useState('unknown');
  const [approveAllStatus, setApproveAllStatus] = useState('idle');
  const [initLoading, setInitLoading] = useState(false);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const csvRef = useRef(null);
  // CSV editor state
  const [csvContent, setCsvContent] = useState('');
  const [csvEditMode, setCsvEditMode] = useState(false);
  const [csvSaving, setCsvSaving] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

  // Filtrer les biens courts termes
  const shortTermBiens = useMemo(() =>
    biens.filter(b => b.type !== 'long'),
    [biens]
  );

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [{ ts: new Date().toISOString(), msg, type }, ...prev].slice(0, 20));
  }, []);

  const apiCall = useCallback(async (url, options = {}) => {
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      addLog(`Erreur: ${e.message}`, 'error');
      return null;
    }
  }, [addLog]);

  // Load recommendations
  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    const from = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const to3m = addDaysStr(from, 90);
    const data = await apiCall(`/api/rm-recommendations?property_id=${selProp}&from=${from}&to=${to3m}`);
    if (data?.recommendations) setRecos(data.recommendations);
    setLoading(false);
  }, [selProp, calMonth, calYear, apiCall]);

  // Load signals
  const loadSignals = useCallback(async () => {
    setSignalsLoading(true);
    const from = new Date().toISOString().slice(0, 10);
    const to = addDaysStr(from, 90);
    const data = await apiCall(`/api/rm-competitors/signals?property_id=${selProp}&from=${from}&to=${to}`);
    if (data?.signals) setSignals(data.signals);
    setSignalsLoading(false);
  }, [selProp, apiCall]);

  // Load competitors
  const loadCompetitors = useCallback(async () => {
    const data = await apiCall(`/api/rm-competitors?property_id=${selProp}`);
    if (data?.competitors) setCompetitors(data.competitors);
  }, [selProp, apiCall]);

  // Load overrides
  const loadOverrides = useCallback(async () => {
    const from = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const to = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${lastDay}`;
    const data = await apiCall(`/api/rm-overrides?property_id=${selProp}&from=${from}&to=${to}`);
    if (data?.overrides) setOverrides(data.overrides);
  }, [selProp, calMonth, calYear, apiCall]);

  // Load rules
  const loadRules = useCallback(async () => {
    const data = await apiCall(`/api/rm-dashboard?property_id=${selProp}`);
    if (data?.rules) setRules(data.rules);
  }, [selProp, apiCall]);

  useEffect(() => {
    if (tab === 'calendar' || tab === 'overview') {
      loadRecommendations();
    }
    if (tab === 'market') {
      loadSignals();
    }
    if (tab === 'competitors') {
      loadCompetitors();
    }
    if (tab === 'rules') {
      loadRules();
    }
    if (tab === 'calendar') {
      loadOverrides();
    }
  }, [selProp, tab, calMonth, calYear]);

  // Calendar days computation
  const calDays = useMemo(() => {
    const days = [];
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const lastDate = new Date(calYear, calMonth + 1, 0).getDate();
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
    for (let d = 1; d <= lastDate; d++) {
      const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const reco = recos.find(r => r.date === ds);
      days.push({ date: ds, day: d, reco });
    }
    return days;
  }, [calYear, calMonth, recos]);

  // Derived KPIs
  const kpis = useMemo(() => {
    const pending = recos.filter(r => r.status === 'pending');
    const alerts = recos.filter(r => r.alert_flags && r.alert_flags.length > 0);
    const opps = recos.filter(r => r.premium_opportunity_score > 60);
    const avgPrice = recos.length > 0
      ? Math.round(recos.reduce((a, r) => a + (r.recommended_price_cents || 0), 0) / recos.length / 100)
      : null;
    return { pending, alerts, opps, avgPrice };
  }, [recos]);

  const topOpps = useMemo(() =>
    [...recos]
      .filter(r => r.premium_opportunity_score > 0)
      .sort((a, b) => (b.premium_opportunity_score || 0) - (a.premium_opportunity_score || 0))
      .slice(0, 5),
    [recos]
  );

  const topRisks = useMemo(() =>
    [...recos]
      .filter(r => r.vacancy_risk_score > 0)
      .sort((a, b) => (b.vacancy_risk_score || 0) - (a.vacancy_risk_score || 0))
      .slice(0, 5),
    [recos]
  );

  // Handlers
  const handleCalculate = useCallback(async () => {
    setCalcStatus('loading');
    addLog(`Recalcul en cours pour ${selProp}…`);
    const res = await apiCall('/api/rm-recommendations/calculate', {
      method: 'POST',
      body: JSON.stringify({ property_id: selProp }),
    });
    if (res?.ok) {
      setCalcStatus('ok');
      addLog(`✓ Recalcul terminé (${res.count || '?'} dates)`, 'success');
      loadRecommendations();
    } else {
      setCalcStatus('error');
      addLog('Erreur lors du recalcul', 'error');
    }
    setTimeout(() => setCalcStatus('idle'), 3000);
  }, [selProp, apiCall, addLog, loadRecommendations]);

  const handleApproveAll = useCallback(async () => {
    setApproveAllStatus('loading');
    const pending = recos.filter(r => r.status === 'pending');
    addLog(`Approbation de ${pending.length} dates…`);
    let ok = 0;
    for (const r of pending) {
      const res = await apiCall('/api/rm-recommendations/approve', {
        method: 'POST',
        body: JSON.stringify({ property_id: selProp, date: r.date }),
      });
      if (res?.ok) ok++;
    }
    addLog(`✓ ${ok}/${pending.length} dates approuvées`, 'success');
    setApproveAllStatus('ok');
    loadRecommendations();
    setTimeout(() => setApproveAllStatus('idle'), 3000);
  }, [recos, selProp, apiCall, addLog, loadRecommendations]);

  const handleApproveDate = useCallback(async (date, priceOverride, minStayOverride, reason) => {
    const body = { property_id: selProp, date };
    if (priceOverride) body.price_override = Math.round(parseFloat(priceOverride) * 100);
    if (minStayOverride) body.min_stay_override = parseInt(minStayOverride);
    if (reason) body.reason = reason;
    const res = await apiCall('/api/rm-recommendations/approve', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res?.ok) {
      addLog(`✓ ${date} approuvé`, 'success');
      loadRecommendations();
      setSelectedDate(null);
    }
  }, [selProp, apiCall, addLog, loadRecommendations]);

  const handleRejectDate = useCallback(async (date) => {
    const res = await apiCall('/api/rm-recommendations/reject', {
      method: 'POST',
      body: JSON.stringify({ property_id: selProp, date, reason: overrideReason }),
    });
    if (res?.ok) {
      addLog(`✗ ${date} rejeté`, 'warn');
      loadRecommendations();
      setSelectedDate(null);
    }
  }, [selProp, apiCall, addLog, loadRecommendations, overrideReason]);

  const handleDeleteOverride = useCallback(async (id) => {
    const res = await apiCall(`/api/rm-overrides?id=${id}`, { method: 'DELETE' });
    if (res?.ok) {
      addLog(`Override supprimé`, 'info');
      loadOverrides();
    }
  }, [apiCall, addLog, loadOverrides]);

  const handleDbInit = useCallback(async () => {
    setInitLoading(true);
    addLog('Initialisation de la base de données…');
    const res = await apiCall('/api/rm-init', { method: 'POST' });
    if (res?.ok) {
      setDbInitStatus('ok');
      addLog('✓ Base initialisée avec succès', 'success');
    } else {
      setDbInitStatus('error');
    }
    setInitLoading(false);
  }, [apiCall, addLog]);

  const handleScrape = useCallback(async () => {
    setScrapeLoading(true);
    addLog('Lancement du scraping Apify…');
    const res = await apiCall('/api/rm-scrape', { method: 'POST' });
    if (res?.ok) {
      addLog(`✓ Scraping lancé (run: ${res.run_id || '?'})`, 'success');
    } else {
      addLog('Erreur lors du lancement du scraping', 'error');
    }
    setScrapeLoading(false);
  }, [apiCall, addLog]);

  const handleRecalcSignals = useCallback(async () => {
    addLog('Recalcul des signaux marché…');
    const res = await apiCall('/api/rm-competitors/recalculate-signals', {
      method: 'POST',
      body: JSON.stringify({ property_id: selProp }),
    });
    if (res?.ok) {
      addLog('✓ Signaux recalculés', 'success');
      loadSignals();
    }
  }, [selProp, apiCall, addLog, loadSignals]);

  const handleCSVImport = useCallback(async (file) => {
    const text = await file.text();
    const lines = text.split('\n').slice(1);
    const snapshots = lines
      .filter(l => l.trim())
      .map(line => {
        const [listing_id, date, price_eur, is_available] = line.split(',').map(s => s.trim());
        return {
          listing_id,
          date,
          price_cents: price_eur ? Math.round(parseFloat(price_eur) * 100) : null,
          is_available: parseInt(is_available),
          source: 'csv',
        };
      })
      .filter(s => s.listing_id && s.date);

    addLog(`Import CSV: ${snapshots.length} entrées détectées`);
    const result = await apiCall('/api/rm-competitors/snapshot', {
      method: 'POST',
      body: JSON.stringify({ property_id: selProp, snapshots }),
    });
    if (result?.ok) {
      addLog(`✓ ${result.inserted} snapshots importés`, 'success');
      await apiCall('/api/rm-competitors/recalculate-signals', {
        method: 'POST',
        body: JSON.stringify({ property_id: selProp }),
      });
      addLog('✓ Signaux marché recalculés', 'success');
      loadCompetitors();
    }
  }, [selProp, apiCall, addLog, loadCompetitors]);

  // ── CSV editor handlers ──────────────────────────────────────────────────

  const loadCSVFromFile = useCallback(async (propId) => {
    setCsvLoading(true);
    try {
      const res = await fetch(`/competitors/${propId || selProp}.csv`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setCsvContent(text);
      addLog(`CSV chargé depuis /competitors/${propId || selProp}.csv`, 'info');
    } catch (e) {
      addLog(`Erreur chargement CSV : ${e.message}`, 'error');
    } finally {
      setCsvLoading(false);
    }
  }, [selProp, addLog]);

  const handleSaveCSV = useCallback(async () => {
    if (!csvContent.trim()) return;
    setCsvSaving(true);
    try {
      const res = await apiCall('/api/rm-competitors/import-listings', {
        method: 'POST',
        body: JSON.stringify({ property_id: selProp, csv_content: csvContent }),
      });
      if (res?.ok) {
        addLog(`✓ ${res.imported} concurrents importés depuis CSV`, 'success');
        loadCompetitors();
      } else {
        addLog(`Erreur import : ${res?.error || 'inconnue'}`, 'error');
      }
    } catch (e) {
      addLog(`Erreur : ${e.message}`, 'error');
    } finally {
      setCsvSaving(false);
    }
  }, [selProp, csvContent, apiCall, addLog, loadCompetitors]);

  const handleDownloadCSV = useCallback(async () => {
    const url = `/api/rm-competitors/export?property_id=${selProp}`;
    const res = await fetch(url);
    if (!res.ok) { addLog('Erreur export CSV', 'error'); return; }
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selProp}-competitors.csv`;
    a.click();
    addLog(`CSV exporté : ${selProp}-competitors.csv`, 'success');
  }, [selProp, addLog]);

  const handleRecalcAllBiens = useCallback(async () => {
    addLog(`Recalcul pour ${shortTermBiens.length} biens…`);
    for (const b of shortTermBiens) {
      const res = await apiCall('/api/rm-recommendations/calculate', {
        method: 'POST',
        body: JSON.stringify({ property_id: b.id || b.slug || b.name }),
      });
      addLog(res?.ok ? `✓ ${b.name || b.id}` : `✗ ${b.name || b.id}`, res?.ok ? 'success' : 'error');
    }
    addLog('Recalcul global terminé', 'success');
  }, [shortTermBiens, apiCall, addLog]);

  // Month navigation
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const selectedReco = recos.find(r => r.date === selectedDate);

  // Tabs config
  const tabs = [
    { id: 'overview', label: mob ? '📊' : '📊 Vue d\'ensemble' },
    { id: 'calendar', label: mob ? '📅' : '📅 Calendrier' },
    { id: 'market', label: mob ? '🎯' : '🎯 Marché' },
    { id: 'competitors', label: mob ? '🏢' : '🏢 Concurrents' },
    { id: 'rules', label: mob ? '⚙️' : '⚙️ Règles' },
    { id: 'sync', label: mob ? '🔄' : '🔄 Sync' },
  ];

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: '7px 12px',
    color: '#e2e8f0',
    fontSize: 12,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>

      {/* Property selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {shortTermBiens.length === 0
          ? ['amaryllis', 'diamant', 'explorer'].map(p => (
            <button
              key={p}
              onClick={() => setSelProp(p)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: selProp === p ? '#0ea5e9' : 'rgba(255,255,255,0.06)',
                color: selProp === p ? '#fff' : '#94a3b8',
                border: selProp === p ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
            >{p}</button>
          ))
          : shortTermBiens.map(b => {
            const pid = b.id || b.slug || b.nom || b.name;
            return (
              <button
                key={pid}
                onClick={() => setSelProp(pid)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: selProp === pid ? '#0ea5e9' : 'rgba(255,255,255,0.06)',
                  color: selProp === pid ? '#fff' : '#94a3b8',
                  border: selProp === pid ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
              >{b.nom || b.name || pid}</button>
            );
          })
        }
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: mob ? 11 : 12, fontWeight: 600, cursor: 'pointer',
              background: tab === t.id ? '#0ea5e9' : 'transparent',
              color: tab === t.id ? '#fff' : '#64748b',
              border: 'none',
              transition: 'all 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <Btn onClick={handleCalculate} disabled={calcStatus === 'loading'}>
              {calcStatus === 'loading' ? '⏳ Calcul…' : calcStatus === 'ok' ? '✓ Calculé' : '🔄 Recalculer maintenant'}
            </Btn>
            <Btn
              onClick={handleApproveAll}
              disabled={approveAllStatus === 'loading' || kpis.pending.length === 0}
              style={{ background: '#10b981' }}
            >
              {approveAllStatus === 'loading' ? '⏳ Approbation…' : `✓ Approuver tout en attente (${kpis.pending.length})`}
            </Btn>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {loading ? (
              <>
                <LoadingPlaceholder height={80} />
                <LoadingPlaceholder height={80} />
                <LoadingPlaceholder height={80} />
                <LoadingPlaceholder height={80} />
              </>
            ) : (
              <>
                <KPICard label="Prix moyen reco" value={kpis.avgPrice ? `${kpis.avgPrice}€` : '—'} sub="30 prochains jours" color="#0ea5e9" />
                <KPICard label="Dates en attente" value={kpis.pending.length} sub="à approuver" color="#f59e0b" />
                <KPICard label="Alertes actives" value={kpis.alerts.length} sub="dates avec signaux" color="#ef4444" />
                <KPICard label="Opportunités" value={kpis.opps.length} sub="hausses possibles" color="#10b981" />
              </>
            )}
          </div>

          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 16 }}>
            {/* Top Opportunities */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
              <SectionHeader>💰 Top 5 Opportunités de hausse</SectionHeader>
              {loading ? <LoadingPlaceholder height={120} /> :
                topOpps.length === 0
                  ? <div style={{ color: '#64748b', fontSize: 12 }}>Aucune opportunité détectée</div>
                  : topOpps.map(r => (
                    <div key={r.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{fmtDate(r.date)}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{r.season_type || '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>{fmt(r.recommended_price_cents)}</div>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <Badge color="#10b981">+{Math.round(r.premium_opportunity_score)}%</Badge>
                          <Badge color={statusDot(r.status)}>{r.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>

            {/* Top Risks */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
              <SectionHeader>🔴 Top 5 Risques vacance</SectionHeader>
              {loading ? <LoadingPlaceholder height={120} /> :
                topRisks.length === 0
                  ? <div style={{ color: '#64748b', fontSize: 12 }}>Aucun risque détecté</div>
                  : topRisks.map(r => (
                    <div key={r.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{fmtDate(r.date)}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{r.season_type || '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>{fmt(r.recommended_price_cents)}</div>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <Badge color="#ef4444">Risque {Math.round(r.vacancy_risk_score)}%</Badge>
                          <Badge color={statusDot(r.status)}>{r.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── CALENDAR ─────────────────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedDate && !mob ? '1fr 340px' : '1fr', gap: 16 }}>
          {/* Calendar */}
          <div>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>‹</button>
              <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#e2e8f0', textTransform: 'capitalize' }}>{monthLabel}</div>
              <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#64748b', fontWeight: 700, padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            {loading
              ? <LoadingPlaceholder height={300} />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {calDays.map((cell, i) => {
                    if (!cell) return <div key={`empty-${i}`} />;
                    const { date, day, reco } = cell;
                    const isSelected = selectedDate === date;
                    const flags = reco?.alert_flags ? (typeof reco.alert_flags === 'string' ? JSON.parse(reco.alert_flags) : reco.alert_flags) : [];
                    return (
                      <div
                        key={date}
                        onClick={() => { setSelectedDate(isSelected ? null : date); setOverrideInput(''); setOverrideMinStay(''); setOverrideReason(''); }}
                        style={{
                          background: isSelected ? '#0ea5e920' : (reco ? seasonColor(reco.season_type) : 'rgba(255,255,255,0.02)'),
                          border: isSelected ? '2px solid #0ea5e9' : `1px solid ${reco ? seasonBorder(reco.season_type) : 'rgba(255,255,255,0.07)'}`,
                          borderRadius: 8,
                          padding: '6px 4px',
                          cursor: 'pointer',
                          minHeight: 64,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{day}</div>
                        {reco && (
                          <>
                            <div style={{ fontSize: mob ? 9 : 11, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{fmt(reco.recommended_price_cents)}</div>
                            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusDot(reco.status), display: 'inline-block' }} title={reco.status} />
                              {flags.map(f => (
                                <span key={f} style={{ fontSize: 9 }} title={f}>{alertIcon(f)}</span>
                              ))}
                            </div>
                            {reco.min_stay_recommendation > 1 && (
                              <div style={{ fontSize: 8, color: '#64748b' }}>{reco.min_stay_recommendation}n min</div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            }

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
              {[['peak', 'Haute saison', '#ef4444'], ['high', 'Haute', '#f59e0b'], ['mid', 'Moyenne', '#0ea5e9'], ['low', 'Basse', '#10b981']].map(([type, label, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748b' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: seasonColor(type), border: `1px solid ${seasonBorder(type)}` }} />
                  {label}
                </div>
              ))}
              {[['pending', '#f59e0b', 'En attente'], ['approved', '#10b981', 'Approuvé'], ['overridden', '#a855f7', 'Modifié']].map(([s, c, l]) => (
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

              {/* Price breakdown */}
              <div style={{ marginBottom: 14 }}>
                <SectionHeader>Prix recommandé</SectionHeader>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0ea5e9', fontFamily: 'monospace', marginBottom: 4 }}>
                  {fmt(selectedReco.recommended_price_cents)}
                </div>
                {selectedReco.base_price_cents && (
                  <div style={{ fontSize: 11, color: '#64748b' }}>Base: {fmt(selectedReco.base_price_cents)}</div>
                )}
                {selectedReco.final_price_cents && selectedReco.final_price_cents !== selectedReco.recommended_price_cents && (
                  <div style={{ fontSize: 11, color: '#a855f7' }}>Final: {fmt(selectedReco.final_price_cents)}</div>
                )}
                <Badge color={statusDot(selectedReco.status)} style={{ marginTop: 6 }}>{selectedReco.status}</Badge>
              </div>

              {/* Scores */}
              <div style={{ marginBottom: 14 }}>
                <SectionHeader>Scores</SectionHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ProgressBar
                    value={selectedReco.confidence_score || 0}
                    max={100}
                    color={confidenceColor(selectedReco.confidence_score || 0)}
                    label="Confiance"
                  />
                  <ProgressBar
                    value={selectedReco.vacancy_risk_score || 0}
                    max={100}
                    color="#ef4444"
                    label="Risque vacance"
                  />
                  <ProgressBar
                    value={selectedReco.premium_opportunity_score || 0}
                    max={100}
                    color="#10b981"
                    label="Opportunité premium"
                  />
                </div>
              </div>

              {/* Alert flags */}
              {(() => {
                const flags = selectedReco.alert_flags
                  ? (typeof selectedReco.alert_flags === 'string' ? JSON.parse(selectedReco.alert_flags) : selectedReco.alert_flags)
                  : [];
                return flags.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <SectionHeader>Alertes</SectionHeader>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {flags.map(f => (
                        <Badge key={f} color="#f59e0b">{alertIcon(f)} {f.replace(/_/g, ' ')}</Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Min stay */}
              {selectedReco.min_stay_recommendation && (
                <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(14,165,233,0.08)', borderRadius: 8, border: '1px solid rgba(14,165,233,0.2)' }}>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Séjour minimum recommandé</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0ea5e9' }}>{selectedReco.min_stay_recommendation} nuits</div>
                </div>
              )}

              {/* Factors */}
              {selectedReco.factors_json && (() => {
                try {
                  const factors = typeof selectedReco.factors_json === 'string'
                    ? JSON.parse(selectedReco.factors_json)
                    : selectedReco.factors_json;
                  return (
                    <div style={{ marginBottom: 14 }}>
                      <SectionHeader>Facteurs de prix</SectionHeader>
                      {Object.entries(factors).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ color: '#94a3b8' }}>{k.replace(/_/g, ' ')}</span>
                          <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{typeof v === 'number' ? (v > 100 ? `${v}€` : `×${v}`) : v}</span>
                        </div>
                      ))}
                    </div>
                  );
                } catch { return null; }
              })()}

              {/* Override inputs */}
              <div style={{ marginBottom: 12 }}>
                <SectionHeader>Override manuel</SectionHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    style={inputStyle}
                    placeholder="Prix override (€)"
                    value={overrideInput}
                    onChange={e => setOverrideInput(e.target.value)}
                    type="number"
                    min="0"
                  />
                  <input
                    style={inputStyle}
                    placeholder="Min stay override (nuits)"
                    value={overrideMinStay}
                    onChange={e => setOverrideMinStay(e.target.value)}
                    type="number"
                    min="1"
                  />
                  <input
                    style={inputStyle}
                    placeholder="Raison (optionnel)"
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Btn onClick={() => handleApproveDate(selectedDate, overrideInput, overrideMinStay, overrideReason)} style={{ background: '#10b981' }}>
                  ✓ Approuver {overrideInput ? `à ${overrideInput}€` : ''}
                </Btn>
                <BtnSec onClick={() => handleRejectDate(selectedDate)}>
                  ✗ Refuser
                </BtnSec>
              </div>
            </div>
          )}
          {selectedDate && !selectedReco && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, color: '#64748b', fontSize: 12 }}>
              Pas de recommandation pour ce jour.
              <div style={{ marginTop: 8 }}>
                <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontSize: 12 }}>Fermer</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MARKET ───────────────────────────────────────────────────────── */}
      {tab === 'market' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <Btn onClick={handleRecalcSignals}>🔄 Recalculer signaux</Btn>
          </div>

          {signalsLoading ? (
            <>
              <LoadingPlaceholder height={200} />
              <LoadingPlaceholder height={140} />
            </>
          ) : signals.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748b' }}>
              Aucun signal marché disponible. Importez des snapshots concurrents ou déclenchez un scraping.
            </div>
          ) : (
            <>
              {/* Price comparison chart */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <SectionHeader>Prix reco vs Médiane marché (90 jours)</SectionHeader>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={signals.slice(0, 90)} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={d => d?.slice(5)} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => `${v}€`} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(v, n) => [`${Math.round(v)}€`, n === 'our_price' ? 'Notre prix' : 'Marché médian']}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#64748b' }} />
                    <Bar dataKey="our_recommended_price_eur" name="Notre prix" fill="#0ea5e9" opacity={0.8} radius={[2, 2, 0, 0]} />
                    <Line dataKey="market_median_price_eur" name="Marché médian" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Market pressure chart */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <SectionHeader>Pression marché</SectionHeader>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={signals.slice(0, 90)} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={d => d?.slice(5)} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                      formatter={(v) => [`${Math.round(v)}%`, 'Pression marché']}
                    />
                    <Line dataKey="market_pressure_score" stroke="#a855f7" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Signals table */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
                <SectionHeader>Détail des signaux marché</SectionHeader>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ color: '#64748b', textAlign: 'left' }}>
                        {['Date', 'Notre prix', 'Médian marché', 'Positionnement', 'Dispo marché', 'Label marché', 'Confiance'].map(h => (
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
                            <td style={{ padding: '6px 8px' }}>
                              {s.our_positioning && <Badge color={posColor}>{s.our_positioning}</Badge>}
                            </td>
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
                              {s.market_label && <Badge color="#94a3b8">{s.market_label}</Badge>}
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              {s.data_confidence != null && (
                                <span style={{ color: confidenceColor(s.data_confidence * 100) }}>{Math.round(s.data_confidence * 100)}%</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── COMPETITORS ──────────────────────────────────────────────────── */}
      {tab === 'competitors' && (
        <div>
          {/* ── Actions bar ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <Btn
              onClick={() => { setCsvEditMode(true); loadCSVFromFile(selProp); }}
              disabled={csvLoading}
            >
              {csvLoading ? '⏳ Chargement…' : '📋 Éditer le CSV'}
            </Btn>
            <BtnSec onClick={handleDownloadCSV}>⬇️ Télécharger CSV</BtnSec>
            <BtnSec onClick={handleScrape} disabled={scrapeLoading}>
              {scrapeLoading ? '⏳ Lancement…' : '🕷️ Scraping Airbnb'}
            </BtnSec>
            <BtnSec onClick={() => {
              apiCall('/api/rm-competitors/recalculate-signals', {
                method: 'POST', body: JSON.stringify({ property_id: selProp }),
              }).then(r => r?.ok && addLog('✓ Signaux recalculés', 'success'));
            }}>🔄 Recalculer signaux</BtnSec>
          </div>

          {/* ── CSV Editor ── */}
          {csvEditMode && (
            <div style={{ marginBottom: 20, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 13 }}>✏️ Éditeur CSV — {selProp}</span>
                  <span style={{ marginLeft: 10, fontSize: 10, color: '#64748b' }}>
                    Une ligne = un concurrent. Lignes commençant par # ignorées.
                  </span>
                </div>
                <button onClick={() => setCsvEditMode(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
              <textarea
                value={csvContent}
                onChange={e => setCsvContent(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%', height: 280, fontFamily: 'monospace', fontSize: 11,
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#e2e8f0', padding: 12, resize: 'vertical',
                  lineHeight: 1.5, boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                <Btn onClick={handleSaveCSV} disabled={csvSaving}>
                  {csvSaving ? '⏳ Enregistrement…' : '💾 Sauvegarder dans la DB'}
                </Btn>
                <BtnSec onClick={() => loadCSVFromFile(selProp)} disabled={csvLoading}>
                  ↺ Recharger le fichier
                </BtnSec>
                <span style={{ fontSize: 10, color: '#475569', marginLeft: 'auto' }}>
                  Format : listing_id, name, platform, capacity, bedrooms, bathrooms, has_pool, has_sea_view, area_km, standing, notes
                </span>
              </div>
            </div>
          )}

          {/* ── Competitors list ── */}
          {competitors.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
              <div style={{ marginBottom: 8 }}>Aucun concurrent chargé pour <strong style={{ color: '#e2e8f0' }}>{selProp}</strong></div>
              <div style={{ fontSize: 11 }}>Cliquez sur <em>"Éditer le CSV"</em> puis <em>"Sauvegarder dans la DB"</em></div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                {competitors.length} concurrent{competitors.length > 1 ? 's' : ''} chargé{competitors.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {competitors.map((c, i) => (
                  <div key={c.listing_id || i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name || `Concurrent ${c.listing_id}`}
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>
                          ID: {c.listing_id}
                        </div>
                      </div>
                      <Badge color={simColor(c.similarity_score || 0)}>{c.similarity_score || '?'}%</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                      {c.capacity > 0 && <Badge color="#94a3b8">👥 {c.capacity}</Badge>}
                      {c.bedrooms > 0 && <Badge color="#64748b">🛏 {c.bedrooms}</Badge>}
                      {c.has_pool === 1 && <Badge color="#0ea5e9">🏊</Badge>}
                      {c.has_sea_view === 1 && <Badge color="#06b6d4">🌊</Badge>}
                      {c.standing && <Badge color={c.standing === 'premium' ? '#f59e0b' : '#64748b'}>{c.standing}</Badge>}
                      {c.platform && <Badge color="#8b5cf6">{c.platform}</Badge>}
                    </div>
                    {c.area_km > 0 && (
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>📍 {c.area_km} km</div>
                    )}
                    {c.avg_price_eur != null && (
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                        Prix moyen : <span style={{ color: '#e2e8f0', fontWeight: 700, fontFamily: 'monospace' }}>{Math.round(c.avg_price_eur)}€</span>
                      </div>
                    )}
                    {c.notes && (
                      <div style={{ fontSize: 10, color: '#475569', marginBottom: 6, fontStyle: 'italic' }}>{c.notes}</div>
                    )}
                    <a
                      href={c.url || `https://www.airbnb.com/rooms/${c.listing_id}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 10, color: '#0ea5e9', textDecoration: 'none' }}
                    >
                      Voir l'annonce →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RULES ────────────────────────────────────────────────────────── */}
      {tab === 'rules' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Btn onClick={handleCalculate}>🔄 Recalculer après changement</Btn>
          </div>

          {rules.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748b' }}>
              Aucune règle configurée pour ce bien. Les règles sont définies côté serveur dans la base Revenue Manager.
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
                      {rule.priority && <span style={{ fontSize: 11, color: '#64748b' }}>Priorité: {rule.priority}</span>}
                      {rule.min_advance_days && <span style={{ fontSize: 11, color: '#64748b' }}>Min J-{rule.min_advance_days}</span>}
                    </div>
                    {rule.conditions_json && (() => {
                      try {
                        const conds = typeof rule.conditions_json === 'string' ? JSON.parse(rule.conditions_json) : rule.conditions_json;
                        return (
                          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {Object.entries(conds).map(([k, v]) => (
                              <Badge key={k} color="#475569">{k}: {String(v)}</Badge>
                            ))}
                          </div>
                        );
                      } catch { return null; }
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                    <button
                      onClick={async () => {
                        const res = await apiCall(`/api/rm-rules/${rule.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ is_active: !rule.is_active }),
                        });
                        if (res?.ok) {
                          addLog(`Règle "${rule.name}" ${rule.is_active ? 'désactivée' : 'activée'}`, 'info');
                          loadRules();
                        }
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: rule.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: rule.is_active ? '#ef4444' : '#10b981',
                        border: `1px solid ${rule.is_active ? '#ef444440' : '#10b98140'}`,
                      }}
                    >
                      {rule.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SYNC ─────────────────────────────────────────────────────────── */}
      {tab === 'sync' && (
        <div>
          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {/* DB Init */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
              <SectionHeader>🗄️ Base de données</SectionHeader>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Initialise les tables Revenue Manager (schéma, seeds de règles de base).
                {dbInitStatus === 'ok' && <span style={{ color: '#10b981', marginLeft: 6 }}>✓ Initialisée</span>}
                {dbInitStatus === 'error' && <span style={{ color: '#ef4444', marginLeft: 6 }}>✗ Erreur</span>}
              </div>
              <Btn onClick={handleDbInit} disabled={initLoading}>
                {initLoading ? '⏳ Initialisation…' : '🔧 Initialiser la base'}
              </Btn>
            </div>

            {/* Recalc all */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
              <SectionHeader>🔄 Recalcul global</SectionHeader>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Recalcule les recommandations pour tous les biens court terme ({shortTermBiens.length} bien{shortTermBiens.length !== 1 ? 's' : ''}).
              </div>
              <Btn onClick={handleRecalcAllBiens} style={{ background: '#8b5cf6' }}>
                ♻️ Recalculer tous les biens
              </Btn>
            </div>

            {/* Scraping */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
              <SectionHeader>🕷️ Scraping Apify</SectionHeader>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Lance un run Apify pour scraper les prix concurrents sur Airbnb/Booking.
              </div>
              <Btn onClick={handleScrape} disabled={scrapeLoading} style={{ background: '#f59e0b' }}>
                {scrapeLoading ? '⏳ Lancement…' : '🚀 Scraper les concurrents'}
              </Btn>
            </div>
          </div>

          {/* Logs */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <SectionHeader>📋 Journal des opérations</SectionHeader>
              <BtnSec onClick={() => setLogs([])} style={{ padding: '4px 10px', fontSize: 10 }}>Effacer</BtnSec>
            </div>
            {logs.length === 0 ? (
              <div style={{ color: '#475569', fontSize: 11, fontStyle: 'italic' }}>Aucune opération effectuée dans cette session.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: 11 }}>
                {logs.map((log, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, borderLeft: `3px solid ${logColor(log.type)}` }}>
                    <span style={{ color: '#475569', whiteSpace: 'nowrap', fontSize: 10 }}>
                      {new Date(log.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span style={{ color: logColor(log.type) }}>{log.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RevenueManagerPro;
