import { useMemo, useState } from 'react'
import {
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tag,
  IconButton,
} from '@carbon/react'
import { Add, Edit, TrashCan } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { attributeDeals } from '../data/attribution.js'
import { fmtUSD, fmtDate, STAGE_TAG_TYPE } from '../data/constants.js'
import UseCaseChip from '../components/UseCaseChip.jsx'
import DealModal from '../components/DealModal.jsx'

export default function Pipeline() {
  const { deals, enablements, removeDeal } = useStore()
  // null = closed, 'new' = create, deal object = edit
  const [modal, setModal] = useState(null)

  const rows = useMemo(
    () => attributeDeals(deals, enablements).sort((a, b) => b.date.localeCompare(a.date)),
    [deals, enablements],
  )

  return (
    <div>
      <div className="page-header page-header--actions">
        <h1>Customer pipeline</h1>
        <Button renderIcon={Add} onClick={() => setModal('new')}>
          Add deal
        </Button>
      </div>

      <div className="table-card">
        {rows.length ? (
          <Table size="md" aria-label="Customer deals">
            <TableHead>
              <TableRow>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Use case</TableHeader>
                <TableHeader>Revenue</TableHeader>
                <TableHeader>Stage</TableHeader>
                <TableHeader>Open date</TableHeader>
                <TableHeader>Owner</TableHeader>
                <TableHeader>Enablement</TableHeader>
                <TableHeader aria-label="Actions" />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.customer}</TableCell>
                  <TableCell><UseCaseChip id={d.useCase} /></TableCell>
                  <TableCell>{fmtUSD(d.value)}</TableCell>
                  <TableCell>
                    <Tag type={STAGE_TAG_TYPE[d.stage] ?? 'gray'} size="sm">{d.stage}</Tag>
                  </TableCell>
                  <TableCell>{fmtDate(d.date)}</TableCell>
                  <TableCell>{d.owner || '—'}</TableCell>
                  <TableCell>
                    {d.influenced ? (
                      <Tag type="purple" size="sm" title={`Preceded by ${d.matched.length} matching session(s)`}>
                        Influenced
                      </Tag>
                    ) : (
                      <span style={{ color: 'var(--cds-text-helper)' }}>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton kind="ghost" size="sm" label="Edit deal" onClick={() => setModal(d)}>
                      <Edit />
                    </IconButton>
                    <IconButton kind="ghost" size="sm" label="Delete deal" onClick={() => removeDeal(d.id)}>
                      <TrashCan />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="empty-state">
            <h3>No deals tracked</h3>
            <p>Add the first customer deal to start measuring enablement influence.</p>
          </div>
        )}
      </div>

      <DealModal
        open={modal !== null}
        deal={modal && modal !== 'new' ? modal : null}
        onClose={() => setModal(null)}
      />
    </div>
  )
}
