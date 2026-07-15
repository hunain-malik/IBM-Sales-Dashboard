import { useState } from 'react'
import { IconButton } from '@carbon/react'
import { ChevronLeft, ChevronRight } from '@carbon/icons-react'
import { USE_CASES, getUseCaseColor } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

// Month grid of enablement sessions. Clicking a day starts a new session
// entry pre-filled with that date.
export default function MonthCalendar({ sessions, onPickDay }) {
  const { theme } = useStore()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { y: now.getFullYear(), m: now.getMonth() }
  })

  const today = new Date()
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate())
  const first = new Date(cursor.y, cursor.m, 1)
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const pad = first.getDay()
  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const byDay = new Map()
  for (const s of sessions) {
    if (!byDay.has(s.date)) byDay.set(s.date, [])
    byDay.get(s.date).push(s)
  }

  const cells = []
  for (let i = 0; i < pad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const move = (delta) =>
    setCursor(({ y, m }) => {
      const next = new Date(y, m + delta, 1)
      return { y: next.getFullYear(), m: next.getMonth() }
    })

  return (
    <div className="cal">
      <div className="cal__head">
        <h3>{monthLabel}</h3>
        <div>
          <IconButton kind="ghost" size="sm" label="Previous month" onClick={() => move(-1)}>
            <ChevronLeft />
          </IconButton>
          <IconButton kind="ghost" size="sm" label="Next month" onClick={() => move(1)}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>
      <div className="cal__grid" role="grid" aria-label={`Enablement sessions in ${monthLabel}`}>
        {DOW.map((d) => (
          <div key={d} className="cal__dow">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`pad-${i}`} className="cal__day cal__day--pad" aria-hidden="true" />
          const dayIso = iso(cursor.y, cursor.m, d)
          const events = byDay.get(dayIso) ?? []
          return (
            <button
              key={dayIso}
              type="button"
              className={`cal__day${dayIso === todayIso ? ' cal__day--today' : ''}`}
              title={`Add a session on ${dayIso}`}
              onClick={() => onPickDay(dayIso)}
            >
              <span className="cal__daynum">{d}</span>
              {events.map((e) => (
                <span
                  key={e.id}
                  className="cal__event"
                  style={{ borderLeftColor: getUseCaseColor(e.useCase, theme) }}
                  title={`${e.title} — ${e.presenter || 'team session'}`}
                >
                  {e.title}
                </span>
              ))}
            </button>
          )
        })}
      </div>
      <div className="cal__legend">
        {USE_CASES.map((u) => (
          <span key={u.id} className="uc-chip" style={{ fontSize: '0.75rem' }}>
            <span
              className="uc-chip__dot"
              style={{ background: theme === 'g100' ? u.dark : u.light }}
              aria-hidden="true"
            />
            {u.label}
          </span>
        ))}
      </div>
    </div>
  )
}
