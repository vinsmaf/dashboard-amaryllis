import { useState, useEffect } from 'react';
import TvScreen from './TvScreen.jsx';
import { parseTvParams, buildSlides } from './utils/tvScreen.js';

/* ─── Palette par logement ─────────────────────────────────────── */
const PROP_COLORS = {
  amaryllis:  { dark: '#0e3d2a', mid: '#10b981', light: '#d1fae5' },
  zandoli:    { dark: '#0f2d4a', mid: '#0ea5e9', light: '#e0f2fe' },
  geko:       { dark: '#2a1545', mid: '#a855f7', light: '#ede9fe' },
  mabouya:    { dark: '#0f2d1a', mid: '#22c55e', light: '#dcfce7' },
  schoelcher: { dark: '#0f2440', mid: '#38bdf8', light: '#e0f2fe' },
  nogent:     { dark: '#2d1e0e', mid: '#f59e0b', light: '#fef3c7' },
  iguana:     { dark: '#0e2d20', mid: '#34d399', light: '#d1fae5' },
};

/* ─── Petit composant copy ─────────────────────────────────────── */
function CopyBtn({ value, label, accent }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      style={{
        background: copied ? accent + '33' : 'rgba(255,255,255,0.12)',
        border: `1px solid ${copied ? accent + '66' : 'rgba(255,255,255,0.2)'}`,
        borderRadius: 7, padding: '5px 11px', color: copied ? accent : '#fff',
        fontSize: 11, cursor: 'pointer', fontWeight: 700, transition: 'all .2s', flexShrink: 0,
      }}>{copied ? '✓ Copié !' : `📋 ${label || 'Copier'}`}</button>
  );
}

/* ─── Case à cocher ────────────────────────────────────────────── */
function CheckItem({ text, accent }) {
  const [done, setDone] = useState(false);
  return (
    <div onClick={() => setDone(d => !d)} style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
      opacity: done ? 0.45 : 1, transition: 'opacity .2s',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
        background: done ? accent : 'transparent',
        border: `2px solid ${done ? accent : 'rgba(255,255,255,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s',
      }}>
        {done && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>}
      </div>
      <span style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.55, textDecoration: done ? 'line-through' : 'none' }}>{text}</span>
    </div>
  );
}

/* ─── Carte de section ─────────────────────────────────────────── */
function Section({ section, accent, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  const body = () => {
    switch (section.type) {
      case 'info':
        return (
          <div>
            {(section.items || []).map((item, i) => (
              <div key={i} style={{ padding: '9px 0', borderBottom: i < section.items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.55 }}>{item.value}</div>
              </div>
            ))}
          </div>
        );
      case 'list':
        return (
          <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(section.items || []).map((item, i) => (
              <li key={i} style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.55 }}>{item}</li>
            ))}
          </ul>
        );
      case 'checklist':
        return (
          <div>
            {(section.items || []).map((item, i) => <CheckItem key={i} text={item} accent={accent} />)}
            <div style={{ marginTop: 10, fontSize: 11, color: '#475569', fontStyle: 'italic' }}>Appuyez pour cocher chaque étape</div>
          </div>
        );
      case 'picks':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {(section.items || []).map((item, i) => (
              <div key={i} style={{ padding: '11px 0', borderBottom: i < section.items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 15 }}>{item.icon || '📍'}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.name}</span>
                  {item.distance && <span style={{ fontSize: 11, color: accent, fontWeight: 600, background: accent + '22', borderRadius: 4, padding: '1px 6px' }}>{item.distance}</span>}
                </div>
                {item.note && <div style={{ fontSize: 13, color: '#94a3b8', paddingLeft: 23, lineHeight: 1.5 }}>{item.note}</div>}
              </div>
            ))}
          </div>
        );
      case 'steps':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {(section.items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < section.items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: accent + '33', border: `2px solid ${accent}`, color: accent, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <div>
                  {item.label && <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 2 }}>{item.label}</div>}
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.55 }}>{item.value || item}</div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'text':
      default:
        return <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1', lineHeight: 1.75 }}>{section.content}</p>;
    }
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{section.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{section.title}</span>
        </div>
        <span style={{ color: '#475569', fontSize: 18, transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none' }}>›</span>
      </div>
      {open && <div style={{ padding: '0 16px 16px' }}>{body()}</div>}
    </div>
  );
}

/* ─── Page principale ──────────────────────────────────────────── */
export default function GuestGuide() {
  const propertyId = window.location.pathname.split('/bienvenue/')[1]?.replace(/\/$/, '') || 'amaryllis';
  const tvParams = parseTvParams(window.location.search);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoCtx, setAutoCtx] = useState(null); // contexte séjour auto (mode TV)

  const colors = PROP_COLORS[propertyId] || PROP_COLORS.amaryllis;
  const { dark, mid: accent } = colors;

  useEffect(() => {
    fetch(`/api/guides?property_id=${propertyId}`)
      .then(r => r.json())
      .then(d => { if (d.guide) setGuide(d.guide); else setError('Guide non disponible'); })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [propertyId]);

  // Mode TV sans prénom explicite → récupère la résa en cours (dates + prénom si dispo).
  useEffect(() => {
    if (!tvParams.tv || tvParams.guest) return;
    fetch(`/api/tv-context?p=${propertyId}`)
      .then(r => r.json())
      .then(d => { if (d && (d.guest || d.du)) setAutoCtx(d); })
      .catch(() => {});
  }, [propertyId, tvParams.tv, tvParams.guest]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 16, opacity: .7 }}>Chargement du guide…</div>
    </div>
  );

  if (error || !guide) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24 }}>
      <div style={{ fontSize: 52 }}>🏠</div>
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Guide non disponible</div>
      <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>{error}</div>
    </div>
  );

  if (tvParams.tv) {
    // L'URL prime ; sinon on complète avec la résa en cours (auto).
    const tvMerged = {
      ...tvParams,
      guest: tvParams.guest || autoCtx?.guest || null,
      du: tvParams.du || autoCtx?.du || null,
      au: tvParams.au || autoCtx?.au || null,
    };
    return <TvScreen slides={buildSlides(guide, tvMerged)} colors={colors} pid={propertyId} />;
  }

  const pageUrl = window.location.href;

  /* sépare contacts d'urgence */
  const emergencyNumbers = ['15', '17', '18', '112', '196'];
  const emergencyContacts = (guide.contacts || []).filter(c => emergencyNumbers.includes(c.phone?.replace(/\s/g, '')));
  const regularContacts = (guide.contacts || []).filter(c => !emergencyNumbers.includes(c.phone?.replace(/\s/g, '')));

  return (
    <div style={{ minHeight: '100vh', background: '#0c1425', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#e2e8f0' }}>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <div style={{ background: `linear-gradient(165deg, ${dark} 0%, ${accent}18 100%)`, borderBottom: `1px solid ${accent}30`, position: 'relative', overflow: 'hidden' }}>
        {/* Decoration blob */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: accent + '0d', pointerEvents: 'none' }} />

        {/* Print + partager */}
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8 }}>
          <button onClick={() => window.print()} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 12, cursor: 'pointer' }} title="Imprimer">🖨️</button>
        </div>

        <div style={{ padding: '36px 20px 28px' }}>
          <div style={{ fontSize: 58, marginBottom: 10, lineHeight: 1 }}>{guide.emoji}</div>
          <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: -.5 }}>{guide.property_name}</h1>
          {guide.tagline && <p style={{ margin: '0 0 20px', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{guide.tagline}</p>}

          {/* Check-in / Check-out */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 320 }}>
            {[
              { label: 'ARRIVÉE', val: guide.checkin_time, icon: '🟢' },
              { label: 'DÉPART', val: guide.checkout_time, icon: '🔴' },
            ].map(({ label, val, icon }) => (
              <div key={label} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{icon} {label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -.5 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ MOT D'ACCUEIL ════════════════════════════════════════ */}
      {guide.welcome_message && (
        <div style={{ margin: '16px 16px 0', background: `linear-gradient(135deg, ${accent}12, ${accent}06)`, border: `1px solid ${accent}30`, borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>✉️</span>
            <div>
              <div style={{ fontSize: 11, color: accent, fontWeight: 700, letterSpacing: .5, marginBottom: 6 }}>MOT DE VOTRE HÔTE</div>
              <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1', lineHeight: 1.75, whiteSpace: 'pre-line' }}>{guide.welcome_message}</p>
              {guide.host_signature && <div style={{ marginTop: 10, fontSize: 13, color: accent, fontWeight: 700 }}>— {guide.host_signature}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ══ CARTE RAPIDE : WiFi + Adresse ═══════════════════════ */}
      <div style={{ margin: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* WiFi */}
        {(guide.wifi_ssid || guide.wifi_password) && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>📶</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>WiFi</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {guide.wifi_ssid && (
                <div>
                  <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: .5, marginBottom: 3 }}>RÉSEAU</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <code style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{guide.wifi_ssid}</code>
                    <CopyBtn value={guide.wifi_ssid} label="Copier" accent={accent} />
                  </div>
                </div>
              )}
              {guide.wifi_password && (
                <div>
                  <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: .5, marginBottom: 3 }}>MOT DE PASSE</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <code style={{ fontSize: 16, fontWeight: 800, color: accent, letterSpacing: 1 }}>{guide.wifi_password}</code>
                    <CopyBtn value={guide.wifi_password} label="Copier" accent={accent} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Adresse */}
        {guide.address && (
          <a
            href={guide.maps_url || `https://maps.google.com/?q=${encodeURIComponent(guide.address)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '13px 16px', textDecoration: 'none', color: '#e2e8f0' }}
          >
            <span style={{ fontSize: 22 }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: .5, marginBottom: 2 }}>ADRESSE — OUVRIR DANS MAPS</div>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>{guide.address}</div>
            </div>
            <span style={{ color: accent, fontSize: 18, flexShrink: 0 }}>›</span>
          </a>
        )}
      </div>

      {/* ══ SECTIONS ════════════════════════════════════════════ */}
      <div style={{ padding: '12px 16px 0' }}>
        {(guide.sections || []).map((s, i) => (
          <Section
            key={s.id || i}
            section={s}
            accent={accent}
            defaultOpen={s.id === 'access'}
          />
        ))}
      </div>

      {/* ══ CONTACTS HÔTE ═══════════════════════════════════════ */}
      {regularContacts.length > 0 && (
        <div style={{ padding: '4px 16px 0' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 20 }}>💬</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>Votre hôte</span>
              </div>
            </div>
            <div style={{ padding: '4px 16px 12px' }}>
              {regularContacts.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < regularContacts.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{c.icon} {c.label}</div>
                    {c.note && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{c.note}</div>}
                  </div>
                  <a href={`tel:${c.phone}`} style={{ background: accent + '20', border: `1px solid ${accent}40`, borderRadius: 8, padding: '6px 13px', color: accent, fontWeight: 700, fontSize: 13, textDecoration: 'none', fontFamily: 'monospace' }}>{c.phone}</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ URGENCES ════════════════════════════════════════════ */}
      {emergencyContacts.length > 0 && (
        <div style={{ margin: '12px 16px 0', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#f87171', fontWeight: 700, letterSpacing: .5, marginBottom: 10 }}>🆘 NUMÉROS D'URGENCE</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {emergencyContacts.map((c, i) => (
              <a key={i} href={`tel:${c.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '7px 12px', textDecoration: 'none' }}>
                <span style={{ fontSize: 16 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1 }}>{c.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fca5a5', fontFamily: 'monospace', lineHeight: 1.3 }}>{c.phone}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ══ PIED DE PAGE : lien partage ═════════════════════════ */}
      <div style={{ padding: '16px 16px 40px' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#334155', marginBottom: 8 }}>Partagez ce guide</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569', background: 'rgba(0,0,0,0.25)', borderRadius: 7, padding: '7px 12px', marginBottom: 10, wordBreak: 'break-all' }}>{pageUrl}</div>
          <CopyBtn value={pageUrl} label="Copier le lien" accent={accent} />
          {guide.updated_at && <div style={{ marginTop: 12, fontSize: 10, color: '#1e293b' }}>Mis à jour le {guide.updated_at}</div>}
        </div>
      </div>

      <style>{`
        @media print {
          button, a[href^="tel"] { display: none !important; }
          body { background: white !important; color: #111 !important; }
          * { color: #111 !important; border-color: #ddd !important; background: transparent !important; }
        }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
