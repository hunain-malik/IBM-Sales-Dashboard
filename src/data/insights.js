import { impactSummary, comparisonStats, coverageGaps } from './attribution.js'
import { USE_CASES, fmtUSDCompact, fmtPct } from './constants.js'

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
  const coverage = coverageGaps(deals, enablements, USE_CASES)
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
