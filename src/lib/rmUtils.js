/**
 * Revenue Manager Utilities
 */

export const fmt = (cents) => {
  if (cents == null) return '—';
  return `${Math.round(cents / 100).toLocaleString('fr-FR')}€`;
};

export const fmtEuro = (euros) => {
  if (euros == null) return '—';
  return `${Math.round(euros).toLocaleString('fr-FR')}€`;
};

export const dateRange = (start, end) => {
  const dates = [];
  const cur = new Date(start + 'T12:00:00Z');
  const endDate = new Date(end + 'T12:00:00Z');
  while (cur <= endDate) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const addDaysStr = (dateStr, n) => {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const diffDays = (a, b) =>
  Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000);

export const dowLabel = (dateStr) => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[new Date(dateStr + 'T12:00:00Z').getDay()];
};

export const monthLabel = (dateStr) => {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  return months[parseInt(dateStr.slice(5, 7)) - 1];
};

export const confidenceColor = (score) => {
  if (score >= 75) return '#10b981';
  if (score >= 55) return '#f59e0b';
  return '#ef4444';
};

export const confidenceLabel = (score) => {
  if (score >= 75) return 'Forte';
  if (score >= 55) return 'Moyenne';
  return 'Faible';
};

export const alertColor = (flag) => {
  const colors = {
    vacancy_danger: '#ef4444',
    vacancy_warning: '#f59e0b',
    premium_opportunity: '#10b981',
    gap_detected: '#3b82f6',
    manual_override_active: '#a855f7',
    high_demand: '#10b981',
    oversupply: '#f59e0b',
  };
  return colors[flag] || '#64748b';
};

export const alertLabel = (flag) => {
  const labels = {
    vacancy_danger: '🔴 Risque vacance élevé',
    vacancy_warning: '🟡 Risque vacance modéré',
    premium_opportunity: '🟢 Opportunité de hausse',
    gap_detected: '🔵 Trou invendable détecté',
    manual_override_active: '🟣 Override manuel actif',
    high_demand: '📈 Forte demande marché',
    oversupply: '📉 Marché faible',
  };
  return labels[flag] || flag;
};

export const seasonColor = (type) => {
  const colors = { peak: '#ef4444', high: '#f59e0b', mid: '#0ea5e9', low: '#10b981' };
  return colors[type] || '#64748b';
};

export const seasonLabel = (type) => {
  const labels = { peak: 'Pic', high: 'Haute', mid: 'Moy.', low: 'Basse' };
  return labels[type] || type;
};

export const statusColor = (status) => {
  const colors = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    overridden: '#a855f7',
    published: '#0ea5e9',
    expired: '#475569',
  };
  return colors[status] || '#64748b';
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};

export const groupByMonth = (recommendations) => {
  const groups = {};
  recommendations.forEach(r => {
    const month = r.date.slice(0, 7); // 'YYYY-MM'
    if (!groups[month]) groups[month] = [];
    groups[month].push(r);
  });
  return groups;
};

export const computeKPIs = (recommendations, publishedRates) => {
  const approved = recommendations.filter(r => r.status === 'approved' || r.status === 'published');
  const pending = recommendations.filter(r => r.status === 'pending');
  const withAlerts = recommendations.filter(r => {
    try {
      const flags = JSON.parse(r.alert_flags || '[]');
      return flags.some(f => f.includes('vacancy') || f === 'premium_opportunity');
    } catch { return false; }
  });

  const avgReco = recommendations.length > 0
    ? Math.round(recommendations.reduce((s, r) => s + r.recommended_price_cents, 0) / recommendations.length)
    : 0;

  return {
    totalDates: recommendations.length,
    pendingCount: pending.length,
    approvedCount: approved.length,
    alertCount: withAlerts.length,
    avgRecoPriceCents: avgReco,
    opportunityCount: recommendations.filter(r => {
      try { return JSON.parse(r.alert_flags || '[]').includes('premium_opportunity'); } catch { return false; }
    }).length,
    vacancyRiskCount: recommendations.filter(r => r.vacancy_risk_score >= 50).length,
  };
};
