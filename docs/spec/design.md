# Design — Club Lights MVP

## Overview

Client-only SPA. Three concerns kept strictly decoupled:

1. **Music source** (Spotify playback) — produces sound and metadata.
2. **Audio pipeline** (capture → analyser → features) — turns sound into numbers.
3. **Light engine** (scenes + auto-director + renderer) — turns numbers into pixels.

The light engine depends ONLY on the per-frame `AudioFeatures` object. It does
not know whether audio came from a tab or a mic, or whether music is Spotify at
all. This boundary is the single most important architectural rule.

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

## State (Zustand)

A small set of stores; nothing persisted except user preferences.

- `authStore`: `{ status, accessToken, refreshToken, expiresAt, profile }`.
  Tokens live in memory + `sessionStorage` mirror for reload survival only.
- `playerStore`: `{ deviceId, isReady, nowPlaying, isPlaying, volume }`.
- `audioStore`: `{ source: 'tab'|'mic'|null, status, lastFeatures }`.
- `lightsStore`: `{ on, currentScene, calmMode, palette, sensitivity }`.
- `prefsStore` (persisted to `localStorage`): `{ calmMode, source, paletteMode }`.

## Feature 1 — Spotify auth (PKCE)

- Generate `code_verifier` (random 64 chars) + `code_challenge` (S256).
- Store verifier in `sessionStorage` across the redirect.
- Authorize URL with scopes: `streaming user-read-email user-read-private
  user-read-playback-state user-modify-playback-state playlist-read-private`.
- Redirect URI: `http://127.0.0.1:5173/callback` in dev; the deployed HTTPS
  origin + `/callback` in prod. The client id comes from `VITE_SPOTIFY_CLIENT_ID`.
- Token exchange + refresh hit `https://accounts.spotify.com/api/token`
  directly from the browser (public client, no secret).
- **Do not** depend on `audio-features` / `audio-analysis` endpoints — they are
  closed to new apps. All beat/tempo info comes from our own analysis.

## Feature 2 — Player

- `useSpotifyPlayer` hook loads the Web Playback SDK script, waits for
  `onSpotifyWebPlaybackSDKReady`, creates a `Spotify.Player` with an OAuth
  callback that returns the current access token, and transfers playback to its
  device id.
- Search uses `GET /v1/search?type=track`; playlists use
  `GET /v1/me/playlists` and `GET /v1/playlists/{id}/tracks`.
- Playback control via `PUT /v1/me/player/play`, `/pause`, `POST /next`,
  `PUT /volume`.

## Feature 3 — Audio sources

```ts
interface AudioSource {
  id: 'tab' | 'mic';
  start(): Promise<MediaStream>;
  stop(): void;
}
```

- `TabAudioSource`: `getDisplayMedia({ audio: true, video: true })`; keep the
  (hidden) video track alive because some browsers stop the stream otherwise.
  **Known risk:** Spotify playback is DRM (Widevine) and captured tab audio may
  be silent — this must be tested, and the silence fallback (Req 3.3) is the
  safety net.
- `MicAudioSource`: `getUserMedia({ audio: true })`.
- A `createAudioSource(id)` factory and a `pickDefaultSource()` that returns
  `'tab'` on desktop Chromium, `'mic'` otherwise.

## Feature 4 — Analyser & beat detection

- One shared `AudioContext`; connect the chosen `MediaStream` to an
  `AnalyserNode` (`fftSize` 2048, `smoothingTimeConstant` ~0.6).
- Each frame: read frequency data, integrate three bands by bin index
  (bass ≈ 20–150 Hz, mid ≈ 150–2000 Hz, treble ≈ 2–16 kHz), normalise to 0..1.
- `energy`: smoothed overall RMS (EMA).
- **Beat:** spectral flux on the bass band = sum of positive deltas vs last
  frame; keep a moving average of flux; a beat fires when
  `flux > avg * sensitivity` AND at least ~250 ms since the last beat. Feeds a
  rolling buffer of beat timestamps for a rough `bpmEstimate`.
- `SilenceDetector`: if `energy < 0.01` for ~3 s, emit a `silent` event the UI
  listens to for the mic-fallback prompt.
- Debug visualiser component draws the three bands + beat flashes (dev only).

## Feature 5 — Light engine

- `Scene` interface: `{ name; render(ctx, f: AudioFeatures, palette, dt): void;
  reset?(): void }`. Each scene is a self-contained class drawing to a 2D canvas.
- Scenes: StrobePop, DiscoBall, LaserRain, BassBubbles, RainbowWave,
  SpotlightSweep.
- `Renderer`: owns the canvas, sizes it to devicePixelRatio, runs the rAF loop,
  pulls the latest `AudioFeatures`, asks the `AutoDirector` for the active scene,
  and calls `scene.render`. Measures frame time and lowers a `quality` factor
  (particle counts) when frames run long, to hold ~60 fps.
- `AutoDirector`: counts beats; switches scene every 8–16 beats or on an energy
  jump above a threshold ("drop"); cross-fades briefly between scenes.
- `palette`: `extractPalette(imgUrl)` samples the album cover on a small
  offscreen canvas for dominant colors; falls back to the neon palette.

## Feature 6 — Safety

- `calmMode`: scenes read a `calm` flag — StrobePop becomes a slow pulse, flash
  rate hard-capped < 3 Hz. A central `flashGate(now)` enforces the cap so no
  scene can exceed it.
- On mount, read `prefers-reduced-motion`; if set, force `calmMode = true`.
- Photosensitivity warning modal shown once (gate stored in `localStorage`)
  before the first time lights turn on.

## Feature 7 — UI / routing

- Hash-free routes via a tiny router (or `react-router-dom`): `/`, `/callback`,
  `/player`, `/floor`, `/settings`.
- Playful UI kit under `components/`: `Button`, `Sticker`, `Blob`, `Toggle`,
  `Card`. Framer Motion for springy hover/tap, idle wiggle, confetti on first
  connect.
- Dance Floor: fullscreen canvas, floating controls, scene indicator, Calm
  toggle; a `useAutoHide(3000)` hook hides chrome after inactivity.

## Error handling

- Auth errors → toast + back to landing with a retry.
- Non-Premium → explain + offer mic-only "demo" (lights react to mic even
  without Spotify playback).
- No mic/tab permission → explain how to grant, offer the other source.
- SDK load failure → retry with backoff, then a friendly error.

## Testing strategy

- Unit: PKCE helpers, band integration math, beat detector against synthetic
  flux arrays, palette extraction on a fixed image, `flashGate` cap.
- Manual: tab-capture silence fallback on Chrome/Edge; mic reactivity on a
  real phone; reduced-motion; the photosensitivity gate.
