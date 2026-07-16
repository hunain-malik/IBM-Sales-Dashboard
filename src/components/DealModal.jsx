import { useEffect, useState } from 'react'
import {
  Modal,
  TextInput,
  Dropdown,
  DatePicker,
  DatePickerInput,
  NumberInput,
} from '@carbon/react'
import { USE_CASES, DEAL_STAGES } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

const blank = { customer: '', useCase: null, value: 100000, date: '', stage: 'Prospecting', owner: '', closeDate: '' }

export default function DealModal({ open, onClose }) {
  const { addDeal } = useStore()
  const [form, setForm] = useState(blank)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(blank)
      setInvalid(false)
    }
  }, [open])

  const submit = () => {
    if (!form.customer.trim() || !form.useCase || !form.date || !(Number(form.value) > 0)) {
      setInvalid(true)
      return
    }
    addDeal({
      customer: form.customer.trim(),
      useCase: form.useCase.id,
      value: Number(form.value),
      date: form.date,
      stage: form.stage,
      owner: form.owner.trim(),
      ...(form.closeDate ? { closeDate: form.closeDate } : {}),
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      modalHeading="Add customer deal"
      modalLabel="Pipeline"
      primaryButtonText="Add deal"
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
