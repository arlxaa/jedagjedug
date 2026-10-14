# Tasks — Club Lights MVP

Spec order follows the kickoff doc: auth/player shell → audio+analysis →
light engine → auto-director+calm → UI polish+landing → (Phase 2 rooms).

- [x] 0. Project scaffolding
  - Vite + React + TS, Tailwind v4 playful theme, Zustand, Framer Motion,
    base config, folder structure, `.env.example`.
  - _Req: 7, 8_

- [ ] 1. Spotify auth + player shell
  - [ ] 1.1 PKCE helpers (verifier/challenge, authorize URL, token exchange,
        refresh). _Req: 1_
  - [ ] 1.2 `authStore` + `/callback` handler; sessionStorage-only tokens;
        Premium check. _Req: 1_
  - [ ] 1.3 `useSpotifyPlayer` (Web Playback SDK) + `playerStore`; register
        device, transfer playback. _Req: 2_
  - [ ] 1.4 Search + playlist browse + play/pause/next/volume + now-playing UI.
        _Req: 2_

- [ ] 2. Audio sources + analyser + beat detection
  - [x] 2.1 `AudioSource` interface, `TabAudioSource`, `MicAudioSource`,
        factory + `pickDefaultSource()`. _Req: 3_
  - [x] 2.2 `AnalyserEngine`: AudioContext, band integration → `AudioFeatures`.
        _Req: 4_
  - [x] 2.3 Beat detector (spectral flux + adaptive threshold + min gap) and
        `bpmEstimate`. _Req: 4_
  - [x] 2.4 `SilenceDetector` + mic-fallback prompt wiring. _Req: 3_
  - [ ] 2.5 Debug visualiser (dev-only). _Req: 4_

- [ ] 3. Light engine with scenes
  - [x] 3.1 `Scene` interface + `Renderer` (rAF loop, DPR sizing, dynamic
        quality). _Req: 5_
  - [x] 3.2 StrobePop + BassBubbles (prove the pipeline end-to-end). _Req: 5_
  - [ ] 3.3 DiscoBall, LaserRain, RainbowWave, SpotlightSweep. _Req: 5_
  - [x] 3.4 Palette extraction from album cover + neon fallback. _Req: 5_

- [ ] 4. Auto-director + Calm mode
  - [x] 4.1 `AutoDirector`: beat-count + energy-drop scene switching, crossfade.
        _Req: 5_
  - [x] 4.2 `flashGate` cap, Calm mode, `prefers-reduced-motion` default,
        photosensitivity warning gate. _Req: 6_

- [ ] 5. Playful UI + landing
  - [x] 5.1 UI kit (Button, Sticker, Blob, Toggle, Card) + Tailwind tokens.
        _Req: 7_
  - [x] 5.2 Landing page (hero blobs, Connect CTA, 3-step how-it-works). _Req: 7_
  - [ ] 5.3 Permissions/connect screen (source picker, photosensitivity notice).
        _Req: 6, 7_
  - [x] 5.4 Dance Floor fullscreen (floating controls, scene indicator,
        auto-hide, Calm toggle). _Req: 5, 7_
  - [ ] 5.5 Settings screen (source, Calm, palette, sensitivity). _Req: 7_

- [ ] 6. Phase 2 — shared party rooms
  - Rooms, queue, votes, realtime sync (see ERD in context doc). Not started.
  - _Req: future_

---

## Status note (this scaffolding pass)

Items marked `[x]` above are implemented in this first build pass as a working
skeleton: the audio→features→lights pipeline runs end-to-end in **mic mode**
with two scenes, the auto-director, Calm mode, and a playful landing + Dance
Floor. Spotify auth/player (task 1) is **stubbed with the real PKCE flow written
but not yet wired to a live client id** — you need to register a Spotify app and
drop its client id into `.env` to light up tasks 1.1–1.4. Everything that does
not need Spotify (mic-reactive lights) works today.
