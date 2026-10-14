import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/authStore.ts'
import { usePlayer } from '../../store/playerStore.ts'
import { transferPlayback } from './spotifyApi.ts'

// ---- Minimal Spotify Web Playback SDK typings ----
interface SpotifyPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, cb: (payload: unknown) => void): void
  setVolume(v: number): Promise<void>
  togglePlay(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  nextTrack(): Promise<void>
  previousTrack(): Promise<void>
}
interface SpotifyNS {
  Player: new (opts: {
    name: string
    getOAuthToken: (cb: (token: string) => void) => void
    volume?: number
  }) => SpotifyPlayer
}
declare global {
  interface Window {
    Spotify?: SpotifyNS
    onSpotifyWebPlaybackSDKReady?: () => void
  }
}

const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js'

// Module-level handle so UI controls can drive THIS web device directly via the
// SDK (which always targets our own device) instead of guessing a device_id.
let activePlayer: SpotifyPlayer | null = null

export const playerControls = {
  toggle: () => activePlayer?.togglePlay(),
  pause: () => activePlayer?.pause(),
  resume: () => activePlayer?.resume(),
  next: () => activePlayer?.nextTrack(),
  prev: () => activePlayer?.previousTrack(),
  setVolume: (v: number) => activePlayer?.setVolume(v),
}

/** Loads the SDK, creates a player, registers the device, transfers playback. */
export function useSpotifyPlayer() {
  const set = usePlayer((s) => s.set)
  const playerRef = useRef<SpotifyPlayer | null>(null)
  const tokens = useAuth((s) => s.tokens)

  useEffect(() => {
    if (!tokens) return
    let cancelled = false

    const init = () => {
      if (cancelled || !window.Spotify) return
      const player = new window.Spotify.Player({
        name: 'Club Lights 🪩',
        volume: 0.8,
        getOAuthToken: (cb) => {
          void useAuth.getState().getFreshToken().then((t) => t && cb(t))
        },
      })
      playerRef.current = player
      activePlayer = player

      player.addListener('ready', (payload) => {
        const { device_id } = payload as { device_id: string }
        set({ deviceId: device_id, isReady: true })
        // Make this web device the active one so SDK controls take effect.
        void transferPlayback(device_id)
      })
      player.addListener('not_ready', () => set({ isReady: false }))
      player.addListener('player_state_changed', (payload) => {
        const st = payload as {
          paused: boolean
          track_window: { current_track: { name: string; artists: { name: string }[]; album: { images: { url: string }[] }; id: string } }
        } | null
        if (!st) return
        const t = st.track_window.current_track
        set({
          isPlaying: !st.paused,
          nowPlaying: {
            title: t.name,
            artist: t.artists.map((a) => a.name).join(', '),
            coverUrl: t.album.images?.[0]?.url,
            trackId: t.id,
          },
        })
      })

      void player.connect()
    }

    if (window.Spotify) {
      init()
    } else {
      window.onSpotifyWebPlaybackSDKReady = init
      if (!document.querySelector(`script[src="${SDK_SRC}"]`)) {
        const s = document.createElement('script')
        s.src = SDK_SRC
        s.async = true
        document.body.appendChild(s)
      }
    }

    return () => {
      cancelled = true
      playerRef.current?.disconnect()
      if (activePlayer === playerRef.current) activePlayer = null
      playerRef.current = null
    }
  }, [tokens, set])

  return playerRef
}
