import { useMemo, useState } from 'react'
import { IconButton } from '@carbon/react'
import { ChevronLeft, ChevronRight } from '@carbon/icons-react'
import { attributeDeals } from '../data/attribution.js'
import { quarterStart, nextQuarter, prevQuarter, quarterLabel } from '../data/quarters.js'
import { fmtUSDCompact } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

// Influenced pipeline opened per month, one fiscal quarter at a time —
// same visual language and quarter navigation as the session-to-deal
// timeline: month bands, direct-labeled bars, no separate axis chrome.

const W = 1160
const H = 230
const PAD_L = 24
const PAD_R = 24
const AXIS_H = 32
const TOP = 30
const BAR_W = 96

const toDate = (iso) => new Date(`${iso}T00:00:00`)

export default function QuarterlyPipeline({ deals, enablements }) {
  const { theme } = useStore()
  const accent = theme === 'g100' ? '#4589ff' : '#0f62fe'
  const ink = { secondary: 'var(--cds-text-secondary)', helper: 'var(--cds-text-helper)' }
  const grid = 'var(--cds-border-subtle-01)'

  const [qCursor, setQCursor] = useState(() => quarterStart(new Date()))

  const { months, maxV, canPrev, canNext } = useMemo(() => {
    const influenced = attributeDeals(deals, enablements).filter((d) => d.influenced)
    const qEnd = nextQuarter(qCursor)

    const today = new Date()
    const months = []
    let m = new Date(qCursor)
    while (m < qEnd) {
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1)
      const total = influenced
        .filter((d) => {
          const t = toDate(d.date)
          return t >= m && t < end
        })
        .reduce((s, d) => s + d.value, 0)
      months.push({
        label: m.toLocaleDateString('en-US', { month: 'short', year: months.length === 0 ? 'numeric' : undefined }),
        total,
        // a month that hasn't started yet has no number to report
        status: m > today ? 'future' : end > today ? 'current' : 'past',
      })
      m = end
    }

    const currentQ = quarterStart(today)
    const allDates = [...deals.map((d) => toDate(d.date)), ...enablements.map((e) => toDate(e.date))]
    const earliestQ = allDates.length ? quarterStart(new Date(Math.min(...allDates))) : currentQ

    return {
      months,
      maxV: Math.max(...months.map((mo) => mo.total), 1),
      canPrev: qCursor > earliestQ,
      canNext: qCursor < currentQ,
    }
  }, [deals, enablements, qCursor])

  const bandW = (W - PAD_L - PAD_R) / months.length
  const baseY = H - AXIS_H
  const scaleH = baseY - TOP

  return (
    <div style={{ overflowX: 'auto' }}>
      <div className="tl-head" style={{ justifyContent: 'flex-end' }}>
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

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', minWidth: '48rem', display: 'block' }}
        role="img"
        aria-label={`Outbound-touched pipeline opened per month in ${quarterLabel(qCursor)}`}
      >
        {months.map((mo, i) => {
          const x1 = PAD_L + i * bandW
          const cx = x1 + bandW / 2
          const h = (mo.total / maxV) * scaleH
          return (
            <g key={mo.label}>
              <line x1={x1} y1={TOP - 16} x2={x1} y2={baseY} stroke={grid} strokeWidth="1" />
              {i === months.length - 1 && (
                <line x1={x1 + bandW} y1={TOP - 16} x2={x1 + bandW} y2={baseY} stroke={grid} strokeWidth="1" />
              )}
              {mo.status === 'current' && (
                <text x={cx} y={10} fontSize="11" fontWeight="600" textAnchor="middle" style={{ fill: 'var(--cds-link-primary)' }}>
                  Current month
                </text>
              )}
              {mo.total > 0 && (
                <rect x={cx - BAR_W / 2} y={baseY - h} width={BAR_W} height={h} rx="2" fill={accent} />
              )}
              <text
                x={cx}
                y={baseY - h - 8}
                fontSize="12"
                fontWeight={mo.status === 'future' ? '400' : '600'}
                fontStyle={mo.status === 'future' ? 'italic' : undefined}
                textAnchor="middle"
                style={{ fill: mo.total > 0 ? ink.secondary : ink.helper }}
              >
                {mo.status === 'future' ? 'Coming soon' : mo.total > 0 ? fmtUSDCompact(mo.total) : '$0'}
              </text>
              <text x={cx} y={baseY + 22} fontSize="11" textAnchor="middle" style={{ fill: mo.status === 'current' ? ink.secondary : ink.helper }} fontWeight={mo.status === 'current' ? '600' : '400'}>
                {mo.label}
              </text>
            </g>
          )
        })}
        {/* baseline */}
        <line x1={PAD_L} y1={baseY} x2={W - PAD_R} y2={baseY} stroke={grid} strokeWidth="1" />
      </svg>
    </div>
  )
}
