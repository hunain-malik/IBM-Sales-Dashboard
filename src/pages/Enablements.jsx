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
} from '@carbon/react'
import { Add, Edit, TrashCan } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { fmtDate } from '../data/constants.js'
import UseCaseChip from '../components/UseCaseChip.jsx'
import MonthCalendar from '../components/MonthCalendar.jsx'
import EnablementModal from '../components/EnablementModal.jsx'

export default function Enablements() {
  const { enablements, removeEnablement } = useStore()
  // null = closed, { date } = create (optionally pre-dated), { session } = edit
  const [modal, setModal] = useState(null)

  const sorted = [...enablements].sort((a, b) => b.date.localeCompare(a.date))

  const openForDate = (isoDate) => setModal({ date: isoDate })

  return (
    <div>
      <div className="page-header page-header--actions">
        <h1>Enablement sessions</h1>
        <Button renderIcon={Add} onClick={() => openForDate('')}>
          Add enablement
        </Button>
      </div>

      <div className="table-card" style={{ marginBottom: '1rem' }}>
          {sorted.length ? (
            <Table size="md" aria-label="Enablement sessions">
              <TableHead>
                <TableRow>
                  <TableHeader>Session</TableHeader>
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
                    </TableCell>
                    <TableCell><UseCaseChip id={e.useCase} /></TableCell>
                    <TableCell>{fmtDate(e.date)}</TableCell>
                    <TableCell>{e.attendees}</TableCell>
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
              <p>Add the first enablement session to start tracking impact.</p>
            </div>
          )}
      </div>

      <MonthCalendar sessions={enablements} onPickDay={openForDate} />

      <EnablementModal
        open={modal !== null}
        initialDate={modal?.date ?? ''}
        session={modal?.session ?? null}
        onClose={() => setModal(null)}
      />
    </div>
  )
}
