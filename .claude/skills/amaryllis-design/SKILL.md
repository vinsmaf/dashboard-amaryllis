---
name: amaryllis-design
description: Use this skill to generate well-branded interfaces and assets for Amaryllis Locations (villamaryllis.com — a portfolio of seven holiday rentals in Martinique and the Paris suburbs), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping both the warm marketing site and the dark "Cartographie de Flux" admin dashboard.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Decide which surface first

Amaryllis has **two distinct visual surfaces** that share typography but otherwise look nothing alike:

- **`site`** — `villamaryllis.com` marketing/booking pages. Warm ivory background, antillean teal ink, coral CTAs, editorial Cormorant italic descriptions. *Default if unclear; this is the public-facing brand.*
- **`admin`** — the owner-operator dashboard at `/admin`. Dark slate canvas, mono numerals, status-coded property colors, Recharts-driven data viz. Inspired by `reference/canvas-philosophy.md` ("Cartographie de Flux").

Set the surface with a body attribute: `<body data-surface="site">` or `<body data-surface="admin">`. All tokens are scoped accordingly.

## Always do these things

1. **Pull in `colors_and_type.css`** — never hand-roll hex codes or font stacks; use the CSS variables (`var(--c-coral)`, `var(--c-navy)`, etc).
2. **Lift, don't invent, copy** — the brand voice is French-first, formal-`vous`, editorial. Don't write marketing copy in casual English unless explicitly asked.
3. **Use real photos** — `assets/photos/` has one image per property. The brand is photo-forward; do not draw placeholder SVG art instead.
4. **Match the type pairing** — Jost (display, UI) + Cormorant Garamond (editorial italic) + JetBrains Mono (admin numerals).
5. **Look at the `ui_kits/`** first — `site/` and `admin/` each have an `index.html` plus factored components. Lift these rather than re-deriving from `colors_and_type.css`.
