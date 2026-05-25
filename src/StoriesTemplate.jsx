import { useState } from 'react';

const VILLAS = [
  { id: 'amaryllis', label: 'Villa Amaryllis', capacity: '8 pers.', prix: 650 },
  { id: 'zandoli',   label: 'Zandoli',         capacity: '4 pers.', prix: 320 },
  { id: 'geko',      label: 'Géko',             capacity: '4 pers.', prix: 220 },
  { id: 'mabouya',   label: 'Mabouya',          capacity: '2 pers.', prix: 130 },
];

function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  return {
    label: `du ${fmt(monday)} au ${fmt(sunday)}`,
    monday,
    sunday,
  };
}

function buildLegende(week, villas, statuts) {
  const lignes = villas
    .map((v) => {
      const dispo = statuts[v.id];
      return `${dispo ? '🟢' : '🔴'} ${v.label} — ${dispo ? `dispo · ${v.prix} €/nuit` : 'complet'}`;
    })
    .join('\n');

  return `✨ Disponibilités de la semaine — ${week.label}

${lignes}

📩 Réservation directe (sans commission) :
👉 villamaryllis.com

#martinique #villamaryllis #locationdirecte #villavacances #antilles #caribbean #luxurytravel #locationmartinique #sainteromance #expatlux #vacancesmartinique #locationdirecte #voyageurs`;
}

export default function StoriesTemplate() {
  const week = getWeekRange();

  const [statuts, setStatuts] = useState(() =>
    Object.fromEntries(VILLAS.map((v) => [v.id, true]))
  );
  const [copied, setCopied] = useState(false);

  const toggle = (id) =>
    setStatuts((prev) => ({ ...prev, [id]: !prev[id] }));

  const copierLegende = async () => {
    try {
      await navigator.clipboard.writeText(buildLegende(week, VILLAS, statuts));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      alert('Impossible de copier — veuillez le faire manuellement.');
    }
  };

  /* ── styles ── */

  const page = {
    minHeight: '100vh',
    background: '#111',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '40px 20px 60px',
    fontFamily: "'Jost', 'Segoe UI', sans-serif",
    gap: 24,
  };

  const controls = {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const btnBase = {
    padding: '10px 22px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '0.04em',
    transition: 'opacity .15s',
  };

  const btnCopy = {
    ...btnBase,
    background: '#c47254',
    color: '#fff',
  };

  const btnReset = {
    ...btnBase,
    background: '#1e4a49',
    color: '#e8dfc8',
  };

  /* story card */
  const card = {
    width: 375,
    height: 667,
    background: 'linear-gradient(160deg, #0e3b3a 0%, #081a19 55%, #050d0d 100%)',
    borderRadius: 18,
    boxShadow: '0 24px 64px rgba(0,0,0,.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '36px 28px 32px',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  /* background decorative rings */
  const ring = (size, opacity) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    border: '1px solid rgba(196,114,84,.18)',
    opacity,
    pointerEvents: 'none',
  });

  const brand = {
    fontSize: 13,
    letterSpacing: '0.32em',
    color: '#e8dfc8',
    textTransform: 'uppercase',
    fontWeight: 700,
    opacity: 0.9,
    marginBottom: 2,
  };

  const brandSub = {
    fontSize: 9,
    letterSpacing: '0.2em',
    color: '#c47254',
    textTransform: 'uppercase',
    opacity: 0.85,
    marginBottom: 20,
  };

  const divider = {
    width: 40,
    height: 1,
    background: 'linear-gradient(90deg, transparent, #c47254, transparent)',
    marginBottom: 18,
  };

  const titleBlock = {
    textAlign: 'center',
    marginBottom: 18,
  };

  const titleMain = {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '0.18em',
    color: '#e8dfc8',
    textTransform: 'uppercase',
    lineHeight: 1.1,
  };

  const titleSub = {
    fontSize: 10.5,
    letterSpacing: '0.1em',
    color: '#c47254',
    marginTop: 6,
    textTransform: 'uppercase',
    fontWeight: 500,
  };

  /* villa rows */
  const rowsWrap = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
  };

  const villaRow = (dispo) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: dispo
      ? 'rgba(255,255,255,0.042)'
      : 'rgba(180,40,40,0.07)',
    borderRadius: 10,
    padding: '11px 14px',
    border: dispo
      ? '1px solid rgba(255,255,255,0.07)'
      : '1px solid rgba(180,40,40,0.18)',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background .2s',
  });

  const villaName = {
    fontSize: 13,
    fontWeight: 700,
    color: '#e8dfc8',
    letterSpacing: '0.06em',
  };

  const villaSub = {
    fontSize: 10,
    color: 'rgba(232,223,200,0.5)',
    marginTop: 2,
    letterSpacing: '0.04em',
  };

  const pastille = (dispo) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: dispo ? '#4caf7d' : '#d94f4f',
    boxShadow: dispo ? '0 0 6px #4caf7d88' : '0 0 6px #d94f4f88',
    flexShrink: 0,
  });

  const prixTag = (dispo) => ({
    fontSize: 11.5,
    fontWeight: 700,
    color: dispo ? '#c47254' : 'rgba(232,223,200,0.3)',
    letterSpacing: '0.04em',
    textDecoration: dispo ? 'none' : 'line-through',
    textAlign: 'right',
  });

  const completTag = {
    fontSize: 9.5,
    color: '#d94f4f',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  };

  const cta = {
    marginTop: 20,
    width: '100%',
    background: 'linear-gradient(135deg, #c47254, #a0533a)',
    borderRadius: 10,
    padding: '13px 18px',
    textAlign: 'center',
  };

  const ctaLine1 = {
    fontSize: 10,
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    marginBottom: 4,
  };

  const ctaLine2 = {
    fontSize: 13.5,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '0.06em',
  };

  const hint = {
    fontSize: 11,
    color: 'rgba(232,223,200,0.35)',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 1.5,
  };

  return (
    <div style={page}>
      {/* ── controls ── */}
      <div style={controls}>
        <button
          style={btnCopy}
          onClick={copierLegende}
          title="Copie la légende Instagram dans le presse-papier"
        >
          {copied ? 'Copié !' : 'Copier le texte légende'}
        </button>
        <button
          style={btnReset}
          onClick={() =>
            setStatuts(Object.fromEntries(VILLAS.map((v) => [v.id, true])))
          }
        >
          Tout remettre dispo
        </button>
      </div>

      {/* ── story card ── */}
      <div style={card}>
        {/* decorative rings */}
        <div style={{ ...ring(520, 0.35), top: -180, right: -200 }} />
        <div style={{ ...ring(320, 0.2), bottom: -100, left: -120 }} />

        {/* brand */}
        <div style={brand}>Amaryllis</div>
        <div style={brandSub}>Locations · Martinique</div>

        <div style={divider} />

        {/* title */}
        <div style={titleBlock}>
          <div style={titleMain}>Disponibilités</div>
          <div style={titleSub}>{week.label}</div>
        </div>

        {/* villa rows */}
        <div style={rowsWrap}>
          {VILLAS.map((v) => {
            const dispo = statuts[v.id];
            return (
              <div
                key={v.id}
                style={villaRow(dispo)}
                onClick={() => toggle(v.id)}
                title={dispo ? 'Cliquer pour marquer complet' : 'Cliquer pour marquer disponible'}
              >
                {/* left */}
                <div>
                  <div style={villaName}>{v.label}</div>
                  <div style={villaSub}>{v.capacity}</div>
                </div>

                {/* right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={prixTag(dispo)}>
                      {v.prix} €<span style={{ fontWeight: 400 }}>/nuit</span>
                    </div>
                    {!dispo && <div style={completTag}>Complet</div>}
                  </div>
                  <div style={pastille(dispo)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={cta}>
          <div style={ctaLine1}>Réservez en direct</div>
          <div style={ctaLine2}>villamaryllis.com</div>
        </div>
      </div>

      <p style={hint}>
        Cliquez sur chaque villa pour basculer entre disponible et complet.
        Faites ensuite une capture d'écran de la carte ci-dessus, puis collez la légende copiée sur Instagram.
      </p>
    </div>
  );
}
