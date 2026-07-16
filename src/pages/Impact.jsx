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
import { impactSummary, comparisonStats, coverageGaps } from '../data/attribution.js'
import { USE_CASES, fmtUSD, fmtUSDCompact, fmtDate, STAGE_TAG_TYPE } from '../data/constants.js'
import KpiTile from '../components/KpiTile.jsx'
import UseCaseChip from '../components/UseCaseChip.jsx'
import ComparisonPanel from '../components/ComparisonPanel.jsx'
import CoveragePanel from '../components/CoveragePanel.jsx'
import InfluenceTimeline from '../components/InfluenceTimeline.jsx'

const DAY_MS = 24 * 60 * 60 * 1000
const lagDays = (fromIso, toIso) =>
  Math.round((new Date(`${toIso}T00:00:00`) - new Date(`${fromIso}T00:00:00`)) / DAY_MS)

export default function Impact() {
  const { deals, enablements } = useStore()
  const summary = useMemo(() => impactSummary(deals, enablements), [deals, enablements])
  const comparison = useMemo(() => comparisonStats(deals, enablements), [deals, enablements])
  const coverage = useMemo(() => coverageGaps(deals, enablements, USE_CASES), [deals, enablements])

  const influenced = [...summary.influenced].sort((a, b) => b.value - a.value)

  return (
    <div>
      <div className="page-header page-header--actions">
        <div>
          <h1>Enablement impact summary</h1>
          <p>
            Executive view of the pipeline our enablement work created: sessions the team delivered,
            and the customer deals that opened after them on the same use case.
          </p>
        </div>
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
        <KpiTile
          label="Influenced revenue (closed won)"
          value={fmtUSDCompact(summary.wonRevenue)}
          detail="Closed-won value preceded by our sessions"
        />
        <KpiTile
          label="Influenced open pipeline"
          value={fmtUSDCompact(summary.pipelineRevenue)}
          detail="Still-open value preceded by our sessions"
        />
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

      <div className="chart-grid">
        <div className="chart-card">
          <h4 className="section-title">Do enablement-influenced deals perform better?</h4>
          <ComparisonPanel stats={comparison} />
          <p className="impact-note">
            Same tracking, split by whether an enablement preceded the deal. Small samples move these
            numbers — read them as direction, not decimals.
          </p>
        </div>
        <div className="chart-card">
          <h4 className="section-title">Where to invest next</h4>
          <CoveragePanel rows={coverage} />
          <p className="impact-note">
            Use cases where customer demand outruns our enablement coverage are the highest-leverage
            place to add sessions — and the concrete ask for more support.
          </p>
        </div>
      </div>

      {influenced.length ? (
        <>
          <div className="chart-card chart-card--full" style={{ marginBottom: '1.5rem' }}>
            <h4 className="section-title">From enablement session to customer deal</h4>
            <InfluenceTimeline deals={deals} enablements={enablements} />
            <p className="impact-note">
              Each lane is a use case on a real time axis: diamonds are the sessions we delivered,
              dots are customer deals at their actual value. A deal counts as influenced only when a
              matching session came first — deals left of every diamond in their lane are visibly
              excluded. Curves link each influenced deal to the first session that preceded it.
            </p>
          </div>

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
