# Tech — Club Lights

## Stack
- Vite + React + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`), custom playful theme
- Framer Motion (springy motion, confetti)
- Zustand (state)
- Canvas 2D for the light engine (WebGL/Three.js optional later)
- Web Audio API (`AnalyserNode`) for analysis
- Spotify Web API + Web Playback SDK (Premium required)
- Phase 2 only: Supabase (Postgres + Realtime) or Firebase

## Commands
- `npm run dev` — Vite dev server (default port 5173)
- `npm run build` — `tsc -b && vite build`
- `npm run preview` — serve the production build
- `npm run lint` — oxlint

## Spotify rules (do not get these wrong)
- Auth: **Authorization Code with PKCE**. Never ship a client secret.
- Redirect URI must be HTTPS or the loopback IP `http://127.0.0.1:<port>` —
  **not** `localhost`. Verify against current Spotify docs.
- `audio-features` / `audio-analysis` endpoints are closed to new apps. Do NOT
  depend on them. Beat/tempo come from our own Web Audio analysis.
- Dev-mode apps have a user allowlist; add testers in the Spotify dashboard.
- Scopes (MVP): `streaming user-read-email user-read-private
  user-read-playback-state user-modify-playback-state playlist-read-private`.
- Client id is read from `VITE_SPOTIFY_CLIENT_ID`.

## Audio rules
- One `AudioSource` interface (`'tab' | 'mic'`) isolates the light engine from
  the source.
- Try tab capture first on desktop; fall back to mic on ~3 s of silence.
- Mobile defaults to mic.
- Never record or upload audio.

## Performance & safety
- Target 60 fps on mid-range phones; scale particle counts dynamically.
- Cap flashes < 3 Hz in Calm mode; honor `prefers-reduced-motion`.

## Zero-cost
- Client-only, static-deployable (Vercel / GitHub Pages). No backend in MVP.
