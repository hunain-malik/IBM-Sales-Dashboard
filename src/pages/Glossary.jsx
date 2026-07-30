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
    def: 'A deal where at least one enablement session on the same use case was delivered on or before the deal’s open date. Deals with no prior session are explicitly not counted — and are shown as excluded, never hidden.',
  },
  {
    term: 'Use case',
    def: 'One of five fixed categories both sessions and deals are tagged with: Vulnerability Management, Secure Coder, Monitoring, Optimization, Other. Matching only ever happens within the same use case.',
  },
  {
    term: 'Matched session',
    def: 'The session shown for a touched deal, with its delivery date ("delivered Feb 10, 2026"). By default it is the earliest eligible session — same use case, delivered on or before the open date. When logging or editing a deal, it can instead be tied to any other eligible session; those show "tied manually". A tie that becomes ineligible falls back to automatic.',
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
    def: 'In quarter views: a deal that opened in the displayed quarter whose matching session happened in a previous quarter. Drawn as a dashed line entering from the left edge, labeled with the session’s quarter.',
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
    formula: 'use case’s deal value ÷ total deal value',
    note: 'Across all tracked deals, touched or not.',
  },
  {
    name: 'Coverage share',
    formula: 'use case’s session hours ÷ total session hours',
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
]

const CONVENTIONS = [
  'Fiscal calendar — IBM’s fiscal year matches the calendar year; quarters are calendar quarters (Q1 = Jan–Mar). All headline figures are year to date from the start of the current fiscal year.',
  'Timing is not causation — a deal opening after a session doesn’t prove the session caused it. The touched-vs-untouched comparison exists precisely so the data, not the framing, makes whatever case there is.',
  'Small samples — when either comparison group is small, the view says so: “read as an early signal, not a proven effect.”',
  'Manual entry — v1 figures reflect what has been entered and are only as complete as the entries. Sessions and deals are editable so records stay correct as they progress.',
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
