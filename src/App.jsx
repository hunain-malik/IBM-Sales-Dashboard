import { useEffect, useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  Content,
  Theme,
} from '@carbon/react'
import { Asleep, Light, Renew, TrashCan, UserAvatar } from '@carbon/icons-react'
import { useStore, SHARED_MODE } from './data/store.jsx'
import AdminResetModal from './components/AdminResetModal.jsx'
import NameModal from './components/NameModal.jsx'
import ActivityLogModal from './components/ActivityLogModal.jsx'
import Enablements from './pages/Enablements.jsx'
import Pipeline from './pages/Pipeline.jsx'
import Impact from './pages/Impact.jsx'
import OnePager from './pages/OnePager.jsx'
import Glossary from './pages/Glossary.jsx'

// Impact summary IS the landing page — one unambiguous page to show
// leadership; the other two tabs feed it.
const NAV = [
  { path: '/', label: 'Pipeline View' },
  { path: '/enablements', label: 'Enablements' },
  { path: '/pipeline', label: 'Deals' },
]

const SYNC_LABEL = {
  loading: 'Loading…',
  saving: 'Saving…',
  saved: 'Saved',
  offline: 'Offline — changes not saved',
}

// Deployed links are frozen snapshots (the URL pins the exact build commit),
// so an old bookmark keeps old wording forever even though the shared data
// stays live. Each deployed build knows its own source commit; on load it
// asks GitHub what the newest deployed build is, and when they differ it
// offers a direct link to the fresh copy. Local/dev builds skip the check.
const BUILD_SHA = import.meta.env.VITE_BUILD_SHA || ''
const SITE_BRANCH_API = 'https://api.github.com/repos/hunain-malik/IBM-Sales-Dashboard/branches/site'

function useLatestBuildUrl() {
  const [latestUrl, setLatestUrl] = useState(null)
  useEffect(() => {
    if (!BUILD_SHA) return
    fetch(SITE_BRANCH_API)
      .then((r) => (r.ok ? r.json() : null))
      .then((branch) => {
        const built = branch?.commit?.commit?.message?.match(/Deploy dashboard build ([0-9a-f]{40})/)
        if (built && built[1] !== BUILD_SHA) {
          setLatestUrl(`https://rawcdn.githack.com/hunain-malik/IBM-Sales-Dashboard/${branch.commit.sha}/index.html`)
        }
      })
      .catch(() => {}) // no signal, no banner — never block the app on this
  }, [])
  return latestUrl
}

export default function App() {
  const { theme, setTheme, resetToDemo, syncStatus, userName, lastEdited } = useStore()
  const location = useLocation()
  const dark = theme === 'g100'
  const latestUrl = useLatestBuildUrl()
  const [adminReset, setAdminReset] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  // first visit in shared mode: ask who this is before they enter records
  const firstRun = SHARED_MODE && !userName

  return (
    <>
      <Theme theme="g100">
        <Header aria-label="IBM Outbound Pipeline View">
          <SkipToContent />
          <HeaderName as={Link} to="/" prefix="IBM">
            Outbound Pipeline View
          </HeaderName>
          <HeaderNavigation aria-label="Dashboard navigation">
            {NAV.map((item) => (
              <HeaderMenuItem
                key={item.path}
                as={Link}
                to={item.path}
                isActive={location.pathname === item.path}
              >
                {item.label}
              </HeaderMenuItem>
            ))}
          </HeaderNavigation>
          <HeaderGlobalBar>
            {SHARED_MODE && lastEdited && (
              <button
                type="button"
                className="sync-badge sync-badge--button"
                title="Open the activity log"
                onClick={() => setLogOpen(true)}
              >
                Last edited by {lastEdited.name}
              </button>
            )}
            {SHARED_MODE && syncStatus && (
              <span
                className={`sync-badge${syncStatus === 'offline' ? ' sync-badge--offline' : ''}`}
                role="status"
              >
                {SYNC_LABEL[syncStatus]}
              </span>
            )}
            {!SHARED_MODE && (
              <HeaderGlobalAction
                aria-label="Reset demo data"
                tooltipAlignment="end"
                onClick={() => {
                  if (window.confirm('Reset the dashboard to the demo dataset? Manually entered records will be removed.')) {
                    resetToDemo()
                  }
                }}
              >
                <Renew size={20} />
              </HeaderGlobalAction>
            )}
            {SHARED_MODE && (
              <HeaderGlobalAction
                aria-label="Change your name"
                tooltipAlignment="end"
                onClick={() => setNameOpen(true)}
              >
                <UserAvatar size={20} />
              </HeaderGlobalAction>
            )}
            {/* wiping the shared live store requires the administration key */}
            {SHARED_MODE && (
              <HeaderGlobalAction
                aria-label="Reset all data (administration)"
                tooltipAlignment="end"
                onClick={() => setAdminReset(true)}
              >
                <TrashCan size={20} />
              </HeaderGlobalAction>
            )}
            <HeaderGlobalAction
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              tooltipAlignment="end"
              onClick={() => setTheme(dark ? 'white' : 'g100')}
            >
              {dark ? <Light size={20} /> : <Asleep size={20} />}
            </HeaderGlobalAction>
          </HeaderGlobalBar>
        </Header>
      </Theme>
      <Theme theme={theme} className="app-theme">
        <Content className="app-content">
          {latestUrl && (
            <div className="stale-banner" role="status">
              You&apos;re viewing an older copy of this dashboard.{' '}
              <a href={latestUrl}>Open the latest version</a> — all data carries over automatically.
            </div>
          )}
          <Routes>
            <Route path="/" element={<Impact />} />
            <Route path="/enablements" element={<Enablements />} />
            <Route path="/pipeline" element={<Pipeline />} />
            {/* old bookmark support */}
            <Route path="/impact" element={<Impact />} />
            <Route path="/onepager" element={<OnePager />} />
            <Route path="/glossary" element={<Glossary />} />
          </Routes>
          <AdminResetModal open={adminReset} onClose={() => setAdminReset(false)} />
          <ActivityLogModal open={logOpen} onClose={() => setLogOpen(false)} />
          <NameModal
            open={firstRun || nameOpen}
            firstRun={firstRun}
            onClose={() => setNameOpen(false)}
          />
        </Content>
      </Theme>
    </>
  )
}
