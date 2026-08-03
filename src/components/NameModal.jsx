import { useEffect, useState } from 'react'
import { Modal, TextInput } from '@carbon/react'
import { useStore } from '../data/store.jsx'

// Asks for the user's full name on first visit (shared mode). The name is
// stored in this browser and attached to every record the person adds, edits,
// or deletes — the audit trail that makes shared numbers trustworthy. It can
// be changed later via the person icon in the header.
export default function NameModal({ open, onClose, firstRun }) {
  const { userName, setUserName } = useStore()
  const [name, setName] = useState('')
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (open) {
      setName(userName)
      setInvalid(false)
    }
  }, [open, userName])

  const submit = () => {
    if (!name.trim()) {
      setInvalid(true)
      return
    }
    setUserName(name)
    onClose()
  }

  return (
    <Modal
      open={open}
      modalLabel="Identity"
      modalHeading={firstRun ? 'Welcome — who are you?' : 'Change your name'}
      primaryButtonText="Continue"
      secondaryButtonText={firstRun ? undefined : 'Cancel'}
      preventCloseOnClickOutside={firstRun}
      onRequestClose={firstRun ? () => {} : onClose}
      onRequestSubmit={submit}
    >
      <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
        Your full name is attached to the records you add or edit, so the team can see who to ask
        about a change.
      </p>
      <TextInput
        id="user-name"
        labelText="Full name"
        placeholder="e.g. Hunain Malik"
        value={name}
        invalid={invalid}
        invalidText="Please enter your name."
        onChange={(e) => {
          setName(e.target.value)
          setInvalid(false)
        }}
      />
    </Modal>
  )
}
