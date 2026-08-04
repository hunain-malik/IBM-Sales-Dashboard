import { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  TextInput,
  Dropdown,
  DatePicker,
  DatePickerInput,
  NumberInput,
  Checkbox,
} from '@carbon/react'
import {
  PRODUCTS,
  USE_CASES_BY_PRODUCT,
  DEAL_STAGES,
  fmtDate,
  matchKeyOf,
  getUseCaseLabel,
} from '../data/constants.js'
import { useStore } from '../data/store.jsx'

const blank = {
  customer: '',
  product: null, // PRODUCTS entry
  useCase: null, // catalog entry for the chosen product
  customChecked: false,
  customText: '',
  value: 100000,
  date: '',
  stage: 'Prospecting',
  owner: '',
  closeDate: '',
  sourceSessionId: '',
}

// Create a new deal, or edit an existing one when `deal` is passed — stages
// change over a deal's life, and stale stages silently corrupt the win-rate
// comparison, so editing in place matters. Use case is product-scoped, with
// a custom option; the session tie offers any session on the deal's product.
export default function DealModal({ open, onClose, deal = null }) {
  const { addDeal, updateDeal, enablements } = useStore()
  const [form, setForm] = useState(blank)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (open) {
      if (deal) {
        const product = PRODUCTS.find((p) => p.id === deal.product) ?? null
        const catalog = product ? USE_CASES_BY_PRODUCT[product.id] : []
        const inCatalog = catalog.find((u) => u.id === deal.useCase) ?? null
        const custom = deal.useCase === 'custom' || (!inCatalog && deal.useCase)
        setForm({
          customer: deal.customer,
          product,
          useCase: inCatalog,
          customChecked: Boolean(custom),
          customText: custom ? (deal.customUseCase ?? getUseCaseLabel(deal)) : '',
          value: deal.value,
          date: deal.date,
          stage: deal.stage,
          owner: deal.owner ?? '',
          closeDate: deal.closeDate ?? '',
          sourceSessionId: deal.sourceSessionId ?? '',
        })
      } else {
        setForm(blank)
      }
      setInvalid(false)
    }
  }, [open, deal])

  const catalog = form.product ? USE_CASES_BY_PRODUCT[form.product.id] : []
  const useCaseOk = form.customChecked ? Boolean(form.customText.trim()) : Boolean(form.useCase)

  // what this deal would look like to the matching rule right now
  const formRecord = {
    product: form.product?.id,
    useCase: form.customChecked ? 'custom' : form.useCase?.id,
    customUseCase: form.customChecked ? form.customText : undefined,
  }

  // sessions this deal COULD be tied to: any session on the SAME PRODUCT
  // delivered on or before the open date — the tie is a human assertion of
  // which session mattered, and product is the boundary leadership reports on
  const eligibleSessions = useMemo(
    () =>
      form.product && form.date
        ? enablements
            .filter((e) => e.product === form.product.id && e.date <= form.date)
            .sort((a, b) => a.date.localeCompare(b.date))
        : [],
    [enablements, form.product, form.date],
  )

  // the Automatic option names what the timing rule resolves to: the earliest
  // session matching the deal's use case; the manual list excludes it
  const formKey = matchKeyOf(formRecord)
  const earliestAuto = eligibleSessions.find((e) => matchKeyOf(e) === formKey) ?? null
  const autoTie = {
    id: '',
    label: earliestAuto
      ? `Automatic — ${earliestAuto.title} (${fmtDate(earliestAuto.date)})`
      : 'Automatic — no session matches this use case yet',
  }
  const tieItems = [
    autoTie,
    ...eligibleSessions
      .filter((e) => e.id !== earliestAuto?.id)
      .map((e) => ({ id: e.id, label: `${e.title} — ${fmtDate(e.date)}` })),
  ]
  // a tie that stopped being eligible (product / date changed) — or one that
  // points at the automatic pick — reads as Automatic and is dropped on save
  const selectedTie = tieItems.find((i) => i.id === form.sourceSessionId) ?? autoTie

  const submit = () => {
    if (!form.customer.trim() || !form.product || !useCaseOk || !form.date || !(Number(form.value) > 0)) {
      setInvalid(true)
      return
    }
    const payload = {
      customer: form.customer.trim(),
      product: form.product.id,
      useCase: form.customChecked ? 'custom' : form.useCase.id,
      customUseCase: form.customChecked ? form.customText.trim() : undefined,
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
          id="deal-product"
          titleText="Product"
          label="Select a product"
          items={PRODUCTS}
          itemToString={(i) => (i ? i.label : '')}
          selectedItem={form.product}
          invalid={invalid && !form.product}
          invalidText="Pick the product this deal relates to."
          onChange={({ selectedItem }) =>
            setForm({ ...form, product: selectedItem, useCase: null, sourceSessionId: '' })
          }
        />
        {!form.customChecked && (
          <Dropdown
            id="deal-usecase"
            titleText="Use case the customer is interested in"
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
          id="deal-usecase-custom"
          labelText="The use case isn’t in the list"
          checked={form.customChecked}
          onChange={(_e, { checked }) => setForm({ ...form, customChecked: checked })}
        />
        {form.customChecked && (
          <TextInput
            id="deal-usecase-custom-text"
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
            helperText="Any session on this product delivered before the open date qualifies."
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
