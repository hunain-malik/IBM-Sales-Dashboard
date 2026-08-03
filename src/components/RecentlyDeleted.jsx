import { Button } from '@carbon/react'
import { Reset } from '@carbon/icons-react'
import { fmtDate } from '../data/constants.js'

// The recycle bin: soft-deleted records for one page, restorable in one
// click. Records are purged for good 30 days after deletion; until then an
// accidental delete costs nothing. Renders nothing when the bin is empty.
export default function RecentlyDeleted({ title, rows, onRestore }) {
  if (!rows.length) return null
  return (
    <div className="chart-card" style={{ marginTop: '1rem' }}>
      <h4 className="section-title">{title}</h4>
      <p className="rd-note">
        Deleted records can be restored for 30 days, then they are removed permanently.
      </p>
      {rows.map((r) => (
        <div key={r.id} className="rd-row">
          <div>
            <div className="rd-row__label">{r.label}</div>
            <div className="rd-row__meta">
              deleted {fmtDate(r.deletedAt.slice(0, 10))}
              {r.deletedBy ? ` by ${r.deletedBy}` : ''}
            </div>
          </div>
          <Button kind="ghost" size="sm" renderIcon={Reset} onClick={() => onRestore(r.id)}>
            Restore
          </Button>
        </div>
      ))}
    </div>
  )
}
