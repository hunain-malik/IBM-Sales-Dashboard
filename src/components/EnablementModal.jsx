import { useEffect, useState } from 'react'
import {
  Modal,
  TextInput,
  Dropdown,
  DatePicker,
  DatePickerInput,
  NumberInput,
  Checkbox,
} from '@carbon/react'
import { PRODUCTS, USE_CASES_BY_PRODUCT, getUseCaseLabel } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

const blank = {
  title: '',
  product: null, // PRODUCTS entry
  useCase: null, // catalog entry for the chosen product
  customChecked: false,
  customText: '',
  date: '',
  presenter: '',
  attendees: 10,
  hours: 4,
}

// Create a new session, or edit an existing one when `session` is passed —
// hours and dates feed the ROI and attribution math, so they must be fixable.
// Use case is product-scoped: pick the product first, then one of its use
// cases — or tick the checkbox and type a custom one when none fits.
export default function EnablementModal({ open, onClose, initialDate, session = null }) {
  const { addEnablement, updateEnablement } = useStore()
  const [form, setForm] = useState(blank)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (open) {
      if (session) {
        const product = PRODUCTS.find((p) => p.id === session.product) ?? null
        const catalog = product ? USE_CASES_BY_PRODUCT[product.id] : []
        const inCatalog = catalog.find((u) => u.id === session.useCase) ?? null
        // custom entries — and legacy records from before product-scoped
        // catalogs — edit as custom text so nothing is silently lost
        const custom = session.useCase === 'custom' || (!inCatalog && session.useCase)
        setForm({
          title: session.title,
          product,
          useCase: inCatalog,
          customChecked: Boolean(custom),
          customText: custom ? (session.customUseCase ?? getUseCaseLabel(session)) : '',
          date: session.date,
          presenter: session.presenter ?? '',
          attendees: session.attendees ?? 0,
          hours: session.hours ?? 0,
        })
      } else {
        setForm({ ...blank, date: initialDate || '' })
      }
      setInvalid(false)
    }
  }, [open, initialDate, session])

  const catalog = form.product ? USE_CASES_BY_PRODUCT[form.product.id] : []
  const useCaseOk = form.customChecked ? Boolean(form.customText.trim()) : Boolean(form.useCase)

  const submit = () => {
    if (!form.title.trim() || !form.product || !useCaseOk || !form.date) {
      setInvalid(true)
      return
    }
    const payload = {
      title: form.title.trim(),
      product: form.product.id,
      useCase: form.customChecked ? 'custom' : form.useCase.id,
      customUseCase: form.customChecked ? form.customText.trim() : undefined,
      date: form.date,
      presenter: form.presenter.trim(),
      attendees: Number(form.attendees) || 0,
      hours: Number(form.hours) || 0,
    }
    if (session) updateEnablement(session.id, payload)
    else addEnablement(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      modalHeading={session ? 'Edit enablement session' : 'Add enablement session'}
      modalLabel="Enablements"
      primaryButtonText={session ? 'Save changes' : 'Add session'}
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={submit}
    >
      <div className="form-stack">
        <TextInput
          id="en-title"
          labelText="Session title"
          placeholder="e.g. Instana Observability Workshop"
          value={form.title}
          invalid={invalid && !form.title.trim()}
          invalidText="A session title is required."
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <TextInput
          id="en-presenter"
          labelText="Presenter (optional)"
          placeholder="Who from the team delivered it"
          value={form.presenter}
          onChange={(e) => setForm({ ...form, presenter: e.target.value })}
        />
        <Dropdown
          id="en-product"
          titleText="Product"
          label="Select a product"
          items={PRODUCTS}
          itemToString={(i) => (i ? i.label : '')}
          selectedItem={form.product}
          invalid={invalid && !form.product}
          invalidText="Pick the product this session is about."
          onChange={({ selectedItem }) =>
            // switching product resets the catalog pick; custom text survives
            setForm({ ...form, product: selectedItem, useCase: null })
          }
        />
        {!form.customChecked && (
          <Dropdown
            id="en-usecase"
            titleText="Use case"
            label={form.product ? 'Select a use case' : 'Pick a product first'}
            disabled={!form.product}
            items={catalog}
            itemToString={(i) => (i ? i.label : '')}
            selectedItem={form.useCase}
            invalid={invalid && !useCaseOk}
            invalidText="Pick a use case, or tick the box below to type your own."
            onChange={({ selectedItem }) => setForm({ ...form, useCase: selectedItem })}
          />
        )}
        <Checkbox
          id="en-usecase-custom"
          labelText="The use case isn’t in the list"
          checked={form.customChecked}
          onChange={(_e, { checked }) => setForm({ ...form, customChecked: checked })}
        />
        {form.customChecked && (
          <TextInput
            id="en-usecase-custom-text"
            labelText="Custom use case"
            placeholder="Describe the use case in a few words"
            value={form.customText}
            invalid={invalid && !useCaseOk}
            invalidText="Describe the use case, or untick the box and pick from the list."
            onChange={(e) => setForm({ ...form, customText: e.target.value })}
          />
        )}
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
        <NumberInput
          id="en-attendees"
          label="Attendees"
          min={0}
          value={form.attendees}
          onChange={(_e, { value }) => setForm({ ...form, attendees: value })}
        />
        <NumberInput
          id="en-hours"
          label="Team hours invested (prep + delivery)"
          min={0}
          value={form.hours}
          onChange={(_e, { value }) => setForm({ ...form, hours: value })}
        />
      </div>
    </Modal>
  )
}
