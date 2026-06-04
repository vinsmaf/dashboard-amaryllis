import { useState, useEffect } from 'react';
import { adminFetch } from './lib/apiFetch.js';

const PROPERTIES = [
  { id: 'amaryllis',  label: 'Amaryllis',  emoji: '🌺' },
  { id: 'zandoli',   label: 'Zandoli',    emoji: '🦎' },
  { id: 'geko',      label: 'Geko',       emoji: '🦎' },
  { id: 'mabouya',   label: 'Mabouya',    emoji: '🌿' },
  { id: 'schoelcher',label: 'Schœlcher',  emoji: '🌊' },
  { id: 'nogent',    label: 'Nogent',     emoji: '🗼' },
  { id: 'iguana',    label: 'Iguana',     emoji: '🦖' },
];

const SECTION_TYPES = ['info', 'list', 'checklist', 'text', 'steps', 'picks'];

const inp = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#e2e8f0',
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

const Btn = ({ children, onClick, color = '#0ea5e9', disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: color + '22', border: `1px solid ${color}44`,
    borderRadius: 8, padding: '7px 14px', color,
    fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  }}>{children}</button>
);

const BtnDanger = ({ children, onClick }) => (
  <button onClick={onClick} style={{
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 6, padding: '4px 10px', color: '#ef4444',
    fontSize: 11, fontWeight: 600, cursor: 'pointer',
  }}>{children}</button>
);

function SectionEditor({ section, idx, onChange, onRemove, onMove, total }) {
  const [open, setOpen] = useState(false);

  const setField = (k, v) => onChange({ ...section, [k]: v });

  const setItem = (i, v) => {
    const items = [...(section.items || [])];
    items[i] = v;
    onChange({ ...section, items });
  };

  const addItem = () => {
    const items = [...(section.items || [])];
    if (section.type === 'info') items.push({ label: '', value: '' });
    else items.push('');
    onChange({ ...section, items });
  };

  const removeItem = (i) => {
    const items = [...(section.items || [])];
    items.splice(i, 1);
    onChange({ ...section, items });
  };

  const setInfoItem = (i, k, v) => {
    const items = [...(section.items || [])];
    items[i] = { ...items[i], [k]: v };
    onChange({ ...section, items });
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <span style={{ color: '#64748b', fontSize: 14 }}>{open ? '▾' : '▸'}</span>
        <span style={{ fontSize: 18 }}>{section.icon || '📌'}</span>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>{section.title || '(sans titre)'}</span>
        <span style={{ fontSize: 10, color: '#64748b', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 6px' }}>{section.type}</span>
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          {idx > 0 && <button onClick={() => onMove(idx, -1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0 4px', fontSize: 14 }}>↑</button>}
          {idx < total - 1 && <button onClick={() => onMove(idx, 1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0 4px', fontSize: 14 }}>↓</button>}
          <BtnDanger onClick={() => onRemove(idx)}>✕</BtnDanger>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Row 1: icon + title + type */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={section.icon || ''} onChange={e => setField('icon', e.target.value)} placeholder="🔑" style={{ ...inp, width: 60, textAlign: 'center' }} />
            <input value={section.title || ''} onChange={e => setField('title', e.target.value)} placeholder="Titre de la section" style={{ ...inp, flex: 1 }} />
            <select value={section.type || 'text'} onChange={e => setField('type', e.target.value)} style={{ ...inp, width: 110 }}>
              {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Content by type */}
          {(section.type === 'text') && (
            <textarea
              value={section.content || ''}
              onChange={e => setField('content', e.target.value)}
              rows={3}
              placeholder="Texte libre…"
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
            />
          )}

          {(section.type === 'list' || section.type === 'checklist') && (
            <div>
              {(section.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input value={item || ''} onChange={e => setItem(i, e.target.value)} placeholder={`Élément ${i + 1}`} style={{ ...inp, flex: 1 }} />
                  <BtnDanger onClick={() => removeItem(i)}>✕</BtnDanger>
                </div>
              ))}
              <Btn onClick={addItem} color="#10b981">+ Ajouter un élément</Btn>
            </div>
          )}

          {(section.type === 'info' || section.type === 'steps') && (
            <div>
              {(section.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input value={item?.label || ''} onChange={e => setInfoItem(i, 'label', e.target.value)} placeholder={section.type === 'steps' ? 'Titre étape' : 'Étiquette'} style={{ ...inp, width: 160 }} />
                  <input value={item?.value || ''} onChange={e => setInfoItem(i, 'value', e.target.value)} placeholder="Valeur / description" style={{ ...inp, flex: 1 }} />
                  <BtnDanger onClick={() => removeItem(i)}>✕</BtnDanger>
                </div>
              ))}
              <Btn onClick={addItem} color="#10b981">+ {section.type === 'steps' ? 'Ajouter une étape' : 'Ajouter un champ'}</Btn>
            </div>
          )}

          {section.type === 'picks' && (
            <div>
              {(section.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                  <input value={item?.icon || ''} onChange={e => setInfoItem(i, 'icon', e.target.value)} placeholder="🍽" style={{ ...inp, width: 48, textAlign: 'center' }} />
                  <input value={item?.name || ''} onChange={e => setInfoItem(i, 'name', e.target.value)} placeholder="Nom du lieu" style={{ ...inp, flex: 1, minWidth: 120 }} />
                  <input value={item?.distance || ''} onChange={e => setInfoItem(i, 'distance', e.target.value)} placeholder="5 min à pied" style={{ ...inp, width: 130 }} />
                  <input value={item?.note || ''} onChange={e => setInfoItem(i, 'note', e.target.value)} placeholder="Description / conseil" style={{ ...inp, width: '100%' }} />
                  <BtnDanger onClick={() => removeItem(i)}>✕ Supprimer</BtnDanger>
                </div>
              ))}
              <Btn onClick={addItem} color="#10b981">+ Ajouter un lieu</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContactEditor({ contacts, onChange }) {
  const add = () => onChange([...contacts, { label: '', phone: '', icon: '👤', note: '' }]);
  const remove = (i) => { const a = [...contacts]; a.splice(i, 1); onChange(a); };
  const set = (i, k, v) => { const a = [...contacts]; a[i] = { ...a[i], [k]: v }; onChange(a); };

  return (
    <div>
      {contacts.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <input value={c.icon || ''} onChange={e => set(i, 'icon', e.target.value)} placeholder="👤" style={{ ...inp, width: 48, textAlign: 'center' }} />
          <input value={c.label || ''} onChange={e => set(i, 'label', e.target.value)} placeholder="Nom / rôle" style={{ ...inp, flex: 1, minWidth: 120 }} />
          <input value={c.phone || ''} onChange={e => set(i, 'phone', e.target.value)} placeholder="+33 6 …" style={{ ...inp, width: 140 }} />
          <input value={c.note || ''} onChange={e => set(i, 'note', e.target.value)} placeholder="Note (optionnel)" style={{ ...inp, width: 160 }} />
          <BtnDanger onClick={() => remove(i)}>✕</BtnDanger>
        </div>
      ))}
      <Btn onClick={add} color="#10b981">+ Ajouter un contact</Btn>
    </div>
  );
}

export default function GuideEditor({ mob }) {
  const [propId, setPropId] = useState('amaryllis');
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const notify = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = async (id) => {
    setLoading(true);
    setGuide(null);
    try {
      const r = await fetch(`/api/guides?property_id=${id}`, { headers: { 'X-Admin': '1' } });
      const d = await r.json();
      if (d.guide) setGuide(d.guide);
      else notify('Guide non trouvé — chargement du template', false);
    } catch {
      notify('Erreur de chargement', false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(propId); }, [propId]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await adminFetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propId, guide }),
      });
      const d = await r.json();
      if (d.ok) notify('Guide sauvegardé ✓');
      else notify('Erreur : ' + (d.error || 'inconnue'), false);
    } catch {
      notify('Erreur réseau', false);
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setGuide(g => ({ ...g, [k]: v }));

  const setSections = (sections) => setGuide(g => ({ ...g, sections }));

  const addSection = () => {
    const sections = [...(guide.sections || []), {
      id: `section_${Date.now()}`,
      icon: '📌',
      title: 'Nouvelle section',
      type: 'text',
      content: '',
    }];
    setSections(sections);
  };

  const updateSection = (i, s) => {
    const sections = [...(guide.sections || [])];
    sections[i] = s;
    setSections(sections);
  };

  const removeSection = (i) => {
    const sections = [...(guide.sections || [])];
    sections.splice(i, 1);
    setSections(sections);
  };

  const moveSection = (i, dir) => {
    const sections = [...(guide.sections || [])];
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    [sections[i], sections[j]] = [sections[j], sections[i]];
    setSections(sections);
  };

  const guideUrl = `${window.location.origin}/bienvenue/${propId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=10&data=${encodeURIComponent(guideUrl)}`;
  const [showQR, setShowQR] = useState(false);

  return (
    <div style={{ padding: mob ? '12px 10px' : '20px 24px', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>📖 Guides d'accueil</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Éditez et publiez le guide de chaque logement.</p>
        </div>
        {guide && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <a href={guideUrl} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '7px 14px', color: '#818cf8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              🔗 Voir le guide
            </a>
            <button onClick={() => setShowQR(v => !v)} style={{ background: showQR ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showQR ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '7px 14px', color: showQR ? '#10b981' : '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              📲 QR Code
            </button>
            <Btn onClick={save} disabled={saving}>
              {saving ? '⏳ Sauvegarde…' : '💾 Sauvegarder'}
            </Btn>
          </div>
        )}
      </div>

      {/* QR Code panel */}
      {guide && showQR && (
        <div style={{ marginBottom: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '20px 24px', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <img src={qrUrl} alt="QR code guide voyageur" width={120} height={120} style={{ borderRadius: 8, background: '#fff', padding: 4, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>QR Code — Guide voyageur</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>Imprimez ce QR code et laissez-le dans le logement. Les voyageurs accèdent directement au guide.</div>
            <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '6px 10px', marginBottom: 10, wordBreak: 'break-all' }}>{guideUrl}</div>
            <a href={qrUrl} download={`qr-guide-${propId}.png`} style={{ display: 'inline-block', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '6px 14px', color: '#10b981', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
              ⬇ Télécharger PNG
            </a>
          </div>
        </div>
      )}

      {/* Property selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {PROPERTIES.map(p => (
          <button key={p.id} onClick={() => setPropId(p.id)} style={{
            background: propId === p.id ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${propId === p.id ? '#0ea5e9' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8, padding: '7px 14px', color: propId === p.id ? '#0ea5e9' : '#94a3b8',
            fontSize: 12, fontWeight: propId === p.id ? 700 : 400, cursor: 'pointer',
          }}>{p.emoji} {p.label}</button>
        ))}
      </div>

      {/* Toast */}
      {msg && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: msg.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg.ok ? '#10b981' : '#ef4444', fontSize: 13, fontWeight: 600 }}>
          {msg.text}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Chargement…</div>
      )}

      {guide && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Code d'accès ── */}
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, letterSpacing: 0.5, marginBottom: 12 }}>🔐 CODE D'ACCÈS VOYAGEUR</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, lineHeight: 1.6 }}>
              Ce code protège le guide. Communiquez-le à vos voyageurs dans votre message de confirmation Airbnb/Booking.
              Si vide, le guide sera public.
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={guide.access_code || ''}
                onChange={e => set('access_code', e.target.value)}
                placeholder="Ex: VILLA2025 ou le code boîte à clé…"
                style={{ ...inp, flex: 1, fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: 2, color: '#f1f5f9' }}
              />
              {guide.access_code && (
                <button
                  onClick={() => navigator.clipboard.writeText(guide.access_code)}
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 14px', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  📋 Copier
                </button>
              )}
            </div>
            {guide.access_code && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
                Lien direct pour vos voyageurs : <code style={{ color: '#94a3b8' }}>{guideUrl}?code={guide.access_code}</code>
              </div>
            )}
          </div>

          {/* ── Infos générales ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: 0.5, marginBottom: 12 }}>INFORMATIONS GÉNÉRALES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Émoji</div>
                <input value={guide.emoji || ''} onChange={e => set('emoji', e.target.value)} placeholder="🏡" style={{ ...inp, textAlign: 'center', fontSize: 22 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Nom du logement</div>
                <input value={guide.property_name || ''} onChange={e => set('property_name', e.target.value)} placeholder="Villa Amaryllis" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Tagline</div>
                <input value={guide.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="Bienvenue dans votre villa…" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Adresse</div>
                <input value={guide.address || ''} onChange={e => set('address', e.target.value)} placeholder="1 rue de la Paix, Paris" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Lien Google Maps</div>
                <input value={guide.maps_url || ''} onChange={e => set('maps_url', e.target.value)} placeholder="https://maps.google.com/?q=…" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Heure d'arrivée</div>
                <input value={guide.checkin_time || ''} onChange={e => set('checkin_time', e.target.value)} placeholder="15h00" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Heure de départ</div>
                <input value={guide.checkout_time || ''} onChange={e => set('checkout_time', e.target.value)} placeholder="10h00" style={inp} />
              </div>
            </div>
          </div>

          {/* ── Mot d'accueil ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: 0.5, marginBottom: 12 }}>✉️ MOT D'ACCUEIL (optionnel)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Message personnel (affiché en haut du guide)</div>
                <textarea
                  value={guide.welcome_message || ''}
                  onChange={e => set('welcome_message', e.target.value)}
                  rows={4}
                  placeholder="Bienvenue ! Je suis ravi de vous accueillir…"
                  style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Signature (ex : Vincent)</div>
                <input value={guide.host_signature || ''} onChange={e => set('host_signature', e.target.value)} placeholder="Votre prénom" style={{ ...inp, maxWidth: 200 }} />
              </div>
            </div>
          </div>

          {/* ── WiFi ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: 0.5, marginBottom: 12 }}>📶 WIFI</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Nom du réseau (SSID)</div>
                <input value={guide.wifi_ssid || ''} onChange={e => set('wifi_ssid', e.target.value)} placeholder="MonWiFi" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Mot de passe</div>
                <input value={guide.wifi_password || ''} onChange={e => set('wifi_password', e.target.value)} placeholder="motdepasse123" style={inp} />
              </div>
            </div>
          </div>

          {/* ── Sections ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: 0.5 }}>SECTIONS ({(guide.sections || []).length})</div>
              <Btn onClick={addSection} color="#10b981">+ Nouvelle section</Btn>
            </div>
            {(guide.sections || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: '#475569', fontSize: 13 }}>Aucune section. Cliquez sur "+ Nouvelle section" pour commencer.</div>
            )}
            {(guide.sections || []).map((s, i) => (
              <SectionEditor
                key={s.id || i}
                section={s}
                idx={i}
                total={(guide.sections || []).length}
                onChange={(s) => updateSection(i, s)}
                onRemove={removeSection}
                onMove={moveSection}
              />
            ))}
          </div>

          {/* ── Contacts ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: 0.5, marginBottom: 14 }}>📞 CONTACTS UTILES</div>
            <ContactEditor
              contacts={guide.contacts || []}
              onChange={(contacts) => set('contacts', contacts)}
            />
          </div>

          {/* ── Footer: URL du guide ── */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Lien à partager avec vos voyageurs :</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <code style={{ flex: 1, fontSize: 12, color: '#94a3b8', background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '6px 10px', wordBreak: 'break-all' }}>
                {guideUrl}
              </code>
              <button onClick={() => navigator.clipboard.writeText(guideUrl)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '6px 12px', color: '#e2e8f0', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                📋 Copier
              </button>
            </div>
          </div>

          {/* Bottom save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 24 }}>
            <Btn onClick={save} disabled={saving}>
              {saving ? '⏳ Sauvegarde en cours…' : '💾 Sauvegarder le guide'}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
