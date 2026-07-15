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
  return {
    attributed,
    influenced,
    influencedCount: influenced.length,
    totalDeals: deals.length,
    wonRevenue: wonInfluenced.reduce((s, d) => s + d.value, 0),
    pipelineRevenue: openInfluenced.reduce((s, d) => s + d.value, 0),
    sessionCount: enablements.length,
    attendeeCount: enablements.reduce((s, e) => s + (Number(e.attendees) || 0), 0),
  }
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
