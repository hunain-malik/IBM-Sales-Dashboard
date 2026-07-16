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
import Overview from './pages/Overview.jsx'
import Enablements from './pages/Enablements.jsx'
import Pipeline from './pages/Pipeline.jsx'
import Impact from './pages/Impact.jsx'
import OnePager from './pages/OnePager.jsx'

const NAV = [
  { path: '/', label: 'Overview' },
  { path: '/enablements', label: 'Enablements' },
  { path: '/pipeline', label: 'Pipeline' },
  { path: '/impact', label: 'Impact summary' },
]

export default function App() {
  const { theme, setTheme, resetToDemo } = useStore()
  const location = useLocation()
  const dark = theme === 'g100'

  return (
    <>
      <Theme theme="g100">
        <Header aria-label="IBM Enablement Impact">
          <SkipToContent />
          <HeaderName as={Link} to="/" prefix="IBM">
            Enablement Impact
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
            <Route path="/" element={<Overview />} />
            <Route path="/enablements" element={<Enablements />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/impact" element={<Impact />} />
            <Route path="/onepager" element={<OnePager />} />
          </Routes>
        </Content>
      </Theme>
    </>
  )
}
