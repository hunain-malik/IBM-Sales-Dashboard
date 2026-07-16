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
} from '@carbon/react'
import { Document } from '@carbon/icons-react'
import { SimpleBarChart } from '@carbon/charts-react'
import { useStore } from '../data/store.jsx'
import { monthlyInfluenced } from '../data/attribution.js'
import { buildInsights } from '../data/insights.js'
import { USE_CASES, OPEN_STAGES, fmtUSD, fmtUSDCompact } from '../data/constants.js'
import KpiTile from '../components/KpiTile.jsx'
import UseCaseChip from '../components/UseCaseChip.jsx'
import ComparisonPanel from '../components/ComparisonPanel.jsx'
import CoveragePanel from '../components/CoveragePanel.jsx'
import InfluenceTimeline from '../components/InfluenceTimeline.jsx'

const DAY_MS = 24 * 60 * 60 * 1000
const lagDays = (fromIso, toIso) =>
  Math.round((new Date(`${toIso}T00:00:00`) - new Date(`${fromIso}T00:00:00`)) / DAY_MS)

export default function Impact() {
  const { deals, enablements, theme } = useStore()
  const insights = useMemo(() => buildInsights(deals, enablements), [deals, enablements])
  const { summary, comparison, coverage } = insights
  const monthly = useMemo(() => monthlyInfluenced(deals, enablements), [deals, enablements])

  const influenced = summary.influenced

  // grouped rollup: the per-deal detail lives on the Pipeline tab; this page
  // stays at the use-case altitude
  const rollup = useMemo(
    () =>
      USE_CASES.map((u) => {
        const ds = summary.influenced.filter((d) => d.useCase === u.id)
        if (!ds.length) return null
        const sessions = enablements.filter((e) => e.useCase === u.id)
        return {
          useCase: u.id,
          count: ds.length,
          won: ds.filter((d) => d.stage === 'Closed Won').reduce((s, d) => s + d.value, 0),
          open: ds.filter((d) => OPEN_STAGES.includes(d.stage)).reduce((s, d) => s + d.value, 0),
          sessions: sessions.length,
          hours: sessions.reduce((s, e) => s + (Number(e.hours) || 0), 0),
          avgLag: Math.round(ds.reduce((s, d) => s + lagDays(d.matched[0].date, d.date), 0) / ds.length),
        }
      })
        .filter(Boolean)
        .sort((a, b) => b.won + b.open - (a.won + a.open)),
    [summary, enablements],
  )

  return (
    <div>
      <div className="page-header page-header--actions">
        <h1>Enablement impact</h1>
        <Button as={Link} to="/onepager" kind="tertiary" size="md" renderIcon={Document}>
          Executive one-pager
        </Button>
      </div>

      <div className="kpi-row">
        <KpiTile
          label="Deals driven by enablement"
          value={`${summary.influencedCount} of ${summary.totalDeals}`}
          detail={
            summary.totalDeals
              ? `${Math.round((summary.influencedCount / summary.totalDeals) * 100)}% of all tracked deals`
              : 'No deals tracked yet'
          }
        />
        <KpiTile label="Influenced revenue (closed won)" value={fmtUSDCompact(summary.wonRevenue)} />
        <KpiTile label="Influenced open pipeline" value={fmtUSDCompact(summary.pipelineRevenue)} />
        <KpiTile
          label="Sessions delivered"
          value={summary.sessionCount}
          detail={`${summary.attendeeCount} attendees enabled`}
        />
        <KpiTile
          label="Influenced value per team hour"
          value={summary.valuePerHour != null ? fmtUSDCompact(summary.valuePerHour) : '—'}
          detail={
            summary.valuePerHour != null
              ? `${summary.totalHours} enablement hours invested`
              : 'Add hours to sessions to compute ROI'
          }
        />
      </div>

      {/* full-width sections, ordered by how the impact story is argued:
          proof → mechanism → momentum → the ask → the receipts */}
      <div className="card-stack">
        <div className="chart-card">
          <h4 className="section-title">Deal performance: influenced vs. not influenced</h4>
          {insights.caveat && <p className="impact-note" style={{ marginTop: 0 }}>{insights.caveat}</p>}
          <ComparisonPanel stats={comparison} />
        </div>

        {influenced.length > 0 && (
          <div className="chart-card">
            <h4 className="section-title">Session-to-deal timeline</h4>
            <InfluenceTimeline deals={deals} enablements={enablements} />
          </div>
        )}

        {monthly.length > 0 && (
          <div className="chart-card">
            <SimpleBarChart
              data={monthly.map((m) => ({ group: 'Influenced pipeline', key: m.label, value: m.value }))}
              options={{
                title: 'Influenced pipeline opened by month',
                axes: {
                  bottom: { mapsTo: 'key', scaleType: 'labels' },
                  left: { mapsTo: 'value', ticks: { formatter: fmtUSDCompact } },
                },
                color: { scale: { 'Influenced pipeline': theme === 'g100' ? '#4589ff' : '#0f62fe' } },
                legend: { enabled: false },
                toolbar: { enabled: false },
                tooltip: { valueFormatter: (v) => (typeof v === 'number' ? fmtUSD(v) : v) },
                height: '280px',
                theme,
              }}
            />
          </div>
        )}

        <div className="chart-card">
          <h4 className="section-title">Customer demand vs. enablement coverage</h4>
          <CoveragePanel rows={coverage} />
        </div>
      </div>

      {influenced.length ? (
        <div className="table-card">
          <h4 className="section-title section-title--table">Impact by use case</h4>
          <Table size="md" aria-label="Impact by use case">
            <TableHead>
              <TableRow>
                <TableHeader>Use case</TableHeader>
                <TableHeader>Influenced deals</TableHeader>
                <TableHeader>Revenue won</TableHeader>
                <TableHeader>Open pipeline</TableHeader>
                <TableHeader>Sessions delivered</TableHeader>
                <TableHeader>Team hours</TableHeader>
                <TableHeader>Avg days, session to deal</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rollup.map((r) => (
                <TableRow key={r.useCase}>
                  <TableCell><UseCaseChip id={r.useCase} /></TableCell>
                  <TableCell>{r.count}</TableCell>
                  <TableCell>{r.won ? fmtUSD(r.won) : '—'}</TableCell>
                  <TableCell>{r.open ? fmtUSD(r.open) : '—'}</TableCell>
                  <TableCell>{r.sessions}</TableCell>
                  <TableCell>{r.hours}</TableCell>
                  <TableCell>{r.avgLag}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No influenced deals yet</h3>
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
