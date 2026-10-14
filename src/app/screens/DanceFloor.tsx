import { useEffect, useRef, useState } from 'react'
import { Renderer } from '../../features/lights/renderer.ts'
import { useAudioEngine } from '../../features/audio/useAudioEngine.ts'
import { usePrefs } from '../../store/prefsStore.ts'
import { usePlayer } from '../../store/playerStore.ts'
import { playerControls } from '../../features/player/useSpotifyPlayer.ts'
import { setShuffle } from '../../features/player/spotifyApi.ts'
import { extractPalette, NEON_PALETTE } from '../../lib/palette.ts'
import { Toggle } from '../../components/ui.tsx'
import {
  BackIcon,
  LyricsIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  ShuffleIcon,
  VolumeIcon,
} from '../../components/icons.tsx'
import { supportsTabCapture } from '../../lib/platform.ts'
import { useAutoHide } from '../useAutoHide.ts'

export function DanceFloor({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const { calmMode, source, paletteMode, sensitivity, gain, set } = usePrefs()
  const nowPlaying = usePlayer((s) => s.nowPlaying)
  const isPlaying = usePlayer((s) => s.isPlaying)
  const shuffle = usePlayer((s) => s.shuffle)
  const deviceId = usePlayer((s) => s.deviceId)
  const setPlayer = usePlayer((s) => s.set)
  const hasSpotify = usePlayer((s) => s.isReady)
  const audio = useAudioEngine(sensitivity, gain)
  const [visible, poke] = useAutoHide(3000)
  const [sceneName, setSceneName] = useState('')
  const [choosing, setChoosing] = useState(false)

  function chooseSource(id: 'tab' | 'mic', remember: boolean) {
    if (remember) set({ source: id })
    setChoosing(false)
    void audio.start(id)
  }

  // Start the renderer once the canvas exists.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const r = new Renderer(canvas, audio.getFeatures)
    r.calm = calmMode
    r.palette = NEON_PALETTE
    rendererRef.current = r
    r.start()
    const onResize = () => r.resize()
    window.addEventListener('resize', onResize)
    const id = window.setInterval(() => setSceneName(r.currentSceneName()), 400)
    return () => {
      window.removeEventListener('resize', onResize)
      window.clearInterval(id)
      r.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // On mount: if the user has a saved source, start it. Otherwise DON'T force
  // tab-capture — show a friendly chooser so they can pick Mic (recommended for
  // music playing on Spotify desktop / a speaker) without a surprise dialog.
  useEffect(() => {
    if (source) void audio.start(source)
    else setChoosing(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep calm flag in sync with the renderer.
  useEffect(() => {
    if (rendererRef.current) rendererRef.current.calm = calmMode
  }, [calmMode])

  // Seed palette from the album cover when available.
  useEffect(() => {
    const r = rendererRef.current
    if (!r) return
    if (paletteMode === 'cover' && nowPlaying?.coverUrl) {
      void extractPalette(nowPlaying.coverUrl).then((p) => (r.palette = p))
    } else {
      r.palette = NEON_PALETTE
    }
  }, [paletteMode, nowPlaying?.coverUrl])

  return (
    <div className="fixed inset-0 bg-black" onClick={() => poke()}>
      <canvas ref={canvasRef} className="light-canvas" />

      {/* First-time source chooser — no surprise tab-capture dialog */}
      {choosing && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/85 px-6">
          <div className="rounded-[8px] border border-[var(--card-line)] bg-[var(--surface)] p-7 max-w-md text-center">
            <div className="grid place-items-center mb-3 text-cyan">
              <VolumeIcon className="w-8 h-8" />
            </div>
            <p className="eyebrow mb-2">Audio source</p>
            <h2 className="font-display text-2xl text-[var(--text)]">How should I listen?</h2>
            <p className="mt-3 text-[var(--text-muted)]">
              Playing music on Spotify, a speaker or your phone? Pick Microphone — it just works.
              Tab audio only hears sound from a Chrome tab (and Spotify’s copy-protection can make
              it silent).
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => chooseSource('mic', true)}
                className="rounded-[6px] border border-lime text-lime bg-transparent font-display uppercase tracking-[0.3em] text-sm px-5 py-3 hover:bg-lime/10 cursor-pointer"
              >
                Use my microphone
              </button>
              <button
                onClick={() => chooseSource('tab', false)}
                disabled={!supportsTabCapture()}
                className={`rounded-[6px] border font-display uppercase tracking-[0.3em] text-sm px-5 py-3 ${
                  supportsTabCapture()
                    ? 'border-[var(--card-line)] text-[var(--text)] hover:border-cyan hover:text-cyan cursor-pointer'
                    : 'border-[var(--card-line)] text-[var(--text-muted)]/40 cursor-not-allowed'
                }`}
              >
                Capture a Chrome tab{supportsTabCapture() ? '' : ' (desktop only)'}
              </button>
            </div>
            <button onClick={onExit} className="mt-5 inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text)] text-xs uppercase tracking-[0.3em] cursor-pointer">
              <BackIcon className="w-3.5 h-3.5" /> Back
            </button>
          </div>
        </div>
      )}

      {/* Silence fallback prompt */}
      {audio.silent && audio.sourceId === 'tab' && (
        <div className="absolute inset-x-0 top-6 flex justify-center px-4 z-20">
          <div className="rounded-[6px] border border-pink/60 bg-[var(--surface)] text-[var(--text)] px-5 py-3 text-center max-w-md">
            Hmm, I can’t hear anything.{' '}
            <button onClick={() => void audio.switchTo('mic')} className="text-cyan underline decoration-1 underline-offset-4 cursor-pointer">
              Try mic mode
            </button>
          </div>
        </div>
      )}

      {audio.status === 'error' && (
        <div className="absolute inset-x-0 top-6 flex justify-center px-4 z-20">
          <div className="rounded-[6px] border border-pink/60 bg-[var(--surface)] text-[var(--text)] px-5 py-3 text-center max-w-md">
            Couldn’t access audio ({audio.error}).{' '}
            <button onClick={() => void audio.switchTo('mic')} className="text-cyan underline cursor-pointer">
              Use mic
            </button>
          </div>
        </div>
      )}

      {/* Floating controls (auto-hide) */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 p-5 flex items-center justify-between gap-4 transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
      >
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1 rounded-[6px] border border-white/30 bg-black/40 text-white text-xs uppercase tracking-[0.3em] px-4 py-2 cursor-pointer hover:border-cyan hover:text-cyan transition-colors"
        >
          <BackIcon className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col items-center gap-2">
          {hasSpotify && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => void playerControls.prev()}
                className="grid place-items-center rounded-[6px] border border-white/30 bg-black/40 text-white w-11 h-11 cursor-pointer hover:border-cyan hover:text-cyan transition-colors"
                aria-label="Previous track"
              >
                <PrevIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => void playerControls.toggle()}
                className="grid place-items-center rounded-[6px] border border-white/30 bg-black/40 text-white w-11 h-11 cursor-pointer hover:border-cyan hover:text-cyan transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => void playerControls.next()}
                className="grid place-items-center rounded-[6px] border border-white/30 bg-black/40 text-white w-11 h-11 cursor-pointer hover:border-cyan hover:text-cyan transition-colors"
                aria-label="Next track"
              >
                <NextIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const nextOn = !shuffle
                  setPlayer({ shuffle: nextOn })
                  if (deviceId) void setShuffle(deviceId, nextOn)
                }}
                className={`grid place-items-center rounded-[6px] border w-11 h-11 cursor-pointer transition-colors ${
                  shuffle ? 'border-lime text-lime' : 'border-white/30 bg-black/40 text-white/70 hover:border-cyan hover:text-cyan'
                }`}
                aria-label={shuffle ? 'Shuffle on' : 'Shuffle off'}
              >
                <ShuffleIcon className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="text-center font-display uppercase tracking-[0.15em] text-sm drop-shadow">
            <span className="text-cyan">{sceneName}</span>
            {nowPlaying && <span className="hidden sm:inline text-white/55 ml-3 tracking-normal normal-case">{nowPlaying.title}</span>}
          </div>
          {nowPlaying && (
            <a
              href={`https://genius.com/search?q=${encodeURIComponent(`${nowPlaying.artist} ${nowPlaying.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-white/70 hover:text-cyan text-xs uppercase tracking-[0.3em] cursor-pointer"
            >
              <LyricsIcon className="w-3.5 h-3.5" /> Lyrics
            </a>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => rendererRef.current?.skipScene()}
            className="inline-flex items-center gap-1 rounded-[6px] border border-white/30 bg-black/40 text-white text-xs uppercase tracking-[0.3em] px-4 py-2 cursor-pointer hover:border-cyan hover:text-cyan transition-colors"
            aria-label="Next scene"
          >
            <ShuffleIcon className="w-4 h-4" /> Scene
          </button>
          <Toggle on={calmMode} onChange={(v) => set({ calmMode: v })} label="Calm" />
        </div>
      </div>
    </div>
  )
}
