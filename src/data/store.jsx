import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { seedEnablements, seedDeals } from './seed.js'

// v2: enablements gained `hours`, deals gained `closeDate`.
const DATA_KEY = 'enablement-dashboard-data-v2'
const THEME_KEY = 'enablement-dashboard-theme'

const StoreContext = createContext(null)

function loadData() {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.enablements) && Array.isArray(parsed.deals)) return parsed
    }
  } catch {
    // corrupted storage falls through to seed
  }
  return { enablements: seedEnablements, deals: seedDeals }
}

const newId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`)

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData)
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'white')

  useEffect(() => {
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.dataset.carbonTheme = theme
  }, [theme])

  const api = useMemo(
    () => ({
      enablements: data.enablements,
      deals: data.deals,
      theme,
      setTheme,
      addEnablement: (e) =>
        setData((d) => ({ ...d, enablements: [...d.enablements, { ...e, id: newId() }] })),
      removeEnablement: (id) =>
        setData((d) => ({ ...d, enablements: d.enablements.filter((e) => e.id !== id) })),
      addDeal: (deal) =>
        setData((d) => ({ ...d, deals: [...d.deals, { ...deal, id: newId() }] })),
      updateDeal: (id, patch) =>
        setData((d) => ({
          ...d,
          deals: d.deals.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeDeal: (id) =>
        setData((d) => ({ ...d, deals: d.deals.filter((x) => x.id !== id) })),
      resetToDemo: () => setData({ enablements: seedEnablements, deals: seedDeals }),
      clearAll: () => setData({ enablements: [], deals: [] }),
    }),
    [data, theme],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
