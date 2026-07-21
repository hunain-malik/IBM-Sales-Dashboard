# Build prompt — IBM GTM Pipeline View

Copy everything below the line into the AI builder (BOB). It is a complete, self-contained
specification of the finished product — pages, exact wording, exact colors, spacing, divider
lines, chart geometry, data, and acceptance checks. Follow it literally.

---

Build a single-page web application called the **GTM Pipeline View**. It tracks the enablement
sessions a technical team delivers and the customer deals that follow them, side by side, for a
sales and executive audience. Every detail in this spec is deliberate — reproduce it exactly,
including the wording of every label, sentence, tooltip, and empty state.

## 0. Language rules (apply everywhere, no exceptions)

The app must never read as claiming credit for sales' deals. These rules override anything else:

- The product name is **"GTM Pipeline View"**. Never "impact dashboard", never "influence".
- A deal that follows a session is **"GTM-touched"**; its opposite is **"No GTM touch"** or
  "untouched". Never "influenced", "driven", "attributed", "thanks to", "because of us".
- Never include defensive disclaimers about credit ("not a claim of credit", "sales owns the
  deal", "not an attribution"). The app states what it counts, factually, and stops there.
  Transparency is delivered through a designed in-app Methodology & Glossary page (spec below),
  not through apologies.
- No marketing filler, no explanatory captions, no self-praise. Numbers do the talking. Titles
  are plain and informational, with the first letter of each significant word capitalized
  exactly as written in this spec.

## 1. Tech stack

- **React 19 + Vite**, IBM **Carbon Design System** via `@carbon/react` (v1.11x) and
  `@carbon/icons-react`. Sass for styles (`sass-embedded`); import Carbon with
  `@use '@carbon/react' with ($use-akamai-cdn: true);` so IBM Plex loads from the Akamai CDN.
- Two Carbon themes: **`white`** (light, default) and **`g100`** (dark), switchable at runtime.
- **No chart library.** Every chart is hand-rolled inline SVG to the geometry specs below.
- **Hash-based routing** (`react-router-dom` `HashRouter`) so it works on static hosting.
  Routes: `/` (Pipeline View, landing), `/enablements`, `/pipeline`, `/onepager`, `/glossary`,
  plus `/impact` as a legacy alias for `/`.
- **Persistence:** browser `localStorage`, one JSON document under a versioned key
  (`enablement-dashboard-data-v3`), written on every change, seeded with the demo dataset
  (section 12) on first load or if parsing fails. Theme is stored separately
  (`enablement-dashboard-theme`) and mirrored to `<html data-carbon-theme="...">`.

## 2. Architecture rule: total reactivity

ONE store (React context) holds `{ enablements[], deals[] }` plus the theme, and exposes
add/update/remove for both record types, `resetToDemo()`, and `clearAll()`. Every number, chart
mark, table row, sort position, tag, sentence, and recommendation on every page is **derived at
render time** from that store. Nothing is cached or duplicated. Adding, editing (including
changing dates), or deleting any record must propagate everywhere instantly — KPIs recompute,
comparisons recompute, tables re-sort into correct chronological position, chart bars/curves
update, coverage verdicts flip, the one-pager reflects it — and deleting reverts everything
exactly.

## 3. Data model

Enablement session: `{ id, title, useCase, date (ISO yyyy-mm-dd), presenter, attendees (number), hours (number — prep + delivery effort) }`
Deal: `{ id, customer, useCase, value (USD number), date (open date, ISO), stage, owner, closeDate? (ISO — exists only while stage is closed) }`

Stages (fixed list): Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost.
"Open" = the first four. Carbon tag color per stage: Prospecting & Qualification `cool-gray`,
Proposal & Negotiation `blue`, Closed Won `green`, Closed Lost `gray`.

Use cases are a FIXED list of five. Each owns a color pair chosen from the IBM Carbon data-viz
ramps and validated for color-vision-deficiency separation and 3:1 contrast on both themes.
Keep the hex values and the ORDER exactly; never assign these hues to anything that isn't a use
case; always pair color with a text label — never color alone.

| id | label | light hex | dark (g100) hex |
|---|---|---|---|
| vuln-mgmt | Vulnerability Management | `#6929c4` | `#8a3ffc` |
| secure-coder | Secure Coder | `#1192e8` | `#1192e8` |
| monitoring | Monitoring | `#b28600` | `#b28600` |
| optimization | Optimization | `#ee538b` | `#ee538b` |
| other | Other | `#198038` | `#198038` |

Non-use-case colors: accent blue `#0f62fe` light / `#4589ff` dark (used for "GTM-touched" bars,
Today marker, current-month tag); context gray `#a8a8a8` light / `#6f6f6f` dark (the
"No GTM touch" / coverage bars); neutral gray `#8d8d8d` (hollow not-counted deal rings, both
themes). Everything else uses Carbon theme tokens (`--cds-text-primary`, `--cds-text-secondary`,
`--cds-text-helper`, `--cds-layer-01`, `--cds-layer-02`, `--cds-border-subtle-01`,
`--cds-link-primary`, `--cds-background`, `--cds-background-inverse`, `--cds-text-inverse`) so
both themes are automatic. **Every divider/grid line in the app is 1px solid
`var(--cds-border-subtle-01)`.**

## 4. Core logic

### 4.1 The counting rule (attribution)

A deal is **GTM-touched** when at least one enablement session on the SAME use case was
delivered ON OR BEFORE the deal's open date. `matched` = all such sessions sorted date
ascending; **"first matching session"** = the earliest. Deals with no prior matching session are
explicitly NOT counted — and are always shown as excluded, never hidden.

### 4.2 Delivered vs. scheduled sessions

"Today" is computed as a LOCAL date string (yyyy-mm-dd built from local year/month/day — never
`toISOString()`, which is UTC and flips near midnight). A session with `date <= today` is
**delivered**; with `date > today` it is **scheduled**. Scheduled sessions appear ONLY in the
"Upcoming sessions" strip, the sessions table (tagged), and the calendar. They are excluded
from EVERY delivered total: session count, attendee count, hours, value-per-hour, and coverage
shares. They join those totals automatically once their date passes. (The matching rule itself
is date-based and unchanged.)

### 4.3 Fiscal calendar

IBM's fiscal year matches the calendar year, so fiscal quarters are calendar quarters
(Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec). Quarter labels render as "Q3 2026".
Quarter-paged charts navigate with chevrons bounded by [the earliest quarter containing any
data, the current quarter].

### 4.4 Derived metrics

- `wonRevenue` = Σ value of GTM-touched deals in Closed Won; `pipelineRevenue` = Σ value of
  GTM-touched deals in open stages.
- `valuePerHour` = (wonRevenue + pipelineRevenue) ÷ total DELIVERED session hours; null when
  hours total 0.
- Comparison (GTM-touched group vs. untouched group): win rate = won ÷ (won + lost); average
  deal size = mean value across the whole group (open + closed); average sales cycle = mean
  (closeDate − open date) in days over closed deals that have a closeDate. Any metric without
  enough data is null and displays "not enough data".
- Coverage per use case: demand share = use-case deal value ÷ all deal value; coverage share =
  use-case DELIVERED session hours ÷ all delivered hours (fall back to session-count share if
  no hours are recorded anywhere). Gap = demand share − coverage share. Only use cases with any
  activity appear, sorted by gap descending.

### 4.5 Insights engine (adaptive narrative — never hardcode a claim)

Everything the app *says* about the numbers is generated from the numbers. Per-metric outcomes
with epsilons (win rate ±2 pts, deal size ±5% of baseline, cycle ±2 days) → better / worse /
even / unknown. Tones and exact sentence templates:

- **strong** (some wins, no losses): `GTM-touched deals outperform: a higher win rate (75% vs 0%), 3.3× larger deals ($315.56K vs $95K) and closing 27 days faster (50 days vs 77 days).`
  — include only the winning clauses, joined with commas + "and".
- **mixed**: `Mixed results: GTM-touched deals show …, but ….` (name both sides)
- **weak** (losses, no wins): `GTM-touched deals aren't outperforming yet: ….`
- **even**: if some metrics are unknown → `On what can be measured so far, GTM-touched and untouched deals look similar — close more deals to compare win rate and cycle length.`
  else → `GTM-touched and untouched deals are performing about the same so far.`
- **early** (touched deals exist, nothing comparable closed): `A session preceded 9 of 11 deals (82%), but there aren't enough closed deals to compare performance yet.`
- **none** — each empty state gets its own sentence:
  no data at all → `No data yet — log enablement sessions and customer deals to populate this view.`
  sessions but no deals → `9 sessions delivered, no deals tracked yet — add the pipeline to connect enablement to revenue.`
  deals but no sessions → `No enablement sessions logged yet, so no deals count as GTM-touched.`
  both but no matches → `No tracked deals have followed a session yet — no GTM touchpoints to report.`
- Small-sample caveat whenever touched n < 4 or untouched n < 2:
  `Small sample (9 GTM-touched vs 2 not) — read as an early signal, not a proven effect.`

Tone headings (used on the one-pager): strong `GTM-touched deals perform better`; mixed
`GTM-touched deals: mixed results`; weak `GTM-touched deals: no edge yet`; even
`GTM-touched deals: on par so far`; early `Deal performance: too early to compare`; none
`Deal performance comparison`.

Generated "Recommended actions", in this order:
1. Gap ≥ +5 pts: `Add enablement capacity on Vulnerability Management — customer demand outruns coverage (Vulnerability Management: 39% of demand vs 19% of our effort).`
2. Use cases with deals but zero sessions: `Customers are active on X with no enablement delivered yet.`
3. If neither applies (and sessions exist): `Enablement coverage is balanced with customer demand — maintain the current cadence.`
4. On weak/mixed tone: `Review the GTM-touched deals that stalled or lost — check whether session timing, content, or audience needs adjusting before scaling up.`
5. Data hygiene: if sessions exist but hours total 0 → `Record team hours on sessions to unlock the value-per-hour ROI metric.`; if closed deals exist and none has a close date → `Add close dates to closed deals to compare sales-cycle length.`

## 5. App shell & global layout

- Carbon UI Shell `Header`, ALWAYS rendered in `g100` (dark) regardless of app theme. Brand:
  `HeaderName` with prefix **"IBM"** and text **"GTM Pipeline View"** (plain text only — do NOT
  recreate the IBM 8-bar logo). Nav tabs, in order: **"Pipeline View"** (`/`),
  **"Enablements"** (`/enablements`), **"Deals"** (`/pipeline`); active tab underlined.
  Right-side global actions: reset-demo icon (Renew) — confirm dialog first:
  `Reset the dashboard to the demo dataset? Manually entered records will be removed.` — and a
  theme toggle (Asleep icon in light / Light icon in dark, aria-labels "Switch to dark theme" /
  "Switch to light theme").
- Content area: `max-width: 88rem`, centered, `padding: 2rem`, on `var(--cds-background)`.
  Body background `#ffffff` in light, `#161616` when `data-carbon-theme='g100'` (no white strip
  below the content in dark mode). Content clears the fixed 3rem header.
- Page header block: `h1` 2rem / weight 400, 0.25rem below it an optional sub-line `p` 0.875rem
  in `--cds-text-secondary`; when a page has header buttons, the header row is flex,
  space-between, items aligned to flex-end, 1rem gap, wrapping.
- Cards: `.chart-card` and `.table-card` = `var(--cds-layer-01)` background, `1rem` padding
  (table cards are flush — the Carbon table touches the card edges, and their title gets
  `padding: 1rem 1rem 0.25rem`), no border, no radius, `overflow-x: auto`. Cards stack
  vertically with `1rem` gaps (`.card-stack`), `1.5rem` below the KPI row and above the table.
  Nothing may need a horizontal scrollbar at ≥1100 px viewport width.
- Section titles inside cards: 1rem font, weight 600, `0 0 1rem` margin.
- KPI row: CSS grid, `repeat(auto-fit, minmax(13rem, 1fr))`, **`gap: 1px`** — the page
  background shows through the 1px gaps as hairline seams between tiles (this is the divider
  look; there are no explicit borders). Tiles: `--cds-layer-01`, `1rem` padding, `min-height:
  8.5rem`, flex column with space-between. Label on top: 0.75rem, letter-spacing 0.02em,
  `--cds-text-secondary`. Value: **2.625rem, weight 300**, line-height 1.1,
  `--cds-text-primary`. Detail line at the bottom: 0.75rem, `--cds-text-helper`.
- Use-case chip (used everywhere a use case is named): inline-flex, 0.5rem gap, a
  `0.625rem × 0.625rem` square dot with `border-radius: 2px` in the use case's theme hex, then
  the label in normal text ink. 0.875rem in tables, 0.75rem in legends.
- Stat-row panels (comparison & coverage share one system, `.cmp`): panel `max-width: 72rem`.
  Legend row above: flex, wrap, `0.5rem 1.5rem` gaps, 0.75rem font, `--cds-text-secondary`,
  `1rem` below. Each data row is a CSS grid `16rem minmax(0,1fr) 13rem` with `0.5rem 1rem` gap,
  vertically centered, `0.75rem 0` padding, and a **`border-top: 1px solid
  var(--cds-border-subtle-01)`** divider (every row has one; the legend has none). This fixed
  grid guarantees all bars in all rows start at the same x. Bars: `0.625rem` tall,
  `border-radius: 0 2px 2px 0` (flat left edge, rounded right), `max-width: calc(100% − 6rem)`
  so the value label always fits; value label 0.75rem `--cds-text-secondary` right after the
  bar; two bar lines per row, `0.375rem` apart. Right column (delta/verdict): right-aligned,
  0.8125rem weight 600 in `--cds-link-primary` when favorable; **adverse deltas are shown, not
  hidden**, in `--cds-text-secondary` (calm ink, not celebration blue). Below 52rem viewport
  the grid collapses to one column and the delta left-aligns.
- Modals: Carbon `Modal`, fields stacked with `1rem` spacing.
- Custom tooltip (`.tl-tip`): absolutely positioned HTML div, `--cds-background-inverse`
  background with `--cds-text-inverse` text, `0.5rem 0.75rem` padding, 0.75rem font, line-height
  1.45, max-width 20rem, border-radius 2px, shadow `0 2px 6px rgba(0,0,0,0.3)`, first line bold.
  It follows the cursor (offset 12px right / 10px above), flips BELOW the cursor when within
  140px of the container top (overflow containers clip upward), and flips to the LEFT of the
  cursor within 300px of the right edge.

## 6. Page 1 — Pipeline View (landing, `/`)

Header: h1 **"GTM Pipeline View"**; sub-line: `All figures year to date, from the start of
FY2026. ` followed by an inline link **"How these numbers are calculated"** → `/glossary`.
Right side: tertiary button **"Executive one-pager"** (Document icon) → `/onepager`.

Then, in exactly this order:

**(1) KPI row — five tiles:**
1. `GTM-touched deals` — value `9 of 11`, detail `82% of all tracked deals` (or
   `No deals tracked yet`).
2. `GTM-touched revenue (closed won)` — `$1.38M` (compact USD).
3. `GTM-touched open pipeline` — `$1.31M`.
4. `Sessions delivered` — `9` (delivered only, scheduled excluded), detail
   `172 attendees enabled`.
5. `GTM-touched value per team hour` — `$50.75K`, detail `53 enablement hours invested`; when
   no hours: value `—`, detail `Add hours to sessions to compute ROI`.

**(2) "Upcoming sessions" card** — the first card in the stack. Card header row: title
"Upcoming sessions" left, and on the right a ghost small button **"Request a session"** (Email
icon) whose href is a `mailto:` link (section 11). Below, scheduled sessions (date > today,
ascending) as a responsive card grid (`repeat(auto-fill, minmax(17rem, 1fr))`, 0.75rem gaps).
Each session card: `--cds-layer-02` background, `1px solid var(--cds-border-subtle-01)` border
with the LEFT border 3px in the session's use-case color; `0.75rem 1rem` padding; a left date
block (min-width 2.75rem, centered column: day-of-month at 1.5rem weight 300, month
abbreviation below in 0.75rem uppercase letter-spaced `--cds-text-secondary`, e.g. `30` over
`JUL`); then a body column (0.25rem gaps): session title 0.875rem weight 600, the use-case
chip, and a meta line 0.75rem `--cds-text-helper`: `A. Chen · in 9 days` (presenter · relative
day count; `tomorrow` when 1 day out). If nothing is scheduled, show one line in
`--cds-text-secondary`: `Nothing scheduled yet — request a session for your account or use case.`
The card always renders.

**(3) "Deal performance: GTM-touched vs. untouched" card** — if the small-sample caveat
applies, it renders as a 0.75rem `--cds-text-helper` line directly under the title. Then the
comparison panel: legend `GTM-touched (n=9)` (accent-blue dot) and `No GTM touch (n=2)`
(context-gray dot); three rows — `Win rate`, `Average deal size`, `Average sales cycle` — each
with two horizontal bars (touched = accent, untouched = context gray) scaled to the pair's max
(minimum visible width 2% when the value > 0), values direct-labeled after each bar (`75%` /
`0%`, `$315.56K` / `$95K`, `50 days` / `77 days`; `not enough data` when null). Delta column:
`+75 pts` / `3.3× larger` / `27 days faster` when favorable (blue, bold); `−X pts` /
`X× smaller` / `X days slower` when adverse (secondary ink); blank inside the epsilon.

**(4) "GTM-touched pipeline opened by month" card** — rendered only when GTM-touched deals
exist. Hand-rolled SVG bar chart, one fiscal quarter at a time. Geometry: viewBox 1160×230,
24px left/right padding, 32px axis strip, bars max height to y=30, bar width 96px, min-width
48rem (scrolls if narrower). Quarter nav sits above, right-aligned: ghost chevron IconButtons
(‹ ›) around a bold 0.875rem quarter label (`Q3 2026`); back bounded by the earliest data
quarter, forward by the current quarter. Three month bands separated by 1px
`--cds-border-subtle-01` gridlines (plus a closing line at the right edge and a baseline across
the bottom); month labels centered under each band, 11px, `--cds-text-helper` (the first label
includes the year, e.g. `Jul 2026`; the current month's label is bold and one shade darker).
One accent-blue bar per month (2px top corner radius), direct-labeled above with compact USD
(12px, weight 600). Months not yet begun get NO bar and italic `Coming soon` (weight 400,
helper ink) instead of $0; past months with zero show `$0`; the in-progress month gets a
`Current month` tag (11px, weight 600, `--cds-link-primary`) centered at the top of its band.

**(5) "Customer demand vs. enablement coverage" card** — same `.cmp` row system. Legend:
`Customer demand (share of deal value)` (accent dot) and
`Enablement coverage (share of team hours)` (gray dot). One row per use case with activity,
sorted by gap descending. Row label column: the use-case chip, and under it a hint line
0.6875rem `--cds-text-helper` like `3 deals · $1.18M · 2 sessions / 10h`. Two bars: demand
share % and coverage share %, labeled `39%` / `19%`. Verdict tag in the right column:
gap ≥ +5 pts → blue Carbon tag `Invest here · +20 pts demand`; gap ≤ −5 pts → green
`Well covered`; else gray `Balanced`.

**(6) "GTM-touched deals" table** — a flush table-card listing ONLY GTM-touched deals, sorted
by open date, most recent first. Columns exactly:
`Customer | Revenue | Use case | Stage | First matching session | Open date | Days from session to deal`.
Revenue = full USD (`$610,000`). Use case = chip. Stage = Carbon tag (colors in section 3).
First matching session = session title with a helper sub-line (0.75rem, `--cds-text-helper`)
`delivered Feb 10, 2026`. Days column = open date − first matching session date, in days.
Empty state (centered, 3rem padding): h3 `No GTM-touched deals yet`, text `When a customer deal
matches a use case we enabled on — and opened after that session — it will appear here
automatically.`, tertiary button `Log an enablement` → `/enablements`.

## 7. Page 2 — Enablement Sessions (`/enablements`)

Header: h1 **"Enablement Sessions"**. Right side, two buttons (0.5rem apart): tertiary
**"Request a session"** (Email icon, the same mailto) and primary **"Add enablement"** (Add
icon).

**(1) Sessions table** (flush table-card, full width, sorted date descending — scheduled
sessions therefore appear at the top): columns
`Session | Use case | Date | Attendees | Hours | (actions)`. Session cell = title with the
presenter as a 0.75rem helper sub-line. Date cell: `Aug 13, 2026`, and for scheduled sessions
(date > today) a small blue Carbon tag **"Scheduled"** after the date. Attendees cell shows
`—` for scheduled sessions (they haven't had attendees yet), the number otherwise. Actions =
ghost icon buttons Edit ("Edit session") and TrashCan ("Delete session"). Empty state:
h3 `No sessions logged`, text `Add the first enablement session — deals that open later on the
same use case will match it automatically.`

**(2) Month calendar** below the table (own `--cds-layer-01` card, 1rem padding). Header row:
month name h3 (`July 2026`, 1rem/600) left, ghost chevron prev/next month buttons right.
Grid: 7 columns, `1px` gaps with the grid background AND a 1px outer border in
`--cds-border-subtle-01` (the 1px gaps read as cell divider lines). Day-of-week header cells
(`Sun`…`Sat`) 0.75rem secondary ink. Day cells: `--cds-layer-01`, min-height 5.75rem, clickable
(hover → `--cds-layer-hover-01`; focus ring `--cds-focus`), day number 0.75rem secondary ink
top-left; padding cells outside the month use `--cds-layer-02` and aren't clickable. Today's
number is bold `--cds-link-primary`. Sessions render inside their day as chips: 0.6875rem,
`--cds-layer-02` background, **3px left border in the use-case color**, single line with
ellipsis, `title` tooltip `"{title} — {presenter}"`. Clicking any day opens the add-session
modal pre-filled with that date. Below the grid: a legend of all five use-case chips (0.75rem).

**(3) Add/Edit session modal** — Carbon Modal, label "Enablements", heading
`Add enablement session` / `Edit enablement session`, primary button `Add session` /
`Save changes`, secondary `Cancel`. Fields in exactly this order (the table's column order
mirrors it): `Session title` (required; placeholder `e.g. Vulnerability Management 101
Workshop`; invalid text `A session title is required.`) → `Presenter (optional)` (placeholder
`Who from the team delivered it`) → `Use case` dropdown of the five (label `Select a use case`;
invalid `Pick the use case this session enables on.`) → `Session date` (Carbon DatePicker,
`Y-m-d`, placeholder `yyyy-mm-dd`; invalid `A session date is required.`) → `Attendees`
(NumberInput, min 0, default 10) → `Team hours invested (prep + delivery)` (NumberInput, min 0,
default 4).

## 8. Page 3 — Customer Deals (`/pipeline`)

Header: h1 **"Customer Deals"**; primary button **"Add deal"** (Add icon).

**(1) Deals table** (flush table-card): ALL deals, sorted open date descending. Columns:
`Customer | Revenue | Use case | Open date | Stage | Owner | GTM touch | (actions)`.
GTM touch column: purple small Carbon tag **"GTM touched"** when counted (hover title
`Preceded by N matching session(s)`), otherwise an em dash in `--cds-text-helper`. Owner shows
`—` when empty. Actions = Edit ("Edit deal") / TrashCan ("Delete deal"). Empty state:
h3 `No deals tracked`, text `Add the first customer deal — if a session on its use case came
first, it is tagged GTM touched automatically.`

**(2) "Session-to-deal timeline" card** below the table (1rem above) — the signature
visualization, hand-rolled SVG, rendered only when deals exist:

- One fiscal quarter at a time. Header row above the SVG: the legend left, quarter nav right
  (same chevron + bold label pattern). Legend items (0.75rem chips with tiny inline-SVG
  glyphs): filled diamond `Enablement session`; filled dot `GTM-touched deal (opened after a
  session)`; hollow gray ring `Deal with no prior session — not counted`; and — only when
  present in the viewed quarter — a dashed-line glyph `Touchpoint carried from an earlier
  quarter`.
- Geometry: viewBox width 1160, min-width 56rem; one horizontal lane of height 130 per use case
  with activity in the viewed quarter, plus a 36px bottom axis strip. Lane headers at x=16
  (a 10×10 rounded square in the use-case color + the label 12px/600); the plot area starts at
  x=64 so marks never collide with headers; 24px right padding. Month gridlines (1px
  `--cds-border-subtle-01`) spanning the full height, with a closing line at the quarter end;
  month labels centered per band, 11px helper ink, first label includes the year. The x-axis
  runs from quarter start to QUARTER END (not today).
- A dashed vertical **Today** marker (1.5px, dash 4 4, `--cds-link-primary`, with the label
  "Today" 11px/600 above) appears only when viewing the current quarter.
- Within each lane: a subtle baseline (the session line) at y=106 of the lane; sessions are
  10×10 filled diamonds (rotated squares) in the use-case color sitting on it. Deals are dots
  at y=64: radius 7 filled with the use-case color when GTM-touched; radius 6 with a 2px
  `#8d8d8d` stroke and `--cds-layer-01` fill (hollow ring) when not — the exclusion must be
  visible. Every deal is labeled: customer name (11px/600, primary ink; helper ink when not
  counted) above the dot, and under it the compact value with a suffix ` · won` / ` · lost`
  for closed deals (10px, secondary ink). When two labels would sit closer than 116px, the
  second drops BELOW its dot (two-track collision handling); label x is clamped inside the
  plot.
- Influence curves: cubic bezier with vertical tangents (`M x1 sessionY−5 C x1 midY, x2 midY,
  x2 dealY+7`), 1.5px stroke in the use-case color at 45% opacity, connecting each touched
  deal down to the earliest matched session WITHIN the viewed quarter. If the only matching
  sessions are from an earlier quarter, the curve is DASHED (dash 5 4) and enters from the
  left plot edge; at the boundary sits a small filled left-pointing triangle in the use-case
  color with a 10px helper label like `from Q2` (or `from earlier` if several quarters), and
  hovering it lists the carried sessions with dates.
- Tooltips: custom instant HTML tooltip (section 5) — NEVER native SVG `<title>` (too slow).
  Oversized invisible hit circles (r=16 sessions, r=18 deals, r=14 carried markers). Session
  tooltip: title / `Feb 10, 2026 · A. Chen` / `18 attendees · 6h invested`. Deal tooltip:
  customer / `$610,000 · Closed Won` / `Opened Apr 27, 2026` / then either
  `GTM touched — session: {title} ({date})`, or `GTM touched — carried from Q1 2026: {title}
  ({date})`, or `Not counted — no {use case} session before this deal`.
- Empty quarter: keep the header/nav visible with the centered line
  `No sessions or deals in Q3 2026.`

**(3) Add/Edit deal modal** — label "Pipeline", heading `Add customer deal` /
`Edit customer deal`, primary `Add deal` / `Save changes`. Fields in order (table mirrors it):
`Customer name` (required; placeholder `e.g. Acme Financial`; invalid `A customer name is
required.`) → `Deal revenue (USD)` (NumberInput, min 0, step 10000, default 100000; invalid
`Deal revenue must be greater than zero.`) → `Use case the customer is interested in`
(dropdown; invalid `Pick the use case the customer is interested in.`) → `Deal open date`
(DatePicker; invalid `A deal date is required.`) → `Stage` (dropdown, default Prospecting) →
`Close date` (DatePicker — this field APPEARS ONLY while the stage starts with "Closed", and
the stored closeDate is cleared if the stage returns to open) → `Deal owner (optional)`
(placeholder `Seller running the deal`).

## 9. Page 4 — Executive Summary (`/onepager`)

A print-optimized sheet, ALWAYS light-themed regardless of app theme, on a `--cds-layer-02`
backdrop. No-print toolbar above (max-width 56rem, space-between): ghost `Back to dashboard`
(ArrowLeft) and primary `Print / save as PDF` (Printer icon) → `window.print()`.

The sheet: max-width 56rem, centered, white, `2.5rem` padding, soft shadow. Section h2s are
1rem/600 with a **2px solid `#0f62fe` bottom border** and 0.375rem padding below. Content in
order:

1. Header row (1px `#e0e0e0` bottom border, 1.25rem padding-bottom): left — eyebrow
   `IBM · GTM PIPELINE VIEW` (0.75rem, uppercase, letter-spaced, `#525252`) over h1
   `Executive Summary` (1.75rem/400); right — `FY2026 year to date · July 21, 2026` (0.875rem,
   `#525252`).
2. KPI band (grid auto-fit minmax(10rem,1fr), 1rem gaps): SAME ORDER as the dashboard —
   `9 of 11` / `GTM-touched deals`; `$1.38M` / `GTM-touched revenue (closed won)`; `$1.31M` /
   `GTM-touched open pipeline`; `$50.75K` / `GTM-touched value per team hour (53h invested)`.
   Values 1.75rem/300, labels 0.75rem `#525252`.
3. Two equal columns (2rem gutter; stacks below 42rem): LEFT — h2 = the adaptive tone heading
   (e.g. `GTM-touched deals perform better`), the small-sample caveat in italics beneath when
   applicable, then a compact table: header row ` | GTM-touched (n=9) | No GTM touch (n=2)`,
   rows `Win rate`, `Average deal size`, `Average sales cycle`; the GTM-touched column's values
   in `#0f62fe` weight 600. RIGHT — h2 `Demand vs. coverage by use case`: table
   `Use case | Demand share | Coverage share`, one row per active use case. All one-pager
   tables: 0.8125rem, left-aligned headers 600 `#525252` with 1px `#c6c6c6` bottom border,
   cells with 1px `#e0e0e0` bottom borders and 1.25rem right gutters, numbers in tabular-nums.
4. Full-width callout (`#edf5ff` background, **3px solid `#0f62fe` left border**, 0.625rem ×
   0.75rem padding): bold `Recommended actions`, then the generated asks as plain flush-left
   lines — no bullets, no indent, aligned exactly with the heading.
5. h2 `Top GTM-touched deals` — top 5 by value. `table-layout: fixed`, column widths
   20 / 13 / 27 / 16 / 24%: `Customer | Revenue | Use case | Stage | First matching session`.
   Revenue left-aligned under its header, full USD. Stage = small Carbon tag. Last column =
   session title + 0.6875rem `#525252` sub-line `delivered Feb 10, 2026`.
6. Footer (0.6875rem, `#525252`, 1px `#e0e0e0` top border): `Method: a deal is counted as
   GTM-touched when an enablement session on the same use case preceded the deal's open date.
   All figures are year to date from the start of FY2026, as entered by July 21, 2026. Every
   term and formula is defined on the Methodology & Glossary page of the GTM Pipeline View.`
   — with "Methodology & Glossary" as a link to `/glossary`.

Print CSS: hide the app header and toolbar; zero margins/padding/shadow on the sheet; white
everywhere; `print-color-adjust: exact` on everything; table rows, the KPI band, and the
callout never split across page breaks; h2s keep their sections (`break-after: avoid`);
`@page { margin: 1.25cm }`. Must fit one page with the demo data.

## 10. Page 5 — Methodology & Glossary (`/glossary`)

Header: h1 **"Methodology & Glossary"**; ghost button `Back to Pipeline View` (ArrowLeft) → `/`.

**(1) Lead panel**: `--cds-layer-01`, **4px solid `--cds-link-primary` left border**, 1.5rem
padding, max-width 56rem. One sentence, 1.25rem/400: `Every number in this view counts one
thing: ` then in weight 600: `an enablement session delivered before a deal opened on the same
use case.` Nothing else — no talk of credit, ownership, or attribution.

**(2) "The counting rule" card** — a static SVG diagram (viewBox 1128×260) in the timeline's
visual language, two examples plus a legend at the right (x≈760):
- "Counted" (13px/600): a baseline with an accent-blue diamond labeled `Session delivered` /
  `Feb 10 · same use case`, a 50%-opacity accent curve rising to a filled accent dot labeled
  `Deal opened · Apr 27`, and to its right `→ GTM-touched` in accent blue (12px/600).
- "Not counted": a hollow gray-ring deal dot labeled `Deal opened · Feb 12` appearing BEFORE a
  gray diamond labeled `First session · Feb 24 (after the deal)`, and
  `→ excluded from every metric` in helper ink.
- Legend: accent diamond `Enablement session`; accent dot `Deal counted as GTM-touched`; hollow
  ring `Deal with no prior session`.

**(3) "Terms" card** — a responsive grid (`minmax(20rem,1fr)`, 0.75rem gaps) of definition
cards (`--cds-layer-02`, 1px `--cds-border-subtle-01` border, 1rem padding; term 0.875rem/600,
definition 0.8125rem secondary ink). The six term/definition pairs, verbatim:
- **GTM-touched deal** — `A deal where at least one enablement session on the same use case was delivered on or before the deal's open date. Deals with no prior session are explicitly not counted — and are shown as excluded, never hidden.`
- **Use case** — `One of five fixed categories both sessions and deals are tagged with: Vulnerability Management, Secure Coder, Monitoring, Optimization, Other. Matching only ever happens within the same use case.`
- **First matching session** — `The earliest session on the deal's use case delivered on or before the deal's open date. Shown with its delivery date ("delivered Feb 10, 2026").`
- **Open date / Close date** — `Open date is when the deal was opened, as entered by the deal owner — it is the date used for the timing match. Close date is entered when a deal reaches Closed Won or Closed Lost, and is used only for sales-cycle length.`
- **Days from session to deal** — `Deal open date minus the first matching session's delivery date, in days.`
- **Touchpoint carried from an earlier quarter** — `In quarter views: a deal that opened in the displayed quarter whose matching session happened in a previous quarter. Drawn as a dashed line entering from the left edge, labeled with the session's quarter.`

**(4) "Metrics & formulas" card** — rows in a `16rem | 22rem | 1fr` grid (name 0.875rem/600;
formula in a monospace chip — IBM Plex Mono 0.75rem on `--cds-layer-02` with 0.25rem×0.5rem
padding; note 0.8125rem helper ink), each row divided by a 1px `--cds-border-subtle-01` top
border; single column below 60rem. The twelve rows, verbatim:

| name | formula | note |
|---|---|---|
| GTM-touched deals (X of Y) | `count of GTM-touched deals ÷ all tracked deals` | A share of the tracked pipeline. |
| GTM-touched revenue (closed won) | `Σ value of GTM-touched deals in Closed Won` | Sums each deal's full value; nothing is split or allocated per session. |
| Sessions delivered | `count of sessions dated on or before today` | Sessions scheduled for a future date appear under "Upcoming sessions" and on the calendar, and join every delivered total (sessions, attendees, hours, coverage) once their date passes. |
| GTM-touched open pipeline | `Σ value of GTM-touched deals in open stages` | Open stages: Prospecting, Qualification, Proposal, Negotiation. |
| Win rate | `Closed Won ÷ (Closed Won + Closed Lost)` | Computed separately for the GTM-touched and untouched groups; open deals are not in the denominator. |
| Average deal size | `mean deal value across the group` | Includes open and closed deals. |
| Average sales cycle | `mean (close date − open date), in days` | Over closed deals that have a close date recorded. |
| GTM-touched value per team hour | `(touched won revenue + touched open pipeline) ÷ total session hours` | A throughput measure of enablement effort. |
| Demand share | `use case's deal value ÷ total deal value` | Across all tracked deals, touched or not. |
| Coverage share | `use case's session hours ÷ total session hours` | Weighted by session count instead if no hours are recorded. |
| "Invest here" / "Well covered" / "Balanced" | `demand share − coverage share` | ≥ +5 points → Invest here · ≤ −5 points → Well covered · otherwise Balanced. |
| GTM-touched pipeline by month | `Σ value of touched deals, bucketed by open-date month` | Shown per fiscal quarter; months that haven't started show "Coming soon", not $0. |

(Order note: "Sessions delivered" sits directly after "GTM-touched revenue (closed won)".)

**(5) "Conventions & caveats" card** — a list with NO bullets and NO indent (items start flush
under the section title and run the full card width; 0.875rem, line-height 1.55, secondary ink,
0.625rem between items). The four items, verbatim:
- `Fiscal calendar — IBM's fiscal year matches the calendar year; quarters are calendar quarters (Q1 = Jan–Mar). All headline figures are year to date from the start of the current fiscal year.`
- `Timing is not causation — a deal opening after a session doesn't prove the session caused it. The touched-vs-untouched comparison exists precisely so the data, not the framing, makes whatever case there is.`
- `Small samples — when either comparison group is small, the view says so: "read as an early signal, not a proven effect."`
- `Manual entry — v1 figures reflect what has been entered and are only as complete as the entries. Sessions and deals are editable so records stay correct as they progress.`

## 11. "Request a session" mailto

A single helper builds the link (recipient kept in one constant, shipped EMPTY until the team's
distribution list is confirmed — an empty recipient just leaves the To field blank). Subject:
`Enablement session request`. Body (newline-separated, URL-encoded):

```
Hi team,

I'd like to request an enablement session.

Use case:
Customer / audience:
Preferred timing:
```

Used by both Request-a-session buttons (landing strip header, Enablements page header).

## 12. Seed demo data (assume "today" ≈ July 21, 2026)

Sessions (id, title, useCase, date, presenter, attendees, hours):
e1 `Vulnerability Management 101 Workshop` vuln-mgmt 2026-02-10 `A. Chen` 18 6 ·
e2 `Secure Coder Hands-on Lab` secure-coder 2026-02-24 `M. Rodriguez` 24 8 ·
e3 `Monitoring Deep Dive` monitoring 2026-03-05 `S. Patel` 15 5 ·
e4 `Advanced Vulnerability Management` vuln-mgmt 2026-03-18 `A. Chen` 12 4 ·
e5 `Optimization Cost-Savings Workshop` optimization 2026-04-02 `J. Kim` 20 6 ·
e6 `Secure Coder Certification Bootcamp` secure-coder 2026-04-21 `M. Rodriguez` 30 12 ·
e7 `Observability Clinic` monitoring 2026-05-12 `S. Patel` 17 4 ·
e8 `FinOps Optimization Enablement` optimization 2026-06-09 `J. Kim` 22 6 ·
e9 `Secure Coder Office Hours` secure-coder 2026-07-08 `M. Rodriguez` 14 2 ·
**Scheduled (future-dated):**
e10 `Vulnerability Management Threat Briefing` vuln-mgmt 2026-07-30 `A. Chen` 0 3 ·
e11 `Monitoring War-Room Simulation` monitoring 2026-08-13 `S. Patel` 0 4.

Deals (customer, useCase, value, open date, stage, owner, closeDate):
Acme Financial vuln-mgmt 420000 2026-03-02 Negotiation `T. Nguyen` ·
Globex Retail secure-coder 250000 2026-03-14 Closed Won `L. Ortiz` 2026-05-02 ·
Initech Manufacturing monitoring 180000 2026-04-08 Proposal `T. Nguyen` ·
Umbrella Health vuln-mgmt 610000 2026-04-27 Closed Won `R. Walker` 2026-06-20 ·
Stark Industries optimization 340000 2026-05-06 Negotiation `L. Ortiz` ·
Wayne Enterprises secure-coder 520000 2026-05-22 Closed Won `R. Walker` 2026-07-08 ·
Soylent Foods monitoring 95000 2026-06-15 Qualification `T. Nguyen` ·
Hooli Cloud optimization 275000 2026-07-01 Proposal `L. Ortiz` ·
Pied Piper other 60000 2026-05-19 Prospecting `R. Walker` (NOT touched — no Other sessions) ·
Vandelay Imports secure-coder 130000 2026-02-12 Closed Lost `T. Nguyen` 2026-04-30 (NOT touched — opened before the first Secure Coder session) ·
Cyberdyne Systems vuln-mgmt 150000 2026-03-25 Closed Lost `R. Walker` 2026-05-15 (touched AND lost — shown honestly).

Expected demo readout (acceptance numbers): 9 of 11 GTM-touched (82%); $1.38M touched won;
$1.31M touched open pipeline; Sessions delivered **9** (e10/e11 excluded), 172 attendees, 53
hours, $50.75K/hour; win rate 75% vs 0% (+75 pts); avg size $315.56K vs $95K (3.3× larger);
cycle 50 vs 77 days (27 days faster); Vulnerability Management tagged
`Invest here · +20 pts demand`; the Upcoming strip shows exactly two cards (Jul 30 VM Threat
Briefing, Aug 13 Monitoring War-Room Simulation); adding any "Other" session dated before
May 19 must automatically flip Pied Piper to GTM-touched everywhere.

## 13. Formatting

USD full: `$610,000` (no cents). USD compact: `$1.38M` / `$315.56K` (Intl compact notation,
≤2 decimals). Dates: `Apr 27, 2026`. Percentages: whole numbers. Sorting is always applied at
render time so edited dates re-slot rows chronologically.

## 14. Acceptance tests (verify before calling it done)

1. Add a session on a use case that has deals but no sessions → those deals flip to GTM-touched
   everywhere (KPIs, tables, timeline, coverage, one-pager) instantly.
2. Add a session dated in the future → it appears in the Upcoming strip, the sessions table
   (with the "Scheduled" tag and an em-dash attendee count), and the calendar — but NO
   delivered total (session count, attendees, hours, value/hour, coverage) changes.
3. Edit a deal's open date → it re-sorts into the correct chronological position in both deal
   tables and moves on the timeline and monthly chart.
4. Edit a deal to Closed Won with a close date → won-revenue KPI and win rate update; switch it
   back to an open stage → the close date is removed from the record.
5. Edit a session's hours → total hours and the value-per-hour KPI update.
6. Delete the records → every number reverts exactly.
7. With an adverse dataset (touched deals losing more / smaller / slower), the verdict heading,
   headline, and recommendations state it honestly — adverse deltas render in calm secondary
   ink, never hidden.
8. No horizontal scrollbars inside cards at ≥1100px; all comparison/coverage bars start at the
   same x; tooltips appear instantly on hover and never clip at the container's top or right
   edge.
9. The words "influenced", "attributed", "credit", "drove", "impact" appear NOWHERE in visible
   UI text; the glossary opener is the single neutral sentence in section 10 with no ownership
   or credit disclaimers.
