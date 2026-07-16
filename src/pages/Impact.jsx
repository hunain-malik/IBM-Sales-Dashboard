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
import { SimpleBarChart } from '@carbon/charts-react'
import { useStore } from '../data/store.jsx'
import { monthlyInfluenced } from '../data/attribution.js'
import { buildInsights } from '../data/insights.js'
import { fmtUSD, fmtUSDCompact, fmtDate, STAGE_TAG_TYPE } from '../data/constants.js'
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

  const influenced = [...summary.influenced].sort((a, b) => b.value - a.value)

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
          {/* the answer is generated from the data — it changes when the data does */}
          <p className="cmp__verdict">{insights.headline}</p>
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
        <>
          <div className="table-card">
            <Table size="md" aria-label="Influenced deals">
              <TableHead>
                <TableRow>
                  <TableHeader>Customer</TableHeader>
                  <TableHeader>Use case</TableHeader>
                  <TableHeader>Revenue</TableHeader>
                  <TableHeader>Stage</TableHeader>
                  <TableHeader>First matching session</TableHeader>
                  <TableHeader>Sessions before deal</TableHeader>
                  <TableHeader>Days from session to deal</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {influenced.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.customer}</TableCell>
                    <TableCell><UseCaseChip id={d.useCase} /></TableCell>
                    <TableCell>{fmtUSD(d.value)}</TableCell>
                    <TableCell>
                      <Tag type={STAGE_TAG_TYPE[d.stage] ?? 'gray'} size="sm">{d.stage}</Tag>
                    </TableCell>
                    <TableCell>
                      {d.matched[0].title}
                      <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                        {fmtDate(d.matched[0].date)}
                      </div>
                    </TableCell>
                    <TableCell>{d.matched.length}</TableCell>
                    <TableCell>{lagDays(d.matched[0].date, d.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
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
