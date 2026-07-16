import { OPEN_STAGES } from './constants.js'

// A deal is "enablement-influenced" when at least one enablement session on
// the same use case took place on or before the deal date.
export function attributeDeals(deals, enablements) {
  return deals.map((deal) => {
    const matched = enablements
      .filter((e) => e.useCase === deal.useCase && e.date <= deal.date)
      .sort((a, b) => a.date.localeCompare(b.date))
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
  const totalHours = enablements.reduce((s, e) => s + (Number(e.hours) || 0), 0)
  return {
    attributed,
    influenced,
    influencedCount: influenced.length,
    totalDeals: deals.length,
    wonRevenue,
    pipelineRevenue,
    sessionCount: enablements.length,
    attendeeCount: enablements.reduce((s, e) => s + (Number(e.attendees) || 0), 0),
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

// Where to invest next: per use case, the share of customer demand (deal
// value) vs. the share of enablement effort. A positive gap means customers
// want more of a use case than we currently enable on. Coverage share is
// hour-weighted when hours are recorded, session-weighted otherwise.
export function coverageGaps(deals, enablements, useCases) {
  const totalValue = deals.reduce((s, d) => s + d.value, 0)
  const totalHours = enablements.reduce((s, e) => s + (Number(e.hours) || 0), 0)
  const byHours = totalHours > 0
  const totalSessions = enablements.length
  return useCases
    .map((u) => {
      const ucDeals = deals.filter((d) => d.useCase === u.id)
      const sessions = enablements.filter((e) => e.useCase === u.id)
      const demandValue = ucDeals.reduce((s, d) => s + d.value, 0)
      const hours = sessions.reduce((s, e) => s + (Number(e.hours) || 0), 0)
      const demandShare = totalValue ? demandValue / totalValue : 0
      const coverageShare = byHours
        ? hours / totalHours
        : totalSessions
          ? sessions.length / totalSessions
          : 0
      return {
        useCase: u.id,
        label: u.label,
        demandValue,
        dealCount: ucDeals.length,
        sessionCount: sessions.length,
        hours,
        demandShare,
        coverageShare,
        gap: demandShare - coverageShare,
      }
    })
    .filter((r) => r.dealCount > 0 || r.sessionCount > 0)
    .sort((a, b) => b.gap - a.gap)
}

// Sankey/alluvial rows: session → use case → customer. Each influenced deal's
// value flows through its use case and is split evenly across the sessions
// that preceded it, so link widths stay balanced through the middle nodes.
export function alluvialGraph(deals, enablements, labelFor) {
  const attributed = attributeDeals(deals, enablements).filter((d) => d.influenced)
  const nodes = new Map()
  const links = []

  // `useCase` is kept off Carbon's `category` field on purpose — the chart
  // draws category headings above each column, which mislabels mixed columns.
  const addNode = (name, useCase) => {
    if (!nodes.has(name)) nodes.set(name, { name, useCase })
  }

  const sessionFlow = new Map() // session id → summed split value

  for (const deal of attributed) {
    const label = labelFor(deal.useCase)
    addNode(label, label)
    addNode(deal.customer, label)
    links.push({ source: label, target: deal.customer, value: deal.value })
    const split = deal.value / deal.matched.length
    for (const session of deal.matched) {
      sessionFlow.set(session.id, (sessionFlow.get(session.id) ?? 0) + split)
    }
  }

  for (const session of enablements) {
    const flow = sessionFlow.get(session.id)
    if (!flow) continue
    const label = labelFor(session.useCase)
    addNode(session.title, label)
    links.push({ source: session.title, target: label, value: Math.round(flow) })
  }

  return { nodes: [...nodes.values()], links }
}
