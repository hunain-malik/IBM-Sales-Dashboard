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
