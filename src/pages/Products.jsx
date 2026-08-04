import { useMemo, useState } from 'react'
import { IconButton } from '@carbon/react'
import { ChevronLeft, ChevronRight } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { attributeDeals } from '../data/attribution.js'
import { quarterStart, nextQuarter, prevQuarter, quarterLabel } from '../data/quarters.js'
import {
  PRODUCTS,
  getProductColor,
  getUseCaseLabel,
  fmtUSDCompact,
  todayIso,
  OPEN_STAGES,
} from '../data/constants.js'

const toDate = (iso) => new Date(`${iso}T00:00:00`)

// The per-product view leadership asked for: one fiscal quarter at a time,
// what each product did — sessions delivered, deals opened, outbound-touched,
// closed won — with a use-case breakdown underneath. Same quarter navigation
// as the charts, so it lines up with the executive one-pager's cadence.
export default function Products() {
  const { deals, enablements } = useStore()
  const [qCursor, setQCursor] = useState(() => quarterStart(new Date()))

  const view = useMemo(() => {
    const attributed = attributeDeals(deals, enablements)
    const qEnd = nextQuarter(qCursor)
    const inQuarter = (iso) => {
      const t = toDate(iso)
      return t >= qCursor && t < qEnd
    }
    const today = todayIso()

    const cards = PRODUCTS.map((p) => {
      const sessions = enablements.filter((e) => e.product === p.id && inQuarter(e.date) && e.date <= today)
      const scheduled = enablements.filter((e) => e.product === p.id && inQuarter(e.date) && e.date > today)
      const opened = attributed.filter((d) => d.product === p.id && inQuarter(d.date))
      const touched = opened.filter((d) => d.influenced)
      const won = attributed.filter((d) => d.product === p.id && d.stage === 'Closed Won' && d.closeDate && inQuarter(d.closeDate))
      const openPipeline = touched.filter((d) => OPEN_STAGES.includes(d.stage))

      // use-case breakdown across this quarter's sessions and opened deals
      const byUseCase = new Map()
      const bucket = (label) => {
        if (!byUseCase.has(label)) byUseCase.set(label, { label, sessions: 0, deals: 0, value: 0 })
        return byUseCase.get(label)
      }
      for (const s of sessions) bucket(getUseCaseLabel(s)).sessions += 1
      for (const d of opened) {
        const b = bucket(getUseCaseLabel(d))
        b.deals += 1
        b.value += d.value
      }

      return {
        p,
        sessions,
        scheduledCount: scheduled.length,
        attendees: sessions.reduce((s, e) => s + (Number(e.attendees) || 0), 0),
        hours: sessions.reduce((s, e) => s + (Number(e.hours) || 0), 0),
        opened,
        openedValue: opened.reduce((s, d) => s + d.value, 0),
        touched,
        touchedValue: touched.reduce((s, d) => s + d.value, 0),
        openPipelineValue: openPipeline.reduce((s, d) => s + d.value, 0),
        won,
        wonValue: won.reduce((s, d) => s + d.value, 0),
        breakdown: [...byUseCase.values()].sort((a, b) => b.value - a.value || b.sessions - a.sessions),
      }
    })

    const currentQ = quarterStart(new Date())
    const allDates = [...deals.map((d) => toDate(d.date)), ...enablements.map((e) => toDate(e.date))]
    const earliestQ = allDates.length ? quarterStart(new Date(Math.min(...allDates))) : currentQ

    return { cards, canPrev: qCursor > earliestQ, canNext: qCursor < currentQ }
  }, [deals, enablements, qCursor])

  return (
    <div>
      <div className="page-header page-header--actions">
        <div>
          <h1>Products</h1>
          <p>What each product did in the quarter — sessions delivered, deals opened, and outcomes.</p>
        </div>
        <div className="tl-head__nav">
          <IconButton kind="ghost" size="sm" label="Previous quarter" disabled={!view.canPrev} onClick={() => setQCursor((q) => prevQuarter(q))}>
            <ChevronLeft />
          </IconButton>
          <span className="tl-head__label">{quarterLabel(qCursor)}</span>
          <IconButton kind="ghost" size="sm" label="Next quarter" disabled={!view.canNext} onClick={() => setQCursor((q) => nextQuarter(q))}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>

      <div className="card-stack">
        {view.cards.map(({ p, ...c }) => (
          <div key={p.id} className="chart-card">
            <h4 className="section-title">
              <ProductDot id={p.id} /> {p.label}
            </h4>
            {c.sessions.length === 0 && c.opened.length === 0 && c.won.length === 0 ? (
              <p className="pp-empty">
                No activity in {quarterLabel(qCursor)}.
                {c.scheduledCount > 0 ? ` ${c.scheduledCount} session${c.scheduledCount === 1 ? '' : 's'} scheduled.` : ''}
              </p>
            ) : (
              <>
                <div className="pp-stats">
                  <div className="pp-stat">
                    <div className="pp-stat__value">{c.sessions.length}</div>
                    <div className="pp-stat__label">Sessions delivered</div>
                    <div className="pp-stat__detail">
                      {c.attendees} attendees · {c.hours}h
                      {c.scheduledCount > 0 ? ` · ${c.scheduledCount} scheduled` : ''}
                    </div>
                  </div>
                  <div className="pp-stat">
                    <div className="pp-stat__value">{c.opened.length}</div>
                    <div className="pp-stat__label">Deals opened</div>
                    <div className="pp-stat__detail">{fmtUSDCompact(c.openedValue)} value</div>
                  </div>
                  <div className="pp-stat">
                    <div className="pp-stat__value">{c.touched.length}</div>
                    <div className="pp-stat__label">Outbound-touched</div>
                    <div className="pp-stat__detail">
                      {fmtUSDCompact(c.touchedValue)} · {fmtUSDCompact(c.openPipelineValue)} still open
                    </div>
                  </div>
                  <div className="pp-stat">
                    <div className="pp-stat__value">{c.won.length}</div>
                    <div className="pp-stat__label">Closed won in quarter</div>
                    <div className="pp-stat__detail">{fmtUSDCompact(c.wonValue)} revenue</div>
                  </div>
                </div>

                {c.breakdown.length > 0 && (
                  <div className="pp-table">
                    <div className="pp-table__row pp-table__row--head">
                      <span>Use case</span>
                      <span>Sessions</span>
                      <span>Deals opened</span>
                      <span>Deal value</span>
                    </div>
                    {c.breakdown.map((b) => (
                      <div key={b.label} className="pp-table__row">
                        <span>{b.label}</span>
                        <span>{b.sessions || '—'}</span>
                        <span>{b.deals || '—'}</span>
                        <span>{b.value ? fmtUSDCompact(b.value) : '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductDot({ id }) {
  const { theme } = useStore()
  return <span className="uc-chip__dot pp-dot" style={{ background: getProductColor(id, theme) }} aria-hidden="true" />
}
