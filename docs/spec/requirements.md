# Requirements — Club Lights MVP

## Introduction

Club Lights turns any phone, tablet, or laptop screen into a club light show.
A user connects their Spotify account (Premium) to play music in the browser,
enables "Lights", and the screen produces automatically generated,
music-reactive visuals. No manual light controls, no uploaded audio files.

The MVP is **client-only** (no backend, no database, no accounts). All audio
analysis is local and ephemeral. Shared party rooms are explicitly Phase 2.

---

## Requirement 1 — Connect Spotify (PKCE)

**User story:** As a listener, I want to connect my Spotify Premium account so
that I can play music inside the app.

### Acceptance criteria
1. WHEN the user clicks "Connect Spotify" THEN the app SHALL start the
   Authorization Code + PKCE flow (no client secret shipped).
2. WHEN redirecting back THEN the app SHALL exchange the code for tokens and
   keep them in memory / `sessionStorage` only — never persisted to disk, never
   sent to any server we control.
3. IF the account is not Premium THEN the app SHALL show a clear message that
   in-browser playback requires Premium.
4. WHEN the access token expires THEN the app SHALL refresh it silently using
   the refresh token if available.
5. The redirect URI SHALL be HTTPS or the loopback IP `http://127.0.0.1:<port>`
   (never `localhost`).

## Requirement 2 — Play music in-browser

**User story:** As a listener, I want to pick and play a track or playlist so I
have something to dance to.

### Acceptance criteria
1. WHEN connected THEN the app SHALL initialise the Spotify Web Playback SDK and
   register a browser playback device.
2. WHEN the user searches or picks a playlist/track THEN the app SHALL play it
   through that device.
3. The player SHALL expose play/pause, next, and volume, and SHALL show the
   now-playing title, artist, and cover.

## Requirement 3 — Audio capture with graceful fallback

**User story:** As a listener, I want the app to hear the music so it can react,
without me configuring anything complicated.

### Acceptance criteria
1. The app SHALL define one `AudioSource` interface so the light engine never
   depends on where audio comes from (`'tab' | 'mic'`).
2. WHEN on desktop THEN the app SHALL try tab capture first
   (`getDisplayMedia({ audio: true, video: true })`).
3. IF the analyser reads silence for ~3 seconds THEN the app SHALL show a
   friendly prompt ("Hmm, I can't hear anything. Try mic mode!") and offer a
   one-tap switch to microphone.
4. WHEN on mobile THEN the app SHALL default to microphone
   (`getUserMedia({ audio: true })`).
5. The app SHALL NEVER record or upload audio; analysis is local and ephemeral.

## Requirement 4 — Real-time audio analysis

**User story:** As the light engine, I need per-frame audio features so visuals
can react to the music.

### Acceptance criteria
1. The analyser SHALL produce, per animation frame, an `AudioFeatures` object
   with `bass`, `mid`, `treble`, `energy` (all 0..1), `beat` (boolean), and an
   optional `bpmEstimate`.
2. Beat detection SHALL use spectral flux on the bass band with an adaptive
   moving-average threshold and a minimum gap (~250 ms).
3. A debug visualiser SHALL be available (dev only) showing the live bands and
   beat markers.

## Requirement 5 — Auto-generated light show

**User story:** As a listener, I want the lights to just work and keep changing
without me programming anything.

### Acceptance criteria
1. The engine SHALL render at least these scenes: Strobe Pop, Disco Ball, Laser
   Rain, Bass Bubbles, Rainbow Wave, Spotlight Sweep.
2. An auto-director SHALL switch scenes every 8–16 beats OR on a big energy jump
   ("a drop"), with no manual configuration required.
3. The palette MAY be seeded from the current album cover's dominant colors,
   with a neon palette fallback.
4. The engine SHALL target 60 fps on mid-range phones and SHALL scale particle
   counts dynamically to hold frame rate.

## Requirement 6 — Safety and accessibility

**User story:** As a photosensitive or motion-sensitive user, I want to enjoy
the app safely.

### Acceptance criteria
1. The app SHALL show a photosensitivity warning before the first light show.
2. The app SHALL provide a "Calm mode" toggle: no hard strobe, flash rate capped
   below 3 flashes per second.
3. WHEN `prefers-reduced-motion` is set THEN the app SHALL default to Calm mode
   and reduce motion.
4. The UI SHALL pass basic a11y: sufficient contrast, visible focus states, and
   aria labels on controls.

## Requirement 7 — Playful English UI

**User story:** As a listener, I want a fun, colorful, instantly-understandable
interface in English.

### Acceptance criteria
1. All copy SHALL be in English and consistently playful.
2. The design SHALL follow the playful system (deep night purple background;
   hot pink / electric lime / cyan / sunny yellow accents; Fredoka/Baloo
   headings, Nunito body; large radius, thick outlines, soft glow).
3. The app SHALL be mobile-first and thumb-friendly.
4. In fullscreen Dance Floor mode the UI SHALL hide after 3 seconds of
   inactivity and reappear on tap.

## Requirement 8 — Zero-cost, client-only

### Acceptance criteria
1. The MVP SHALL run entirely client-side with no backend or database.
2. Only local preferences (Calm mode, audio source, palette choice) SHALL be
   stored, in `localStorage`.
3. The app SHALL be deployable as static files (e.g. Vercel / GitHub Pages),
   subject to the HTTPS redirect-URI requirement for Spotify.
