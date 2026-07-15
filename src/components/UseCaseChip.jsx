import { getUseCase, getUseCaseColor } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

// Identity swatch: exact validated hex + the label in text ink,
// so a use case is never identified by color alone.
export default function UseCaseChip({ id }) {
  const { theme } = useStore()
  return (
    <span className="uc-chip">
      <span className="uc-chip__dot" style={{ background: getUseCaseColor(id, theme) }} aria-hidden="true" />
      {getUseCase(id).label}
    </span>
  )
}
