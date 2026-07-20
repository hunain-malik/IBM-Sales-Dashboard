# GTM Pipeline View

A dashboard that tracks the team's **enablement sessions** alongside the **customer
pipeline**, and shows where the two coincide — neutrally framed so it never reads as
claiming credit for sales' deals.

Built with React and the [IBM Carbon Design System](https://carbondesignsystem.com/)
(`@carbon/react`); all charts are hand-rolled SVG.

## How it works (v1 — manual input)

- **Enablements** — the team logs sessions (title, presenter, use case, date, attendees,
  hours) via a form or by clicking a day on the month calendar.
- **Deals** — the team or sales logs customer deals: customer, revenue, use case, open
  date, stage, owner, and close date once closed. Deals are editable as they progress.
- **GTM touch** — a deal is automatically tagged **GTM touched** when a session on the
  same use case was delivered on or before the deal's open date. This is an association
  by timing and topic, not an attribution of credit; deals with no prior session are
  shown as explicitly not counted.
- The landing **Pipeline View** shows KPIs, a GTM-touched vs. untouched deal comparison
  (win rate, average size, cycle length), quarterly GTM-touched pipeline by month,
  customer demand vs. enablement coverage per use case, and the GTM-touched deals list.
  The **Deals** tab carries the quarter-scoped session-to-deal timeline.
- The **Executive Summary** (`/onepager`) is a print/PDF one-pager whose verdict heading
  and recommended actions are **generated from the data** by a small insights engine
  (`src/data/insights.js`) — strong results read as strong, mixed as mixed, adverse
  deltas are stated rather than hidden, and small samples carry a caveat.

Every term and calculation is defined in [`docs/GLOSSARY.md`](docs/GLOSSARY.md), linked
from the dashboard header and the one-pager footer.

Data is stored in the browser's `localStorage`, seeded with a demo dataset on first load;
the header has a reset action and a light/dark theme toggle.

## Pages

| Page | Audience | What it shows |
|---|---|---|
| Pipeline View (landing) | Sales + executives | KPIs, touched-vs-untouched comparison, quarterly pipeline, demand vs. coverage, GTM-touched deals list |
| Enablements | Team | Sessions list + month calendar; click a day to log one |
| Deals | Team + sales | All deals (add/edit) with automatic *GTM touched* tagging, plus the session-to-deal timeline |

## Run it

```sh
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the production build
```

## Notes on the theme

The UI uses Carbon's `white` and `g100` themes. Use-case colors are IBM Carbon data-viz
ramp steps, re-ordered and validated for color-vision-deficiency separation and surface
contrast on both themes — each use case keeps the same hue everywhere, and every color is
always paired with a text label.
