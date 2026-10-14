import { useEffect, useState } from 'react'
import { Backdrop } from '../Backdrop.tsx'
import { Button, Card } from '../../components/ui.tsx'
import {
  LightsIcon,
  LyricsIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  PrevIcon,
  ShuffleIcon,
  VolumeIcon,
  VolumeLowIcon,
} from '../../components/icons.tsx'
import { useAuth } from '../../features/auth/authStore.ts'
import { usePlayer } from '../../store/playerStore.ts'
import {
  addToQueue,
  getQueue,
  myPlaylists,
  playlistTracks,
  playTracks,
  searchTracks,
  setShuffle,
  type Playlist,
  type Track,
} from '../../features/player/spotifyApi.ts'
import { playerControls } from '../../features/player/useSpotifyPlayer.ts'
import { extractPalette } from '../../lib/palette.ts'

export function Player({ onLights }: { onLights: () => void }) {
  const profile = useAuth((s) => s.profile)
  const { deviceId, isReady, isPlaying, shuffle, nowPlaying, volume, set } = usePlayer()

  const [q, setQ] = useState('')
  const [results, setResults] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [listTracks, setListTracks] = useState<Track[]>([])
  const [queue, setQueue] = useState<Track[]>([])
  // Glow color pulled from the current cover's dominant color (fallback pink).
  const [coverGlow, setCoverGlow] = useState<string>('var(--pink)')

  async function queueTrack(t: Track) {
    if (!deviceId) return
    await addToQueue(deviceId, t.uri)
    setQueue(await getQueue())
  }

  const notPremium = profile?.product && profile.product !== 'premium'

  useEffect(() => {
    void myPlaylists().then(setPlaylists)
  }, [])

  // Derive the glow color from the album cover whenever the track changes.
  useEffect(() => {
    let cancelled = false
    if (nowPlaying?.coverUrl) {
      void extractPalette(nowPlaying.coverUrl).then((p) => {
        if (!cancelled) setCoverGlow(p.colors[0])
      })
    } else {
      setCoverGlow('var(--pink)')
    }
    return () => {
      cancelled = true
    }
  }, [nowPlaying?.coverUrl])

  async function onSearch(e: React.FormEvent) {
    e.preventDefault()
    setResults(await searchTracks(q))
  }

  async function play(uris: string[], offset = 0) {
    if (!deviceId) return
    await playTracks(deviceId, uris, offset)
  }

  // Soft glow from album color (fallback pink) at low opacity.
  // Soft glow tinted by the album cover's dominant color.
  const artGlow = { boxShadow: `0 0 60px -12px ${coverGlow}` }

  return (
    <Backdrop>
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="eyebrow mb-1">Now spinning</p>
            <h1 className="font-display text-3xl md:text-4xl text-[var(--text)]">Your music</h1>
          </div>
          <Button accent="pink" onClick={onLights} ariaLabel="Turn the lights on">
            <LightsIcon className="w-4 h-4" /> Lights on
          </Button>
        </div>

        {notPremium && (
          <Card className="mb-5 border-pink/40">
            <p className="text-pink font-semibold">In-browser playback needs Spotify Premium.</p>
            <p className="text-[var(--text-muted)] mt-1">
              You can still run the light show in mic mode — play music on any speaker and hit Lights on.
            </p>
          </Card>
        )}

        {!isReady && !notPremium && (
          <p className="text-[var(--text-muted)] mb-5">Starting the Spotify player…</p>
        )}

        {/* Now playing — hero */}
        {nowPlaying && (
          <Card className="mb-6 flex flex-col items-center text-center gap-5 py-9">
            {nowPlaying.coverUrl ? (
              <img
                src={nowPlaying.coverUrl}
                alt=""
                className="w-56 h-56 md:w-64 md:h-64 rounded-[6px] border border-[var(--card-line)] object-cover"
                style={artGlow}
              />
            ) : (
              <div
                className="w-56 h-56 md:w-64 md:h-64 rounded-[6px] border border-[var(--card-line)] grid place-items-center text-[var(--text-muted)]"
                style={artGlow}
              >
                <PlayIcon className="w-10 h-10" />
              </div>
            )}
            <div className="min-w-0 w-full px-2">
              <p className="font-display text-2xl md:text-3xl text-[var(--text)] truncate">
                {nowPlaying.title}
              </p>
              <p className="text-[var(--text-muted)] text-lg truncate mt-1">{nowPlaying.artist}</p>
            </div>

            <div className="flex items-center gap-3">
              <IconBtn onClick={() => void playerControls.prev()} label="Previous track">
                <PrevIcon className="w-5 h-5" />
              </IconBtn>
              {/* single filled primary action */}
              <Button accent="cyan" primary onClick={() => void playerControls.toggle()} ariaLabel={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <IconBtn onClick={() => void playerControls.next()} label="Next track">
                <NextIcon className="w-5 h-5" />
              </IconBtn>
              <IconBtn
                onClick={() => {
                  const nextOn = !shuffle
                  set({ shuffle: nextOn })
                  if (deviceId) void setShuffle(deviceId, nextOn)
                }}
                label={shuffle ? 'Shuffle on' : 'Shuffle off'}
                active={shuffle}
              >
                <ShuffleIcon className="w-5 h-5" />
              </IconBtn>
            </div>

            <a
              href={`https://genius.com/search?q=${encodeURIComponent(`${nowPlaying.artist} ${nowPlaying.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-cyan text-xs uppercase tracking-[0.3em] cursor-pointer"
            >
              <LyricsIcon className="w-4 h-4" /> See lyrics
            </a>
          </Card>
        )}

        {/* Volume */}
        <div className="mb-7 flex items-center gap-3 text-[var(--text-muted)]">
          <VolumeLowIcon className="w-4 h-4 shrink-0" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            aria-label="Volume"
            onChange={(e) => {
              const v = Number(e.target.value)
              set({ volume: v })
              void playerControls.setVolume(v)
            }}
            className="cl-range w-full"
          />
          <VolumeIcon className="w-4 h-4 shrink-0" />
        </div>

        {/* Search */}
        <form onSubmit={onSearch} className="flex gap-2 mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a track…"
            aria-label="Search a track"
            className="flex-1 rounded-[6px] border border-[var(--card-line)] bg-[var(--surface)] text-[var(--text)] px-4 py-3 placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
          />
          <Button accent="cyan">Search</Button>
        </form>

        {results.length > 0 && (
          <div className="mb-8 grid gap-2">
            {results.map((t, i) => (
              <TrackRow key={t.id} t={t} onPlay={() => play(results.map((r) => r.uri), i)} onQueue={() => void queueTrack(t)} />
            ))}
          </div>
        )}

        {/* Playlists */}
        <p className="eyebrow mb-2">Collection</p>
        <h2 className="font-display text-xl mb-4 text-[var(--text)]">Your playlists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {playlists.map((p) => (
            <button key={p.id} onClick={() => void playlistTracks(p.id).then(setListTracks)} className="group text-left cursor-pointer">
              <div className="relative rounded-[6px] overflow-hidden border border-[var(--card-line)]">
                {p.coverUrl ? (
                  <img src={p.coverUrl} alt="" className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full aspect-square grid place-items-center bg-[var(--surface)] text-[var(--text-muted)]">
                    <PlayIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/85 via-transparent to-transparent" />
                <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="w-12 h-12 rounded-full border border-cyan text-cyan grid place-items-center" style={{ boxShadow: '0 0 24px -8px var(--cyan)' }}>
                    <PlayIcon className="w-5 h-5" />
                  </span>
                </div>
              </div>
              <p className="font-display text-sm truncate mt-2 text-[var(--text)]">{p.name}</p>
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-[0.2em]">
                {p.trackCount > 0 ? `${p.trackCount} tracks` : 'Tap to open'}
              </p>
            </button>
          ))}
        </div>

        {listTracks.length > 0 && (
          <div className="grid gap-2 mb-8">
            {listTracks.map((t, i) => (
              <TrackRow key={`${t.id}-${i}`} t={t} onPlay={() => play(listTracks.map((r) => r.uri), i)} onQueue={() => void queueTrack(t)} />
            ))}
          </div>
        )}

        {/* Up next (Spotify queue) */}
        {queue.length > 0 && (
          <>
            <p className="eyebrow mb-2">Queue</p>
            <h2 className="font-display text-xl mb-3 text-[var(--text)]">Up next</h2>
            <div className="grid gap-2 mb-6">
              {queue.map((t, i) => (
                <div key={`q-${t.id}-${i}`} className="flex items-center gap-3 rounded-[6px] border border-[var(--card-line)] bg-[var(--surface)] p-2">
                  {t.coverUrl && <img src={t.coverUrl} alt="" className="w-10 h-10 rounded-[4px] border border-[var(--card-line)] object-cover" />}
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate text-sm">{t.title}</span>
                    <span className="block text-[var(--text-muted)] text-xs truncate">{t.artist}</span>
                  </span>
                  <span className="text-[var(--text-muted)] text-xs pr-2">#{i + 1}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </Backdrop>
  )
}

function IconBtn({
  children,
  onClick,
  label,
  active = false,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`grid place-items-center w-11 h-11 rounded-[6px] border transition-colors cursor-pointer ${
        active ? 'border-lime text-lime' : 'border-[var(--card-line)] text-[var(--text)] hover:border-cyan hover:text-cyan'
      }`}
    >
      {children}
    </button>
  )
}

function TrackRow({ t, onPlay, onQueue }: { t: Track; onPlay: () => void; onQueue: () => void }) {
  return (
    <div className="group flex items-center gap-3 rounded-[6px] border border-[var(--card-line)] bg-[var(--surface)] p-2 hover:border-cyan/40 transition-colors">
      <button onClick={onPlay} className="relative shrink-0 cursor-pointer" aria-label={`Play ${t.title}`}>
        {t.coverUrl ? (
          <img src={t.coverUrl} alt="" className="w-12 h-12 rounded-[4px] border border-[var(--card-line)] object-cover" />
        ) : (
          <span className="w-12 h-12 rounded-[4px] border border-[var(--card-line)] grid place-items-center text-[var(--text-muted)]">
            <PlayIcon className="w-4 h-4" />
          </span>
        )}
        <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg)]/55 rounded-[4px] text-cyan">
          <PlayIcon className="w-5 h-5" />
        </span>
      </button>
      <button onClick={onPlay} className="flex-1 min-w-0 text-left cursor-pointer">
        <span className="block font-semibold truncate">{t.title}</span>
        <span className="block text-[var(--text-muted)] text-sm truncate">{t.artist}</span>
      </button>
      <button
        onClick={onQueue}
        className="shrink-0 inline-flex items-center gap-1 rounded-[6px] border border-[var(--card-line)] text-cyan text-xs uppercase tracking-[0.2em] px-2.5 py-1.5 hover:bg-cyan/10 cursor-pointer"
        aria-label={`Add ${t.title} to queue`}
      >
        <PlusIcon className="w-3.5 h-3.5" /> Queue
      </button>
    </div>
  )
}
