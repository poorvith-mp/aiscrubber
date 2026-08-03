# Brand — Typography & Color Palette

Source of truth: his website's `design.md` (Tailwind-based design system). Apply this whenever producing visual output — slides, documents, social graphics, portfolio/website work, or carousel/design-tool prompts.

## Typography

Four font families, each with a specific job — don't mix their roles:

| Font | Family | Use for |
|---|---|---|
| Headline (`font-headline`) | Playfair Display (serif) | Titles, hero headings, section headers, key quote blocks |
| Body (`font-body`) | DM Sans / Plus Jakarta Sans (sans) | Paragraphs, article text, form inputs |
| Label (`font-label`) | Geist (sans) | Nav tabs, category pills, badges, buttons, uppercase tracking labels |
| Mono (`font-mono`) | Geist Mono | Handles (@username), dates, stats, code, technical specs |

**Size hierarchy** (use as a guide when a design prompt or mockup needs scale):
- Hero/display titles: 36–60px, headline font, bold, tight leading
- H1: 36–48px, headline font, bold, tight tracking
- H2: 24–30px, headline font, bold
- H3: 18–20px, headline font, bold
- Body: 16–18px, body font, relaxed leading, slate-700
- Small text/descriptions: 12–14px, body font, slate-600
- Badges/pills: 10–12px, label font, bold, uppercase, wide tracking
- Code/handles: 12–14px, mono font, emerald-700, bold

## Color Palette

**Neutrals (backgrounds, text, borders):**
- Dark primary: `#020617`, `#0f172a` — dark hero banners, primary buttons, dark-mode headers
- Light primary: `#f8fafc`, `#ffffff` — page backgrounds, cards, modals
- Borders/dividers: `#e2e8f0`, `#cbd5e1`
- Muted text: `#64748b`, `#475569` — secondary text, dates, footers

**Brand accent — Emerald (primary identity + success):**
- `#059669`, `#10b981` — primary CTAs, live/demo buttons, checkmarks
- `#ecfdf5`, `#065f46` — verified badges, active pills, success toasts
- This is the closest thing to "the" brand color — default to emerald as the primary accent when a design prompt doesn't call for a specific functional color.

**Functional/state colors:**
- Amber (warning/lock/category tags): `#d97706`, `#fffbeb`
- Red (danger/deletion/errors): `#dc2626`, `#fef2f2`
- Blue/Purple (code/tech badges): `#2563eb` / `#9333ea`

**Glassmorphism tokens** (for card/surface styling, e.g. website or app mockups):
- `.glass-surface`: `rgba(255,255,255,0.75)` background, `blur(28px)`, subtle white inset border
- `.glass-card-interactive`: `rgba(255,255,255,0.8)` background, `blur(20px)`, -6px hover lift, slate shadow

## Applying this to design-tool prompts (e.g. LinkedIn carousels)

When generating prompts for a design tool on his behalf, reference these by name/hex rather than generic terms — e.g. "emerald-600 (#059669) accent," "Playfair Display headline," "slate-950 dark background" — so the output actually matches his site rather than approximating a generic palette.
