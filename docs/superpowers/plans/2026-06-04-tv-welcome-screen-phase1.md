# Écran d'accueil TV — Phase 1 (MVP) — Plan d'implémentation

> **Pour l'agent exécutant :** SUB-SKILL REQUISE : `superpowers:subagent-driven-development` (recommandé) ou `executing-plans`, tâche par tâche. Cases `- [ ]` pour le suivi.

**Goal :** afficher un écran d'accueil plein écran qui défile sur les TV des logements, via `villamaryllis.com/bienvenue/<bien>?tv=1`, en réutilisant les guides JSON existants.

**Architecture :** un mode « kiosk » du composant `GuestGuide` existant. Quand l'URL porte `?tv=1`, `GuestGuide` rend `<TvScreen>` (nouveau, plein écran, diaporama auto) au lieu du livret défilant. Logique pure (parse params, construction des slides, payloads QR) extraite et testée vitest ; le composant ne fait que l'affichage.

**Tech Stack :** React 19 + Vite · vitest · lib `qrcode` (génération QR client) · données via `/api/guides?property_id=` (existant).

**Réfs :** spec `docs/superpowers/specs/2026-06-04-tv-welcome-screen-design.md`. Garde-fous : déploiement `npm run deploy:pages` UNIQUEMENT ; vérif live obligatoire ; pas de paiement en Phase 1.

---

## Structure des fichiers

- **Créer** `src/utils/tvScreen.js` — logique pure : `parseTvParams(search)`, `buildSlides(guide, params)`, `wifiQrPayload(ssid, pwd)`, `absUrl(path)`. Testable sans DOM.
- **Créer** `src/utils/tvScreen.test.js` — tests vitest des fonctions pures.
- **Créer** `src/TvScreen.jsx` — composant d'affichage plein écran (diaporama auto + QR).
- **Modifier** `src/GuestGuide.jsx` — brancher le mode `tv=1`.
- **Modifier** `src/LivretEditor.jsx` — petit helper « Générer l'URL TV ».
- **Modifier** `package.json` — dépendance `qrcode`.

---

## Task 1 : Dépendance QR + parse des paramètres TV (pur)

**Files :** Modifier `package.json` · Créer `src/utils/tvScreen.js`, `src/utils/tvScreen.test.js`

- [ ] **Step 1 — Vérifier l'absence puis installer `qrcode`**

Run : `grep -i qrcode package.json || npm install qrcode`
Attendu : `qrcode` ajouté aux `dependencies`. (Lib mûre, génère un dataURL/SVG côté client ; pas d'appel réseau.)

- [ ] **Step 2 — Écrire le test de `parseTvParams`**

```js
// src/utils/tvScreen.test.js
import { describe, it, expect } from "vitest";
import { parseTvParams, wifiQrPayload } from "./tvScreen.js";

describe("parseTvParams", () => {
  it("retourne tv=false sans le paramètre", () => {
    expect(parseTvParams("").tv).toBe(false);
  });
  it("détecte tv=1 et extrait guest/du/au", () => {
    const p = parseTvParams("?tv=1&guest=Vincent&du=05-06&au=12-06");
    expect(p).toEqual({ tv: true, guest: "Vincent", du: "05-06", au: "12-06" });
  });
  it("guest absent => null, tv quand même true", () => {
    const p = parseTvParams("?tv=1");
    expect(p.tv).toBe(true);
    expect(p.guest).toBeNull();
  });
  it("nettoie les espaces du prénom", () => {
    expect(parseTvParams("?tv=1&guest=%20Léa%20").guest).toBe("Léa");
  });
});

describe("wifiQrPayload", () => {
  it("formate le payload WIFI standard WPA", () => {
    expect(wifiQrPayload("AmaryllisNet", "soleil972")).toBe("WIFI:T:WPA;S:AmaryllisNet;P:soleil972;;");
  });
  it("échappe les caractères spéciaux ; , : \\", () => {
    expect(wifiQrPayload("Box;A", "p:a,b")).toBe("WIFI:T:WPA;S:Box\\;A;P:p\\:a\\,b;;");
  });
  it("retourne null si ssid manquant", () => {
    expect(wifiQrPayload("", "x")).toBeNull();
  });
});
```

- [ ] **Step 3 — Lancer le test (échoue : module absent)**

Run : `npx vitest run src/utils/tvScreen.test.js`
Attendu : FAIL (`Cannot find module './tvScreen.js'`).

- [ ] **Step 4 — Implémenter `parseTvParams` + `wifiQrPayload`**

```js
// src/utils/tvScreen.js
// Logique pure de l'écran TV (testable sans DOM).

export function parseTvParams(search) {
  const q = new URLSearchParams(search || "");
  const clean = (v) => { const s = (v || "").trim(); return s.length ? s : null; };
  return {
    tv: q.get("tv") === "1",
    guest: clean(q.get("guest")),
    du: clean(q.get("du")),
    au: clean(q.get("au")),
  };
}

// Payload QR « se connecter au WiFi » (format de.fr standard).
export function wifiQrPayload(ssid, password) {
  if (!ssid) return null;
  const esc = (s) => String(s).replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:WPA;S:${esc(ssid)};P:${esc(password || "")};;`;
}

// URL absolue de production (pour les QR).
export function absUrl(path) {
  const base = "https://villamaryllis.com";
  return path.startsWith("http") ? path : base + (path.startsWith("/") ? path : "/" + path);
}
```

- [ ] **Step 5 — Relancer le test (passe)**

Run : `npx vitest run src/utils/tvScreen.test.js`
Attendu : PASS.

- [ ] **Step 6 — Commit**

```bash
git add package.json package-lock.json src/utils/tvScreen.js src/utils/tvScreen.test.js
git commit -m "feat(tv): utils écran TV — parseTvParams + wifiQrPayload + dep qrcode"
```

---

## Task 2 : Construction des slides (pur, testé)

**Files :** Modifier `src/utils/tvScreen.js`, `src/utils/tvScreen.test.js`

- [ ] **Step 1 — Écrire le test de `buildSlides`**

```js
// (ajouter dans src/utils/tvScreen.test.js)
import { buildSlides } from "./tvScreen.js";

const GUIDE = {
  property_id: "mabouya", property_name: "Studio Mabouya", tagline: "Cocon pour deux",
  welcome_message: "Bienvenue chez vous", host_signature: "Vincent",
  wifi_ssid: "MabouyaNet", wifi_password: "jacuzzi972",
  checkout_time: "10h00", contacts: { whatsapp: "+33610880772" },
};

describe("buildSlides", () => {
  it("génère les slides de base dans l'ordre", () => {
    const s = buildSlides(GUIDE, { tv: true, guest: null });
    expect(s.map(x => x.id)).toEqual(["welcome", "wifi", "guide", "services", "practical", "rebook"]);
  });
  it("titre générique sans guest", () => {
    const s = buildSlides(GUIDE, { tv: true, guest: null });
    expect(s[0].title).toContain("Studio Mabouya");
  });
  it("titre personnalisé avec guest + dates", () => {
    const s = buildSlides(GUIDE, { tv: true, guest: "Vincent", du: "05-06", au: "12-06" });
    expect(s[0].title).toContain("Vincent");
    expect(s[0].subtitle).toContain("05-06");
  });
  it("saute le slide wifi si pas de SSID", () => {
    const s = buildSlides({ ...GUIDE, wifi_ssid: "" }, { tv: true });
    expect(s.find(x => x.id === "wifi")).toBeUndefined();
  });
  it("le slide wifi porte le payload QR", () => {
    const wifi = buildSlides(GUIDE, { tv: true }).find(x => x.id === "wifi");
    expect(wifi.qr).toBe("WIFI:T:WPA;S:MabouyaNet;P:jacuzzi972;;");
  });
});
```

- [ ] **Step 2 — Lancer (échoue : buildSlides absent)**

Run : `npx vitest run src/utils/tvScreen.test.js`
Attendu : FAIL.

- [ ] **Step 3 — Implémenter `buildSlides`**

```js
// (ajouter dans src/utils/tvScreen.js)
import { } from "./tvScreen.js"; // (pas d'import circulaire ; helpers déjà dans ce fichier)

export function buildSlides(guide, params = {}) {
  const g = guide || {};
  const pid = g.property_id || "amaryllis";
  const slides = [];

  // 1. Bienvenue
  const welcomeTitle = params.guest
    ? `Bienvenue ${params.guest} 👋`
    : `Bienvenue à ${g.property_name || "votre logement"} 👋`;
  const welcomeSub = params.guest && params.du
    ? `Votre séjour du ${params.du}${params.au ? ` au ${params.au}` : ""}`
    : (g.tagline || "");
  slides.push({ id: "welcome", title: welcomeTitle, subtitle: welcomeSub,
    body: g.welcome_message || "", signature: g.host_signature || "" });

  // 2. WiFi (sauté si pas de SSID)
  if (g.wifi_ssid) {
    slides.push({ id: "wifi", title: "Connectez-vous au WiFi",
      ssid: g.wifi_ssid, password: g.wifi_password || "",
      qr: wifiQrPayload(g.wifi_ssid, g.wifi_password) });
  }

  // 3. Guide & bonnes adresses (QR -> guide complet sur le téléphone)
  slides.push({ id: "guide", title: "Le meilleur autour de vous",
    subtitle: "Plages, distilleries, tables créoles…",
    qr: absUrl(`/bienvenue/${pid}`), qrLabel: "Ouvrir le guide complet" });

  // 4. Services & extras (vitrine en Phase 1 ; QR -> contact hôte)
  const contact = g.contacts || {};
  const wa = contact.whatsapp ? `https://wa.me/${String(contact.whatsapp).replace(/[^0-9]/g, "")}` : absUrl(`/${pid}`);
  slides.push({ id: "services", title: "Envie d'un petit plus ?",
    subtitle: "Départ tardif · ménage · bouteille de planteur maison…",
    qr: wa, qrLabel: "Demandez à votre hôte" });

  // 5. Infos pratiques
  slides.push({ id: "practical", title: "Bon à savoir",
    checkout: g.checkout_time || "", contact,
    qr: wa, qrLabel: "Contacter l'hôte" });

  // 6. Revenez en direct
  slides.push({ id: "rebook", title: "Revenez quand vous voulez",
    subtitle: "Réservez en direct — jusqu'à 15 % de moins que sur les plateformes",
    qr: absUrl(`/${pid}`), qrLabel: "villamaryllis.com" });

  return slides;
}
```

- [ ] **Step 4 — Relancer (passe)**

Run : `npx vitest run src/utils/tvScreen.test.js`
Attendu : PASS.

- [ ] **Step 5 — Commit**

```bash
git add src/utils/tvScreen.js src/utils/tvScreen.test.js
git commit -m "feat(tv): buildSlides — slides bienvenue/wifi/guide/services/pratique/rebook + QR"
```

---

## Task 3 : Composant `TvScreen.jsx` (affichage plein écran + diaporama)

**Files :** Créer `src/TvScreen.jsx`

- [ ] **Step 1 — Implémenter le composant**

Points clés : plein écran (100vw/100vh), `padding: 5vh 6vw` (safe-area overscan TV), police `system-ui` (les navigateurs TV chargent mal les webfonts), gros corps de texte (`clamp`), diaporama auto (12 s) avec `setInterval`, pause au clic, QR rendu via `qrcode` en dataURL (useEffect par slide), couleurs du logement passées en props.

```jsx
// src/TvScreen.jsx
import { useState, useEffect } from "react";
import QRCode from "qrcode";

function Qr({ value, size = 220 }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!value) { setSrc(null); return; }
    QRCode.toDataURL(value, { margin: 1, width: size, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setSrc).catch(() => setSrc(null));
  }, [value, size]);
  if (!src) return null;
  return <img src={src} alt="QR code" width={size} height={size}
    style={{ borderRadius: 16, background: "#fff", padding: 10 }} />;
}

const SLIDE_MS = 12000;

export default function TvScreen({ slides, colors }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const { dark, mid: accent, light } = colors;

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(() => setI(p => (p + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const s = slides[i] || {};
  const wrap = {
    width: "100vw", height: "100vh", overflow: "hidden", boxSizing: "border-box",
    padding: "5vh 6vw", background: `linear-gradient(135deg, ${dark} 0%, #06100c 100%)`,
    color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif",
    display: "flex", flexDirection: "column", justifyContent: "center", cursor: "none",
  };
  const H1 = { fontSize: "clamp(34px, 5.5vw, 84px)", fontWeight: 800, lineHeight: 1.05, margin: 0, letterSpacing: "-0.02em" };
  const SUB = { fontSize: "clamp(20px, 2.4vw, 40px)", color: light, opacity: 0.9, marginTop: "2vh", fontWeight: 500 };
  const BODY = { fontSize: "clamp(18px, 2vw, 34px)", lineHeight: 1.5, marginTop: "3vh", maxWidth: "60ch", opacity: 0.95 };

  return (
    <div style={wrap} onClick={() => setPaused(p => !p)}>
      {/* bandeau marque */}
      <div style={{ position: "absolute", top: "3vh", left: "6vw", fontSize: "clamp(13px,1.3vw,20px)", letterSpacing: "0.3em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>Amaryllis</div>

      <h1 style={H1}>{s.title}</h1>
      {s.subtitle && <div style={SUB}>{s.subtitle}</div>}

      {/* WiFi en grand */}
      {s.id === "wifi" && (
        <div style={{ display: "flex", gap: "5vw", alignItems: "center", marginTop: "4vh" }}>
          <div>
            <div style={{ fontSize: "clamp(16px,1.6vw,26px)", color: light, opacity: 0.7 }}>Réseau</div>
            <div style={{ fontSize: "clamp(28px,3.4vw,54px)", fontWeight: 800 }}>{s.ssid}</div>
            <div style={{ fontSize: "clamp(16px,1.6vw,26px)", color: light, opacity: 0.7, marginTop: "2vh" }}>Mot de passe</div>
            <div style={{ fontSize: "clamp(28px,3.4vw,54px)", fontWeight: 800, fontFamily: "ui-monospace, monospace" }}>{s.password}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Qr value={s.qr} size={260} />
            <div style={{ marginTop: "1.5vh", fontSize: "clamp(13px,1.3vw,20px)", opacity: 0.8 }}>Scannez pour vous connecter</div>
          </div>
        </div>
      )}

      {s.id === "practical" && s.checkout && (
        <div style={{ ...BODY }}>🔴 Départ avant <b>{s.checkout}</b>{s.contact?.host_name ? ` · Votre hôte : ${s.contact.host_name}` : ""}</div>
      )}

      {s.body && s.id !== "wifi" && <div style={BODY}>{s.body}</div>}
      {s.signature && <div style={{ ...SUB, marginTop: "3vh", fontStyle: "italic" }}>— {s.signature}</div>}

      {/* QR générique (slides guide / services / practical / rebook) */}
      {s.qr && s.id !== "wifi" && (
        <div style={{ position: "absolute", bottom: "5vh", right: "6vw", textAlign: "center" }}>
          <Qr value={s.qr} size={200} />
          {s.qrLabel && <div style={{ marginTop: "1vh", fontSize: "clamp(13px,1.3vw,20px)", opacity: 0.85 }}>{s.qrLabel}</div>}
        </div>
      )}

      {/* pastilles de progression */}
      <div style={{ position: "absolute", bottom: "5vh", left: "6vw", display: "flex", gap: 10 }}>
        {slides.map((_, k) => (
          <div key={k} style={{ width: k === i ? 34 : 12, height: 12, borderRadius: 6, background: k === i ? accent : "rgba(255,255,255,0.25)", transition: "all .3s" }} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2 — Vérifier le build**

Run : `npm run build 2>&1 | tail -3`
Attendu : `✓ built` (pas d'erreur d'import `qrcode`).

- [ ] **Step 3 — Commit**

```bash
git add src/TvScreen.jsx
git commit -m "feat(tv): composant TvScreen — diaporama plein écran + QR (system-ui, overscan)"
```

---

## Task 4 : Brancher le mode `tv=1` dans `GuestGuide`

**Files :** Modifier `src/GuestGuide.jsx`

- [ ] **Step 1 — Importer + lire les params en tête du composant**

Dans `export default function GuestGuide()`, juste après la ligne `const propertyId = …` :

```jsx
import TvScreen from "./TvScreen.jsx";
import { parseTvParams, buildSlides } from "./utils/tvScreen.js";
// …
const tvParams = parseTvParams(window.location.search);
```

- [ ] **Step 2 — Rendre `TvScreen` quand `tv=1`, après le chargement du guide**

Juste APRÈS le bloc `if (error || !guide) return (…)` et AVANT le `return (` du livret, insérer :

```jsx
if (tvParams.tv) {
  return <TvScreen slides={buildSlides(guide, tvParams)} colors={colors} />;
}
```

(Ainsi le mode TV réutilise le chargement guide + les gardes loading/error existants, et ne s'affiche que `guide` prêt.)

- [ ] **Step 3 — Vérifier build + tests**

Run : `npm run build 2>&1 | tail -2 && npx vitest run src/utils/tvScreen.test.js`
Attendu : build OK, tests verts.

- [ ] **Step 4 — Commit**

```bash
git add src/GuestGuide.jsx
git commit -m "feat(tv): GuestGuide rend TvScreen quand ?tv=1 (réutilise chargement guide)"
```

---

## Task 5 : Helper admin « Générer l'URL TV »

**Files :** Modifier `src/LivretEditor.jsx`

- [ ] **Step 1 — Ajouter un petit bloc générateur d'URL**

Dans `LivretEditor`, ajouter une carte (près de la sélection du logement) qui construit l'URL :

```jsx
// état local
const [tvGuest, setTvGuest] = useState("");
const [tvDu, setTvDu] = useState("");
const [tvAu, setTvAu] = useState("");
// l'id du logement courant = `selected` / `propertyId` selon la variable existante du composant
const tvUrl = (() => {
  const q = new URLSearchParams({ tv: "1" });
  if (tvGuest.trim()) q.set("guest", tvGuest.trim());
  if (tvDu.trim()) q.set("du", tvDu.trim());
  if (tvAu.trim()) q.set("au", tvAu.trim());
  return `https://villamaryllis.com/bienvenue/${currentPropertyId}?${q}`;
})();
```

Rendu : 3 inputs (prénom, du, au) + champ lecture seule `tvUrl` + bouton « 📋 Copier » (`navigator.clipboard.writeText(tvUrl)`). Texte d'aide : « Ouvrez cette URL dans le navigateur de la TV. Laissez les champs vides pour un accueil générique. »

⚠️ Adapter `currentPropertyId` au nom réel de la variable de logement sélectionné dans `LivretEditor` (la lire d'abord).

- [ ] **Step 2 — Vérifier build**

Run : `npm run build 2>&1 | tail -2`
Attendu : `✓ built`.

- [ ] **Step 3 — Commit**

```bash
git add src/LivretEditor.jsx
git commit -m "feat(tv): helper admin — génère l'URL écran TV (prénom/dates optionnels)"
```

---

## Task 6 : Déploiement + vérif live

- [ ] **Step 1 — Déployer via le gate**

Run : `npm run deploy:pages`
Attendu : tests verts, build OK, smoke OK, audit 🟢.

- [ ] **Step 2 — Vérif live (générique + perso)**

Run :
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://villamaryllis.com/bienvenue/mabouya?tv=1"
```
Attendu : `200`. Puis ouvrir dans un navigateur (ou Chrome MCP, viewport 1920×1080) :
- `https://villamaryllis.com/bienvenue/mabouya?tv=1` → diaporama générique, WiFi lisible, QR présents.
- `…?tv=1&guest=Vincent&du=05-06&au=12-06` → titre personnalisé.
Vérifier : texte lisible (contraste), QR scannable (WiFi connecte, guide ouvre), défilement automatique, rien ne déborde.

- [ ] **Step 3 — Mémoire**

Ajouter une entrée `ITERATIONS_LOG.md` (Phase 1 TV livrée) + noter la dette « PublicSite lit le prix late-checkout depuis le futur catalogue » dans `BLOCKERS.md`.

```bash
git add .memory/ && git commit -m "docs(memory): écran TV Phase 1 livré"
```

---

## Auto-revue (faite)

- **Couverture spec** : slides 1-6 ✓, perso optionnelle ✓, QR ✓, réutilisation guide JSON ✓. Services = vitrine (Phase 1) ✓ — l'achat Stripe est explicitement Phase 2 (hors de ce plan).
- **Placeholders** : un seul point à résoudre à l'exécution = nom réel de la variable de logement dans `LivretEditor` (Task 5, signalé).
- **Types/cohérence** : `buildSlides`/`parseTvParams`/`wifiQrPayload` cohérents entre tests et implémentation ; `colors` = objet `{dark, mid, light}` (forme de `PROP_COLORS`).
