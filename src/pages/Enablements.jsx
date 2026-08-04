import { useState } from 'react'
import {
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  IconButton,
  Tag,
} from '@carbon/react'
import { Add, Edit, Email, TrashCan } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { fmtDate, sessionRequestMailto, todayIso, authorNote, getProduct } from '../data/constants.js'
import UseCaseChip from '../components/UseCaseChip.jsx'
import MonthCalendar from '../components/MonthCalendar.jsx'
import EnablementModal from '../components/EnablementModal.jsx'
import RecentlyDeleted from '../components/RecentlyDeleted.jsx'

export default function Enablements() {
  const { enablements, removeEnablement, deletedEnablements, restoreEnablement } = useStore()
  // null = closed, { date } = create (optionally pre-dated), { session } = edit
  const [modal, setModal] = useState(null)

  const sorted = [...enablements].sort((a, b) => b.date.localeCompare(a.date))

  const openForDate = (isoDate) => setModal({ date: isoDate })

  return (
    <div>
      <div className="page-header page-header--actions">
        <h1>Enablement Sessions</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button kind="tertiary" renderIcon={Email} href={sessionRequestMailto()}>
            Request a session
          </Button>
          <Button renderIcon={Add} onClick={() => openForDate('')}>
            Add enablement
          </Button>
        </div>
      </div>

      <div className="table-card" style={{ marginBottom: '1rem' }}>
          {sorted.length ? (
            <Table size="md" aria-label="Enablement sessions">
              <TableHead>
                <TableRow>
                  <TableHeader>Session</TableHeader>
                  <TableHeader>Product</TableHeader>
                  <TableHeader>Use case</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Attendees</TableHeader>
                  <TableHeader>Hours</TableHeader>
                  <TableHeader aria-label="Actions" />
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {e.title}
                      {e.presenter ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>{e.presenter}</div>
                      ) : null}
                      {authorNote(e) ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>{authorNote(e)}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{getProduct(e.product)?.label ?? '—'}</TableCell>
                    <TableCell><UseCaseChip record={e} /></TableCell>
                    <TableCell>
                      {fmtDate(e.date)}
                      {e.date > todayIso() && (
                        <Tag type="blue" size="sm" style={{ marginLeft: '0.5rem' }}>Scheduled</Tag>
                      )}
                    </TableCell>
                    {/* a scheduled session hasn't had attendees yet */}
                    <TableCell>{e.date > todayIso() ? '—' : e.attendees}</TableCell>
                    <TableCell>{Number(e.hours) || 0}</TableCell>
                    <TableCell>
                      <IconButton kind="ghost" size="sm" label="Edit session" onClick={() => setModal({ session: e })}>
                        <Edit />
                      </IconButton>
                      <IconButton
                        kind="ghost"
                        size="sm"
                        label="Delete session"
                        onClick={() => removeEnablement(e.id)}
                      >
                        <TrashCan />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="empty-state">
              <h3>No sessions logged</h3>
              <p>Add the first enablement session — deals that open later on the same use case will match it automatically.</p>
            </div>
          )}
      </div>

      <MonthCalendar sessions={enablements} onPickDay={openForDate} />

      <RecentlyDeleted
        title="Recently deleted sessions"
        rows={deletedEnablements.map((e) => ({
          id: e.id,
          label: e.title,
          deletedAt: e.deletedAt,
          deletedBy: e.deletedBy,
        }))}
        onRestore={restoreEnablement}
      />

      <EnablementModal
        open={modal !== null}
        initialDate={modal?.date ?? ''}
        session={modal?.session ?? null}
        onClose={() => setModal(null)}
      />
    </div>
  )
}
