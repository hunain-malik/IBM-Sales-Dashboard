import { useEffect, useState } from 'react'
import { Modal, PasswordInput } from '@carbon/react'
import { useStore } from '../data/store.jsx'
import { ADMIN_KEY_HASH, sha256Hex } from '../data/constants.js'

// Key-gated full reset for the shared live store. The key is verified against
// a SHA-256 hash (the key itself never ships in the bundle), and the wipe
// goes through the synced store so it propagates to everyone. This is an
// accident guardrail, not bank-grade security — anyone the key is shared
// with can wipe the dashboard, so share it accordingly.
export default function AdminResetModal({ open, onClose }) {
  const { clearAll } = useStore()
  const [key, setKey] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (open) {
      setKey('')
      setInvalid(false)
      setChecking(false)
    }
  }, [open])

  const submit = async () => {
    if (checking) return
    setChecking(true)
    const ok = (await sha256Hex(key)) === ADMIN_KEY_HASH
    setChecking(false)
    if (!ok) {
      setInvalid(true)
      return
    }
    clearAll()
    onClose()
  }

  return (
    <Modal
      open={open}
      danger
      modalHeading="Reset all data"
      modalLabel="Administration"
      primaryButtonText="Reset all data"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!key || checking}
      onRequestClose={onClose}
      onRequestSubmit={submit}
    >
      <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
        This permanently deletes every enablement session and customer deal for everyone using this
        dashboard. Enter the administration key to confirm.
      </p>
      <PasswordInput
        id="admin-reset-key"
        labelText="Administration key"
        value={key}
        invalid={invalid}
        invalidText="Incorrect administration key."
        onChange={(e) => {
          setKey(e.target.value)
          setInvalid(false)
        }}
      />
    </Modal>
  )
}
