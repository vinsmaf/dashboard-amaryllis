# Amaryllis Design System

A design system for **Amaryllis Locations** — a portfolio of seven holiday rentals in Martinique and the Paris suburbs, run as a vertically-integrated brand with two consumer surfaces:

| Surface | URL | Audience | Mode |
|---|---|---|---|
| **Public site** | `villamaryllis.com/<bien>` | Guests browsing/booking | Warm, editorial, hospitality |
| **Admin dashboard** | `villamaryllis.com/admin` | Owner-operator | Dense, data-cartographic |

Both surfaces are deployed from the same Vite + React 19 codebase on Cloudflare Pages. They share **typography** (Jost + Cormorant Garamond) but use **two distinct palettes**: the site is warm ivory/navy/coral; the dashboard is a dark slate "Cartographie de Flux" canvas.

## The company

Amaryllis is a French direct-booking brand built on top of seven properties owned by a single host:

- **Villa Amaryllis** — flagship 3-suite villa with infinity pool & ocean view (Sainte-Luce, Martinique)
- **Zandoli** — 2-bedroom with pool & garden (Sainte-Luce)
- **Geko** — 1-bedroom T2 with pool (Sainte-Luce)
- **Mabouya** — studio with private jacuzzi (Sainte-Luce)
- **Villa Iguana** — long-term rental (Sainte-Luce)
- **Bellevue** — T2 with sea view (Schœlcher)
- **Appartement aux Portes de Paris** — riverside T2 (Nogent-sur-Marne)

The brand positioning is **"locations d'exception, sans frais de service"** — premium properties, booked direct, no Airbnb commission. Editorial tone, warm imagery, real conversation. The dashboard is the owner's internal cockpit; it runs in parallel under `/admin`, password-gated.

## Source materials this system was built from

- **Live site** — <https://villamaryllis.com>
- **Public codebase (GitHub):** <https://github.com/vinsmaf/dashboard-amaryllis> — explore for the canonical React components, especially:
  - `src/PublicSite.jsx` (6500 lines) — the marketing/booking site
  - `src/App.jsx` (7500 lines) — the admin dashboard
  - `src/Landing.jsx`, `src/Guide*.jsx` — editorial pages
  - `public/photos/` — full WebP photo library, organised by property
  - `canvas-philosophy.md` — the *Cartographie de Flux* design philosophy that informs the dashboard
- **Local codebase clone:** `locatif-dashboard/` (attached to this project)

Read the original repository — components are far more featureful than what's reproduced here, and the photo library is far larger than the small sample copied into `assets/photos/`.

---

## CONTENT FUNDAMENTALS

Voice is **French-first, English second** (hreflang fr/en). Bilingual everywhere — the site ships its own translation hook (`src/i18n.jsx`) rather than letting tooling decide.

### Tone

> *"Perchée sur les hauteurs de Sainte-Luce, bercée par les alizés et le parfum des fleurs tropicales, la Villa Amaryllis vous invite à un séjour d'exception."*

Editorial, sensory, restrained. The brand writes like a hotel concierge or a 1960s tourism brochure — never like a marketplace listing. Descriptions are full paragraphs in Cormorant Garamond, not bullet lists. Bullets are reserved for **"Informations pratiques"** (practical details: check-in time, pets, deposit).

- **Person:** `vous` (formal "you") — never `tu`. The host is `nous` ("Notre équipe est joignable 24h/24"). Never first-person singular.
- **Capitalization:** Sentence case in body. **Uppercase + heavy tracking (0.1–0.5em)** for display/eyebrows. Property names are proper-cased ("Villa Amaryllis", "Zandoli", "Géko") — never all-caps in body.
- **Numbers & money:** French formatting — `1 500 €`, `4,94`, `12 €/nuit`. Use the Unicode space + euro suffix.
- **Punctuation:** French em-dashes — used liberally as parentheticals — set off with hair spaces. Ellipsis with `…` not `...`. Apostrophes typographic (`'`).

### Vocabulary

| Use | Don't use |
|---|---|
| séjour, voyageurs, hôte | guests/clients, customers |
| location, bien, villa | property, unit, asset |
| réservation directe | "book now" |
| ménage, linge de maison | cleaning, linens |
| à partir de 280€/nuit | from $280/night |
| ★ 4,94 · 33 avis | 4.94/5 stars |

### Emoji

**Minimal and purposeful.** Emoji are used in three contexts only:

1. **Country flags** in reviews (`🇫🇷 🇬🇧`) — identity marker.
2. **One leading emoji per dashboard tab** in the admin (`📅 Planning`, `🎯 Cockpit`, `🔮 Prévisionnel`). Never decorative — they function as the tab icon.
3. **Property emoji** as informal shorthand on the owner side only (`🌴` for Amaryllis, `🦎` for Iguana). Internal — never on the public site.

The public site uses NO emoji in marketing copy. Star ratings use the `★` glyph, not 🌟.

### CTA copy

- Primary action: short, present-tense, uppercase + tracking. `RÉSERVER` · `CONTACT` · `DÉCOUVRIR`.
- Secondary action: lowercase + arrow. `← Retour` · `← Accueil` · `Voir →`
- Trust copy near CTAs is small, italic Cormorant: *"🔒 Paiement sécurisé par Stripe"*, *"✓ -15% en réservation directe"*.

### Example specimens (lift directly)

> **Section eyebrow:** `LOCATIONS D'EXCEPTION` (10px, weight 200, tracking 0.55em, coral)
>
> **Section title:** `VILLA AMARYLLIS` (28px, weight 200, tracking 0.12em, navy)
>
> **Description:** *Perchée sur les hauteurs de Sainte-Luce, bercée par les alizés et le parfum des fleurs tropicales…* (Cormorant italic, 17px, line-height 1.85)
>
> **Footer accent:** *"Locations d'exception"* (Cormorant italic, gold)

---

## VISUAL FOUNDATIONS

### Two palettes, one type system

| Token | Site | Admin |
|---|---|---|
| Page background | `#faf5e9` ivory | `#0a0f1e` deep slate |
| Surface | `#ffffff` / `#f4ecdc` cream | `#0f172a` panel |
| Primary ink | `#0e3b3a` antillean teal | `#f1f5f9` white-slate |
| Accent / CTA | `#c47254` muted coral | `#0ea5e9` info cyan |
| Borders | `#e0d4bc` sand | `rgba(255,255,255,0.08)` |
| Gold (accents only) | `#c9a673` | — |

### Typography — Jost + Cormorant Garamond

- **Jost** carries everything that is **UI** or **display**. Weights 200/300/400/500/600/700 are all in active use. The hallmark is **ultra-thin Jost 200 in uppercase with 0.12–0.45em letter-spacing** for hero titles and section labels. Numbers in admin use Jost 700, mono-flavored.
- **Cormorant Garamond** carries everything **editorial**: paragraph descriptions, italic taglines, review quotes, FAQ answers. Always italic in display use, regular in long-form. Weight 400/600.
- **JetBrains Mono** (or system mono) is used in the admin dashboard for numerals, KPI values, and code-like data.

Fonts are loaded from Google Fonts — no `.ttf` files ship in the codebase. **No local font files have been copied; if production needs self-hosting, the user must supply them.**

### Backgrounds

- Site default is flat **ivory `#faf5e9`** — never gradient. Cards sit on it at full white or cream.
- The **hero is a full-bleed photo** (always the villa, always shot in golden hour / warm cool-shadow daylight, never B&W, never grainy). Photos carry a slight teal undertone — the brand's photographic identity is *blue water + warm wood + ivory walls*.
- Section breaks are often a band of `--c-navy` with cream text reversed — used for footers, contact, and "détail" overlays.
- **No repeating patterns or hand-drawn illustrations.** No noise, no grain. The only graphic motif is the **six-petal amaryllis flower** in the favicon, used sparingly as a loading indicator and footer mark.
- Admin background is solid `#0a0f1e` with a subtle faint dot grid (3px on 24px) suggested by `canvas-philosophy.md` but rarely shown — most panels are flat slate.

### Borders & dividers

- 1px hairlines in `--c-sand` (`#e0d4bc`) on site, `rgba(255,255,255,0.08)` on admin.
- **No outer borders on cards** unless on a same-color background. Hover state often *adds* a coral-shifted border — never removes border.
- Dividers between sections are a thin horizontal rule in sand, or visual whitespace (`--space-9`).

### Shadows

- Site: very soft, low-contrast, teal-tinted. `0 2px 16px rgba(14,59,58,0.06)` resting; `0 20px 48px rgba(14,59,58,0.12)` on hover. **Never gray** — always tinted with the navy ink.
- CTA shadows are **coral-tinted**: `0 4px 18px rgba(196,114,84,0.30)` — a pulse-glow used on the primary "RÉSERVER" button.
- Admin: minimal shadows; relies on `rgba(255,255,255,0.03)` panel backgrounds for depth instead.

### Corner radii

| Element | Site | Admin |
|---|---|---|
| Photo card | `16px` | `12–14px` |
| Modal | `16px` | `14px` |
| Pill button / badge | `999px` | `999px` |
| Form input | `8–10px` | `8px` |
| CTA button | `5–6px` (intentionally sharp) | `8px` |
| Avatar | `50%` circle | `50%` |

The site uses **two scales simultaneously**: sharp 5–6px on primary CTAs to feel "editorial / hotel signage", and softer 12–16px on cards. This is intentional — flag for the user if changing.

### Layout rules

- Site: max-width container is roughly **1200px** centered, with `--space-6` (24px) gutters. Hero is full-bleed (`100vw`).
- Site uses a **sticky top bar** (`56px` tall, `--c-navy` background) for property detail pages with: back arrow / property name centered / primary CTA right.
- Admin: full-bleed dashboard, tabs as horizontal segmented control at top, content in `--bg-2` panels with `12–18px` padding.
- Grids: `repeat(auto-fill, minmax(300px, 1fr))` for property cards; `repeat(2, 1fr)` for KPI strips on mobile, `repeat(4, 1fr)` on desktop.

### Animation & motion

- Animations are **soft and slow**, never bouncy. Easing is `cubic-bezier(0.23, 1, 0.32, 1)` (~`expo.out`) — generous deceleration.
- Common patterns: `fadeUp` (24px Y-translation + opacity, 600ms), `slideInRight/Left` (28px X), `shimmer` skeleton (1.4s linear). Carousels auto-advance every 5s with a thin coral progress bar.
- Hover: card lifts `translateY(-4px)` and shadow deepens. **No scale.** Subtle 400ms transition.
- Press: opacity to ~0.85; on CTA, no shrink — the coral pulse animates instead (`ctaPulse` keyframes).
- The site has a branded **opening curtain** (`Curtain` component) — full-screen navy with the amaryllis flower mark spinning, then lifts up — used on first visit only.

### Transparency & blur

Used sparingly. Two recognised places:

1. **Photo overlay tags** on hero — `rgba(14,59,58,0.65)` background with `backdrop-filter: blur(6px)` for "Coup de cœur" badges and rating chips.
2. **Top bar over photo** — solid `--c-navy`, no blur.

The dashboard rarely uses blur; transparent panels use flat `rgba(255,255,255,0.03)` instead.

### Imagery color vibe

**Warm, lived-in, golden-hour.** Every property photo is shot:

- Wide open aperture, natural daylight
- Saturation slightly boosted but not heavy
- Slight magenta lift in shadows (Caribbean late afternoon)
- Furniture is **natural wood + cream linen + tropical green plants** — never grey/minimalist
- Pool shots emphasise the **teal water + sand stone deck + horizon**

There is a `retouch_photos.py` script in the original repo that batch-processes the library; the look is intentional and consistent.

### Card pattern (canonical)

```
┌────────────────────────────────┐
│  ┌──────────────────────────┐  │   16px radius, white background,
│  │   Full-bleed photo       │  │   1px sand border,
│  │   3:2 ratio              │  │   shadow-1 resting / shadow-2 hover,
│  │   [carousel arrows]      │  │   translateY(-4px) on hover.
│  └──────────────────────────┘  │
│  ZANDOLI               ★ 4,94  │   Jost 500 / 14px navy + gold star
│  Sainte-Luce, Martinique       │   Jost 300 / 12px muted
│  À partir de 220€/nuit         │   Coral price chip
└────────────────────────────────┘
```

### Component vocabulary

| Component | Vibe |
|---|---|
| Buttons | Sharp 5–6px corners, uppercase + 0.12em tracking, coral fill or navy outline |
| Form inputs | Soft 8–10px corners, ivory fill, sand border, coral on focus |
| Badges / chips | Pill, cream fill, sand border, Jost 300 |
| Modals | 16px radius, full overlay `rgba(14,59,58,0.6)` backdrop |
| Calendar | Grid of 28×28 cells; available = ivory, booked = sand stripe, selected = coral |
| Dashboard panels | Translucent `rgba(255,255,255,0.03)` slates, 12–14px radius |

---

## ICONOGRAPHY

The brand is **icon-light**. Most "icons" are typography or unicode — there is **no proprietary icon font** and **no large SVG sprite** in the codebase.

### What's actually used

1. **The amaryllis flower mark** (`assets/logo.svg`) — six coral petals on cream, with a small island silhouette in the bottom half. Used as favicon, app icon, loading spinner. This is the *only* proprietary brand glyph.
2. **A tiny social/utility sprite** (`assets/icons.svg`, lifted from the codebase's `/public/icons.svg`) — symbols for Bluesky, Discord, GitHub, Twitter/X, social, documentation. Bundled but rarely surfaced in the actual public site.
3. **Inline SVG primitives drawn at usage site** — a few custom SVGs for the `Gauge`, `Spark`, and the curtain petals. They are simple geometric SVGs (`<circle>`, `<polyline>`, `<path d="M …">`). Never imported from a library.
4. **Unicode glyphs as icons** — heavy use. `★` for ratings, `←` `→` for navigation, `✓` for confirmation, `🔒` for security, `…` for ellipsis. The dashboard tabs also use one emoji each as the tab icon.
5. **No Lucide / Heroicons / Feather**. If you need an iconic UI element (search, chevron, calendar, user), draw it as inline SVG in the codebase's house style — 1.5px stroke, rounded line caps, no fill.

### Substitution policy

For Claude-generated artifacts that need iconography this system doesn't provide, the recommended fallback is **Lucide** (`https://unpkg.com/lucide-static@latest/icons/<name>.svg`) — 1.5px stroke, rounded caps, fills via `currentColor`. It matches the codebase's hand-drawn SVG style without claiming to be an Amaryllis-owned set. **Flag any Lucide use to the user** as a substitution.

### Recommended usage rules

- Don't introduce filled iconography — the brand reads as line-art.
- Limit icons to 16–20px in UI. Avoid icon-with-label combos on the site (it goes for editorial labels alone). Acceptable in the admin dashboard.
- Property emojis (`🌴 🦎 🌊 🏠`) are **internal-only** — never on the public site.
- Country flags (`🇫🇷 🇬🇧`) are the **only emoji** that appear on the public site, and only inside review attribution.

---

## Index — files in this system

| Path | What it is |
|---|---|
| `README.md` | This file |
| `MIGRATION.md` | **Step-by-step guide** to port this system into `locatif-dashboard/` |
| `SKILL.md` | Agent Skill manifest — point Claude Code at this folder |
| `voice.md` | **Copy & tone library** — 30+ phrase types in FR/EN by context |
| `colors_and_type.css` | All design tokens — palette, type, spacing, shadows, breakpoints, container utility |
| `assets/logo.svg` | Six-petal amaryllis flower mark (favicon SVG) |
| `assets/icons.svg` | **21-symbol icon sprite** — line-art, stroke 1.5, currentColor |
| `assets/icon-192.png`, `icon-512.png` | App icons |
| `assets/photos/` | Sampled WebP photo library (one per property) |
| `reference/canvas-philosophy.md` | The owner's *Cartographie de Flux* design philosophy |
| `reference/CONTEXT.md` | Original business + product handoff doc |
| `preview/*.html` | Self-contained Design System cards (registered as review assets) |
| `ui_kits/site/` | Marketing-site UI kit — Curtain, Calendar, ThemeToggle, components, demo |
| `ui_kits/admin/` | Admin dashboard UI kit — Cockpit, Planning, Cartographie de Flux |

### Quick start — use the system

```html
<link rel="stylesheet" href="/colors_and_type.css">

<!-- site / marketing surface (default) -->
<body data-surface="site">
  <h1 class="h1">Villa Amaryllis</h1>
  <p class="editorial">Perchée sur les hauteurs de Sainte-Luce…</p>
</body>

<!-- admin / dashboard surface -->
<body data-surface="admin">
  <span class="label-tiny">CA YTD</span>
  <span class="kpi-value">71,8k€</span>
</body>
```

To explore deeper, browse the original repository linked above — components are far more featureful, and the photo + content library is much larger than the sample copied here.
