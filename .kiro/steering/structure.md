# Structure — Club Lights

```
club-lights/
  .kiro/
    specs/club-lights-mvp/   requirements.md, design.md, tasks.md
    steering/                product.md, tech.md, structure.md
  public/                    favicon, static assets
  index.html
  src/
    app/                     App.tsx, router, route screens
    features/
      auth/                  Spotify PKCE flow + authStore
      player/                Web Playback SDK wrapper, queue/search UI
      audio/                 AudioSource impls, analyser, beat detector
      lights/                scene classes, auto-director, renderer, palette
      settings/              settings screen + prefsStore
    components/              playful UI kit (Button, Sticker, Blob, Toggle, Card)
    lib/                     utils, color extraction, platform detection
    store/                   Zustand stores
    styles/                  index.css (Tailwind + theme tokens)
    types.ts                 shared types (AudioFeatures, AudioSource, ...)
    main.tsx
```

## Conventions
- One concern per `features/` folder; the light engine imports ONLY
  `AudioFeatures` from the audio feature, never a concrete source.
- Scenes are self-contained classes implementing the `Scene` interface.
- Stores are small and single-purpose; only `prefsStore` persists
  (`localStorage`).
- Playful UI primitives live in `components/`; screens compose them.
- English copy only. Keep user-facing strings near where they render for now
  (no i18n in MVP).
