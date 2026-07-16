import { fmtUSDCompact, fmtPct } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

// Influenced vs. not-influenced deals: win rate, average deal size, sales
// cycle. Emphasis coloring — influenced carries the accent hue, the rest is
// context gray — with every value direct-labeled so color never works alone.
const METRICS = [
  {
    key: 'winRate',
    label: 'Win rate',
    hint: 'Closed won ÷ all closed deals',
    fmt: fmtPct,
    delta: (a, b) => `+${Math.round((a - b) * 100)} pts`,
    better: (a, b) => a > b,
  },
  {
    key: 'avgSize',
    label: 'Average deal size',
    hint: 'Mean value across the group',
    fmt: fmtUSDCompact,
    delta: (a, b) => `${(a / b).toFixed(1)}× larger`,
    better: (a, b) => a > b && b > 0, // ratio needs a non-zero baseline
  },
  {
    key: 'cycleDays',
    label: 'Average sales cycle',
    hint: 'Days from open to close',
    fmt: (v) => `${Math.round(v)} days`,
    delta: (a, b) => `${Math.round(b - a)} days faster`,
    better: (a, b) => a < b,
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
          Enablement-influenced (n={influenced.n})
        </span>
        <span className="uc-chip">
          <span className="uc-chip__dot" style={{ background: context }} aria-hidden="true" />
          Not influenced (n={rest.n})
        </span>
      </div>
      {METRICS.map((m) => {
        const a = influenced[m.key]
        const b = rest[m.key]
        const max = Math.max(a ?? 0, b ?? 0) || 1
        const showDelta = a != null && b != null && m.better(a, b)
        return (
          <div key={m.key} className="cmp__row">
            <div className="cmp__label">
              {m.label}
              <span className="cmp__hint">{m.hint}</span>
            </div>
            <div className="cmp__bars">
              {[
                { v: a, color: accent, name: 'Influenced' },
                { v: b, color: context, name: 'Not influenced' },
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
            <div className="cmp__delta">{showDelta ? m.delta(a, b) : ''}</div>
          </div>
        )
      })}
    </div>
  )
}
