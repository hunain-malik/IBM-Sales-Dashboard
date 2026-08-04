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
