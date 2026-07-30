import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { seedEnablements, seedDeals } from './seed.js'

// Two persistence modes:
//
// - STANDALONE (no VITE_API_URL at build time): the original behavior —
//   browser localStorage, seeded with the demo dataset, reset-to-demo control
//   in the header. This is what the public static demo runs.
//
// - SHARED (VITE_API_URL set): the store syncs one shared document with the
//   tiny REST backend in server/server.mjs. The server is the source of
//   truth; localStorage is only a read cache for instant first paint. No demo
//   seed, no reset control. Mutations apply locally at once (the UI never
//   waits on the network), are queued, and are saved debounced; a 409 from
//   the server (someone else saved first) adopts the server document,
//   re-applies the queued mutations on top, and retries — so two people
//   entering records at the same time both keep their entries. A poll picks
//   up other people's changes without a refresh.
const API_URL = import.meta.env.VITE_API_URL || ''
// 'server' = our server/server.mjs (real 409 conflict handling).
// 'blob'   = a dumb JSON-document store (e.g. jsonblob.com): GET returns the
//            document, PUT overwrites it, no server-side version check — so
//            the compare-and-swap is emulated client-side with a pre-flight
//            read before every save.
const API_KIND = import.meta.env.VITE_API_KIND || 'server'
export const SHARED_MODE = Boolean(API_URL)

// v2: enablements gained `hours`, deals gained `closeDate`.
// v3: seed gained scheduled (future-dated) sessions for the upcoming strip;
// bumping the key re-seeds browsers that stored the old demo data.
const DATA_KEY = 'enablement-dashboard-data-v3'
const CACHE_KEY = 'enablement-dashboard-shared-cache-v1'
const THEME_KEY = 'enablement-dashboard-theme'
const SAVE_DEBOUNCE_MS = 500

// ?pollMs=2000 lets integration tests speed up cross-client refresh
const POLL_MS = (() => {
  const n = Number(new URLSearchParams(window.location.search).get('pollMs'))
  return Number.isFinite(n) && n >= 500 ? n : 20000
})()

const StoreContext = createContext(null)

const validDoc = (d) => d && Array.isArray(d.enablements) && Array.isArray(d.deals)

function loadLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DATA_KEY))
    if (validDoc(parsed)) return { enablements: parsed.enablements, deals: parsed.deals }
  } catch {
    // corrupted storage falls through to seed
  }
  return { enablements: seedEnablements, deals: seedDeals }
}

function loadCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (validDoc(parsed)) return { enablements: parsed.enablements, deals: parsed.deals }
  } catch {
    // no cache yet
  }
  return { enablements: [], deals: [] }
}

const newId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`)

export function StoreProvider({ children }) {
  const [data, setData] = useState(() => (SHARED_MODE ? loadCache() : loadLocal()))
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'white')
  // null in standalone mode; 'loading' | 'saving' | 'saved' | 'offline' when shared
  const [syncStatus, setSyncStatus] = useState(SHARED_MODE ? 'loading' : null)

  // ---- shared-mode sync engine -------------------------------------------
  const versionRef = useRef(0) // last server version we based our data on
  const baseRef = useRef({ enablements: [], deals: [] }) // server doc at that version
  const pendingRef = useRef([]) // mutation fns not yet confirmed by the server
  const savingRef = useRef(false)
  const saveTimer = useRef(null)

  const applyAll = (fns, doc) => fns.reduce((d, fn) => fn(d), doc)

  const putJson = (body) =>
    fetch(API_URL, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  const docVersion = (d) => (Number.isInteger(d?.version) ? d.version : 0)
  const asDoc = (d) => (validDoc(d) ? { enablements: d.enablements, deals: d.deals } : { enablements: [], deals: [] })

  // Save `doc` on top of `baseVersion`. Resolves { version } on success or
  // { conflict, server } when someone else saved first; throws on network or
  // server errors.
  const persist = async (doc, baseVersion) => {
    if (API_KIND === 'blob') {
      // no server-side version check — emulate compare-and-swap with a
      // pre-flight read (a small race window remains; acceptable for a small
      // team saving whole documents seconds apart)
      const cur = await fetch(API_URL)
      if (!cur.ok) throw new Error(`load failed (${cur.status})`)
      const remote = await cur.json()
      if (docVersion(remote) !== baseVersion) return { conflict: true, server: remote }
      const res = await putJson({ version: baseVersion + 1, ...doc })
      if (!res.ok) throw new Error(`save failed (${res.status})`)
      return { version: baseVersion + 1 }
    }
    const res = await putJson({ version: baseVersion, ...doc })
    if (res.status === 409) return { conflict: true, server: await res.json() }
    if (!res.ok) throw new Error(`save failed (${res.status})`)
    return { version: (await res.json()).version }
  }

  const doSave = async () => {
    if (!SHARED_MODE || savingRef.current || pendingRef.current.length === 0) return
    savingRef.current = true
    setSyncStatus('saving')
    // snapshot: mutations added while this request is in flight stay queued
    const count = pendingRef.current.length
    const doc = applyAll(pendingRef.current.slice(0, count), baseRef.current)
    try {
      const result = await persist(doc, versionRef.current)
      if (result.conflict) {
        // someone else saved first: adopt their document, replay our queued
        // mutations on top, and try again from the new version
        versionRef.current = docVersion(result.server)
        baseRef.current = asDoc(result.server)
        setData(applyAll(pendingRef.current, baseRef.current))
        savingRef.current = false
        return doSave()
      }
      versionRef.current = result.version
      baseRef.current = doc
      pendingRef.current = pendingRef.current.slice(count)
      savingRef.current = false
      if (pendingRef.current.length) return doSave()
      setSyncStatus('saved')
    } catch {
      savingRef.current = false
      setSyncStatus('offline') // queued mutations retry on the next poll tick
    }
  }

  useEffect(() => {
    if (!SHARED_MODE) return undefined
    let stopped = false
    const refresh = async (first) => {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(`load failed (${res.status})`)
        const server = await res.json()
        if (stopped || !validDoc(server)) return
        if (first || server.version !== versionRef.current) {
          versionRef.current = server.version
          baseRef.current = { enablements: server.enablements, deals: server.deals }
          setData(applyAll(pendingRef.current, baseRef.current))
        }
        if (pendingRef.current.length) doSave() // recover queued saves after offline
        else setSyncStatus('saved')
      } catch {
        if (!stopped) setSyncStatus('offline')
      }
    }
    refresh(true)
    const timer = setInterval(() => {
      if (!savingRef.current) refresh(false)
    }, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [])

  // ---- persistence side effects ------------------------------------------
  useEffect(() => {
    if (SHARED_MODE) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data)) // read cache only
    } else {
      localStorage.setItem(DATA_KEY, JSON.stringify(data))
    }
  }, [data])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.dataset.carbonTheme = theme
  }, [theme])

  // every mutation goes through here: instant local apply, then queued save.
  // Mutation fns must be deterministic (ids generated BEFORE queuing) so a
  // 409 replay produces identical records.
  const mutate = (fn) => {
    if (SHARED_MODE) {
      pendingRef.current.push(fn)
      // the badge must say "Saving…" from the moment the change exists, not
      // from when the debounced request fires — "Saved" may never lie
      setSyncStatus('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(doSave, SAVE_DEBOUNCE_MS)
    }
    setData((d) => fn(d))
  }

  // closing or backgrounding the tab inside the debounce window must not lose
  // the queued change — fire a keepalive save immediately
  useEffect(() => {
    if (!SHARED_MODE) return undefined
    const flush = () => {
      if (pendingRef.current.length === 0 || savingRef.current) return
      const doc = applyAll(pendingRef.current, baseRef.current)
      fetch(API_URL, {
        method: 'PUT',
        keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ version: versionRef.current, ...doc }),
      }).catch(() => {})
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const api = useMemo(
    () => ({
      enablements: data.enablements,
      deals: data.deals,
      theme,
      setTheme,
      syncStatus,
      addEnablement: (e) => {
        const rec = { ...e, id: newId() }
        mutate((d) => ({ ...d, enablements: [...d.enablements, rec] }))
      },
      updateEnablement: (id, patch) =>
        mutate((d) => ({
          ...d,
          enablements: d.enablements.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeEnablement: (id) =>
        mutate((d) => ({ ...d, enablements: d.enablements.filter((e) => e.id !== id) })),
      addDeal: (deal) => {
        const rec = { ...deal, id: newId() }
        mutate((d) => ({ ...d, deals: [...d.deals, rec] }))
      },
      updateDeal: (id, patch) =>
        mutate((d) => ({
          ...d,
          deals: d.deals.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeDeal: (id) =>
        mutate((d) => ({ ...d, deals: d.deals.filter((x) => x.id !== id) })),
      // standalone-only (the header hides it in shared mode)
      resetToDemo: () => setData({ enablements: seedEnablements, deals: seedDeals }),
      // key-gated admin reset: goes through mutate so in shared mode the wipe
      // syncs to the store and reaches every other open browser
      clearAll: () => mutate(() => ({ enablements: [], deals: [] })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, theme, syncStatus],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
