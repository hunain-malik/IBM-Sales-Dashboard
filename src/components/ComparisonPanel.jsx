import { fmtUSDCompact, fmtPct } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

// Influenced vs. not-influenced deals: win rate, average deal size, sales
// cycle. Emphasis coloring — influenced carries the accent hue, the rest is
// context gray — with every value direct-labeled so color never works alone.
// Deltas are stated in BOTH directions: hiding an unfavorable number would
// undermine the whole page the first time someone checks the math.
const METRICS = [
  {
    key: 'winRate',
    label: 'Win rate',
    fmt: fmtPct,
    delta: (a, b) => {
      const pts = Math.round((a - b) * 100)
      if (Math.abs(pts) <= 2) return null
      return { text: `${pts > 0 ? '+' : '−'}${Math.abs(pts)} pts`, favorable: pts > 0 }
    },
  },
  {
    key: 'avgSize',
    label: 'Average deal size',
    fmt: fmtUSDCompact,
    delta: (a, b) => {
      if (!(a > 0) || !(b > 0) || Math.abs(a - b) <= b * 0.05) return null
      return a > b
        ? { text: `${(a / b).toFixed(1)}× larger`, favorable: true }
        : { text: `${(b / a).toFixed(1)}× smaller`, favorable: false }
    },
  },
  {
    key: 'cycleDays',
    label: 'Average sales cycle',
    fmt: (v) => `${Math.round(v)} days`,
    delta: (a, b) => {
      const d = Math.round(a - b)
      if (Math.abs(d) <= 2) return null
      return d < 0
        ? { text: `${-d} days faster`, favorable: true }
        : { text: `${d} days slower`, favorable: false }
    },
  },
]

export default function ComparisonPanel({ stats }) {
  const { theme } = useStore()
  const accent = theme === 'g100' ? '#4589ff' : '#0f62fe'
  const context = theme === 'g100' ? '#6f6f6f' : '#a8a8a8'
  const { influenced, rest } = stats

  return (
    <div className="cmp">
      <div className="cmp__legend">
        <span className="uc-chip">
          <span className="uc-chip__dot" style={{ background: accent }} aria-hidden="true" />
          Outbound-touched (n={influenced.n})
        </span>
        <span className="uc-chip">
          <span className="uc-chip__dot" style={{ background: context }} aria-hidden="true" />
          No outbound touch (n={rest.n})
        </span>
      </div>
      {METRICS.map((m) => {
        const a = influenced[m.key]
        const b = rest[m.key]
        const max = Math.max(a ?? 0, b ?? 0) || 1
        const delta = a != null && b != null ? m.delta(a, b) : null
        return (
          <div key={m.key} className="cmp__row">
            <div className="cmp__label">{m.label}</div>
            <div className="cmp__bars">
              {[
                { v: a, color: accent, name: 'Outbound-touched' },
                { v: b, color: context, name: 'No outbound touch' },
              ].map((s) => (
                <div key={s.name} className="cmp__barline">
                  <span
                    className="cmp__bar"
                    style={{
                      width: s.v != null ? `${Math.max((s.v / max) * 100, 2)}%` : 0,
                      background: s.color,
                    }}
                    aria-hidden="true"
                  />
                  <span className="cmp__value">{s.v != null ? m.fmt(s.v) : 'not enough data'}</span>
                </div>
              ))}
            </div>
            <div className={`cmp__delta${delta && !delta.favorable ? ' cmp__delta--adverse' : ''}`}>
              {delta ? delta.text : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}
