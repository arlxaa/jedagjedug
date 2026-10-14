import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// NOTE: Spotify requires the loopback IP 127.0.0.1 (not "localhost") in the
// redirect URI, so we bind the dev server to 127.0.0.1 on port 5173.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    // Fail loudly instead of silently moving to 5174 — the Spotify redirect
    // URI is registered for 5173, so a different port breaks the login.
    strictPort: true,
  },
})
