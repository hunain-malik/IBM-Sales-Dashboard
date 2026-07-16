import { useMemo, useRef, useState } from 'react'
import { USE_CASES, getUseCase, getUseCaseColor, fmtUSD, fmtUSDCompact, fmtDate } from '../data/constants.js'
import { attributeDeals } from '../data/attribution.js'
import { useStore } from '../data/store.jsx'

// The influence timeline: one lane per use case, real dates on the x-axis.
// Sessions are diamonds on the lower line; deals are dots above, linked back
// to the first session that preceded them. A deal left of every diamond in
// its lane is visibly NOT counted — the attribution rule, drawn honestly.
// All numbers are actual deal values; nothing is split or allocated.

const W = 1160
const LANE_H = 130
const PAD_L = 16
const PAD_R = 16
const AXIS_H = 36
const DAY_MS = 24 * 60 * 60 * 1000

const toDate = (iso) => new Date(`${iso}T00:00:00`)

export default function InfluenceTimeline({ deals, enablements }) {
  const { theme } = useStore()
  const ink = { primary: 'var(--cds-text-primary)', secondary: 'var(--cds-text-secondary)', helper: 'var(--cds-text-helper)' }
  const grid = 'var(--cds-border-subtle-01)'
  const gray = '#8d8d8d'

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

  const { lanes, x, months, todayX, height } = useMemo(() => {
    const attributed = attributeDeals(deals, enablements)
    const lanes = USE_CASES.map((u) => ({
      u,
      sessions: enablements.filter((e) => e.useCase === u.id).sort((a, b) => a.date.localeCompare(b.date)),
      deals: attributed.filter((d) => d.useCase === u.id).sort((a, b) => a.date.localeCompare(b.date)),
    })).filter((l) => l.sessions.length || l.deals.length)

    const allDates = [
      ...enablements.map((e) => toDate(e.date)),
      ...deals.map((d) => toDate(d.date)),
      new Date(),
    ]
    const min = new Date(Math.min(...allDates) - 12 * DAY_MS)
    const max = new Date(Math.max(...allDates) + 12 * DAY_MS)
    const span = max - min || 1
    const x = (iso) => PAD_L + ((toDate(iso) - min) / span) * (W - PAD_L - PAD_R)

    const months = []
    const m = new Date(min.getFullYear(), min.getMonth() + 1, 1)
    while (m <= max) {
      months.push({
        px: PAD_L + ((m - min) / span) * (W - PAD_L - PAD_R),
        label: m.toLocaleDateString('en-US', { month: 'short', year: m.getMonth() === 0 ? 'numeric' : undefined }),
      })
      m.setMonth(m.getMonth() + 1)
    }

    const today = new Date()
    const todayX = PAD_L + ((today - min) / span) * (W - PAD_L - PAD_R)

    return { lanes, x, months, todayX, height: lanes.length * LANE_H + AXIS_H }
  }, [deals, enablements])

  if (!lanes.length) return null

  const clampX = (px) => Math.max(52, Math.min(W - 52, px))

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
      <div className="cmp__legend" style={{ marginBottom: '0.5rem' }}>
        <span className="uc-chip">
          <svg width="12" height="12" aria-hidden="true"><rect x="6" y="0" width="8" height="8" transform="rotate(45 6 1)" fill="currentColor" opacity="0.75" /></svg>
          Enablement session
        </span>
        <span className="uc-chip">
          <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.75" /></svg>
          Influenced deal (opened after a session)
        </span>
        <span className="uc-chip">
          <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="none" stroke={gray} strokeWidth="1.5" /></svg>
          Deal with no prior enablement — not counted
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${height}`}
        style={{ width: '100%', minWidth: '56rem', display: 'block' }}
        role="img"
        aria-label="Timeline of enablement sessions and the customer deals that followed them, per use case"
      >
        {/* month gridlines */}
        {months.map((mo) => (
          <g key={mo.px}>
            <line x1={mo.px} y1={0} x2={mo.px} y2={height - AXIS_H + 8} stroke={grid} strokeWidth="1" />
            <text x={mo.px + 4} y={height - AXIS_H + 22} fontSize="11" style={{ fill: ink.helper }}>{mo.label}</text>
          </g>
        ))}

        {/* today marker */}
        <line x1={todayX} y1={14} x2={todayX} y2={height - AXIS_H + 8} strokeWidth="1.5" strokeDasharray="4 4" style={{ stroke: 'var(--cds-link-primary)' }} />
        <text x={todayX} y={10} fontSize="11" fontWeight="600" textAnchor="middle" style={{ fill: 'var(--cds-link-primary)' }}>Today</text>

        {lanes.map((lane, i) => {
          const top = i * LANE_H
          const dealY = top + 64 // labels sit at dealY-22, clear of the lane header band
          const sessionY = top + 106
          const color = getUseCaseColor(lane.u.id, theme)

          return (
            <g key={lane.u.id}>
              {/* lane header */}
              <rect x={PAD_L} y={top + 12} width="10" height="10" rx="2" fill={color} />
              <text x={PAD_L + 16} y={top + 21} fontSize="12" fontWeight="600" style={{ fill: ink.primary }}>
                {lane.u.label}
              </text>

              {/* session baseline */}
              <line x1={PAD_L} y1={sessionY} x2={W - PAD_R} y2={sessionY} stroke={grid} strokeWidth="1" />

              {/* influence curves: deal ← its first preceding session */}
              {lane.deals.filter((d) => d.influenced).map((d) => {
                const x1 = x(d.matched[0].date)
                const x2 = x(d.date)
                const my = (sessionY + dealY) / 2
                return (
                  <path
                    key={`c-${d.id}`}
                    d={`M ${x1} ${sessionY - 5} C ${x1} ${my}, ${x2} ${my}, ${x2} ${dealY + 7}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.45"
                  />
                )
              })}

              {/* sessions */}
              {lane.sessions.map((s) => {
                const lines = [
                  s.title,
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

              {/* deals */}
              {lane.deals.map((d) => {
                const px = x(d.date)
                const lx = clampX(px)
                const closed = d.stage.startsWith('Closed')
                const stageNote = closed ? (d.stage === 'Closed Won' ? ' · won' : ' · lost') : ''
                const lines = [
                  d.customer,
                  `${fmtUSD(d.value)} · ${d.stage}`,
                  `Opened ${fmtDate(d.date)}`,
                  d.influenced
                    ? `Influenced — first session: ${d.matched[0].title} (${fmtDate(d.matched[0].date)})${d.matched.length > 1 ? ` +${d.matched.length - 1} more` : ''}`
                    : `Not counted — no ${getUseCase(d.useCase).label} session before this deal`,
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
                    <text x={lx} y={dealY - 22} fontSize="11" fontWeight="600" textAnchor="middle" style={{ fill: d.influenced ? ink.primary : ink.helper }}>
                      {d.customer}
                    </text>
                    <text x={lx} y={dealY - 10} fontSize="10" textAnchor="middle" style={{ fill: ink.secondary }}>
                      {fmtUSDCompact(d.value)}{stageNote}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
