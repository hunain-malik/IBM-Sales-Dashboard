# Update prompt — Outbound rename · shared storage · admin reset · session ties

Copy everything below the line into BOB as a follow-up to the dashboard it already built.
These are INCREMENTAL changes to the existing app. Apply them in the order given. Do not
rebuild or restyle anything not named here. Reference implementations of the hardest parts
are included verbatim in the appendices — follow them exactly, adapting only import paths.

---

Apply the following five upgrades to the dashboard, in this order.

## 1. Product rename: "GTM" → "Outbound" (everywhere, zero exceptions)

The product is now the **Outbound Pipeline View**. Replace every occurrence of "GTM" in
user-visible text, using sentence-position-aware capitalization: **"Outbound-touched"**
when it starts a label, heading, or sentence; **"outbound-touched"** mid-sentence.
Exact strings:

- Header brand: `IBM` prefix + **"Outbound Pipeline View"**; header aria-label
  "IBM Outbound Pipeline View"; browser tab `<title>Outbound Pipeline View</title>`;
  landing `h1` **"Outbound Pipeline View"**.
- KPI labels: `Outbound-touched deals` · `Outbound-touched revenue (closed won)` ·
  `Outbound-touched open pipeline` · `Outbound-touched value per team hour`.
- Section titles: `Deal performance: outbound-touched vs. untouched` ·
  `Outbound-touched pipeline opened by month` · table title `Outbound-touched deals` ·
  empty state `No outbound-touched deals yet`.
- Comparison legend: `Outbound-touched (n=X)` / `No outbound touch (n=Y)`.
- Deals page: column header `Outbound touch`; purple tag **"Outbound touched"**; empty
  state `Add the first customer deal — if a session on its use case came first, it is
  tagged Outbound touched automatically.`
- Timeline legend: `Outbound-touched deal (opened after a session)`; tooltips
  `Outbound touched — session: {title} ({date})` and
  `Outbound touched — carried from {Qn YYYY}: {title} ({date})`.
- One-pager: eyebrow `IBM · Outbound Pipeline View`; KPI labels as above (value/hour label
  keeps its `(Xh invested)` suffix); table headers `Outbound-touched (n=X)` /
  `No outbound touch (n=Y)`; section `Top outbound-touched deals`; footer
  `Method: a deal is counted as outbound-touched when an enablement session on the same
  use case preceded the deal's open date. …` and `… page of the Outbound Pipeline View.`
- Insights engine — every generated sentence, verbatim:
  small-sample caveat `Small sample (X outbound-touched vs Y not) — read as an early
  signal, not a proven effect.`; empty states `No enablement sessions logged yet, so no
  deals count as outbound-touched.` and `No tracked deals have followed a session yet —
  no outbound touchpoints to report.`; headlines `Outbound-touched deals outperform: …` /
  `Mixed results: outbound-touched deals show …, but …` / `Outbound-touched deals aren't
  outperforming yet: …` / `On what can be measured so far, outbound-touched and untouched
  deals look similar — close more deals to compare win rate and cycle length.` /
  `Outbound-touched and untouched deals are performing about the same so far.`; ask
  `Review the outbound-touched deals that stalled or lost — check whether session timing,
  content, or audience needs adjusting before scaling up.`; tone headings
  `Outbound-touched deals perform better` / `Outbound-touched deals: mixed results` /
  `Outbound-touched deals: no edge yet` / `Outbound-touched deals: on par so far`.
- Glossary: term `Outbound-touched deal`; metric names `Outbound-touched deals (X of Y)`,
  `Outbound-touched revenue (closed won)`, `Outbound-touched open pipeline`,
  `Outbound-touched value per team hour`, `Outbound-touched pipeline by month`; formulas
  `count of outbound-touched deals ÷ all tracked deals`, `Σ value of outbound-touched
  deals in Closed Won`, `Σ value of outbound-touched deals in open stages`; win-rate note
  `Computed separately for the outbound-touched and untouched groups; …`; counting-rule
  diagram labels `→ Outbound-touched` and `Deal counted as outbound-touched`.

**Acceptance:** the string "GTM" appears NOWHERE in any rendered page, tooltip, tag,
generated sentence, or the tab title.

## 2. Shared persistent storage (the data follows the link, not the browser)

Today every browser keeps its own localStorage copy, so entries vanish for other users.
Replace persistence so ALL users of the dashboard read and write ONE shared dataset.

**2.1 Backend.** Host the single-file Node service in Appendix A on any internal runtime.
It stores one JSON document `{ version, enablements[], deals[] }` with optimistic
concurrency: `GET /api/data` returns the document (empty `{version:0,enablements:[],
deals:[]}` if nothing stored); `PUT /api/data` must carry the version the client based its
change on — matching version saves as `version + 1` and returns `{version}`, a stale
version returns **409 plus the current document**; `DELETE /api/data` resets to empty
(admin/testing only). Storage in the reference is an atomic-write JSON file behind a write
queue; you may swap `load`/`store` for an internal database WITHOUT changing the HTTP
contract. Enable CORS for the dashboard's origin.

**2.2 Frontend sync engine.** Follow Appendix B exactly. The essential behaviors:
- A build-time config value (`VITE_API_URL`) switches the store into shared mode; without
  it the app behaves as before (local dev). In shared mode there is NO demo seed — the
  store starts from whatever the server returns (the designed empty states show on a
  fresh store) — and the old "reset demo data" header control is REMOVED.
- Every mutation applies to the UI instantly, is queued as a deterministic function
  (record ids are minted BEFORE queuing so replays produce identical records), and is
  saved debounced ~500 ms as the full document with the base version.
- On 409: adopt the server's document, replay the entire queued-mutation list on top,
  retry — two people entering records simultaneously must BOTH keep their entries.
- While a save is in flight, new mutations keep queuing; on success only the snapshot
  that was sent is dequeued and a follow-up save fires for the remainder.
- Poll `GET` every 20 s (support a `?pollMs=` URL override, minimum 500, for tests); if
  the server version is newer, adopt it (re-applying any queued mutations) — this is how
  one user sees another's entries without refreshing. A successful poll with queued
  mutations also retries the save (offline recovery).
- localStorage is kept only as a read cache (separate key) for instant first paint; the
  server is the source of truth. On `pagehide`, flush any queued mutations with a
  `keepalive` fetch so closing the tab inside the debounce window cannot lose an entry.
- Header sync badge (small text in the header global bar, 0.75 rem, #a8a8a8, offline
  state #ff8389), exact labels: `Loading…` → `Saving…` → `Saved` /
  `Offline — changes not saved`. CRITICAL honesty rule: the badge flips to "Saving…" the
  INSTANT a change exists (not when the debounced request fires) and shows "Saved" only
  after the server confirms. On failure it settles on the offline label and the queued
  change retries automatically on the next successful poll.

**Acceptance:** add a record → hard-refresh → still there; open a second browser → same
data on load; add in one browser → appears in the other within one poll cycle without
reloading; two browsers adding simultaneously → both records survive (conflict replay);
kill the API → badge warns, entry stays visible locally; restore the API → entry saves
automatically and the badge returns to Saved.

## 3. Key-gated "Reset all data" (in-app admin wipe)

- Add a trash-can icon action to the header global bar (shared mode only), aria-label
  **"Reset all data (administration)"**. It opens the Carbon **danger** modal in
  Appendix C: label "Administration", heading "Reset all data", body text `This
  permanently deletes every enablement session and customer deal for everyone using this
  dashboard. Enter the administration key to confirm.`, a Carbon `PasswordInput` labeled
  "Administration key" (import `PasswordInput` directly from @carbon/react — NOT
  `TextInput.PasswordInput`, which is undefined and crashes the app), danger primary
  button "Reset all data" (disabled while the field is empty), secondary "Cancel".
- Verification: compare the SHA-256 hex digest of the entered key (via
  `crypto.subtle.digest`) against a constant `ADMIN_KEY_HASH` — only the HASH ships in
  the bundle, never the plaintext. Wrong key → inline error `Incorrect administration
  key.`, nothing else happens. Correct key → clear the store to empty THROUGH the synced
  mutation path (so the wipe saves to the server and reaches every open browser within a
  poll cycle), then close the modal.
- Ask the team lead to choose the key; generate its hash with:
  `crypto.subtle.digest('SHA-256', new TextEncoder().encode('the-key')).then(b =>
  console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))`
  and paste the output into `ADMIN_KEY_HASH` (document this rotation snippet in a code
  comment next to the constant).

**Acceptance:** wrong key rejected with the data intact; correct key empties the server
document and a second open browser goes empty without reloading.

## 4. Outdated-copy notice (ONLY if your deployment produces frozen per-version URLs)

If each deployment of the dashboard gets an immutable URL (versioned snapshots), old
bookmarks keep old wording forever even though the shared data stays live. In that case:
bake the build's own version identifier into the bundle at build time; on load, fetch
what the newest deployed version is (from wherever your pipeline records it); when they
differ, render a notice at the top of the content area — background layer-01, 3px solid
#f1c21b left border, 0.75rem×1rem padding, 0.875rem text: `You're viewing an older copy
of this dashboard. ` + link `Open the latest version` + ` — all data carries over
automatically.` The check must be completely silent on failure and absent in local
builds. If your deployment serves ONE stable URL that updates in place, SKIP this
section entirely.

## 5. Tie a deal to a specific session

The automatic rule always matches a deal to the EARLIEST session on its use case, with no
way to record which session the deal actually came out of. Add an optional manual tie:

- **Data:** a deal gains an optional `sourceSessionId` field (absent = automatic).
- **Attribution:** compute the eligible matched list exactly as before (same use case,
  session date ≤ deal open date, sorted ascending). If `sourceSessionId` is set AND that
  session is in the list, move it to the FRONT — `matched[0]` is what every view shows.
  A stale tie (session deleted, or no longer eligible after a date/use-case edit)
  silently falls back to automatic: eligibility never loosens, so a manual tie can never
  create a match the counting rule wouldn't count.
- **Deal form** (between "Deal open date" and "Stage", rendered ONLY when at least one
  eligible session exists): a Carbon Dropdown, titleText `Tie to a specific session
  (optional)`, helperText `Pick a different session if the deal came out of a later
  one.` The FIRST option is the automatic default and NAMES the session the rule
  resolves to: `Automatic — {earliest session title} ({Mon D, YYYY})`. The remaining
  options are the OTHER eligible sessions (`{title} — {Mon D, YYYY}`) — the earliest
  session must NOT appear a second time in the list (choosing it manually would be the
  same choice twice). The list recomputes when use case or open date changes; a selection
  that becomes ineligible — or that points at the earliest session — reads as Automatic
  and is saved as an absent field.
- **Display:** rename the column "First matching session" → **"Matched session"** on the
  landing deals table AND the one-pager top-deals table. The `delivered {date}` sub-line
  gains the suffix ` · tied manually` when (and only when) the shown session is a manual
  tie. "Days from session to deal" computes from the matched (possibly tied) session.
- **Timeline:** a manually tied deal ALWAYS links to its tied session — solid curve when
  that session is in the viewed quarter, otherwise the dashed carried-from-earlier-
  quarter treatment anchored to the tied session's quarter. Automatic deals keep the
  existing behavior (prefer a session inside the viewed quarter).
- **Glossary:** rename the term to **"Matched session"** with this definition: `The
  session shown for a touched deal, with its delivery date ("delivered Feb 10, 2026").
  By default it is the earliest eligible session — same use case, delivered on or before
  the open date. When logging or editing a deal, it can instead be tied to any other
  eligible session; those show "tied manually". A tie that becomes ineligible falls back
  to automatic.` And "Days from session to deal" becomes `Deal open date minus the
  matched session's delivery date, in days.`

**Acceptance:** for a deal whose use case has two delivered sessions plus one scheduled
(future) session, the dropdown offers exactly two entries — the named Automatic and the
one later session (the scheduled one excluded); tying to the later session updates the
table, the day count, and the timeline curve, and shows "tied manually"; editing back to
Automatic restores the earliest match unflagged; existing deals are unaffected.

## Final regression sweep (run after all five)

1. Zero "GTM" strings anywhere (section 1).
2. Scheduled (future-dated) sessions still excluded from all delivered totals.
3. The loaded-language ban still holds: "influenced", "attributed", "credit", "drove"
   appear nowhere in visible text.
4. All shared-storage acceptance checks (section 2) pass after the other changes.
5. The one-pager still prints on one page with its renamed headings.

---

# Appendix A — reference backend (`server/server.mjs`), use verbatim

```js
import http from 'node:http'
import { readFile, writeFile, rename } from 'node:fs/promises'

// Shared-store API for the Outbound Pipeline View. One resource: a single JSON
// document { version, enablements[], deals[] } with optimistic concurrency —
// a PUT must carry the version it was based on; a stale version gets 409 plus
// the current document so the client can merge and retry. Storage is a JSON
// file on disk (atomic tmp+rename writes, serialized through a queue), which
// is all a small team needs; swap `load`/`store` for a database call without
// touching the HTTP contract.
//
//   GET    /api/data  -> { version, enablements, deals }
//   PUT    /api/data  <- { version, enablements, deals }
//                     -> 200 { version: n+1 } | 409 current document
//   DELETE /api/data  -> resets to the empty document (testing / clean handover)
//
// Env: PORT (default 8787), DATA_FILE (default ./data.json next to this file).

const PORT = Number(process.env.PORT) || 8787
const DATA_FILE = process.env.DATA_FILE || new URL('./data.json', import.meta.url).pathname
const EMPTY = { version: 0, enablements: [], deals: [] }

// serialize all writes so concurrent PUTs can't interleave file operations
let queue = Promise.resolve()
const enqueue = (fn) => {
  const run = queue.then(fn, fn)
  queue = run.catch(() => {})
  return run
}

async function load() {
  try {
    const doc = JSON.parse(await readFile(DATA_FILE, 'utf8'))
    if (Number.isInteger(doc.version) && Array.isArray(doc.enablements) && Array.isArray(doc.deals)) return doc
  } catch {
    // missing or corrupt file falls through to the empty document
  }
  return EMPTY
}

async function store(doc) {
  const tmp = `${DATA_FILE}.tmp`
  await writeFile(tmp, JSON.stringify(doc, null, 2))
  await rename(tmp, DATA_FILE)
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
}

const server = http.createServer(async (req, res) => {
  const send = (code, body) => {
    res.writeHead(code, { 'content-type': 'application/json', ...CORS })
    res.end(JSON.stringify(body))
  }

  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS)
      return res.end()
    }
    const { pathname } = new URL(req.url, 'http://localhost')
    if (pathname !== '/api/data') return send(404, { error: 'not found' })

    if (req.method === 'GET') return send(200, await load())

    if (req.method === 'DELETE') {
      await enqueue(() => store(EMPTY))
      return send(200, EMPTY)
    }

    if (req.method === 'PUT') {
      let raw = ''
      for await (const chunk of req) raw += chunk
      let doc
      try {
        doc = JSON.parse(raw)
      } catch {
        return send(400, { error: 'invalid JSON' })
      }
      if (!Number.isInteger(doc.version) || !Array.isArray(doc.enablements) || !Array.isArray(doc.deals)) {
        return send(400, { error: 'expected { version: int, enablements: [], deals: [] }' })
      }
      return await enqueue(async () => {
        const current = await load()
        if (doc.version !== current.version) return send(409, current)
        const next = { version: current.version + 1, enablements: doc.enablements, deals: doc.deals }
        await store(next)
        return send(200, { version: next.version })
      })
    }

    return send(405, { error: 'method not allowed' })
  } catch (err) {
    return send(500, { error: String(err) })
  }
})

server.listen(PORT, () => {
  console.log(`shared-store API listening on :${PORT} (data file: ${DATA_FILE})`)
})
```

# Appendix B — reference store with the sync engine (`src/data/store.jsx`), use verbatim

Note: `VITE_API_KIND=blob` is an alternate mode for a dumb document store with no
version checking (GET returns the document, PUT overwrites) where the compare-and-swap
is emulated with a pre-flight read. With the Appendix A server you don't need it —
leave the kind unset ('server').

```jsx
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
```

# Appendix C — reference admin-reset modal (`src/components/AdminResetModal.jsx`), use verbatim

```jsx
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
```

# Appendix D — reference deal form with the session tie (`src/components/DealModal.jsx`), use verbatim

```jsx
import { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  TextInput,
  Dropdown,
  DatePicker,
  DatePickerInput,
  NumberInput,
} from '@carbon/react'
import { USE_CASES, DEAL_STAGES, fmtDate } from '../data/constants.js'
import { useStore } from '../data/store.jsx'

const blank = { customer: '', useCase: null, value: 100000, date: '', stage: 'Prospecting', owner: '', closeDate: '', sourceSessionId: '' }


// Create a new deal, or edit an existing one when `deal` is passed — stages
// change over a deal's life, and stale stages silently corrupt the win-rate
// comparison, so editing in place matters.
export default function DealModal({ open, onClose, deal = null }) {
  const { addDeal, updateDeal, enablements } = useStore()
  const [form, setForm] = useState(blank)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        deal
          ? {
              customer: deal.customer,
              useCase: USE_CASES.find((u) => u.id === deal.useCase) ?? null,
              value: deal.value,
              date: deal.date,
              stage: deal.stage,
              owner: deal.owner ?? '',
              closeDate: deal.closeDate ?? '',
              sourceSessionId: deal.sourceSessionId ?? '',
            }
          : blank,
      )
      setInvalid(false)
    }
  }, [open, deal])

  // sessions this deal COULD be tied to: same use case, delivered on or
  // before the open date — the same eligibility the counting rule uses, so a
  // manual tie can never create a match the rule wouldn't count
  const eligibleSessions = useMemo(
    () =>
      form.useCase && form.date
        ? enablements
            .filter((e) => e.useCase === form.useCase.id && e.date <= form.date)
            .sort((a, b) => a.date.localeCompare(b.date))
        : [],
    [enablements, form.useCase, form.date],
  )
  // the Automatic option names the session the timing rule resolves to (the
  // earliest eligible one), and that session is left OUT of the manual list —
  // picking it by hand would be the same choice twice
  const earliest = eligibleSessions[0] ?? null
  const autoTie = {
    id: '',
    label: earliest ? `Automatic — ${earliest.title} (${fmtDate(earliest.date)})` : 'Automatic',
  }
  const tieItems = [autoTie, ...eligibleSessions.slice(1).map((e) => ({ id: e.id, label: `${e.title} — ${fmtDate(e.date)}` }))]
  // a tie that stopped being eligible (use case / date changed) — or one that
  // points at the earliest session, which IS automatic — reads as Automatic
  // and is dropped on save
  const selectedTie = tieItems.find((i) => i.id === form.sourceSessionId) ?? autoTie

  const submit = () => {
    if (!form.customer.trim() || !form.useCase || !form.date || !(Number(form.value) > 0)) {
      setInvalid(true)
      return
    }
    const payload = {
      customer: form.customer.trim(),
      useCase: form.useCase.id,
      value: Number(form.value),
      date: form.date,
      stage: form.stage,
      owner: form.owner.trim(),
      // closeDate only makes sense on closed stages; clear it otherwise
      closeDate: form.stage.startsWith('Closed') && form.closeDate ? form.closeDate : undefined,
      sourceSessionId: selectedTie.id || undefined,
    }
    if (deal) updateDeal(deal.id, payload)
    else addDeal(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      modalHeading={deal ? 'Edit customer deal' : 'Add customer deal'}
      modalLabel="Pipeline"
      primaryButtonText={deal ? 'Save changes' : 'Add deal'}
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={submit}
    >
      <div className="form-stack">
        <TextInput
          id="deal-customer"
          labelText="Customer name"
          placeholder="e.g. Acme Financial"
          value={form.customer}
          invalid={invalid && !form.customer.trim()}
          invalidText="A customer name is required."
          onChange={(e) => setForm({ ...form, customer: e.target.value })}
        />
        <NumberInput
          id="deal-value"
          label="Deal revenue (USD)"
          min={0}
          step={10000}
          value={form.value}
          invalid={invalid && !(Number(form.value) > 0)}
          invalidText="Deal revenue must be greater than zero."
          onChange={(_e, { value }) => setForm({ ...form, value })}
        />
        <Dropdown
          id="deal-usecase"
          titleText="Use case the customer is interested in"
          label="Select a use case"
          items={USE_CASES}
          itemToString={(i) => (i ? i.label : '')}
          selectedItem={form.useCase}
          invalid={invalid && !form.useCase}
          invalidText="Pick the use case the customer is interested in."
          onChange={({ selectedItem }) => setForm({ ...form, useCase: selectedItem })}
        />
        <DatePicker
          datePickerType="single"
          dateFormat="Y-m-d"
          value={form.date ? [form.date] : []}
          onChange={(dates) => {
            const d = dates[0]
            if (d) {
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              setForm((f) => ({ ...f, date: iso }))
            }
          }}
        >
          <DatePickerInput
            id="deal-date"
            labelText="Deal open date"
            placeholder="yyyy-mm-dd"
            invalid={invalid && !form.date}
            invalidText="A deal date is required."
          />
        </DatePicker>
        {eligibleSessions.length > 0 && (
          <Dropdown
            id="deal-source-session"
            titleText="Tie to a specific session (optional)"
            helperText="Pick a different session if the deal came out of a later one."
            label={autoTie.label}
            items={tieItems}
            itemToString={(i) => (i ? i.label : '')}
            selectedItem={selectedTie}
            onChange={({ selectedItem }) => setForm({ ...form, sourceSessionId: selectedItem?.id ?? '' })}
          />
        )}
        <Dropdown
          id="deal-stage"
          titleText="Stage"
          label="Stage"
          items={DEAL_STAGES}
          selectedItem={form.stage}
          onChange={({ selectedItem }) => setForm({ ...form, stage: selectedItem })}
        />
        {form.stage?.startsWith('Closed') && (
          <DatePicker
            datePickerType="single"
            dateFormat="Y-m-d"
            value={form.closeDate ? [form.closeDate] : []}
            onChange={(dates) => {
              const d = dates[0]
              if (d) {
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                setForm((f) => ({ ...f, closeDate: iso }))
              }
            }}
          >
            <DatePickerInput
              id="deal-close-date"
              labelText="Close date"
              placeholder="yyyy-mm-dd"
            />
          </DatePicker>
        )}
        <TextInput
          id="deal-owner"
          labelText="Deal owner (optional)"
          placeholder="Seller running the deal"
          value={form.owner}
          onChange={(e) => setForm({ ...form, owner: e.target.value })}
        />
      </div>
    </Modal>
  )
}
```
