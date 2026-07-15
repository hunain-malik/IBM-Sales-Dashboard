import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages the app is served from https://<user>.github.io/ibm-sales-dashboard/,
// so assets must resolve under that sub-path. Locally we keep the root base so
// `npm run dev` / `npm run preview` still serve from http://localhost:<port>/.
// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/ibm-sales-dashboard/' : '/',
  plugins: [react()],
})
