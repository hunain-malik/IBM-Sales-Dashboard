# IBM Outbound Pipeline View

A dashboard for a technical enablement team: the enablement sessions the team
delivers and the customer deals that follow them, side by side, for a sales and
executive audience. React 19 + Vite + IBM Carbon Design System; hand-rolled SVG
charts; light and dark themes.

**Use the live dashboard:** open the
[latest release](https://github.com/hunain-malik/IBM-Sales-Dashboard/releases)
and click "Open the Outbound Pipeline View" — no install, no login. Everyone on
that link reads and writes the same shared live data.

## Working with the source

```bash
npm install
npm run dev        # local development — standalone mode (demo data,
                   # browser-local storage; the team's live data is untouched)
```

To run locally against the team's SHARED live store instead (be careful —
entries you make are real):

```bash
VITE_API_URL="$(cat server/shared-blob-url.txt)" VITE_API_KIND=blob npm run dev
```

`npm run build` accepts the same environment variables; the production build is
made by CI, not by hand (see below).

## How it fits together

- `src/` — the app. Pages: Pipeline View (landing), Enablements, Deals,
  Products, executive one-pager, Methodology & Glossary.
- `src/data/store.jsx` — the storage layer. With `VITE_API_URL` set it syncs
  one shared JSON document (queued mutations, conflict replay, 20 s polling,
  honest Saved/Saving…/Offline badge); without it, standalone demo mode.
- `server/shared-blob-url.txt` — the shared document store's URL: a Firebase
  Realtime Database REST path the team owns. Full setup, trust model, and
  rotation/recovery procedure: **`server/README-store.md`**.
- `.github/workflows/` — `deploy.yml` builds and publishes every push to the
  default branch (static site on the `site` branch, released via a sha-pinned
  link so stale caches are impossible); `backup-data.yml` snapshots the store
  into `server/data-backup.json` every 6 hours; `recover-data.yml` restores it.
- `docs/BOB-MASTER-PROMPT.md` — a self-contained build package: the complete
  spec and every source file, for rebuilding the dashboard from scratch
  elsewhere.
- `server/server.mjs` — an optional self-hosted backend implementing the same
  document contract with true server-side versioning; not used by the current
  deployment.

## Deployment

Push to the default branch and CI does the rest: verifies the shared store
answers (it refuses to deploy against a dead store and never silently creates a
replacement), builds with the store URL baked in, publishes to the `site`
branch, and updates the release link. Data safety comes from the 6-hour
backups plus the recovery workflows — see `server/README-store.md`.
