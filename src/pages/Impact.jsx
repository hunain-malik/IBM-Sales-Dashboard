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
import { fmtUSD, fmtUSDCompact, fmtDate, STAGE_TAG_TYPE } from '../data/constants.js'
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
          <h1>GTM Pipeline View</h1>
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
          label="GTM-touched deals"
          value={`${summary.influencedCount} of ${summary.totalDeals}`}
          detail={
            summary.totalDeals
              ? `${Math.round((summary.influencedCount / summary.totalDeals) * 100)}% of all tracked deals`
              : 'No deals tracked yet'
          }
        />
        <KpiTile label="GTM-touched revenue (closed won)" value={fmtUSDCompact(summary.wonRevenue)} />
        <KpiTile label="GTM-touched open pipeline" value={fmtUSDCompact(summary.pipelineRevenue)} />
        <KpiTile
          label="Sessions delivered"
          value={summary.sessionCount}
          detail={`${summary.attendeeCount} attendees enabled`}
        />
        <KpiTile
          label="GTM-touched value per team hour"
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
          <h4 className="section-title">Deal performance: GTM-touched vs. untouched</h4>
          {insights.caveat && <p className="impact-note" style={{ marginTop: 0 }}>{insights.caveat}</p>}
          <ComparisonPanel stats={comparison} />
        </div>

        {influenced.length > 0 && (
          <div className="chart-card">
            <h4 className="section-title">GTM-touched pipeline opened by month</h4>
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
          <h4 className="section-title section-title--table">GTM-touched deals</h4>
          <Table size="md" aria-label="GTM-touched deals">
            <TableHead>
              <TableRow>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Revenue</TableHeader>
                <TableHeader>Use case</TableHeader>
                <TableHeader>Stage</TableHeader>
                <TableHeader>First matching session</TableHeader>
                <TableHeader>Open date</TableHeader>
                <TableHeader>Days from session to deal</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {influenced.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.customer}</TableCell>
                  <TableCell>{fmtUSD(d.value)}</TableCell>
                  <TableCell><UseCaseChip id={d.useCase} /></TableCell>
                  <TableCell>
                    <Tag type={STAGE_TAG_TYPE[d.stage] ?? 'gray'} size="sm">{d.stage}</Tag>
                  </TableCell>
                  <TableCell>
                    {d.matched[0].title}
                    <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                      delivered {fmtDate(d.matched[0].date)}
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
          <h3>No GTM-touched deals yet</h3>
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
