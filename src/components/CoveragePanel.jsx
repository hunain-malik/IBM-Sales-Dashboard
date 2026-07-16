import { Tag } from '@carbon/react'
import { fmtUSDCompact } from '../data/constants.js'
import { useStore } from '../data/store.jsx'
import UseCaseChip from './UseCaseChip.jsx'

const pct1 = (ratio) => `${(ratio * 100).toFixed(0)}%`

// Where to invest next: per use case, customer demand share (deal value) vs.
// our enablement coverage share (team hours). A use case where demand outruns
// coverage is the concrete ask to sales/execs: point more effort here.
export default function CoveragePanel({ rows }) {
  const { theme } = useStore()
  const demandColor = theme === 'g100' ? '#4589ff' : '#0f62fe'
  const coverageColor = theme === 'g100' ? '#6f6f6f' : '#a8a8a8'

  const verdict = (gap) => {
    if (gap >= 0.05) return <Tag type="blue" size="sm">Invest here · +{Math.round(gap * 100)} pts demand</Tag>
    if (gap <= -0.05) return <Tag type="green" size="sm">Well covered</Tag>
    return <Tag type="gray" size="sm">Balanced</Tag>
  }

  return (
    <div className="cmp">
      <div className="cmp__legend">
        <span className="uc-chip">
          <span className="uc-chip__dot" style={{ background: demandColor }} aria-hidden="true" />
          Customer demand (share of deal value)
        </span>
        <span className="uc-chip">
          <span className="uc-chip__dot" style={{ background: coverageColor }} aria-hidden="true" />
          Enablement coverage (share of team hours)
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.useCase} className="cmp__row">
          <div className="cmp__label">
            <UseCaseChip id={r.useCase} />
            <span className="cmp__hint">
              {r.dealCount} deal{r.dealCount === 1 ? '' : 's'} · {fmtUSDCompact(r.demandValue)} · {r.sessionCount} session{r.sessionCount === 1 ? '' : 's'} / {r.hours}h
            </span>
          </div>
          <div className="cmp__bars">
            <div className="cmp__barline">
              <span
                className="cmp__bar"
                style={{ width: `${Math.max(r.demandShare * 100, r.demandShare > 0 ? 2 : 0)}%`, background: demandColor }}
                aria-hidden="true"
              />
              <span className="cmp__value">{pct1(r.demandShare)}</span>
            </div>
            <div className="cmp__barline">
              <span
                className="cmp__bar"
                style={{ width: `${Math.max(r.coverageShare * 100, r.coverageShare > 0 ? 2 : 0)}%`, background: coverageColor }}
                aria-hidden="true"
              />
              <span className="cmp__value">{pct1(r.coverageShare)}</span>
            </div>
          </div>
          <div className="cmp__delta">{verdict(r.gap)}</div>
        </div>
      ))}
    </div>
  )
}
