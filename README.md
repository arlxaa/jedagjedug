# Club Lights 🪩

Turn any phone, tablet, or laptop screen into a club light show. Connect Spotify
(Premium), hit **Lights on**, and the screen produces automatically generated,
music-reactive visuals — no manual controls, no uploaded audio.

Built with **Vite + React + TypeScript + Tailwind v4 + Framer Motion + Zustand**.
100% client-side (zero backend) for the MVP.

---

## Quick start

```bash
npm install
cp .env.example .env   # then edit .env (see below) — optional for the mic demo
npm run dev            # http://127.0.0.1:5173
```

The **mic demo** works immediately without any Spotify setup: click
“Try the mic demo”, allow the microphone, play music on any speaker, and the
lights react.

## Enabling Spotify playback (optional, for in-browser music)

1. Create an app at <https://developer.spotify.com/dashboard>.
2. Add this redirect URI **exactly** (loopback IP, not `localhost`):
   `http://127.0.0.1:5173/callback`
   For a deployed site, also add `https://your-domain/callback`.
3. Under **Users and Access**, add your own Spotify account (dev-mode allowlist).
4. Copy the **Client ID** into `.env`:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   ```
   No client secret is needed — this uses Authorization Code with **PKCE**.
5. Restart `npm run dev`. “Connect Spotify” now works. **Premium is required**
   for in-browser playback.

> Spotify’s `audio-features` / `audio-analysis` endpoints are closed to new apps
> and are **not** used. All beat/tempo detection is our own Web Audio analysis.

## How it works

```
Spotify Web Playback SDK ─► browser audio
            │
   tab capture OR microphone ─► AnalyserNode ─► AudioFeatures (bass/mid/treble/energy/beat)
                                                      │
                                        AutoDirector ─► Scene.render ─► Canvas 2D (fullscreen)
```

The light engine depends **only** on the per-frame `AudioFeatures` — it never
knows whether audio is a tab, a mic, or Spotify at all.

### Light scenes
Strobe Pop · Disco Ball · Laser Rain · Bass Bubbles · Rainbow Wave · Spotlight
Sweep. An **auto-director** switches scene every 8–16 beats or on an energy drop.
Palette is seeded from the album cover, with a neon fallback.

### Safety
- **Calm mode**: flashes capped below 3 Hz.
- `prefers-reduced-motion` → Calm mode on by default.
- Photosensitivity warning shown before the first light show.

## Scripts
- `npm run dev` — dev server (127.0.0.1:5173)
- `npm run build` — type-check + production build
- `npm run preview` — serve the build
- `npm run lint` — oxlint

## Privacy
Audio is analysed locally and never recorded or uploaded. Spotify tokens live in
memory / `sessionStorage` only — never persisted to disk, never sent to any
server we control.

## Project layout

```
src/
  app/            routes, screens, shared background
  components/     UI kit (buttons, icons, hero, card grid)
  features/
    auth/         Spotify PKCE flow + auth store
    player/       Web Playback SDK wrapper, Web API, queue/search UI
    audio/        audio sources, analyser, beat detector
    lights/       scene classes, auto-director, renderer, flash gate
  store/          Zustand stores (player, preferences)
  lib/            color extraction, platform detection
  styles/         Tailwind theme tokens + global styles
  types.ts        shared types (AudioFeatures, AudioSource, Scene, Palette)
```

## Roadmap
Phase 2: shared party rooms (join a room, queue + vote on tracks, synced lights).
Not started.
