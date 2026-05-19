# Handoff — locatif-dashboard React App

**Date**: 2026-05-16  
**Project**: locatif-dashboard (React + Google Apps Script)  
**Status**: Three interconnected fixes in progress (planning complete, implementation pending)

---

## Overview

Three bugs/features need fixes:

1. **OCC Scale Mismatch** — Occupancy stored as 0-100% in SEED_BIENS but 0-1 decimal in SCRIPT_SHEETS.gs synced data. After sync, Gauge + stat displays break silently.
2. **HIST Hardcoded** — Historical revenue data (2022-2025) is a hardcoded `const HIST` object. Should be reactive state synced from Google Sheets.
3. **Canvas Design** — Create a visual art piece ("Cartographie de Flux") inspired by rental portfolio data.

All three are scoped, designed, and ready to implement.

---

## Fix 1: OCC Consistency

### Problem
- `SEED_BIENS` stores occupancy as `occ: [64.5, 71.2, ...]` (0-100 percentage)
- `SCRIPT_SHEETS.gs` returns `occ` as `[0.645, 0.712, ...]` (0-1 decimal) due to `.map(v => v / 100)` at line 59
- After sync, Gauge and stat displays show ~0.64 instead of ~64%, breaking UI silently

### Solution

**Step 1: SCRIPT_SHEETS.gs (line 59)**
- Remove `.map(v => v / 100)` from the `occ` field
- Return raw percentage (0-100 to match SEED_BIENS)
- **User must manually redeploy Apps Script after this change**

**Step 2: App.jsx `syncFromSheets` (~line 281)**
- Add defensive normalization to handle both old (0-1) and new (0-100) deployed script:
  ```js
  occ: (found.occ || b.occ).map(v => v > 1.5 ? v : v * 100),
  ```
- Logic: any value > 1.5 is already a percentage; ≤ 1.5 means it's a decimal → multiply by 100

### Files
- `/Users/vincentsalomon/locatif-dashboard/SCRIPT_SHEETS.gs` (line 59)
- `/Users/vincentsalomon/locatif-dashboard/src/App.jsx` (line ~281)

---

## Fix 2: Historical Data from Google Sheets

### Problem
Historical revenue data (2022–2025) is hardcoded as `const HIST` inside App.jsx. It should be:
- Read from Google Sheets (multiple year tabs)
- Synced reactively via `syncFromSheets`
- Managed as component state, not a global constant

### Solution

**Step 1: SCRIPT_SHEETS.gs**
Add a new `readHist_()` function:
- Try tab names: `"revenus locatif 2025"`, `"revenus locatif 2024"`, `"revenus locatif 2023"`, `"revenus locatif 2022"`
- For each year found: read revenue per property (using BIENS_MAP row indices, cols C-N)
- Compute total as sum of all properties
- Return as structured JSON:
  ```json
  {
    "hist": {
      "2022": { "total": [...], "nogent": [...], ... },
      "2023": { "total": [...], "nogent": [...], ... },
      "2024": { "total": [...], "nogent": [...], ... },
      "2025": { "total": [...], "nogent": [...], ... }
    }
  }
  ```
- Include in the response sent to App.jsx

**Step 2: App.jsx — Convert HIST constant to state**
- Rename current `const HIST = { ... }` → `const HIST_SEED = { ... }` (keep as fallback)
- Add state hook: `const [hist, setHist] = useState(HIST_SEED)`
- Pass `hist` prop to `Previsionnel` and `Historique` components
- Both components: use `hist` prop instead of global `HIST` constant

**Step 3: App.jsx `syncFromSheets` function**
- Accept optional `data.hist` from the response
- If received: `setHist(prev => ({ ...prev, ...f.hist }))`
- Return `hist` field alongside existing `biens` and `moisActifs`

**Step 4: Update affected components**
- **Previsionnel** (~line 1088): Add `hist` prop, update HIST references at lines 1093, 1112, 1116, 1117
- **Historique** (~line 1237): Add `hist` prop, update HIST references at lines 1255–1268, 1274

### Files
- `/Users/vincentsalomon/locatif-dashboard/SCRIPT_SHEETS.gs`
- `/Users/vincentsalomon/locatif-dashboard/src/App.jsx`
  - ~line 281: `syncFromSheets` function
  - ~line 1088: `Previsionnel` component
  - ~line 1237: `Historique` component

---

## Fix 3: Canvas Design

### Concept
**"Cartographie de Flux"** — Financial flows visualized as geographic/territorial mapping. 7 properties positioned spatially (Martinique coast + Paris), revenue arcs proportional to 2025 data, dark dashboard aesthetic with tropical warmth accents.

### Output
- **Image**: `/Users/vincentsalomon/locatif-dashboard/canvas-design.png`
- **Philosophy**: `/Users/vincentsalomon/locatif-dashboard/canvas-philosophy.md`

### Implementation
Python script using matplotlib + PIL:
- Dark background: `#0a0f1e`
- 7 nodes: properties positioned in spatial layout (geographic Martinique + Paris locations)
- Revenue arcs: width/opacity proportional to 2025 revenues
- Colors: per-property colors from dashboard BIEN_COLORS
- Fonts:
  - `GeistMono-Bold` for numbers
  - `BricolageGrotesque` for labels
  - `CrimsonPro-Italic` for titles
- Annotations: property names (minimal), annual revenue per node, year "2026", total revenue as typographic anchors

### Files
- `/Users/vincentsalomon/locatif-dashboard/canvas-design.png` (generated)
- `/Users/vincentsalomon/locatif-dashboard/canvas-philosophy.md` (design philosophy)

---

## Execution Order

1. **Modify SCRIPT_SHEETS.gs**
   - Remove `.map(v => v / 100)` from `occ` field (line 59)
   - Add `readHist_()` function to read revenue data from year tabs (2022–2025)
   - Verify function returns properly formatted JSON

2. **Redeploy Apps Script**
   - User must manually deploy updated script in Google Apps Script editor
   - This is required for the new occ values and hist data to sync

3. **Fix App.jsx `syncFromSheets`**
   - Add defensive occ normalization: `occ: (found.occ || b.occ).map(v => v > 1.5 ? v : v * 100),`
   - Update function to handle optional `data.hist` response
   - Call `setHist()` if hist data is received

4. **Convert HIST constant to state**
   - Rename `const HIST` → `const HIST_SEED`
   - Add `const [hist, setHist] = useState(HIST_SEED)`
   - Update `Previsionnel` component: add `hist` prop, replace HIST references (lines 1093, 1112, 1116, 1117)
   - Update `Historique` component: add `hist` prop, replace HIST references (lines 1255–1268, 1274)

5. **Verify build**
   - Run `npm run build`
   - Ensure 0 errors and 0 warnings

6. **Manual testing**
   - Trigger sync in browser dev tools
   - Verify occ values display correctly (~64%, not ~0.64%)
   - Check Historique tab renders with seed data (or synced if available)
   - Verify Gauge and stat displays work without silent failures

7. **Create canvas design**
   - Write Python script using matplotlib + PIL
   - Generate canvas-design.png with spatial layout, revenue arcs, typography
   - Document design philosophy in canvas-philosophy.md

8. **Inform user**
   - Remind user to redeploy Apps Script if not already done
   - Canvas design is ready for review

---

## Critical Files

| File | Line(s) | Change |
|------|---------|--------|
| `SCRIPT_SHEETS.gs` | 59 | Remove `.map(v => v / 100)` |
| `SCRIPT_SHEETS.gs` | — | Add `readHist_()` function |
| `App.jsx` | ~281 | Defensive occ normalization in `syncFromSheets` |
| `App.jsx` | ~1088–1237 | Convert HIST → state, update Previsionnel + Historique props |
| `App.jsx` | — | Add `const [hist, setHist] = useState(HIST_SEED)` |

---

## Verification Checklist

- [ ] SCRIPT_SHEETS.gs modified (occ fix + readHist function)
- [ ] Apps Script redeployed
- [ ] App.jsx `syncFromSheets` updated with defensive normalization
- [ ] HIST constant converted to state
- [ ] Previsionnel component receives and uses `hist` prop
- [ ] Historique component receives and uses `hist` prop
- [ ] `npm run build` passes with 0 errors
- [ ] Manual sync in browser shows correct occ values (~64%, not ~0.64%)
- [ ] Historique tab renders correctly
- [ ] Canvas design created and visually verified
- [ ] Canvas philosophy documented

---

## Notes for Next Person

- The threshold `v > 1.5` in occ normalization handles the transition gracefully. It's unlikely any real occupancy is exactly 1.5, so this is safe.
- HIST_SEED acts as a fallback if the Apps Script doesn't return hist data. Keep it as-is for robustness.
- If readHist_() doesn't find all years, that's OK—merge what it finds with the seed data.
- The canvas design is inspirational, not operational. It's a visual artifact for the portfolio.
- Redeploy must happen before testing—the old script will still send decimals for occ.

---

## Links

- Plan file: `/Users/vincentsalomon/.claude/plans/hidden-wobbling-parrot.md`
- Project context: `/Users/vincentsalomon/.claude/projects/-Users-vincentsalomon/memory/project_locatif_dashboard.md`
