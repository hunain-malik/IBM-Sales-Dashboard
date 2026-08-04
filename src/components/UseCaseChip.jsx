import { getProductColor, getUseCaseLabel } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

// Identity swatch for a record: the dot carries the PRODUCT color (three
// products stay color-vision-safe; per-use-case hues could not), the text is
// the record's use-case label — catalog, custom, or legacy. Color is never
// the only signal.
export default function UseCaseChip({ record }) {
  const { theme } = useStore()
  return (
    <span className="uc-chip">
      <span
        className="uc-chip__dot"
        style={{ background: getProductColor(record.product, theme) }}
        aria-hidden="true"
      />
      {getUseCaseLabel(record)}
    </span>
  )
}
