# Master build prompt — IBM Outbound Pipeline View (complete, from scratch)

Copy everything below the line into BOB. It contains a short specification of what the
product is, followed by the COMPLETE source code of every file, verbatim. Build it by
transcribing the sources exactly — do not reinterpret, restyle, rename, or "improve"
anything. Where the spec and the source code could ever disagree, the source code wins.

---

Build the **IBM Outbound Pipeline View** from scratch: a single-page dashboard for a
technical enablement team, tracking the enablement sessions the team delivers and the
customer deals that follow them, side by side, for a sales and executive audience. Every
file you need is in Part 2 below, complete and final. Part 1 tells you what the system is
so you can verify your transcription behaves correctly; Part 3 covers deployment; Part 4
is the acceptance checklist.

# Part 1 — What the system is

## 1.1 Product shape

- React 19 + Vite, IBM Carbon Design System (`@carbon/react`), light (`white`) and dark
  (`g100`) themes with a header toggle, hash routing, hand-rolled SVG charts (no chart
  library). IBM Plex Sans via Carbon's Akamai CDN. Sass required (`sass-embedded`).
- Four nav tabs and six routes: `/` **Pipeline View** (landing: KPI row,
  upcoming-sessions strip with a "Request a session" mailto, outbound-touched vs.
  untouched comparison, quarter-paged monthly pipeline chart, demand-vs-coverage panel
  by product, outbound-touched deals table), `/enablements` (sessions table + month
  calendar + add/edit modal + recently-deleted panel), `/pipeline` **Customer Deals**
  (all-deals table + session-to-deal timeline + add/edit modal + recently-deleted
  panel), `/products` **Products** (quarter-paged per-product cards: sessions
  delivered/scheduled, attendees, hours, deals opened, outbound-touched, closed won in
  quarter, plus a per-use-case breakdown table), `/onepager` (print-optimized executive
  summary with a "By product" table), `/glossary` (Methodology & Glossary: counting-rule
  diagram, terms, formulas, conventions). `/impact` is an old-bookmark alias of `/`.
- Language rules baked into every string: the product is "Outbound Pipeline View"; deals
  that follow a session are "Outbound-touched" (lowercase "outbound-touched"
  mid-sentence); never "GTM", never "influenced/attributed/credit/drove" in visible text.
  All narrative sentences (headlines, verdicts, recommended actions) are GENERATED from
  the data by the insights engine — never hardcoded claims.

## 1.2 The product dimension

- Three products, each with a fixed color pair (light/dark theme) used for every dot,
  bar, calendar entry, and timeline lane: **Concert Protect** (`#6929c4`/`#8a3ffc`),
  **Instana** (`#1192e8`), **Turbonomic** (`#ee538b`). Records without a product
  (legacy rows) render neutral gray `#8d8d8d` as "No product".
- Every session and deal carries `product` + `useCase`. Use cases are product-specific
  catalogs in `USE_CASES_BY_PRODUCT`: Concert Protect has 5 (Vulnerability Management,
  Compliance, Certificate Management, Software Composition Analysis, Application
  Resilience), Instana 6 (Full-Stack Observability, Incident Investigation, Performance
  Optimization, Kubernetes Cost Management, GenAI Observability, Resilience & Compliance
  Automation), Turbonomic 6 (Cloud Cost Optimization, Kubernetes Resource Optimization,
  GPU Optimization, Data Center Modernization, Cloud Migration Planning, VMware
  Optimization). In both add/edit modals the product dropdown drives the use-case
  dropdown, and a "custom use case" checkbox swaps the dropdown for a free-text field
  (`useCase: 'custom'` + `customUseCase`). Old records with pre-product use-case ids
  keep their labels via a legacy map and can be edited (they surface as custom text).

## 1.3 Core logic (all implemented in the sources — verify, don't re-derive)

- **Counting rule:** a deal is outbound-touched when ≥1 session with the SAME match key
  was delivered ON OR BEFORE the deal's open date. The match key is the catalog use-case
  id, or for custom entries `product + trimmed-lowercased text` — so custom sessions and
  deals match when the product and the wording agree. Untouched deals are shown as
  excluded (hollow markers, em dashes), never hidden.
- **Matched session:** by default the earliest eligible session; a deal may optionally be
  tied to a specific session via `sourceSessionId`. Tie eligibility is any session on the
  deal's PRODUCT delivered on or before the open date (not just the same use case). The
  deal form's dropdown "Automatic" option NAMES the earliest automatic match and the
  manual list EXCLUDES that session. Tied deals show " · tied manually"; stale ties fall
  back to automatic silently.
- **Scheduled sessions:** sessions dated after today appear in the Upcoming strip, the
  sessions table (blue "Scheduled" tag, em-dash attendees), the calendar, and the
  Products cards' "scheduled" counts — but are excluded from every delivered total
  (count, attendees, hours, value/hour, coverage).
- **Fiscal calendar:** FY = calendar year; quarter-paged charts and the Products view are
  bounded between the earliest data quarter and the current quarter; "Today" marker in
  the current quarter; cross-quarter touchpoints drawn as dashed carried curves labeled
  "from Qn". On the Products page, deals count in the quarter they OPENED; "Closed won
  in quarter" counts by close-date quarter.
- **Insights engine:** tones strong/mixed/weak/even/early/none from per-metric outcomes
  with epsilons (win rate ±2 pts, size ±5%, cycle ±2 days); small-sample caveat when
  touched n < 4 or untouched n < 2; generated recommended actions (invest where a
  product's demand outruns coverage by ≥5 pts, products with deals but no sessions,
  review stalled touched deals, data hygiene asks).

## 1.4 Persistence — two modes, decided at build time

- **Shared mode (the production deployment):** when `VITE_API_URL` is set, ALL users read
  and write ONE shared document `{version, enablements[], deals[]}`. No demo data; no
  reset-demo control; a truthful header sync badge (`Saving…` from the instant a change
  exists, `Saved` only after the server confirms, `Offline — changes not saved` on
  failure with automatic retry); mutations apply to the UI instantly, queue as
  deterministic functions, save debounced, and on version conflict adopt-replay-retry so
  simultaneous entries from two people BOTH survive; a 20 s poll brings in other users'
  changes without refreshing; a pagehide keepalive flush protects against tab-close data
  loss; localStorage is a read cache only. With `VITE_API_KIND=blob` the store works
  against a dumb JSON-document host (GET returns the document, PUT overwrites) using a
  pre-flight read as the version check — this is the production configuration (Part 3).
- **Standalone mode (local dev only, no env vars):** original behavior — localStorage,
  demo seed dataset, reset-to-demo header control.
- **Admin reset:** in shared mode a trash-can header action opens a danger modal
  ("Reset all data") gated by an administration key verified against a SHA-256 hash —
  only the hash ships in the bundle. The hash in the sources corresponds to the key
  currently in use by the team; keep it EXACTLY as-is so the existing key keeps working.
  The wipe goes through the synced store so it reaches every open browser.

## 1.5 Audit trail, recycle bin, activity log (shared mode)

- **Who is editing:** on first visit in shared mode a name modal asks "Who is this?"
  before records can be entered; the name lives in localStorage (`USER_KEY`) and can be
  changed anytime via the header's user-avatar action. Every add stamps
  `createdBy/createdAt`, every edit `updatedBy/updatedAt`; tables show a helper-text
  sub-line ("added by X" / "edited by Y" via `authorNote`).
- **Soft delete:** deleting a record sets `deletedAt/deletedBy` instead of removing it.
  Each table page has a "Recently deleted" panel listing deleted rows with who/when and
  a Restore button (restore drops the deletion fields). Records deleted more than 30
  days ago (`SOFT_DELETE_DAYS`) are purged permanently by a once-per-session synced
  sweep. The admin "Reset all data" is the only hard wipe.
- **Activity log:** every mutation appends `{at, by, action}` to a per-record `history`
  (capped at 20, synced inside the record). The header shows a clickable "Last edited by
  {name}" badge that opens a modal listing every add/edit/delete/restore across all
  records, newest first, capped at 100, with a stamps fallback for records that predate
  `history`.

## 1.6 Hard-won implementation warnings (each of these broke a previous build)

1. `src/main.jsx` MUST import `./index.scss` first, and `sass-embedded` must be a dev
   dependency — if ANY text renders in a serif font, the stylesheet is not loading; stop
   and fix that before anything else.
2. Import `PasswordInput` directly from `@carbon/react`. `TextInput.PasswordInput` is
   undefined in this Carbon version and blank-screens the entire app.
3. The deployment workflow REBUILDS the app in CI — the env vars must be set in the
   workflow's build step (Part 3), not just in your local shell, or the deployed site
   silently ships standalone demo mode.
4. Do NOT set `VITE_BUILD_SHA` — the outdated-copy banner mechanism it enables is for
   frozen-snapshot-URL deployments only and must stay dormant on a Pages deployment that
   updates in place.
5. All neutral colors come from Carbon theme tokens (`--cds-*`); the only hardcoded hexes
   are the three product color pairs, the accent pair `#0f62fe`/`#4589ff`, context grays
   `#a8a8a8`/`#6f6f6f`, neutral `#8d8d8d`, warning `#f1c21b`, and the always-light
   one-pager palette. Hardcoding neutrals breaks dark mode (black-on-black).
6. Helper names starting with `use` (e.g. `useCaseLabelOf`) get lint-flagged as React
   hooks — the sources use `getUseCaseLabel` etc.; keep those names.
7. Never point the app at a NEW empty data store, and never auto-create one when the
   configured store fails a reachability check — that is how live team data was lost
   once. If the store does not answer, fail loudly and stop.

# Part 2 — The complete source code (transcribe verbatim)

Create exactly this file tree. Every file follows in full. `package-lock.json` is not
included — run `npm install` after creating `package.json`.

```
index.html
package.json
vite.config.js
src/main.jsx
src/App.jsx
src/index.scss
src/data/constants.js
src/data/quarters.js
src/data/seed.js
src/data/attribution.js
src/data/insights.js
src/data/store.jsx
src/components/KpiTile.jsx
src/components/UseCaseChip.jsx
src/components/UpcomingSessions.jsx
src/components/ComparisonPanel.jsx
src/components/CoveragePanel.jsx
src/components/QuarterlyPipeline.jsx
src/components/InfluenceTimeline.jsx
src/components/MonthCalendar.jsx
src/components/EnablementModal.jsx
src/components/DealModal.jsx
src/components/AdminResetModal.jsx
src/components/NameModal.jsx
src/components/RecentlyDeleted.jsx
src/components/ActivityLogModal.jsx
src/pages/Impact.jsx
src/pages/Enablements.jsx
src/pages/Pipeline.jsx
src/pages/Products.jsx
src/pages/OnePager.jsx
src/pages/Glossary.jsx
server/server.mjs        (optional alternative backend — NOT used in the Part 3 deployment)
```

## `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Outbound Pipeline View</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## `package.json`

```json
{
  "name": "ibm-sales-dashboard",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@carbon/react": "^1.112.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.1"
  },
  "devDependencies": {
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "oxlint": "^1.71.0",
    "sass-embedded": "^1.100.0",
    "vite": "^8.1.1"
  }
}
```

## `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build with relative asset paths ('./') so the bundle works when served from
// any sub-path — the `site` branch via raw.githack.com, GitHub Pages, or a
// plain static host — without knowing the host prefix ahead of time. Routing is
// hash-based (HashRouter), so no server rewrites are needed either.
// Dev server keeps root base so `npm run dev` works normally.
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
}))
```

## `src/main.jsx`

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

## `src/App.jsx`

```jsx
import { useEffect, useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  Content,
  Theme,
} from '@carbon/react'
import { Asleep, Light, Renew, TrashCan, UserAvatar } from '@carbon/icons-react'
import { useStore, SHARED_MODE } from './data/store.jsx'
import AdminResetModal from './components/AdminResetModal.jsx'
import NameModal from './components/NameModal.jsx'
import ActivityLogModal from './components/ActivityLogModal.jsx'
import Enablements from './pages/Enablements.jsx'
import Pipeline from './pages/Pipeline.jsx'
import Impact from './pages/Impact.jsx'
import Products from './pages/Products.jsx'
import OnePager from './pages/OnePager.jsx'
import Glossary from './pages/Glossary.jsx'

// Impact summary IS the landing page — one unambiguous page to show
// leadership; the other two tabs feed it.
const NAV = [
  { path: '/', label: 'Pipeline View' },
  { path: '/enablements', label: 'Enablements' },
  { path: '/pipeline', label: 'Deals' },
  { path: '/products', label: 'Products' },
]

const SYNC_LABEL = {
  loading: 'Loading…',
  saving: 'Saving…',
  saved: 'Saved',
  offline: 'Offline — changes not saved',
}

// Deployed links are frozen snapshots (the URL pins the exact build commit),
// so an old bookmark keeps old wording forever even though the shared data
// stays live. Each deployed build knows its own source commit; on load it
// asks GitHub what the newest deployed build is, and when they differ it
// offers a direct link to the fresh copy. Local/dev builds skip the check.
const BUILD_SHA = import.meta.env.VITE_BUILD_SHA || ''
const SITE_BRANCH_API = 'https://api.github.com/repos/hunain-malik/IBM-Sales-Dashboard/branches/site'

function useLatestBuildUrl() {
  const [latestUrl, setLatestUrl] = useState(null)
  useEffect(() => {
    if (!BUILD_SHA) return
    fetch(SITE_BRANCH_API)
      .then((r) => (r.ok ? r.json() : null))
      .then((branch) => {
        const built = branch?.commit?.commit?.message?.match(/Deploy dashboard build ([0-9a-f]{40})/)
        if (built && built[1] !== BUILD_SHA) {
          setLatestUrl(`https://rawcdn.githack.com/hunain-malik/IBM-Sales-Dashboard/${branch.commit.sha}/index.html`)
        }
      })
      .catch(() => {}) // no signal, no banner — never block the app on this
  }, [])
  return latestUrl
}

export default function App() {
  const { theme, setTheme, resetToDemo, syncStatus, userName, lastEdited } = useStore()
  const location = useLocation()
  const dark = theme === 'g100'
  const latestUrl = useLatestBuildUrl()
  const [adminReset, setAdminReset] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  // first visit in shared mode: ask who this is before they enter records
  const firstRun = SHARED_MODE && !userName

  return (
    <>
      <Theme theme="g100">
        <Header aria-label="IBM Outbound Pipeline View">
          <SkipToContent />
          <HeaderName as={Link} to="/" prefix="IBM">
            Outbound Pipeline View
          </HeaderName>
          <HeaderNavigation aria-label="Dashboard navigation">
            {NAV.map((item) => (
              <HeaderMenuItem
                key={item.path}
                as={Link}
                to={item.path}
                isActive={location.pathname === item.path}
              >
                {item.label}
              </HeaderMenuItem>
            ))}
          </HeaderNavigation>
          <HeaderGlobalBar>
            {SHARED_MODE && lastEdited && (
              <button
                type="button"
                className="sync-badge sync-badge--button"
                title="Open the activity log"
                onClick={() => setLogOpen(true)}
              >
                Last edited by {lastEdited.name}
              </button>
            )}
            {SHARED_MODE && syncStatus && (
              <span
                className={`sync-badge${syncStatus === 'offline' ? ' sync-badge--offline' : ''}`}
                role="status"
              >
                {SYNC_LABEL[syncStatus]}
              </span>
            )}
            {!SHARED_MODE && (
              <HeaderGlobalAction
                aria-label="Reset demo data"
                tooltipAlignment="end"
                onClick={() => {
                  if (window.confirm('Reset the dashboard to the demo dataset? Manually entered records will be removed.')) {
                    resetToDemo()
                  }
                }}
              >
                <Renew size={20} />
              </HeaderGlobalAction>
            )}
            {SHARED_MODE && (
              <HeaderGlobalAction
                aria-label="Change your name"
                tooltipAlignment="end"
                onClick={() => setNameOpen(true)}
              >
                <UserAvatar size={20} />
              </HeaderGlobalAction>
            )}
            {/* wiping the shared live store requires the administration key */}
            {SHARED_MODE && (
              <HeaderGlobalAction
                aria-label="Reset all data (administration)"
                tooltipAlignment="end"
                onClick={() => setAdminReset(true)}
              >
                <TrashCan size={20} />
              </HeaderGlobalAction>
            )}
            <HeaderGlobalAction
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              tooltipAlignment="end"
              onClick={() => setTheme(dark ? 'white' : 'g100')}
            >
              {dark ? <Light size={20} /> : <Asleep size={20} />}
            </HeaderGlobalAction>
          </HeaderGlobalBar>
        </Header>
      </Theme>
      <Theme theme={theme} className="app-theme">
        <Content className="app-content">
          {latestUrl && (
            <div className="stale-banner" role="status">
              You&apos;re viewing an older copy of this dashboard.{' '}
              <a href={latestUrl}>Open the latest version</a> — all data carries over automatically.
            </div>
          )}
          <Routes>
            <Route path="/" element={<Impact />} />
            <Route path="/enablements" element={<Enablements />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/products" element={<Products />} />
            {/* old bookmark support */}
            <Route path="/impact" element={<Impact />} />
            <Route path="/onepager" element={<OnePager />} />
            <Route path="/glossary" element={<Glossary />} />
          </Routes>
          <AdminResetModal open={adminReset} onClose={() => setAdminReset(false)} />
          <ActivityLogModal open={logOpen} onClose={() => setLogOpen(false)} />
          <NameModal
            open={firstRun || nameOpen}
            firstRun={firstRun}
            onClose={() => setNameOpen(false)}
          />
        </Content>
      </Theme>
    </>
  )
}
```

## `src/index.scss`

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

/* Outdated-copy notice (deployed links are frozen snapshots) */
.stale-banner {
  background: var(--cds-layer-01);
  border-left: 3px solid #f1c21b; /* Carbon support-warning */
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

/* Products page: per-product quarter cards */
.pp-dot {
  display: inline-block;
  vertical-align: baseline;
  margin-right: 0.25rem;
}

.pp-empty {
  font-size: 0.875rem;
  color: var(--cds-text-secondary);
  margin: 0;
}

.pp-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1px;
  margin-bottom: 1rem;
}

.pp-stat {
  background: var(--cds-layer-02);
  padding: 0.75rem 1rem;
}

.pp-stat__value {
  font-size: 1.75rem;
  font-weight: 300;
  line-height: 1.15;
}

.pp-stat__label {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

.pp-stat__detail {
  font-size: 0.75rem;
  color: var(--cds-text-helper);
  margin-top: 0.25rem;
}

.pp-table {
  max-width: 56rem;
}

.pp-table__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 7rem 8rem 8rem;
  gap: 1rem;
  padding: 0.5rem 0;
  border-top: 1px solid var(--cds-border-subtle-01);
  font-size: 0.875rem;
}

.pp-table__row--head {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--cds-text-secondary);
  border-top: none;
}

/* Recently-deleted recycle bin rows */
.rd-note {
  font-size: 0.75rem;
  color: var(--cds-text-helper);
  margin: -0.5rem 0 0.5rem;
}

.rd-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-top: 1px solid var(--cds-border-subtle-01);
}

.rd-row__label {
  font-size: 0.875rem;
}

.rd-row__meta {
  font-size: 0.75rem;
  color: var(--cds-text-helper);
}

/* Shared-mode sync status in the header (g100 bar, so fixed light inks) */
.sync-badge {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #a8a8a8;
  padding: 0 1rem;
  white-space: nowrap;
}

.sync-badge--offline {
  color: #ff8389;
}

/* the last-edited badge doubles as the activity-log trigger */
.sync-badge--button {
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: #ffffff;
    text-decoration: underline;
  }
}

/* Activity log rows */
.al-note {
  font-size: 0.75rem;
  color: var(--cds-text-helper);
  margin: 0 0 0.75rem;
}

.al-empty {
  font-size: 0.875rem;
  color: var(--cds-text-secondary);
  margin: 0;
}

.al-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-top: 1px solid var(--cds-border-subtle-01);
  font-size: 0.875rem;
}

.al-row__time {
  font-size: 0.75rem;
  color: var(--cds-text-helper);
  white-space: nowrap;
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

/* Carried-touchpoint marker: clickable — jumps to the origin quarter and
   rings the session the dashed line comes from */
.tl-carried {
  cursor: pointer;

  &:hover .tl-carried__caption {
    text-decoration: underline;
    fill: var(--cds-link-primary);
  }
}

.tl-origin-ring {
  animation: tl-origin-pulse 1.8s ease-in-out infinite;
}

@keyframes tl-origin-pulse {
  0%,
  100% {
    opacity: 0.85;
  }

  50% {
    opacity: 0.2;
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

## `src/data/constants.js`

```js
// The products the team enables on. Colors live at the PRODUCT level (three
// hues stay color-vision-deficiency-safe; a per-use-case palette could not),
// taken from the CVD-validated IBM Carbon data-viz ramp slots used since v1.
// Never assign these hues to anything that isn't a product.
export const PRODUCTS = [
  { id: 'concert-protect', label: 'Concert Protect', light: '#6929c4', dark: '#8a3ffc' },
  { id: 'instana',         label: 'Instana',         light: '#1192e8', dark: '#1192e8' },
  { id: 'turbonomic',      label: 'Turbonomic',      light: '#ee538b', dark: '#ee538b' },
]

const NO_PRODUCT_COLOR = '#8d8d8d' // records logged before the product field existed

export const getProduct = (id) => PRODUCTS.find((p) => p.id === id) ?? null

export const getProductColor = (id, theme) => {
  const p = getProduct(id)
  if (!p) return NO_PRODUCT_COLOR
  return theme === 'g100' ? p.dark : p.light
}

// Each product carries its own fixed use-case catalog; 'custom' (free text on
// the record as customUseCase) covers anything the catalogs don't describe.
export const USE_CASES_BY_PRODUCT = {
  'concert-protect': [
    { id: 'cp-vuln-mgmt',        label: 'Vulnerability Management' },
    { id: 'cp-compliance',       label: 'Compliance' },
    { id: 'cp-cert-mgmt',        label: 'Certificate Management' },
    { id: 'cp-sca',              label: 'Software Composition Analysis' },
    { id: 'cp-app-resilience',   label: 'Application Resilience' },
  ],
  'instana': [
    { id: 'in-observability',    label: 'Full-Stack Observability' },
    { id: 'in-incident',         label: 'Incident Investigation' },
    { id: 'in-performance',      label: 'Performance Optimization' },
    { id: 'in-k8s-cost',         label: 'Kubernetes Cost Management' },
    { id: 'in-genai',            label: 'GenAI Observability' },
    { id: 'in-resilience',       label: 'Resilience & Compliance Automation' },
  ],
  'turbonomic': [
    { id: 'tu-cloud-cost',       label: 'Cloud Cost Optimization' },
    { id: 'tu-k8s',              label: 'Kubernetes Resource Optimization' },
    { id: 'tu-gpu',              label: 'GPU Optimization' },
    { id: 'tu-dc-modernization', label: 'Data Center Modernization' },
    { id: 'tu-cloud-migration',  label: 'Cloud Migration Planning' },
    { id: 'tu-vmware',           label: 'VMware Optimization' },
  ],
}

const ALL_CATALOG = Object.values(USE_CASES_BY_PRODUCT).flat()

// v1's flat use-case list, kept ONLY so records logged before the product
// dimension existed still display their original label
const LEGACY_USE_CASES = {
  'vuln-mgmt': 'Vulnerability Management',
  'secure-coder': 'Secure Coder',
  'monitoring': 'Monitoring',
  'optimization': 'Optimization',
  'other': 'Other',
}

// display label for any record's use case: catalog id, custom text, or legacy
export const getUseCaseLabel = (r) => {
  if (r.useCase === 'custom') return r.customUseCase || 'Custom'
  const hit = ALL_CATALOG.find((u) => u.id === r.useCase)
  if (hit) return hit.label
  return LEGACY_USE_CASES[r.useCase] ?? r.useCase ?? '—'
}

// what has to be equal for a session and a deal to match automatically:
// catalog use cases match by id (which encodes the product); custom ones
// match when the product AND the wording (case/space-insensitive) agree
export const matchKeyOf = (r) =>
  r.useCase === 'custom'
    ? `custom:${r.product ?? ''}:${(r.customUseCase ?? '').trim().toLowerCase()}`
    : r.useCase

export const DEAL_STAGES = [
  'Prospecting',
  'Qualification',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
]

export const OPEN_STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation']

export const STAGE_TAG_TYPE = {
  'Prospecting': 'cool-gray',
  'Qualification': 'cool-gray',
  'Proposal': 'blue',
  'Negotiation': 'blue',
  'Closed Won': 'green',
  'Closed Lost': 'gray',
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2,
})

export const fmtUSD = (n) => usd.format(n)
export const fmtUSDCompact = (n) => usdCompact.format(n)

export const fmtPct = (ratio) => `${Math.round(ratio * 100)}%`

export const fmtDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

// Who to ask about a record — the latest edit stamp wins over the add stamp.
// Returns null for records created before the audit trail existed.
export const authorNote = (r) =>
  r.updatedBy ? `edited by ${r.updatedBy}` : r.createdBy ? `added by ${r.createdBy}` : null

// Local-date ISO (YYYY-MM-DD). Not toISOString(): that is UTC and would flip
// the date near midnight, making a session count as delivered a day early/late.
export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// "Reset all data" administration key. Only this SHA-256 hash ships in the
// bundle, so the key itself is not readable in the page source. To change the
// key, run in any browser console and paste the output here:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('new-key')).then(
//     (b) => console.log([...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')))
export const ADMIN_KEY_HASH = '69308d325e093f046c5884277efcecc3d3dafc14c5828a1941a6fb24271f814c'

export const sha256Hex = async (text) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// "Request a session" opens the seller's mail client pre-filled. Set the
// enablement team's distribution list here before sharing the dashboard;
// while empty, the To field is simply left blank.
export const SESSION_REQUEST_EMAIL = ''

export const sessionRequestMailto = (useCaseLabel) => {
  const subject = 'Enablement session request'
  const body = [
    'Hi team,',
    '',
    'I’d like to request an enablement session.',
    '',
    `Use case: ${useCaseLabel || ''}`,
    'Customer / audience: ',
    'Preferred timing: ',
  ].join('\n')
  return `mailto:${SESSION_REQUEST_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
```

## `src/data/quarters.js`

```js
// IBM's fiscal year matches the calendar year, so fiscal quarters are
// calendar quarters: Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec.
export const quarterStart = (d) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)
export const nextQuarter = (q) => new Date(q.getFullYear(), q.getMonth() + 3, 1)
export const prevQuarter = (q) => quarterStart(new Date(q.getFullYear(), q.getMonth() - 3, 1))
export const quarterLabel = (q) => `Q${Math.floor(q.getMonth() / 3) + 1} ${q.getFullYear()}`
```

## `src/data/seed.js`

```js
// Demo data so the dashboard tells its story on first load (standalone/dev
// mode only — the shared deployment starts from the server). Records carry
// the product dimension: product id + a use case from that product's catalog,
// or useCase 'custom' with the text in customUseCase.
// `hours` is the team effort invested in a session (prep + delivery).
export const seedEnablements = [
  { id: 'e1',  title: 'Concert Protect Vulnerability Deep Dive',      product: 'concert-protect', useCase: 'cp-vuln-mgmt',    date: '2026-02-10', presenter: 'T. Almeida',  attendees: 18, hours: 6 },
  { id: 'e2',  title: 'Instana Observability Workshop',               product: 'instana',         useCase: 'in-observability', date: '2026-02-24', presenter: 'P. Kowalska', attendees: 24, hours: 8 },
  { id: 'e3',  title: 'Turbonomic Cloud Cost Clinic',                 product: 'turbonomic',      useCase: 'tu-cloud-cost',    date: '2026-03-05', presenter: 'T. Almeida',  attendees: 15, hours: 5 },
  { id: 'e4',  title: 'Concert Protect Compliance Lab',               product: 'concert-protect', useCase: 'cp-compliance',    date: '2026-03-18', presenter: 'P. Kowalska', attendees: 12, hours: 4 },
  { id: 'e5',  title: 'Instana Incident Investigation Bootcamp',      product: 'instana',         useCase: 'in-incident',      date: '2026-04-02', presenter: 'P. Kowalska', attendees: 20, hours: 6 },
  { id: 'e6',  title: 'Turbonomic Kubernetes Optimization Workshop',  product: 'turbonomic',      useCase: 'tu-k8s',           date: '2026-04-21', presenter: 'J. Kim',      attendees: 30, hours: 12 },
  { id: 'e7',  title: 'Instana GenAI Observability Briefing',         product: 'instana',         useCase: 'in-genai',         date: '2026-05-12', presenter: 'P. Kowalska', attendees: 17, hours: 4 },
  { id: 'e8',  title: 'Concert Protect SCA Hands-on',                 product: 'concert-protect', useCase: 'cp-sca',           date: '2026-06-09', presenter: 'T. Almeida',  attendees: 22, hours: 6 },
  // a custom use case: nothing in the Instana catalog says "mainframe"
  { id: 'e9',  title: 'Mainframe Observability Roundtable',           product: 'instana',         useCase: 'custom', customUseCase: 'Mainframe observability', date: '2026-07-08', presenter: 'P. Kowalska', attendees: 14, hours: 2 },
  // Scheduled sessions (future-dated): shown in "Upcoming sessions" and on
  // the calendar, excluded from every delivered total until their date passes.
  { id: 'e10', title: 'Turbonomic GPU Optimization Briefing',         product: 'turbonomic',      useCase: 'tu-gpu',           date: '2026-08-12', presenter: 'J. Kim',      attendees: 0, hours: 3 },
  { id: 'e11', title: 'Concert Protect Certificate Management Demo',  product: 'concert-protect', useCase: 'cp-cert-mgmt',     date: '2026-08-27', presenter: 'T. Almeida',  attendees: 0, hours: 2 },
]

// `closeDate` is set once a deal reaches Closed Won / Closed Lost and is used
// to compare sales-cycle length between touched and untouched deals.
export const seedDeals = [
  { id: 'd1',  customer: 'Acme Financial',        product: 'concert-protect', useCase: 'cp-vuln-mgmt',    value: 420000, date: '2026-03-02', stage: 'Negotiation',   owner: 'T. Nguyen' },
  { id: 'd2',  customer: 'Globex Retail',         product: 'instana',         useCase: 'in-observability', value: 250000, date: '2026-03-14', stage: 'Closed Won',    owner: 'L. Ortiz',  closeDate: '2026-05-02' },
  { id: 'd3',  customer: 'Initech Manufacturing', product: 'turbonomic',      useCase: 'tu-cloud-cost',    value: 180000, date: '2026-04-08', stage: 'Proposal',      owner: 'T. Nguyen' },
  { id: 'd4',  customer: 'Umbrella Health',       product: 'concert-protect', useCase: 'cp-compliance',    value: 610000, date: '2026-04-27', stage: 'Closed Won',    owner: 'R. Walker', closeDate: '2026-06-20' },
  { id: 'd5',  customer: 'Stark Industries',      product: 'instana',         useCase: 'in-incident',      value: 340000, date: '2026-05-06', stage: 'Negotiation',   owner: 'L. Ortiz' },
  { id: 'd6',  customer: 'Wayne Enterprises',     product: 'turbonomic',      useCase: 'tu-k8s',           value: 520000, date: '2026-05-22', stage: 'Closed Won',    owner: 'R. Walker', closeDate: '2026-07-08' },
  { id: 'd7',  customer: 'Soylent Foods',         product: 'instana',         useCase: 'in-genai',         value: 95000,  date: '2026-06-15', stage: 'Qualification', owner: 'T. Nguyen' },
  { id: 'd8',  customer: 'Hooli Cloud',           product: 'concert-protect', useCase: 'cp-sca',           value: 275000, date: '2026-07-01', stage: 'Proposal',      owner: 'L. Ortiz' },
  // NOT touched: no VMware Optimization session has been delivered
  { id: 'd9',  customer: 'Pied Piper',            product: 'turbonomic',      useCase: 'tu-vmware',        value: 60000,  date: '2026-05-19', stage: 'Prospecting',   owner: 'R. Walker' },
  // NOT touched: opened before the first Instana observability session
  { id: 'd10', customer: 'Vandelay Imports',      product: 'instana',         useCase: 'in-observability', value: 130000, date: '2026-02-12', stage: 'Closed Lost',   owner: 'T. Nguyen', closeDate: '2026-04-30' },
  // touched AND lost — shown honestly
  { id: 'd11', customer: 'Cyberdyne Systems',     product: 'concert-protect', useCase: 'cp-vuln-mgmt',    value: 150000, date: '2026-03-25', stage: 'Closed Lost',   owner: 'R. Walker', closeDate: '2026-05-15' },
  // touched via CUSTOM use-case matching (same product + same wording as e9)
  { id: 'd12', customer: 'Pier 57 Logistics',     product: 'instana',         useCase: 'custom', customUseCase: 'Mainframe observability', value: 90000, date: '2026-07-20', stage: 'Qualification', owner: 'L. Ortiz' },
]
```

## `src/data/attribution.js`

```js
import { OPEN_STAGES, todayIso, matchKeyOf, PRODUCTS } from './constants.js'

// A deal is "enablement-influenced" when at least one enablement session on
// the same use case took place on or before the deal date. Use cases match
// by their match key (catalog id, or product + wording for custom ones).
export function attributeDeals(deals, enablements) {
  return deals.map((deal) => {
    const key = matchKeyOf(deal)
    const matched = enablements
      .filter((e) => matchKeyOf(e) === key && e.date <= deal.date)
      .sort((a, b) => a.date.localeCompare(b.date))
    // A deal can be tied to one specific session (sourceSessionId). Tie
    // eligibility is broader than automatic matching: any session on the
    // SAME PRODUCT delivered on or before the open date qualifies — the tie
    // is a human assertion of which session mattered, and product is the
    // boundary leadership reports on. The tied session moves to the front
    // (added if the automatic rule didn't find it). A stale tie (session
    // deleted, product/date changed) silently falls back to automatic.
    if (deal.sourceSessionId) {
      const i = matched.findIndex((s) => s.id === deal.sourceSessionId)
      if (i > 0) {
        matched.unshift(matched.splice(i, 1)[0])
      } else if (i === -1) {
        const tied = enablements.find(
          (s) =>
            s.id === deal.sourceSessionId &&
            s.date <= deal.date &&
            (deal.product ? s.product === deal.product : matchKeyOf(s) === key),
        )
        if (tied) matched.unshift(tied)
      }
    }
    return { ...deal, matched, influenced: matched.length > 0 }
  })
}

export function impactSummary(deals, enablements) {
  const attributed = attributeDeals(deals, enablements)
  const influenced = attributed.filter((d) => d.influenced)
  const wonInfluenced = influenced.filter((d) => d.stage === 'Closed Won')
  const openInfluenced = influenced.filter((d) => OPEN_STAGES.includes(d.stage))
  const wonRevenue = wonInfluenced.reduce((s, d) => s + d.value, 0)
  const pipelineRevenue = openInfluenced.reduce((s, d) => s + d.value, 0)
  // scheduled (future-dated) sessions show as "upcoming" but must not count
  // in any delivered total until their date passes
  const delivered = enablements.filter((e) => e.date <= todayIso())
  const totalHours = delivered.reduce((s, e) => s + (Number(e.hours) || 0), 0)
  return {
    attributed,
    influenced,
    influencedCount: influenced.length,
    totalDeals: deals.length,
    wonRevenue,
    pipelineRevenue,
    sessionCount: delivered.length,
    attendeeCount: delivered.reduce((s, e) => s + (Number(e.attendees) || 0), 0),
    totalHours,
    // ROI headline: influenced value (won + open) per team hour invested
    valuePerHour: totalHours > 0 ? (wonRevenue + pipelineRevenue) / totalHours : null,
  }
}

const DAY_MS = 24 * 60 * 60 * 1000
const daysBetween = (fromIso, toIso) =>
  Math.round((new Date(`${toIso}T00:00:00`) - new Date(`${fromIso}T00:00:00`)) / DAY_MS)

// Influenced vs. not-influenced: win rate, average deal size, sales-cycle
// length. Null metrics mean "not enough data" (e.g. no closed deals yet).
export function comparisonStats(deals, enablements) {
  const attributed = attributeDeals(deals, enablements)
  const stats = (list) => {
    const won = list.filter((d) => d.stage === 'Closed Won')
    const lost = list.filter((d) => d.stage === 'Closed Lost')
    const closed = [...won, ...lost].filter((d) => d.closeDate)
    return {
      n: list.length,
      winRate: won.length + lost.length ? won.length / (won.length + lost.length) : null,
      avgSize: list.length ? list.reduce((s, d) => s + d.value, 0) / list.length : null,
      cycleDays: closed.length
        ? closed.reduce((s, d) => s + daysBetween(d.date, d.closeDate), 0) / closed.length
        : null,
    }
  }
  return {
    influenced: stats(attributed.filter((d) => d.influenced)),
    rest: stats(attributed.filter((d) => !d.influenced)),
  }
}

// Where to invest next: per PRODUCT, the share of customer demand (deal
// value) vs. the share of enablement effort. A positive gap means customers
// want more of a product than we currently enable on. Coverage share is
// hour-weighted when hours are recorded, session-weighted otherwise.
// Only delivered sessions count as coverage — a session on the calendar
// hasn't covered anything yet. Records logged before the product field
// existed group under a "No product" row (shown only when present).
export function coverageGaps(deals, enablements) {
  const delivered = enablements.filter((e) => e.date <= todayIso())
  const attributed = attributeDeals(deals, enablements)
  const totalValue = deals.reduce((s, d) => s + d.value, 0)
  const totalHours = delivered.reduce((s, e) => s + (Number(e.hours) || 0), 0)
  const byHours = totalHours > 0
  const totalSessions = delivered.length
  const groups = [...PRODUCTS, { id: null, label: 'No product' }]
  return groups
    .map((p) => {
      const inGroup = (r) => (p.id ? r.product === p.id : !r.product)
      const pDeals = attributed.filter(inGroup)
      const sessions = delivered.filter(inGroup)
      const demandValue = pDeals.reduce((s, d) => s + d.value, 0)
      const hours = sessions.reduce((s, e) => s + (Number(e.hours) || 0), 0)
      const demandShare = totalValue ? demandValue / totalValue : 0
      const coverageShare = byHours
        ? hours / totalHours
        : totalSessions
          ? sessions.length / totalSessions
          : 0
      const touched = pDeals.filter((d) => d.influenced)
      return {
        product: p.id,
        label: p.label,
        demandValue,
        dealCount: pDeals.length,
        sessionCount: sessions.length,
        hours,
        demandShare,
        coverageShare,
        gap: demandShare - coverageShare,
        // per-product outcome figures for the one-pager and Products view
        touchedCount: touched.length,
        wonRevenue: touched.filter((d) => d.stage === 'Closed Won').reduce((s, d) => s + d.value, 0),
        pipelineRevenue: touched.filter((d) => OPEN_STAGES.includes(d.stage)).reduce((s, d) => s + d.value, 0),
      }
    })
    .filter((r) => r.dealCount > 0 || r.sessionCount > 0)
    .sort((a, b) => b.gap - a.gap)
}

// (Monthly bucketing lives in QuarterlyPipeline; the earlier Sankey/alluvial
// graph was removed because its per-session revenue splits were fabricated
// allocations — InfluenceTimeline shows the session→deal pairing honestly.)
```

## `src/data/insights.js`

```js
import { impactSummary, comparisonStats, coverageGaps } from './attribution.js'
import { fmtUSDCompact, fmtPct } from './constants.js'

// The executive narrative engine. Everything the dashboard *says* about the
// numbers is generated here from the numbers, so the story stays true when
// the demo data is replaced with real data: strong results read as strong,
// mixed results read as mixed, and missing data asks for what's missing —
// never a hardcoded claim.

const INVEST_GAP = 0.05 // demand share must outrun coverage share by ≥5 pts

// per-metric outcome: better / worse / even / unknown, with an epsilon so
// hairline differences don't get oversold
function outcome(a, b, { lowerIsBetter = false, eps = 0 } = {}) {
  if (a == null || b == null) return 'unknown'
  const diff = lowerIsBetter ? b - a : a - b
  if (Math.abs(diff) <= eps) return 'even'
  return diff > 0 ? 'better' : 'worse'
}

const fmtDays = (v) => `${Math.round(v)} days`

export function buildInsights(deals, enablements) {
  const summary = impactSummary(deals, enablements)
  const comparison = comparisonStats(deals, enablements)
  const coverage = coverageGaps(deals, enablements)
  const { influenced: a, rest: b } = comparison

  const asks = []

  // ---- comparison verdict -------------------------------------------------
  const metrics = [
    {
      state: outcome(a.winRate, b.winRate, { eps: 0.02 }),
      win: `a higher win rate (${fmtPct(a.winRate ?? 0)} vs ${fmtPct(b.winRate ?? 0)})`,
      loss: `a lower win rate (${fmtPct(a.winRate ?? 0)} vs ${fmtPct(b.winRate ?? 0)})`,
    },
    {
      state: outcome(a.avgSize, b.avgSize, { eps: (b.avgSize ?? 0) * 0.05 }),
      win: a.avgSize && b.avgSize ? `${(a.avgSize / b.avgSize).toFixed(1)}× larger deals (${fmtUSDCompact(a.avgSize)} vs ${fmtUSDCompact(b.avgSize)})` : '',
      loss: a.avgSize && b.avgSize ? `smaller deals (${fmtUSDCompact(a.avgSize)} vs ${fmtUSDCompact(b.avgSize)})` : '',
    },
    {
      state: outcome(a.cycleDays, b.cycleDays, { lowerIsBetter: true, eps: 2 }),
      win: a.cycleDays != null && b.cycleDays != null ? `closing ${Math.round(b.cycleDays - a.cycleDays)} days faster (${fmtDays(a.cycleDays)} vs ${fmtDays(b.cycleDays)})` : '',
      loss: a.cycleDays != null && b.cycleDays != null ? `closing ${Math.round(a.cycleDays - b.cycleDays)} days slower (${fmtDays(a.cycleDays)} vs ${fmtDays(b.cycleDays)})` : '',
    },
  ]
  const wins = metrics.filter((m) => m.state === 'better')
  const losses = metrics.filter((m) => m.state === 'worse')
  const known = metrics.filter((m) => m.state !== 'unknown')

  const smallSample = summary.totalDeals > 0 && (a.n < 4 || b.n < 2)
  const caveat = smallSample && known.length > 0
    ? `Small sample (${a.n} outbound-touched vs ${b.n} not) — read as an early signal, not a proven effect.`
    : null

  const joinList = (items) =>
    items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

  let tone
  let headline
  if (summary.totalDeals === 0 && summary.sessionCount === 0) {
    tone = 'none'
    headline = 'No data yet — log enablement sessions and customer deals to populate this view.'
  } else if (summary.totalDeals === 0) {
    tone = 'none'
    headline = `${summary.sessionCount} sessions delivered, no deals tracked yet — add the pipeline to connect enablement to revenue.`
  } else if (summary.influencedCount === 0) {
    tone = 'none'
    headline = summary.sessionCount === 0
      ? 'No enablement sessions logged yet, so no deals count as outbound-touched.'
      : 'No tracked deals have followed a session yet — no outbound touchpoints to report.'
  } else if (known.length === 0) {
    tone = 'early'
    headline = `A session preceded ${summary.influencedCount} of ${summary.totalDeals} deals (${fmtPct(summary.influencedCount / summary.totalDeals)}), but there aren't enough closed deals to compare performance yet.`
  } else if (losses.length === 0 && wins.length > 0) {
    tone = 'strong'
    headline = `Outbound-touched deals outperform: ${joinList(wins.map((m) => m.win))}.`
  } else if (wins.length > 0 && losses.length > 0) {
    tone = 'mixed'
    headline = `Mixed results: outbound-touched deals show ${joinList(wins.map((m) => m.win))}, but ${joinList(losses.map((m) => m.loss))}.`
  } else if (losses.length > 0) {
    tone = 'weak'
    headline = `Outbound-touched deals aren't outperforming yet: ${joinList(losses.map((m) => m.loss))}.`
  } else {
    tone = 'even'
    // don't overstate: if win rate / cycle are unknowable, say so
    headline = known.length < metrics.length
      ? 'On what can be measured so far, outbound-touched and untouched deals look similar — close more deals to compare win rate and cycle length.'
      : 'Outbound-touched and untouched deals are performing about the same so far.'
  }

  // ---- asks: coverage -----------------------------------------------------
  const invest = coverage.filter((r) => r.gap >= INVEST_GAP)
  const uncovered = coverage.filter((r) => r.dealCount > 0 && r.sessionCount === 0 && r.gap < INVEST_GAP)
  if (invest.length) {
    const top = invest[0]
    asks.push(
      `Add enablement capacity on ${joinList(invest.map((r) => r.label))} — customer demand outruns coverage (${top.label}: ${fmtPct(top.demandShare)} of demand vs ${fmtPct(top.coverageShare)} of our effort).`,
    )
  }
  if (uncovered.length) {
    asks.push(`Customers are active on ${joinList(uncovered.map((r) => r.label))} with no enablement delivered yet.`)
  }
  if (!invest.length && !uncovered.length && coverage.length > 0 && summary.sessionCount > 0) {
    asks.push('Enablement coverage is balanced with customer demand — maintain the current cadence.')
  }

  // ---- asks: comparison follow-ups ---------------------------------------
  if (tone === 'weak' || tone === 'mixed') {
    asks.push('Review the outbound-touched deals that stalled or lost — check whether session timing, content, or audience needs adjusting before scaling up.')
  }

  // ---- asks: data hygiene (what would sharpen the numbers) ---------------
  if (summary.sessionCount > 0 && summary.totalHours === 0) {
    asks.push('Record team hours on sessions to unlock the value-per-hour ROI metric.')
  }
  const closedDeals = deals.filter((d) => d.stage === 'Closed Won' || d.stage === 'Closed Lost')
  if (closedDeals.length > 0 && closedDeals.every((d) => !d.closeDate)) {
    asks.push('Add close dates to closed deals to compare sales-cycle length.')
  }

  return { tone, headline, caveat, asks, summary, comparison, coverage }
}

// short section heading per tone — the sentence-level detail lives in `headline`
export const toneHeading = {
  strong: 'Outbound-touched deals perform better',
  mixed: 'Outbound-touched deals: mixed results',
  weak: 'Outbound-touched deals: no edge yet',
  even: 'Outbound-touched deals: on par so far',
  early: 'Deal performance: too early to compare',
  none: 'Deal performance comparison',
}
```

## `src/data/store.jsx`

```jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { seedEnablements, seedDeals } from './seed.js'

// Two persistence modes:
//
// - STANDALONE (no VITE_API_URL at build time): the original behavior —
//   browser localStorage, seeded with the demo dataset, reset-to-demo control
//   in the header. This is what the public static demo runs.
//
// - SHARED (VITE_API_URL set): the store syncs one shared document with the
//   tiny REST backend in server/server.mjs. The server is the source of
//   truth; localStorage is only a read cache for instant first paint. No demo
//   seed, no reset control. Mutations apply locally at once (the UI never
//   waits on the network), are queued, and are saved debounced; a 409 from
//   the server (someone else saved first) adopts the server document,
//   re-applies the queued mutations on top, and retries — so two people
//   entering records at the same time both keep their entries. A poll picks
//   up other people's changes without a refresh.
const API_URL = import.meta.env.VITE_API_URL || ''
// 'server' = our server/server.mjs (real 409 conflict handling).
// 'blob'   = a dumb JSON-document store (e.g. jsonblob.com): GET returns the
//            document, PUT overwrites it, no server-side version check — so
//            the compare-and-swap is emulated client-side with a pre-flight
//            read before every save.
const API_KIND = import.meta.env.VITE_API_KIND || 'server'
export const SHARED_MODE = Boolean(API_URL)

// v2: enablements gained `hours`, deals gained `closeDate`.
// v3: seed gained scheduled (future-dated) sessions for the upcoming strip.
// v4: records gained the product dimension (product + per-product use cases);
// bumping the key re-seeds standalone browsers that stored old demo data.
const DATA_KEY = 'enablement-dashboard-data-v4'
const CACHE_KEY = 'enablement-dashboard-shared-cache-v1'
const THEME_KEY = 'enablement-dashboard-theme'
const USER_KEY = 'enablement-dashboard-user'
const SAVE_DEBOUNCE_MS = 500
// soft-deleted records are restorable for this long, then purged for good
const SOFT_DELETE_DAYS = 30

// ?pollMs=2000 lets integration tests speed up cross-client refresh
const POLL_MS = (() => {
  const n = Number(new URLSearchParams(window.location.search).get('pollMs'))
  return Number.isFinite(n) && n >= 500 ? n : 20000
})()

const StoreContext = createContext(null)

const validDoc = (d) => d && Array.isArray(d.enablements) && Array.isArray(d.deals)

function loadLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DATA_KEY))
    if (validDoc(parsed)) return { enablements: parsed.enablements, deals: parsed.deals }
  } catch {
    // corrupted storage falls through to seed
  }
  return { enablements: seedEnablements, deals: seedDeals }
}

function loadCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (validDoc(parsed)) return { enablements: parsed.enablements, deals: parsed.deals }
  } catch {
    // no cache yet
  }
  return { enablements: [], deals: [] }
}

const newId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`)

export function StoreProvider({ children }) {
  const [data, setData] = useState(() => (SHARED_MODE ? loadCache() : loadLocal()))
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'white')
  // who is using this browser — attached to every record they add/edit/delete
  const [userName, setUserNameState] = useState(() => localStorage.getItem(USER_KEY) || '')
  // null in standalone mode; 'loading' | 'saving' | 'saved' | 'offline' when shared
  const [syncStatus, setSyncStatus] = useState(SHARED_MODE ? 'loading' : null)

  const setUserName = (name) => {
    const trimmed = name.trim()
    setUserNameState(trimmed)
    localStorage.setItem(USER_KEY, trimmed)
  }

  // ---- shared-mode sync engine -------------------------------------------
  const versionRef = useRef(0) // last server version we based our data on
  const baseRef = useRef({ enablements: [], deals: [] }) // server doc at that version
  const pendingRef = useRef([]) // mutation fns not yet confirmed by the server
  const savingRef = useRef(false)
  const saveTimer = useRef(null)

  const applyAll = (fns, doc) => fns.reduce((d, fn) => fn(d), doc)

  const putJson = (body) =>
    fetch(API_URL, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  const docVersion = (d) => (Number.isInteger(d?.version) ? d.version : 0)
  const asDoc = (d) => (validDoc(d) ? { enablements: d.enablements, deals: d.deals } : { enablements: [], deals: [] })

  // Save `doc` on top of `baseVersion`. Resolves { version } on success or
  // { conflict, server } when someone else saved first; throws on network or
  // server errors.
  const persist = async (doc, baseVersion) => {
    if (API_KIND === 'blob') {
      // no server-side version check — emulate compare-and-swap with a
      // pre-flight read (a small race window remains; acceptable for a small
      // team saving whole documents seconds apart)
      const cur = await fetch(API_URL)
      if (!cur.ok) throw new Error(`load failed (${cur.status})`)
      const remote = await cur.json()
      if (docVersion(remote) !== baseVersion) return { conflict: true, server: remote }
      const res = await putJson({ version: baseVersion + 1, ...doc })
      if (!res.ok) throw new Error(`save failed (${res.status})`)
      return { version: baseVersion + 1 }
    }
    const res = await putJson({ version: baseVersion, ...doc })
    if (res.status === 409) return { conflict: true, server: await res.json() }
    if (!res.ok) throw new Error(`save failed (${res.status})`)
    return { version: (await res.json()).version }
  }

  const doSave = async () => {
    if (!SHARED_MODE || savingRef.current || pendingRef.current.length === 0) return
    savingRef.current = true
    setSyncStatus('saving')
    // snapshot: mutations added while this request is in flight stay queued
    const count = pendingRef.current.length
    const doc = applyAll(pendingRef.current.slice(0, count), baseRef.current)
    try {
      const result = await persist(doc, versionRef.current)
      if (result.conflict) {
        // someone else saved first: adopt their document, replay our queued
        // mutations on top, and try again from the new version
        versionRef.current = docVersion(result.server)
        baseRef.current = asDoc(result.server)
        setData(applyAll(pendingRef.current, baseRef.current))
        savingRef.current = false
        return doSave()
      }
      versionRef.current = result.version
      baseRef.current = doc
      pendingRef.current = pendingRef.current.slice(count)
      savingRef.current = false
      if (pendingRef.current.length) return doSave()
      setSyncStatus('saved')
    } catch {
      savingRef.current = false
      setSyncStatus('offline') // queued mutations retry on the next poll tick
    }
  }

  useEffect(() => {
    if (!SHARED_MODE) return undefined
    let stopped = false
    const refresh = async (first) => {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(`load failed (${res.status})`)
        // a brand-new document path (e.g. Firebase REST) returns the JSON
        // literal null before the first write — treat it as an empty store
        const server = (await res.json()) ?? { version: 0, enablements: [], deals: [] }
        if (stopped || !validDoc(server)) return
        if (first || server.version !== versionRef.current) {
          versionRef.current = server.version
          baseRef.current = { enablements: server.enablements, deals: server.deals }
          setData(applyAll(pendingRef.current, baseRef.current))
        }
        if (pendingRef.current.length) doSave() // recover queued saves after offline
        else setSyncStatus('saved')
      } catch {
        if (!stopped) setSyncStatus('offline')
      }
    }
    refresh(true)
    const timer = setInterval(() => {
      if (!savingRef.current) refresh(false)
    }, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [])

  // ---- persistence side effects ------------------------------------------
  useEffect(() => {
    if (SHARED_MODE) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data)) // read cache only
    } else {
      localStorage.setItem(DATA_KEY, JSON.stringify(data))
    }
  }, [data])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.dataset.carbonTheme = theme
  }, [theme])

  // every mutation goes through here: instant local apply, then queued save.
  // Mutation fns must be deterministic (ids generated BEFORE queuing) so a
  // 409 replay produces identical records.
  const mutate = (fn) => {
    if (SHARED_MODE) {
      pendingRef.current.push(fn)
      // the badge must say "Saving…" from the moment the change exists, not
      // from when the debounced request fires — "Saved" may never lie
      setSyncStatus('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(doSave, SAVE_DEBOUNCE_MS)
    }
    setData((d) => fn(d))
  }

  // closing or backgrounding the tab inside the debounce window must not lose
  // the queued change — fire a keepalive save immediately
  useEffect(() => {
    if (!SHARED_MODE) return undefined
    const flush = () => {
      if (pendingRef.current.length === 0 || savingRef.current) return
      const doc = applyAll(pendingRef.current, baseRef.current)
      fetch(API_URL, {
        method: 'PUT',
        keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ version: versionRef.current, ...doc }),
      }).catch(() => {})
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // soft-deleted records past the retention window are purged for good —
  // checked once per session, synced like any other change
  const purgedRef = useRef(false)
  useEffect(() => {
    if (purgedRef.current) return
    const cutoff = new Date(Date.now() - SOFT_DELETE_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const expired = (r) => r.deletedAt && r.deletedAt < cutoff
    if (![...data.enablements, ...data.deals].some(expired)) return
    purgedRef.current = true
    mutate((d) => ({
      enablements: d.enablements.filter((r) => !expired(r)),
      deals: d.deals.filter((r) => !expired(r)),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const api = useMemo(() => {
    // audit stamps: who added / last edited / deleted a record, and when
    const nowIso = () => new Date().toISOString()
    const addStamp = () => (userName ? { createdBy: userName, createdAt: nowIso() } : { createdAt: nowIso() })
    const editStamp = () => (userName ? { updatedBy: userName, updatedAt: nowIso() } : { updatedAt: nowIso() })
    // every add/edit/delete/restore also appends to the record's own history,
    // capped per record — this rides inside the record through the sync layer
    // unchanged and is what the activity log is built from
    const HISTORY_CAP = 20
    const historyEntry = (action) => ({ at: nowIso(), by: userName || null, action })
    const withHistory = (record, entry) => ({
      ...record,
      history: [...(record.history ?? []), entry].slice(-HISTORY_CAP),
    })

    // everything the app derives from is the ACTIVE records; soft-deleted ones
    // live only in the recycle lists below until restored or purged
    const active = (list) => list.filter((r) => !r.deletedAt)
    const deleted = (list) =>
      list.filter((r) => r.deletedAt).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))

    // the most recent add/edit/delete with a name attached, for the header
    let lastEdited = null
    for (const r of [...data.enablements, ...data.deals]) {
      for (const [at, name] of [
        [r.deletedAt, r.deletedBy],
        [r.updatedAt, r.updatedBy],
        [r.createdAt, r.createdBy],
      ]) {
        if (at && name && (!lastEdited || at > lastEdited.at)) lastEdited = { at, name }
      }
    }

    const softDelete = (key) => (id) => {
      const stamp = { deletedAt: nowIso(), ...(userName ? { deletedBy: userName } : {}) }
      const entry = historyEntry('deleted')
      mutate((d) => ({
        ...d,
        [key]: d[key].map((x) => (x.id === id ? withHistory({ ...x, ...stamp }, entry) : x)),
      }))
    }
    const restore = (key) => (id) => {
      const entry = historyEntry('restored')
      // undefined fields are dropped on serialize, so the record comes back clean
      mutate((d) => ({
        ...d,
        [key]: d[key].map((x) =>
          x.id === id ? withHistory({ ...x, deletedAt: undefined, deletedBy: undefined }, entry) : x,
        ),
      }))
    }

    // the activity log: every history entry across all records (deleted ones
    // included), newest first. Records from before per-record history existed
    // contribute what their stamps still know.
    const events = []
    const collect = (list, kind, labelOf) => {
      for (const r of list) {
        if (r.history?.length) {
          for (const h of r.history) events.push({ at: h.at, name: h.by, action: h.action, kind, label: labelOf(r) })
        } else {
          if (r.createdAt) events.push({ at: r.createdAt, name: r.createdBy, action: 'added', kind, label: labelOf(r) })
          if (r.updatedAt) events.push({ at: r.updatedAt, name: r.updatedBy, action: 'edited', kind, label: labelOf(r) })
          if (r.deletedAt) events.push({ at: r.deletedAt, name: r.deletedBy, action: 'deleted', kind, label: labelOf(r) })
        }
      }
    }
    collect(data.enablements, 'session', (r) => r.title)
    collect(data.deals, 'deal', (r) => r.customer)
    const activityLog = events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100)

    return {
      enablements: active(data.enablements),
      deals: active(data.deals),
      deletedEnablements: deleted(data.enablements),
      deletedDeals: deleted(data.deals),
      lastEdited,
      activityLog,
      userName,
      setUserName,
      theme,
      setTheme,
      syncStatus,
      addEnablement: (e) => {
        const rec = withHistory({ ...e, id: newId(), ...addStamp() }, historyEntry('added'))
        mutate((d) => ({ ...d, enablements: [...d.enablements, rec] }))
      },
      updateEnablement: (id, patch) => {
        const stamp = editStamp()
        const entry = historyEntry('edited')
        mutate((d) => ({
          ...d,
          enablements: d.enablements.map((x) => (x.id === id ? withHistory({ ...x, ...patch, ...stamp }, entry) : x)),
        }))
      },
      removeEnablement: softDelete('enablements'),
      restoreEnablement: restore('enablements'),
      addDeal: (deal) => {
        const rec = withHistory({ ...deal, id: newId(), ...addStamp() }, historyEntry('added'))
        mutate((d) => ({ ...d, deals: [...d.deals, rec] }))
      },
      updateDeal: (id, patch) => {
        const stamp = editStamp()
        const entry = historyEntry('edited')
        mutate((d) => ({
          ...d,
          deals: d.deals.map((x) => (x.id === id ? withHistory({ ...x, ...patch, ...stamp }, entry) : x)),
        }))
      },
      removeDeal: softDelete('deals'),
      restoreDeal: restore('deals'),
      // standalone-only (the header hides it in shared mode)
      resetToDemo: () => setData({ enablements: seedEnablements, deals: seedDeals }),
      // key-gated admin reset: goes through mutate so in shared mode the wipe
      // syncs to the store and reaches every other open browser. Hard wipe —
      // the recycle bin goes with it, deliberately.
      clearAll: () => mutate(() => ({ enablements: [], deals: [] })),
    }
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, theme, syncStatus, userName],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
```

## `src/components/KpiTile.jsx`

```jsx
export default function KpiTile({ label, value, detail }) {
  return (
    <div className="kpi-tile">
      <div className="kpi-tile__label">{label}</div>
      <div className="kpi-tile__value">{value}</div>
      {detail ? <div className="kpi-tile__detail">{detail}</div> : <div />}
    </div>
  )
}
```

## `src/components/UseCaseChip.jsx`

```jsx
import { getProductColor, getUseCaseLabel } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

// Identity swatch for a record: the dot carries the PRODUCT color (three
// products stay color-vision-safe; per-use-case hues could not), the text is
// the record's use-case label — catalog, custom, or legacy. Color is never
// the only signal.
export default function UseCaseChip({ record }) {
  const { theme } = useStore()
  return (
    <span className="uc-chip">
      <span
        className="uc-chip__dot"
        style={{ background: getProductColor(record.product, theme) }}
        aria-hidden="true"
      />
      {getUseCaseLabel(record)}
    </span>
  )
}
```

## `src/components/UpcomingSessions.jsx`

```jsx
import { Button } from '@carbon/react'
import { Email } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { todayIso, sessionRequestMailto, getProductColor, getProduct } from '../data/constants.js'
import UseCaseChip from './UseCaseChip.jsx'

const DAY_MS = 24 * 60 * 60 * 1000

// The forward-looking strip for sellers: sessions scheduled but not yet
// delivered, plus a pre-filled email to ask for one that isn't on the
// calendar. Scheduled sessions never count in delivered totals — this strip
// and the calendar are the only places they appear.
export default function UpcomingSessions() {
  const { enablements, theme } = useStore()
  const today = todayIso()
  const upcoming = enablements
    .filter((e) => e.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const inDays = (iso) => {
    const days = Math.round((new Date(`${iso}T00:00:00`) - new Date(`${today}T00:00:00`)) / DAY_MS)
    return days === 1 ? 'tomorrow' : `in ${days} days`
  }

  return (
    <div className="chart-card">
      <div className="up-head">
        <h4 className="section-title">Upcoming sessions</h4>
        <Button kind="ghost" size="sm" renderIcon={Email} href={sessionRequestMailto()}>
          Request a session
        </Button>
      </div>
      {upcoming.length ? (
        <div className="up-strip">
          {upcoming.map((s) => {
            const d = new Date(`${s.date}T00:00:00`)
            return (
              <div
                key={s.id}
                className="up-card"
                style={{ borderLeftColor: getProductColor(s.product, theme) }}
              >
                <div className="up-card__date" aria-hidden="true">
                  <span className="up-card__day">{d.getDate()}</span>
                  <span className="up-card__month">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                </div>
                <div className="up-card__body">
                  <div className="up-card__title">{s.title}</div>
                  <UseCaseChip record={s} />
                  <div className="up-card__meta">
                    {getProduct(s.product) ? `${getProduct(s.product).label} · ` : ''}
                    {s.presenter ? `${s.presenter} · ` : ''}{inDays(s.date)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="up-empty">Nothing scheduled yet — request a session for your account or use case.</p>
      )}
    </div>
  )
}
```

## `src/components/ComparisonPanel.jsx`

```jsx
import { fmtUSDCompact, fmtPct } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

// Influenced vs. not-influenced deals: win rate, average deal size, sales
// cycle. Emphasis coloring — influenced carries the accent hue, the rest is
// context gray — with every value direct-labeled so color never works alone.
// Deltas are stated in BOTH directions: hiding an unfavorable number would
// undermine the whole page the first time someone checks the math.
const METRICS = [
  {
    key: 'winRate',
    label: 'Win rate',
    fmt: fmtPct,
    delta: (a, b) => {
      const pts = Math.round((a - b) * 100)
      if (Math.abs(pts) <= 2) return null
      return { text: `${pts > 0 ? '+' : '−'}${Math.abs(pts)} pts`, favorable: pts > 0 }
    },
  },
  {
    key: 'avgSize',
    label: 'Average deal size',
    fmt: fmtUSDCompact,
    delta: (a, b) => {
      if (!(a > 0) || !(b > 0) || Math.abs(a - b) <= b * 0.05) return null
      return a > b
        ? { text: `${(a / b).toFixed(1)}× larger`, favorable: true }
        : { text: `${(b / a).toFixed(1)}× smaller`, favorable: false }
    },
  },
  {
    key: 'cycleDays',
    label: 'Average sales cycle',
    fmt: (v) => `${Math.round(v)} days`,
    delta: (a, b) => {
      const d = Math.round(a - b)
      if (Math.abs(d) <= 2) return null
      return d < 0
        ? { text: `${-d} days faster`, favorable: true }
        : { text: `${d} days slower`, favorable: false }
    },
  },
]

export default function ComparisonPanel({ stats }) {
  const { theme } = useStore()
  const accent = theme === 'g100' ? '#4589ff' : '#0f62fe'
  const context = theme === 'g100' ? '#6f6f6f' : '#a8a8a8'
  const { influenced, rest } = stats

  return (
    <div className="cmp">
      <div className="cmp__legend">
        <span className="uc-chip">
          <span className="uc-chip__dot" style={{ background: accent }} aria-hidden="true" />
          Outbound-touched (n={influenced.n})
        </span>
        <span className="uc-chip">
          <span className="uc-chip__dot" style={{ background: context }} aria-hidden="true" />
          No outbound touch (n={rest.n})
        </span>
      </div>
      {METRICS.map((m) => {
        const a = influenced[m.key]
        const b = rest[m.key]
        const max = Math.max(a ?? 0, b ?? 0) || 1
        const delta = a != null && b != null ? m.delta(a, b) : null
        return (
          <div key={m.key} className="cmp__row">
            <div className="cmp__label">{m.label}</div>
            <div className="cmp__bars">
              {[
                { v: a, color: accent, name: 'Outbound-touched' },
                { v: b, color: context, name: 'No outbound touch' },
              ].map((s) => (
                <div key={s.name} className="cmp__barline">
                  <span
                    className="cmp__bar"
                    style={{
                      width: s.v != null ? `${Math.max((s.v / max) * 100, 2)}%` : 0,
                      background: s.color,
                    }}
                    aria-hidden="true"
                  />
                  <span className="cmp__value">{s.v != null ? m.fmt(s.v) : 'not enough data'}</span>
                </div>
              ))}
            </div>
            <div className={`cmp__delta${delta && !delta.favorable ? ' cmp__delta--adverse' : ''}`}>
              {delta ? delta.text : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

## `src/components/CoveragePanel.jsx`

```jsx
import { Tag } from '@carbon/react'
import { fmtUSDCompact, getProductColor } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

const pct1 = (ratio) => `${(ratio * 100).toFixed(0)}%`

// Where to invest next: per PRODUCT, customer demand share (deal value) vs.
// our enablement coverage share (team hours). A product where demand outruns
// coverage is the concrete ask to sales/execs: point more effort here.
export default function CoveragePanel({ rows }) {
  const { theme } = useStore()
  const demandColor = theme === 'g100' ? '#4589ff' : '#0f62fe'
  const coverageColor = theme === 'g100' ? '#6f6f6f' : '#a8a8a8'

  const verdict = (gap) => {
    if (gap >= 0.05) return <Tag type="blue" size="sm">Invest here · +{Math.round(gap * 100)} pts demand</Tag>
    if (gap <= -0.05) return <Tag type="green" size="sm">Well covered</Tag>
    return <Tag type="gray" size="sm">Balanced</Tag>
  }

  return (
    <div className="cmp">
      <div className="cmp__legend">
        <span className="uc-chip">
          <span className="uc-chip__dot" style={{ background: demandColor }} aria-hidden="true" />
          Customer demand (share of deal value)
        </span>
        <span className="uc-chip">
          <span className="uc-chip__dot" style={{ background: coverageColor }} aria-hidden="true" />
          Enablement coverage (share of team hours)
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="cmp__row">
          <div className="cmp__label">
            <span className="uc-chip">
              <span
                className="uc-chip__dot"
                style={{ background: getProductColor(r.product, theme) }}
                aria-hidden="true"
              />
              {r.label}
            </span>
            <span className="cmp__hint">
              {r.dealCount} deal{r.dealCount === 1 ? '' : 's'} · {fmtUSDCompact(r.demandValue)} · {r.sessionCount} session{r.sessionCount === 1 ? '' : 's'} / {r.hours}h
            </span>
          </div>
          <div className="cmp__bars">
            <div className="cmp__barline">
              <span
                className="cmp__bar"
                style={{ width: `${Math.max(r.demandShare * 100, r.demandShare > 0 ? 2 : 0)}%`, background: demandColor }}
                aria-hidden="true"
              />
              <span className="cmp__value">{pct1(r.demandShare)}</span>
            </div>
            <div className="cmp__barline">
              <span
                className="cmp__bar"
                style={{ width: `${Math.max(r.coverageShare * 100, r.coverageShare > 0 ? 2 : 0)}%`, background: coverageColor }}
                aria-hidden="true"
              />
              <span className="cmp__value">{pct1(r.coverageShare)}</span>
            </div>
          </div>
          <div className="cmp__delta">{verdict(r.gap)}</div>
        </div>
      ))}
    </div>
  )
}
```

## `src/components/QuarterlyPipeline.jsx`

```jsx
import { useMemo, useState } from 'react'
import { IconButton } from '@carbon/react'
import { ChevronLeft, ChevronRight } from '@carbon/icons-react'
import { attributeDeals } from '../data/attribution.js'
import { quarterStart, nextQuarter, prevQuarter, quarterLabel } from '../data/quarters.js'
import { fmtUSDCompact } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

// Influenced pipeline opened per month, one fiscal quarter at a time —
// same visual language and quarter navigation as the session-to-deal
// timeline: month bands, direct-labeled bars, no separate axis chrome.

const W = 1160
const H = 230
const PAD_L = 24
const PAD_R = 24
const AXIS_H = 32
const TOP = 30
const BAR_W = 96

const toDate = (iso) => new Date(`${iso}T00:00:00`)

export default function QuarterlyPipeline({ deals, enablements }) {
  const { theme } = useStore()
  const accent = theme === 'g100' ? '#4589ff' : '#0f62fe'
  const ink = { secondary: 'var(--cds-text-secondary)', helper: 'var(--cds-text-helper)' }
  const grid = 'var(--cds-border-subtle-01)'

  const [qCursor, setQCursor] = useState(() => quarterStart(new Date()))

  const { months, maxV, canPrev, canNext } = useMemo(() => {
    const influenced = attributeDeals(deals, enablements).filter((d) => d.influenced)
    const qEnd = nextQuarter(qCursor)

    const today = new Date()
    const months = []
    let m = new Date(qCursor)
    while (m < qEnd) {
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1)
      const total = influenced
        .filter((d) => {
          const t = toDate(d.date)
          return t >= m && t < end
        })
        .reduce((s, d) => s + d.value, 0)
      months.push({
        label: m.toLocaleDateString('en-US', { month: 'short', year: months.length === 0 ? 'numeric' : undefined }),
        total,
        // a month that hasn't started yet has no number to report
        status: m > today ? 'future' : end > today ? 'current' : 'past',
      })
      m = end
    }

    const currentQ = quarterStart(today)
    const allDates = [...deals.map((d) => toDate(d.date)), ...enablements.map((e) => toDate(e.date))]
    const earliestQ = allDates.length ? quarterStart(new Date(Math.min(...allDates))) : currentQ

    return {
      months,
      maxV: Math.max(...months.map((mo) => mo.total), 1),
      canPrev: qCursor > earliestQ,
      canNext: qCursor < currentQ,
    }
  }, [deals, enablements, qCursor])

  const bandW = (W - PAD_L - PAD_R) / months.length
  const baseY = H - AXIS_H
  const scaleH = baseY - TOP

  return (
    <div style={{ overflowX: 'auto' }}>
      <div className="tl-head" style={{ justifyContent: 'flex-end' }}>
        <div className="tl-head__nav">
          <IconButton kind="ghost" size="sm" label="Previous quarter" disabled={!canPrev} onClick={() => setQCursor((q) => prevQuarter(q))}>
            <ChevronLeft />
          </IconButton>
          <span className="tl-head__label">{quarterLabel(qCursor)}</span>
          <IconButton kind="ghost" size="sm" label="Next quarter" disabled={!canNext} onClick={() => setQCursor((q) => nextQuarter(q))}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', minWidth: '48rem', display: 'block' }}
        role="img"
        aria-label={`Outbound-touched pipeline opened per month in ${quarterLabel(qCursor)}`}
      >
        {months.map((mo, i) => {
          const x1 = PAD_L + i * bandW
          const cx = x1 + bandW / 2
          const h = (mo.total / maxV) * scaleH
          return (
            <g key={mo.label}>
              <line x1={x1} y1={TOP - 16} x2={x1} y2={baseY} stroke={grid} strokeWidth="1" />
              {i === months.length - 1 && (
                <line x1={x1 + bandW} y1={TOP - 16} x2={x1 + bandW} y2={baseY} stroke={grid} strokeWidth="1" />
              )}
              {mo.status === 'current' && (
                <text x={cx} y={10} fontSize="11" fontWeight="600" textAnchor="middle" style={{ fill: 'var(--cds-link-primary)' }}>
                  Current month
                </text>
              )}
              {mo.total > 0 && (
                <rect x={cx - BAR_W / 2} y={baseY - h} width={BAR_W} height={h} rx="2" fill={accent} />
              )}
              <text
                x={cx}
                y={baseY - h - 8}
                fontSize="12"
                fontWeight={mo.status === 'future' ? '400' : '600'}
                fontStyle={mo.status === 'future' ? 'italic' : undefined}
                textAnchor="middle"
                style={{ fill: mo.total > 0 ? ink.secondary : ink.helper }}
              >
                {mo.status === 'future' ? 'Coming soon' : mo.total > 0 ? fmtUSDCompact(mo.total) : '$0'}
              </text>
              <text x={cx} y={baseY + 22} fontSize="11" textAnchor="middle" style={{ fill: mo.status === 'current' ? ink.secondary : ink.helper }} fontWeight={mo.status === 'current' ? '600' : '400'}>
                {mo.label}
              </text>
            </g>
          )
        })}
        {/* baseline */}
        <line x1={PAD_L} y1={baseY} x2={W - PAD_R} y2={baseY} stroke={grid} strokeWidth="1" />
      </svg>
    </div>
  )
}
```

## `src/components/InfluenceTimeline.jsx`

```jsx
import { useMemo, useRef, useState } from 'react'
import { IconButton } from '@carbon/react'
import { ChevronLeft, ChevronRight } from '@carbon/icons-react'
import { PRODUCTS, getProductColor, getUseCaseLabel, fmtUSD, fmtUSDCompact, fmtDate } from '../data/constants.js'
import { attributeDeals } from '../data/attribution.js'
import { quarterStart, nextQuarter, prevQuarter, quarterLabel } from '../data/quarters.js'
import { useStore } from '../data/store.jsx'

// One fiscal quarter at a time (IBM's FY matches the calendar year): sessions
// and deals from the viewed quarter only, axis from quarter start to quarter
// end. Influence carried over from an earlier quarter — session then, deal
// now — enters the lane as a dashed curve from the left edge with a "from Qn"
// marker. Chevrons page through past quarters.

const W = 1160
const LANE_H = 130
const PAD_L = 16 // lane headers
const PLOT_L = 64 // plot area starts inset so markers/labels clear the lane headers
const PAD_R = 24
const AXIS_H = 36

const toDate = (iso) => new Date(`${iso}T00:00:00`)
const trunc = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

export default function InfluenceTimeline({ deals, enablements }) {
  const { theme } = useStore()
  const ink = { primary: 'var(--cds-text-primary)', secondary: 'var(--cds-text-secondary)', helper: 'var(--cds-text-helper)' }
  const grid = 'var(--cds-border-subtle-01)'
  const gray = '#8d8d8d'

  const [qCursor, setQCursor] = useState(() => quarterStart(new Date()))
  // sessions to spotlight after clicking a carried-touchpoint marker: the
  // click jumps to the origin quarter and rings the session(s) it came from
  const [originIds, setOriginIds] = useState([])
  const pageQuarter = (step) => {
    setOriginIds([])
    setQCursor((q) => (step < 0 ? prevQuarter(q) : nextQuarter(q)))
  }

  // custom hover tooltip — native SVG <title> is too slow and unreliable
  const wrapRef = useRef(null)
  const [tip, setTip] = useState(null)
  const showTip = (e, lines) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const r = wrap.getBoundingClientRect()
    setTip({
      x: Math.min(e.clientX - r.left + wrap.scrollLeft, wrap.scrollWidth - 20),
      y: e.clientY - r.top,
      lines,
    })
  }
  const hideTip = () => setTip(null)

  const view = useMemo(() => {
    const attributed = attributeDeals(deals, enablements)
    const qEnd = nextQuarter(qCursor)
    const inQuarter = (iso) => {
      const t = toDate(iso)
      return t >= qCursor && t < qEnd
    }

    // one lane per PRODUCT with activity; records logged before the product
    // dimension existed group into a gray "No product" lane
    const laneDefs = [...PRODUCTS, { id: null, label: 'No product' }]
    const lanes = laneDefs.map((u) => {
      const inLane = (r) => (u.id ? r.product === u.id : !r.product)
      const sessions = enablements
        .filter((e) => inLane(e) && inQuarter(e.date))
        .sort((a, b) => a.date.localeCompare(b.date))
      const laneDeals = attributed
        .filter((d) => inLane(d) && inQuarter(d.date))
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => {
          // a manually tied deal always links to its tied session; automatic
          // deals link to a session inside the viewed quarter when there is
          // one — otherwise the touchpoint is carried from an earlier quarter
          const linked = d.sourceSessionId ? d.matched.find((s) => s.id === d.sourceSessionId) : null
          const link = linked
            ? (inQuarter(linked.date) ? linked : null)
            : (d.matched.find((s) => inQuarter(s.date)) ?? null)
          return { ...d, link, carried: d.influenced && !link ? (linked ?? d.matched[0]) : null }
        })
      const carriedSessions = [...new Map(laneDeals.filter((d) => d.carried).map((d) => [d.carried.id, d.carried])).values()]
      const carriedQuarters = [...new Set(carriedSessions.map((s) => quarterLabel(quarterStart(toDate(s.date)))))]
      return { u, sessions, deals: laneDeals, carriedSessions, carriedQuarters }
    }).filter((l) => l.sessions.length || l.deals.length)

    const span = qEnd - qCursor
    const toPx = (date) => PLOT_L + ((date - qCursor) / span) * (W - PLOT_L - PAD_R)
    const x = (iso) => toPx(toDate(iso))

    const months = []
    let m = new Date(qCursor)
    while (m < qEnd) {
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1)
      months.push({
        x1: toPx(m),
        x2: toPx(end),
        label: m.toLocaleDateString('en-US', {
          month: 'short',
          year: months.length === 0 ? 'numeric' : undefined,
        }),
      })
      m = end
    }

    const today = new Date()
    const currentQ = quarterStart(today)
    const allDates = [...deals.map((d) => toDate(d.date)), ...enablements.map((e) => toDate(e.date))]
    const earliestQ = allDates.length ? quarterStart(new Date(Math.min(...allDates))) : currentQ

    return {
      lanes,
      months,
      x,
      todayX: currentQ.getTime() === qCursor.getTime() ? toPx(today) : null,
      canPrev: qCursor > earliestQ,
      canNext: qCursor < currentQ,
      anyCarried: lanes.some((l) => l.carriedSessions.length),
      height: lanes.length * LANE_H + AXIS_H,
    }
  }, [deals, enablements, qCursor])

  const { lanes, months, x, todayX, canPrev, canNext, anyCarried, height } = view
  const clampX = (px) => Math.max(PLOT_L + 12, Math.min(W - 60, px))
  const shortFrom = (labels) => {
    if (labels.length !== 1) return 'from earlier'
    const [q, year] = labels[0].split(' ')
    return Number(year) === qCursor.getFullYear() ? `from ${q}` : `from ${labels[0]}`
  }

  return (
    <div ref={wrapRef} style={{ overflowX: 'auto', position: 'relative' }}>
      {tip && (
        <div
          className="tl-tip"
          style={{
            left: tip.x,
            top: tip.y,
            // flip below the cursor near the container top (overflow clips upward),
            // and to the left of the cursor near the right edge
            transform: `translate(${tip.x > W - 300 ? 'calc(-100% - 12px)' : '12px'}, ${
              tip.y < 140 ? '16px' : 'calc(-100% - 10px)'
            })`,
          }}
        >
          <strong>{tip.lines[0]}</strong>
          {tip.lines.slice(1).map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}

      <div className="tl-head">
        <div className="cmp__legend" style={{ marginBottom: 0 }}>
          <span className="uc-chip">
            <svg width="12" height="12" aria-hidden="true"><rect x="6" y="0" width="8" height="8" transform="rotate(45 6 1)" fill="currentColor" opacity="0.75" /></svg>
            Enablement session
          </span>
          <span className="uc-chip">
            <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.75" /></svg>
            Outbound-touched deal (opened after a session)
          </span>
          <span className="uc-chip">
            <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="none" stroke={gray} strokeWidth="1.5" /></svg>
            Deal with no prior session — not counted
          </span>
          {anyCarried && (
            <span className="uc-chip">
              <svg width="20" height="12" aria-hidden="true"><path d="M1 6 H19" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.75" /></svg>
              Touchpoint carried from an earlier quarter
            </span>
          )}
        </div>
        <div className="tl-head__nav">
          <IconButton kind="ghost" size="sm" label="Previous quarter" disabled={!canPrev} onClick={() => pageQuarter(-1)}>
            <ChevronLeft />
          </IconButton>
          <span className="tl-head__label">{quarterLabel(qCursor)}</span>
          <IconButton kind="ghost" size="sm" label="Next quarter" disabled={!canNext} onClick={() => pageQuarter(1)}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>

      {lanes.length === 0 ? (
        <p className="tl-empty">No sessions or deals in {quarterLabel(qCursor)}.</p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${height}`}
          style={{ width: '100%', minWidth: '56rem', display: 'block' }}
          role="img"
          aria-label={`${quarterLabel(qCursor)} timeline of enablement sessions and the customer deals that followed them, per use case`}
        >
          {/* month gridlines within the quarter, labels centered */}
          {months.map((mo, i) => (
            <g key={mo.x1}>
              <line x1={mo.x1} y1={0} x2={mo.x1} y2={height - AXIS_H + 8} stroke={grid} strokeWidth="1" />
              {i === months.length - 1 && (
                <line x1={mo.x2} y1={0} x2={mo.x2} y2={height - AXIS_H + 8} stroke={grid} strokeWidth="1" />
              )}
              <text
                x={(mo.x1 + mo.x2) / 2}
                y={height - AXIS_H + 24}
                fontSize="11"
                textAnchor="middle"
                style={{ fill: ink.helper }}
              >
                {mo.label}
              </text>
            </g>
          ))}

          {/* today marker (only when viewing the current quarter) */}
          {todayX != null && (
            <>
              <line x1={todayX} y1={14} x2={todayX} y2={height - AXIS_H + 8} strokeWidth="1.5" strokeDasharray="4 4" style={{ stroke: 'var(--cds-link-primary)' }} />
              <text x={todayX} y={10} fontSize="11" fontWeight="600" textAnchor="middle" style={{ fill: 'var(--cds-link-primary)' }}>Today</text>
            </>
          )}

          {lanes.map((lane, i) => {
            const top = i * LANE_H
            const dealY = top + 64 // labels sit at dealY-22, clear of the lane header band
            const sessionY = top + 106
            const color = getProductColor(lane.u.id, theme)

            return (
              <g key={lane.u.id ?? 'no-product'}>
                {/* lane header */}
                <rect x={PAD_L} y={top + 12} width="10" height="10" rx="2" fill={color} />
                <text x={PAD_L + 16} y={top + 21} fontSize="12" fontWeight="600" style={{ fill: ink.primary }}>
                  {lane.u.label}
                </text>

                {/* session baseline */}
                <line x1={PLOT_L} y1={sessionY} x2={W - PAD_R} y2={sessionY} stroke={grid} strokeWidth="1" />

                {/* influence curves: solid from an in-quarter session, dashed from the
                    left edge when the session happened in an earlier quarter */}
                {lane.deals.filter((d) => d.influenced).map((d) => {
                  const x1 = d.link ? x(d.link.date) : PLOT_L
                  const x2 = x(d.date)
                  const my = (sessionY + dealY) / 2
                  return (
                    <path
                      key={`c-${d.id}`}
                      d={`M ${x1} ${sessionY - 5} C ${x1} ${my}, ${x2} ${my}, ${x2} ${dealY + 7}`}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeDasharray={d.link ? undefined : '5 4'}
                      opacity="0.45"
                    />
                  )
                })}

                {/* carried-influence entry marker at the quarter boundary: a
                    hollow session diamond (the session lives off-screen to the
                    left), a caption NAMING the session, and a click-through
                    that opens the origin quarter with that session ringed */}
                {lane.carriedSessions.length > 0 && (() => {
                  const latest = lane.carriedSessions.reduce((a, s) => (s.date > a.date ? s : a))
                  const targetQ = quarterStart(toDate(latest.date))
                  const targetIds = lane.carriedSessions
                    .filter((s) => quarterStart(toDate(s.date)).getTime() === targetQ.getTime())
                    .map((s) => s.id)
                  const lines = [
                    `Touchpoint carried from ${lane.carriedQuarters.join(', ')}`,
                    ...lane.carriedSessions.map((s) => `${s.title} — ${fmtDate(s.date)}`),
                    `Click to open ${quarterLabel(targetQ)} with the session highlighted`,
                  ]
                  const caption =
                    lane.carriedSessions.length === 1
                      ? `${shortFrom(lane.carriedQuarters)} — ${trunc(latest.title, 42)} · ${fmtDate(latest.date)}`
                      : `${shortFrom(lane.carriedQuarters)} — ${lane.carriedSessions.length} earlier sessions`
                  return (
                    <g
                      data-hover="carried"
                      className="tl-carried"
                      role="button"
                      aria-label={`Open ${quarterLabel(targetQ)} to see the session this touchpoint carries from`}
                      onClick={() => {
                        hideTip()
                        setOriginIds(targetIds)
                        setQCursor(targetQ)
                      }}
                      onMouseEnter={(e) => showTip(e, lines)}
                      onMouseMove={(e) => showTip(e, lines)}
                      onMouseLeave={hideTip}
                    >
                      <circle cx={PLOT_L - 5} cy={sessionY} r="14" fill="transparent" />
                      <g transform={`translate(${PLOT_L - 8} ${sessionY})`}>
                        <rect x="-4.5" y="-4.5" width="9" height="9" transform="rotate(45)" fill="var(--cds-layer-01)" stroke={color} strokeWidth="1.5" />
                      </g>
                      <text className="tl-carried__caption" x={PAD_L} y={sessionY + 18} fontSize="10" style={{ fill: ink.helper }}>
                        {caption}
                      </text>
                    </g>
                  )
                })()}

                {/* sessions — ringed and named when arrived at via a
                    carried-marker click from a later quarter */}
                {lane.sessions.map((s) => {
                  const origin = originIds.includes(s.id)
                  const px = x(s.date)
                  const labelOff = Math.max(PLOT_L + 90, Math.min(W - 130, px)) - px
                  const lines = [
                    s.title,
                    getUseCaseLabel(s),
                    `${fmtDate(s.date)}${s.presenter ? ` · ${s.presenter}` : ''}`,
                    `${s.attendees || 0} attendees · ${Number(s.hours) || 0}h invested`,
                  ]
                  return (
                    <g
                      key={s.id}
                      data-hover="session"
                      transform={`translate(${px} ${sessionY})`}
                      onMouseEnter={(e) => showTip(e, lines)}
                      onMouseMove={(e) => showTip(e, lines)}
                      onMouseLeave={hideTip}
                    >
                      {/* oversized invisible hit target */}
                      <circle r="16" fill="transparent" />
                      {origin && <circle r="12" className="tl-origin-ring" fill="none" stroke={color} strokeWidth="2" />}
                      <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill={color} />
                      {origin && (
                        <text x={labelOff} y="24" fontSize="10" fontWeight="600" textAnchor="middle" style={{ fill: ink.secondary }}>
                          {trunc(s.title, 34)} · {fmtDate(s.date)}
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* deals — labels drop below the dot when they'd collide above */}
                {(() => {
                  const tracks = { above: -Infinity, below: -Infinity }
                  return lane.deals.map((d) => {
                    const lx0 = clampX(x(d.date))
                    let below = false
                    if (lx0 - tracks.above < 116) {
                      if (lx0 - tracks.below >= 116) below = true
                    }
                    if (below) tracks.below = lx0
                    else tracks.above = lx0
                    return { d, below }
                  })
                })().map(({ d, below }) => {
                  const px = x(d.date)
                  const lx = clampX(px)
                  const nameY = below ? dealY + 22 : dealY - 22
                  const valueY = below ? dealY + 34 : dealY - 10
                  const closed = d.stage.startsWith('Closed')
                  const stageNote = closed ? (d.stage === 'Closed Won' ? ' · won' : ' · lost') : ''
                  const lines = [
                    d.customer,
                    `${fmtUSD(d.value)} · ${d.stage}`,
                    `${getUseCaseLabel(d)} · opened ${fmtDate(d.date)}`,
                    d.influenced
                      ? d.link
                        ? `Outbound touched — session: ${d.link.title} (${fmtDate(d.link.date)})`
                        : `Outbound touched — carried from ${quarterLabel(quarterStart(toDate(d.carried.date)))}: ${d.carried.title} (${fmtDate(d.carried.date)})`
                      : 'Not counted — no matching session before this deal',
                  ]
                  return (
                    <g
                      key={d.id}
                      data-hover="deal"
                      onMouseEnter={(e) => showTip(e, lines)}
                      onMouseMove={(e) => showTip(e, lines)}
                      onMouseLeave={hideTip}
                    >
                      {/* oversized invisible hit target */}
                      <circle cx={px} cy={dealY} r="18" fill="transparent" />
                      {d.influenced ? (
                        <circle cx={px} cy={dealY} r="7" fill={color} />
                      ) : (
                        <circle cx={px} cy={dealY} r="6" fill="var(--cds-layer-01)" stroke={gray} strokeWidth="2" />
                      )}
                      <text x={lx} y={nameY} fontSize="11" fontWeight="600" textAnchor="middle" style={{ fill: d.influenced ? ink.primary : ink.helper }}>
                        {d.customer}
                      </text>
                      <text x={lx} y={valueY} fontSize="10" textAnchor="middle" style={{ fill: ink.secondary }}>
                        {fmtUSDCompact(d.value)}{stageNote}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
```

## `src/components/MonthCalendar.jsx`

```jsx
import { useState } from 'react'
import { IconButton } from '@carbon/react'
import { ChevronLeft, ChevronRight } from '@carbon/icons-react'
import { PRODUCTS, getProductColor } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

// Month grid of enablement sessions. Clicking a day starts a new session
// entry pre-filled with that date.
export default function MonthCalendar({ sessions, onPickDay }) {
  const { theme } = useStore()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { y: now.getFullYear(), m: now.getMonth() }
  })

  const today = new Date()
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate())
  const first = new Date(cursor.y, cursor.m, 1)
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const pad = first.getDay()
  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const byDay = new Map()
  for (const s of sessions) {
    if (!byDay.has(s.date)) byDay.set(s.date, [])
    byDay.get(s.date).push(s)
  }

  const cells = []
  for (let i = 0; i < pad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const move = (delta) =>
    setCursor(({ y, m }) => {
      const next = new Date(y, m + delta, 1)
      return { y: next.getFullYear(), m: next.getMonth() }
    })

  return (
    <div className="cal">
      <div className="cal__head">
        <h3>{monthLabel}</h3>
        <div>
          <IconButton kind="ghost" size="sm" label="Previous month" onClick={() => move(-1)}>
            <ChevronLeft />
          </IconButton>
          <IconButton kind="ghost" size="sm" label="Next month" onClick={() => move(1)}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>
      <div className="cal__grid" role="grid" aria-label={`Enablement sessions in ${monthLabel}`}>
        {DOW.map((d) => (
          <div key={d} className="cal__dow">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`pad-${i}`} className="cal__day cal__day--pad" aria-hidden="true" />
          const dayIso = iso(cursor.y, cursor.m, d)
          const events = byDay.get(dayIso) ?? []
          return (
            <button
              key={dayIso}
              type="button"
              className={`cal__day${dayIso === todayIso ? ' cal__day--today' : ''}`}
              title={`Add a session on ${dayIso}`}
              onClick={() => onPickDay(dayIso)}
            >
              <span className="cal__daynum">{d}</span>
              {events.map((e) => (
                <span
                  key={e.id}
                  className="cal__event"
                  style={{ borderLeftColor: getProductColor(e.product, theme) }}
                  title={`${e.title} — ${e.presenter || 'team session'}`}
                >
                  {e.title}
                </span>
              ))}
            </button>
          )
        })}
      </div>
      <div className="cal__legend">
        {PRODUCTS.map((p) => (
          <span key={p.id} className="uc-chip" style={{ fontSize: '0.75rem' }}>
            <span
              className="uc-chip__dot"
              style={{ background: theme === 'g100' ? p.dark : p.light }}
              aria-hidden="true"
            />
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}
```

## `src/components/EnablementModal.jsx`

```jsx
import { useEffect, useState } from 'react'
import {
  Modal,
  TextInput,
  Dropdown,
  DatePicker,
  DatePickerInput,
  NumberInput,
  Checkbox,
} from '@carbon/react'
import { PRODUCTS, USE_CASES_BY_PRODUCT, getUseCaseLabel } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

const blank = {
  title: '',
  product: null, // PRODUCTS entry
  useCase: null, // catalog entry for the chosen product
  customChecked: false,
  customText: '',
  date: '',
  presenter: '',
  attendees: 10,
  hours: 4,
}

// Create a new session, or edit an existing one when `session` is passed —
// hours and dates feed the ROI and attribution math, so they must be fixable.
// Use case is product-scoped: pick the product first, then one of its use
// cases — or tick the checkbox and type a custom one when none fits.
export default function EnablementModal({ open, onClose, initialDate, session = null }) {
  const { addEnablement, updateEnablement } = useStore()
  const [form, setForm] = useState(blank)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (open) {
      if (session) {
        const product = PRODUCTS.find((p) => p.id === session.product) ?? null
        const catalog = product ? USE_CASES_BY_PRODUCT[product.id] : []
        const inCatalog = catalog.find((u) => u.id === session.useCase) ?? null
        // custom entries — and legacy records from before product-scoped
        // catalogs — edit as custom text so nothing is silently lost
        const custom = session.useCase === 'custom' || (!inCatalog && session.useCase)
        setForm({
          title: session.title,
          product,
          useCase: inCatalog,
          customChecked: Boolean(custom),
          customText: custom ? (session.customUseCase ?? getUseCaseLabel(session)) : '',
          date: session.date,
          presenter: session.presenter ?? '',
          attendees: session.attendees ?? 0,
          hours: session.hours ?? 0,
        })
      } else {
        setForm({ ...blank, date: initialDate || '' })
      }
      setInvalid(false)
    }
  }, [open, initialDate, session])

  const catalog = form.product ? USE_CASES_BY_PRODUCT[form.product.id] : []
  const useCaseOk = form.customChecked ? Boolean(form.customText.trim()) : Boolean(form.useCase)

  const submit = () => {
    if (!form.title.trim() || !form.product || !useCaseOk || !form.date) {
      setInvalid(true)
      return
    }
    const payload = {
      title: form.title.trim(),
      product: form.product.id,
      useCase: form.customChecked ? 'custom' : form.useCase.id,
      customUseCase: form.customChecked ? form.customText.trim() : undefined,
      date: form.date,
      presenter: form.presenter.trim(),
      attendees: Number(form.attendees) || 0,
      hours: Number(form.hours) || 0,
    }
    if (session) updateEnablement(session.id, payload)
    else addEnablement(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      modalHeading={session ? 'Edit enablement session' : 'Add enablement session'}
      modalLabel="Enablements"
      primaryButtonText={session ? 'Save changes' : 'Add session'}
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={submit}
    >
      <div className="form-stack">
        <TextInput
          id="en-title"
          labelText="Session title"
          placeholder="e.g. Instana Observability Workshop"
          value={form.title}
          invalid={invalid && !form.title.trim()}
          invalidText="A session title is required."
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <TextInput
          id="en-presenter"
          labelText="Presenter (optional)"
          placeholder="Who from the team delivered it"
          value={form.presenter}
          onChange={(e) => setForm({ ...form, presenter: e.target.value })}
        />
        <Dropdown
          id="en-product"
          titleText="Product"
          label="Select a product"
          items={PRODUCTS}
          itemToString={(i) => (i ? i.label : '')}
          selectedItem={form.product}
          invalid={invalid && !form.product}
          invalidText="Pick the product this session is about."
          onChange={({ selectedItem }) =>
            // switching product resets the catalog pick; custom text survives
            setForm({ ...form, product: selectedItem, useCase: null })
          }
        />
        {!form.customChecked && (
          <Dropdown
            id="en-usecase"
            titleText="Use case"
            label={form.product ? 'Select a use case' : 'Pick a product first'}
            disabled={!form.product}
            items={catalog}
            itemToString={(i) => (i ? i.label : '')}
            selectedItem={form.useCase}
            invalid={invalid && !useCaseOk}
            invalidText="Pick a use case, or tick the box below to type your own."
            onChange={({ selectedItem }) => setForm({ ...form, useCase: selectedItem })}
          />
        )}
        <Checkbox
          id="en-usecase-custom"
          labelText="The use case isn’t in the list"
          checked={form.customChecked}
          onChange={(_e, { checked }) => setForm({ ...form, customChecked: checked })}
        />
        {form.customChecked && (
          <TextInput
            id="en-usecase-custom-text"
            labelText="Custom use case"
            placeholder="Describe the use case in a few words"
            value={form.customText}
            invalid={invalid && !useCaseOk}
            invalidText="Describe the use case, or untick the box and pick from the list."
            onChange={(e) => setForm({ ...form, customText: e.target.value })}
          />
        )}
        <DatePicker
          datePickerType="single"
          dateFormat="Y-m-d"
          value={form.date ? [form.date] : []}
          onChange={(dates) => {
            const d = dates[0]
            if (d) {
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              setForm((f) => ({ ...f, date: iso }))
            }
          }}
        >
          <DatePickerInput
            id="en-date"
            labelText="Session date"
            placeholder="yyyy-mm-dd"
            invalid={invalid && !form.date}
            invalidText="A session date is required."
          />
        </DatePicker>
        <NumberInput
          id="en-attendees"
          label="Attendees"
          min={0}
          value={form.attendees}
          onChange={(_e, { value }) => setForm({ ...form, attendees: value })}
        />
        <NumberInput
          id="en-hours"
          label="Team hours invested (prep + delivery)"
          min={0}
          value={form.hours}
          onChange={(_e, { value }) => setForm({ ...form, hours: value })}
        />
      </div>
    </Modal>
  )
}
```

## `src/components/DealModal.jsx`

```jsx
import { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  TextInput,
  Dropdown,
  DatePicker,
  DatePickerInput,
  NumberInput,
  Checkbox,
} from '@carbon/react'
import {
  PRODUCTS,
  USE_CASES_BY_PRODUCT,
  DEAL_STAGES,
  fmtDate,
  matchKeyOf,
  getUseCaseLabel,
} from '../data/constants.js'
import { useStore } from '../data/store.jsx'

const blank = {
  customer: '',
  product: null, // PRODUCTS entry
  useCase: null, // catalog entry for the chosen product
  customChecked: false,
  customText: '',
  value: 100000,
  date: '',
  stage: 'Prospecting',
  owner: '',
  closeDate: '',
  sourceSessionId: '',
}

// Create a new deal, or edit an existing one when `deal` is passed — stages
// change over a deal's life, and stale stages silently corrupt the win-rate
// comparison, so editing in place matters. Use case is product-scoped, with
// a custom option; the session tie offers any session on the deal's product.
export default function DealModal({ open, onClose, deal = null }) {
  const { addDeal, updateDeal, enablements } = useStore()
  const [form, setForm] = useState(blank)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (open) {
      if (deal) {
        const product = PRODUCTS.find((p) => p.id === deal.product) ?? null
        const catalog = product ? USE_CASES_BY_PRODUCT[product.id] : []
        const inCatalog = catalog.find((u) => u.id === deal.useCase) ?? null
        const custom = deal.useCase === 'custom' || (!inCatalog && deal.useCase)
        setForm({
          customer: deal.customer,
          product,
          useCase: inCatalog,
          customChecked: Boolean(custom),
          customText: custom ? (deal.customUseCase ?? getUseCaseLabel(deal)) : '',
          value: deal.value,
          date: deal.date,
          stage: deal.stage,
          owner: deal.owner ?? '',
          closeDate: deal.closeDate ?? '',
          sourceSessionId: deal.sourceSessionId ?? '',
        })
      } else {
        setForm(blank)
      }
      setInvalid(false)
    }
  }, [open, deal])

  const catalog = form.product ? USE_CASES_BY_PRODUCT[form.product.id] : []
  const useCaseOk = form.customChecked ? Boolean(form.customText.trim()) : Boolean(form.useCase)

  // what this deal would look like to the matching rule right now
  const formRecord = {
    product: form.product?.id,
    useCase: form.customChecked ? 'custom' : form.useCase?.id,
    customUseCase: form.customChecked ? form.customText : undefined,
  }

  // sessions this deal COULD be tied to: any session on the SAME PRODUCT
  // delivered on or before the open date — the tie is a human assertion of
  // which session mattered, and product is the boundary leadership reports on
  const eligibleSessions = useMemo(
    () =>
      form.product && form.date
        ? enablements
            .filter((e) => e.product === form.product.id && e.date <= form.date)
            .sort((a, b) => a.date.localeCompare(b.date))
        : [],
    [enablements, form.product, form.date],
  )

  // the Automatic option names what the timing rule resolves to: the earliest
  // session matching the deal's use case; the manual list excludes it
  const formKey = matchKeyOf(formRecord)
  const earliestAuto = eligibleSessions.find((e) => matchKeyOf(e) === formKey) ?? null
  const autoTie = {
    id: '',
    label: earliestAuto
      ? `Automatic — ${earliestAuto.title} (${fmtDate(earliestAuto.date)})`
      : 'Automatic — no session matches this use case yet',
  }
  const tieItems = [
    autoTie,
    ...eligibleSessions
      .filter((e) => e.id !== earliestAuto?.id)
      .map((e) => ({ id: e.id, label: `${e.title} — ${fmtDate(e.date)}` })),
  ]
  // a tie that stopped being eligible (product / date changed) — or one that
  // points at the automatic pick — reads as Automatic and is dropped on save
  const selectedTie = tieItems.find((i) => i.id === form.sourceSessionId) ?? autoTie

  const submit = () => {
    if (!form.customer.trim() || !form.product || !useCaseOk || !form.date || !(Number(form.value) > 0)) {
      setInvalid(true)
      return
    }
    const payload = {
      customer: form.customer.trim(),
      product: form.product.id,
      useCase: form.customChecked ? 'custom' : form.useCase.id,
      customUseCase: form.customChecked ? form.customText.trim() : undefined,
      value: Number(form.value),
      date: form.date,
      stage: form.stage,
      owner: form.owner.trim(),
      // closeDate only makes sense on closed stages; clear it otherwise
      closeDate: form.stage.startsWith('Closed') && form.closeDate ? form.closeDate : undefined,
      sourceSessionId: selectedTie.id || undefined,
    }
    if (deal) updateDeal(deal.id, payload)
    else addDeal(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      modalHeading={deal ? 'Edit customer deal' : 'Add customer deal'}
      modalLabel="Pipeline"
      primaryButtonText={deal ? 'Save changes' : 'Add deal'}
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={submit}
    >
      <div className="form-stack">
        <TextInput
          id="deal-customer"
          labelText="Customer name"
          placeholder="e.g. Acme Financial"
          value={form.customer}
          invalid={invalid && !form.customer.trim()}
          invalidText="A customer name is required."
          onChange={(e) => setForm({ ...form, customer: e.target.value })}
        />
        <NumberInput
          id="deal-value"
          label="Deal revenue (USD)"
          min={0}
          step={10000}
          value={form.value}
          invalid={invalid && !(Number(form.value) > 0)}
          invalidText="Deal revenue must be greater than zero."
          onChange={(_e, { value }) => setForm({ ...form, value })}
        />
        <Dropdown
          id="deal-product"
          titleText="Product"
          label="Select a product"
          items={PRODUCTS}
          itemToString={(i) => (i ? i.label : '')}
          selectedItem={form.product}
          invalid={invalid && !form.product}
          invalidText="Pick the product this deal relates to."
          onChange={({ selectedItem }) =>
            setForm({ ...form, product: selectedItem, useCase: null, sourceSessionId: '' })
          }
        />
        {!form.customChecked && (
          <Dropdown
            id="deal-usecase"
            titleText="Use case the customer is interested in"
            label={form.product ? 'Select a use case' : 'Pick a product first'}
            disabled={!form.product}
            items={catalog}
            itemToString={(i) => (i ? i.label : '')}
            selectedItem={form.useCase}
            invalid={invalid && !useCaseOk}
            invalidText="Pick a use case, or tick the box below to type your own."
            onChange={({ selectedItem }) => setForm({ ...form, useCase: selectedItem })}
          />
        )}
        <Checkbox
          id="deal-usecase-custom"
          labelText="The use case isn’t in the list"
          checked={form.customChecked}
          onChange={(_e, { checked }) => setForm({ ...form, customChecked: checked })}
        />
        {form.customChecked && (
          <TextInput
            id="deal-usecase-custom-text"
            labelText="Custom use case"
            placeholder="Describe the use case in a few words"
            value={form.customText}
            invalid={invalid && !useCaseOk}
            invalidText="Describe the use case, or untick the box and pick from the list."
            onChange={(e) => setForm({ ...form, customText: e.target.value })}
          />
        )}
        <DatePicker
          datePickerType="single"
          dateFormat="Y-m-d"
          value={form.date ? [form.date] : []}
          onChange={(dates) => {
            const d = dates[0]
            if (d) {
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              setForm((f) => ({ ...f, date: iso }))
            }
          }}
        >
          <DatePickerInput
            id="deal-date"
            labelText="Deal open date"
            placeholder="yyyy-mm-dd"
            invalid={invalid && !form.date}
            invalidText="A deal date is required."
          />
        </DatePicker>
        {eligibleSessions.length > 0 && (
          <Dropdown
            id="deal-source-session"
            titleText="Tie to a specific session (optional)"
            helperText="Any session on this product delivered before the open date qualifies."
            label={autoTie.label}
            items={tieItems}
            itemToString={(i) => (i ? i.label : '')}
            selectedItem={selectedTie}
            onChange={({ selectedItem }) => setForm({ ...form, sourceSessionId: selectedItem?.id ?? '' })}
          />
        )}
        <Dropdown
          id="deal-stage"
          titleText="Stage"
          label="Stage"
          items={DEAL_STAGES}
          selectedItem={form.stage}
          onChange={({ selectedItem }) => setForm({ ...form, stage: selectedItem })}
        />
        {form.stage?.startsWith('Closed') && (
          <DatePicker
            datePickerType="single"
            dateFormat="Y-m-d"
            value={form.closeDate ? [form.closeDate] : []}
            onChange={(dates) => {
              const d = dates[0]
              if (d) {
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                setForm((f) => ({ ...f, closeDate: iso }))
              }
            }}
          >
            <DatePickerInput
              id="deal-close-date"
              labelText="Close date"
              placeholder="yyyy-mm-dd"
            />
          </DatePicker>
        )}
        <TextInput
          id="deal-owner"
          labelText="Deal owner (optional)"
          placeholder="Seller running the deal"
          value={form.owner}
          onChange={(e) => setForm({ ...form, owner: e.target.value })}
        />
      </div>
    </Modal>
  )
}
```

## `src/components/AdminResetModal.jsx`

```jsx
import { useEffect, useState } from 'react'
import { Modal, PasswordInput } from '@carbon/react'
import { useStore } from '../data/store.jsx'
import { ADMIN_KEY_HASH, sha256Hex } from '../data/constants.js'

// Key-gated full reset for the shared live store. The key is verified against
// a SHA-256 hash (the key itself never ships in the bundle), and the wipe
// goes through the synced store so it propagates to everyone. This is an
// accident guardrail, not bank-grade security — anyone the key is shared
// with can wipe the dashboard, so share it accordingly.
export default function AdminResetModal({ open, onClose }) {
  const { clearAll } = useStore()
  const [key, setKey] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (open) {
      setKey('')
      setInvalid(false)
      setChecking(false)
    }
  }, [open])

  const submit = async () => {
    if (checking) return
    setChecking(true)
    const ok = (await sha256Hex(key)) === ADMIN_KEY_HASH
    setChecking(false)
    if (!ok) {
      setInvalid(true)
      return
    }
    clearAll()
    onClose()
  }

  return (
    <Modal
      open={open}
      danger
      modalHeading="Reset all data"
      modalLabel="Administration"
      primaryButtonText="Reset all data"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!key || checking}
      onRequestClose={onClose}
      onRequestSubmit={submit}
    >
      <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
        This permanently deletes every enablement session and customer deal for everyone using this
        dashboard. Enter the administration key to confirm.
      </p>
      <PasswordInput
        id="admin-reset-key"
        labelText="Administration key"
        value={key}
        invalid={invalid}
        invalidText="Incorrect administration key."
        onChange={(e) => {
          setKey(e.target.value)
          setInvalid(false)
        }}
      />
    </Modal>
  )
}
```

## `src/components/NameModal.jsx`

```jsx
import { useEffect, useState } from 'react'
import { Modal, TextInput } from '@carbon/react'
import { useStore } from '../data/store.jsx'

// Asks for the user's full name on first visit (shared mode). The name is
// stored in this browser and attached to every record the person adds, edits,
// or deletes — the audit trail that makes shared numbers trustworthy. It can
// be changed later via the person icon in the header.
export default function NameModal({ open, onClose, firstRun }) {
  const { userName, setUserName } = useStore()
  const [name, setName] = useState('')
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (open) {
      setName(userName)
      setInvalid(false)
    }
  }, [open, userName])

  const submit = () => {
    if (!name.trim()) {
      setInvalid(true)
      return
    }
    setUserName(name)
    onClose()
  }

  return (
    <Modal
      open={open}
      modalLabel="Identity"
      modalHeading={firstRun ? 'Welcome — who are you?' : 'Change your name'}
      primaryButtonText="Continue"
      secondaryButtonText={firstRun ? undefined : 'Cancel'}
      preventCloseOnClickOutside={firstRun}
      onRequestClose={firstRun ? () => {} : onClose}
      onRequestSubmit={submit}
    >
      <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
        Your full name is attached to the records you add or edit, so the team can see who to ask
        about a change.
      </p>
      <TextInput
        id="user-name"
        labelText="Full name"
        placeholder="e.g. Hunain Malik"
        value={name}
        invalid={invalid}
        invalidText="Please enter your name."
        onChange={(e) => {
          setName(e.target.value)
          setInvalid(false)
        }}
      />
    </Modal>
  )
}
```

## `src/components/RecentlyDeleted.jsx`

```jsx
import { Button } from '@carbon/react'
import { Reset } from '@carbon/icons-react'
import { fmtDate } from '../data/constants.js'

// The recycle bin: soft-deleted records for one page, restorable in one
// click. Records are purged for good 30 days after deletion; until then an
// accidental delete costs nothing. Renders nothing when the bin is empty.
export default function RecentlyDeleted({ title, rows, onRestore }) {
  if (!rows.length) return null
  return (
    <div className="chart-card" style={{ marginTop: '1rem' }}>
      <h4 className="section-title">{title}</h4>
      <p className="rd-note">
        Deleted records can be restored for 30 days, then they are removed permanently.
      </p>
      {rows.map((r) => (
        <div key={r.id} className="rd-row">
          <div>
            <div className="rd-row__label">{r.label}</div>
            <div className="rd-row__meta">
              deleted {fmtDate(r.deletedAt.slice(0, 10))}
              {r.deletedBy ? ` by ${r.deletedBy}` : ''}
            </div>
          </div>
          <Button kind="ghost" size="sm" renderIcon={Reset} onClick={() => onRestore(r.id)}>
            Restore
          </Button>
        </div>
      ))}
    </div>
  )
}
```

## `src/components/ActivityLogModal.jsx`

```jsx
import { Modal } from '@carbon/react'
import { useStore } from '../data/store.jsx'

const fmtWhen = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

// The audit log behind the "Last edited by" badge: every add, edit, delete,
// and restore across the dashboard, newest first, with who and exactly when.
export default function ActivityLogModal({ open, onClose }) {
  const { activityLog } = useStore()

  return (
    <Modal open={open} passiveModal modalLabel="Audit" modalHeading="Activity log" onRequestClose={onClose}>
      <p className="al-note">
        The {activityLog.length >= 100 ? 'most recent 100' : `last ${activityLog.length}`} changes to
        this dashboard. Permanently removed records leave the log with them.
      </p>
      {activityLog.length === 0 ? (
        <p className="al-empty">No recorded changes yet.</p>
      ) : (
        activityLog.map((e, i) => (
          <div key={i} className="al-row">
            <span>
              <strong>{e.name ?? 'Someone'}</strong> {e.action} the {e.kind} “{e.label}”
            </span>
            <span className="al-row__time">{fmtWhen(e.at)}</span>
          </div>
        ))
      )}
    </Modal>
  )
}
```

## `src/pages/Impact.jsx`

```jsx
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tag,
} from '@carbon/react'
import { Document } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { buildInsights } from '../data/insights.js'
import { fmtUSD, fmtUSDCompact, fmtDate, STAGE_TAG_TYPE, getProduct } from '../data/constants.js'
import KpiTile from '../components/KpiTile.jsx'
import UseCaseChip from '../components/UseCaseChip.jsx'
import ComparisonPanel from '../components/ComparisonPanel.jsx'
import CoveragePanel from '../components/CoveragePanel.jsx'
import QuarterlyPipeline from '../components/QuarterlyPipeline.jsx'
import UpcomingSessions from '../components/UpcomingSessions.jsx'

const DAY_MS = 24 * 60 * 60 * 1000
const lagDays = (fromIso, toIso) =>
  Math.round((new Date(`${toIso}T00:00:00`) - new Date(`${fromIso}T00:00:00`)) / DAY_MS)

export default function Impact() {
  const { deals, enablements } = useStore()
  const insights = useMemo(() => buildInsights(deals, enablements), [deals, enablements])
  const { summary, comparison, coverage } = insights

  // most recent open date first
  const influenced = [...summary.influenced].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div className="page-header page-header--actions">
        <div>
          <h1>Outbound Pipeline View</h1>
          <p>
            All figures year to date, from the start of FY{new Date().getFullYear()}.{' '}
            <Link to="/glossary">How these numbers are calculated</Link>
          </p>
        </div>
        <Button as={Link} to="/onepager" kind="tertiary" size="md" renderIcon={Document}>
          Executive one-pager
        </Button>
      </div>

      <div className="kpi-row">
        <KpiTile
          label="Outbound-touched deals"
          value={`${summary.influencedCount} of ${summary.totalDeals}`}
          detail={
            summary.totalDeals
              ? `${Math.round((summary.influencedCount / summary.totalDeals) * 100)}% of all tracked deals`
              : 'No deals tracked yet'
          }
        />
        <KpiTile label="Outbound-touched revenue (closed won)" value={fmtUSDCompact(summary.wonRevenue)} />
        <KpiTile label="Outbound-touched open pipeline" value={fmtUSDCompact(summary.pipelineRevenue)} />
        <KpiTile
          label="Sessions delivered"
          value={summary.sessionCount}
          detail={`${summary.attendeeCount} attendees enabled`}
        />
        <KpiTile
          label="Outbound-touched value per team hour"
          value={summary.valuePerHour != null ? fmtUSDCompact(summary.valuePerHour) : '—'}
          detail={
            summary.valuePerHour != null
              ? `${summary.totalHours} enablement hours invested`
              : 'Add hours to sessions to compute ROI'
          }
        />
      </div>

      {/* full-width sections: what a seller can act on next, then the
          comparison, momentum, coverage, and the deal-level receipts */}
      <div className="card-stack">
        <UpcomingSessions />

        <div className="chart-card">
          <h4 className="section-title">Deal performance: outbound-touched vs. untouched</h4>
          {insights.caveat && <p className="impact-note" style={{ marginTop: 0 }}>{insights.caveat}</p>}
          <ComparisonPanel stats={comparison} />
        </div>

        {influenced.length > 0 && (
          <div className="chart-card">
            <h4 className="section-title">Outbound-touched pipeline opened by month</h4>
            <QuarterlyPipeline deals={deals} enablements={enablements} />
          </div>
        )}

        <div className="chart-card">
          <h4 className="section-title">Customer demand vs. enablement coverage</h4>
          <CoveragePanel rows={coverage} />
        </div>
      </div>

      {influenced.length ? (
        <div className="table-card">
          <h4 className="section-title section-title--table">Outbound-touched deals</h4>
          <Table size="md" aria-label="Outbound-touched deals">
            <TableHead>
              <TableRow>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Revenue</TableHeader>
                <TableHeader>Product</TableHeader>
                <TableHeader>Use case</TableHeader>
                <TableHeader>Stage</TableHeader>
                <TableHeader>Matched session</TableHeader>
                <TableHeader>Open date</TableHeader>
                <TableHeader>Days from session to deal</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {influenced.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.customer}</TableCell>
                  <TableCell>{fmtUSD(d.value)}</TableCell>
                  <TableCell>{getProduct(d.product)?.label ?? '—'}</TableCell>
                  <TableCell><UseCaseChip record={d} /></TableCell>
                  <TableCell>
                    <Tag type={STAGE_TAG_TYPE[d.stage] ?? 'gray'} size="sm">{d.stage}</Tag>
                  </TableCell>
                  <TableCell>
                    {d.matched[0].title}
                    <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                      delivered {fmtDate(d.matched[0].date)}
                      {d.sourceSessionId === d.matched[0].id ? ' · tied manually' : ''}
                    </div>
                  </TableCell>
                  <TableCell>{fmtDate(d.date)}</TableCell>
                  <TableCell>{lagDays(d.matched[0].date, d.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No outbound-touched deals yet</h3>
          <p>
            When a customer deal matches a use case we enabled on — and opened after that session —
            it will appear here automatically.
          </p>
          <Button as={Link} to="/enablements" kind="tertiary">Log an enablement</Button>
        </div>
      )}
    </div>
  )
}
```

## `src/pages/Enablements.jsx`

```jsx
import { useState } from 'react'
import {
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  IconButton,
  Tag,
} from '@carbon/react'
import { Add, Edit, Email, TrashCan } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { fmtDate, sessionRequestMailto, todayIso, authorNote, getProduct } from '../data/constants.js'
import UseCaseChip from '../components/UseCaseChip.jsx'
import MonthCalendar from '../components/MonthCalendar.jsx'
import EnablementModal from '../components/EnablementModal.jsx'
import RecentlyDeleted from '../components/RecentlyDeleted.jsx'

export default function Enablements() {
  const { enablements, removeEnablement, deletedEnablements, restoreEnablement } = useStore()
  // null = closed, { date } = create (optionally pre-dated), { session } = edit
  const [modal, setModal] = useState(null)

  const sorted = [...enablements].sort((a, b) => b.date.localeCompare(a.date))

  const openForDate = (isoDate) => setModal({ date: isoDate })

  return (
    <div>
      <div className="page-header page-header--actions">
        <h1>Enablement Sessions</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button kind="tertiary" renderIcon={Email} href={sessionRequestMailto()}>
            Request a session
          </Button>
          <Button renderIcon={Add} onClick={() => openForDate('')}>
            Add enablement
          </Button>
        </div>
      </div>

      <div className="table-card" style={{ marginBottom: '1rem' }}>
          {sorted.length ? (
            <Table size="md" aria-label="Enablement sessions">
              <TableHead>
                <TableRow>
                  <TableHeader>Session</TableHeader>
                  <TableHeader>Product</TableHeader>
                  <TableHeader>Use case</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Attendees</TableHeader>
                  <TableHeader>Hours</TableHeader>
                  <TableHeader aria-label="Actions" />
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {e.title}
                      {e.presenter ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>{e.presenter}</div>
                      ) : null}
                      {authorNote(e) ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>{authorNote(e)}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{getProduct(e.product)?.label ?? '—'}</TableCell>
                    <TableCell><UseCaseChip record={e} /></TableCell>
                    <TableCell>
                      {fmtDate(e.date)}
                      {e.date > todayIso() && (
                        <Tag type="blue" size="sm" style={{ marginLeft: '0.5rem' }}>Scheduled</Tag>
                      )}
                    </TableCell>
                    {/* a scheduled session hasn't had attendees yet */}
                    <TableCell>{e.date > todayIso() ? '—' : e.attendees}</TableCell>
                    <TableCell>{Number(e.hours) || 0}</TableCell>
                    <TableCell>
                      <IconButton kind="ghost" size="sm" label="Edit session" onClick={() => setModal({ session: e })}>
                        <Edit />
                      </IconButton>
                      <IconButton
                        kind="ghost"
                        size="sm"
                        label="Delete session"
                        onClick={() => removeEnablement(e.id)}
                      >
                        <TrashCan />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="empty-state">
              <h3>No sessions logged</h3>
              <p>Add the first enablement session — deals that open later on the same use case will match it automatically.</p>
            </div>
          )}
      </div>

      <MonthCalendar sessions={enablements} onPickDay={openForDate} />

      <RecentlyDeleted
        title="Recently deleted sessions"
        rows={deletedEnablements.map((e) => ({
          id: e.id,
          label: e.title,
          deletedAt: e.deletedAt,
          deletedBy: e.deletedBy,
        }))}
        onRestore={restoreEnablement}
      />

      <EnablementModal
        open={modal !== null}
        initialDate={modal?.date ?? ''}
        session={modal?.session ?? null}
        onClose={() => setModal(null)}
      />
    </div>
  )
}
```

## `src/pages/Pipeline.jsx`

```jsx
import { useMemo, useState } from 'react'
import {
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tag,
  IconButton,
} from '@carbon/react'
import { Add, Edit, TrashCan } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { attributeDeals } from '../data/attribution.js'
import { fmtUSD, fmtDate, STAGE_TAG_TYPE, authorNote, getProduct } from '../data/constants.js'
import UseCaseChip from '../components/UseCaseChip.jsx'
import DealModal from '../components/DealModal.jsx'
import InfluenceTimeline from '../components/InfluenceTimeline.jsx'
import RecentlyDeleted from '../components/RecentlyDeleted.jsx'

export default function Pipeline() {
  const { deals, enablements, removeDeal, deletedDeals, restoreDeal } = useStore()
  // null = closed, 'new' = create, deal object = edit
  const [modal, setModal] = useState(null)

  const rows = useMemo(
    () => attributeDeals(deals, enablements).sort((a, b) => b.date.localeCompare(a.date)),
    [deals, enablements],
  )

  return (
    <div>
      <div className="page-header page-header--actions">
        <h1>Customer Deals</h1>
        <Button renderIcon={Add} onClick={() => setModal('new')}>
          Add deal
        </Button>
      </div>

      <div className="table-card">
        {rows.length ? (
          <Table size="md" aria-label="Customer deals">
            <TableHead>
              <TableRow>
                {/* column order mirrors the add/edit form's field order */}
                <TableHeader>Customer</TableHeader>
                <TableHeader>Revenue</TableHeader>
                <TableHeader>Product</TableHeader>
                <TableHeader>Use case</TableHeader>
                <TableHeader>Open date</TableHeader>
                <TableHeader>Stage</TableHeader>
                <TableHeader>Owner</TableHeader>
                <TableHeader>Outbound touch</TableHeader>
                <TableHeader aria-label="Actions" />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    {d.customer}
                    {authorNote(d) ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>{authorNote(d)}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>{fmtUSD(d.value)}</TableCell>
                  <TableCell>{getProduct(d.product)?.label ?? '—'}</TableCell>
                  <TableCell><UseCaseChip record={d} /></TableCell>
                  <TableCell>{fmtDate(d.date)}</TableCell>
                  <TableCell>
                    <Tag type={STAGE_TAG_TYPE[d.stage] ?? 'gray'} size="sm">{d.stage}</Tag>
                  </TableCell>
                  <TableCell>{d.owner || '—'}</TableCell>
                  <TableCell>
                    {d.influenced ? (
                      <Tag type="purple" size="sm" title={`Preceded by ${d.matched.length} matching session(s)`}>
                        Outbound touched
                      </Tag>
                    ) : (
                      <span style={{ color: 'var(--cds-text-helper)' }}>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton kind="ghost" size="sm" label="Edit deal" onClick={() => setModal(d)}>
                      <Edit />
                    </IconButton>
                    <IconButton kind="ghost" size="sm" label="Delete deal" onClick={() => removeDeal(d.id)}>
                      <TrashCan />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="empty-state">
            <h3>No deals tracked</h3>
            <p>Add the first customer deal — if a session on its use case came first, it is tagged Outbound touched automatically.</p>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="chart-card" style={{ marginTop: '1rem' }}>
          <h4 className="section-title">Session-to-deal timeline</h4>
          <InfluenceTimeline deals={deals} enablements={enablements} />
        </div>
      )}

      <RecentlyDeleted
        title="Recently deleted deals"
        rows={deletedDeals.map((d) => ({
          id: d.id,
          label: `${d.customer} — ${fmtUSD(d.value)}`,
          deletedAt: d.deletedAt,
          deletedBy: d.deletedBy,
        }))}
        onRestore={restoreDeal}
      />

      <DealModal
        open={modal !== null}
        deal={modal && modal !== 'new' ? modal : null}
        onClose={() => setModal(null)}
      />
    </div>
  )
}
```

## `src/pages/Products.jsx`

```jsx
import { useMemo, useState } from 'react'
import { IconButton } from '@carbon/react'
import { ChevronLeft, ChevronRight } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { attributeDeals } from '../data/attribution.js'
import { quarterStart, nextQuarter, prevQuarter, quarterLabel } from '../data/quarters.js'
import {
  PRODUCTS,
  getProductColor,
  getUseCaseLabel,
  fmtUSDCompact,
  todayIso,
  OPEN_STAGES,
} from '../data/constants.js'

const toDate = (iso) => new Date(`${iso}T00:00:00`)

// The per-product view leadership asked for: one fiscal quarter at a time,
// what each product did — sessions delivered, deals opened, outbound-touched,
// closed won — with a use-case breakdown underneath. Same quarter navigation
// as the charts, so it lines up with the executive one-pager's cadence.
export default function Products() {
  const { deals, enablements } = useStore()
  const [qCursor, setQCursor] = useState(() => quarterStart(new Date()))

  const view = useMemo(() => {
    const attributed = attributeDeals(deals, enablements)
    const qEnd = nextQuarter(qCursor)
    const inQuarter = (iso) => {
      const t = toDate(iso)
      return t >= qCursor && t < qEnd
    }
    const today = todayIso()

    const cards = PRODUCTS.map((p) => {
      const sessions = enablements.filter((e) => e.product === p.id && inQuarter(e.date) && e.date <= today)
      const scheduled = enablements.filter((e) => e.product === p.id && inQuarter(e.date) && e.date > today)
      const opened = attributed.filter((d) => d.product === p.id && inQuarter(d.date))
      const touched = opened.filter((d) => d.influenced)
      const won = attributed.filter((d) => d.product === p.id && d.stage === 'Closed Won' && d.closeDate && inQuarter(d.closeDate))
      const openPipeline = touched.filter((d) => OPEN_STAGES.includes(d.stage))

      // use-case breakdown across this quarter's sessions and opened deals
      const byUseCase = new Map()
      const bucket = (label) => {
        if (!byUseCase.has(label)) byUseCase.set(label, { label, sessions: 0, deals: 0, value: 0 })
        return byUseCase.get(label)
      }
      for (const s of sessions) bucket(getUseCaseLabel(s)).sessions += 1
      for (const d of opened) {
        const b = bucket(getUseCaseLabel(d))
        b.deals += 1
        b.value += d.value
      }

      return {
        p,
        sessions,
        scheduledCount: scheduled.length,
        attendees: sessions.reduce((s, e) => s + (Number(e.attendees) || 0), 0),
        hours: sessions.reduce((s, e) => s + (Number(e.hours) || 0), 0),
        opened,
        openedValue: opened.reduce((s, d) => s + d.value, 0),
        touched,
        touchedValue: touched.reduce((s, d) => s + d.value, 0),
        openPipelineValue: openPipeline.reduce((s, d) => s + d.value, 0),
        won,
        wonValue: won.reduce((s, d) => s + d.value, 0),
        breakdown: [...byUseCase.values()].sort((a, b) => b.value - a.value || b.sessions - a.sessions),
      }
    })

    const currentQ = quarterStart(new Date())
    const allDates = [...deals.map((d) => toDate(d.date)), ...enablements.map((e) => toDate(e.date))]
    const earliestQ = allDates.length ? quarterStart(new Date(Math.min(...allDates))) : currentQ

    return { cards, canPrev: qCursor > earliestQ, canNext: qCursor < currentQ }
  }, [deals, enablements, qCursor])

  return (
    <div>
      <div className="page-header page-header--actions">
        <div>
          <h1>Products</h1>
          <p>What each product did in the quarter — sessions delivered, deals opened, and outcomes.</p>
        </div>
        <div className="tl-head__nav">
          <IconButton kind="ghost" size="sm" label="Previous quarter" disabled={!view.canPrev} onClick={() => setQCursor((q) => prevQuarter(q))}>
            <ChevronLeft />
          </IconButton>
          <span className="tl-head__label">{quarterLabel(qCursor)}</span>
          <IconButton kind="ghost" size="sm" label="Next quarter" disabled={!view.canNext} onClick={() => setQCursor((q) => nextQuarter(q))}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>

      <div className="card-stack">
        {view.cards.map(({ p, ...c }) => (
          <div key={p.id} className="chart-card">
            <h4 className="section-title">
              <ProductDot id={p.id} /> {p.label}
            </h4>
            {c.sessions.length === 0 && c.opened.length === 0 && c.won.length === 0 ? (
              <p className="pp-empty">
                No activity in {quarterLabel(qCursor)}.
                {c.scheduledCount > 0 ? ` ${c.scheduledCount} session${c.scheduledCount === 1 ? '' : 's'} scheduled.` : ''}
              </p>
            ) : (
              <>
                <div className="pp-stats">
                  <div className="pp-stat">
                    <div className="pp-stat__value">{c.sessions.length}</div>
                    <div className="pp-stat__label">Sessions delivered</div>
                    <div className="pp-stat__detail">
                      {c.attendees} attendees · {c.hours}h
                      {c.scheduledCount > 0 ? ` · ${c.scheduledCount} scheduled` : ''}
                    </div>
                  </div>
                  <div className="pp-stat">
                    <div className="pp-stat__value">{c.opened.length}</div>
                    <div className="pp-stat__label">Deals opened</div>
                    <div className="pp-stat__detail">{fmtUSDCompact(c.openedValue)} value</div>
                  </div>
                  <div className="pp-stat">
                    <div className="pp-stat__value">{c.touched.length}</div>
                    <div className="pp-stat__label">Outbound-touched</div>
                    <div className="pp-stat__detail">
                      {fmtUSDCompact(c.touchedValue)} · {fmtUSDCompact(c.openPipelineValue)} still open
                    </div>
                  </div>
                  <div className="pp-stat">
                    <div className="pp-stat__value">{c.won.length}</div>
                    <div className="pp-stat__label">Closed won in quarter</div>
                    <div className="pp-stat__detail">{fmtUSDCompact(c.wonValue)} revenue</div>
                  </div>
                </div>

                {c.breakdown.length > 0 && (
                  <div className="pp-table">
                    <div className="pp-table__row pp-table__row--head">
                      <span>Use case</span>
                      <span>Sessions</span>
                      <span>Deals opened</span>
                      <span>Deal value</span>
                    </div>
                    {c.breakdown.map((b) => (
                      <div key={b.label} className="pp-table__row">
                        <span>{b.label}</span>
                        <span>{b.sessions || '—'}</span>
                        <span>{b.deals || '—'}</span>
                        <span>{b.value ? fmtUSDCompact(b.value) : '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductDot({ id }) {
  const { theme } = useStore()
  return <span className="uc-chip__dot pp-dot" style={{ background: getProductColor(id, theme) }} aria-hidden="true" />
}
```

## `src/pages/OnePager.jsx`

```jsx
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button, Theme, Tag } from '@carbon/react'
import { Printer, ArrowLeft } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { buildInsights, toneHeading } from '../data/insights.js'
import { getProduct, getUseCaseLabel, fmtUSD, fmtUSDCompact, fmtPct, fmtDate, STAGE_TAG_TYPE } from '../data/constants.js'

const pct0 = (ratio) => `${Math.round(ratio * 100)}%`

// A shareable, print-optimized executive summary. Use the Print button and
// "Save as PDF" to produce a one-page hand-off — charts are deliberately
// plain HTML/CSS so they print exactly as rendered. The headline and the
// recommended actions are generated from the data by the insights engine,
// so the sheet never asserts a story the numbers don't support.
export default function OnePager() {
  const { deals, enablements } = useStore()
  const insights = useMemo(() => buildInsights(deals, enablements), [deals, enablements])
  const { summary, comparison, coverage } = insights

  const topWins = [...summary.influenced].sort((a, b) => b.value - a.value).slice(0, 5)
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const { influenced: inf, rest } = comparison

  const cmpRow = (label, a, b, fmt) => (
    <tr>
      <td>{label}</td>
      <td className="op__num op__num--accent">{a != null ? fmt(a) : '—'}</td>
      <td className="op__num">{b != null ? fmt(b) : '—'}</td>
    </tr>
  )

  return (
    <Theme theme="white" className="op-wrap">
      <div className="op-toolbar no-print">
        <Button as={Link} to="/impact" kind="ghost" size="md" renderIcon={ArrowLeft}>
          Back to dashboard
        </Button>
        <Button size="md" renderIcon={Printer} onClick={() => window.print()}>
          Print / save as PDF
        </Button>
      </div>

      <article className="op">
        <header className="op__head">
          <div>
            <div className="op__brand">IBM · Outbound Pipeline View</div>
            <h1>Executive Summary</h1>
          </div>
          <div className="op__date">FY{new Date().getFullYear()} year to date · {today}</div>
        </header>

        {/* same order as the dashboard KPI row */}
        <section className="op__kpis">
          <div className="op__kpi">
            <div className="op__kpi-value">
              {summary.influencedCount} of {summary.totalDeals}
            </div>
            <div className="op__kpi-label">Outbound-touched deals</div>
          </div>
          <div className="op__kpi">
            <div className="op__kpi-value">{fmtUSDCompact(summary.wonRevenue)}</div>
            <div className="op__kpi-label">Outbound-touched revenue (closed won)</div>
          </div>
          <div className="op__kpi">
            <div className="op__kpi-value">{fmtUSDCompact(summary.pipelineRevenue)}</div>
            <div className="op__kpi-label">Outbound-touched open pipeline</div>
          </div>
          <div className="op__kpi">
            <div className="op__kpi-value">
              {summary.valuePerHour != null ? fmtUSDCompact(summary.valuePerHour) : '—'}
            </div>
            <div className="op__kpi-label">
              Outbound-touched value per team hour ({summary.totalHours}h invested)
            </div>
          </div>
        </section>

        <div className="op__cols">
          <section>
            <h2>{toneHeading[insights.tone]}</h2>
            {insights.caveat && (
              <p className="op__verdict">
                <em>{insights.caveat}</em>
              </p>
            )}
            <table className="op__table">
              <thead>
                <tr>
                  <th />
                  <th>Outbound-touched (n={inf.n})</th>
                  <th>No outbound touch (n={rest.n})</th>
                </tr>
              </thead>
              <tbody>
                {cmpRow('Win rate', inf.winRate, rest.winRate, fmtPct)}
                {cmpRow('Average deal size', inf.avgSize, rest.avgSize, fmtUSDCompact)}
                {cmpRow('Average sales cycle', inf.cycleDays, rest.cycleDays, (v) => `${Math.round(v)} days`)}
              </tbody>
            </table>
          </section>

          <section>
            <h2>By product</h2>
            <table className="op__table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sessions</th>
                  <th>Touched deals</th>
                  <th>Won</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td className="op__num">{r.sessionCount}</td>
                    <td className="op__num">{r.touchedCount} of {r.dealCount}</td>
                    <td className="op__num">{fmtUSDCompact(r.wonRevenue)}</td>
                    <td className="op__num">{fmtUSDCompact(r.pipelineRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="op__verdict" style={{ marginTop: '0.5rem' }}>
              <em>
                Demand vs. coverage:{' '}
                {coverage.map((r) => `${r.label} ${pct0(r.demandShare)} / ${pct0(r.coverageShare)}`).join(' · ')}
              </em>
            </p>
          </section>
        </div>

        {insights.asks.length > 0 && (
          <div className="op__callout">
            <strong>Recommended actions</strong>
            <ul>
              {insights.asks.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        <section>
          <h2>Top outbound-touched deals</h2>
          <table className="op__table op__table--deals">
            {/* sized so the whitespace between every pair of columns reads evenly */}
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '27%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '24%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Revenue</th>
                <th>Product · use case</th>
                <th>Stage</th>
                <th>Matched session</th>
              </tr>
            </thead>
            <tbody>
              {topWins.map((d) => (
                <tr key={d.id}>
                  <td>{d.customer}</td>
                  <td className="op__num">{fmtUSD(d.value)}</td>
                  <td>
                    {getProduct(d.product)?.label ?? '—'}
                    <div className="op__sub">{getUseCaseLabel(d)}</div>
                  </td>
                  <td>
                    <Tag type={STAGE_TAG_TYPE[d.stage] ?? 'gray'} size="sm">{d.stage}</Tag>
                  </td>
                  <td>
                    {d.matched[0].title}
                    <div className="op__sub">
                      delivered {fmtDate(d.matched[0].date)}
                      {d.sourceSessionId === d.matched[0].id ? ' · tied manually' : ''}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="op__foot">
          Method: a deal is counted as outbound-touched when an enablement session on the same use case
          preceded the deal&apos;s open date.
          All figures are year to date from the start of FY{new Date().getFullYear()}, as entered by {today}.
          Every term and formula is defined on the{' '}
          <Link to="/glossary">Methodology &amp; Glossary</Link> page of the Outbound Pipeline View.
        </footer>
      </article>
    </Theme>
  )
}
```

## `src/pages/Glossary.jsx`

```jsx
import { Link } from 'react-router-dom'
import { Button } from '@carbon/react'
import { ArrowLeft } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'

// The methodology page: everything the view counts, defined in one designed
// place — one sentence of scope, the counting rule shown visually, then every
// term and formula used anywhere in the app. Deliberately matter-of-fact: the
// page defines the math and lets it speak, rather than arguing about credit.

const TERMS = [
  {
    term: 'Outbound-touched deal',
    def: 'A deal where at least one enablement session on the same use case was delivered on or before the deal’s open date. Custom use cases match when the product and the wording agree. Deals with no prior session are explicitly not counted — and are shown as excluded, never hidden.',
  },
  {
    term: 'Product',
    def: 'Every session and deal is tagged with the product it relates to: Concert Protect, Instana, or Turbonomic. Colors throughout the dashboard identify the product, and the Products page breaks activity down per product per quarter.',
  },
  {
    term: 'Use case',
    def: 'Product-specific: each product carries its own fixed list (e.g. Vulnerability Management under Concert Protect, Full-Stack Observability under Instana, Cloud Cost Optimization under Turbonomic). When nothing in the list fits, a custom use case can be typed in — custom entries match sessions to deals by product plus identical wording.',
  },
  {
    term: 'Matched session',
    def: 'The session shown for a touched deal, with its delivery date ("delivered Feb 10, 2026"). By default it is the earliest session on the same use case delivered on or before the open date. When logging or editing a deal, it can instead be tied to any session on the deal’s PRODUCT delivered before the open date; those show "tied manually". A tie that becomes ineligible falls back to automatic.',
  },
  {
    term: 'Open date / Close date',
    def: 'Open date is when the deal was opened, as entered by the deal owner — it is the date used for the timing match. Close date is entered when a deal reaches Closed Won or Closed Lost, and is used only for sales-cycle length.',
  },
  {
    term: 'Days from session to deal',
    def: 'Deal open date minus the matched session’s delivery date, in days.',
  },
  {
    term: 'Touchpoint carried from an earlier quarter',
    def: 'In quarter views: a deal that opened in the displayed quarter whose matching session happened in a previous quarter. Drawn as a dashed line entering from the left edge, with a caption naming the session and its delivery date. Clicking the caption opens that session’s quarter with the session highlighted.',
  },
]

const METRICS = [
  {
    name: 'Outbound-touched deals (X of Y)',
    formula: 'count of outbound-touched deals ÷ all tracked deals',
    note: 'A share of the tracked pipeline.',
  },
  {
    name: 'Outbound-touched revenue (closed won)',
    formula: 'Σ value of outbound-touched deals in Closed Won',
    note: 'Sums each deal’s full value; nothing is split or allocated per session.',
  },
  {
    name: 'Sessions delivered',
    formula: 'count of sessions dated on or before today',
    note: 'Sessions scheduled for a future date appear under “Upcoming sessions” and on the calendar, and join every delivered total (sessions, attendees, hours, coverage) once their date passes.',
  },
  {
    name: 'Outbound-touched open pipeline',
    formula: 'Σ value of outbound-touched deals in open stages',
    note: 'Open stages: Prospecting, Qualification, Proposal, Negotiation.',
  },
  {
    name: 'Win rate',
    formula: 'Closed Won ÷ (Closed Won + Closed Lost)',
    note: 'Computed separately for the outbound-touched and untouched groups; open deals are not in the denominator.',
  },
  {
    name: 'Average deal size',
    formula: 'mean deal value across the group',
    note: 'Includes open and closed deals.',
  },
  {
    name: 'Average sales cycle',
    formula: 'mean (close date − open date), in days',
    note: 'Over closed deals that have a close date recorded.',
  },
  {
    name: 'Outbound-touched value per team hour',
    formula: '(touched won revenue + touched open pipeline) ÷ total session hours',
    note: 'A throughput measure of enablement effort.',
  },
  {
    name: 'Demand share',
    formula: 'product’s deal value ÷ total deal value',
    note: 'Across all tracked deals, touched or not.',
  },
  {
    name: 'Coverage share',
    formula: 'product’s session hours ÷ total session hours',
    note: 'Weighted by session count instead if no hours are recorded.',
  },
  {
    name: '“Invest here” / “Well covered” / “Balanced”',
    formula: 'demand share − coverage share',
    note: '≥ +5 points → Invest here · ≤ −5 points → Well covered · otherwise Balanced.',
  },
  {
    name: 'Outbound-touched pipeline by month',
    formula: 'Σ value of touched deals, bucketed by open-date month',
    note: 'Shown per fiscal quarter; months that haven’t started show “Coming soon”, not $0.',
  },
  {
    name: 'Products view (per quarter)',
    formula: 'sessions, deals opened, outbound-touched, closed won — per product per fiscal quarter',
    note: 'Deals count in the quarter they OPENED; “Closed won in quarter” counts by the close date’s quarter (so a deal can open in Q2 and be won in Q3); sessions count when delivered inside the quarter, with scheduled ones shown separately.',
  },
]

const CONVENTIONS = [
  'Fiscal calendar — IBM’s fiscal year matches the calendar year; quarters are calendar quarters (Q1 = Jan–Mar). All headline figures are year to date from the start of the current fiscal year.',
  'Timing is not causation — a deal opening after a session doesn’t prove the session caused it. The touched-vs-untouched comparison exists precisely so the data, not the framing, makes whatever case there is.',
  'Small samples — when either comparison group is small, the view says so: “read as an early signal, not a proven effect.”',
  'Manual entry — v1 figures reflect what has been entered and are only as complete as the entries. Sessions and deals are editable so records stay correct as they progress.',
  'Shared live data — everyone opening the dashboard link reads and writes the same records. The header badge shows sync status (Saved / Saving… / Offline — changes not saved); entries made offline save automatically once the connection returns. Clearing all data requires the administration key.',
  'Edits and deletions — every record carries who added or last edited it; clicking “Last edited by” in the header opens the activity log of every add, edit, delete, and restore with who and when. Deleted records move to “Recently deleted” on their page, can be restored for 30 days, and are then removed permanently.',
]

// static mini-diagram of the counting rule, in the timeline's visual language
function RuleDiagram() {
  const { theme } = useStore()
  const accent = theme === 'g100' ? '#4589ff' : '#0f62fe'
  const gray = '#8d8d8d'
  const ink = { primary: 'var(--cds-text-primary)', secondary: 'var(--cds-text-secondary)', helper: 'var(--cds-text-helper)' }
  const grid = 'var(--cds-border-subtle-01)'

  return (
    <svg viewBox="0 0 1128 260" style={{ width: '100%', display: 'block' }} role="img" aria-label="How a deal is counted: a session delivered before the deal opens counts; a deal with no prior session does not">
      {/* counted example */}
      <text x="0" y="18" fontSize="13" fontWeight="600" style={{ fill: ink.primary }}>Counted</text>
      <line x1="0" y1="86" x2="700" y2="86" stroke={grid} strokeWidth="1" />
      <g transform="translate(140 86)">
        <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" fill={accent} />
      </g>
      <text x="140" y="112" fontSize="12" textAnchor="middle" style={{ fill: ink.secondary }}>Session delivered</text>
      <text x="140" y="128" fontSize="11" textAnchor="middle" style={{ fill: ink.helper }}>Feb 10 · same use case</text>
      <path d="M 140 78 C 140 55, 480 55, 480 40" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5" />
      <circle cx="480" cy="32" r="8" fill={accent} />
      <text x="480" y="12" fontSize="12" textAnchor="middle" fontWeight="600" style={{ fill: ink.primary }}>Deal opened · Apr 27</text>
      <text x="586" y="36" fontSize="12" fontWeight="600" style={{ fill: accent }}>→ Outbound-touched</text>

      {/* not-counted example */}
      <text x="0" y="170" fontSize="13" fontWeight="600" style={{ fill: ink.primary }}>Not counted</text>
      <line x1="0" y1="238" x2="700" y2="238" stroke={grid} strokeWidth="1" />
      <circle cx="180" cy="186" r="7" fill="var(--cds-layer-01)" stroke={gray} strokeWidth="2" />
      <text x="180" y="166" fontSize="12" textAnchor="middle" fontWeight="600" style={{ fill: ink.secondary }}>Deal opened · Feb 12</text>
      <g transform="translate(430 238)">
        <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" fill={gray} />
      </g>
      <text x="430" y="226" fontSize="11" textAnchor="middle" style={{ fill: ink.helper }}>First session · Feb 24 (after the deal)</text>
      <text x="560" y="190" fontSize="12" fontWeight="600" style={{ fill: ink.helper }}>→ excluded from every metric</text>

      {/* legend */}
      <g transform="translate(760 40)">
        <rect x="0" y="0" width="10" height="10" transform="rotate(45 5 5)" fill={accent} />
        <text x="22" y="10" fontSize="12" style={{ fill: ink.secondary }}>Enablement session</text>
        <circle cx="5" cy="34" r="6" fill={accent} />
        <text x="22" y="38" fontSize="12" style={{ fill: ink.secondary }}>Deal counted as outbound-touched</text>
        <circle cx="5" cy="62" r="5.5" fill="var(--cds-layer-01)" stroke={gray} strokeWidth="2" />
        <text x="22" y="66" fontSize="12" style={{ fill: ink.secondary }}>Deal with no prior session</text>
      </g>
    </svg>
  )
}

export default function Glossary() {
  return (
    <div>
      <div className="page-header page-header--actions">
        <h1>Methodology &amp; Glossary</h1>
        <Button as={Link} to="/" kind="ghost" size="md" renderIcon={ArrowLeft}>
          Back to Pipeline View
        </Button>
      </div>

      <div className="gl-promise">
        <p className="gl-promise__lead">
          Every number in this view counts one thing: <strong>an enablement session delivered before
          a deal opened on the same use case.</strong>
        </p>
      </div>

      <div className="card-stack">
        <div className="chart-card">
          <h4 className="section-title">The counting rule</h4>
          <RuleDiagram />
        </div>

        <div className="chart-card">
          <h4 className="section-title">Terms</h4>
          <div className="gl-grid">
            {TERMS.map((t) => (
              <div key={t.term} className="gl-card">
                <h5>{t.term}</h5>
                <p>{t.def}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h4 className="section-title">Metrics &amp; formulas</h4>
          <div className="gl-metrics">
            {METRICS.map((m) => (
              <div key={m.name} className="gl-metric">
                <div className="gl-metric__name">{m.name}</div>
                <code className="gl-metric__formula">{m.formula}</code>
                <div className="gl-metric__note">{m.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h4 className="section-title">Conventions &amp; caveats</h4>
          <ul className="gl-conventions">
            {CONVENTIONS.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
```

## `server/server.mjs`

```js
import http from 'node:http'
import { readFile, writeFile, rename } from 'node:fs/promises'

// Shared-store API for the Outbound Pipeline View. One resource: a single JSON
// document { version, enablements[], deals[] } with optimistic concurrency —
// a PUT must carry the version it was based on; a stale version gets 409 plus
// the current document so the client can merge and retry. Storage is a JSON
// file on disk (atomic tmp+rename writes, serialized through a queue), which
// is all a small team needs; swap `load`/`store` for a database call without
// touching the HTTP contract.
//
//   GET    /api/data  -> { version, enablements, deals }
//   PUT    /api/data  <- { version, enablements, deals }
//                     -> 200 { version: n+1 } | 409 current document
//   DELETE /api/data  -> resets to the empty document (testing / clean handover)
//
// Env: PORT (default 8787), DATA_FILE (default ./data.json next to this file).

const PORT = Number(process.env.PORT) || 8787
const DATA_FILE = process.env.DATA_FILE || new URL('./data.json', import.meta.url).pathname
const EMPTY = { version: 0, enablements: [], deals: [] }

// serialize all writes so concurrent PUTs can't interleave file operations
let queue = Promise.resolve()
const enqueue = (fn) => {
  const run = queue.then(fn, fn)
  queue = run.catch(() => {})
  return run
}

async function load() {
  try {
    const doc = JSON.parse(await readFile(DATA_FILE, 'utf8'))
    if (Number.isInteger(doc.version) && Array.isArray(doc.enablements) && Array.isArray(doc.deals)) return doc
  } catch {
    // missing or corrupt file falls through to the empty document
  }
  return EMPTY
}

async function store(doc) {
  const tmp = `${DATA_FILE}.tmp`
  await writeFile(tmp, JSON.stringify(doc, null, 2))
  await rename(tmp, DATA_FILE)
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
}

const server = http.createServer(async (req, res) => {
  const send = (code, body) => {
    res.writeHead(code, { 'content-type': 'application/json', ...CORS })
    res.end(JSON.stringify(body))
  }

  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS)
      return res.end()
    }
    const { pathname } = new URL(req.url, 'http://localhost')
    if (pathname !== '/api/data') return send(404, { error: 'not found' })

    if (req.method === 'GET') return send(200, await load())

    if (req.method === 'DELETE') {
      await enqueue(() => store(EMPTY))
      return send(200, EMPTY)
    }

    if (req.method === 'PUT') {
      let raw = ''
      for await (const chunk of req) raw += chunk
      let doc
      try {
        doc = JSON.parse(raw)
      } catch {
        return send(400, { error: 'invalid JSON' })
      }
      if (!Number.isInteger(doc.version) || !Array.isArray(doc.enablements) || !Array.isArray(doc.deals)) {
        return send(400, { error: 'expected { version: int, enablements: [], deals: [] }' })
      }
      return await enqueue(async () => {
        const current = await load()
        if (doc.version !== current.version) return send(409, current)
        const next = { version: current.version + 1, enablements: doc.enablements, deals: doc.deals }
        await store(next)
        return send(200, { version: next.version })
      })
    }

    return send(405, { error: 'method not allowed' })
  } catch (err) {
    return send(500, { error: String(err) })
  }
})

server.listen(PORT, () => {
  console.log(`shared-store API listening on :${PORT} (data file: ${DATA_FILE})`)
})
```

# Part 3 — Deployment (GitHub Pages, shared mode)

The production deployment is a static site on GitHub Pages, built in SHARED mode against
the team's EXISTING shared data store. Configure your "Deploy to GitHub Pages" workflow's
build step exactly like this:

```yaml
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: https://outbound-dashboard-44190-default-rtdb.firebaseio.com/outbound.json
          VITE_API_KIND: blob
```

Rules:
- That `VITE_API_URL` value is an EXISTING store already holding the team's live data —
  a Firebase Realtime Database REST path (GET returns the document, PUT replaces it).
  Do NOT create a new store or Firebase project, do NOT write to that URL during the
  build, do NOT modify its contents. The full value ends in
  `-default-rtdb.firebaseio.com/outbound.json` — the `.json` suffix is required.
- `VITE_API_KIND` is the literal string `blob`.
- Do not set `VITE_BUILD_SHA` (see warning 4).
- Deploy `dist` to the SAME Pages URL each time, replacing in place.
- If the store fails a reachability check during deployment, STOP AND REPORT — never
  create a replacement store (see warning 7). Recommended extras (already in use by the
  team, optional for a rebuild): a scheduled workflow that commits a JSON backup of the
  store to the repo every 6 hours, and a manual restore workflow that merges a backup
  into the store by record id with the current store winning ties.

Pre-deploy gate (run locally on the built `dist`):
1. The built JS contains the jsonblob URL above.
2. Runtime check — serve `dist` locally (`npx vite preview`) and open it in a fresh
   browser profile: the name modal ("Who is this?") appears first — enter a test name;
   the page then shows the shared store's live data (NOT demo rows like
   "Acme Financial" — note the demo seed strings legitimately exist inside the bundle
   for dev mode; the requirement is that they never RENDER in shared mode); the header
   sync badge reaches `Saved`; the header has NO reset-demo (circular-arrows) action;
   the user-avatar and trash-can admin actions ARE present.

Post-deploy verification (requires a human with a browser — report the checklist for
them if you cannot do it): open the live Pages URL fresh → live team data visible, badge
`Saved`; add ONE clearly-labeled test session → hard-refresh → still there → visible in a
second browser within ~20 s → delete it individually from either browser (it moves to
"Recently deleted"), confirm the deletion syncs, then Restore-and-delete or leave it to
purge. NEVER use the admin "Reset all data" during deployment verification — the store
holds live team data. If the badge sticks on `Offline — changes not saved`, the network
cannot reach jsonblob.com: stop and report exactly that.

# Part 4 — Acceptance checklist (the build is not done until every item passes)

Visual / styling:
1. No serif text anywhere (IBM Plex Sans everywhere); fixed 3 rem black header bar with
   "IBM Outbound Pipeline View", four nav tabs (Pipeline View, Enablements, Deals,
   Products — active underlined blue), "Last edited by" badge + sync badge, user-avatar,
   trash-can and theme-toggle icon actions (shared mode).
2. Both themes fully legible when toggled (white page/light-gray cards/near-black text;
   #161616 page/#262626 cards/near-white text), including chart inks and the calendar.
3. KPI tiles: flat cards separated by 1 px hairline seams, values 2.625 rem weight 300.
4. Comparison/coverage rows: 1 px divider per row, all bars starting at the same x,
   accent-blue vs context-gray bars, adverse deltas shown in calm ink (never hidden);
   coverage rows and every use-case chip carry the product color dot.
5. Modals open centered over a dimmed overlay with styled Carbon inputs.
6. No overlapping text anywhere: monthly chart ("Current month" tag at the band top,
   value label 8 px above its bar), timeline label collision handling, glossary diagram.

Language:
7. "GTM" appears nowhere; "influenced", "attributed", "credit", "drove" appear nowhere in
   visible text; the glossary opens with the single neutral sentence "Every number in
   this view counts one thing: an enablement session delivered before a deal opened on
   the same use case." with no credit/ownership disclaimers anywhere.

Mechanics (test in standalone dev mode with the seed, where the expected numbers are
known — figures below assume today's date is between 2026-08-13 and 2026-08-26; outside
that window the two seed sessions dated 2026-08-12 and 2026-08-27 cross the
scheduled/delivered line and shift the totals): 10 of 12 outbound-touched (83%), $1.38M
touched won, $1.4M open, Sessions delivered 10 with 172 attendees and 56 h (the
2026-08-27 session is scheduled and appears in the Upcoming strip), $49.64K/hour, win
rate 75% vs 0%, average size $293K vs $95K, cycle 50 vs 77 days, and on the coverage
panel Concert Protect tagged "Invest here · +18 pts demand" with Instana and Turbonomic
"Well covered":
8. Product → use case: in both modals the product dropdown drives the use-case list
   (Concert Protect 5 options, Instana 6, Turbonomic 6); ticking the custom checkbox
   swaps the dropdown for a text field. "Pier 57 Logistics" is outbound-touched through
   CUSTOM matching — its custom text equals the "Mainframe Observability Roundtable"
   session's (same product, same wording).
9. Adding a session on a use case that has deals but no sessions (e.g. Turbonomic /
   VMware Optimization, before 2026-05-19) flips those deals to touched everywhere
   instantly; deleting it reverts everything exactly.
10. Editing a deal's open date re-sorts every table and moves it on both charts; a closed
    stage reveals the close-date field and clears it if reopened.
11. The tie dropdown lists sessions on the deal's PRODUCT delivered on or before its open
    date: "Automatic — {earliest same-use-case session} ({date})" first, then the other
    eligible sessions with the automatic one EXCLUDED (scheduled sessions never appear);
    tying updates the Matched session column (with " · tied manually"), the day count,
    and the timeline curve (dashed carried from the tied session's quarter when out of
    view); reverting to Automatic restores the earliest, unflagged.
12. Products tab: one card per product for the shown quarter with sessions
    delivered/scheduled, attendees, hours, deals opened + value, outbound-touched +
    value + still-open, closed won in quarter (by CLOSE date — a deal opened in Q2 and
    won in Q3 counts in Q3's card) + revenue, and a use-case breakdown table; quarter
    navigation bounded like the charts; products with no activity say "No activity in
    {quarter}".
13. The one-pager prints to one page, light-themed, with the generated verdict heading,
    the "By product" table, and recommended actions.

Shared mode (test against a local instance of `server/server.mjs` or the blob contract):
14. Entry → hard-refresh → persists; second browser sees it on load and receives new
    entries within one poll without reloading; two browsers adding simultaneously both
    keep their entries; killing the API shows the offline badge and the queued entry
    saves automatically on recovery; wrong admin key rejected in place with data intact;
    correct key empties the store for every open browser.
15. Audit trail: first visit asks for a name and blocks record entry until given; rows
    show "added by X" and switch to "edited by Y" after an edit; the header "Last edited
    by" badge opens the activity log listing adds/edits/deletes/restores newest-first
    with name, date, and time.
16. Soft delete: deleting a row moves it to that page's "Recently deleted" panel with
    who/when; Restore brings it back with its history intact; the panel notes removal
    after 30 days; the admin reset (and nothing else) removes records outright.
