import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build with relative asset paths ('./') so the bundle works when served from
// any sub-path — the `site` branch via raw.githack.com, GitHub Pages, or a
// plain static host — without knowing the host prefix ahead of time. Routing is
// hash-based (HashRouter), so no server rewrites are needed either.
// Dev server keeps root base so `npm run dev` works normally.
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
}))
