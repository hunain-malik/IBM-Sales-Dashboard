# Enablement Impact Dashboard

A dashboard that tracks the team's **enablement sessions** and the **customer pipeline/revenue**
they helped create — built to show sales and executives, at a glance, how much pipeline our
enablement work drives.

Built with React, [IBM Carbon Design System](https://carbondesignsystem.com/) (`@carbon/react`)
and [Carbon Charts](https://charts.carbondesignsystem.com/) (`@carbon/charts-react`).

## How it works (v1 — manual input)

- **Enablements** — anyone on the team logs a session on the calendar (or via *Add enablement*):
  title, date, the use case it enables on (Vulnerability Management, Secure Coder, Monitoring,
  Optimization, Other), presenter, and attendee count.
- **Pipeline** — the team or sales logs customer deals: customer name, deal revenue, the use case
  the customer is interested in, open date, stage, and owner.
- **Attribution** — a deal is automatically marked **enablement-influenced** when the customer's
  use case matches at least one session delivered *on or before* the deal's open date.
- **Impact summary** — the executive page: KPI tiles (deals driven, influenced closed-won revenue,
  influenced open pipeline, sessions delivered, influenced value per team hour) plus an
  **influence timeline**: one lane per use case on a real time axis, sessions as diamonds, deals as
  dots at their actual value, and curves linking each influenced deal back to the first session
  that preceded it. Deals with no prior session are drawn hollow — visibly excluded, so the
  attribution rule is itself on display.
- **Influenced vs. not influenced** — win rate, average deal size, and sales-cycle length compared
  between deals preceded by enablement and the rest (uses each deal's optional close date).
- **Where to invest next** — per use case, customer demand share (deal value) vs. enablement
  coverage share (team hours); use cases where demand outruns coverage are flagged *Invest here*.
- **Executive one-pager** — a print-optimized summary (`Impact summary → Executive one-pager →
  Print / save as PDF`) with the headline KPIs, the comparison, the coverage gaps, and the top
  influenced deals on a single page.

Data is stored in the browser's `localStorage`. The app seeds a demo dataset on first load;
use the reset action in the header to restore it, and delete rows to clear records.

## Pages

| Page | Audience | What it shows |
|---|---|---|
| Impact summary (landing) | Sales + executives | KPIs, influenced-vs-not comparison, where-to-invest, monthly influenced pipeline, influence timeline, attribution detail |
| Enablements | Team | Month calendar + table of sessions; click a day to log one |
| Pipeline | Team + sales | All deals (add/edit) with an *Influenced* tag where enablement preceded the deal |

The headline verdict and the one-pager's recommended actions are **generated from the data** by a
small insights engine (`src/data/insights.js`): strong results read as strong, mixed as mixed,
adverse deltas are stated rather than hidden, small samples carry a caveat, and missing data
(hours, close dates) produces asks instead of claims.

## Run it

```sh
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the production build
```

## Notes on the theme

The UI uses Carbon's `white` and `g100` themes (toggle in the header). Use-case colors are IBM
Carbon data-viz ramp steps, re-ordered and validated for color-vision-deficiency separation and
surface contrast on both themes — each use case keeps the same hue everywhere in the app, and
every color is always paired with a text label.
