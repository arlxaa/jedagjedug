import { Backdrop } from '../Backdrop.tsx'
import { Button, Card, Toggle } from '../../components/ui.tsx'
import { usePrefs } from '../../store/prefsStore.ts'
import { useAuth } from '../../features/auth/authStore.ts'

export function Settings({ onBack }: { onBack: () => void }) {
  const { calmMode, source, paletteMode, sensitivity, gain, set } = usePrefs()
  const logout = useAuth((s) => s.logout)
  const profile = useAuth((s) => s.profile)

  const seg = (active: boolean) =>
    `flex-1 rounded-[6px] border px-4 py-3 font-display uppercase tracking-[0.2em] text-xs cursor-pointer transition-colors ${
      active ? 'border-cyan text-cyan' : 'border-[var(--card-line)] text-[var(--text-muted)] hover:text-[var(--text)]'
    }`

  return (
    <Backdrop>
      <main className="mx-auto max-w-xl px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="eyebrow mb-1">Preferences</p>
            <h1 className="font-display text-3xl text-[var(--text)]">Settings</h1>
          </div>
          <Button accent="cyan" onClick={onBack}>Done</Button>
        </div>

        <Card className="mb-5">
          <p className="eyebrow mb-3">Audio source</p>
          <div className="flex gap-3">
            {(['tab', 'mic'] as const).map((s) => (
              <button key={s} onClick={() => set({ source: s })} className={seg(source === s)}>
                {s === 'tab' ? 'Tab audio' : 'Microphone'}
              </button>
            ))}
          </div>
          <p className="text-[var(--text-muted)] text-sm mt-3">
            Tab audio works on desktop Chrome/Edge; mic works everywhere. We’ll fall back to mic
            automatically if tab audio is silent.
          </p>
        </Card>

        <Card className="mb-5">
          <p className="eyebrow mb-3">Safety</p>
          <Toggle on={calmMode} onChange={(v) => set({ calmMode: v })} label="Calm mode" />
          <p className="text-[var(--text-muted)] text-sm mt-3">
            Calm mode caps flashing below 3 per second and softens motion. It’s on by default if
            your device requests reduced motion.
          </p>
        </Card>

        <Card className="mb-5">
          <p className="eyebrow mb-3">Colors</p>
          <div className="flex gap-3">
            {(['cover', 'neon'] as const).map((m) => (
              <button key={m} onClick={() => set({ paletteMode: m })} className={seg(paletteMode === m)}>
                {m === 'cover' ? 'Album cover' : 'Neon'}
              </button>
            ))}
          </div>
        </Card>

        <Card className="mb-5">
          <p className="eyebrow mb-3">Beat sensitivity</p>
          <input
            type="range"
            min={1}
            max={2.2}
            step={0.05}
            value={sensitivity}
            aria-label="Beat sensitivity"
            onChange={(e) => set({ sensitivity: Number(e.target.value) })}
            className="cl-range w-full"
          />
          <div className="flex justify-between text-[var(--text-muted)] text-xs uppercase tracking-[0.2em] mt-2">
            <span>More beats</span>
            <span>Fewer beats</span>
          </div>
        </Card>

        <Card className="mb-5">
          <p className="eyebrow mb-3">Mic loudness</p>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={gain}
            aria-label="Mic loudness"
            onChange={(e) => set({ gain: Number(e.target.value) })}
            className="cl-range w-full"
          />
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Boost how hard the lights react when using the mic (room audio is quieter than a
            direct feed).
          </p>
        </Card>

        {profile && (
          <Card>
            <p className="text-[var(--text-muted)]">
              Signed in as <span className="text-[var(--text)] font-semibold">{profile.display_name}</span>
              {profile.product ? ` · ${profile.product}` : ''}
            </p>
            <div className="mt-4">
              <Button accent="pink" onClick={logout}>Disconnect Spotify</Button>
            </div>
          </Card>
        )}
      </main>
    </Backdrop>
  )
}
