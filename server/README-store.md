# The shared data store

Everyone who opens the dashboard reads and writes ONE shared JSON document.
`server/shared-blob-url.txt` holds that document's URL; the deploy bakes it
into the built site. The contract is deliberately dumb so providers are
swappable:

- `GET <url>` → returns the document `{version, enablements, deals}`
  (a brand-new path may return `null`; the app treats that as an empty store)
- `PUT <url>` with a JSON body → replaces the document

## Current provider: Firebase Realtime Database (REST)

History: the store previously lived on jsonblob.com, a free anonymous host,
which permanently lost two stores in a month (July and August 2026). The
committed 6-hour backups made both incidents recoverable, but the lesson
stuck — the store now lives in a Firebase project the team owns.

Setup (once):

1. Go to console.firebase.google.com → **Create a project** (any name,
   Google Analytics off).
2. Build → **Realtime Database** → Create database → United States →
   **locked mode** → Enable.
3. On the **Rules** tab, replace the rules with the block below and press
   **Publish** — this opens exactly one path (`/outbound`), keeping the rest
   of the database locked, and hardens writes on that path:

   ```json
   {
     "rules": {
       "outbound": {
         ".read": true,
         ".write": "newData.exists() && newData.child('version').isNumber() && (!data.exists() || newData.child('version').val() === data.child('version').val() + 1)"
       }
     }
   }
   ```

   What the write rule enforces, server-side:
   - the store can never be DELETED outright (`newData.exists()`);
   - every write must carry a numeric `version` exactly one higher than the
     stored one — real compare-and-swap, so two people saving simultaneously
     can no longer clobber each other even in the pre-flight race window,
     and a vandal must at minimum read the document first;
   - junk-shaped writes (no version) are rejected.

   What it does NOT do: reads stay public, and anyone who has the URL and
   follows the version contract can still write — full lockdown would need
   Firebase Auth sign-in for the whole team (a deliberate future step, or
   part of the enterprise migration). The 6-hour backups remain the net.

4. Copy the database URL from the Data tab (looks like
   `https://<project>-default-rtdb.firebaseio.com/`).
5. Commit `https://<project>-default-rtdb.firebaseio.com/outbound.json`
   (note the `/outbound.json` suffix, no trailing slash) as the only line of
   `server/shared-blob-url.txt`, and push. The deploy verifies the store
   answers, seeds it from `server/data-backup.json` if a recovery marker is
   armed, and builds the site against it.

Trust model: the URL is public in the built site (as it was with jsonblob),
so anyone with the link can read and write the data — acceptable for this
dashboard, same as before. The in-app "Reset all data" stays gated by the
administration key.

## Safety nets (unchanged)

- `backup-data.yml` snapshots the store into `server/data-backup.json`
  every 6 hours (committed only when changed).
- `recover-data.yml` (manual) merges a previous store URL — or the committed
  backup when the URL input is left blank — into the current store.
- The deploy REFUSES to run against a store that stops answering, and never
  creates a replacement on its own. To rotate deliberately: empty
  `shared-blob-url.txt`, put the new URL in it, and arm
  `server/RECOVER_FROM.txt` with the word `backup` to seed the new store
  from the last snapshot (the marker self-deletes after one run).
