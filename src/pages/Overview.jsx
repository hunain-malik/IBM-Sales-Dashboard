import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@carbon/react'
import { SimpleBarChart, AreaChart } from '@carbon/charts-react'
import { useStore } from '../data/store.jsx'
import { impactSummary } from '../data/attribution.js'
import { USE_CASES, getUseCaseColorScale, fmtUSD, fmtUSDCompact } from '../data/constants.js'
import KpiTile from '../components/KpiTile.jsx'

export default function Overview() {
  const { enablements, deals, theme } = useStore()
  const summary = useMemo(() => impactSummary(deals, enablements), [deals, enablements])

  const revenueByUseCase = useMemo(() => {
    const totals = new Map()
    for (const d of summary.influenced) {
      totals.set(d.useCase, (totals.get(d.useCase) ?? 0) + d.value)
    }
    return USE_CASES.filter((u) => totals.has(u.id)).map((u) => ({
      group: u.label,
      value: totals.get(u.id),
    }))
  }, [summary])

  const cumulativeRevenue = useMemo(() => {
    const sorted = [...summary.influenced].sort((a, b) => a.date.localeCompare(b.date))
    let running = 0
    return sorted.map((d) => {
      running += d.value
      return { group: 'Influenced revenue', date: new Date(`${d.date}T00:00:00`), value: running }
    })
  }, [summary])

  const hasData = enablements.length > 0 || deals.length > 0

  return (
    <div>
      <div className="page-header page-header--actions">
        <div>
          <h1>Enablement impact overview</h1>
          <p>
            What our enablement sessions put into the sales pipeline: every deal below is a customer
            interested in a use case we enabled on, opened after that enablement ran.
          </p>
        </div>
        <Button as={Link} to="/impact" kind="tertiary" size="md">
          View impact summary
        </Button>
      </div>

      <div className="kpi-row">
        <KpiTile
          label="Influenced revenue (closed won)"
          value={fmtUSDCompact(summary.wonRevenue)}
          detail="Won deals preceded by a matching enablement"
        />
        <KpiTile
          label="Influenced open pipeline"
          value={fmtUSDCompact(summary.pipelineRevenue)}
          detail="Open deals preceded by a matching enablement"
        />
        <KpiTile
          label="Deals influenced"
          value={`${summary.influencedCount} of ${summary.totalDeals}`}
          detail={
            summary.totalDeals
              ? `${Math.round((summary.influencedCount / summary.totalDeals) * 100)}% of tracked deals`
              : 'No deals tracked yet'
          }
        />
        <KpiTile
          label="Enablement sessions delivered"
          value={summary.sessionCount}
          detail={`${summary.attendeeCount} attendees enabled`}
        />
      </div>

      {hasData ? (
        <div className="chart-grid">
          <div className="chart-card">
            <SimpleBarChart
              data={revenueByUseCase}
              options={{
                title: 'Influenced revenue by use case',
                axes: {
                  left: { mapsTo: 'group', scaleType: 'labels' },
                  bottom: { mapsTo: 'value', ticks: { formatter: fmtUSDCompact } },
                },
                color: { scale: getUseCaseColorScale(theme) },
                legend: { enabled: false },
                toolbar: { enabled: false },
                tooltip: { valueFormatter: (v, label) => (label === 'y-value' || typeof v === 'number' ? fmtUSD(v) : v) },
                height: '320px',
                theme,
              }}
            />
          </div>
          <div className="chart-card">
            <AreaChart
              data={cumulativeRevenue}
              options={{
                title: 'Cumulative influenced revenue',
                axes: {
                  bottom: { mapsTo: 'date', scaleType: 'time' },
                  left: { mapsTo: 'value', ticks: { formatter: fmtUSDCompact } },
                },
                color: {
                  scale: { 'Influenced revenue': theme === 'g100' ? '#4589ff' : '#0f62fe' },
                  gradient: { enabled: true },
                },
                curve: 'curveMonotoneX',
                legend: { enabled: false },
                toolbar: { enabled: false },
                tooltip: { valueFormatter: (v) => (typeof v === 'number' ? fmtUSD(v) : v) },
                height: '320px',
                theme,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No data yet</h3>
          <p>Add enablement sessions and customer deals to see the team&apos;s impact.</p>
          <Button as={Link} to="/enablements">Add an enablement</Button>
        </div>
      )}
    </div>
  )
}
