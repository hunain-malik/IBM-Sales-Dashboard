import { useEffect, useState } from 'react'
import {
  Modal,
  TextInput,
  Dropdown,
  DatePicker,
  DatePickerInput,
  NumberInput,
} from '@carbon/react'
import { USE_CASES } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

const blank = { title: '', useCase: null, date: '', presenter: '', attendees: 10 }

export default function EnablementModal({ open, onClose, initialDate }) {
  const { addEnablement } = useStore()
  const [form, setForm] = useState(blank)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ ...blank, date: initialDate || '' })
      setInvalid(false)
    }
  }, [open, initialDate])

  const submit = () => {
    if (!form.title.trim() || !form.useCase || !form.date) {
      setInvalid(true)
      return
    }
    addEnablement({
      title: form.title.trim(),
      useCase: form.useCase.id,
      date: form.date,
      presenter: form.presenter.trim(),
      attendees: Number(form.attendees) || 0,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      modalHeading="Add enablement session"
      modalLabel="Enablements"
      primaryButtonText="Add session"
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={submit}
    >
      <div className="form-stack">
        <TextInput
          id="en-title"
          labelText="Session title"
          placeholder="e.g. Vulnerability Management 101 Workshop"
          value={form.title}
          invalid={invalid && !form.title.trim()}
          invalidText="A session title is required."
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Dropdown
          id="en-usecase"
          titleText="Use case"
          label="Select a use case"
          items={USE_CASES}
          itemToString={(i) => (i ? i.label : '')}
          selectedItem={form.useCase}
          invalid={invalid && !form.useCase}
          invalidText="Pick the use case this session enables on."
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
            id="en-date"
            labelText="Session date"
            placeholder="yyyy-mm-dd"
            invalid={invalid && !form.date}
            invalidText="A session date is required."
          />
        </DatePicker>
        <TextInput
          id="en-presenter"
          labelText="Presenter (optional)"
          placeholder="Who from the team delivered it"
          value={form.presenter}
          onChange={(e) => setForm({ ...form, presenter: e.target.value })}
        />
        <NumberInput
          id="en-attendees"
          label="Attendees"
          min={0}
          value={form.attendees}
          onChange={(_e, { value }) => setForm({ ...form, attendees: value })}
        />
      </div>
    </Modal>
  )
}
