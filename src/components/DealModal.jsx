import { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  TextInput,
  Dropdown,
  DatePicker,
  DatePickerInput,
  NumberInput,
} from '@carbon/react'
import { USE_CASES, DEAL_STAGES, fmtDate } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

const blank = { customer: '', useCase: null, value: 100000, date: '', stage: 'Prospecting', owner: '', closeDate: '', sourceSessionId: '' }


// Create a new deal, or edit an existing one when `deal` is passed — stages
// change over a deal's life, and stale stages silently corrupt the win-rate
// comparison, so editing in place matters.
export default function DealModal({ open, onClose, deal = null }) {
  const { addDeal, updateDeal, enablements } = useStore()
  const [form, setForm] = useState(blank)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        deal
          ? {
              customer: deal.customer,
              useCase: USE_CASES.find((u) => u.id === deal.useCase) ?? null,
              value: deal.value,
              date: deal.date,
              stage: deal.stage,
              owner: deal.owner ?? '',
              closeDate: deal.closeDate ?? '',
              sourceSessionId: deal.sourceSessionId ?? '',
            }
          : blank,
      )
      setInvalid(false)
    }
  }, [open, deal])

  // sessions this deal COULD be tied to: same use case, delivered on or
  // before the open date — the same eligibility the counting rule uses, so a
  // manual tie can never create a match the rule wouldn't count
  const eligibleSessions = useMemo(
    () =>
      form.useCase && form.date
        ? enablements
            .filter((e) => e.useCase === form.useCase.id && e.date <= form.date)
            .sort((a, b) => a.date.localeCompare(b.date))
        : [],
    [enablements, form.useCase, form.date],
  )
  // the Automatic option names the session the timing rule resolves to (the
  // earliest eligible one), and that session is left OUT of the manual list —
  // picking it by hand would be the same choice twice
  const earliest = eligibleSessions[0] ?? null
  const autoTie = {
    id: '',
    label: earliest ? `Automatic — ${earliest.title} (${fmtDate(earliest.date)})` : 'Automatic',
  }
  const tieItems = [autoTie, ...eligibleSessions.slice(1).map((e) => ({ id: e.id, label: `${e.title} — ${fmtDate(e.date)}` }))]
  // a tie that stopped being eligible (use case / date changed) — or one that
  // points at the earliest session, which IS automatic — reads as Automatic
  // and is dropped on save
  const selectedTie = tieItems.find((i) => i.id === form.sourceSessionId) ?? autoTie

  const submit = () => {
    if (!form.customer.trim() || !form.useCase || !form.date || !(Number(form.value) > 0)) {
      setInvalid(true)
      return
    }
    const payload = {
      customer: form.customer.trim(),
      useCase: form.useCase.id,
      value: Number(form.value),
      date: form.date,
      stage: form.stage,
      owner: form.owner.trim(),
      // closeDate only makes sense on closed stages; clear it otherwise
      closeDate: form.stage.startsWith('Closed') && form.closeDate ? form.closeDate : undefined,
      sourceSessionId: selectedTie.id || undefined,
    }
    if (deal) updateDeal(deal.id, payload)
    else addDeal(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      modalHeading={deal ? 'Edit customer deal' : 'Add customer deal'}
      modalLabel="Pipeline"
      primaryButtonText={deal ? 'Save changes' : 'Add deal'}
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={submit}
    >
      <div className="form-stack">
        <TextInput
          id="deal-customer"
          labelText="Customer name"
          placeholder="e.g. Acme Financial"
          value={form.customer}
          invalid={invalid && !form.customer.trim()}
          invalidText="A customer name is required."
          onChange={(e) => setForm({ ...form, customer: e.target.value })}
        />
        <NumberInput
          id="deal-value"
          label="Deal revenue (USD)"
          min={0}
          step={10000}
          value={form.value}
          invalid={invalid && !(Number(form.value) > 0)}
          invalidText="Deal revenue must be greater than zero."
          onChange={(_e, { value }) => setForm({ ...form, value })}
        />
        <Dropdown
          id="deal-usecase"
          titleText="Use case the customer is interested in"
          label="Select a use case"
          items={USE_CASES}
          itemToString={(i) => (i ? i.label : '')}
          selectedItem={form.useCase}
          invalid={invalid && !form.useCase}
          invalidText="Pick the use case the customer is interested in."
          onChange={({ selectedItem }) => setForm({ ...form, useCase: selectedItem })}
        />
        <DatePicker
          datePickerType="single"
          dateFormat="Y-m-d"
          value={form.date ? [form.date] : []}
          onChange={(dates) => {
            const d = dates[0]
            if (d) {
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              setForm((f) => ({ ...f, date: iso }))
            }
          }}
        >
          <DatePickerInput
            id="deal-date"
            labelText="Deal open date"
            placeholder="yyyy-mm-dd"
            invalid={invalid && !form.date}
            invalidText="A deal date is required."
          />
        </DatePicker>
        {eligibleSessions.length > 0 && (
          <Dropdown
            id="deal-source-session"
            titleText="Tie to a specific session (optional)"
            helperText="Pick a different session if the deal came out of a later one."
            label={autoTie.label}
            items={tieItems}
            itemToString={(i) => (i ? i.label : '')}
            selectedItem={selectedTie}
            onChange={({ selectedItem }) => setForm({ ...form, sourceSessionId: selectedItem?.id ?? '' })}
          />
        )}
        <Dropdown
          id="deal-stage"
          titleText="Stage"
          label="Stage"
          items={DEAL_STAGES}
          selectedItem={form.stage}
          onChange={({ selectedItem }) => setForm({ ...form, stage: selectedItem })}
        />
        {form.stage?.startsWith('Closed') && (
          <DatePicker
            datePickerType="single"
            dateFormat="Y-m-d"
            value={form.closeDate ? [form.closeDate] : []}
            onChange={(dates) => {
              const d = dates[0]
              if (d) {
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                setForm((f) => ({ ...f, closeDate: iso }))
              }
            }}
          >
            <DatePickerInput
              id="deal-close-date"
              labelText="Close date"
              placeholder="yyyy-mm-dd"
            />
          </DatePicker>
        )}
        <TextInput
          id="deal-owner"
          labelText="Deal owner (optional)"
          placeholder="Seller running the deal"
          value={form.owner}
          onChange={(e) => setForm({ ...form, owner: e.target.value })}
        />
      </div>
    </Modal>
  )
}
