import { Modal } from '@carbon/react'
import { useStore } from '../data/store.jsx'

const fmtWhen = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

// The audit log behind the "Last edited by" badge: every add, edit, delete,
// and restore across the dashboard, newest first, with who and exactly when.
export default function ActivityLogModal({ open, onClose }) {
  const { activityLog } = useStore()

  return (
    <Modal open={open} passiveModal modalLabel="Audit" modalHeading="Activity log" onRequestClose={onClose}>
      <p className="al-note">
        The {activityLog.length >= 100 ? 'most recent 100' : `last ${activityLog.length}`} changes to
        this dashboard. Permanently removed records leave the log with them.
      </p>
      {activityLog.length === 0 ? (
        <p className="al-empty">No recorded changes yet.</p>
      ) : (
        activityLog.map((e, i) => (
          <div key={i} className="al-row">
            <span>
              <strong>{e.name ?? 'Someone'}</strong> {e.action} the {e.kind} “{e.label}”
            </span>
            <span className="al-row__time">{fmtWhen(e.at)}</span>
          </div>
        ))
      )}
    </Modal>
  )
}
