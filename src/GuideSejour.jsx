// Page publique /guide-sejour/<bien> — guide numérique in-stay pour les voyageurs.
// Accessible via QR code dans le logement ou lien email pré-arrivée.
// Charge le guide JSON depuis /api/guides?property_id=<bien>.
// Mobile-first, surface "site" (IVORY/NAVY/CORAL).
import { useState, useEffect } from "react";
import NewsletterForm from "./NewsletterForm.jsx";
import SEOMeta from "./SEOMeta.jsx";
import { getReviewUrl, isGoogleReview } from "./data/googleReview.js";

const NAVY  = "#1f2a3d";
const CORAL = "#c47254";
const IVORY = "#fffdf8";
const SAND  = "#f6f1e7";
const MUTED = "#7c8593";
const TEXT  = "#3a4658";

const NAMES = {
  amaryllis: "Villa Amaryllis",
  iguana:    "Villa Iguana",
  zandoli:   "Zandoli",
  geko:      "Géko",
  mabouya:   "Mabouya",
  schoelcher:"Appartement Bellevue",
  nogent:    "Appartement Nogent",
};

function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      border: `1px solid #ece6d9`,
      padding: "20px 18px",
      marginBottom: 14,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 17, color: NAVY, fontWeight: "normal" }}>
        {title}
      </span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid #f0ebe0` }}>
      <span style={{ fontSize: 14, color: MUTED, flexShrink: 0, paddingRight: 12 }}>{label}</span>
      <span style={{ fontSize: 14, color: TEXT, textAlign: "right", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function StepList({ items }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < items.length - 1 ? `1px solid #f0ebe0` : "none" }}>
          <span style={{
            flexShrink: 0, width: 24, height: 24, borderRadius: "50%",
            background: CORAL, color: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, fontWeight: 700,
          }}>{i + 1}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{item.label}</div>
            <div style={{ fontSize: 13, color: TEXT, marginTop: 2 }}>{item.value}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  if (!items?.length) return null;
  return (
    <Card>
      <SectionTitle icon="❓" title="Questions fréquentes" />
      {items.map((item, i) => (
        <div key={i} style={{ borderBottom: i < items.length - 1 ? `1px solid #f0ebe0` : "none" }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: "100%", background: "none", border: "none", padding: "11px 0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 14, color: NAVY, fontWeight: 500, paddingRight: 8 }}>{item.q}</span>
            <span style={{ fontSize: 18, color: CORAL, flexShrink: 0 }}>{open === i ? "−" : "+"}</span>
          </button>
          {open === i && (
            <p style={{ margin: "0 0 12px", fontSize: 13, color: TEXT, lineHeight: 1.7 }}>{item.a}</p>
          )}
        </div>
      ))}
    </Card>
  );
}

function Contacts({ items, waNumber }) {
  if (!items?.length && !waNumber) return null;
  return (
    <Card>
      <SectionTitle icon="📞" title="Contacts utiles" />
      {waNumber && (
        <a
          href={`https://wa.me/${waNumber.replace(/\D/g, "")}`}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            background: "#25D366", borderRadius: 10, textDecoration: "none",
            color: "#fff", fontSize: 15, fontWeight: 600, marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 20 }}>💬</span>
          Contacter l'hôte sur WhatsApp
        </a>
      )}
      {items?.map((c, i) => (
        <InfoRow key={i} label={c.label} value={
          c.phone
            ? <a href={`tel:${c.phone}`} style={{ color: CORAL, textDecoration: "none" }}>{c.phone}</a>
            : c.value || "—"
        } />
      ))}
    </Card>
  );
}

function renderSection(section) {
  const { id, icon, title, type, items, content } = section;
  if (type === "steps") return (
    <Card key={id}>
      <SectionTitle icon={icon} title={title} />
      <StepList items={items || []} />
    </Card>
  );
  if (type === "info") return (
    <Card key={id}>
      <SectionTitle icon={icon} title={title} />
      {(items || []).map((item, i) => (
        <InfoRow key={i} label={item.label} value={item.value} />
      ))}
    </Card>
  );
  if (type === "text") return (
    <Card key={id}>
      <SectionTitle icon={icon} title={title} />
      <p style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.8 }}>{content}</p>
    </Card>
  );
  if (type === "list") return (
    <Card key={id}>
      <SectionTitle icon={icon} title={title} />
      <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
        {(items || []).map((item, i) => (
          <li key={i} style={{ fontSize: 14, color: TEXT, padding: "4px 0" }}>
            <strong style={{ color: NAVY }}>{item.label}</strong>
            {item.value ? ` — ${item.value}` : ""}
          </li>
        ))}
      </ul>
    </Card>
  );
  if (type === "checklist") return (
    <Card key={id}>
      <SectionTitle icon={icon} title={title} />
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {(items || []).map((item, i) => (
          <li key={i} style={{ display: "flex", gap: 8, padding: "5px 0", fontSize: 14, color: TEXT }}>
            <span>☐</span>
            <span>{typeof item === "string" ? item : (item.label || item.value || JSON.stringify(item))}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
  return null;
}

export default function GuideSejour() {
  const bien = window.location.pathname.split("/guide-sejour/")[1]?.replace(/\/$/, "").toLowerCase() || "amaryllis";
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/guides?property_id=${bien}`)
      .then(r => r.json())
      .then(d => { setGuide(d?.guide || null); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [bien]);

  const nom = guide?.property_name || NAMES[bien] || "votre logement";

  if (loading) return (
    <div style={{ minHeight: "100vh", background: IVORY, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: MUTED, fontFamily: "Georgia,serif", fontSize: 16 }}>Chargement…</div>
    </div>
  );

  if (!guide) return (
    <div style={{ minHeight: "100vh", background: IVORY, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", color: MUTED }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏡</div>
        <p>Guide non disponible. Contactez votre hôte.</p>
      </div>
    </div>
  );

  const hasExtras = Array.isArray(guide.extras) && guide.extras.length > 0;
  // Numéro WhatsApp hôte depuis contacts
  const waContact = guide.contacts?.find(c => c.whatsapp || (c.phone && c.label?.toLowerCase().includes("propriétaire")));
  const waNumber = waContact?.whatsapp || waContact?.phone;

  return (
    <div style={{ minHeight: "100vh", background: IVORY, fontFamily: "'Jost',system-ui,sans-serif", color: TEXT }}>
      <SEOMeta
        title={`Guide séjour — ${nom}`}
        description={`Toutes les infos pratiques pour votre séjour : accès, wifi, équipements, check-out.`}
        canonical={`/guide-sejour/${bien}`}
      />

      {/* Header */}
      <div style={{ background: NAVY, padding: "28px 20px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 30, marginBottom: 8 }}>{guide.emoji || "🏡"}</div>
        <div style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 22, color: IVORY, letterSpacing: 1 }}>
          {nom}
        </div>
        <div style={{ fontSize: 12, color: CORAL, letterSpacing: 3, textTransform: "uppercase", marginTop: 6 }}>
          Guide du séjour
        </div>
        {guide.tagline && (
          <div style={{ fontSize: 13, color: "#aeb6c2", marginTop: 8 }}>{guide.tagline}</div>
        )}
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 14px 40px" }}>

        {/* Message d'accueil */}
        {guide.welcome_message && (
          <Card style={{ borderLeft: `4px solid ${CORAL}`, background: SAND }}>
            <p style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.8, whiteSpace: "pre-line" }}>
              {guide.welcome_message}
            </p>
            {guide.host_signature && (
              <p style={{ margin: "10px 0 0", fontSize: 13, color: MUTED, fontStyle: "italic" }}>
                — {guide.host_signature}
              </p>
            )}
          </Card>
        )}

        {/* Infos essentielles */}
        <Card>
          <SectionTitle icon="ℹ️" title="L'essentiel" />
          {guide.checkin_time && <InfoRow label="Check-in" value={`À partir de ${guide.checkin_time}`} />}
          {guide.checkout_time && <InfoRow label="Check-out" value={`Avant ${guide.checkout_time}`} />}
          {guide.wifi_ssid && <InfoRow label="Wifi — réseau" value={guide.wifi_ssid} />}
          {guide.wifi_password && <InfoRow label="Wifi — mot de passe" value={
            <span style={{ fontFamily: "monospace", background: SAND, padding: "2px 8px", borderRadius: 4 }}>
              {guide.wifi_password}
            </span>
          } />}
          {guide.address && (
            <InfoRow label="Adresse" value={
              guide.maps_url
                ? <a href={guide.maps_url} target="_blank" rel="noreferrer" style={{ color: CORAL, textDecoration: "none" }}>
                    📍 Ouvrir dans Maps
                  </a>
                : guide.address
            } />
          )}
        </Card>

        {/* Sections du guide */}
        {(guide.sections || []).map(section => renderSection(section))}

        {/* FAQ */}
        <FAQ items={guide.faq} />

        {/* Contacts */}
        <Contacts items={guide.contacts} waNumber={waNumber} />

        {/* Extras/services */}
        {hasExtras && (
          <a
            href={`/services/${bien}`}
            style={{
              display: "block", textAlign: "center", background: CORAL, color: "#fff",
              borderRadius: 12, padding: "16px 20px", textDecoration: "none",
              fontSize: 16, fontWeight: 600, marginTop: 8,
            }}
          >
            🛎️ Commander des services & extras
          </a>
        )}

        {/* Avis Google — capture in-situ (chaque voyageur, Airbnb inclus) */}
        <div style={{ marginTop: 16, background: "linear-gradient(135deg, #fff8ef, #f6f1e7)", border: `1px solid ${SAND}`, borderRadius: 14, padding: "20px 22px", textAlign: "center" }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>⭐⭐⭐⭐⭐</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: NAVY, fontWeight: 600, marginBottom: 6 }}>
            Vous passez un bon séjour ?
          </div>
          <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.5, marginBottom: 14, maxWidth: 360, marginInline: "auto" }}>
            Votre avis nous aide énormément — il prend 30 secondes et fait toute la différence
            pour une petite conciergerie comme la nôtre. Merci du fond du cœur 💛
          </div>
          <a
            href={getReviewUrl(bien)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block", background: CORAL, color: "#fff",
              borderRadius: 10, padding: "13px 26px", textDecoration: "none",
              fontSize: 15, fontWeight: 700, letterSpacing: "0.02em",
              boxShadow: "0 4px 14px rgba(196,114,84,0.3)",
            }}
          >
            {isGoogleReview(bien) ? "Laisser un avis Google →" : "Laisser un avis →"}
          </a>
        </div>

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-sejour" />
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 28, paddingTop: 20, borderTop: `1px solid #ece6d9` }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 14, color: MUTED, letterSpacing: 2, textTransform: "uppercase" }}>
            Amaryllis Locations
          </div>
          <div style={{ fontSize: 12, color: "#c2bdb5", marginTop: 4 }}>Sainte-Luce · Martinique</div>
        </div>
      </div>
    </div>
  );
}
