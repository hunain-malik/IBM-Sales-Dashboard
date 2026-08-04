import { Button } from '@carbon/react'
import { Email } from '@carbon/icons-react'
import { useStore } from '../data/store.jsx'
import { todayIso, sessionRequestMailto, getProductColor, getProduct } from '../data/constants.js'
import UseCaseChip from './UseCaseChip.jsx'

const DAY_MS = 24 * 60 * 60 * 1000

// The forward-looking strip for sellers: sessions scheduled but not yet
// delivered, plus a pre-filled email to ask for one that isn't on the
// calendar. Scheduled sessions never count in delivered totals — this strip
// and the calendar are the only places they appear.
export default function UpcomingSessions() {
  const { enablements, theme } = useStore()
  const today = todayIso()
  const upcoming = enablements
    .filter((e) => e.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const inDays = (iso) => {
    const days = Math.round((new Date(`${iso}T00:00:00`) - new Date(`${today}T00:00:00`)) / DAY_MS)
    return days === 1 ? 'tomorrow' : `in ${days} days`
  }

  return (
    <div className="chart-card">
      <div className="up-head">
        <h4 className="section-title">Upcoming sessions</h4>
        <Button kind="ghost" size="sm" renderIcon={Email} href={sessionRequestMailto()}>
          Request a session
        </Button>
      </div>
      {upcoming.length ? (
        <div className="up-strip">
          {upcoming.map((s) => {
            const d = new Date(`${s.date}T00:00:00`)
            return (
              <div
                key={s.id}
                className="up-card"
                style={{ borderLeftColor: getProductColor(s.product, theme) }}
              >
                <div className="up-card__date" aria-hidden="true">
                  <span className="up-card__day">{d.getDate()}</span>
                  <span className="up-card__month">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                </div>
                <div className="up-card__body">
                  <div className="up-card__title">{s.title}</div>
                  <UseCaseChip record={s} />
                  <div className="up-card__meta">
                    {getProduct(s.product) ? `${getProduct(s.product).label} · ` : ''}
                    {s.presenter ? `${s.presenter} · ` : ''}{inDays(s.date)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="up-empty">Nothing scheduled yet — request a session for your account or use case.</p>
      )}
    </div>
  )
}
