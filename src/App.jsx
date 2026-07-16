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
import { Asleep, Light, Renew } from '@carbon/icons-react'
import { useStore } from './data/store.jsx'
import Enablements from './pages/Enablements.jsx'
import Pipeline from './pages/Pipeline.jsx'
import Impact from './pages/Impact.jsx'
import OnePager from './pages/OnePager.jsx'

// Impact summary IS the landing page — one unambiguous page to show
// leadership; the other two tabs feed it.
const NAV = [
  { path: '/', label: 'Impact summary' },
  { path: '/enablements', label: 'Enablements' },
  { path: '/pipeline', label: 'Pipeline' },
]

// The IBM 8-bar mark: "IBM" lettering masked by eight horizontal stripes.
function IbmLogo() {
  return (
    <svg
      className="ibm-logo"
      width="52"
      height="26"
      viewBox="0 0 64 32"
      aria-label="IBM"
      role="img"
    >
      <mask id="ibm-8bar">
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="0" y={i * 4} width="64" height="2.6" fill="#ffffff" />
        ))}
      </mask>
      <text
        x="0"
        y="28.5"
        fontFamily="'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="700"
        fontSize="32"
        letterSpacing="-0.5"
        fill="currentColor"
        mask="url(#ibm-8bar)"
      >
        IBM
      </text>
    </svg>
  )
}

export default function App() {
  const { theme, setTheme, resetToDemo } = useStore()
  const location = useLocation()
  const dark = theme === 'g100'

  return (
    <>
      <Theme theme="g100">
        <Header aria-label="IBM Enablement Impact">
          <SkipToContent />
          <HeaderName as={Link} to="/" prefix="">
            <IbmLogo />
            <span className="brand-name">Enablement Impact</span>
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
          <Routes>
            <Route path="/" element={<Impact />} />
            <Route path="/enablements" element={<Enablements />} />
            <Route path="/pipeline" element={<Pipeline />} />
            {/* old bookmark support */}
            <Route path="/impact" element={<Impact />} />
            <Route path="/onepager" element={<OnePager />} />
          </Routes>
        </Content>
      </Theme>
    </>
  )
}
