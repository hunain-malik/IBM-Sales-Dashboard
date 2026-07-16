import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button, Theme, Tag } from '@carbon/react'
import { Printer, ArrowLeft } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { buildInsights, toneHeading } from '../data/insights.js'
import { getUseCase, fmtUSD, fmtUSDCompact, fmtPct, fmtDate, STAGE_TAG_TYPE } from '../data/constants.js'

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
            <div className="op__brand">IBM · Enablement Impact</div>
            <h1>Executive summary</h1>
          </div>
          <div className="op__date">FY{new Date().getFullYear()} year to date · {today}</div>
        </header>

        {/* same order as the dashboard KPI row */}
        <section className="op__kpis">
          <div className="op__kpi">
            <div className="op__kpi-value">
              {summary.influencedCount} of {summary.totalDeals}
            </div>
            <div className="op__kpi-label">Deals driven by enablement</div>
          </div>
          <div className="op__kpi">
            <div className="op__kpi-value">{fmtUSDCompact(summary.wonRevenue)}</div>
            <div className="op__kpi-label">Influenced revenue (closed won)</div>
          </div>
          <div className="op__kpi">
            <div className="op__kpi-value">{fmtUSDCompact(summary.pipelineRevenue)}</div>
            <div className="op__kpi-label">Influenced open pipeline</div>
          </div>
          <div className="op__kpi">
            <div className="op__kpi-value">
              {summary.valuePerHour != null ? fmtUSDCompact(summary.valuePerHour) : '—'}
            </div>
            <div className="op__kpi-label">
              Influenced value per team hour ({summary.totalHours}h invested)
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
                  <th>Influenced (n={inf.n})</th>
                  <th>Not influenced (n={rest.n})</th>
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
            <h2>Demand vs. coverage by use case</h2>
            <table className="op__table">
              <thead>
                <tr>
                  <th>Use case</th>
                  <th>Demand share</th>
                  <th>Coverage share</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((r) => (
                  <tr key={r.useCase}>
                    <td>{r.label}</td>
                    <td className="op__num">{pct0(r.demandShare)}</td>
                    <td className="op__num">{pct0(r.coverageShare)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <h2>Top enablement-influenced deals</h2>
          <table className="op__table op__table--deals">
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '36%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Customer</th>
                <th className="op__num--right">Revenue</th>
                <th>Use case</th>
                <th>Stage</th>
                <th>First matching session</th>
              </tr>
            </thead>
            <tbody>
              {topWins.map((d) => (
                <tr key={d.id}>
                  <td>{d.customer}</td>
                  <td className="op__num op__num--right">{fmtUSD(d.value)}</td>
                  <td>{getUseCase(d.useCase).label}</td>
                  <td>
                    <Tag type={STAGE_TAG_TYPE[d.stage] ?? 'gray'} size="sm">{d.stage}</Tag>
                  </td>
                  <td>
                    {d.matched[0].title}
                    <div className="op__sub">{fmtDate(d.matched[0].date)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="op__foot">
          Attribution method: a deal counts as enablement-influenced when the customer&apos;s use case
          matches at least one session our team delivered on or before the deal&apos;s open date.
          All figures are year to date from the start of FY{new Date().getFullYear()}, as entered by {today}.
        </footer>
      </article>
    </Theme>
  )
}
