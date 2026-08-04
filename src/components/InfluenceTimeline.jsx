import { useMemo, useRef, useState } from 'react'
import { IconButton } from '@carbon/react'
import { ChevronLeft, ChevronRight } from '@carbon/icons-react'
import { PRODUCTS, getProductColor, getUseCaseLabel, fmtUSD, fmtUSDCompact, fmtDate } from '../data/constants.js'
import { attributeDeals } from '../data/attribution.js'
import { quarterStart, nextQuarter, prevQuarter, quarterLabel } from '../data/quarters.js'
import { useStore } from '../data/store.jsx'

// One fiscal quarter at a time (IBM's FY matches the calendar year): sessions
// and deals from the viewed quarter only, axis from quarter start to quarter
// end. Influence carried over from an earlier quarter — session then, deal
// now — enters the lane as a dashed curve from the left edge with a "from Qn"
// marker. Chevrons page through past quarters.

const W = 1160
const LANE_H = 130
const PAD_L = 16 // lane headers
const PLOT_L = 64 // plot area starts inset so markers/labels clear the lane headers
const PAD_R = 24
const AXIS_H = 36

const toDate = (iso) => new Date(`${iso}T00:00:00`)

export default function InfluenceTimeline({ deals, enablements }) {
  const { theme } = useStore()
  const ink = { primary: 'var(--cds-text-primary)', secondary: 'var(--cds-text-secondary)', helper: 'var(--cds-text-helper)' }
  const grid = 'var(--cds-border-subtle-01)'
  const gray = '#8d8d8d'

  const [qCursor, setQCursor] = useState(() => quarterStart(new Date()))

  // custom hover tooltip — native SVG <title> is too slow and unreliable
  const wrapRef = useRef(null)
  const [tip, setTip] = useState(null)
  const showTip = (e, lines) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const r = wrap.getBoundingClientRect()
    setTip({
      x: Math.min(e.clientX - r.left + wrap.scrollLeft, wrap.scrollWidth - 20),
      y: e.clientY - r.top,
      lines,
    })
  }
  const hideTip = () => setTip(null)

  const view = useMemo(() => {
    const attributed = attributeDeals(deals, enablements)
    const qEnd = nextQuarter(qCursor)
    const inQuarter = (iso) => {
      const t = toDate(iso)
      return t >= qCursor && t < qEnd
    }

    // one lane per PRODUCT with activity; records logged before the product
    // dimension existed group into a gray "No product" lane
    const laneDefs = [...PRODUCTS, { id: null, label: 'No product' }]
    const lanes = laneDefs.map((u) => {
      const inLane = (r) => (u.id ? r.product === u.id : !r.product)
      const sessions = enablements
        .filter((e) => inLane(e) && inQuarter(e.date))
        .sort((a, b) => a.date.localeCompare(b.date))
      const laneDeals = attributed
        .filter((d) => inLane(d) && inQuarter(d.date))
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => {
          // a manually tied deal always links to its tied session; automatic
          // deals link to a session inside the viewed quarter when there is
          // one — otherwise the touchpoint is carried from an earlier quarter
          const linked = d.sourceSessionId ? d.matched.find((s) => s.id === d.sourceSessionId) : null
          const link = linked
            ? (inQuarter(linked.date) ? linked : null)
            : (d.matched.find((s) => inQuarter(s.date)) ?? null)
          return { ...d, link, carried: d.influenced && !link ? (linked ?? d.matched[0]) : null }
        })
      const carriedSessions = [...new Map(laneDeals.filter((d) => d.carried).map((d) => [d.carried.id, d.carried])).values()]
      const carriedQuarters = [...new Set(carriedSessions.map((s) => quarterLabel(quarterStart(toDate(s.date)))))]
      return { u, sessions, deals: laneDeals, carriedSessions, carriedQuarters }
    }).filter((l) => l.sessions.length || l.deals.length)

    const span = qEnd - qCursor
    const toPx = (date) => PLOT_L + ((date - qCursor) / span) * (W - PLOT_L - PAD_R)
    const x = (iso) => toPx(toDate(iso))

    const months = []
    let m = new Date(qCursor)
    while (m < qEnd) {
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1)
      months.push({
        x1: toPx(m),
        x2: toPx(end),
        label: m.toLocaleDateString('en-US', {
          month: 'short',
          year: months.length === 0 ? 'numeric' : undefined,
        }),
      })
      m = end
    }

    const today = new Date()
    const currentQ = quarterStart(today)
    const allDates = [...deals.map((d) => toDate(d.date)), ...enablements.map((e) => toDate(e.date))]
    const earliestQ = allDates.length ? quarterStart(new Date(Math.min(...allDates))) : currentQ

    return {
      lanes,
      months,
      x,
      todayX: currentQ.getTime() === qCursor.getTime() ? toPx(today) : null,
      canPrev: qCursor > earliestQ,
      canNext: qCursor < currentQ,
      anyCarried: lanes.some((l) => l.carriedSessions.length),
      height: lanes.length * LANE_H + AXIS_H,
    }
  }, [deals, enablements, qCursor])

  const { lanes, months, x, todayX, canPrev, canNext, anyCarried, height } = view
  const clampX = (px) => Math.max(PLOT_L + 12, Math.min(W - 60, px))
  const shortFrom = (labels) => {
    if (labels.length !== 1) return 'from earlier'
    const [q, year] = labels[0].split(' ')
    return Number(year) === qCursor.getFullYear() ? `from ${q}` : `from ${labels[0]}`
  }

  return (
    <div ref={wrapRef} style={{ overflowX: 'auto', position: 'relative' }}>
      {tip && (
        <div
          className="tl-tip"
          style={{
            left: tip.x,
            top: tip.y,
            // flip below the cursor near the container top (overflow clips upward),
            // and to the left of the cursor near the right edge
            transform: `translate(${tip.x > W - 300 ? 'calc(-100% - 12px)' : '12px'}, ${
              tip.y < 140 ? '16px' : 'calc(-100% - 10px)'
            })`,
          }}
        >
          <strong>{tip.lines[0]}</strong>
          {tip.lines.slice(1).map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}

      <div className="tl-head">
        <div className="cmp__legend" style={{ marginBottom: 0 }}>
          <span className="uc-chip">
            <svg width="12" height="12" aria-hidden="true"><rect x="6" y="0" width="8" height="8" transform="rotate(45 6 1)" fill="currentColor" opacity="0.75" /></svg>
            Enablement session
          </span>
          <span className="uc-chip">
            <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.75" /></svg>
            Outbound-touched deal (opened after a session)
          </span>
          <span className="uc-chip">
            <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="none" stroke={gray} strokeWidth="1.5" /></svg>
            Deal with no prior session — not counted
          </span>
          {anyCarried && (
            <span className="uc-chip">
              <svg width="20" height="12" aria-hidden="true"><path d="M1 6 H19" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.75" /></svg>
              Touchpoint carried from an earlier quarter
            </span>
          )}
        </div>
        <div className="tl-head__nav">
          <IconButton kind="ghost" size="sm" label="Previous quarter" disabled={!canPrev} onClick={() => setQCursor((q) => prevQuarter(q))}>
            <ChevronLeft />
          </IconButton>
          <span className="tl-head__label">{quarterLabel(qCursor)}</span>
          <IconButton kind="ghost" size="sm" label="Next quarter" disabled={!canNext} onClick={() => setQCursor((q) => nextQuarter(q))}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>

      {lanes.length === 0 ? (
        <p className="tl-empty">No sessions or deals in {quarterLabel(qCursor)}.</p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${height}`}
          style={{ width: '100%', minWidth: '56rem', display: 'block' }}
          role="img"
          aria-label={`${quarterLabel(qCursor)} timeline of enablement sessions and the customer deals that followed them, per use case`}
        >
          {/* month gridlines within the quarter, labels centered */}
          {months.map((mo, i) => (
            <g key={mo.x1}>
              <line x1={mo.x1} y1={0} x2={mo.x1} y2={height - AXIS_H + 8} stroke={grid} strokeWidth="1" />
              {i === months.length - 1 && (
                <line x1={mo.x2} y1={0} x2={mo.x2} y2={height - AXIS_H + 8} stroke={grid} strokeWidth="1" />
              )}
              <text
                x={(mo.x1 + mo.x2) / 2}
                y={height - AXIS_H + 24}
                fontSize="11"
                textAnchor="middle"
                style={{ fill: ink.helper }}
              >
                {mo.label}
              </text>
            </g>
          ))}

          {/* today marker (only when viewing the current quarter) */}
          {todayX != null && (
            <>
              <line x1={todayX} y1={14} x2={todayX} y2={height - AXIS_H + 8} strokeWidth="1.5" strokeDasharray="4 4" style={{ stroke: 'var(--cds-link-primary)' }} />
              <text x={todayX} y={10} fontSize="11" fontWeight="600" textAnchor="middle" style={{ fill: 'var(--cds-link-primary)' }}>Today</text>
            </>
          )}

          {lanes.map((lane, i) => {
            const top = i * LANE_H
            const dealY = top + 64 // labels sit at dealY-22, clear of the lane header band
            const sessionY = top + 106
            const color = getProductColor(lane.u.id, theme)

            return (
              <g key={lane.u.id ?? 'no-product'}>
                {/* lane header */}
                <rect x={PAD_L} y={top + 12} width="10" height="10" rx="2" fill={color} />
                <text x={PAD_L + 16} y={top + 21} fontSize="12" fontWeight="600" style={{ fill: ink.primary }}>
                  {lane.u.label}
                </text>

                {/* session baseline */}
                <line x1={PLOT_L} y1={sessionY} x2={W - PAD_R} y2={sessionY} stroke={grid} strokeWidth="1" />

                {/* influence curves: solid from an in-quarter session, dashed from the
                    left edge when the session happened in an earlier quarter */}
                {lane.deals.filter((d) => d.influenced).map((d) => {
                  const x1 = d.link ? x(d.link.date) : PLOT_L
                  const x2 = x(d.date)
                  const my = (sessionY + dealY) / 2
                  return (
                    <path
                      key={`c-${d.id}`}
                      d={`M ${x1} ${sessionY - 5} C ${x1} ${my}, ${x2} ${my}, ${x2} ${dealY + 7}`}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeDasharray={d.link ? undefined : '5 4'}
                      opacity="0.45"
                    />
                  )
                })}

                {/* carried-influence entry marker at the quarter boundary */}
                {lane.carriedSessions.length > 0 && (() => {
                  const lines = [
                    `Touchpoint carried from ${lane.carriedQuarters.join(', ')}`,
                    ...lane.carriedSessions.map((s) => `${s.title} — ${fmtDate(s.date)}`),
                  ]
                  return (
                    <g
                      data-hover="carried"
                      onMouseEnter={(e) => showTip(e, lines)}
                      onMouseMove={(e) => showTip(e, lines)}
                      onMouseLeave={hideTip}
                    >
                      <circle cx={PLOT_L - 5} cy={sessionY} r="14" fill="transparent" />
                      <path d={`M ${PLOT_L - 12} ${sessionY} L ${PLOT_L - 2} ${sessionY - 5.5} L ${PLOT_L - 2} ${sessionY + 5.5} Z`} fill={color} />
                      <text x={PLOT_L - 14} y={sessionY + 4} fontSize="10" textAnchor="end" style={{ fill: ink.helper }}>
                        {shortFrom(lane.carriedQuarters)}
                      </text>
                    </g>
                  )
                })()}

                {/* sessions */}
                {lane.sessions.map((s) => {
                  const lines = [
                    s.title,
                    getUseCaseLabel(s),
                    `${fmtDate(s.date)}${s.presenter ? ` · ${s.presenter}` : ''}`,
                    `${s.attendees || 0} attendees · ${Number(s.hours) || 0}h invested`,
                  ]
                  return (
                    <g
                      key={s.id}
                      data-hover="session"
                      transform={`translate(${x(s.date)} ${sessionY})`}
                      onMouseEnter={(e) => showTip(e, lines)}
                      onMouseMove={(e) => showTip(e, lines)}
                      onMouseLeave={hideTip}
                    >
                      {/* oversized invisible hit target */}
                      <circle r="16" fill="transparent" />
                      <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill={color} />
                    </g>
                  )
                })}

                {/* deals — labels drop below the dot when they'd collide above */}
                {(() => {
                  const tracks = { above: -Infinity, below: -Infinity }
                  return lane.deals.map((d) => {
                    const lx0 = clampX(x(d.date))
                    let below = false
                    if (lx0 - tracks.above < 116) {
                      if (lx0 - tracks.below >= 116) below = true
                    }
                    if (below) tracks.below = lx0
                    else tracks.above = lx0
                    return { d, below }
                  })
                })().map(({ d, below }) => {
                  const px = x(d.date)
                  const lx = clampX(px)
                  const nameY = below ? dealY + 22 : dealY - 22
                  const valueY = below ? dealY + 34 : dealY - 10
                  const closed = d.stage.startsWith('Closed')
                  const stageNote = closed ? (d.stage === 'Closed Won' ? ' · won' : ' · lost') : ''
                  const lines = [
                    d.customer,
                    `${fmtUSD(d.value)} · ${d.stage}`,
                    `${getUseCaseLabel(d)} · opened ${fmtDate(d.date)}`,
                    d.influenced
                      ? d.link
                        ? `Outbound touched — session: ${d.link.title} (${fmtDate(d.link.date)})`
                        : `Outbound touched — carried from ${quarterLabel(quarterStart(toDate(d.carried.date)))}: ${d.carried.title} (${fmtDate(d.carried.date)})`
                      : 'Not counted — no matching session before this deal',
                  ]
                  return (
                    <g
                      key={d.id}
                      data-hover="deal"
                      onMouseEnter={(e) => showTip(e, lines)}
                      onMouseMove={(e) => showTip(e, lines)}
                      onMouseLeave={hideTip}
                    >
                      {/* oversized invisible hit target */}
                      <circle cx={px} cy={dealY} r="18" fill="transparent" />
                      {d.influenced ? (
                        <circle cx={px} cy={dealY} r="7" fill={color} />
                      ) : (
                        <circle cx={px} cy={dealY} r="6" fill="var(--cds-layer-01)" stroke={gray} strokeWidth="2" />
                      )}
                      <text x={lx} y={nameY} fontSize="11" fontWeight="600" textAnchor="middle" style={{ fill: d.influenced ? ink.primary : ink.helper }}>
                        {d.customer}
                      </text>
                      <text x={lx} y={valueY} fontSize="10" textAnchor="middle" style={{ fill: ink.secondary }}>
                        {fmtUSDCompact(d.value)}{stageNote}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
