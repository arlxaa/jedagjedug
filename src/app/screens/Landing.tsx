import { motion } from 'framer-motion'
import { Backdrop } from '../Backdrop.tsx'
import { Card } from '../../components/ui.tsx'
import { CromaHero } from '../../components/CromaHero.tsx'
import { CromaCardGrid } from '../../components/CromaCardGrid.tsx'
import { LightsIcon, PlayIcon, VolumeIcon } from '../../components/icons.tsx'
import { isConfigured } from '../../features/auth/pkce.ts'

export function Landing({ onConnect }: { onConnect: () => void }) {
  const configured = isConfigured()
  const steps = [
    { Icon: PlayIcon, title: 'Connect Spotify', body: 'Link your Premium account to play music right here.' },
    { Icon: VolumeIcon, title: 'Let us listen', body: 'We analyse the sound live — tab audio or your mic. Nothing is recorded.' },
    { Icon: LightsIcon, title: 'Lights on', body: 'The screen becomes an auto-generated club light show. Just dance.' },
  ]

  function scrollToDetails() {
    document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bg-night-deep">
      {/* CROMA full-bleed hero — Connect Spotify is the ONLY way in */}
      <div className="relative">
        <CromaHero onConnect={onConnect} onDemo={scrollToDetails} />

        {/* Scroll-down hint */}
        <button
          onClick={scrollToDetails}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
          aria-label="Scroll down for details"
        >
          <span className="eyebrow">Scroll down for details</span>
          <motion.span
            aria-hidden
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="text-xl"
          >
            ↓
          </motion.span>
        </button>
      </div>

      {!configured && (
        <p className="text-center text-sm text-yellow/90 bg-night-deep py-3 px-4">
          Spotify isn’t set up yet — add a Client ID to <code>.env</code> to enable the app.
        </p>
      )}

      {/* Details section */}
      <Backdrop>
        <section id="details" className="mx-auto max-w-5xl px-6 py-16 scroll-mt-6">
          <p className="eyebrow text-center mb-3">How it works</p>
          <h2 className="font-display text-center text-3xl md:text-4xl mb-10 text-[var(--text)] tracking-wide">
            Three steps to your dance floor
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full text-center">
                  <div className="grid place-items-center mb-3 text-cyan">
                    <s.Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-xl text-[var(--text)]">{s.title}</h3>
                  <p className="mt-2 text-[var(--text-muted)]">{s.body}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Entry gate — one more Connect prompt at the bottom */}
          <div className="mt-12 text-center">
            <button
              onClick={onConnect}
              disabled={!configured}
              className="inline-flex items-center justify-center border border-[var(--cyan)]/70 text-[var(--cyan)] px-8 py-3 text-xs uppercase tracking-[0.3em] transition-colors hover:border-[var(--cyan)] hover:bg-[var(--cyan)]/10 hover:shadow-[0_0_32px_-8px_var(--cyan)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Connect Spotify to start
            </button>
          </div>

          <footer className="mt-14 text-center text-white/45 text-sm">
            Lights are auto-generated from live audio. We never record or upload your audio.
          </footer>
        </section>
      </Backdrop>

      {/* Decorative category grid */}
      <CromaCardGrid
        items={[
          { label: 'Strobe Pop' },
          { label: 'Bass Bubbles' },
          { label: 'Laser Rain' },
        ]}
      />
    </div>
  )
}
