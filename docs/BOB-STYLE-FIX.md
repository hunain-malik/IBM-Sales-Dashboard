# Follow-up prompt — apply the design system (styling fix)

The first build got the mechanics right but shipped **unstyled**. Copy everything below the
line into BOB as a follow-up prompt.

---

The app you built works mechanically, but no stylesheet is being applied: the nav renders as a
bulleted list of links, text is in a serif font, buttons are native browser buttons, "dark
mode" only darkens the background so text becomes unreadable, chart labels overlap, and the
modal floats unstyled over the page. All of these are one root cause: **the IBM Carbon Design
System styles and the app's custom stylesheet are not loaded.** Fix it as follows — do not
restyle by hand with ad-hoc CSS; load the real design system.

## 1. Dependencies and entry wiring

`package.json` must include: `@carbon/react` (which brings `@carbon/styles`),
`@carbon/icons-react`, `react`, `react-dom`, `react-router-dom`, and the dev dependency
`sass-embedded` (Vite compiles `.scss` automatically when it is present).

The app entry (`src/main.jsx`) must import the stylesheet FIRST — if this import is missing or
fails to compile, you get exactly the unstyled result you produced:

```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.scss'
import App from './App.jsx'
import { StoreProvider } from './data/store.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </React.StrictMode>,
)
```

## 2. Use the real Carbon components, not raw HTML

The current build renders raw HTML elements. Replace them with `@carbon/react` components —
their appearance comes from the stylesheet you are now loading:

- **App shell**: `Header` + `SkipToContent` + `HeaderName` (prefix "IBM", text "GTM Pipeline
  View") + `HeaderNavigation` with `HeaderMenuItem`s ("Pipeline View", "Enablements", "Deals")
  + `HeaderGlobalBar` with two `HeaderGlobalAction`s (reset = `Renew` icon, theme toggle =
  `Asleep`/`Light` icon). The header must be wrapped in `<Theme theme="g100">` so it is ALWAYS
  the black 3rem bar with white text, in both app themes. The page content is wrapped in
  `<Theme theme={theme}>` + Carbon `<Content>`.
- **Buttons**: Carbon `Button` (`kind="primary" | "tertiary" | "ghost"`) and `IconButton` for
  the row edit/delete actions — never `<button>` with default styling.
- **Tables**: Carbon `Table`/`TableHead`/`TableRow`/`TableHeader`/`TableBody`/`TableCell`,
  size `md`, inside the flush `.table-card` container.
- **Tags**: Carbon `Tag` (`size="sm"`) for stages, "GTM touched", "Scheduled", and the
  coverage verdicts.
- **Modals**: Carbon `Modal` with `modalHeading`, `modalLabel`, primary/secondary buttons —
  it must render as a centered dialog over a dimmed overlay, never inline over the table.
- **Form controls**: Carbon `TextInput`, `NumberInput`, `Dropdown`, `DatePicker` +
  `DatePickerInput`.

## 3. Theme wiring (fixes the broken dark mode)

Dark mode currently paints the background dark while text stays dark — because colors are
hardcoded. Rule: **components never hardcode text/background/border colors.** All neutral
colors come from Carbon theme tokens, which flip automatically inside `<Theme>`:
`var(--cds-text-primary)`, `--cds-text-secondary`, `--cds-text-helper`, `--cds-layer-01`,
`--cds-layer-02`, `--cds-layer-hover-01`, `--cds-border-subtle-01`, `--cds-link-primary`,
`--cds-background`, `--cds-background-inverse`, `--cds-text-inverse`, `--cds-focus`. The store
mirrors the theme to `document.documentElement.dataset.carbonTheme`, which the stylesheet uses
to set the body background (`#ffffff` light / `#161616` dark). The ONLY hardcoded hexes allowed
are the ones in the spec: the five use-case pairs, the accent pair `#0f62fe`/`#4589ff`, the
context grays `#a8a8a8`/`#6f6f6f`, neutral `#8d8d8d`, and the always-light one-pager palette.

## 4. Typography

Everything must render in **IBM Plex Sans** (the Carbon default) — loading Carbon with
`$use-akamai-cdn: true` (first lines of the stylesheet below) pulls the font from IBM's CDN.
Quick self-check: if ANY text on the page renders in a serif font, the stylesheet did not
load — stop and fix that before anything else.

## 5. Chart label overlap

In your build, "Current month" and the bar's "$275K" label render on top of each other. The
monthly chart's vertical layout is fixed (viewBox 1160×230): the "Current month" tag is
centered at **y = 10**; bars rise no higher than **y = 30**; each bar's value label sits at
**y = (barTop − 8)**; month labels sit at **y = (baseline + 22)** where baseline = 230 − 32.
Those four bands never collide. The same principle applies to the timeline and the glossary
diagram: use the exact coordinates from the original spec, and never place two text elements
at the same x/y.

## 6. The complete stylesheet — use verbatim

Create `src/index.scss` with EXACTLY this content (it is Sass — the nested rules require the
Sass compiler from step 1). Do not reinterpret or "improve" it; it is the entire look of the
product: the card surfaces, the 1px hairline dividers, the KPI tiles, the calendar grid, the
comparison bars, the upcoming-session cards, the glossary layout, the tooltip, the one-pager
sheet, and the print rules.

```scss
@use '@carbon/react' with (
  $use-akamai-cdn: true
);

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background: #ffffff;
}

html[data-carbon-theme='g100'] body {
  background: #161616;
}

.app-theme {
  margin-top: 3rem; /* clear the fixed UI-shell header */
  min-height: calc(100vh - 3rem);
  background: var(--cds-background);
}

.app-content {
  max-width: 88rem;
  margin: 0 auto;
  padding: 2rem;
  background: transparent;
}

.page-header {
  margin-bottom: 1.5rem;

  h1 {
    font-size: 2rem;
    font-weight: 400;
    line-height: 1.25;
    margin: 0 0 0.25rem;
  }

  p {
    color: var(--cds-text-secondary);
    max-width: 40rem;
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0;
  }
}

.page-header--actions {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

/* KPI row of stat tiles */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 1px;
  margin-bottom: 1.5rem;
}

.kpi-tile {
  background: var(--cds-layer-01);
  padding: 1rem;
  min-height: 8.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.kpi-tile__label {
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  color: var(--cds-text-secondary);
}

.kpi-tile__value {
  font-size: 2.625rem;
  font-weight: 300;
  line-height: 1.1;
  color: var(--cds-text-primary);
}

.kpi-tile__detail {
  font-size: 0.75rem;
  color: var(--cds-text-helper);
}

/* Chart cards — full-width, stacked, so nothing needs a horizontal scrollbar */
.card-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: var(--cds-layer-01);
  padding: 1rem;
  min-width: 0;
  overflow-x: auto;
}

/* Use-case identity swatch — color + text, never color alone */
.uc-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  white-space: nowrap;
}

.uc-chip__dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 2px;
  flex: none;
}

/* Month calendar */
.cal {
  background: var(--cds-layer-01);
  padding: 1rem;
}

.cal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }
}

.cal__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--cds-border-subtle-01);
  border: 1px solid var(--cds-border-subtle-01);
}

.cal__dow {
  background: var(--cds-layer-01);
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
  text-align: left;
}

.cal__day {
  position: relative;
  background: var(--cds-layer-01);
  min-height: 5.75rem;
  padding: 0.375rem 0.5rem;
  text-align: left;
  border: none;
  cursor: pointer;
  font: inherit;
  color: var(--cds-text-primary);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: stretch;

  &:hover {
    background: var(--cds-layer-hover-01);
  }

  &:focus-visible {
    outline: 2px solid var(--cds-focus);
    outline-offset: -2px;
  }
}

.cal__day--pad {
  background: var(--cds-layer-02);
  cursor: default;

  &:hover {
    background: var(--cds-layer-02);
  }
}

.cal__daynum {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

.cal__day--today .cal__daynum {
  font-weight: 700;
  color: var(--cds-link-primary);
}

.cal__event {
  font-size: 0.6875rem;
  line-height: 1.3;
  padding: 0.125rem 0.375rem;
  border-left: 3px solid;
  background: var(--cds-layer-02);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cal__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin-top: 0.75rem;
}

.table-card {
  background: var(--cds-layer-01);
  min-width: 0;
  overflow-x: auto;
}

.empty-state {
  background: var(--cds-layer-01);
  padding: 3rem;
  text-align: center;
  color: var(--cds-text-secondary);

  h3 {
    font-weight: 400;
    margin: 0 0 0.5rem;
    color: var(--cds-text-primary);
  }

  p {
    margin: 0 0 1rem;
    font-size: 0.875rem;
  }
}

.impact-note {
  font-size: 0.75rem;
  color: var(--cds-text-helper);
  margin-top: 0.5rem;
}

.form-stack > * + * {
  margin-top: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

/* title inside a flush table card */
.section-title--table {
  padding: 1rem 1rem 0.25rem;
  margin: 0;
}

/* Comparison / coverage stat rows (shared by both panels) */
.cmp {
  max-width: 72rem; /* keep bars readable inside full-width cards */
}

.cmp__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  color: var(--cds-text-secondary);

  .uc-chip {
    font-size: 0.75rem;
  }
}

/* fixed label/verdict column widths so every row's bars start at the same x */
.cmp__row {
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr) 13rem;
  gap: 0.5rem 1rem;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid var(--cds-border-subtle-01);
}

.cmp__label {
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;

  /* long use-case names wrap inside their column instead of overlapping bars */
  .uc-chip {
    white-space: normal;
  }
}

.cmp__hint {
  font-size: 0.6875rem;
  color: var(--cds-text-helper);
}

.cmp__bars {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
}

.cmp__barline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cmp__bar {
  display: inline-block;
  height: 0.625rem;
  border-radius: 0 2px 2px 0;
  flex: none;
  max-width: calc(100% - 6rem);
}

.cmp__value {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
  white-space: nowrap;
}

.cmp__delta {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--cds-link-primary);
  text-align: right;
}

/* unfavorable deltas are stated, not hidden — in calm ink, not celebration blue */
.cmp__delta--adverse {
  color: var(--cds-text-secondary);
}

@media (max-width: 52rem) {
  .cmp__row {
    grid-template-columns: 1fr;
  }

  .cmp__delta {
    text-align: left;
  }
}

/* Methodology & glossary page */
.gl-promise {
  background: var(--cds-layer-01);
  border-left: 4px solid var(--cds-link-primary);
  padding: 1.5rem;
  margin-bottom: 1rem;
  max-width: 56rem;
}

.gl-promise__lead {
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.4;
  margin: 0;

  strong {
    font-weight: 600;
  }
}

/* Upcoming sessions strip (Pipeline View landing) */
.up-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 1rem;

  .section-title {
    margin-bottom: 0;
  }
}

.up-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
  gap: 0.75rem;
}

.up-card {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--cds-layer-02);
  border: 1px solid var(--cds-border-subtle-01);
  border-left-width: 3px; /* border-left-color set inline per use case */
  min-width: 0;
}

.up-card__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 2.75rem;
}

.up-card__day {
  font-size: 1.5rem;
  font-weight: 300;
  line-height: 1.1;
}

.up-card__month {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cds-text-secondary);
}

.up-card__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  min-width: 0;
}

.up-card__title {
  font-weight: 600;
  font-size: 0.875rem;
}

.up-card__meta {
  font-size: 0.75rem;
  color: var(--cds-text-helper);
}

.up-empty {
  font-size: 0.875rem;
  color: var(--cds-text-secondary);
  margin: 0;
}

.gl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 0.75rem;
}

.gl-card {
  background: var(--cds-layer-02);
  border: 1px solid var(--cds-border-subtle-01);
  padding: 1rem;

  h5 {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 0.375rem;
  }

  p {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--cds-text-secondary);
    margin: 0;
  }
}

.gl-metrics {
  max-width: 64rem;
}

.gl-metric {
  display: grid;
  grid-template-columns: 16rem minmax(0, 22rem) 1fr;
  gap: 0.5rem 1.5rem;
  align-items: baseline;
  padding: 0.75rem 0;
  border-top: 1px solid var(--cds-border-subtle-01);
}

.gl-metric__name {
  font-size: 0.875rem;
  font-weight: 600;
}

.gl-metric__formula {
  font-family: 'IBM Plex Mono', 'Menlo', monospace;
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
  background: var(--cds-layer-02);
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  justify-self: start;
}

.gl-metric__note {
  font-size: 0.8125rem;
  color: var(--cds-text-helper);
}

@media (max-width: 60rem) {
  .gl-metric {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}

.gl-conventions {
  margin: 0;
  padding-left: 0;
  list-style: none; /* flush with the section title, no bullet indent */

  li {
    font-size: 0.875rem;
    line-height: 1.55;
    color: var(--cds-text-secondary);
  }

  li + li {
    margin-top: 0.625rem;
  }
}

/* Influence timeline: legend + quarter navigation */
.tl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.tl-head__nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: none;
}

.tl-head__label {
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 4.5rem;
  text-align: center;
}

.tl-empty {
  color: var(--cds-text-secondary);
  font-size: 0.875rem;
  padding: 2rem 0;
  text-align: center;
}

/* Influence timeline tooltip */
.tl-tip {
  position: absolute;
  z-index: 20;
  background: var(--cds-background-inverse);
  color: var(--cds-text-inverse);
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  line-height: 1.45;
  max-width: 20rem;
  width: max-content;
  pointer-events: none;
  border-radius: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

  strong {
    display: block;
    margin-bottom: 0.125rem;
  }
}

/* Executive one-pager */
.op-wrap {
  min-height: calc(100vh - 3rem);
  background: var(--cds-layer-02);
  padding: 1.5rem 1rem 3rem;
}

.op-toolbar {
  max-width: 56rem;
  margin: 0 auto 1rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.op {
  max-width: 56rem;
  margin: 0 auto;
  background: #ffffff;
  color: #161616;
  padding: 2.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);

  h1 {
    font-size: 1.75rem;
    font-weight: 400;
    margin: 0.25rem 0 0;
  }

  h2 {
    font-size: 1rem;
    font-weight: 600;
    margin: 1.75rem 0 0.75rem;
    border-bottom: 2px solid #0f62fe;
    padding-bottom: 0.375rem;
  }
}

.op__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1.25rem;
}

.op__brand {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #525252;
}

.op__date {
  font-size: 0.875rem;
  color: #525252;
}

.op__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.op__kpi-value {
  font-size: 1.75rem;
  font-weight: 300;
  line-height: 1.15;
}

.op__kpi-label {
  font-size: 0.75rem;
  color: #525252;
  margin-top: 0.25rem;
}

.op__cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 2rem;
}

@media (max-width: 42rem) {
  .op__cols {
    grid-template-columns: 1fr;
  }
}

.op__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;

  th {
    text-align: left;
    font-weight: 600;
    padding: 0.375rem 1.25rem 0.375rem 0;
    border-bottom: 1px solid #c6c6c6;
    color: #525252;
  }

  td {
    padding: 0.5625rem 1.25rem 0.5625rem 0;
    border-bottom: 1px solid #e0e0e0;
    vertical-align: top;
  }
}

.op__num {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.op__num--right {
  text-align: right;
  padding-right: 1rem !important;
}

.op__sub {
  font-size: 0.6875rem;
  color: #525252;
  margin-top: 0.125rem;
}

/* fixed column proportions so the deals table never squeezes */
.op__table--deals {
  table-layout: fixed;

  td {
    overflow-wrap: break-word;
  }
}

.op__num--accent {
  color: #0f62fe;
  font-weight: 600;
}

.op__callout {
  font-size: 0.8125rem;
  background: #edf5ff;
  border-left: 3px solid #0f62fe;
  padding: 0.625rem 0.75rem;
  margin: 0.75rem 0 0;

  ul {
    margin: 0.375rem 0 0;
    padding: 0;
    list-style: none;
  }

  li + li {
    margin-top: 0.25rem;
  }
}

.op__verdict {
  font-size: 0.8125rem;
  line-height: 1.5;
  margin: 0 0 0.625rem;

  em {
    color: #525252;
  }
}

.op__foot {
  margin-top: 2rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.6875rem;
  color: #525252;
  line-height: 1.5;
}

/* Print: only the one-pager sheet, exact colors, no app chrome */
@media print {
  .cds--header,
  .no-print {
    display: none !important;
  }

  .app-theme,
  .app-content,
  .op-wrap {
    margin: 0;
    padding: 0;
    max-width: none;
    background: #ffffff;
    min-height: 0;
  }

  .op {
    max-width: none;
    box-shadow: none;
    padding: 0;
  }

  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* keep table rows and section headings intact across page breaks */
  .op__table tr {
    break-inside: avoid;
  }

  .op h2 {
    break-after: avoid;
  }

  .op__kpis,
  .op__callout {
    break-inside: avoid;
  }

  @page {
    margin: 1.25cm;
  }
}
```

## 7. Acceptance — the build is not done until ALL of these pass

1. No serif text anywhere; everything is IBM Plex Sans.
2. The header is a fixed 3rem black bar: "IBM **GTM Pipeline View**" at the left, the three
   tabs inline beside it (active tab underlined blue), two icon buttons at the far right. It
   stays black in light mode.
3. KPI tiles are flat gray cards (`#f4f4f4`-family layer on white; `#262626` on `#161616` in
   dark) separated by 1px hairline seams, values in large thin type (2.625rem, weight 300).
4. Dark mode: page `#161616`, cards `#262626`, text near-white — every word legible. Light
   mode: white page, light-gray cards, near-black text. Toggling flips everything, including
   chart inks and the calendar.
5. Buttons look like Carbon buttons (primary = solid blue `#0f62fe`, tertiary = blue outline,
   ghost = borderless blue text).
6. The add/edit modals open centered over a dimmed overlay with styled inputs.
7. No text overlaps anywhere: monthly chart ("Current month" above the value label), timeline
   deal labels (two-track collision rule), glossary diagram.
8. Comparison and coverage rows: every row separated by a 1px divider, all bars starting at
   the same x, bar colors accent-blue vs context-gray.
9. The calendar is a bordered 7-column grid with 1px cell dividers, layer-02 padding days, and
   session chips with a 3px colored left border.
10. Tags render as Carbon tags (rounded, tinted): stage colors, purple "GTM touched", blue
    "Scheduled", blue/green/gray coverage verdicts.
