# Club Lights — Project Summary for Audit

> Hand this file to a reviewer (human or AI) to audit the codebase. It describes
> what the app does, the architecture, the stack, every module, known
> limitations, and the exact things we'd like checked. Written 2026-10-14.

---

## 1. What it is

**Club Lights** is a client-only web app that turns any screen into a
music-reactive club light show. The user connects Spotify (Premium), plays a
track in the browser, enables "Lights", and a fullscreen Canvas 2D light show
reacts to the music in real time. No backend, no database, no accounts.

- **Live only in dev** at `http://127.0.0.1:5173` (Vite dev server). Not yet
  deployed.
- **Entry flow (enforced):** Home (hero) → Connect Spotify (required) → Player →
  Dance Floor (fullscreen lights). Protected routes redirect to Home when not
  authenticated.

## 2. Tech stack

- **Vite + React 19 + TypeScript** (strict: `noUnusedLocals`,
  `noUnusedParameters`, `verbatimModuleSyntax`, bundler resolution).
- **Tailwind CSS v4** via `@tailwindcss/vite`, theme tokens in `@theme`.
- **Framer Motion** for motion (respects `prefers-reduced-motion`).
- **Zustand** for state (one persisted store).
- **Web Audio API** (`AnalyserNode`) for live analysis.
- **Canvas 2D** for the light engine.
- **Spotify Web API + Web Playback SDK**, Authorization Code + **PKCE** (no
  client secret).
- **oxlint** for linting. Build: `tsc -b && vite build` (currently 0 errors,
  0 lint warnings).

## 3. Architecture (the one rule that matters)

Three concerns are strictly decoupled. The light engine depends ONLY on a
per-frame `AudioFeatures` object — it never knows whether audio came from a tab,
a mic, or Spotify at all.

```
Spotify Web Playback SDK ──► browser audio out
                                   │
                 ┌──────── tab capture OR microphone ───────┐
                 ▼                                           ▼
          AudioSource (tab|mic) ─► AnalyserNode ─► FeatureExtractor
                                                         │
                                              AudioFeatures (per frame)
                                                         │
                                   ┌─────────────────────┤
                                   ▼                     ▼
                            AutoDirector  ───────►  Scene.render(ctx, features)
                                                         │
                                                   Canvas 2D (full screen)
```

Core shared types (`src/types.ts`):
- `AudioSource { id: 'tab'|'mic'; start(): Promise<MediaStream>; stop() }`
- `AudioFeatures { bass, mid, treble, energy: 0..1; beat: boolean; bpmEstimate? }`
- `Palette { bg; colors: [c,c,c,c] }`
- `Scene { name; render(ctx, f, palette, dt, w, h, calm); reset?() }`

## 4. File-by-file map (`src/`)

**Entry / shell**
- `main.tsx` — React root.
- `app/App.tsx` — tiny switch router; mounts `useSpotifyPlayer()` ONCE at root so
  playback survives screen changes; **auth guard** (redirect to Home if not
  connected); photosensitivity gate before first Dance Floor entry.
- `app/router.ts` — minimal history-API router (`/`, `/callback`, `/player`,
  `/floor`, `/settings`).
- `app/Backdrop.tsx` — shared near-black background (corner glows + grain +
  vignette).
- `app/useAutoHide.ts` — hides Dance Floor chrome after 3s inactivity.
- `app/PhotoWarning.tsx` — one-time photosensitivity modal.

**Screens** (`app/screens/`)
- `Landing.tsx` — CROMA hero + "scroll down for details" + how-it-works + card
  grid. Connect Spotify is the only entry.
- `Callback.tsx` — handles the OAuth redirect, exchanges code, fetches profile,
  navigates to Player.
- `Player.tsx` — now-playing hero (big album art with a **glow tinted by the
  cover's dominant color** via `extractPalette`), transport (prev/play/pause/
  next/shuffle), volume, search, playlists, **Spotify queue ("Up next" + "+
  Queue")**, "See lyrics" (opens Genius search in a new tab), "Lights on".
- `DanceFloor.tsx` — fullscreen canvas; audio-source chooser (mic recommended);
  silence→mic fallback prompt; floating transport + scene shuffle + Calm toggle;
  lyrics link.
- `Settings.tsx` — audio source, Calm mode, palette mode, beat sensitivity, mic
  loudness (gain), disconnect.

**Auth** (`features/auth/`)
- `pkce.ts` — PKCE verifier/challenge, authorize URL, token exchange + refresh.
  Scopes: `streaming user-read-email user-read-private user-read-playback-state
  user-modify-playback-state playlist-read-private`. Redirect URI
  `http://127.0.0.1:5173/callback` (loopback IP, not `localhost`).
- `authStore.ts` — Zustand; tokens kept in memory + **sessionStorage only**;
  silent refresh when <60s to expiry.

**Player** (`features/player/`)
- `useSpotifyPlayer.ts` — loads Web Playback SDK, creates the "Club Lights"
  device, transfers playback to it, exposes `playerControls` (toggle/pause/
  resume/next/prev/setVolume) via the SDK (targets our own device).
- `spotifyApi.ts` — Web API helpers: search, playlists, playlist tracks, play
  (transfer-then-play), shuffle, add-to-queue, read-queue, transfer, volume.

**Audio** (`features/audio/`)
- `sources.ts` — `TabAudioSource` (`getDisplayMedia`, video+audio),
  `MicAudioSource` (`getUserMedia`, stereo 48k, processing ON), factory +
  default picker.
- `analyser.ts` — one AudioContext + AnalyserNode (fftSize 2048); integrates
  bass/mid/treble bands; smoothed energy; gain multiplier; silence detector
  (~3s) for the mic-fallback.
- `beatDetector.ts` — spectral flux on bass + adaptive moving-average threshold +
  250ms min gap; rough BPM from median inter-beat interval.
- `useAudioEngine.ts` — React hook managing source+analyser lifecycle, exposes a
  stable `getFeatures()` the renderer polls per frame; `silent` flag; start/stop/
  switchTo.

**Lights** (`features/lights/`)
- `scenes.ts` — 6 scenes: Strobe Pop, Disco Ball, Laser Rain, Bass Bubbles,
  Rainbow Wave, Spotlight Sweep.
- `autoDirector.ts` — switches scene every 8–16 beats or on an energy "drop".
- `renderer.ts` — owns the canvas, rAF loop, DPR sizing, dynamic quality to hold
  ~60fps.
- `flashGate.ts` — caps flashes < ~2.5Hz in Calm mode (photosensitivity safety).

**State / lib / styles**
- `store/playerStore.ts` — device, isReady, isPlaying, shuffle, volume,
  nowPlaying.
- `store/prefsStore.ts` — **persisted** (localStorage): calmMode (defaults to
  `prefers-reduced-motion`), source, paletteMode, sensitivity, gain,
  seenPhotoWarning.
- `lib/palette.ts` — album-cover dominant-color extraction + neon fallback.
- `lib/platform.ts` — isMobile / isChromium / supportsTabCapture /
  prefersReducedMotion.
- `styles/index.css` — CROMA theme tokens, fonts (Anton display / Archivo body),
  grain, slider styling, reduced-motion handling.

**UI kit** (`components/`)
- `ui.tsx` — Button (outline; one filled `primary` per screen), Toggle, Card,
  Blob (faint glow).
- `icons.tsx` — inline SVG line icons (no emoji anywhere in the UI).
- `CromaHero.tsx`, `CromaCardGrid.tsx` — DJ-poster hero + card grid
  (CSS-only visuals, no image assets).

## 5. Design system (CROMA "DJ poster")

- Tokens: `--bg:#08070C`, `--surface:#0F0D16`, `--card-line:rgba(255,255,255,.10)`,
  `--text:#F2EEF7`, `--text-muted:#8E889C`, `--pink:#FF2E93`, `--cyan:#22E4FF`,
  `--lime:#C6FF3D`.
- Fonts: headings **Anton** (uppercase, no shadow/stroke/gradient); body
  **Archivo**; eyebrow labels uppercase, letter-spacing .3em.
- Shape: radius ≤ 8px; outline buttons, one filled primary per screen; thin
  1px borders; faint low-opacity glows only; near-black background with corner
  glows + grain + vignette. The now-playing album art carries a soft glow whose
  color is extracted from the cover's dominant color (falls back to pink).
- Accessibility: visible focus ring (cyan), `prefers-reduced-motion` respected,
  photosensitivity warning + Calm mode flash cap.

## 6. Privacy / security posture

- No backend. Spotify tokens live in memory + `sessionStorage` only — never
  persisted to disk, never sent to any server we control.
- PKCE public client, **no client secret** in the bundle.
- Audio is analysed locally and **never recorded or uploaded**.
- Only user preferences are stored (localStorage).
- The client ID is a public identifier (safe in a public client), currently
  committed in `.env` locally (gitignored).

## 7. Known limitations / deliberate decisions

- **Mic mode audio quality** is inherently lossy (room → air → mic). Capture is
  set to stereo 48k with processing ON to avoid "communication" low-quality
  mode, but it will never match a direct feed. A loudness/gain slider
  compensates for reactivity, not fidelity.
- **Tab capture + Spotify DRM:** captured tab audio can be silent (Widevine).
  Handled by a ~3s silence detector that offers a one-tap switch to mic.
- **Spotify audio-features / audio-analysis endpoints are NOT used** (closed to
  new apps). All beat/tempo detection is our own Web Audio analysis.
- **Playback requires Premium** and the device must be transferred to the
  "Club Lights" web device (done automatically on play).
- Dev-mode Spotify app ⇒ users must be on the dashboard allowlist.
- Playlists that report `tracks.total: 0` (Spotify-generated) show "Tap to open"
  instead of a misleading count.
- No automated tests yet. No deployment yet. Phase 2 (shared rooms with synced
  lights) is designed but not built.

## 8. What we'd like audited

1. **Security:** PKCE implementation (verifier entropy, S256, state handling —
   note there is currently NO `state` param / CSRF check on the OAuth callback;
   please flag if this matters for a client-only PKCE app). Token storage choice
   (sessionStorage) and refresh logic. Any token leakage paths.
2. **Correctness:** audio pipeline math (band integration, beat detector
   thresholds), the transfer-then-play race, the cross-screen player lifecycle
   (single mount at App root), the auth guard.
3. **Robustness:** error handling for denied mic/tab permissions, expired
   tokens, non-Premium accounts, SDK load failure, empty queues/playlists.
4. **Performance:** the rAF render loop + dynamic quality scaling; whether the
   analyser/renderer leak on screen changes or source switches.
5. **Accessibility:** focus visibility, contrast (AA) on near-black, aria labels
   on icon-only buttons, reduced-motion coverage, the photosensitivity flash cap
   (is < 2.5Hz actually enforced across all scenes via `flashGate`?).
6. **Code quality:** the strict-TS surface, the decoupling rule (does anything in
   `features/lights` import a concrete audio source or Spotify type? it should
   not), dead code, naming.
7. **Spotify API usage:** scope minimalism, rate-limit handling (there is none
   yet), behavior when the device is stolen by another Spotify client.

## 9. How to run (for the reviewer)

```bash
npm install
cp .env.example .env   # set VITE_SPOTIFY_CLIENT_ID (Spotify dashboard app, PKCE)
npm run dev            # http://127.0.0.1:5173
npm run build          # tsc -b && vite build
npm run lint           # oxlint
```

Spotify setup: register an app, add redirect URI `http://127.0.0.1:5173/callback`
(loopback IP, not `localhost`), add your account under Users & Access, Premium
required for in-browser playback.
